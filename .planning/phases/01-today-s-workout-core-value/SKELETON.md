# Walking Skeleton — Sistema Academia

**Phase:** 1
**Generated:** 2026-11-18

## Capability Proven End-to-End

On the installed app at https://marques10604.github.io/academia/, the user opens Today, taps "Iniciar treino" on Treino A, logs a set that is written to IndexedDB at once, reloads, finds the workout where he left it, finishes, and sees Treino B as the next workout.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| UI layer | Vanilla ES modules plus one small `h()` helper (`src/ui/dom.js`). No Preact, no htm, no import map | Planner's choice, which the user allowed ("vanilla if simpler"). There is no third-party code, so nothing to vendor, no `npm pack`, no package-legitimacy gate and nothing that rots. `h()` builds nodes with `createElement` and text nodes only, so text is never parsed as HTML. The usual vanilla risk is input focus lost on re-render. It is avoided here: the rest timer updates one text node, and the load field and the +/− steppers update their own nodes in place (no screen re-render on change or stepper taps). |
| Build | None. The repo root is the published site. `node` is used only for dev tools (`tools/*.mjs`) and tests | Toolchain rot is the top maintenance risk once Claude access ends (STACK.md) |
| Data layer | Raw IndexedDB behind `src/data/db.js`. DB name `academia`, one `SCHEMA_VERSION` integer, stores `settings`, `sessions`, `active`, `exercisePrefs`. Upgrades only create stores that are missing (no migration framework) | User's lean rule. All data before the Phase 4 final install is disposable (STATE.md) |
| Source of truth | Completed `sessions` are the history. Next workout, suggested load, phase and PRs are pure functions in `src/domain/*`. The in-progress workout is a write-through draft at `active/current`, saved on every set and swapped for a session in one transaction when finished | Avoids state repair after reloads and imports (ARCHITECTURE.md patterns 1 and 2) |
| Draft writes | Every read-modify-write of the in-progress draft runs through one promise queue (`queue` / `mutate` in `src/actions/workout.js`) | Double taps and a typed load followed by a +/− tap never lose an update (proven by E2E steps in 01-01 and 01-05) |
| Domain contract | `planExercise({item, exercise, history, incrementKg, today})` returns `{exerciseId, sets, repMin, repMax, restSec, load, targetReps, phase, mode, reasonCode, reasonParams, incrementKg}`. Today and Workout read only this. Progression (01-04) and calibration (01-06) change what it returns inside, never its shape | Lets 01-04 (progression) and 01-05 (logging UX) run in parallel |
| Routing | Hash routes: `#/inicio`, `#/hoje`, `#/treino`, `#/resumo/<id>`, `#/config`, `#/exercicio/<id>` | GitHub Pages has no SPA fallback |
| Offline / updates | Hand-written `sw.js`: one `VERSION` constant (copied from `src/version.js` by `tools/stamp-sw.mjs`), atomic precache of the shell, cache-first, navigation served by the cached `index.html`, old `academia-*` caches deleted on activate. A new worker waits until every window is closed and never takes over an open app | FUND-03 under the lean rule. A new version only applies after the app is fully closed and reopened |
| Deployment target | GitHub Pages, deploy from branch `main`, root folder, `.nojekyll`. URL `https://marques10604.github.io/academia/`, all paths relative | Permanent origin (PROJECT.md: decided). Free hosting with no CI |
| Auth | None. Single user, no server | Out of scope (PROJECT.md) |
| Testing | `node --test` (no deps) for `src/domain/*`. `node tools/smoke.mjs [filter ...]` serves the repo on 127.0.0.1 and drives headless Chrome over the DevTools protocol (Node's built-in WebSocket). Every run uses a fresh profile. Scenarios live in `tools/e2e/*.mjs`; plans in a parallel wave run only their own scenarios, the last wave runs all | Real IndexedDB, service worker and UI clicks get tested with zero dependencies |
| Directory layout | `index.html`, `styles.css`, `sw.js`, `manifest.webmanifest`, `icons/`, `src/{app.js, version.js, ui/, actions/, domain/, data/, platform/}`, `test/`, `tools/` | ARCHITECTURE.md layout, flattened (no `store.js`: actions read and write the `active` draft in IndexedDB directly) |
| Style | Dark theme, CSS custom properties, system fonts, tap targets ≥48 px. Every class later plans need is defined once in `styles.css` by 01-02 (wave 1, parallel to the tracer) | Lets later plans add screens without editing a shared file |

## Stack Touched in Phase 1

- [x] Project scaffold: `package.json` with `"type":"module"`, `engines` node >=22 and no dependencies; `node --test`; `node tools/smoke.mjs --serve` for local runs
- [x] Routing: hash router in `src/app.js` with at least `#/hoje` and `#/treino`
- [x] Database: real write (`active` put on every set, `sessions` put on finish) and real read (resume on boot, rotation from `sessions`)
- [x] UI: "Iniciar treino", "Concluir série" and "Finalizar treino" wired to `src/actions/workout.js`
- [x] Deployment: GitHub Pages at https://marques10604.github.io/academia/. Local full-stack run: `node tools/smoke.mjs --serve` then open http://localhost:8080/

## Phase 1 Plan Map

- Wave 1: 01-01 tracer (Today → start → log → write-through → reload resumes) in parallel with 01-02 install shell (styles, manifest, icons, versioned service worker)
- Wave 2: 01-03 finish → summary → rotation, onboarding with medical notice, Settings, service worker registration, publish 0.1.0
- Wave 3: 01-04 exercise library + double progression in parallel with 01-05 live logger (steppers, timer, wake lock, records)
- Wave 4: 01-06 calibration ramp, per-exercise increments, publish 0.2.0, consolidated phone check

## Out of Scope (Deferred to Later Slices)

- Backup export/import, history list, charts, morning check-in (Phase 2)
- Protein, goals, streak, alarm/.ics guide, photos, AI report and Gemini (Phase 3)
- Final app name and logo, maintenance guide (Phase 4). Phase 1 ships a provisional name "Academia" and generated icons
- Exercise swap, short workout version, pain flag, plate calculator (deferred list in REQUIREMENTS.md)
- "Update available" toast or forced-update button, migration framework, backup snapshots (removed by the user's lean rule)

## Subsequent Slice Plan

Each later phase adds a vertical slice on top of this skeleton and keeps the decisions above:

- Phase 2: back up and restore all data (versioned `.json`, share sheet), per-exercise history and charts, workout list, morning check-in. Adds stores by bumping `SCHEMA_VERSION` with create-if-missing upgrades
- Phase 3: protein checklist, weekly goals and streak, morning-alarm guide, progress photos, AI report and in-app Gemini
- Phase 4: final name and logo, permanent-URL install on the real phone, pt-BR maintenance guide
