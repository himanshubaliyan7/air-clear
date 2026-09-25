/**
 * Pure helpers for the subscription pages (Phase 4). No network, no React.
 */
import { ApiError } from "@/api/client";

/**
 * Mirrors the API's own limit (SubscriptionIn.station_ids maxItems in
 * docs/openapi.json) so the form can explain it before submitting; the server
 * still enforces it and answers 422 if this ever drifts.
 */
export const MAX_STATIONS_PER_SUBSCRIPTION = 10;

/** The emailed token from a `?token=` search value, or null when absent or malformed. */
export function readToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const token = value.trim();
  // Tokens are URL-safe base64 (confirm/manage) or "u1.<hex>.<mac>" (unsubscribe),
  // at most 256 characters. Anything else cannot be valid; don't send it.
  if (token === "" || token.length > 256 || !/^[A-Za-z0-9_.-]+$/.test(token)) {
    return null;
  }
  return token;
}

export interface SelectionErrors {
  stations?: "none" | "too-many";
  pollutants?: "none";
}

export function validateSelection(
  stationIds: readonly string[],
  pollutants: readonly string[],
): SelectionErrors {
  const errors: SelectionErrors = {};
  if (stationIds.length === 0) errors.stations = "none";
  else if (stationIds.length > MAX_STATIONS_PER_SUBSCRIPTION) {
    errors.stations = "too-many";
  }
  if (pollutants.length === 0) errors.pollutants = "none";
  return errors;
}

export function hasErrors(errors: SelectionErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Add `id` if missing, remove it if present; keeps the original order. */
export function toggle(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/**
 * The API answers 400 "invalid or expired token" for a token that is unknown,
 * expired, already used or forged. The pages show one clear message for all of
 * those rather than a generic server error.
 */
export function isTokenRejected(error: unknown): boolean {
  return error instanceof ApiError && error.status === 400;
}

/**
 * Pages that read an emailed token from the URL must not leak it to other sites
 * through the Referer header (e.g. via the attribution links in the footer).
 */
export const noReferrerMeta = { name: "referrer", content: "no-referrer" } as const;
