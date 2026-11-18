# Roadmap: Sistema Academia

## Overview

A personal gym PWA for one person (Android, pt-BR, beginner, first gym session in December 2026) that must be finished in 5 days. The roadmap is 4 phases, ordered so the Core Value is usable first: Phase 1 delivers the installable, offline "today's workout" loop (program, set logging, rest timer, calibration and automatic load progression). Phase 2 protects and shows the data (backup/restore, history, charts, morning check-in). Phase 3 adds the wider habits (protein, goals, reminder guide, photos, AI analysis). Phase 4 gives the app its identity, permanent URL and a no-AI maintenance guide, plus the final real-phone test.

**Hard constraint:** whole app finished in 5 days, target finish **2026-11-23** (started 2026-11-18). Keep every requirement's implementation as simple as works for one person.

**Lean build rules (apply to every phase):**

- No build step. Vanilla JS or Preact + htm vendored; hand-written SVG charts; service worker kept tiny.
- Storage in IndexedDB with a single `schemaVersion` number. No migration framework.
- Service worker uses one cache-version constant and no `skipWaiting`: a new version takes effect after the app is fully closed and reopened. Version number shown in Settings.
- Backup is one versioned `.json` export/import. Import shows a one-line summary ("N treinos, de X a Y") and a confirm button. No snapshot or dry-run machinery.
- Gemini API key is stored plainly in local settings.
- Core, not "protection": every set is saved the moment it is logged (a workout survives a closed app) and backup export/import works.

## Timeline (indicative, 5 days)

| Phase | Indicative budget | Notes |
|-------|-------------------|-------|
| 1. Today's Workout (Core Value) | ~2 days | Heaviest phase; build as a thin walking skeleton first, then layer on |
| 2. Backup, History & Check-in | ~1 day | |
| 3. Food, Goals, Photos & AI | ~1.5 days | Widest phase; see risk notes in STATE.md |
| 4. Identity, Publish & Handoff | ~0.5 day | Includes final real-phone test |

Phases 1 and 2 are the minimum to train safely with data protected. Phases 3 and 4 finish the app before the December gym start; the user starts training after 2026-11-23, so there is slack before the first session.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

**Execution order (decided 2026-11-18):** 1 → 2 → 4 → 3. The handoff (Phase 4) runs before Phase 3 so the maintenance guide and AI rescue kit exist before 2026-11-23 even if time runs out; Phase 3 is the cut zone.

- [ ] **Phase 1: Today's Workout (Core Value)** - Installable offline PWA with the A/B program, live set logging, rest timer, calibration and automatic load progression
- [ ] **Phase 2: Backup, History & Check-in** - Backup export/import, per-exercise history and charts, workout list, morning weight/sleep/energy check-in
- [ ] **Phase 3: Food, Goals, Photos & AI** - Protein checklist (cheap Brazilian portions), weekly goal and streak, body-weight goal, morning-alarm guide, 4-week photo reminder, copyable AI report
- [ ] **Phase 4: Identity, Publish & Handoff** - Final name and logo, permanent GitHub Pages URL, maintenance guide, free-AI rescue kit, first-gym-day checklist, real-phone end-to-end test

## Phase Details

### Phase 1: Today's Workout (Core Value)

**Goal:** As a gym beginner, I want to open the installed app offline, see today's workout, log each set in seconds and be told what load to use next, so that I always know what to do and my loads progress automatically.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: FUND-01, FUND-02, FUND-03, FUND-04, FUND-05, PROG-01, PROG-02, PROG-03, PROG-04, PROG-05, PROG-06, TREINO-01, TREINO-02, TREINO-03, TREINO-04, TREINO-05, TREINO-06, TREINO-07, TREINO-08, TREINO-09, CARGA-01, CARGA-02, CARGA-03, CARGA-04, CARGA-05, CARGA-06, EVOL-03
**Success Criteria** (what must be TRUE):

  1. User installs the app to the Android home screen from a hosted HTTPS URL and it opens and navigates with the phone in airplane mode; first open shows the "not medical advice / see a doctor" notice and asks weight and height, and typing "72,5" or "72.5" is understood as 72.5 kg.
  2. Settings shows the app version and whether storage is persistent; data survives closing the app, and a newly published version only takes effect after the app is fully closed and reopened (never swaps while in use).
  3. The Today screen shows the next workout (A or B, advancing only when a workout is completed, regardless of weekday) with each exercise's sets × reps target, rest time and expected effort for its phase (calibration / adaptation / base); each exercise opens pt-BR step-by-step instructions, common mistakes, muscles and machine adjustment offline, plus a button that opens a Portuguese YouTube search; the first exercise offers a guided warm-up whose sets are marked as warm-up.
  4. User starts the workout with one tap and logs each set in 1–2 taps with load and reps pre-filled and adjustable with +/−, sees the previous session's result ("anterior: 20 kg × 10"), can mark "leve / no ponto / pesado" on the last set, can undo the last set; the rest timer starts by itself, vibrates or beeps at the end and stays correct after the screen turns off or the app is switched; the screen stays awake during the workout.
  5. Closing, reloading or returning from YouTube mid-workout resumes exactly where the user stopped; finishing shows a summary (duration, sets, loads) and celebrates a personal record when beaten (ignoring warm-up and calibration); in the first 2 sessions of each exercise the app guides ramp sets and asks "quantas repetições ainda sobravam?", afterwards it suggests the next load by double progression with a one-line explanation, lowers the load after repeated failure or stagnation, suggests 90% / 80% after 10+ / 28+ days away, and lets the user change the per-exercise increment and override any suggestion.

**Plans**: 6/6 plans executed
Plans:

