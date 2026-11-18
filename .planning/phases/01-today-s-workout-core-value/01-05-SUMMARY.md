---
phase: 01-today-s-workout-core-value
plan: 05
subsystem: workout-logging
tags: [set-logging, steppers, rest-timer, wake-lock, warm-up, undo, personal-records, summary]
status: complete

requires: ["01-01", "01-03", "01-04"]
provides:
  - "One-tap set logging with prefilled load/reps, +/- steppers, typed comma load, 'anterior' line, leve/no ponto/pesado, undo"
  - "Guided warm-up on the first exercise (saved as kind 'warmup', never counts for records)"
  - "Rest timer from a saved end time (restEndsAt) with beep/vibrate and screen wake lock"
  - "Finish summary with duration, work sets, loads per exercise and 'Recorde!' rows"
affects: [01-06]

actuals:
  tokens: 8400
  tasks: 3
  commits: 3
plan_head_before: 093cdfebc799f3b185f14e23461f1f507e319351
plan_head_after: 4057935b26ffb92454a044c49838b124b350137e

tech-stack:
  added: []
  patterns:
    - "Typed load and +/- taps update their own input in place (no re-render) and run in order through the action queue"
    - "Rest timer = restEndsAt - now, stored in the draft; one 250 ms interval updates only the timer text"
    - "Device APIs (wake lock, audio, vibration) feature-detected and wrapped in try/catch"
    - "Records derived on read from work sets only; nothing stored"

key-files:
  created:
    - src/domain/draft.js
    - src/domain/timer.js
    - src/domain/records.js
    - src/platform/device.js
    - test/logging.test.js
    - tools/e2e/03-logging.mjs
    - tools/e2e/04-summary-pr.mjs
  modified:
    - src/actions/workout.js
    - src/ui/workout.js
    - src/ui/summary.js
    - sw.js

key-decisions:
  - "Ramp sets (01-06) render as 'Série de ajuste' in the set list; they are excluded from records and the work-set count like warm-ups"
  - "A timer that ended while the page was hidden alerts once on return: 'terminou há N s' with one vibration (no beep) when overdue by more than 2 s"
  - "Wake lock is released when the workout screen is left (the 250 ms tick notices the detached screen), on finish and on discard"

requirements-completed: [PROG-06, TREINO-02, TREINO-03, TREINO-04, TREINO-08, TREINO-09, EVOL-03]

coverage:
  - id: D1
    description: "Set logged with one tap using prefilled load/reps; +/- steppers; typed '22,5' accepted"
    requirement: TREINO-02
    verification:
      - kind: e2e
        ref: "node tools/smoke.mjs logging (steppers, typed 22,5, log-set row '22,5 kg')"
        status: pass
  - id: D2
    description: "Typed 22,5 then + in the same tick gives exactly one increment; field updated in place"
    requirement: TREINO-02
    verification:
      - kind: e2e
        ref: "node tools/smoke.mjs logging (race step, 300 ms settle, draft load == 22,5 + increment)"
        status: pass
  - id: D3
    description: "Previous session's result shown inline ('anterior: 20 kg × 10')"
    requirement: TREINO-03
    verification:
      - kind: e2e
        ref: "node tools/smoke.mjs logging (data-role=previous)"
        status: pass
  - id: D4
    description: "Leve / No ponto / Pesado after the last planned set; undo last set"
    requirement: TREINO-04
    verification:
      - kind: e2e
        ref: "node tools/smoke.mjs logging (data-feel=ponto -> draft feel 'ponto'; undo -> 0 work sets)"
        status: pass
      - kind: unit
        ref: "node --test test/logging.test.js (undoLast cases)"
        status: pass
  - id: D5
    description: "Warm-up card and two warm-up sets saved as warm-up"
    requirement: PROG-06
    verification:
      - kind: unit
        ref: "node --test test/logging.test.js (warmupSets 40/5, 25/5, 0/5)"
        status: pass
      - kind: e2e
        ref: "node tools/smoke.mjs logging (2 log-warmup buttons, one data-set-kind=warmup after tap)"
        status: pass
  - id: D6
    description: "Rest timer starts after each set, survives reload, Pular clears it"
    requirement: TREINO-05
    verification:
      - kind: unit
        ref: "node --test test/logging.test.js (restRemainingMs, formatClock, overdueSeconds)"
        status: pass
      - kind: e2e
        ref: "node tools/smoke.mjs logging (timer after log-set, restEndsAt in the future, reload keeps timer, skip-rest -> null)"
        status: pass
      - kind: human
        ref: "phone: beep/vibration at 0:00, lock screen during rest (pending, 01-06 phone check)"
        status: pending
  - id: D7
    description: "Screen stays awake on the workout screen (Wake Lock re-acquired on visibilitychange)"
    requirement: TREINO-06
    verification:
      - kind: human
        ref: "phone: screen does not turn off during a rest (pending; headless Chrome has no wake lock)"
        status: pending
  - id: D8
    description: "Summary with duration, sets, loads per exercise and Recorde! excluding warm-up/ramp and first two sessions"
    requirement: TREINO-09
    verification:
      - kind: unit
        ref: "node --test test/logging.test.js (beats, detectPRs: <2 sessions, 20x12 -> 30x12, warm-up/ramp ignored)"
        status: pass
      - kind: e2e
        ref: "node tools/smoke.mjs summary-pr ([data-role=pr] contains 'Leg press 45°' and '30 kg × 12')"
        status: pass
