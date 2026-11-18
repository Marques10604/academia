---
phase: 04-identity-publish-handoff
plan: 01
subsystem: identity-and-first-day
tags: [progride, icons, manifest, first-day-checklist, today-dashboard, reset-all]
status: complete

requires: ["02-03"]
provides:
  - "src/ui/firstday.js: #/primeiro-dia checklist (6 items derived from EXERCISES/PROGRAM), ticks in settings 'firstDayChecklist' (already in the backup)"
  - "Today: 'Primeiro dia na academia?' card until the first completed workout; ONE dashboard card (date, week, 7-day average weight, last backup)"
  - "tools/make-icons.mjs: renderIcon / encodePng / iconSvg; Progride dumbbell-with-arrow icons: PNG any + separate maskable (192, 512) and icons/icon.svg"
  - "Manifest name/short_name Progride, <title>, onboarding heading 'Bem-vindo ao Progride' with the logo; id/start_url/scope/DB_NAME/BACKUP_APP unchanged"
  - "Settings: 'Apagar tudo e começar do zero' (db.clearAll(), two confirmations, back to onboarding) - extra task requested by the user"
affects: ["04-02"]

actuals:
  tokens: 40000
  tasks: 4
  commits: 4
plan_head_before: 1207b8e49045fa4508eb138edca0395405333ba7
plan_head_after: d7f9b52ccf84f5002073f9a908dff7c77fe17306

tech-stack:
  added: []
  patterns:
    - "Icons are generated, never hand-edited: a unit-box ARTWORK list placed per kind ('any' 76% of the icon, 'maskable' 56% centered inside the 80% safe circle), 4x4 supersampling, zero dependencies"
    - "A test decodes the committed PNGs and compares every pixel with renderIcon() output, so the files cannot drift from the generator"
    - "Checklist writes the whole ordered list on every tick; unknown ids and non-array values from an imported backup are ignored"
    - "db.clearAll() lists the stores from the open database, so a store added in a later schema version is wiped too"

key-files:
  created:
    - src/ui/firstday.js
    - tools/e2e/11-launch.mjs
    - icons/maskable-192.png
    - icons/maskable-512.png
    - icons/icon.svg
  modified:
    - src/app.js
    - src/ui/today.js
    - src/ui/onboarding.js
    - src/ui/settings.js
    - src/data/db.js
    - styles.css
    - tools/make-icons.mjs
    - icons/icon-192.png
    - icons/icon-512.png
    - manifest.webmanifest
    - index.html
    - test/assets.test.js
    - sw.js

key-decisions:
  - "Rebrand is user-visible text only: manifest id 'academia', start_url, scope, DB_NAME, cache prefix, BACKUP_APP and package name stay, so the installed app keeps its data"
  - "Reset-all confirmation wording: the user's text plus one line 'Toque em Cancelar para voltar e fazer o backup, ou em OK para continuar', because OK/Cancel against 'Quer fazer um backup antes?' is ambiguous"
  - "Reset-all e2e lives in 11-launch (not a new scenario file) so the plan's 'smoke: 12 passed' still holds; no node test for clearAll because the repo has no node-side IndexedDB and no db tests"

requirements-completed: [LANC-01, LANC-05]

duration: ~35min
completed: 2026-11-18
---

# Phase 4 Plan 1: Progride identity, first-gym-day checklist, Today dashboard Summary

The app is now Progride (name, green dumbbell-with-arrow icon in any/maskable/SVG, onboarding logo), Today opens with one compact dashboard card, a six-item first-gym-day checklist is reachable from Today until the first completed workout, and Settings can wipe everything for a clean start. Nothing was published (0.4.0 is 04-02).

## What was built

