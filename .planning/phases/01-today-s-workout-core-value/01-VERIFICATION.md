---
phase: 01-today-s-workout-core-value
verified: 2026-11-18T17:00:00Z
status: human_needed
score: 5/5 must-haves verified (code and automated tests); 4 device-only checks pending
covered_files:
  - .planning/phases/01-today-s-workout-core-value/01-01-PLAN.md
  - .planning/phases/01-today-s-workout-core-value/01-01-SUMMARY.md
  - .planning/phases/01-today-s-workout-core-value/01-02-PLAN.md
  - .planning/phases/01-today-s-workout-core-value/01-02-SUMMARY.md
  - .planning/phases/01-today-s-workout-core-value/01-03-PLAN.md
  - .planning/phases/01-today-s-workout-core-value/01-03-SUMMARY.md
  - .planning/phases/01-today-s-workout-core-value/01-04-PLAN.md
  - .planning/phases/01-today-s-workout-core-value/01-04-SUMMARY.md
  - .planning/phases/01-today-s-workout-core-value/01-05-PLAN.md
  - .planning/phases/01-today-s-workout-core-value/01-05-SUMMARY.md
  - .planning/phases/01-today-s-workout-core-value/01-06-PLAN.md
  - .planning/phases/01-today-s-workout-core-value/01-06-SUMMARY.md
  - manifest.webmanifest
  - src/actions/workout.js
  - src/app.js
  - src/data/db.js
  - src/domain/draft.js
  - src/domain/progression.js
  - src/domain/records.js
  - src/platform/device.js
  - src/ui/exercise.js
  - src/ui/onboarding.js
  - src/ui/settings.js
  - src/ui/summary.js
  - src/ui/today.js
  - src/ui/workout.js
  - sw.js
covered_digest: "v4:sha256:33152f2c7099649cff855b1bce6ba7f833087c56e9302548195f5ab380eb8fb8"
behavior_unverified: 0
overrides_applied: 0
gaps: []
human_verification:
  - test: "FUND-01 / SC1: install from https://marques10604.github.io/academia/ (Chrome menu > Adicionar à tela inicial), open from the icon, then enable airplane mode, close the app fully and reopen"
    expected: "Opens standalone (no address bar) and navigates Hoje / exercise screens / Config offline; first open showed the medical notice and asked weight/height ('72,5' accepted)"
    why_human: "WebAPK install and real offline cold start cannot be exercised headless; service worker precache list is verified (sw.js == stamp --check) but not the device"
  - test: "TREINO-05 (relaxed): log a set, leave the app visible during the rest, then in a second run lock the screen / switch app during a rest and come back"
    expected: "Visible: beep + vibration at 0:00 and 'Descanso terminou — próxima série!'. Returning to an overdue timer: correct remaining time or 'Descanso terminou há N s' with one vibration. (Per STATE.md the alert is only guaranteed while the app is visible.)"
    why_human: "AudioContext beep and navigator.vibrate need a real phone; headless Chrome has neither"
  - test: "TREINO-06: start a workout and leave the phone untouched for longer than the screen timeout"
    expected: "Screen stays on; 'Tela ligada durante o treino' is shown; after switching app and returning the lock is re-acquired"
    why_human: "Wake Lock is not available in headless Chrome"
  - test: "FUND-03 update behavior: with 0.1.0 installed, publish/open 0.2.0 while the app is open, then close fully and reopen (01-06 SUMMARY 'Teste no celular' steps 1-4)"
    expected: "Config keeps showing the old version while the app stays open; the new version appears only after a full close and reopen; YouTube round trip resumes the same exercise with all sets; increment chip 2,5 changes +/- step"
    why_human: "Service worker waiting/activation lifecycle and Android task kill/reload on return from YouTube need the real device"
---

# Phase 1: Today's Workout (Core Value) Verification Report

**Phase Goal:** As a gym beginner, I want to open the installed app offline, see today's workout, log each set in seconds and be told what load to use next, so that I always know what to do and my loads progress automatically.
**Verified:** 2026-11-18
**Status:** human_needed (no code gaps; only device-only checks remain)
**Re-verification:** No, initial verification

