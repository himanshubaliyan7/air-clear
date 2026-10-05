/**
 * Every user-facing string in the app.
 *
 * No string literals in components. Nothing here names a city, a region, a time
 * zone or an AQI category: those all come from the API at runtime.
 */
export const strings = {
  app: {
    name: "Air quality for outdoor practice",
    shortName: "Air Clear",
    tagline: "Outdoor-practice air quality for schools",
    skipToContent: "Skip to content",
    navLabel: "Main",
    navStations: "Stations",
    navAbout: "How it works",
    disclaimer:
      "A non-commercial portfolio project. It is a decision aid, not medical advice; follow official advisories.",
  },

  theme: {
    toDark: "Switch to dark theme",
    toLight: "Switch to light theme",
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

  overview: {
    eyebrow: "Live overview",
    subtitle:
      "Official readings and a multi-day outdoor-practice outlook for every monitoring station.",
    updated: (when: string) => `Data ${when}`,
    lastViewed: (name: string) => `Your last station: ${name}`,
    statReporting: "Reporting right now",
    statReportingNote: (total: number) => `of ${total} stations`,
    statAbove: "At or above the health threshold",
    statAboveNote: "stations right now, by the official index",
    statVerdictNote: (withOutlook: number, pollutant: string) =>
      `of ${withOutlook} stations with a ${pollutant} outlook`,
    nowBarTitle: "Right now, by category",
    outlookBarTitle: (pollutant: string) => `Next days, by verdict · ${pollutant}`,
    barItem: (label: string, count: number) => `${label}: ${count}`,
    lowestTitle: "Lowest index right now",
    highestTitle: "Highest index right now",
    rankEmpty: "No station has a current reading.",
    stationsTitle: "All stations",
    filterLabel: "Filter by category",
    filterAll: "All",
    sortLabel: "Sort stations",
    sort: {
      highest: "Highest index first",
      lowest: "Lowest index first",
      name: "Name",
    },
    noReading: "No reading",
    nextDays: "Next days",
    indexLabel: "Index",
  },

  about: {
    title: "How this service works",
    intro:
      "A decision aid for schools: is outdoor practice a good idea near this monitoring station, today and over the next days? It shows two separate signals and never mixes them.",
    signalsTitle: "Two signals, kept apart",
    nowTitle: "Right now",
    nowBody:
      "The official air-quality index published for the station, refreshed every hour. A reading that is more than a few hours old is shown as no current reading.",
    outlookTitle: "The next days",
    outlookBody:
      "An estimate of each day's mean concentration, graded on the official category scale. Below the health-threshold category a day reads Go, at that category Caution, and above it Not recommended.",
    noDataTitle: "No data is never a clearance",
    noDataBody:
      "When a forecast is missing, old or incomplete, the page says so in grey. Silence is never shown as Go.",
    pipelineTitle: "From sensor to verdict",
    pipeline: [
      {
        title: "Collect",
        body: "Hourly sensor readings, the official index feed and weather data are pulled on a schedule, with retries and rate limiting.",
      },
      {
        title: "Clean",
        body: "Units are converted on the way in, duplicate stations are merged, and physically impossible readings are rejected before anything is computed from them.",
      },
      {
        title: "Estimate",
        body: "Each of the next days is estimated from the station's last 24 hours and the day-to-day spread seen in a year of history: a low, an expected and a high value.",
      },
      {
        title: "Grade",
        body: "A day gets the worst category its mean reaches with at least a 40% chance. The verdict follows from that category.",
      },
      {
        title: "Check",
        body: "Every night, past estimates are scored against what was measured. A watchdog raises an alert when data stops arriving or coverage drops.",
      },
    ],
    accuracyTitle: "How good is it?",
    accuracyBody:
      "Backtested on two held-out periods of the last pollution season. The grade was exactly right on about 6 in 10 days for tomorrow and about 5 in 10 for five days ahead. Days that turned out not recommended were called Go on 2–5% of days early in the season and 7–16% late in it.",
    accuracyLimits:
      "The estimate follows the air about a day behind, so it cannot foresee a sudden change. Several machine-learning models (gradient-boosted trees per station and pooled, with and without weather) were backtested against this simple rule. None did better, so the simpler and better-calibrated rule is the one in service.",
    accuracyStats: [
      { value: "≈ 61%", label: "exact grade, tomorrow" },
      { value: "≈ 52%", label: "exact grade, five days ahead" },
      { value: "2–5%", label: "bad days called Go, early season" },
    ],
    stackTitle: "Built with",
    stack: [
      "Python",
      "Apache Airflow",
      "PostgreSQL + TimescaleDB",
      "FastAPI",
      "LightGBM (backtests)",
      "Docker Compose",
      "Caddy",
      "TypeScript",
      "React + TanStack Start",
      "Tailwind CSS",
      "Cloudflare Workers",
    ],
    sourceTitle: "Source code",
    sources: [
      {
        label: "Backend: ingestion, pipeline, API",
        url: "https://github.com/himanshubaliyan7/air-pollution-backend",
      },
      { label: "Frontend: this site", url: "https://github.com/himanshubaliyan7/air-clear" },
    ],
    operatorLink: "Nightly evaluation results",
    backHome: "Open the dashboard",
  },

  dashboard: {
    changeStation: "Change station",
    allStations: "All stations",
    scaleLabel: (label: string) => `Category scale, best to worst. Now: ${label}.`,
    scaleBest: "Best",
    scaleWorst: "Worst",
    dayMeanShort: (value: string) => `≈ ${value}`,
    dayUpTo: (value: string) => `up to ${value}`,
    nowTitle: "Right now",
    indexValue: (value: string) => `Index ${value}`,
    drivenBy: (pollutant: string) => `Driven by ${pollutant}`,
    outlookTitle: "Next days",
    dayChance: (chance: string) => `${chance} chance of exceeding`,
    dayWorstCase: (value: string) => `worst case ${value}`,
    dayExpectedMean: (value: string) => `mean of the day about ${value}`,
    dayCouldReach: (value: string) => `could reach ${value}`,
    pollutantsTitle: "Pollutants right now",
    pollutantRange: (low: string, high: string) => `Range ${low}–${high}`,
    historyTitle: (pollutant: string) => `${pollutant}: last 48 hours`,
    historySummary: (unit: string) =>
      `Measured values over the last 48 hours, in ${unit}. Gaps mean no value.`,
    historyEmpty: "No measurements in the last 48 hours.",
    nearbyTitle: "Nearby stations",
    nearbyEmpty: "No other stations are listed for this region.",
    distance: (km: string) => `${km} km`,
    noData: "No data",
    noDataNote: "Grey and hollow. Not a sign of clean air.",
    mapTitle: "Map",
    showMap: "Show the map",
    hideMap: "Hide the map",
    mapHint: "Every station, coloured by its category right now. Select a dot to open that station.",
    mapLabel: "Map of monitoring stations",
    mapMarkerLabel: (name: string, category: string) => `${name}: ${category}`,
    mapFailed: "The map could not be loaded. The nearby list shows the same stations.",
    mapCredit: "OpenStreetMap contributors",
    mapCreditUrl: "https://www.openstreetmap.org/copyright",
    legendTitle: "Category",
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
      "An outlook needs measurements from the last 24 hours, and this station has not reported enough of them.",
    noCurrentForecast: "No current outlook.",
    lastForecastWas: (when: string) => `The last one was ${when}.`,
    neverForecast: "No outlook has ever been made for this station.",
    madeAt: (when: string) => `Forecast ${when}.`,
    staleDaysNote:
      "The days below come from that older forecast run and are for information only.",
    partialDaysNote:
      "Some days are missing from this forecast run, so no overall outlook can be given. The days below are for information only.",
    overallCovers: (days: number) =>
      `Covers the next ${days} day${days === 1 ? "" : "s"}; the worst day decides.`,
    estimateNote:
      "An estimate, not a measurement. Each day is graded by the mean expected over the whole day, so single hours can be higher. A sudden change cannot be foreseen.",
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
    coverageWhy: "An outlook needs measurements from the last 24 hours.",
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

  chart: {
    roleDescription: "chart",
    keyboardHint: "Focus the chart and use the arrow keys to step through times.",
    showTable: "Show as table",
    hideTable: "Hide table",
    noValue: "no value",
    noValueShort: "—",
  },

  forecastDetail: {
    linkLabel: "Forecast detail",
    pageTitle: "Forecast detail",
    backToOverview: "Back to station overview",
    pollutantLabel: "Pollutant",
    unavailableTitle: "Forecast detail is not available",
    unavailableBody:
      "This station has no current forecast, so there is no forecast detail to show.",
    forecastTitle: "Forecast",
    forecastSummary: (n: number, unit: string) =>
      `Expected value with its likely low-to-high range for ${n} forecast times, in ${unit}.`,
    dailyForecastSummary: (n: number, unit: string) =>
      `Expected mean of each day with its likely low-to-high range for ${n} day${n === 1 ? "" : "s"}, in ${unit}.`,
    dailyNote:
      "Each point is the mean expected over one whole day. It is an estimate; single hours can be higher or lower.",
    expected: "Expected value",
    expectedDayMean: "Expected mean of the day",
    day: "Day",
    daysAhead: "Days ahead",
    range: "Likely range (low to high)",
    low: "Low",
    high: "High",
    horizon: "Hours ahead",
    time: "Time",
    noForecastPoints: "The forecast returned no times.",
    thresholdLabel: (value: string, averaging: string | null) =>
      averaging ? `Health threshold: ${value} (${averaging})` : `Health threshold: ${value}`,
    noThreshold:
      "The service has not supplied a health-threshold concentration for this pollutant, so no threshold line is drawn.",
    unitLabel: (unit: string) => `Concentration (${unit})`,
    noUnit:
      "The service has not supplied a unit for this pollutant, so values are shown without one.",
    unlabelledAxis: "Concentration",
    unitUnknown: "an unstated unit",
    timesIn: (zone: string) => `Times are shown in ${zone}.`,
    historyTitle: "Past forecasts compared with measurements",
    historySummary: (days: number, unit: string) =>
      `Measured values and what was forecast over the last ${days} days, in ${unit}. Gaps mean no value.`,
    dailyHistorySummary: (days: number, unit: string) =>
      `Hourly measured values and the mean that was forecast for each day over the last ${days} days, in ${unit}. Gaps mean no value.`,
    dailyHistoryNote:
      "The forecast is one value per day, the mean expected for that day, so its line is flat within a day while the hourly measurements move around it.",
    actual: "Measured",
    forecastValue: "Forecast",
    forecastDayMean: "Forecast mean of the day",
    lookbackLabel: "Period",
    lookbackOption: (days: number) => `Last ${days} days`,
    noHistoryPoints: "No history was returned for this period.",
    tableCaptionForecast: "Forecast values",
    tableCaptionHistory: "Measured and forecast values",
  },

  attributions: {
    label: "Data credits",
  },

  subscriptions: {
    navLink: "Daily email",
    subscribeTitle: "Get a daily outdoor-practice email",
    subscribeIntro:
      "Every evening you get tomorrow's outlook, and the two days after, for the stations you choose: go, caution, no-go, or no data. It comes every day, so a missing email never means \"go\".",
    regionLabel: "Region",
    emailLabel: "Email address",
    emailHint: "We send a confirmation link here. Nothing starts until you open it.",
    stationsLegend: "Stations",
    stationsHint: (max: number) => `Choose up to ${max}.`,
    stationsFilterLabel: "Filter stations",
    noOutlookNow: "no outlook right now",
    pollutantsLegend: "Pollutants",
    selectedCount: (n: number, max: number) => `${n} of ${max} selected`,
    errorNoStations: "Choose at least one station.",
    errorTooManyStations: (max: number) => `Choose at most ${max} stations.`,
    errorNoPollutants: "Choose at least one pollutant.",
    submit: "Send confirmation link",
    submitting: "Sending…",
    checkEmailTitle: "Check your email",
    demoTitle: "Demo: invite-only",
    privacyTitle: "What we keep",
    privacyBody:
      "Your email address and the stations and pollutants you choose, used only to send this email. Unconfirmed sign-ups are deleted after 7 days. You can unsubscribe or delete your data from any email, and after unsubscribing your details are deleted within 90 days.",

    tokenMissingTitle: "This link is incomplete",
    tokenMissingBody:
      "Open the link from your email again, or copy the whole address into the browser.",
    tokenRejectedTitle: "This link has expired or was already used",
    tokenRejectedBody:
      "Links in confirmation and manage emails stop working after 48 hours or once used. Request a new one below.",
    requestNewLink: "Request a new link",

    confirmTitle: "Confirm your daily email",
    confirmBody: "Press the button to start receiving tomorrow's outlook every evening.",
    confirmButton: "Confirm subscription",
    confirmedTitle: "You're subscribed",
    confirmedBody:
      "The first email arrives this evening. Each one has links to change your stations or unsubscribe.",

    manageTitle: "Change your daily email",
    manageBody:
      "Choose the stations and pollutants you want. This replaces your current selection and switches the email on if it was off.",
    manageSave: "Save and switch on",
    manageSaved: "Saved. Your next email uses this selection.",
    otherActionsTitle: "Stop or delete",

    unsubscribeTitle: "Stop the daily email",
    unsubscribeBody: "You will stop receiving the daily outlook for your stations.",
    unsubscribeButton: "Unsubscribe",
    unsubscribedTitle: "You're unsubscribed",
    unsubscribedBody:
      "No more daily emails. Your details are kept for 90 days in case you switch back on from a manage link, then deleted.",

    deleteButton: "Delete my data now",
    deleteConfirmPrompt:
      "This permanently deletes your email address, your selection and our record of emails sent to you. It cannot be undone.",
    deleteConfirmButton: "Yes, delete everything",
    cancel: "Cancel",
    deletedTitle: "Your data is deleted",
    deletedBody: "We no longer hold your email address. To get the email again, subscribe from the start.",
    working: "Working…",
  },

  modelHealth: {
    title: "Model health",
    operatorOnly: "Operator view. Not intended for school users.",
    intro:
      "Raw forecast-model evaluation metrics as reported by the service. These are diagnostics, not a verdict about air quality.",
    filtersLabel: "Filters",
    stationFilter: "Station",
    pollutantFilter: "Pollutant",
    horizonFilter: "Horizon",
    all: "All",
    horizonValue: (hours: number) => `${hours} h`,
    clearFilters: "Clear filters",
    showing: (shown: number, total: number) =>
      `Showing ${shown} of ${total} results`,
    noMatchTitle: "No results match these filters",
    noMatchBody: "Try a different station, pollutant or horizon.",
    emptyTitle: "No model-health results",
    emptyBody: "The service returned no evaluation results.",
    tableCaption: "Model evaluation metrics per station, pollutant and horizon",
    tableRegionLabel: "Model-health table, scrolls sideways",
    colStation: "Station",
    colPollutant: "Pollutant",
    colHorizon: "Horizon (hours)",
    colPrecision: "Precision",
    colRecall: "Recall",
    colF1: "F1",
    colMae: "MAE",
    colRmse: "RMSE",
    colWindowEnd: "Evaluation window end",
    utcLabel: (text: string) => `${text} (UTC)`,
    notAvailable: "n/a",
  },
} as const;