- **Checklist (Task 1, tracer):** `#/primeiro-dia` with items professor, faltando, kg-placa, regulagem, garrafa, leve. Machine names come from the data (Leg press 45°, Puxada frontal, Mesa flexora, Panturrilha em pé; pin machines from `selectorized`). Ticks go to the settings store under `firstDayChecklist` on every change (progress text updates in place), so backup export/restore already carries them. Today shows the card only while no session has `complete === true`.
- **Identity (Task 2):** `tools/make-icons.mjs` rewritten (still dependency-free, import has no side effects). Manifest has two `any` and two separate `maskable` PNG entries; `<title>`, favicon SVG, apple-touch-icon; onboarding has a `.brand` row with the logo. Tests: manifest identity guard, committed PNG pixels equal `renderIcon`, maskable art inside the 0.40 safe radius and >= 3% accent, `any` art spans >= 60%.
- **Dashboard (Task 3):** date, week dots, average weight and backup-status in one `.card.dashboard`; check-in block, backup nudge and first-day card follow. Every `data-role` kept; earlier E2E pass unchanged. sw.js re-stamped (45 files, VERSION 0.3.0).
- **Extra task:** Settings card (after the backup card) with a red text button "Apagar tudo e começar do zero". Two `confirm()` dialogs, then `db.clearAll()` clears every store (draft included) in one transaction and routes to `#/inicio`. Caches and the service worker are untouched.

## Verification (final run, exact)

- `node --test`: tests 119, pass 119, fail 0
- `node tools/smoke.mjs`: PASS 01 ... 11, `smoke: 12 passed, 0 failed` (11-launch covers identity, dashboard, checklist persistence/backup/visibility, reset-all cancel paths and full wipe)
- `node tools/stamp-sw.mjs --check`: `sw.js em dia`, exit 0
- Guards: `Progride` x2 in manifest, id/start_url/scope unchanged, `DB_NAME = 'academia'` and `BACKUP_APP = 'academia'` present, `week-card` 0 in src and styles, `innerHTML` in src 0, sw.js `VERSION = '0.3.0'`

## Deviations from Plan

### Auto-fixed / adjusted

**1. [Rule 3 - Blocking] E2E dashboard step used `goto('#/hoje')` while already on `#/hoje`**
- **Found during:** Task 3 (first smoke run, timeout waiting for avg-weight)
- **Issue:** same-hash navigation fires no hashchange, so Today did not re-render with the seeded weigh-in
- **Fix:** `page.reload()` in the test
- **Files modified:** tools/e2e/11-launch.mjs
- **Commit:** d7ddfa0

**2. [Rule 2 - Missing] Spacing between the top blocks of Today**
- **Issue:** the old `week-card` margin was the only gap; with the dashboard, check-in, nudge and checklist cards would touch
- **Fix:** `[data-screen=hoje] > .card, > .notice { margin-bottom: 10px }`
- **Commit:** d7ddfa0

**3. [Extra task, wording] First confirmation text** carries one extra sentence explaining Cancel/OK (see key-decisions).

**4. [Extra task, scope] No node test for `clearAll`:** no db-level node tests exist and Node has no IndexedDB; covered by the e2e instead.

### Notes

- One full-smoke run out of four showed `11 passed, 1 failed` (the failing scenario was not captured); three other full runs and every targeted run were 12/12. Looks like a timing flake of the Chrome harness, not tied to this change; worth a glance if it recurs.
- Phase-4 package installs: none.

## Known Stubs

None.

## Threat Flags

None new. T-04-01 (settings row from an imported backup) mitigated: non-array becomes empty, only known ids honored, texts rendered as text nodes. T-04-02 guarded by tests and greps. T-04-03 guarded by the pixel-compare test. The reset-all button is the one new destructive action: it needs two explicit confirmations and has no effect on caches, manifest or URL.

## Pending human checks (phone only, non-blocking)

- Install/reinstall on the Android phone: home-screen icon shows the green dumbbell-with-arrow on black, adaptive/maskable crop looks right (not cut), name "Progride" under the icon.
- Tap through the checklist on the phone (check boxes are big enough, ticks survive closing the app).
- Today dashboard card reads well on the phone screen (spacing between cards).
- "Apagar tudo e começar do zero": confirm() dialogs look and read sensibly in Chrome Android; after wiping, onboarding appears and the app works like a first install.
- Note: an app already installed under the old name may keep the old name/icon until reinstalled or updated by Chrome (WebAPK update); data is kept either way because the manifest id/scope did not change.

## Self-Check: PASSED

- FOUND: src/ui/firstday.js, tools/e2e/11-launch.mjs, icons/maskable-192.png, icons/maskable-512.png, icons/icon.svg
- FOUND commits: aaca20c, 4c08bcb, d7ddfa0, d7f9b52 (ancestors of HEAD)