- [x] 01-01-PLAN.md — Tracer: Today (Treino A) → one-tap start → write-through set logging (queued, double-tap safe) → reload resumes; exercise navigation; zero-dependency E2E runner (wave 1)
- [x] 01-02-PLAN.md — Install shell: styles vocabulary, package.json, manifest + icons, .nojekyll, versioned service worker + stamp tool (wave 1, parallel)
- [x] 01-03-PLAN.md — Finish → summary → A/B rotation, onboarding + medical notice (comma decimals), Settings (version, storage), SW registration, publish 0.1.0 (wave 2)
- [x] 01-04-PLAN.md — pt-BR library for the 15 exercises + YouTube search, Today prescription (sets × reps, rest, phase, effort) and tested double-progression suggestions with reasons (wave 3)
- [x] 01-05-PLAN.md — Live logger: +/− steppers, typed loads, "anterior", leve/no ponto/pesado, undo, warm-up, rest timer + wake lock, summary with PRs (wave 3, parallel)
- [x] 01-06-PLAN.md — Calibration ramp ("quantas sobravam?"), per-exercise increments, publish 0.2.0, consolidated real-phone check (wave 4)

**UI hint**: yes

### Phase 2: Backup, History & Check-in

**Goal:** As a lifter with real data on my phone, I want to back up and restore my data and see my history, charts and a quick morning body check-in, so that nothing is lost and I can see my progress.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: BKP-01, BKP-02, BKP-03, EVOL-01, EVOL-02, EVOL-04, CORPO-01, CORPO-02, CORPO-05
**Success Criteria** (what must be TRUE):

  1. User exports all data (without photos) as a versioned backup file and sends it through the Android share sheet (Drive, WhatsApp) or downloads it.
  2. User imports a backup, sees a one-line summary of what it contains, confirms, and the app restores everything; exporting, clearing the app's data and importing brings back all workouts, loads and settings.
  3. The app shows "último backup há N dias" and reminds the user to back up after several workouts without one.
  4. User opens any exercise and sees its history (dates, loads, reps) and a simple load-over-time chart, and sees the list of completed workouts by date.
  5. User records the morning check-in in a few seconds (weight, sleep 1–5, energy 1–5, all optional) and sees a body-weight chart with a 7-day moving average.
  6. User records the waist measurement (tape at navel height) every 4 weeks and sees it next to the weight trend; Today's mini dashboard shows average weight.

**Plans**: 3/3 plans executed (sequential)

Plans:

- [x] 02-01-PLAN.md — Backup e restauração (schema 2 com dailyLogs, share .txt, último backup, lembrete)
- [x] 02-02-PLAN.md — Histórico de treinos e por exercício, gráfico SVG próprio
- [x] 02-03-PLAN.md — Check-in matinal, peso médio 7 dias, cintura e publicação 0.3.0

**UI hint**: yes

### Phase 3: Food, Goals, Photos & AI

**Goal:** As a user who wants more than a logger, I want to track protein lightly, set goals, get a morning-alarm guide, take progress photos and ask an AI about my data, so that I stay consistent and understand my progress.
**Mode:** mvp
**Depends on**: Phase 4 (runs last)
**Requirements**: ALIM-01, ALIM-02, ALIM-03, ALIM-04, META-01, META-02, META-04, META-05, CORPO-03, IA-01
**Success Criteria** (what must be TRUE):

  1. User sees a daily protein target computed from body weight (about 120 g at 70 kg, editable), taps cheap Brazilian home-portion shortcuts (2 ovos, frango, sardinha em lata, 1 concha de feijão, 1 copo de leite, carne moída...) per meal to add grams, and sees the day total and weekly average (days ≥ 112 g) in neutral colors with no calorie counting; if average weight has not risen in 2 weeks the app suggests adding 1 carb portion per day.
  2. User sets a weekly workout goal (default 3) and sees a weekly streak that tolerates 1 grace week, sees a no-guilt "há N dias sem treinar" notice on Today when applicable, and sets a body-weight goal with a suggested healthy pace.
  3. The app walks the user through creating a recurring morning alarm in the Android Clock and/or downloads a calendar (.ics) file for it.
  4. Every 4 weeks the app reminds the user to take front/side/back photos into a phone-gallery album (no photos stored in the app).
  5. User taps "Gerar relatório para IA" and gets a copyable text summary (loads, frequency, average weight, sleep/energy, protein) with a ready question, to paste into any free AI.

**Plans**: TBD
**UI hint**: yes

### Phase 4: Identity, Publish & Handoff

**Goal:** As the only user, who will soon lose access to Claude, I want the app published at its permanent URL with its own name, logo and a maintenance guide, so that it keeps working and I can maintain it without AI.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: LANC-01, LANC-02, LANC-03, LANC-04, LANC-05
**Success Criteria** (what must be TRUE):

  1. The app shows its own name and logo/icon on the Android home screen after installation.
  2. The app is reachable at its permanent free GitHub Pages URL, installs from there on the user's real phone and runs a full workout end to end in airplane mode.
  3. A pt-BR guide in the repository explains, step by step and without assuming programming knowledge, how to publish a change, add an exercise and restore a backup.
  4. A free-AI rescue kit (project context text to paste into ChatGPT/Gemini + steps to apply and publish a fix) exists in the repository and is linked from Settings.
  5. A first-gym-day checklist is available in the app.

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Today's Workout (Core Value) | 6/6 | In Progress|  |
| 2. Backup, History & Check-in | 3/3 | In Progress|  |
| 3. Food, Goals, Photos & AI | 0/TBD | Not started | - |
| 4. Identity, Publish & Handoff | 0/TBD | Not started | - |
