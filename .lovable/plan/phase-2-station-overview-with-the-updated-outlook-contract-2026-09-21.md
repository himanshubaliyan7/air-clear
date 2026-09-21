# Phase 2 — station overview, with the updated outlook contract

The only change in the new contract is on the outlook (exceedance) response: it now
carries `forecast_made_at` and `is_current`. Everything else — paths, other
responses — is byte-identical to the current copy.

## 1. Adopt the new contract

- Replace `docs/openapi.json` with the newly attached file.
- Run `npm run gen:api` to regenerate the typed models. No hand-edits.

## 2. Outlook age and currentness

- Show an "as of" line for the outlook, built from `forecast_made_at` in the
  region's time zone, with its relative age — the same treatment the current
  reading already uses.
- When `is_current` is false: say plainly that there is no current outlook, and
  how old the last one was (or that none was ever made, when there is no
  timestamp). No recommendation card, no positive wording, no colour that could
  read as safe.
- When `forecast_made_at` is missing but the outlook is current: show the
  outlook without an age line rather than inventing one.
- The recommendation stays exactly as the server sends it; `no-data` and anything
  unrecognised stay neutral and never grouped with "go".

## 3. Station overview (Phase 2 as approved)

Unchanged from the approved plan: Section A current reading (state, overall,
category, driver, standard, sub-index table with no units, attribution shown
exactly as returned, stale / never-reported states) and Section B outlook
(pollutant selection in the URL, recommendation card, day table, empty and
partial states), each with its own loading and error handling, using only
`current-aqi` and `exceedance`.

## 4. Housekeeping

- Remove item 5 (forecast age/currentness on the exceedance response) from
  `BACKEND_REQUESTS.md` — now supplied.
- Extend the strings module with the new outlook age and "no current outlook"
  wording; no literals in components.

## Technical notes

- New logic lands in `src/lib/station-overview.ts` as a pure outlook-state helper
  (`current` / `stale` / `never`), mirroring `currentReadingState`, with unit
  tests covering: stale outlook never rendering a recommendation as positive, a
  missing timestamp degrading to "never made", and an unknown recommendation
  still degrading to `no-data`.
- Time formatting reuses `formatAsOf` / `formatRelativeAge` in the region's zone.
- Definition of done: type-check clean, all tests pass, every state handled,
  attribution shown, keyboard and screen-reader accessible, works at phone width.
  Stop for review; Phase 3 untouched.
