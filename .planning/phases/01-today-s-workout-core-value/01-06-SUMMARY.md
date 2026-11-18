---
phase: 01-today-s-workout-core-value
plan: 06
subsystem: calibration-and-release
tags: [calibration, ramp-sets, rir, increments, release, service-worker]
status: complete

requires: ["01-04", "01-05"]
provides:
  - "Guided calibration ramp: sets of 10, 'Quantas repetições ainda sobravam?', next ramp load or working load (calibrationStep)"
  - "Phase badge and expected effort on the workout card"
  - "Per-exercise load increment chips (exercisePrefs) used by Today, startWorkout and the +/- steppers"
  - "Version 0.2.0 with the service worker re-stamped (31 assets)"
affects: []

actuals:
  tokens: 6500
  tasks: 2
  commits: 3
plan_head_before: bbc34e98c055da8475ead90e3d4594b9daf9404a
plan_head_after: 27276aa9621b43460efddd8a131f62f27b4165ce

tech-stack:
  added: []
  patterns:
    - "Ramp sets are kind 'ramp' with an rir field; history, records and the 70% rule only read kind 'work'"
    - "Every new workout action (logRampSet, answerRamp) is a mutate() call, so taps persist in order"
    - "Increment choices come from fixed chip lists, never free text"

key-files:
  created:
    - tools/e2e/05-calibration.mjs
  modified:
    - src/domain/progression.js
    - test/progression.test.js
    - src/actions/workout.js
    - src/ui/workout.js
    - src/ui/exercise.js
    - src/version.js
    - sw.js
    - tools/e2e/01-core-loop.mjs

key-decisions:
  - "Ramp set rows read 'Rampa N: 20 kg × 10 · sobravam 4+' (replaces the 'Série de ajuste' placeholder text from 01-05)"
  - "logSet always ends calibration, so the user can skip the ramp at any time with 'Concluir série'"
  - "An increment change applies to the next workout started; a draft already in progress keeps its own incrementKg"
  - "Workout entries from 0.1.0 drafts have no phase: the phase badge and effort line are simply not shown"

requirements-completed: [CARGA-01, CARGA-06, PROG-05, TREINO-07, FUND-03]

coverage:
  - id: D1
    description: "calibrationStep: rir 4+ raises by max(increment, 15% rounded), 3/2 keeps, 1/0 steps back one increment (never to zero), at most 4 ramp sets"
    requirement: CARGA-01
    verification:
      - kind: unit
        ref: "node --test test/progression.test.js (5 calibrationStep cases)"
        status: pass
  - id: D2
    description: "Ramp flow in the workout: log-ramp, 5 rir chips, next load, working load banner, ramp sets not history or records"
    requirement: CARGA-01
    verification:
      - kind: e2e
        ref: "node tools/smoke.mjs 05-calibration (part 1; leg press shows 'treino 2 de 2' after the workout)"
        status: pass
  - id: D3
    description: "Phase badge and effort line on the workout card"
    requirement: PROG-05
    verification:
      - kind: e2e
        ref: "node tools/smoke.mjs 05-calibration ([data-role=phase] and [data-role=effort] present)"
        status: pass
  - id: D4
    description: "Increment chip saves exercisePrefs; next workout's stepper moves by 2,5"
    requirement: CARGA-06
    verification:
      - kind: e2e
        ref: "node tools/smoke.mjs 05-calibration (part 2)"
        status: pass
  - id: D5
    description: "0.2.0 stamped with the full precache list; sw.js VERSION equals APP_VERSION"
    requirement: FUND-03
    verification:
      - kind: unit
        ref: "node tools/stamp-sw.mjs --check and node --test (assets.test.js)"
        status: pass
---

# Phase 1 Plan 6: Calibration ramp, increments and release 0.2.0 Summary

**Guided calibration ramp ("Quantas repetições ainda sobravam?") that finds the starting load of each exercise, a per-exercise increment setting, and the 0.2.0 release with a fully re-stamped service worker.**

## What was built

- `calibrationStep` in `src/domain/progression.js` with `RULES.MAX_RAMP_SETS = 4` and `RULES.RAMP_STEP_PCT = 0.15`. 5 unit cases, written first (RED: missing export) and then implemented.
- `startWorkout` stores `phase` and `calibrating` per entry (plank and crunch never ramp). New `logRampSet` and `answerRamp`; `logSet` ends calibration.
- Workout screen: phase badge and effort line, a "Calibração" card (ramp button or the 0-4+ question), `Rampa N` rows and the "Sua carga de trabalho" banner. Units now come from `loadText`.
- Exercise screen: "Incremento de carga" chips (1, 2, 2,5, 5, 10 kg; 5, 10 s for time exercises; the current value is added if it is not in the list).
- E2E `05-calibration` (ramp flow plus increment preference).
- Release: `APP_VERSION` 0.2.0, `node tools/stamp-sw.mjs` (31 assets, includes progression, reasons, draft, timer, records, device, exercise).

## Deviations from Plan

**1. [Rule 1 - Bug] E2E 01-core-loop hardcoded "Versão do app: 0.1.0"**
- **Found during:** Task 2 (version bump)
- **Fix:** the test imports `APP_VERSION` from `src/version.js`, so future bumps do not break it.
- **Files modified:** tools/e2e/01-core-loop.mjs
- **Commit:** 27276aa

