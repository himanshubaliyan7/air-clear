import { describe, expect, it } from "vitest";
import { ApiError } from "@/api/client";
import {
  MAX_STATIONS_PER_SUBSCRIPTION,
  hasErrors,
  isTokenRejected,
  readToken,
  toggle,
  validateSelection,
} from "@/lib/subscription";

describe("readToken", () => {
  it("accepts both token shapes the API emails", () => {
    expect(readToken("abcDEF-_123")).toBe("abcDEF-_123");
    expect(readToken("u1.0123abcd.MAC-_x")).toBe("u1.0123abcd.MAC-_x");
    expect(readToken("  padded  ")).toBe("padded");
  });

  it("rejects missing, oversized or malformed values without sending them", () => {
    expect(readToken(undefined)).toBeNull();
    expect(readToken(42)).toBeNull();
    expect(readToken("")).toBeNull();
    expect(readToken("a".repeat(257))).toBeNull();
    expect(readToken("has space")).toBeNull();
    expect(readToken("<script>")).toBeNull();
  });
});

describe("validateSelection", () => {
  it("requires at least one station and one pollutant", () => {
    expect(validateSelection([], [])).toEqual({ stations: "none", pollutants: "none" });
    expect(hasErrors(validateSelection(["s1"], ["pm25"]))).toBe(false);
  });

  it("enforces the API's station limit", () => {
    const tooMany = Array.from({ length: MAX_STATIONS_PER_SUBSCRIPTION + 1 }, (_, i) => `s${i}`);
    expect(validateSelection(tooMany, ["pm25"])).toEqual({ stations: "too-many" });
  });
});

describe("toggle", () => {
  it("adds and removes while keeping order", () => {
    expect(toggle(["a", "b"], "c")).toEqual(["a", "b", "c"]);
    expect(toggle(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });
});

describe("isTokenRejected", () => {
  it("is true only for the API's 400 token rejection", () => {
    expect(isTokenRejected(new ApiError("server", "invalid or expired token", 400))).toBe(true);
    expect(isTokenRejected(new ApiError("server", "boom", 500))).toBe(false);
    expect(isTokenRejected(new ApiError("network", "offline"))).toBe(false);
    expect(isTokenRejected(new Error("x"))).toBe(false);
  });
});
