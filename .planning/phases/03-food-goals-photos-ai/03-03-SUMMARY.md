---
phase: 03-food-goals-photos-ai
plan: 03
subsystem: ai-report-alarm-release
tags: [ai-report, clipboard, ics, alarm-guide, release, publish]
status: complete

requires: ["03-02"]
provides:
  - "src/domain/report.js: buildReport (pure, no name input), REPORT_QUESTION"
  - "src/ui/report.js: #/relatorio with Copiar texto (clipboard, select fallback) and Compartilhar"
  - "src/domain/reminder.js: cleanTime, icsText, buildIcs, DEFAULT_REMINDER_TIME, ICS_FILE_NAME"
  - "src/ui/reminder.js: #/lembrete with 3 illustrated Clock steps and the daily .ics download"
  - "Config cards 'Relatorio para IA' and 'Lembrete matinal'; version 0.5.0 live"
affects: []

requirements-completed: [IA-01, META-04]

actuals:
  tokens: 40000
  tasks: 3
  commits: 3
plan_head_before: fb060d6b769d18a08880f772d78f18e5dbd93ba4
plan_head_after: 9a3243c37d3608257ea0f6bb065845ec53dbc3f8

key-files:
  created:
    - src/domain/report.js
    - test/report.test.js
    - src/ui/report.js
    - src/domain/reminder.js
    - test/reminder.test.js
    - src/ui/reminder.js
    - tools/e2e/15-report-alarm.mjs
  modified:
    - src/app.js
    - src/ui/settings.js
    - styles.css
    - KIT-SOCORRO-IA.md
    - src/version.js
    - sw.js

key-decisions:
  - "buildReport has no name parameter at all, so the profile name cannot leak; a test passes name fields and proves they are ignored"
  - "The report covers all history per exercise through exerciseLog (the same rows as the History screen); frequency counts completed workouts only"
  - "The .ics uses a floating local DTSTART (no time zone), SUMMARY Treino, RRULE:FREQ=DAILY, VALARM at the start; download only, no share"
  - "Nothing is scheduled and no notification permission is requested (E2E asserts Notification.permission stays 'default')"
  - "Main was fast-forwarded to the phase branch (never forced); the docs commit stays on the phase branch only"

duration: ~40min
completed: 2026-11-18
---

# Phase 3 Plan 3: AI report, alarm guide and release 0.5.0 Summary

Config now opens a plain pt-BR "Relatório para IA" (frequency, first -> last best set per exercise, weight, goal, waist, sleep/energy, protein vs target, and a ready question) that copies in one tap or shares, with no name, key or network call; a "Lembrete matinal" screen shows three illustrated steps for a repeating "Treino" alarm in the Android Clock and downloads a daily .ics with an alarm at a remembered time; 0.5.0 is live.

## What was built

- **Task 1 (tracer), commit 8ab0c79:** `buildReport` (13 tests) and `#/relatorio`. Copy uses `navigator.clipboard`, falls back to select + `execCommand('copy')`, and tells the user to copy by hand when both fail. Share button only when `navigator.share` exists. E2E 15-report-alarm covers content, privacy (no `Ivonilson`, `undefined`, `NaN`; the heavier warm-up never appears), clipboard copy, fallback copy and Voltar. Small CSS added for the textarea and step icon.
- **Task 2, commit f5c0ff3:** `buildIcs` (7 tests: exact lines, CRLF, lines <= 75 bytes, default time) and `#/lembrete` (3 `alarm-step` cards with inline SVG, time field, `Baixar evento de calendário`). E2E: 3 steps and 3 SVGs, Blob `text/calendar` with RRULE, VALARM, SUMMARY and `DTSTART:<today>T064500`, file name `progride-lembrete.ics`, `reminderTime` remembered after reload. Config order: Meu perfil, Meta de treinos, Backup, Relatório para IA, Lembrete matinal, Primeiro dia, Ajuda, Como funciona, Sobre, Zona de perigo.
- **Task 3, commit 9a3243c:** KIT-SOCORRO-IA.md lists protein, report, reminder, goals files and four new table rows (docs test passes); `APP_VERSION` 0.5.0; sw.js re-stamped (54 files, no `skipWaiting`).

