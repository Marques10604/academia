---
phase: 01-today-s-workout-core-value
plan: 04
subsystem: exercise-library-progression
tags: [exercise-library, youtube-search, double-progression, calibration, layoff, today-prescription]
status: complete

requires: ["01-01", "01-03"]
provides:
  - "15-exercise pt-BR library (muscles, machine setup, steps, common mistakes) and youtubeUrl() search link"
  - "Exercise screen #/exercicio/<id>, offline, linked from every Today row"
  - "Pure progression engine: phases, increase/boost, failure drop, stall, 10/28-day return, time exercises"
  - "Today prescription per exercise: sets x reps, rest, phase badge, expected effort, suggested load, one-line reason"
affects: [01-05, 01-06]

actuals:
  tokens: 21000
  tasks: 2
  commits: 2
plan_head_before: 2071c4c7c7ed78749a33b4c25095bb6452efc8fc
plan_head_after: 5d18a809a93956d586a13d451d0c90f4ea14e2fb

tech-stack:
  added: []
  patterns:
    - "Progression is a pure function (today passed in, never Date.now); the UI layer reads the clock"
    - "UI texts for reasons live in src/ui/reasons.js; domain returns codes + params only"

key-files:
  created:
    - src/ui/exercise.js
    - src/ui/reasons.js
    - src/domain/progression.js
    - test/catalog.test.js
    - test/progression.test.js
    - tools/e2e/02-library.mjs
  modified:
    - src/data/exercises.js
    - src/domain/plan.js
    - src/ui/today.js
    - src/app.js
    - sw.js

key-decisions:
  - "YouTube button opens a search URL (encodeURIComponent of youtubeQuery), never a video id, so it cannot go dead"
  - "Calibration and adaptation phases plan min(2, sets) sets; base plans the full set count"
  - "Layoff and stall deloads never return the same load: if the rounded value is not lower, subtract one increment"

requirements-completed: [PROG-01, PROG-03, PROG-04, PROG-05, CARGA-02, CARGA-03, CARGA-04, CARGA-05]

coverage:
  - id: D1
    description: "All 15 program exercises have pt-BR muscles, setup, 3-5 steps, 2+ mistakes; names and A/B order match PROG-01"
    requirement: PROG-03
    verification:
      - kind: unit
        ref: "node --test test/catalog.test.js (5 cases)"
        status: pass
  - id: D2
    description: "Exercise screen from Today with steps, mistakes, muscles, setup and a YouTube search link (target _blank, rel noopener)"
    requirement: PROG-04
    verification:
      - kind: e2e
        ref: "node tools/smoke.mjs library (part 1)"
        status: pass
  - id: D3
    description: "Today shows sets x reps, rest, phase and effort per exercise"
    requirement: PROG-05
    verification:
      - kind: e2e
        ref: "node tools/smoke.mjs library (Adaptação / Calibração badges from seeded history)"
        status: pass
  - id: D4
    description: "Double progression increase and one-line reason ('suba para 65 kg')"
    requirement: CARGA-02
    verification:
      - kind: unit
        ref: "node --test test/progression.test.js (increase, boost, big-jump cases)"
        status: pass
      - kind: e2e
        ref: "node tools/smoke.mjs library (reason contains 'suba para 65 kg')"
        status: pass
  - id: D5
    description: "Failure drop (2 sessions below repMin), stall (3 sessions), layoff 90% at 10+ days and 80% at 28+ days"
    requirement: CARGA-04
    verification:
      - kind: unit
        ref: "node --test test/progression.test.js (dropFail, stall, layoff cases)"
        status: pass
---

# Phase 1 Plan 04: Exercise library and progression engine Summary

**15 exercises in pt-BR with an offline detail screen and YouTube search button, plus a pure double-progression engine whose suggested load and one-line reason now fill the Today screen.**

## Accomplishments

- `src/data/exercises.js`: every exercise gained `muscles {primary, secondary}`, `setup`, `steps` (3-5) and `mistakes` (2-3) in plain pt-BR for a beginner; `youtubeUrl(ex)` builds the search link.
- `#/exercicio/<id>` shows muscles, machine adjustment, numbered steps, common mistakes, the prescription per template, the YouTube button (with an internet note) and a back button. Unknown ids show "Exercício não encontrado".
- `src/domain/progression.js` (`RULES` frozen with a why-comment per constant, `roundToStep`, `roundDownToStep`, `phaseFor`, `suggestNext`) implements the rules in the order calibration, time, layoff, increase/boost, failure drop, stall, hold.
- `planExercise` keeps its frozen return shape; sets are `min(2, sets)` until the base phase.
- Today per exercise: name link, phase badge, `sets × reps · descanso M:SS`, suggested load (kg, "cada halter" for dumbbells, hidden for plank), effort text (no-failure variant for leg press, goblet squat, shoulder press, stiff), and the reason line.

## Verification

```
$ node --test
ℹ tests 38 / pass 38 / fail 0     (catalog 5, progression 21, previous suites 12)
$ node tools/smoke.mjs
PASS 01-core-loop
PASS 02-library
smoke: 2 passed, 0 failed
$ node tools/stamp-sw.mjs --check -> sw.js em dia (25 files)
```

Acceptance greps: `results?search_query=` in exercises.js = 1, `mistakes` = 17, `exercicio` in app.js = 1, `noopener` in exercise.js = 1, `suggestNext` in plan.js = 2, `LONG_LAYOFF_DAYS` in progression.js = 2, `Date.now` in progression.js = 0, `data-role` in today.js = 5.

## Deviations from Plan

**1. [Rule 1 - Bug] Layoff could return the same load** - with small loads (for example 2 kg dumbbells, increment 2) `roundToStep(0.9 * L, inc)` rounds back to L, so "retome com 90%" would suggest no reduction. Fixed: when the rounded value is not below L, subtract one increment (same guard the plan already prescribes for stall). Covered by a test.

**2. [Process] reasons.js created in Task 1 with only `restText`** - the exercise screen needs the rest formatting, and reasons.js was a Task 2 file; Task 1 created it minimal and Task 2 completed it. 02-library part 2 was added in Task 2 so Task 1 stayed green.

**3. [Process] Plan said 'RED first'** - tests were written before the module existed (the import failed), but the red run was not captured as a separate commit.

Otherwise the plan was executed as written. sw.js was re-stamped (version stays 0.1.0; the bump is 01-06's job).

## Pending Human Checks

- On the phone: open an exercise screen from Today, tap "Ver vídeo no YouTube" (needs signal) and confirm the Portuguese search opens; read a few exercise texts for tone/accuracy. Consolidated with the 01-06 phone check.
- Tunable numbers (`RULES`) are practitioner defaults (TRAINING-SCIENCE confidence L-M); adjust after the first weeks of real training.

## Known Stubs

None.

## Threat Flags

None. T-01-07 mitigated (fixed host, `encodeURIComponent`, `target=_blank` + `rel=noopener`), T-01-08 mitigated (id looked up with `Object.hasOwn` in EXERCISES only, text via text nodes), T-01-SC mitigated (no installs).

## Self-Check: PASSED

All created files exist; commits c8b2b75 and 5d18a80 are ancestors of HEAD.
