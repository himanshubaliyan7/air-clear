/**
 * The single place the app talks to the network.
 *
 * - Base URL comes from VITE_API_BASE_URL (no trailing slash). Never hardcode a host.
 * - All paths live under /api/v1.
 * - No authentication.
 * - Non-2xx responses and transport failures are normalised into ApiError so that
 *   every screen can render an explicit state instead of a blank page.
 */
import type { ValidationErrorItem } from "./types";

export type ApiErrorKind =
  | "not-found" // 404
  | "validation" // 422
  | "server" // any other non-2xx
  | "network" // fetch rejected: offline, DNS, timeout, blocked cross-origin request
  | "insecure" // page is https but the configured API base URL is http
  | "not-configured"; // VITE_API_BASE_URL is missing

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  /** Field-level messages from a 422, keyed by the dotted field path. */
  readonly fieldErrors: Record<string, string>;

  constructor(
    kind: ApiErrorKind,
    message: string,
    status: number | null = null,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const API_BASE_URL_ENV_NAME = "VITE_API_BASE_URL";

export function getApiBaseUrl(): string {
  const raw = import.meta.env["VITE_API_BASE_URL"];
  return typeof raw === "string" ? raw.trim().replace(/\/+$/, "") : "";
}

/**
 * The preview and published app are served over https, so an http API base URL is
 * blocked by the browser as mixed content. Detect it up front and report it as its
 * own error kind rather than letting it surface as an opaque network failure.
 */
function assertUsableBaseUrl(baseUrl: string): void {
  if (!baseUrl) {
    throw new ApiError(
      "not-configured",
      `${API_BASE_URL_ENV_NAME} is not set.`,
    );
  }
  const pageIsSecure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  if (pageIsSecure && baseUrl.startsWith("http://")) {
    throw new ApiError(
      "insecure",
      `${API_BASE_URL_ENV_NAME} uses http:// while the app is served over https://.`,
      null,
    );
  }
}

function collectFieldErrors(body: unknown): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (Array.isArray(detail)) {
    for (const item of detail as ValidationErrorItem[]) {
      if (!item || typeof item.msg !== "string") continue;
      const loc = Array.isArray(item.loc) ? item.loc : [];
      const key = loc.filter((part) => part !== "body").join(".") || "_";
      fieldErrors[key] = item.msg;
    }
  }
  return fieldErrors;
}

function firstMessage(
  body: unknown,
  fieldErrors: Record<string, string>,
  fallback: string,
): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string" && detail) return detail;
  const first = Object.values(fieldErrors)[0];
  return first ?? fallback;
}

export type QueryValue = string | number | boolean | undefined | null;

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const baseUrl = getApiBaseUrl();
  assertUsableBaseUrl(baseUrl);
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return `${baseUrl}/api/v1${path}${qs ? `?${qs}` : ""}`;
}

/** Station ids contain a colon (e.g. "provider:1234") and must be encoded in paths. */
export function encodePathSegment(value: string): string {
  return encodeURIComponent(value);
}

export async function apiGet<T>(
  path: string,
  options: {
    query?: Record<string, QueryValue> | undefined;
    signal?: AbortSignal | undefined;
  } = {},
): Promise<T> {
  return request<T>("GET", path, options);
}

export async function request<T>(
  method: string,
  path: string,
  options: {
    query?: Record<string, QueryValue> | undefined;
    body?: unknown;
    signal?: AbortSignal | undefined;
  } = {},
): Promise<T> {
  const url = buildUrl(path, options.query);

  let response: Response;
  try {
    const init: RequestInit = {
      method,
      headers: {
        Accept: "application/json",
        ...(options.body === undefined
          ? {}
          : { "Content-Type": "application/json" }),
      },
    };
    if (options.signal) init.signal = options.signal;
    if (options.body !== undefined) init.body = JSON.stringify(options.body);
    response = await fetch(url, init);
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    // fetch rejects the same way for offline, DNS failure, timeout and a
    // cross-origin request the API did not allow. The message covers all of them.
    throw new ApiError(
      "network",
      "Could not reach the air-quality service.",
    );
  }

  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (response.status === 404) {
    throw new ApiError("not-found", firstMessage(body, {}, "Not found."), 404);
  }
  if (response.status === 422) {
    const fieldErrors = collectFieldErrors(body);
    throw new ApiError(
      "validation",
      firstMessage(body, fieldErrors, "Some of the details were not valid."),
      422,
      fieldErrors,
    );
  }
  throw new ApiError(
    "server",
    firstMessage(body, {}, "The air-quality service returned an error."),
    response.status,
  );
}