## Automated runs (executed by the verifier, not copied from SUMMARY)

| Command | Result |
| ------- | ------ |
| `node --test` | 61 tests, 61 pass, 0 fail |
| `node tools/smoke.mjs` | PASS 01-core-loop, 02-library, 03-logging, 04-summary-pr, 05-calibration, 05-short-workout; 6 passed, 0 failed |
| `node tools/stamp-sw.mjs --check` | `sw.js em dia`, exit 0 |
| Preview server 127.0.0.1:8080 | `/`, `manifest.webmanifest`, `sw.js`, `icons/icon-512.png` all 200 |
| Version consistency | `src/version.js` APP_VERSION 0.2.0 == `sw.js` VERSION 0.2.0; `main` == `origin/main` == branch HEAD fa91c83 (0.2.0 published) |
| Progression spot-check (node) | 20 kg legs-curl, 11 days away -> `layoff10`, 15 kg, text "11 dias sem treinar — retome com 90%: 15 kg"; 36 days -> `layoff28` |

## Goal Achievement

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
| - | ----- | ------ | -------- |
| 1 | Installable offline PWA; first open shows medical notice and asks weight/height; "72,5"/"72.5" read as 72.5 | VERIFIED in code; install/offline on phone is a human item | `manifest.webmanifest` (standalone, id, 192/512 any + maskable, scope ./); `sw.js` precaches 31 files cache-first with navigate fallback; `src/app.js:23` forces `#/inicio` until `onboardingDone`; `src/ui/onboarding.js` notice + weight/height via `parseDecimal` (`src/domain/numbers.js`, regex accepts `,` and `.`), unit-tested |
| 2 | Settings shows version and persistence; data survives close; new version only after full close/reopen | VERIFIED in code | `src/ui/settings.js` shows `APP_VERSION` and `isPersisted()`; `requestPersist()` after onboarding; no `skipWaiting`/`clients.claim` anywhere (grep empty) so a new SW waits; every set is a write-through `putActive` (`src/actions/workout.js` `mutate`) |
| 3 | Today shows next A/B workout (advances only on completion) with sets x reps, rest, effort per phase; pt-BR instructions/mistakes/muscles/setup offline; YouTube pt search; guided warm-up | VERIFIED | `nextTemplate` (`src/domain/history.js`) only counts `complete === true` sessions; `src/ui/today.js` exerciseRow shows plannedText, restText, phase badge, effortText, reason; `src/ui/exercise.js` renders muscles/setup/steps/mistakes/alternative from `src/data/exercises.js` (15 exercises, all with content, catalog test); `youtubeUrl` = `youtube.com/results?search_query=` with Portuguese query; warm-up card (`workout.js` idx 0, done 0) saves `kind:'warmup'` |
| 4 | One-tap start; set in 1-2 taps with prefilled load/reps and +/-; "anterior"; leve/no ponto/pesado; undo; auto rest timer that is correct after screen off/app switch; screen awake | VERIFIED in code and e2e; beep/vibration/wake lock on phone are human items | `startWorkout` -> `putActive`; `logSet` pushes set and writes `restEndsAt = now + restSec*1000` in the same put; timer = `restEndsAt - now` (`src/domain/timer.js`), `visibilitychange` recompute (`workout.js:~37`), alert once on return; steppers update in place and are serialized by `queue()`; `previousLine` -> "anterior: X kg × N"; feel chips after last planned set; `undoLast` removes newest set across entries; `device.js` wake lock re-acquired on `visibilitychange` |
| 5 | Resume exactly after close/reload/YouTube; summary with duration/sets/loads and PR (ignoring warm-up/calibration); calibration ramp with "quantas sobravam?"; double progression with one-line reason; drop on failure/stall; 90%/80% layoff; per-exercise increment and override | VERIFIED | `app.js` unknown/empty hash -> `#/treino` when a draft exists; `currentIdx` persisted; e2e core-loop reload resumes; `summary.js` + `detectPRs` (skips first 2 sessions, work sets only); `logRampSet`/`answerRamp`/`calibrationStep` (5 unit cases); `suggestNext` branches increase/boost/dropFail/stall/layoff10/layoff28/hold all unit-tested, reason via `reasonText`; increment chips write `exercisePrefs`, read by Today and `startWorkout`; +/- and typed load override any suggestion |

