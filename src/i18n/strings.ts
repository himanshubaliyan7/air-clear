/**
 * Every user-facing string in the app.
 *
 * No string literals in components. Nothing here names a city, a region, a time
 * zone or an AQI category: those all come from the API at runtime.
 */
export const strings = {
  app: {
    name: "Air quality for outdoor practice",
    skipToContent: "Skip to content",
  },

  common: {
    retry: "Try again",
    loading: "Loading…",
    notAvailableShort: "n/a",
    search: "Search",
  },

  states: {
    loadingLabel: "Loading",
    emptyTitle: "Nothing to show",
    emptyBody: "There is no data here yet.",
    errorTitle: "Something went wrong",
    notFoundTitle: "Not found",
    notFoundBody:
      "We could not find what you were looking for. It may have been removed.",
    validationTitle: "Some details were not valid",
    networkTitle: "Cannot reach the air-quality service",
    networkBody:
      "The service did not respond. This can be a connection problem, the service being unavailable, or the service not allowing requests from this site.",
    insecureTitle: "The air-quality service address is not secure",
    insecureBody:
      "This site is served over a secure connection, so it can only load data from a secure (https) address. The configured address uses an insecure one, and the browser blocks it.",
    notConfiguredTitle: "The air-quality service address is not set",
    notConfiguredBody:
      "No service address has been configured yet, so there is no data to load.",
    serverTitle: "The air-quality service returned an error",
    serverBody: "Please try again in a moment.",
  },

  regions: {
    switcherLabel: "Region",
    noneTitle: "No regions available",
    noneBody: "The service is not covering any region at the moment.",
    unknownTitle: "Unknown region",
    unknownBody: "This region is not covered by the service.",
  },

  time: {
    /** Relative age, e.g. "as of 14:05 (2 hours ago)". */
    asOf: (time: string, age: string) => `as of ${time} (${age})`,
    asOfUnknown: "time unknown",
    justNow: "just now",
    minutesAgo: (n: number) => `${n} minute${n === 1 ? "" : "s"} ago`,
    hoursAgo: (n: number) => `${n} hour${n === 1 ? "" : "s"} ago`,
    daysAgo: (n: number) => `${n} day${n === 1 ? "" : "s"} ago`,
    inMinutes: (n: number) => `in ${n} minute${n === 1 ? "" : "s"}`,
    inHours: (n: number) => `in ${n} hour${n === 1 ? "" : "s"}`,
    inDays: (n: number) => `in ${n} day${n === 1 ? "" : "s"}`,
  },

  current: {
    sectionTitle: "Air quality right now",
    attributionLabel: "Data source",
    standardLabel: "Standard",
    overallUnavailable:
      "An overall value is not available right now; the individual pollutants are shown below.",
    noCurrentReading: "No current reading.",
    lastReadingWas: (when: string) => `The last one was ${when}.`,
    neverReported: "This station has never published a reading.",
    notRecommended: "Outdoor practice is not recommended right now.",
    belowThreshold:
      "Current conditions are below the level where outdoor practice is not recommended. This describes the air right now and is not a forecast.",
    noVerdict: "No recommendation is available for current conditions.",
    subIndexLabel: "Air quality index (sub-index)",
    subIndexNote:
      "These are index values over roughly the last day, not concentrations.",
    spreadLabel: "Range over the window",
    driverLabel: "Driven by",
    overallLabel: "Air quality index",
    pollutantLabel: "Pollutant",
    averageLabel: "Average sub-index",
    categoryLabel: "Category",
  },

  outlook: {
    sectionTitle: "Outlook",
    noneForStation: "No outlook is available for this station.",
    noneForStationWhy:
      "An outlook needs hourly history that most stations do not have. This is normal.",
    noCurrentForecast: "No current outlook.",
    lastForecastWas: (when: string) => `The last one was ${when}.`,
    neverForecast: "No outlook has ever been made for this station.",
    madeAt: (when: string) => `Forecast ${when}.`,
    staleDaysNote:
      "The days below come from that older forecast run and are for information only.",
    partialDaysNote:
      "Some days are missing from this forecast run, so no overall outlook can be given. The days below are for information only.",
    dayDate: "Day",
    dayCategory: "Category",
    dayProbability: "Chance of exceeding",
    dayWorstCase: "Worst case (upper bound)",
    pollutantLabel: "Outlook pollutant",
    noPollutants:
      "No outlook pollutant is configured for this region, so an outlook cannot be loaded.",
  },

  recommendation: {
    go: {
      label: "Go",
      description: "Outdoor practice is expected to be fine.",
    },
    caution: {
      label: "Caution",
      description: "Consider shortening or easing outdoor practice.",
    },
    noGo: {
      label: "Not recommended",
      description: "Outdoor practice is not recommended.",
    },
    noData: {
      label: "No outlook available",
      description:
        "There is no usable forecast for this station. This is not a clearance to go outside; check the current reading instead.",
    },
  },

  stations: {
    listTitle: "Stations",
    searchLabel: "Search stations by name",
    searchPlaceholder: "Station name",
    searchHint: "The station's city is matched too.",
    clearSearch: "Clear search",
    coverage: (withReading: number, total: number, withForecast: number) =>
      `${withReading} of ${total} stations have a current reading; ${withForecast} have an outlook.`,
    coverageWhy:
      "An outlook needs hourly history that most stations do not have.",
    /** Availability markers. Written out in both directions, never colour-only. */
    hasCurrentReading: "Current reading available",
    noCurrentReading: "No current reading",
    hasOutlook: "Outlook available",
    noOutlook: "No outlook",
    availabilityLabel: "Data availability",
    resultCount: (shown: number, total: number) =>
      `Showing ${shown} of ${total} stations.`,
    noneTitle: "No stations",
    noneBody: "No stations are listed for this region.",
    noMatchTitle: "No stations match",
    noMatchBody: "No station in this region matches that search.",
    unknownTitle: "Unknown station",
    unknownBody: "This station is not listed for this region.",
    backToList: "Back to all stations",
    detailComing:
      "The current reading and outlook for this station are not shown yet.",
  },

  modelHealth: {
    title: "Model health",
    operatorOnly: "Operator view. Not intended for school users.",
  },
} as const;
