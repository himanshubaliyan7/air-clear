import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiGet,
  ApiError,
  isInsecureBaseUrl,
  REQUEST_TIMEOUT_MS,
} from "../client";

describe("isInsecureBaseUrl", () => {
  it("blocks plain http from an https page, except for loopback addresses", () => {
    expect(isInsecureBaseUrl("http://api.example.com", true)).toBe(true);
    expect(isInsecureBaseUrl("http://192.168.1.20:8000", true)).toBe(true);
    expect(isInsecureBaseUrl("http://localhost:8000", true)).toBe(false);
    expect(isInsecureBaseUrl("http://127.0.0.1:8000", true)).toBe(false);
    expect(isInsecureBaseUrl("http://[::1]:8000", true)).toBe(false);
  });

  it("allows https, and any address from an http page", () => {
    expect(isInsecureBaseUrl("https://api.example.com", true)).toBe(false);
    expect(isInsecureBaseUrl("http://api.example.com", false)).toBe(false);
  });

  it("treats an unparseable http address as insecure rather than allowing it", () => {
    expect(isInsecureBaseUrl("http://", true)).toBe(true);
  });
});

describe("request handling", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.test");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const hangingFetch = () =>
    vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );

  it("reports a stalled request as a network error instead of loading forever", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", hangingFetch());
    const pending = apiGet("/stations");
    const assertion = expect(pending).rejects.toMatchObject({
      name: "ApiError",
      kind: "network",
    });
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS + 1);
    await assertion;
  });

  it("still lets the caller cancel a request (this is not an ApiError)", async () => {
    vi.stubGlobal("fetch", hangingFetch());
    const controller = new AbortController();
    const pending = apiGet("/stations", { signal: controller.signal });
    controller.abort();
    const error = await pending.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DOMException);
    expect((error as DOMException).name).toBe("AbortError");
  });

  it("wraps an unreadable successful response in an ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError("Unexpected token <");
        },
      })),
    );
    await expect(apiGet("/stations")).rejects.toMatchObject({
      kind: "server",
      status: 200,
    });
  });

  it("maps 404 and 422 as before", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 404,
        json: async () => ({ detail: "station not found" }),
      })),
    );
    await expect(apiGet("/stations/x")).rejects.toMatchObject({
      kind: "not-found",
      message: "station not found",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 422,
        json: async () => ({
          detail: [{ loc: ["body", "email"], msg: "not a valid email" }],
        }),
      })),
    );
    const error = await apiGet("/x").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).fieldErrors).toEqual({ email: "not a valid email" });
  });
});