**Score:** 5/5 truths verified at code level. No truth is behavior-dependent without a test: the timer/persist invariants (`restEndsAt` survives reload, `skip-rest` clears, double-tap serialization, undo clears timer) are exercised by `test/logging.test.js` and e2e `03-logging`/`01-core-loop`.

### Requirements Coverage

| Requirement | Status | Evidence |
| ----------- | ------ | -------- |
| FUND-01 | NEEDS HUMAN | manifest + SW verified; install/offline on device pending (REQUIREMENTS.md correctly still unchecked) |
| FUND-02 | SATISFIED | IndexedDB (`db.js`), `requestPersist` after onboarding, status in Settings |
| FUND-03 | SATISFIED (as relaxed in STATE.md) | cache-versioned SW without `skipWaiting`; version shown in Settings; device lifecycle check listed |
| FUND-04 | SATISFIED | `parseDecimal`, used for onboarding and typed load |
| FUND-05 | SATISFIED | onboarding notice + weight/height |
| PROG-01..06 | SATISFIED | `src/data/program.js` A (8) / B (7) exercises match REQUIREMENTS list; Today/exercise/warm-up code above |
| TREINO-01..04, 07, 08, 09 | SATISFIED | code + e2e |
| TREINO-05 | NEEDS HUMAN (relaxed) | timer from saved end time verified; beep/vibrate at end only guaranteed while visible, alert once on return (STATE.md relaxation honoured by `workout.js` paint()) |
| TREINO-06 | NEEDS HUMAN | `requestWakeLock` wired; headless has no Wake Lock |
| CARGA-01..06 | SATISFIED | `progression.js`, `workout.js` calibration card, `exercise.js` increment chips; unit tests |
| EVOL-03 | SATISFIED | `records.js` |

No orphaned requirements: all 27 phase-1 IDs are claimed by plans.

### Post-01-05 user adjustments (also verified)

Black neutral theme (`manifest` and `theme-color` #000000), date on Today and summary (`datefmt.js`), "Esta semana" count (`week.js`, `week.test.js`), per-exercise `alternative` (15/15, `catalog.test.js`, shown in `exercise.js`), "Treino curto" (`SHORT_ITEMS=4`, `isComplete(entries, short)`, `short.test.js`, e2e `05-short-workout`) all present, wired and passing.

### Anti-Patterns

No TBD/FIXME/XXX in phase source; no stub returns on rendered paths; data flows from IndexedDB to every rendered value (Level 4 checked for Today rows, workout card, summary).

### Warnings (non-blocking, not gaps)

| File | Line | Note |
| ---- | ---- | ---- |
| `src/ui/workout.js` | 158 | Warm-up "Feito" starts a 60 s rest (`logWarmup`) but does not call `unlockAudio()` (only `onLog`/`onRamp` do, lines 77/86). If a warm-up is the first tap after a (re)load, the end-of-rest beep is silent for that rest (vibration still fires). Cosmetic; the device check above will reveal it. |
| `sw.js` | 43 | `cache.addAll(ASSETS)` uses the default HTTP cache; GitHub Pages sends `max-age=600`, so a release made within 10 minutes of a prior fetch could precache a stale file. Low risk for a one-user app; consider `{cache:'reload'}` Requests in a later phase. |
| `src/domain/progression.js` | 97 | Layoff on coarse increments (5 kg machine at 20 kg) rounds 90% to 20 and falls back to L - inc = 15 kg (75%), deeper than "90%". Intentional and tested ("never the same load"), noted only because REQUIREMENTS says 90%/80%. |

### Gaps Summary

None. The phase goal is achieved in the codebase: the core loop (today's workout -> log sets -> next load suggestion, offline-capable shell) exists, is wired end to end and is covered by 61 unit tests and 6 e2e scenarios, all re-run green by the verifier. The only open items are the four phone-only checks above (install and offline cold start, beep/vibration, wake lock, SW update lifecycle and YouTube round trip), which are human verification items, not gaps.

---

_Verified: 2026-11-18_
_Verifier: Claude (gsd-verifier)_
