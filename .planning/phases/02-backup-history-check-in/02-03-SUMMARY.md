---
phase: 02-backup-history-check-in
plan: 03
subsystem: morning-check-in-and-body
tags: [check-in, body-weight, moving-average, waist, release-0.3.0]
status: complete

requires: ["02-01", "02-02"]
provides:
  - "src/data/daily.js: listDays, getDay, saveDay (merge; null clears a field) over the dailyLogs store"
  - "src/domain/body.js: pure readOptionalNumber, hasCheckin, averageWeight, movingAverage, weightSeries, waistStatus, waistRows + constants"
  - "#/corpo: morning check-in (weight with comma, sono 1-5, energia 1-5, all optional), weight chart (dots + 7-day average line), waist card every 4 weeks"
  - "Today: 'Check-in da manhã' button or 'Check-in de hoje: ...' line, 'Peso médio (7 dias)' mini dashboard, 'Corpo' nav button"
  - "Version 0.3.0 published to GitHub Pages (41 precached files)"
affects: []

actuals:
  tokens: 30000
  tasks: 3
  commits: 3
plan_head_before: 9af6d9c2efdbcb029370329a60b993f96d527e85
plan_head_after: bea1cb255cf459d6002a62ea3297d07285163a31

tech-stack:
  added: []
  patterns:
    - "Chips toggle their selected class in place (no re-render), so a typed weight is never lost"
    - "The waist card replaces only itself after saving (node.replaceWith), leaving the unsaved check-in untouched"
    - "saveDay merges into the day row: check-in, waist and later fields (protein) never erase each other"
    - "No schema change: dailyLogs already existed from 02-01 and is already in BACKUP_STORES"

key-files:
  created:
    - src/data/daily.js
    - src/domain/body.js
    - src/ui/body.js
    - test/body.test.js
    - tools/e2e/10-checkin.mjs
  modified:
    - src/app.js
    - src/ui/today.js
    - src/version.js
    - sw.js

key-decisions:
  - "Only body weight from the scale is recorded (no body fat / muscle mass), as decided by the user"
  - "Saving the waist never re-renders the whole screen (plan-checker correction): only the waist card is rebuilt"
  - "The average-weight text lives in ui/body.js (avgWeightText) and is reused by Today so both show the same sentence"

requirements-completed: [CORPO-01, CORPO-02, CORPO-05]

duration: ~40min
completed: 2026-11-18
---

# Phase 2 Plan 3: Morning check-in, 7-day average weight, waist, release 0.3.0 Summary

From Today the user records weight (comma or dot), sono and energia in a few taps, sees today's check-in and the 7-day average weight on Today, a weight chart with faint weigh-in dots and the moving-average line plus the waist every 4 weeks on #/corpo; the whole of Phase 2 is live as 0.3.0.

## What was built

- **Task 1 (tracer, a81fd82):** `daily.js` (merge-on-save), pure `readOptionalNumber` / `hasCheckin` / `averageWeight` (TDD), `#/corpo` check-in form, Today check-in line/button, `avg-weight` line and `Corpo` nav button. E2E 10-checkin: only-sleep check-in (no `weightKg` stored), edit with '70,4', invalid 'abc' and '300' leave the row untouched, six seeded days give '70,2 kg · 7 pesagens'.
- **Task 2 (1239a1e):** `movingAverage`, `weightSeries`, `waistStatus`, `waistRows` (TDD), weight card with the chart from 02-02 (`dots` + `line`), waist card ('Hora de medir a cintura' / 'Próxima medida em N dias', rows with change and the average weight of that date). E2E: 1 `svg.chart`, 7 `circle.chart-raw`, 1 `path.chart-line`; waist 82,5 gives 'peso médio 70,2 kg' and 'Próxima medida em 28 dias'; a waist 30 days older shows '(−0,5 cm)' on the newer row.
- **Task 3 (bea1cb2):** `APP_VERSION` 0.3.0, `stamp-sw` re-stamped (41 files, including backup, progress, chart, history, daily, body), all gates, ff-only publish.

## Verification (final run, on the branch after publishing)

- `node --test`: tests 117, pass 117, fail 0
- `node tools/smoke.mjs`: PASS 01-core-loop, 02-library, 03-logging, 04-summary-pr, 05-calibration, 05-short-workout, 06-unit-placa, 07-setup-note, 08-backup, 09-history, 10-checkin; `smoke: 11 passed, 0 failed`
- `node tools/stamp-sw.mjs --check`: `sw.js em dia`, exit 0
- Guards: `innerHTML` files in src = 0; sw.js lists `./src/ui/body.js` and `./src/data/daily.js`.

