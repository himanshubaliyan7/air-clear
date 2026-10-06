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
    pipelineIntro:
      "One path, run every hour. Each step hands the next only what it has checked.",
    /** The steps of the system diagram, in the order data flows through them. */
    pipeline: [
      {
        title: "Sources",
        meta: "3 feeds",
        body: "Hourly sensor readings, the official index feed, and weather data.",
        items: ["OpenAQ · hourly readings", "CPCB · official index", "ERA5, Open-Meteo · weather"],
      },
      {
        title: "Collect",
        meta: "Airflow · every hour",
        body: "Pulled on a schedule with retries and rate limiting. Units are converted on the way in; a unit that cannot be trusted is skipped, not guessed.",
        items: [],
      },
      {
        title: "Store",
        meta: "PostgreSQL + TimescaleDB",
        body: "Raw rows are kept as they arrived. Duplicate stations are merged and impossible values are dropped when read, so every later step sees the same hour.",
        items: [],
      },
      {
        title: "Estimate",
        meta: "per region",
        body: "Each of the next days is estimated from the station's last 24 hours and the day-to-day spread in a year of that region's history: a low, an expected and a high value.",
        items: [],
      },
      {
        title: "Grade",
        meta: "official category scale",
        body: "A day gets the worst category its mean reaches with at least a 40% chance. The verdict follows from that category.",
        items: [],
      },
      {
        title: "Serve",
        meta: "FastAPI",
        body: "One API feeds this site and a daily email. The site decides nothing: every category and verdict it shows was computed on the server.",
        items: ["This site", "Daily email"],
      },
    ],
    checkTitle: "Check",
    checkMeta: "every hour and every night",
    checkBody:
      "A watchdog looks at every region each hour and raises an alert when data stops arriving or coverage drops. Every night, past estimates are scored against what was measured.",
    scheduleTitle: "One hour of the pipeline",
    scheduleIntro:
      "The jobs start at fixed minutes past every hour (UTC), each after the one it depends on.",
    scheduleLabel: "A clock face marking the minutes at which each hourly job starts.",
    hourly: [
      { minute: 10, name: "Collect readings", note: "sensor hours from OpenAQ" },
      { minute: 30, name: "Build features", note: "the last-24-hour mean per station" },
      { minute: 40, name: "Official index", note: "current AQI from the CPCB feed" },
      { minute: 45, name: "Estimate and grade", note: "five days per station" },
      { minute: 55, name: "Watchdog", note: "per region: stale data, low coverage" },
    ],
    minutePast: (minute: number) => `:${String(minute).padStart(2, "0")}`,
    slowerTitle: "Slower cycles",
    slower: [
      { when: "Every night", name: "Score past estimates against measurements" },
      { when: "Every night", name: "Switch off stations that went dark, and back on when they return" },
      { when: "Every evening", name: "Send the daily email" },
      { when: "Every week", name: "Refit each region's day-to-day spread" },
    ],
    exampleTitle: "How one verdict is made",
    exampleIntro:
      "A worked example with made-up numbers. The station's mean over the last 24 hours was 80.",
    exampleSteps: [
      {
        title: "Start from the last 24 hours",
        body: "Nothing beat this in backtests: the next days look more like the last one than like any model's guess.",
      },
      {
        title: "Widen it day by day",
        body: "A year of the region's history says how far a day's mean usually lands from the previous 24 hours. That gives a low, an expected and a high value, and the range grows with each day ahead.",
      },
      {
        title: "Grade the 40% point",
        body: "If the day's mean has at least a 40% chance of reaching a worse category, the day takes that category. In this example that happens from day four.",
      },
    ],
    exampleStart: "24 h",
    exampleDay: (n: number) => `Day ${n}`,
    exampleLimit: "limit",
    exampleKey: "Line: low to high · diamond: expected · tick: the 40% point",
    exampleLaneLabel: (low: number, expected: number, high: number) =>
      `Low ${low}, expected ${expected}, high ${high}`,
    exampleOverall: "The worst day decides the overall verdict.",
    safetyTitle: "What is never shown as safe",
    safetyIntro: "Each of these ends in a neutral answer, and none of them can read as Go.",
    safety: [
      { when: "The newest official reading is more than 6 hours old", then: "No current reading" },
      { when: "The newest sensor hour is more than 24 hours old", then: "No outlook" },
      { when: "One of the forecast days is missing", then: "No overall verdict" },
      {
        when: "A region has under 180 days of history from 3 stations",
        then: "No outlook, never another city's numbers",
      },
      { when: "A sensor reports a physically impossible value", then: "That hour counts as missing" },
      { when: "A reading's unit cannot be verified", then: "Skipped, not converted by guess" },
    ],
    notesTitle: "Found in production, and fixed",
    notesIntro: "Four problems that only real data showed.",
    notes: [
      {
        figure: "2,938,322",
        unit: "µg/m³ in one reading",
        body: "A sensor fault was stored as a measurement and became training data; one forecast reached 8,243. Readings outside a plausible range are now dropped wherever they are read.",
      },
      {
        figure: "1.88×",
        unit: "too much NO₂ for five days",
        body: "A provider's unit label was trusted and the values converted. A second, independent source exposed it. A unit is now verified per region before it is used.",
      },
      {
        figure: "64 of 68",
        unit: "stations read Not recommended",
        body: "The first rule flagged a day when a single hour was high, while the air was Moderate. Days are now graded by their mean, as the official scale defines them.",
      },
      {
        figure: "7 → 73",
        unit: "stations with a forecast",
        body: "Official data arrives about twelve hours late, and a six-hour freshness limit rejected nearly all of it. The limit now matches how the data really arrives.",
      },
    ],
    accuracyTitle: "How good is it?",
    accuracyBody:
      "Each region is backtested on held-out periods of past data: the grade the estimate gave is compared with the grade that was measured. The figures below are one row per region that has been checked.",
    accuracyLimits:
      "The estimate follows the air about a day behind, so it cannot foresee a sudden change. Several machine-learning models (gradient-boosted trees per station and pooled, with and without weather) were backtested against this simple rule. None did better, so the simpler and better-calibrated rule is the one in service.",
    accuracyLabels: {
      tomorrow: "exact grade, tomorrow",
      dayFive: "exact grade, five days ahead",
      badDays: "bad days called Go",
    },
    accuracyPeriod: (period: string) => `Checked on ${period}`,
    accuracyNone: "No region has been checked against history yet.",
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
    dayIndex: (pollutant: string, value: string) => `${pollutant} index ${value}`,
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

  instrument: {
    kicker: (total: number, standard: string) => `Region overview / ${total} stations / ${standard}`,
    headlineTail: "Air, today",
    lead: (withReading: number, total: number, above: number) =>
      `${withReading} of ${total} stations are reporting. ${above} ${above === 1 ? "is" : "are"} at or above the level where outdoor practice is not recommended.`,
    matrixTitle: (pollutant: string) =>
      `Every station · ${pollutant} · 48 hours measured, then the forecast days`,
    matrixHours: "− 48 h",
    colStation: "Station",
    colIndex: "Index",
    colNextDays: "Next days",
    stripesLabel: (hours: number) => `Measured hours, oldest first: ${hours} with a value.`,
    stripesEmpty: "No measured hours",
    noOutlookCells: "No current outlook",
    stationIndex: "Nearest stations",
    stationSearch: "Search all stations",
    dotsNote: (pollutant: string, value: string) => `Dots drawn to ${pollutant} · ≈ ${value}`,
    notAForecast: "The official reading for the air right now, not a forecast.",
    forecastTitle: (pollutant: string) => `Forecast · ${pollutant}`,
    forecastUnit: (unit: string) => `Mean of the day, ${unit}`,
    colDay: "Day",
    colMean: "Mean → could reach",
    colVerdict: "Verdict",
    limit: (value: string) => `${value} limit`,
    dayRange: (mean: string, upper: string) => `Expected ${mean}, could reach ${upper}`,
    plotNote:
      "The diamond is the expected mean of the day and the line reaches the upper bound.",
    barsTitle: (pollutant: string) =>
      `${pollutant} · every measured hour, then the mean of each forecast day`,
    barsSummary: (hours: number, days: number, unit: string) =>
      `${hours} measured hours and ${days} forecast day${days === 1 ? "" : "s"}, in ${unit}. Gaps mean no value.`,
    barsHint: "Move over the bars, or focus them and use the arrow keys",
    barsMeasured: "Measured, hourly",
    barsForecast: "Forecast, mean of the day · hatched = could reach",
    barsForecastShort: "Forecast",
    barsMeasuredShort: "Measured",
    now: "Now",
    barsHour: (when: string, value: string, category: string | null) =>
      category ? `${when} · ${value} · ${category}` : `${when} · ${value}`,
    barsHourEmpty: (when: string) => `${when} · no value`,
    barsDay: (day: string, mean: string, upper: string, verdict: string | null) =>
      `${day} · mean ${mean}, could reach ${upper}${verdict ? ` · ${verdict}` : ""}`,
    lanesNote: "Diamond = now · line = range over the last day",
    laneLabel: (pollutant: string, value: string, low: string, high: string) =>
      `${pollutant} ${value}, range ${low} to ${high}`,
    factThreshold: "Health threshold",
    thresholdAbove: "At or above",
    thresholdBelow: "Below",
    thresholdUnknown: "No verdict",
    factAccuracy: "Forecast accuracy",
    factAccuracyNone: "Not checked yet",
    factAccuracyNoneNote: "This region's forecasts have not been checked against history yet.",
    statusLive: "Live",
    statusData: (when: string) => `Data ${when}`,
    statusReporting: "Reporting",
    statusOf: (a: number, b: number) => `${a} / ${b}`,
  },

  regions: {
    switcherLabel: "Region",
    noneTitle: "No regions available",
    noneBody: "The service is not covering any region at the moment.",
    unknownTitle: "Unknown region",
    unknownBody: "This region is not covered by the service.",
    homeKicker: (count: number) => `${count} regions`,
    homeHeadline: "Choose a region",
    homeLead:
      "Each region has its own stations, its own air-quality standard and its own outlook.",
    homeReporting: (reporting: number, total: number) => `${reporting} of ${total} stations reporting`,
    homeAbove: (above: number) => `${above} at or above the health threshold`,
    homeNoData: "No stations yet",
    homeNoDataNote: "This region is set up, but no station is reporting here yet.",
    homeUnavailable: "Figures unavailable",
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
    indexNote: (pollutant: string) =>
      `The ${pollutant} index is for that pollutant alone, so it can be lower than the overall index of a current reading, which follows the worst pollutant.`,
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
