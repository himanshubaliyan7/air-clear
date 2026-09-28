/**
 * Convenience aliases over the generated OpenAPI schema.
 *
 * Every shape here comes from `src/api/schema.gen.ts`, which is generated from
 * `docs/openapi.json`. Never hand-write a response shape: run `npm run gen:api`.
 */
import type { components } from "./schema.gen";

export type Region = components["schemas"]["RegionOut"];
export type AqiCategory = components["schemas"]["AqiCategoryOut"];
export type Station = components["schemas"]["StationOut"];
export type StationDetail = components["schemas"]["StationDetailOut"];
export type CurrentAqi = components["schemas"]["CurrentAqiOut"];
export type OverallAqi = components["schemas"]["OverallAqiOut"];
export type PollutantAqi = components["schemas"]["PollutantAqiOut"];
export type ExceedanceSummary = components["schemas"]["ExceedanceSummaryOut"];
export type ExceedanceDay = components["schemas"]["ExceedanceDayOut"];
export type ForecastSeries = components["schemas"]["ForecastSeriesOut"];
export type ForecastPoint = components["schemas"]["ForecastPointOut"];
export type History = components["schemas"]["HistoryOut"];
export type HistoryPoint = components["schemas"]["HistoryPointOut"];
export type ModelHealth = components["schemas"]["ModelHealthOut"];
export type ValidationErrorItem = components["schemas"]["ValidationError"];
export type Attribution = components["schemas"]["AttributionOut"];
export type PollutantInfo = components["schemas"]["PollutantInfoOut"];
export type Pollutant = components["schemas"]["Pollutant"];
export type SubscriptionRequest = components["schemas"]["SubscriptionIn"];
export type SubscriptionManage = components["schemas"]["ManageIn"];
export type SubscriptionRequestResult = components["schemas"]["SubscriptionRequestOut"];
export type SubscriptionStatus = components["schemas"]["SubscriptionStatusOut"];
export type SubscriptionAvailability = components["schemas"]["SubscriptionAvailabilityOut"];
