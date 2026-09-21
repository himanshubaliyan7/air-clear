/**
 * Time formatting.
 *
 * All API timestamps are UTC ISO-8601. Everything is displayed in the region's IANA
 * time zone, which always comes from the API. The browser's zone is never used as a
 * fallback for a region's day boundaries.
 */
import { strings } from "@/i18n/strings";

function locale(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  const candidate = navigator.language;
  if (!candidate) return undefined;
  try {
    return Intl.getCanonicalLocales(candidate)[0];
  } catch {
    // Some environments expose POSIX-style tags such as en-US@posix, which Intl
    // rejects. Falling back to the runtime locale keeps formatting available.
    return undefined;
  }
}

export function formatDateTimeInZone(
  iso: string | null | undefined,
  timeZone: string,
): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale(), {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatTimeInZone(
  iso: string | null | undefined,
  timeZone: string,
): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale(), {
    timeZone,
    timeStyle: "short",
  }).format(date);
}

/**
 * The calendar day an instant falls on inside the region's zone, as YYYY-MM-DD.
 * A UTC instant late in the evening can belong to the next day in an ahead-of-UTC
 * zone, which is why day boundaries must never be taken from the browser.
 */
export function calendarDayInZone(
  iso: string | Date,
  timeZone: string,
): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  // en-CA gives an ISO-like YYYY-MM-DD ordering regardless of the user's locale.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * A calendar date string (YYYY-MM-DD) rendered for reading.
 *
 * The input already IS a calendar day in the region's zone (the API bucketed it), so it
 * is formatted in UTC, purely to print it. Formatting "noon UTC" in the region's zone
 * would push zones at UTC+12 or later (Auckland, Fiji, Kiritimati) onto the next day.
 */
export function formatCalendarDate(day: string | null | undefined): string | null {
  if (!day) return null;
  const date = new Date(`${day}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale(), {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeAge(
  iso: string | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const diff = now.getTime() - date.getTime();
  const past = diff >= 0;
  const abs = Math.abs(diff);

  if (abs < MINUTE) return strings.time.justNow;
  if (abs < HOUR) {
    const n = Math.floor(abs / MINUTE);
    return past ? strings.time.minutesAgo(n) : strings.time.inMinutes(n);
  }
  if (abs < DAY) {
    const n = Math.floor(abs / HOUR);
    return past ? strings.time.hoursAgo(n) : strings.time.inHours(n);
  }
  const n = Math.floor(abs / DAY);
  return past ? strings.time.daysAgo(n) : strings.time.inDays(n);
}

/** "as of 21 Sep, 23:50 (2 hours ago)" in the region's zone. */
export function formatAsOf(
  iso: string | null | undefined,
  timeZone: string,
  now: Date = new Date(),
): string {
  const time = formatDateTimeInZone(iso, timeZone);
  const age = formatRelativeAge(iso, now);
  if (!time) return strings.time.asOfUnknown;
  return strings.time.asOf(time, age ?? strings.common.notAvailableShort);
}

export function formatNumber(
  value: number | null | undefined,
  options: Intl.NumberFormatOptions = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return strings.common.notAvailableShort;
  }
  return new Intl.NumberFormat(locale(), options).format(value);
}

export function formatPercent(fraction: number | null | undefined): string {
  if (fraction === null || fraction === undefined || Number.isNaN(fraction)) {
    return strings.common.notAvailableShort;
  }
  return new Intl.NumberFormat(locale(), {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(fraction);
}
