/**
 * Pollutant presentation, in one place.
 *
 * The set of pollutants always comes from the API (a region's `pollutants` list, or
 * the `pollutant_id` values in a current reading). Nothing here decides which
 * pollutants exist; it only formats whatever ids arrive.
 */

/**
 * Renders an id like "pm25" as "PM2.5" and "ozone" as "OZONE", without a fixed list:
 * letters are upper-cased and a digit run is separated with a decimal point where the
 * id uses the common compact form (pm25 -> PM2.5).
 */
export function formatPollutantId(id: string): string {
  const trimmed = id.trim();
  if (!trimmed) return id;
  const compact = /^([a-zA-Z]+)(\d{2,})$/.exec(trimmed);
  if (compact) {
    const [, letters, digits] = compact;
    return `${letters.toUpperCase()}${digits[0]}.${digits.slice(1)}`;
  }
  return trimmed.replace(/[_-]+/g, " ").toUpperCase();
}

/**
 * Units for forecast and history values.
 *
 * The API does not return a unit for concentration series, so none is asserted here.
 * See BACKEND_REQUESTS.md. Until the API supplies it, values are shown unlabelled
 * rather than labelled with a guessed unit.
 */
export const CONCENTRATION_UNIT: string | null = null;

/**
 * Current-reading pollutant values are AQI sub-indices over a rolling window, not
 * concentrations. They must never carry a concentration unit.
 */
export const SUB_INDEX_UNIT: string | null = null;

export function withUnit(value: string, unit: string | null): string {
  return unit ? `${value} ${unit}` : value;
}