## Publish

- `git checkout main && git merge --ff-only gsd/phase-02-backup-history-check-in && git push origin main && git checkout gsd/phase-02-backup-history-check-in`: fast-forward `bf0f95c..bea1cb2`, no force.
- `gh api repos/Marques10604/academia/pages/builds/latest --jq .status`: `building`, then `built` (about 20 s).
- `curl https://marques10604.github.io/academia/src/version.js`: `export const APP_VERSION = '0.3.0';` (grep count 1); live `sw.js` starts with `const VERSION = '0.3.0';`.
- The docs commit for this plan (SUMMARY/STATE/ROADMAP/REQUIREMENTS) stays on the phase branch; it reaches `main` with the next publish.

## Deviations from Plan

**1. [Plan-checker correction 1] Waist save does not re-render the screen.** The plan said `await rerender()`, which would discard an unsaved check-in. Only the waist card is rebuilt in place; the 10-checkin E2E types a weight (71,9) and picks sono 2 without saving, saves the waist, and asserts the field, the chip and the stored row (weight still 70,4) are unaffected.

**2. [Plan-checker correction 2] Publish check polls the Pages build first**, then curls `version.js` (done as described above).

**3. [Minor] Save button of the check-in sits in the bottom bar** (the screen now has three cards), and Today reuses `avgWeightText` from `ui/body.js`.

Otherwise the plan was executed as written.

## Known Stubs

None.

## Threat Flags

None beyond the plan's threat model (T-02-07: parseDecimal only, weight 30-250, waist 40-200, ratings only from the 1-5 chips, invalid input saves nothing; T-02-08: explicit-path staging, no user data in the repo; T-02-09: stamp-sw --check and the VERSION test gate the release, no forced activation).

## Teste no celular (pendente)

Checklist de toda a Fase 2, no Android com o app instalado a partir de https://marques10604.github.io/academia/ (versão 0.2.x). Não bloqueia nada.

1. **Atualização:** abra o app; a Config ainda mostra a versão antiga enquanto ele está aberto. Feche o app (deslize nos recentes) e abra de novo (uma segunda vez se precisar): a Config mostra 0.3.0. A versão só muda depois de fechar e abrir, nunca durante o uso.
2. **Check-in:** Hoje -> "Check-in da manhã". Digite o peso com a vírgula do teclado do celular (ex: 70,4), toque em sono e energia, salve. Cronometre: deve levar poucos segundos. Hoje mostra "Check-in de hoje: 70,4 kg · sono N · energia N" e "Peso médio (7 dias)".
3. **Corpo:** abra "Corpo". O gráfico de peso e o cartão da cintura ficam legíveis no fundo preto e cabem na largura. Digite um peso sem salvar, salve a cintura (ex: 82,5): o peso digitado continua no campo.
4. **Histórico:** Hoje -> Histórico -> abra um treino e volte; abra um exercício com 2 ou mais treinos (gráfico legível, datas, cargas em kg ou placa certas); na tela de um exercício toque em "Ver histórico e gráfico".
5. **Offline:** modo avião, feche o app e abra de novo: Hoje, Histórico, o histórico de um exercício com gráfico, Corpo e Backup abrem.
6. **Backup (todos os dados atuais são de teste):** Config -> "Backup e restauração" -> "Enviar (Drive, WhatsApp…)" e mande para você no WhatsApp (a lista deve mostrar Drive e WhatsApp); depois "Baixar arquivo" (cai em Downloads). Selecione o .json baixado e o .txt do WhatsApp no seletor de arquivos: nenhum deve aparecer cinza, a linha de resumo mostra os treinos e datas certos, e "Cancelar" não muda nada.
7. **Restaurar:** com o arquivo baixado, Chrome -> Configurações do site -> limpar dados de marques10604.github.io; abra o app -> "Já tenho um backup — restaurar" -> escolha o arquivo -> confirme. Treinos, cargas, check-ins e configurações voltam.

## Self-Check: PASSED

- Files exist: src/data/daily.js, src/domain/body.js, src/ui/body.js, test/body.test.js, tools/e2e/10-checkin.mjs
- Commits exist: a81fd82, 1239a1e, bea1cb2