---

# Phase 1 Plan 05: Set logging, rest timer, wake lock and finish summary Summary

**One-handed logger: a normal set is one tap on prefilled load/reps, steppers and a typed "22,5" adjust it, the last result is shown inline, the rest timer runs from a saved end time with beep/vibration and the screen stays awake, and finishing shows loads per exercise plus "Recorde!" rows that ignore warm-up and calibration.**

## Accomplishments

- `src/ui/workout.js` rebuilt: overview chips (work sets done / planned), exercise name linking to `#/exercicio/<id>`, "Série N de M", load stepper with a text input (`inputmode=decimal`, comma accepted), reps stepper (5 s steps for timed exercises), "anterior: 20 kg × 10" line, per-set rows (work, warm-up, ramp), feel chips after the last planned set, "Desfazer última série" (no confirmation), warm-up card on the first exercise.
- `src/actions/workout.js`: `adjustLoad`, `setLoad`, `adjustReps`, `setFeel`, `undoLastSet`, `logWarmup`, `skipRest`, all `mutate()` calls (10 in the file); `startWorkout` stores `incrementKg` and `type`; `logSet` writes `restEndsAt` in the same put as the set.
- `src/domain/{draft,timer,records}.js`: pure helpers (undo, warm-up sets, rest-time math, PR detection).
- `src/platform/device.js`: feature-detected wake lock (re-requested on `visibilitychange`), vibration and a two-tone beep that needs `unlockAudio()` inside a tap.
- `src/ui/summary.js`: duration, work-set count, loads per exercise ("30 kg × 12, 12, 11"; time: "30 s, 35 s"), `Recorde!` rows with the previous best.
- Plan 01-04 files untouched (today.js, app.js, plan.js, exercises.js, styles.css); the 093cdfe goal/month-step/Settings card are intact.

## Verification

```
$ node --test                       -> tests 50, pass 50, fail 0   (logging.test.js: 12)
$ node tools/smoke.mjs
PASS 01-core-loop
PASS 02-library
PASS 03-logging
PASS 04-summary-pr
smoke: 4 passed, 0 failed
$ node tools/stamp-sw.mjs --check   -> sw.js em dia (29 files)
```

Acceptance greps: `mutate(` 10, `load-plus` 1, `data-feel` 1, `undoLastSet` 1, `'warmup'` 2, `restEndsAt` 5, `wakeLock` 2, `visibilitychange` 1, `requestWakeLock` (ui) 2, `detectPRs` (summary) 2, `Recorde!` 1, `length < 2` (records) 1.

