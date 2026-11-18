---
phase: 02-backup-history-check-in
plan: 02
subsystem: history-and-charts
tags: [history, svg-chart, records, exercise-history]
status: complete

requires: ["02-01"]
provides:
  - "src/domain/progress.js: pure workoutRows, exerciseLog, chartPoints"
  - "src/ui/chart.js: own SVG line chart (pure chartGeometry + lineChart via createElementNS), reusable for the body-weight chart in 02-03"
  - "#/historico (saved workouts + 15 exercises with last result) and #/historico/<id> (per-exercise rows + chart)"
  - "Today 'Histórico' button (row.nav, 02-03 adds 'Corpo'), 'Ver histórico e gráfico' on the exercise screen"
  - "Summary of an older workout: records only against earlier workouts, 'Voltar ao histórico'"
affects: ["02-03"]

actuals:
  tokens: 36000
  tasks: 2
  commits: 2
plan_head_before: 2e69a6e6bdc261a020992998b095aef3a1ad6b1c
plan_head_after: 365b2519270991136a6e9bdff95726eb6d903c76

tech-stack:
  added: []
  patterns:
    - "Chart colors come from CSS classes (.chart-line, .chart-dot, .chart-raw, .chart-grid, .chart-axis) that use the theme variables; the module sets no colors"
    - "SVG built with createElementNS and textContent only; no markup strings (src-wide innerHTML guard stays 0)"
    - "Route parameter validated with decodeURIComponent in try/catch plus Object.hasOwn(EXERCISES, id)"
    - "E2E: after a draft write, wait for the re-rendered text instead of reading it immediately"

key-files:
  created:
    - src/domain/progress.js
    - src/ui/chart.js
    - src/ui/history.js
    - test/progress.test.js
    - test/chart.test.js
    - tools/e2e/09-history.mjs
  modified:
    - src/app.js
    - src/ui/today.js
    - src/ui/summary.js
    - src/ui/exercise.js
    - styles.css
    - sw.js
    - tools/e2e/05-calibration.mjs
    - tools/e2e/06-unit-placa.mjs

key-decisions:
  - "Chart plots the best set (heaviest, most reps on a tie) of each workout; metric is time for the plank, reps when every load is 0, otherwise load in the unit of the most recent workout (kg and placa never share a line)"
  - "Older workouts compute records against workouts that started before them; 'isLatest' decides between 'Próximo treino / Voltar ao início' and 'Voltar ao histórico'"
  - "Version stays 0.2.1 (02-03 bumps to 0.3.0); sw.js re-stamped with 38 files"

requirements-completed: [EVOL-01, EVOL-02, EVOL-04]

duration: ~45min
completed: 2026-11-18
---

# Phase 2 Plan 2: Workout history, per-exercise history and SVG chart Summary

Today -> "Histórico" lists every saved workout (tap -> its own summary with the records it really set), lists the 15 exercises with their last result, and opens each exercise's full history with kg/placa labels plus an offline, library-free SVG chart of the best set of each workout.

## What was built

- **Task 1 (tracer, 3752e42):** `workoutRows` (pure, tested), `#/historico` workout list, Today "Histórico" button, summary fix (`detectPRs` fed only workouts with `startedAt < session.startedAt`; older workouts show "‹ Voltar ao histórico" and no "Próximo treino"). E2E 09-history part 1 seeds four workouts and checks order, "Treino curto: Treino A", "1 série", warm-up not counted, "(incompleto)", and that the older workout's record (25 kg × 12) survives a later 30 kg workout.
- **Task 2 (365b251):** `exerciseLog` / `chartPoints`, own `chart.js` (`chartGeometry` unit-tested, `lineChart` DOM builder), `#/historico/<id>` with chart + rows, exercise list in the history, "Ver histórico e gráfico" on the exercise screen, chart CSS using theme variables, sw.js re-stamped. E2E part 2: 4 leg-press rows, one `svg.chart` with 4 `circle.chart-dot` and one `path.chart-line` starting with `M`, plank in seconds ("Tempo"), placa row "placa 5 × 10", empty exercise without svg, link from the exercise screen, unknown id.

## Verification (final run)

- `node --test`: tests 110, pass 110, fail 0
- `node tools/smoke.mjs`: PASS 01-core-loop, 02-library, 03-logging, 04-summary-pr, 05-calibration, 05-short-workout, 06-unit-placa, 07-setup-note, 08-backup, 09-history; `smoke: 10 passed, 0 failed`
- `node tools/stamp-sw.mjs --check`: `sw.js em dia`, exit 0
- Guards: `innerHTML` files in src = 0; chartGeometry 1; createElementNS 2; `#/historico/` in exercise.js 1; setsText export 1; chart-line in styles.css 1; sw.js lists chart.js, history.js and progress.js.

## Deviations from Plan

**1. [Rule 3 - Test infrastructure] Flaky E2E `06-unit-placa` ("faixa em placa") fixed in the test, not the product**
- **Found during:** Task 2 (it failed 1 of 4 repeated runs, matching the flake 02-01 reported).
- **Cause:** the test waits until the draft in IndexedDB says `calibrating === false`, then reads `document.body.innerText` immediately. The draft is saved before the screen re-renders, so the text "Sua carga de trabalho: placa 4." is sometimes not on screen yet. It is a race in the test; the product behaves correctly.
- **Fix:** `waitFor` the text before asserting. Same latent pattern hardened in `05-calibration.mjs` ("carga de trabalho"). After the fix: 8 of 8 repeated runs of both scenarios passed, and the full smoke passed.
- **Files:** tools/e2e/06-unit-placa.mjs, tools/e2e/05-calibration.mjs. **Commit:** 365b251.

**2. [Minor] Extra unit test file** `test/chart.test.js` for `chartGeometry` (the plan listed only test/progress.test.js); the pure geometry cases live next to the chart module they test.

## Known Stubs

None.

## Threat Flags

None beyond the plan's threat model (T-02-05 route parameter validated; T-02-06 text nodes / numeric SVG attributes only, innerHTML guard = 0).

## Pending human checks (phone only, non-blocking)

After 0.3.0 is published (end of 02-03), on the Android phone with a few real or test workouts: Hoje -> Histórico -> open a workout, go back, open an exercise with 2+ sessions; also from a workout screen open an exercise and tap "Ver histórico e gráfico". Repeat in airplane mode. Expected: dates, loads (kg or placa) and reps are right; the chart is readable on the black background and fits the screen width; everything opens offline.

## Self-Check: PASSED

- Files exist: src/domain/progress.js, src/ui/chart.js, src/ui/history.js, test/progress.test.js, test/chart.test.js, tools/e2e/09-history.mjs
- Commits exist: 3752e42, 365b251
