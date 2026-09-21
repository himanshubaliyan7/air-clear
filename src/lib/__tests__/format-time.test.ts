import { describe, expect, it } from "vitest";
import {
  calendarDayInZone,
  formatAsOf,
  formatCalendarDate,
  formatRelativeAge,
} from "../format-time";

const KOLKATA = "Asia/Kolkata";
const LOS_ANGELES = "America/Los_Angeles";

describe("time formatting in the region's zone", () => {
  it("rolls a late-evening UTC instant into the next day in an ahead-of-UTC zone", () => {
    // 23:00 UTC is 04:30 the following morning in Asia/Kolkata (UTC+5:30).
    expect(calendarDayInZone("2026-09-21T23:00:00Z", KOLKATA)).toBe("2026-09-22");
    // The same instant is still the previous day in a behind-UTC zone.
    expect(calendarDayInZone("2026-09-21T23:00:00Z", LOS_ANGELES)).toBe(
      "2026-09-21",
    );
  });

  it("keeps an early-morning UTC instant on the previous day in a behind-UTC zone", () => {
    expect(calendarDayInZone("2026-09-22T02:00:00Z", LOS_ANGELES)).toBe(
      "2026-09-21",
    );
    expect(calendarDayInZone("2026-09-22T02:00:00Z", KOLKATA)).toBe("2026-09-22");
  });

  it("reports relative age in whole units", () => {
    const now = new Date("2026-09-21T12:00:00Z");
    expect(formatRelativeAge("2026-09-21T11:59:40Z", now)).toBe("just now");
    expect(formatRelativeAge("2026-09-21T11:30:00Z", now)).toBe("30 minutes ago");
    expect(formatRelativeAge("2026-09-21T11:00:00Z", now)).toBe("1 hour ago");
    expect(formatRelativeAge("2026-09-19T12:00:00Z", now)).toBe("2 days ago");
  });

  it("formats an 'as of' line with the region's clock time and the age", () => {
    const now = new Date("2026-09-22T01:00:00Z");
    const line = formatAsOf("2026-09-21T23:00:00Z", KOLKATA, now);
    expect(line).toContain("2 hours ago");
    // 23:00 UTC is 04:30 in Kolkata, so the rendered clock time is not the UTC one.
    expect(line).toMatch(/4:30|04:30/);
  });

  it("says the time is unknown rather than rendering a blank", () => {
    expect(formatAsOf(null, KOLKATA)).toBe("time unknown");
    expect(formatAsOf("not-a-date", KOLKATA)).toBe("time unknown");
    expect(formatRelativeAge(null)).toBeNull();
  });

  it("falls back safely when the browser exposes a non-BCP-47 locale", () => {
    const original = globalThis.navigator;
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { language: "en-US@posix" },
    });
    expect(formatAsOf("2026-09-21T23:00:00Z", KOLKATA)).toContain("2026");
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: original,
    });
  });
});

describe("formatCalendarDate", () => {
  it("prints the given calendar day and never shifts it, whatever the region's zone", () => {
    // Regression: it used to format "noon UTC" in the region's zone, which moved
    // 2026-09-21 to the 22nd for zones at UTC+12 or later (Auckland, Kiritimati).
    // The day is now independent of any zone, so every region prints the 21st.
    const printed = formatCalendarDate("2026-09-21");
    expect(printed).toMatch(/21/);
    expect(printed).not.toMatch(/22/);
  });

  it("returns null for missing or malformed days", () => {
    expect(formatCalendarDate(null)).toBeNull();
    expect(formatCalendarDate(undefined)).toBeNull();
    expect(formatCalendarDate("not-a-day")).toBeNull();
  });
});