## Deviations from Plan

**1. [Rule 1 - Bug] Timer text empty on first paint** - the first `update()` ran before the screen was mounted, saw `isConnected === false` and stopped the interval without painting. Split into `paint()` (draws text, runs the alert logic) and `update()` (connection check, then paint); the first call is `paint()`.

**2. [Process] 03-logging built in two steps** - Task 1 committed with the E2E up to undo, Task 2 added the rest-timer assertions to the same scenario, as the plan describes. Tests were written before the modules (RED by import failure) without a separate RED commit.

**3. [Process] sw.js re-stamped** in each task commit because new app files were added (28 then 29 files); version stays 0.1.0 (the bump is 01-06's job).

Otherwise the plan was executed as written.

## Pending Human Checks

- Phone (after 01-06 publishes): start a workout, log a set and leave the screen untouched during the rest (screen must stay on, beep + vibration at 0:00, "Descanso terminou — próxima série!"). Then lock the screen during a rest for ~30 s and unlock: the timer must show the right remaining time or "Descanso terminou há N s" with one vibration. TREINO-05 and TREINO-06 stay unchecked in REQUIREMENTS.md until this passes.
- Feel the one-handed ergonomics of the steppers and the "Concluir série" bar on the real phone.

## Known Stubs

None.

## Threat Flags

None. T-01-09 mitigated (`parseDecimal` only, invalid value reverts, load clamped at 0 and rounded to 2 decimals, race covered by E2E), T-01-10 mitigated (every device API feature-detected in try/catch), T-01-11 mitigated (PRs derived on read from work sets only, first two sessions skipped), T-01-SC mitigated (no installs).

## Self-Check: PASSED

All created files exist; commits 14b2b2d, 365b603 and 4057935 are ancestors of HEAD.

## Ajustes do usuário (pós 01-05)

Cinco ajustes pedidos no chat depois do 01-05, um commit cada (versão segue 0.1.0; calibração/publicação ficam no 01-06):

1. **Fundo preto neutro**: `--bg #000000`, superfícies `#121212`/`#1f1f1f`, texto e cinza neutros (sem tom azul-ardósia), acento verde mantido; `manifest.webmanifest` e `<meta theme-color>` em `#000000`; ícones regenerados com fundo preto (`tools/make-icons.mjs`).
2. **Data na tela Hoje** (`data-role="date"`, ex.: "Quarta, 18 de novembro", `src/ui/datefmt.js`, relógio só na camada de UI) e a data do treino no resumo.
3. **"Esta semana ●●○ 2 de 3"** (`data-role="week"`): contagem de treinos concluídos de segunda a domingo pela data local (`src/domain/week.js`, `test/week.test.js`), meta 3; acima de 3 todos os pontos ficam cheios com a contagem real.
4. **Alternativa por exercício**: campo `alternative` nos 15 exercícios (de TRAINING-SCIENCE 2.2/2.3), mostrado na tela do exercício como "Não tem essa máquina ou está ocupada? Use: …" (`data-role="alternative"`); `test/catalog.test.js` e e2e 02 exigem.
5. **Treino curto (dia corrido)**: botão `data-action="start-short"` na tela Hoje (sem rascunho aberto) inicia o mesmo treino só com os 4 primeiros itens (`SHORT_ITEMS`, `workoutItems` em `src/data/program.js`); rascunho/sessão guardam `short: true`; "Exercício N de 4"; ao finalizar conta como concluído (`isComplete` em `src/domain/draft.js`: curto vale com pelo menos 1 exercício feito; completo segue a regra dos 70%), avança A/B e conta na semana; título do resumo "Treino curto: …". Histórico dos exercícios fora do treino curto não é tocado. Cobertura: `test/short.test.js` e `tools/e2e/05-short-workout.mjs`.
