---
phase: 01-today-s-workout-core-value
plan: 03
subsystem: core-loop-publish
tags: [finish-workout, rotation, onboarding, settings, service-worker, github-pages]
status: complete

requires: ["01-01", "01-02"]
provides:
  - "finishWorkout/discardWorkout through the action queue (atomic session save, 70% completion rule)"
  - "Summary screen (#/resumo/<id>), onboarding with medical notice (#/inicio), Settings (#/config)"
  - "pt-BR number helpers formatNumber/parseDecimal/parseHeightCm"
  - "Service worker registered; sw.js stamped with 22 files"
  - "Version 0.1.0 live at https://marques10604.github.io/academia/"
affects: [01-04, 01-05, 01-06]

actuals:
  tokens: 9000
  tasks: 3
  commits: 3
plan_head_before: cae653529affaad1404f7679f4091fb12dde4b17
plan_head_after: f58cd9af9b8512e50f2226be11651631e57e3904

tech-stack:
  added: []
  patterns:
    - "Onboarding gate lives in render(): every route redirects to #/inicio until settings.onboardingDone is true"
    - "Service worker registered after the first render, errors swallowed"

key-files:
  created:
    - src/domain/numbers.js
    - src/ui/summary.js
    - src/ui/onboarding.js
    - src/ui/settings.js
    - test/domain.test.js
  modified:
    - src/actions/workout.js
    - src/ui/workout.js
    - src/ui/today.js
    - src/app.js
    - sw.js
    - tools/e2e/01-core-loop.mjs

key-decisions:
  - "A workout is complete when at least 70% of its exercises have a work set; incomplete sessions are saved but do not advance A/B"
  - "GitHub Pages was not enabled yet; enabled with gh api POST (main, /) as the plan prescribes"

requirements-completed: [FUND-02, FUND-03, FUND-04, FUND-05, PROG-02]

coverage:
  - id: D1
    description: "Finish saves the session atomically; 6/8 exercises done -> complete, summary shows 'Próximo treino: Treino B', Today offers Treino B"
    requirement: PROG-02
    verification:
      - kind: e2e
        ref: "node tools/smoke.mjs core-loop"
        status: pass
  - id: D2
    description: "parseDecimal/parseHeightCm/formatNumber, rotation, history and date helpers"
    requirement: FUND-04
    verification:
      - kind: unit
        ref: "node --test test/domain.test.js (8 cases incl. '72,5')"
        status: pass
  - id: D3
    description: "First open shows medical notice; 72,5 is stored as 72.5 kg; persistent storage requested"
    requirement: FUND-05
    verification:
      - kind: e2e
        ref: "node tools/smoke.mjs core-loop"
        status: pass
  - id: D4
    description: "Settings shows 'Versão do app: 0.1.0', storage status and profile"
    requirement: FUND-02
    verification:
      - kind: e2e
        ref: "node tools/smoke.mjs core-loop"
        status: pass
  - id: D5
    description: "Service worker registers and becomes active; live site serves 0.1.0 and the manifest"
    requirement: FUND-01
    verification:
      - kind: e2e
        ref: "node tools/smoke.mjs core-loop (serviceWorker.ready active)"
        status: pass
      - kind: manual-script
        ref: "curl https://marques10604.github.io/academia/src/version.js -> 0.1.0; manifest 200"
        status: pass
      - kind: human
        ref: "install on phone + airplane mode (pending)"
        status: pending
---

# Phase 1 Plan 03: Finish, onboarding, Settings, service worker and publish 0.1.0 Summary

**Finish saves the workout in one transaction and rotates A to B at 70% done, first open shows the medical notice and takes "72,5" as 72.5 kg, Settings shows version and storage status, and the service-worker-backed app is live on GitHub Pages.**

## Accomplishments

- `finishWorkout(now)` / `discardWorkout()` run inside the queue; `complete = exercises with a work set / total >= 0.7`; `finishActive` saves session and removes the draft in one transaction.
- Workout screen has "Finalizar treino" and a confirmed "Descartar treino"; the summary shows title, duration, work-set count, per-exercise sets and "Próximo treino: Treino X".
- Onboarding (`#/inicio`) with the three-part medical notice, weight (30-250 kg) and height (120-230 cm) validated by `parseDecimal`/`parseHeightCm`, then `requestPersist()`.
- Settings (`#/config`) shows version, "Armazenamento protegido: sim/não", the do-not-clear-data hint, profile and the notice. Today has a "Config" button.
- `navigator.serviceWorker.register('./sw.js', {updateViaCache:'none'})`; `sw.js` re-stamped (22 files).
- Published: main fast-forwarded to f58cd9a and pushed; Pages enabled (main, /).

## Verification

```
$ node --test           -> tests 12, pass 12, fail 0
$ node tools/stamp-sw.mjs --check -> sw.js em dia
$ node tools/smoke.mjs  -> PASS 01-core-loop / smoke: 1 passed, 0 failed
$ curl -s https://marques10604.github.io/academia/src/version.js
export const APP_VERSION = '0.1.0';
$ manifest.webmanifest, index.html, sw.js, src/app.js, src/ui/settings.js, icons/icon-512.png -> HTTP 200
$ gh api repos/Marques10604/academia/pages --jq .html_url -> https://marques10604.github.io/academia/
```

Acceptance greps: `serviceWorker.register` in app.js = 1, `./src/ui/settings.js` in sw.js = 1, `0.7` and `finishActive` in actions/workout.js >= 1, `Próximo treino` in summary.js, `accept-onboarding`, `requestPersist`, `isPersisted`, `onboardingDone` all present.

## Deviations from Plan

**1. [Rule 3 - Blocking] GitHub Pages was not enabled** - `gh api .../pages` returned 404; enabled with the POST the plan prescribes (200, html_url as expected). Build finished in under 30 s.

**2. [Process] Publish done by fast-forward merge, not a direct commit on main** - per the dispatch instructions (main ff-only from the phase branch). The docs commit (SUMMARY, STATE, ROADMAP, REQUIREMENTS) was published in a second fast-forward push right after.

None otherwise; the 5/8 (incomplete) branch of the 70% rule is covered by the code but only the 6/8 path by E2E, as the plan specified.

## Pending Human Checks

- Install via Chrome menu "Instalar app" on the Android phone, finish onboarding with 72,5, open Config (version 0.1.0, storage status), then airplane mode: swipe away and reopen; Today opens and Iniciar treino -> Concluir série works offline. Consolidated with the 01-06 phone check. FUND-01 stays unchecked in REQUIREMENTS.md until this passes.

## Known Stubs

None.

## Threat Flags

None. T-01-04 mitigated (requestPersist + visible status + hint), T-01-16 mitigated (strict parse and ranges), T-01-06 accepted (only app files and previously approved planning files pushed), T-01-SC mitigated (no installs).

## Self-Check: PASSED

All created files exist; commits abd410f, 26d696a and f58cd9a are ancestors of HEAD; live site returns 0.1.0.
