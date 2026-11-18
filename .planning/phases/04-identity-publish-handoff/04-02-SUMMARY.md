---
phase: 04-identity-publish-handoff
plan: 02
subsystem: handoff-and-release
tags: [manual, rescue-kit, readme, settings-help, release-0.4.0, github-pages]
status: complete

requires: ["04-01"]
provides:
  - "KIT-SOCORRO-IA.md: ready prompt for free ChatGPT/Gemini (stack, file map, 8 rules), bug recipe with screen-to-file table, apply-and-publish summary, optional Node tests"
  - "MANUAL.md: no-programming guide with exact github.com clicks (backup, publish, version bump with sw.js last, what if forgotten, new file, undo, exercises, restore, do-not list)"
  - "README.md front page; Config 'Precisa de ajuda?' card (kit + manual links on github.com), 'Checklist do 1º dia na academia' button, Progride brand in 'Sobre'"
  - "test/docs.test.js: guides cannot drift (paths exist, quoted app labels exist in src/ui, Settings URLs exact)"
  - "sw.js precache with cache 'reload'; release 0.4.0 live at https://marques10604.github.io/academia/"
affects: []

requirements-completed: [LANC-02, LANC-03, LANC-04, LANC-05, LANC-01]

actuals:
  tokens: 30000
  tasks: 3
  commits: 3
plan_head_before: 75f543a2b466ac43c3265af8d322c64b79be210a
plan_head_after: 2de5e3c762053b73579078eed7497443f633020f

key-files:
  created:
    - KIT-SOCORRO-IA.md
    - MANUAL.md
    - README.md
    - test/docs.test.js
    - tools/e2e/12-help.mjs
  modified:
    - src/ui/settings.js
    - src/ui/backup.js
    - src/version.js
    - sw.js

key-decisions:
  - "Guides follow the CURRENT UI (bottom tab bar, card-organized Config, no onboarding form), not the older plan text"
  - "Docs test checks plain 'dir/file.ext' mentions too (the AI prompt's file map is not backticked), so a made-up example path in a guide fails the test"
  - "sw.js install precaches with new Request(url, {cache: 'reload'}) so GitHub Pages' 10-minute HTTP cache cannot put stale files into a fresh version; the manual needs no 'wait 10 minutes' rule"
  - "No forced activation (no skipWaiting): a new version still waits for every app window to close"

duration: ~45min
completed: 2026-11-18
---

# Phase 4 Plan 2: Handoff guides, Config help and release 0.4.0 Summary

KIT-SOCORRO-IA.md (free-AI rescue kit) and MANUAL.md (no-code maintenance guide) are written in simple pt-BR and linked from Config; the docs test keeps them honest; version 0.4.0 (Progride identity, tab bar, dashboard, checklist, help card) is live at the permanent URL.

## What was built

- **Task 1 (tracer), commit 8fe8ce7:** KIT-SOCORRO-IA.md with the four required sections (prompt to paste with stack, file map and rules; how to describe a bug plus a screen-to-file table and how to copy a file with "Copy raw file"; apply-and-publish summary pointing to the manual; optional Node tests). Config help card with a button opening the kit on github.com (`target _blank`, `rel noopener noreferrer`). docs test + E2E 12-help.
- **Task 2, commit 952d047:** MANUAL.md (seven exact sections), README.md, share title 'Backup do app Progride' (BACKUP_APP stays 'academia'), docs test extended to the manual (paths, labels, headings), README and the manual link in Config.
- **Task 3, commit 2de5e3c:** sw.js precache with `cache: 'reload'`, APP_VERSION 0.4.0, stamp-sw (47 files), all gates, fast-forward publish.

## Verification (exact)

Before publishing and again on the branch after returning from main (same commit, tree clean of code changes):

- `node tools/stamp-sw.mjs --check`: `sw.js em dia`, exit 0
- `node --test`: tests 131, pass 131, fail 0
- `node tools/smoke.mjs`: PASS 01 ... 11, PASS 12-help, `smoke: 13 passed, 0 failed`
- Guards: `skipWaiting` in sw.js 0, `innerHTML` in src 0 files, `BACKUP_APP = 'academia'` 1

## Publish

- `git checkout main && git merge --ff-only gsd/phase-04-identity-publish-handoff && git push origin main && git checkout gsd/phase-04-identity-publish-handoff`: fast-forward `bea1cb2..2de5e3c`, back on the phase branch.
- Pages build: `building`, `building`, `built` (commit 2de5e3c) in about 30 s.
- Live checks: `src/version.js` = `APP_VERSION = '0.4.0'`; manifest `"name": "Progride"`, `"short_name": "Progride"`, `"id": "academia"` (unchanged); `sw.js` line 1 `VERSION = '0.4.0'`; `icons/maskable-512.png` HTTP 200; KIT-SOCORRO-IA.md on github.com HTTP 200; MANUAL.md HTTP 200.
- LANC-02 evidence: `gh api repos/Marques10604/academia/pages` prints `https://marques10604.github.io/academia/`, `main`, `/`.

