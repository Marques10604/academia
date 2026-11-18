---
phase: 01-today-s-workout-core-value
plan: 01
subsystem: core-loop
tags: [vanilla-es-modules, indexeddb, hash-router, cdp-e2e, write-through-draft]
status: complete

requires: []
provides:
  - "Today screen (next template from rotation) with Iniciar / Continuar treino"
  - "Workout screen: current exercise card, write-through set logging, Anterior/Proximo"
  - "Raw IndexedDB layer (settings, sessions, active, exercisePrefs) with atomic finishActive"
  - "Serialized draft actions (queue/mutate/startWorkout/logSet/setCurrent)"
  - "planExercise contract (tracer internals), history and dates domain modules"
  - "tools/smoke.mjs zero-dependency static server + headless Chrome E2E runner"
affects: [01-02, 01-03, 01-04, 01-05, 01-06]

actuals:
  tokens: 7600
  tasks: 2
  commits: 2
plan_head_before: 47b3c66d87824d6b15ebe93d7d8679d71edad4c8
plan_head_after: 57d3e5fd2a6dfd225232f2e273238a7d54cca81d

tech-stack:
  added: []
  patterns:
    - "Hyperscript h() builds DOM with createElement/text nodes only (no innerHTML anywhere in src/)"
    - "IndexedDB is the only source of truth; every draft read-modify-write goes through one promise queue"
    - "Hash router as a single ROUTES object; screens return a Node (or null when they redirect)"

key-files:
  created:
    - index.html
    - src/app.js
    - src/ui/dom.js
    - src/ui/today.js
    - src/ui/workout.js
    - src/data/db.js
    - src/data/program.js
    - src/data/exercises.js
    - src/domain/dates.js
    - src/domain/history.js
    - src/domain/plan.js
    - src/actions/workout.js
    - tools/smoke.mjs
    - tools/e2e/01-core-loop.mjs
  modified: []

key-decisions:
  - "Router matches parameterised routes by prefix ('#/resumo/<id>') so 01-03/01-04 only add ROUTES entries; screens get the full hash as argument"
  - "setCurrent was written in Task 1 alongside the other actions (same file); Task 2 added its UI and E2E coverage"

requirements-completed: [TREINO-01, TREINO-07]

coverage:
  - id: D1
    description: "Today shows Treino A with its 8 exercises and one-tap 'Iniciar treino'"
    requirement: TREINO-01
    verification:
      - kind: e2e
        ref: "node tools/smoke.mjs core-loop"
        status: pass
  - id: D2
    description: "Each logged set is in IndexedDB before it is shown; reload resumes #/treino with the sets"
    requirement: TREINO-07
    verification:
      - kind: e2e
        ref: "node tools/smoke.mjs core-loop"
        status: pass
  - id: D3
    description: "Two fast taps on 'Concluir serie' save two sets (queue serialization)"
    requirement: TREINO-07
    verification:
      - kind: e2e
        ref: "node tools/smoke.mjs core-loop (double-tap step; mutation check: un-serialized queue makes it fail)"
        status: pass
  - id: D4
    description: "Next/previous exercise and 'Continuar treino' on Today"
    requirement: TREINO-01
    verification:
      - kind: e2e
        ref: "node tools/smoke.mjs core-loop"
        status: pass
---

# Phase 1 Plan 01: Tracer - Today, start, write-through logging, resume Summary

**Vanilla ES-module walking skeleton: Today (Treino A) -> one-tap start -> every set written to raw IndexedDB through a serialized queue -> reload resumes the workout, proven in headless Chrome by a zero-dependency CDP runner.**

## Accomplishments

- Today lists the next template's exercises ("3 × 10–15", "2 × 20–45 s" for the plank) and starts the workout in one tap; with an open draft it offers "Continuar treino".
- Workout screen shows "Exercício N de M", load/reps prefilled from `planExercise`, logged set rows (`data-set-kind`), "Concluir série" and Anterior/Próximo.
- `db.js` (raw IndexedDB, create-if-missing upgrade, reload on `versionchange`) with atomic `finishActive` ready for 01-03.
- `queue()`/`mutate()` serialize every draft read-modify-write; the E2E double tap persists exactly 3 sets (1 + 2). Sanity check: temporarily removing the chaining from `queue()` makes the scenario fail, so the test genuinely guards the lost-update bug.
- `tools/smoke.mjs`: static server on 127.0.0.1 with path-traversal guard, `--serve [port]`, fresh Chrome profile per scenario, CDP over Node's global WebSocket.

## Verification

```
$ node tools/smoke.mjs core-loop
PASS 01-core-loop
smoke: 1 passed, 0 failed
```

Acceptance greps: `DB_NAME = 'academia'` = 1, `finishActive` = 1, `log-set` in workout.js = 1, `mutate(` = 3, `--serve` in smoke.mjs = 3, `next-exercise` = 1, `resume` in today.js = 1, `click()` in the E2E = 1, files under src/ containing `innerHTML` = 0.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DevToolsActivePort read raised EBUSY on Windows**
- **Found during:** Task 1 first smoke run
- **Issue:** `existsSync` + `readFileSync` of the port file while Chrome was still writing it threw `EBUSY`.
- **Fix:** read inside try/catch and keep polling.
- **Files modified:** tools/smoke.mjs
- **Commit:** 907b891 (fixed before the commit)

**2. [Rule 1 - Bug] E2E double-tap assertion compared a Promise to 3**
- **Found during:** Task 2 first run
- **Fix:** `await` the IndexedDB probe inside the waitFor expression.
- **Files modified:** tools/e2e/01-core-loop.mjs
- **Commit:** 57d3e5f (fixed before the commit)

### Process deviations

**3. [Branch safety] Commits are on `gsd/phase-01-today-s-workout-core-value`, not `main`**
- The executor's pre-commit assertion refuses commits on the protected/default branch (`gsd git.base-branch --is-protected main` returned `true`), and overriding it needs a config change that was not authorised. A phase branch was created from `main` at 47b3c66 in the same working tree. `main` is untouched; merge with `git merge --ff-only gsd/phase-01-today-s-workout-core-value` (or set `git.allow_default_branch_commits: true` and re-home) when ready.

**4. [Minor] `setCurrent` implemented in Task 1**
- It lives in the same file as the other actions and the Task 1 export list required it; Task 2 added the UI and E2E for it.

**5. [Trailer] Commit trailer uses `Co-Authored-By: Claude Sonnet 5.5`** (the attribution configured for this session) instead of the "Opus 5.5" line in the dispatch notes.

## Pending Human Checks

None for this plan (no device checkpoint in 01-01). Consolidated phone check is in 01-06.

## Known Stubs

None. `planExercise` returns tracer-level progression (repeat last top load, else start load) by design; 01-04 replaces the internals and keeps the return shape.

## Threat Flags

None. T-01-01 (no markup strings: 0 files with `innerHTML`), T-01-02 (write-through + queue, proven by E2E) and T-01-05 (127.0.0.1 bind, traversal guard) are mitigated as planned.

## Self-Check: PASSED

All 14 files exist; commits 907b891 and 57d3e5f are ancestors of HEAD.
