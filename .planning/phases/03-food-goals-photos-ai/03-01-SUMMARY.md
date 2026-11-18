---
phase: 03-food-goals-photos-ai
plan: 01
subsystem: protein-tracking
tags: [protein, dailyLogs, backup-validation, today-dashboard, e2e]
status: complete

requires: []
provides:
  - "src/domain/protein.js: pure protein rules (MEALS, PORTIONS, mealForHour, autoTarget, proteinTarget, proteinFloor, dayTotal, weekStats, portionLabel, mealLabel)"
  - "#/proteina screen: meal chips, 9 big home-portion buttons, Outro grams, day list with remove, total + neutral bar, 7-day line, editable target"
  - "Today dashboard row 'Proteína hoje: N de T g' with an 'Anotar' button"
  - "Backup: validProtein on dailyLogs rows; summary counts only real check-ins; 08-backup proves protein and every Phase 3 settings key round-trip"
affects: ["03-02", "03-03"]

requirements-completed: [ALIM-01, ALIM-02, ALIM-03]

actuals:
  tokens: 40000
  tasks: 3
  commits: 3
plan_head_before: 229a8f8944eef099fb1d73ebdccc80e263c8a782
plan_head_after: 1b7100befa9a7a9b3e0b5f84de43e2dd1d73cbf6

key-files:
  created:
    - src/domain/protein.js
    - src/ui/protein.js
    - test/protein.test.js
    - tools/e2e/13-protein.mjs
  modified:
    - src/app.js
    - src/ui/today.js
    - styles.css
    - src/domain/backup.js
    - test/backup.test.js
    - tools/e2e/08-backup.mjs
    - sw.js

key-decisions:
  - "No schema change: protein is a field of the dailyLogs row (merge-on-save keeps the weigh-in) and the target is the settings key proteinTargetG; both were already exported and restored"
  - "Every change writes the whole list through one serialized promise chain, so three taps in the same tick end with three stored entries"
  - "Each entry stores its own grams; labels come from the fixed MEALS/PORTIONS tables by id (unknown food -> 'Outro'), so text from a backup file is never displayed"
  - "Floor = round(target x 112 / 120), so an edited target moves the floor with it"
  - "Neutral grey bar that never changes colour with the value; no calorie wording anywhere"

duration: ~35min
completed: 2026-11-18
---

# Phase 3 Plan 1: Protein checklist Summary

Protein tracking without a scale: Today shows "Proteína hoje: N de T g" with an "Anotar" button, and #/proteina lets one thumb add home portions (2 ovos, frango, carne moída, sardinha, feijão, leite, queijo, iogurte, whey) to the chosen meal, with the total, a neutral bar, the 7-day average and the editable target (automatic = 1,7 g/kg, 120 g at 70 kg).

## What was built

- **Task 1 (tracer), commit 3ad64a4:** pure rules with 6 tests, the screen (meal preselected by the hour, big 2-column portion buttons, in-place total/bar refresh), route `#/proteina`, Today dashboard row, CSS (`.portions`, `.portion`, `.bar`, `.bar-fill`), E2E 13-protein (three same-tick taps all saved, weigh-in kept by the merge, reload, Today total).
- **Task 2, commit a2476b8:** `weekStats` (7 tests total in protein.test.js), day list newest first with "remover", "Outro" grams field (1-150, error banner), target field saved on change (empty = automatic, 40-300 else error), weekly line "Últimos 7 dias: média de X g por dia anotado (N dias) · K dias com F g ou mais". All updates in place (typed text survives).
- **Task 3, commit 1b7100b:** `validProtein` in backup.js (partial entries accepted; non-list, non-numeric, negative, >= 1000 g, non-string food/meal, non-numeric `at`, null entries refused as "Backup danificado"); `backupSummary` counts a day as a check-in only with weightKg, sleep or energy; 08-backup seeds a protein-only day (second entry partial) and the five Phase 3 settings keys and asserts they come back unchanged; sw.js re-stamped (49 files, version stays 0.4.0).

## Verification (exact)

- `node --test`: tests 140, pass 140, fail 0
- `node tools/smoke.mjs`: `smoke: 14 passed, 0 failed` (13-protein and 08-backup included; no flake, no rerun needed)
- `node tools/stamp-sw.mjs --check`: `sw.js em dia`, exit 0
- Greps: `'#/proteina'` in app.js = 1; `protein-today` in today.js = 1; `innerHTML` files in src = 0; kcal/caloria in both protein files = 0; `validProtein` in backup.js = 2; protein modules in sw.js = 2; `VERSION = '0.4.0'` = 1; `SCHEMA_VERSION = 2` = 1

## Deviations from Plan

**1. [Rule 1 - Bug in plan] Protein grams upper bound in the backup check**
- **Found during:** Task 3
- **Issue:** the plan text says "g in [0, 1000]" but its own behavior list requires `[{g: 1000}]` to be refused.
- **Fix:** accept `0 <= g < 1000` (the behavior list wins; the UI never writes more than 150 g per entry anyway).
- **Files modified:** src/domain/backup.js
- **Commit:** 1b7100b

**2. [Rule 3 - Blocking] Edit of today.js/app.js via scripted string replace did not match (CRLF), found by the first E2E run**
- Redone with the Edit tool before the first commit; nothing wrong was committed.

Otherwise the plan was executed as written. No auth gates. Tracer gate: `<verify>` (unit tests + 13-protein) re-run end to end and passed before expanding.

## Known Stubs

None.

## Threat Flags

None. T-03-01 (tampering via backup) mitigated by `validProtein` and id-only labels; T-03-02 (lost taps) mitigated by the serialized whole-list write, proven by the same-tick-taps E2E.

## Pending human checks (non-blocking, phone)

- Hoje -> "Anotar" -> tap portions one-handed with the thumb: buttons big enough (64 px min height, 2 columns), meal chips reachable, "Voltar" bottom bar not covering the Outro/target fields when the keyboard is open.
- The grey bar reads as neutral on the black theme.
- Real Android decimal/numeric keyboard for the "Outro" and target fields (inputmode numeric).

## Self-Check: PASSED

Files found: src/domain/protein.js, src/ui/protein.js, test/protein.test.js, tools/e2e/13-protein.mjs. Commits found in HEAD ancestry: 3ad64a4, a2476b8, 1b7100b.