## Verification (exact)

- `node tools/stamp-sw.mjs --check`: `sw.js em dia` (after `sw.js v0.5.0 com 54 arquivos`)
- `node --test`: tests 185, pass 185, fail 0
- `node tools/smoke.mjs`: `smoke: 16 passed, 0 failed` (no flake, no rerun)
- Greps: `'#/relatorio'` and `'#/lembrete'` in app.js = 1 each; `apikey|api_key|generativelanguage` in report.js = 0; `showTrigger|TimestampTrigger|PushManager` in src = 0 files; `innerHTML` in src = 0; `skipWaiting` in sw.js = 0
- No headless Chrome left running.

## Publish

- Commit range: `19c688f..9a3243c` on origin/main (fast-forward: `git checkout main && git merge --ff-only gsd/phase-03-food-goals-photos-ai && git push origin main`, then back to the phase branch). `git rev-parse main` = branch = `9a3243c37d3608257ea0f6bb065845ec53dbc3f8` right after the publish.
- Pages build sequence: `building 9a3243c` then `built 9a3243c`.
- Live: `https://marques10604.github.io/academia/src/version.js` -> `export const APP_VERSION = '0.5.0';`; live sw.js line 1 -> `const VERSION = '0.5.0';`; the four new modules (report and reminder, ui and domain) return HTTP 200.

## Deviations from Plan

**1. [Process] Task 1 and Task 2 implementations were written before their unit tests**
- The plan asks for tests first (RED). report.js and reminder.js were written first and the tests right after, so no failing run was captured; the tests were then run green against the exact behavior lines of the plan.

**2. [Process] The docs commit (this SUMMARY, STATE, ROADMAP, REQUIREMENTS) is on the phase branch only**
- Publishing happened before the docs commit so that `main` equals the branch at the released code, as the acceptance criterion states.

Otherwise the plan was executed as written. No auth gates. Tracer gate: `<verify>` (report unit tests + 15-report) re-run and passed before expanding.

## Known Stubs

None.

## Threat Flags

None. T-03-05 (ics tampering): every value is fixed text, a strict HH:MM, a date or a timestamp, escaped by `icsText`, pinned by unit tests. T-03-06 (disclosure): no name input, nothing sent automatically. T-03-07 (release): stamp check, unit and E2E gates, no forced activation, ff-only merge, live version and sw.js verified.

## Teste no celular (pendente, não bloqueia)

1. Atualizar: feche e abra o app duas vezes; Config -> Sobre mostra 0.5.0.
2. Hoje -> "Anotar": somar porções com uma mão; o total e a barra cinza fazem sentido.
3. Config -> "Meta de treinos" e a sequência na tela Hoje.
4. Corpo -> "Meta de peso" e "Fotos de progresso" legíveis no fundo preto.
5. Config -> "Criar lembrete matinal": criar o alarme Treino no Relógio seguindo os 3 passos; baixar o .ics, abrir pelos Downloads e ver se a Agenda do Google cria o evento diário e avisa.
6. Config -> "Gerar relatório para IA" -> "Copiar texto" e colar no ChatGPT ou Gemini; "Compartilhar" abre a lista do Android.
7. Modo avião: Proteína, Relatório e Lembrete abrem sem internet.

## Self-Check: PASSED

Files found: src/domain/report.js, src/ui/report.js, src/domain/reminder.js, src/ui/reminder.js, test/report.test.js, test/reminder.test.js, tools/e2e/15-report-alarm.mjs. Commits in HEAD ancestry: 8ab0c79, f5c0ff3, 9a3243c.
