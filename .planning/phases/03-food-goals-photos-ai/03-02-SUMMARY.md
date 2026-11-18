---
phase: 03-food-goals-photos-ai
plan: 02
subsystem: goals-and-cues
tags: [weekly-goal, streak, gap-notice, weight-goal, carb-nudge, photo-reminder, e2e]
status: complete

requires: ["03-01"]
provides:
  - "src/domain/week.js: DEFAULT_WEEKLY_GOAL, WEEKLY_GOAL_MAX, readWeeklyGoal, weeklyStreak (1 grace week), daysSinceLastWorkout, GAP_NOTICE_DAYS"
  - "src/domain/goals.js: PHOTO_EVERY_DAYS, photoStatus, weightTrend, carbNudge, healthyPace, readWeightGoal, weightGoalStatus, paceVerdict, startWeight"
  - "src/domain/dates.js: addDays"
  - "Config 'Meta de treinos' card (chips 1-6), Today 'Sequência: N semanas' line, kind 'Faz N dias' note in the hero card, small photo reminder card"
  - "Corpo cards: Meta de peso (left, neutral bar, healthy pace, real 2-week pace) and Fotos de progresso; carb nudge on the Peso card and on #/proteina"
affects: ["03-03"]

requirements-completed: [META-01, META-02, META-05, ALIM-04, CORPO-03]

actuals:
  tokens: 48000
  tasks: 3
  commits: 3
plan_head_before: 1b3a3a07cb0af2f9d61289ac1c52919dd13b94f9
plan_head_after: 7e3983202ef17c9cc7e401f038df7f546fb14461

key-files:
  created:
    - src/domain/goals.js
    - test/goals.test.js
    - tools/e2e/14-goals.mjs
  modified:
    - src/domain/week.js
    - test/week.test.js
    - src/domain/dates.js
    - src/ui/settings.js
    - src/ui/today.js
    - src/ui/body.js
    - src/ui/protein.js
    - sw.js

key-decisions:
  - "Grace rule: a single week below the goal neither adds nor resets; two in a row end the streak; the current week counts only once met; weeks before the first completed workout are never misses (the rule is written on the Config card)"
  - "No schema change: weeklyGoal, weightGoal and lastPhotosAt are settings keys; every read goes through a reader (readWeeklyGoal, readWeightGoal, photoStatus) that falls back to a safe default on junk from a backup"
  - "Weeks to goal and the healthy pace are computed in integer grams (no float drift); the pace bands follow TRAINING-SCIENCE 5.5 (0,25-0,4% of body weight per week)"
  - "Carb nudge needs 2+ weigh-ins in both 7-day windows and is silent with a weight-loss goal; shown on Corpo's Peso card and #/proteina, no calories anywhere"
  - "Today stays compact: streak sits inside the existing dashboard card, the gap note inside the hero card (no new box), and the photo reminder is one small card shown only when due and a workout exists"

duration: ~45min
completed: 2026-11-18
---

# Phase 3 Plan 2: Goals and gentle cues Summary

The weekly workout goal is now a setting (Config chips 1-6, default 3) that drives Today's week row, with a forgiving weekly streak; Today kindly says how many days passed since the last workout; Corpo gets a body-weight goal with the healthy pace and the user's own pace, the carbohydrate nudge after a 2-week stall (also on #/proteina), and a 4-week progress-photo reminder that points to the gallery album "Progride" (photos never stored in the app).

## What was built

- **Task 1 (tracer), commit 7e9b25c:** `readWeeklyGoal`, `weeklyStreak` and `daysSinceLastWorkout`/`GAP_NOTICE_DAYS` in week.js with 13 tests; Config card `weekly-goal` (selected class moved in place, saves on tap); Today week row with G dots and `N de G`, line `Sequência: N semanas` (+ ` · a semana passada foi de folga`); E2E 14-goals (default 3 dots, chip 2 -> `0 de 2`, three seeded weeks -> `Sequência: 3 semanas`). 05-short-workout and 11-launch still pass with `0 de 3`.
- **Task 2, commit c02ae1e:** `photoStatus` (5 tests); gap note in the hero card (`Faz N dias desde o último treino. Tudo bem: o plano continua de onde parou.`, plus the lighter-loads sentence from 10 days, neutral text only); Today photo reminder card (`photo-reminder`, shown when due, a workout exists and no workout is open); Corpo `Fotos de progresso` card with the four tips and `Tirei as fotos hoje` (redraws only itself, so an unsaved check-in weight stays; proven in the E2E).
- **Task 3, commit 7e39832:** `addDays`, `weightTrend`, `carbNudge`, `healthyPace`, `readWeightGoal`, `weightGoalStatus`, `paceVerdict`, `startWeight` (15 tests in goals.test.js); Corpo `Meta de peso` card (status, neutral `.bar`, healthy pace and weeks, real pace with a neutral verdict, save/remove, validation banner for 30-250 kg); `carbText` shared by the Peso card and `#/proteina`; Corpo card order check-in, Peso, Meta de peso, Cintura, Fotos de progresso (asserted in the E2E); sw.js re-stamped with goals.js (50 files, version stays 0.4.0).

## Verification (exact)

- `node --test`: tests 165, pass 165, fail 0
- `node tools/smoke.mjs`: `smoke: 15 passed, 0 failed` (14-goals, 05-short-workout, 11-launch, 10-checkin, 13-protein, 08-backup included; no flake, no rerun needed)
- `node tools/stamp-sw.mjs --check`: `sw.js em dia`
- Greps: `WEEKLY_GOAL` word in today.js = 0; `data-weekly-goal` in settings.js >= 1; `./src/domain/goals.js` in sw.js = 1; `innerHTML` files in src = 0; `kcal`/`caloria` asserted absent on the Corpo screen in 14-goals

## Deviations from Plan

**1. [Process] `daysSinceLastWorkout` and `GAP_NOTICE_DAYS` landed in the Task 1 commit**
- The whole of week.js was written once, so these two (with their tests) are in 7e9b25c instead of c02ae1e. No behavior difference.

**2. [Process] RED run not captured for `photoStatus`**
- The goals.js module and its first tests were created together in Task 2, so there was no failing run before the implementation. The Task 3 functions did go RED first (module import failed), then GREEN.

Otherwise the plan was executed as written. No auth gates. Tracer gate: `<verify>` (week unit tests + 14-goals, 05-short-workout, 11-launch) re-run end to end and passed before expanding.

## Known Stubs

None.

## Threat Flags

None. T-03-03 (tampering via backup) mitigated by `readWeeklyGoal`, `readWeightGoal`, `photoStatus` (type and range checks, safe defaults, unit-tested with strings, out-of-range numbers and junk); T-03-04 (advice integrity) mitigated by the conservative thresholds, 2+ weigh-ins per window, silence with a weight-loss goal and no calories or red anywhere.

## Pending human checks (non-blocking, phone)

- Today with the streak line, the gap sentence and the photo reminder: the "Iniciar treino" button must still be reachable without much scrolling.
- Corpo: the five cards read well on the black theme; the neutral bar under "Meta de peso" looks neutral; the decimal keyboard for "Peso-alvo".
- Config: the six chips fit on one or two rows with a thumb; "Zona de perigo" still last and above the tab bar.
- Taking the photos into a gallery album named "Progride" is a manual routine, nothing the app can verify.

## Self-Check: PASSED

Files found: src/domain/goals.js, test/goals.test.js, tools/e2e/14-goals.mjs. Commits found in HEAD ancestry: 7e9b25c, c02ae1e, 7e39832.