**2. [Rule 1 - Bug] Drafts started under 0.1.0 have no `phase`**
- **Fix:** the badge and effort line render only when `entry.phase` exists (no `badge-undefined`). A 0.1.0 draft still works.

**3. Increment preference timing (clarification, not a bug).** The new increment applies to the next workout started. Today and `startWorkout` already read `exercisePrefs`, so no extra wiring was needed.

**4. Publish steps.** The plan said `git push origin main`; the orchestrator instruction replaced it with a ff-only merge of the phase branch into main plus push (see the report returned to the orchestrator for the result).

## Known Stubs

None.

## Threat Flags

None. No new network endpoints or storage beyond `exercisePrefs` (fixed numeric values).

## Teste no celular (pendente)

Celular Android com o app instalado em https://marques10604.github.io/academia/ (versão 0.1.0 instalada antes):

1. **Atualização:** abra o app. Em Config deve continuar 0.1.0 enquanto ele está aberto. Feche o app de verdade (arraste para fora dos recentes), abra de novo e, se preciso, feche e abra mais uma vez. Em Config deve aparecer 0.2.0. Nunca deve mudar com o app em uso.
2. **Offline:** ligue o modo avião, feche o app e abra de novo. Faça o Treino A inteiro: responda "Quantas repetições ainda sobravam?" no primeiro exercício, use − e +, digite uma carga com vírgula (ex: 22,5), deixe um descanso terminar (deve vibrar e tocar o bipe), marque "No ponto", desfaça uma série e finalize. O resumo deve mostrar duração, séries e cargas, e os passos e erros comuns dos exercícios devem abrir sem internet.
3. **YouTube:** com a internet ligada, no próximo treino abra um exercício, toque em "Ver vídeo no YouTube", assista alguns segundos e volte ao app. Deve voltar ao mesmo exercício com todas as séries registradas (retoma de onde parou, mesmo se o Android recarregar o app).
4. **Incremento:** abra um exercício, escolha 2,5 kg em "Incremento de carga" e inicie um novo treino: no treino, + e − devem andar de 2,5 em 2,5 kg.
5. **Tela ligada:** durante o treino a tela não deve apagar ("Tela ligada durante o treino").
6. **Instalar (FUND-01):** se ainda não instalou, menu do Chrome, "Adicionar à tela inicial", e abra pelo ícone (sem barra de endereço).

Itens de requisito ainda pendentes só por causa do aparelho: FUND-01 (instalação), TREINO-05 (bipe/vibração), TREINO-06 (tela ligada).

## Self-Check: PASSED

- Files present: tools/e2e/05-calibration.mjs, src/domain/progression.js, src/ui/exercise.js, sw.js (VERSION 0.2.0).
- Commits present: 61b9b9c, ef835c5, 27276aa.
- `node --test`: 61 pass, 0 fail. `node tools/smoke.mjs`: 6 passed, 0 failed. `node tools/stamp-sw.mjs --check`: sw.js em dia.

## Ajustes 0.2.1

Lote ad-hoc pedido e aprovado pelo usuario no chat (sem PLAN.md), apos a verificacao da Fase 1. Tudo opcional: kg continua o padrao e nada muda sem o usuario escolher.

1. **Unidade da carga "kg" ou "placa" por exercicio** (commit 0885d61). So para maquinas/polias com pino: Puxada frontal, Mesa flexora, Panturrilha em pe, Remada baixa, Voador e Triceps na polia (campo `selectorized` em src/data/exercises.js; leg press, halteres e peso do corpo/tempo ficam de fora). Escolha na tela do exercicio ("Unidade da carga: kg | placa", com a linha de ajuda), salva em `exercisePrefs.unit`. Com "placa": cargas inteiras, passo de 1 placa, calibracao comeca na placa 3, e todos os textos dizem "placa N" (Hoje, carga e passos do treino, "anterior", motivo "suba para placa 6", resumo e recordes). A matematica da progressao nao mudou. Trocar a unidade com historico pede "Trocar a unidade recomeca a calibracao deste exercicio" e recomeca a calibracao (`unitChangedAt`; o historico e os recordes so consideram sessoes da mesma unidade). Registros e treinos da 0.2.0 (sem `unit`) continuam valendo como kg. Testes: test/units.test.js (10) e tools/e2e/06-unit-placa.mjs.
2. **Nota "Minha regulagem" por exercicio** (commit 29b4ec5). Campo de texto (ate 3 linhas / 120 caracteres) na tela do exercicio, salvo em `exercisePrefs.note` ao sair do campo; aparece no topo do exercicio no treino e abaixo do exercicio em Hoje quando preenchida (`data-role="setup-note"`), sempre como texto (nunca HTML). A gravacao das preferencias passou a mesclar o registro (src/data/prefs.js), entao incremento, unidade e nota nao se sobrescrevem. Testes: test/note.test.js (4) e tools/e2e/07-setup-note.mjs.
3. **Correcao da verificacao** (commit 5b33ebb). O toque em "Feito" do aquecimento agora chama `unlockAudio()` como os outros toques de serie, para o primeiro bipe de descanso nao ficar mudo.
4. **Versao 0.2.1** (src/version.js) e `node tools/stamp-sw.mjs` (sw.js re-carimbado).

Portoes: `node --test` (75 passam), `node tools/smoke.mjs` (8 passam), `node tools/stamp-sw.mjs --check` (sw.js em dia).