## Deviations from Plan

**1. [UI changed after the plan] Config layout follows the current card UI.** The plan put the brand row in "the first card" and a Settings topbar link. Now: brand row (logo + 'Progride') in the 'Sobre' card above 'Versão do app'; the first-day checklist button sits in its own card 'Primeiro dia na academia' (between Backup and help); the placeholder 'Ajuda' card became 'Precisa de ajuda?' with the kit and manual buttons. The guides say "Config → Backup e restauração", "aba Config (de baixo)", and the kit's bug template says "Versão do app (Config → Sobre)". E2E 11's "last card above the tab bar" still holds (Zona de perigo is last).
**2. [Docs test stricter than planned]** It also extracts plain `dir/file.ext` mentions, not only backticked ones (the kit's prompt map is plain text). It caught a made-up example path in the manual (`src/ui/nome.js`), replaced by `pasta/arquivo-novo.js`.
**3. [Task split]** `src/ui/settings.js` was edited once for Tasks 1 and 2 (help card, manual link, brand, checklist button all landed in the Task 1 commit 8fe8ce7). The docs test skipped MANUAL.md/README.md paths in that commit, then the skip was removed in Task 2.
**4. [Docs commit]** SUMMARY/STATE/ROADMAP/REQUIREMENTS were committed after the code publish and fast-forwarded to main with the same ff-only procedure so main and the phase branch stay identical.

## Known Stubs

None. (The 'Ajuda' placeholder from 04-01 is now filled.)

## Threat Flags

None new. T-04-04: the kit forbids pasting backup/personal data and a test checks it carries no e-mail or token. T-04-06: Settings links are fixed github.com constants with `target _blank` and `rel noopener noreferrer`, asserted by E2E 12 and the docs test. T-04-07: precache uses `cache: 'reload'`, no skipWaiting. T-04-08: only plain files and .planning/ went to the public repo; no user data in the repo.

## Teste no celular (pendente)

Não bloqueia nada; é a checagem final da fase 4, no Android com Chrome:

1. **Instalar ou atualizar.** Se o app antigo "Academia" já está instalado: faça um backup primeiro (Config → Backup e restauração → Baixar arquivo) e **não desinstale** (desinstalar pode apagar os dados). Abra o app, deslize-o para fora dos recentes e abra de novo, duas vezes: Config → Sobre mostra "Progride" e a versão 0.4.0. O Chrome troca o nome e o ícone da tela inicial sozinho (pode levar até um dia e pedir confirmação: aceite). Se não está instalado: abra https://marques10604.github.io/academia/ → menu ⋮ → "Instalar app" ou "Adicionar à tela inicial".
2. **Tela inicial.** O ícone se chama "Progride", o haltere verde com a seta é reconhecível e não é cortado pela máscara redonda.
3. **Antes de treinar.** Hoje mostra o cartão do resumo e, enquanto nenhum treino foi concluído, "Primeiro dia na academia?"; marque dois itens, feche e abra o app: continuam marcados. Config → "Checklist do 1º dia na academia" abre a mesma lista. As quatro abas de baixo (Hoje, Histórico, Corpo, Config) não cobrem nada e dá para usar o "Concluir série" com uma mão.
4. **Modo avião.** Com o app instalado: modo avião, feche o app, abra pelo ícone e faça um treino completo (iniciar, registrar séries, descanso, finalizar, ver o resumo). Hoje mostra o próximo treino e o Histórico lista este.
5. **Ajuda.** Com internet: Config → "Precisa de ajuda?" → "Abrir kit de socorro" abre o kit no GitHub; "Manual de manutenção" abre o manual.
6. **Backup.** Faça um backup depois dos primeiros treinos reais.
7. **Opcional.** "Apagar tudo e começar do zero" (Config, zona de perigo): os dois avisos aparecem e depois o app volta à tela de boas-vindas. Faça isso uma vez, no fim dos testes, antes de começar a treinar de verdade (faça backup antes se quiser guardar algo).

## Self-Check: PASSED

- FOUND: KIT-SOCORRO-IA.md, MANUAL.md, README.md, test/docs.test.js, tools/e2e/12-help.mjs
- FOUND commits: 8fe8ce7, 952d047, 2de5e3c (ancestors of HEAD, also on origin/main)
