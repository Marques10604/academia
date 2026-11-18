# Architecture Research

**Domain:** Single-user, offline-first, local-only workout tracker PWA (Android, static hosting, must outlive its original developer)
**Researched:** 2026-11-18
**Confidence:** MEDIUM-HIGH (patterns are well-established; platform facts verified against web.dev / Chrome docs where noted; progression rule constants are product decisions to be validated by the FEATURES/domain research)

> Scope note: this file defines structure, boundaries, data model and flows. Concrete library/version choices live in STACK.md. Where this file recommends "no framework / vendored micro-library", it is an architectural position (no build step, no update treadmill) that STACK.md may refine, but the layering below holds either way.

---

## Standard Architecture

### System Overview

Typical workout trackers (Strong, Hevy, FitNotes, etc.) share one shape: **a catalog of exercises + a plan (routine/template) -> sessions made of sets -> derived analytics**, with the "live workout" screen as the hot path. For this project the shape is the same, minus any server, and with one strong rule: **history is the single source of truth; everything else (next workout, next load, PRs, streaks) is derived from it by pure functions.**

```
┌──────────────────────────────────────────────────────────────────────┐
│ UI LAYER   (src/ui)  -- renders state, emits intents, owns no logic   │
│  Today  │ Workout(live) │ History/Exercise │ Body │ Food │ Goals │ Settings │
└───────────────┬──────────────────────────────────────────▲───────────┘
                │ intents (user events)                     │ subscribe / re-render
┌───────────────▼──────────────────────────────────────────┴───────────┐
│ APP STATE + ACTIONS  (src/store.js, src/actions/*)                    │
│  in-memory: route, settings, activeWorkout, ephemeral UI state        │
│  actions orchestrate: call domain (pure) -> call repos (IO) -> update │
└───────┬───────────────────────────────┬──────────────────────────────┘
        │ pure calls                    │ async IO
┌───────▼──────────────────┐   ┌────────▼───────────────────────────────┐
│ DOMAIN (src/domain)      │   │ DATA (src/data)                         │
│ NO DOM, NO IndexedDB,    │   │ db.js  open + versioned migrations      │
│ NO Date.now()            │   │ repos.js  one small module per store    │
│  progression.js          │   │ backup.js  export / validate / import   │
│  rotation.js             │   │ seed/  exercises.js, program.js (static)│
│  records.js (PRs, e1RM)  │   └────────┬───────────────────────────────┘
│  goals.js (streak, pct)  │            │
│  nutrition.js (protein)  │   ┌────────▼───────────────────────────────┐
│  dates.js (local-day)    │   │ BROWSER PLATFORM                        │
│  migrate.js (pure doc    │   │ IndexedDB │ Cache Storage (sw.js) │     │
│   transforms, shared w/  │   │ Storage Manager (persist) │ Share/DL │  │
│   backup import)         │   │ Wake Lock │ Vibration │ <input capture> │
└──────────────────────────┘   └─────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `index.html` + `manifest.webmanifest` | Installable shell; `start_url: "./"`, `scope: "./"`, `display: standalone`, relative paths only | Static files |
| `sw.js` | Precache the whole app shell as one versioned set; serve offline; never touch cross-origin | Hand-written ~50 lines, cache-first, versioned cache name |
| `router.js` | Map `location.hash` -> screen; back button support | ~40-line hash router |
| `store.js` | Tiny observable in-memory state (route, settings, active workout, UI flags). **Not** a cache of DB entities | ~30 lines: `get()`, `set(patch)`, `subscribe(fn)` |
| `domain/*` | All business rules as pure functions; take `today`/`now` as arguments | Plain ES modules, unit-tested with `node --test` (zero deps) |
| `data/db.js` | Open IndexedDB, run ordered migrations, expose `tx()` helper | ~100 lines on raw IndexedDB, or one vendored `idb` file |
| `data/repos.js` | CRUD + queries per store; the only place that knows store names/indexes | One exported object per store |
| `data/backup.js` | Serialize all stores <-> versioned JSON; validate; migrate; atomic restore | Uses `domain/migrate.js` |
| `data/seed/*` | Static exercise catalog + default A/B program, shipped in code | Frozen JS modules (no DB write for the catalog) |
| `ui/screens/*` | One file per screen; reads via repos on mount, dispatches actions | Functions returning DOM / components |
| `ui/components/*` | Reusable bits: SetRow, RestTimer, NumberStepper, SvgLineChart, Toast, Dialog | Small, presentational |
| `docs/MAINTAINING.md` | How to deploy, bump version, add an exercise, restore a backup, run tests | Plain Markdown in repo |

---

## Recommended Project Structure

Goal: **~30 small files, zero build step, readable top-to-bottom by a competent web dev who never saw the project.**

```
/                          <- repo root == deployed root (GitHub Pages or any static host)
├── index.html
├── manifest.webmanifest
├── sw.js                  # service worker (shell precache)
├── icons/                 # 192, 512, maskable-512, favicon
├── src/
│   ├── main.js            # boot: open db -> seed -> restore active workout -> register SW -> start router
│   ├── router.js          # hash router
│   ├── store.js           # observable app state
│   ├── version.js         # export const APP_VERSION, SCHEMA_VERSION (single place; sw.js reads APP_VERSION)
│   ├── actions/           # orchestration: workout.js, body.js, food.js, goals.js, backup.js
│   ├── domain/            # PURE. progression.js rotation.js records.js goals.js nutrition.js dates.js migrate.js rules.js
│   ├── data/
│   │   ├── db.js          # open + migrations array
│   │   ├── repos.js       # store accessors
│   │   ├── backup.js
│   │   └── seed/          # exercises.js, program.js
│   ├── ui/
│   │   ├── screens/       # today.js workout.js history.js exercise.js body.js food.js goals.js settings.js
│   │   └── components/    # setRow.js restTimer.js chart.js dialog.js toast.js ...
│   └── vendor/            # optional vendored single-file libs (e.g. preact+htm). Never npm-installed at runtime.
├── test/                  # *.test.js for domain/ + backup round-trip (node --test)
├── tools/
│   └── gen-precache.mjs   # lists files -> writes precache list into sw.js (no deps, run before deploy)
└── docs/
    ├── MAINTAINING.md     # the "bus-factor" document
    └── DATA-FORMAT.md     # backup JSON spec + schema history
```

### Structure Rationale

- **`domain/` has zero imports from `data/` or `ui/`.** This is the single most valuable boundary: progression, rotation, PR and streak logic are what the user trusts and what a future maintainer will most likely tweak. Pure functions + `node --test` means they can be verified without a browser, a phone, or the original developer.
- **`data/repos.js` is the only module that knows IndexedDB store/index names.** Schema changes touch `db.js`, `repos.js`, `migrate.js` and nothing else.
- **`seed/` is code, not DB.** Exercise catalog updates ship with the app and never require a data migration (see Data Model).
- **`vendor/` committed, not fetched.** If a UI micro-library is used, a copy lives in the repo. No CDN at runtime (offline + longevity), no `npm install` needed to deploy.
- **`tools/gen-precache.mjs`** is the only "build" step and it is optional-but-recommended (see Service Worker); everything else is served as authored ES modules.

---

## Data Model (IndexedDB)

### Principles

1. **One IndexedDB database, one `schemaVersion` integer**, ordered migrations (see Versioning).
2. **Document-style records with stable string IDs** (`crypto.randomUUID()`), so import-merge and idempotent restore are trivial `put()` calls.
3. **Dates:** store both `startedAt` (epoch ms, for ordering) **and** `localDate` (`"YYYY-MM-DD"` in the device's local time, for bucketing "which day was this"). Never derive the day from a UTC ISO string: a Brazil (UTC-3) late-evening entry lands on the wrong day and corrupts streaks/daily logs.
4. **Weights in kg as numbers rounded to 0.25** on write (`Math.round(x*4)/4`) to avoid float noise (`72.50000001`) in charts and equality checks.
5. **Derived data is never stored as truth** (next workout, suggested load, PRs, streaks). Caches are allowed only if rebuildable from history.
6. **Photos are Blobs in their own store**, so loading sessions never drags image data into memory.

### Stores

| Store | Key | Shape (essential fields) | Indexes | Notes |
|-------|-----|--------------------------|---------|-------|
| `settings` | `key` | `{key, value}` rows: `restDefaultSec`, `proteinTargetG`, `proteinMode` (`light`/`exact`), `reminderTime`, `loadStepKg`, `lastBackupAt`, `onboardingDone`, `weekStartsOn`, `weeklyGoal` | - | Key-value so adding a setting needs no migration. Do **not** also use `localStorage` (two sources of truth). |
| `programs` | `id` | `{id, name, archived, rotation:[templateId,...], templates:[{id, label:"A", name:"Full Body A", items:[{exerciseId, sets, repMin, repMax, restSec, incrementKg?}]}], createdAt, updatedAt}` | - | **Templates embedded in the program** (a program is edited as a unit; a handful of items). Copied from `seed/program.js` on first run; DB copy is truth afterwards so user edits are never overwritten by app updates. |
| `customExercises` | `id` | Same shape as a catalog entry, `id` prefixed `u_` | - | Optional v1.x. Merged with static catalog by `catalog.get(id)`. |
| `exercisePrefs` | `exerciseId` | `{exerciseId, startLoadKg?, incrementKg?, nextLoadOverrideKg?, discoveryDone?, notes?}` | - | **User intent only** (manual start load, "next time use this exact load", custom increment). The *suggestion* is never stored. |
| `sessions` | `id` | `{id, programId, templateId, templateLabel, startedAt, endedAt, localDate, status:"completed", entries:[{exerciseId, order, note?, sets:[{n, load, reps, rpe?, warmup?, doneAt}]}], note?, energy?}` | `startedAt`, `localDate` | **Sets embedded in the session.** At this scale (see Scalability) a session is one atomic, exportable document; per-exercise history = scan sessions and filter. Only **completed** sessions live here. |
| `active` | fixed key `"current"` | Same shape as a session plus `status:"in_progress"`, `restEndsAt` (epoch ms or null), `currentEntryIdx`, `schemaVersion` | - | The single draft workout. Written on **every** state change. Deleted atomically when the session is finished. |
| `bodyMetrics` | `id` | `{id, localDate, weightKg?, waistCm?, chestCm?, armCm?, thighCm?, note?}` | `localDate` | One record per measurement event. Weight and tape measures can be logged separately or together. |
| `dailyLogs` | `localDate` | `{localDate, sleep:1-5?, energy:1-5?, proteinLevel?:"low"/"ok"/"high"?, proteinG?:number}` | - | One row per day keyed by date -> trivially upserted; no duplicates possible. |
| `foodEntries` | `id` | `{id, localDate, ts, label, proteinG}` | `localDate` | Only needed for the "exact" protein mode. Light mode needs only `dailyLogs.proteinLevel`. |
| `photos` | `id` | `{id, localDate, angle:"front"/"side"/"back", blob, thumbBlob, mime, w, h, note?}` | `localDate` | Resized at capture (see Photo pipeline). |
| `goals` | `id` | `{id, type:"weeklyFrequency"/"bodyWeight"/"exerciseLoad"/"pr", targetValue, exerciseId?, startValue?, createdAt, achievedAt?, active}` | - | Progress is **computed** from history/body; only the target is stored. `exerciseLoad` goals are creatable only if the exercise has history (matches the "no load goals before discovery" decision). |

> Embedded vs normalized sets: normalized `sets` store with a compound `[exerciseId, performedAt]` index is the "textbook" answer, but it buys nothing at ~5k sets/year and costs atomicity (multi-store writes for one workout), export simplicity and draft-vs-final parity. If a later phase finds exercise-history queries slow (it will not), add a derived `exerciseIndex` cache, not a schema rewrite.

### Static seed: exercise catalog (not in IndexedDB)

`src/data/seed/exercises.js` exports a frozen array/map:

```js
export const EXERCISES = Object.freeze({
  "supino-reto-barra": {
    id: "supino-reto-barra",
    name: "Supino reto com barra",
    pattern: "push-horizontal",          // squat | hinge | push-h | push-v | pull-h | pull-v | core | carry
    equipment: "barra",                  // barra | halter | maquina | polia | peso-corporal
    muscles: { primary: ["peitoral"], secondary: ["triceps", "deltoide-anterior"] },
    steps: ["Deite no banco...", "..."], // PT-BR execution steps
    commonMistakes: ["..."],
    videoUrl: "https://www.youtube.com/watch?v=...",
    progression: { type: "weighted", incrementKg: 2.5, startRatioBW: 0.35 }, // for discovery heuristic
    substitutes: ["supino-reto-halteres"]
  },
  // ...
});
```

Rules that keep years of data valid:
- **IDs are immutable and never reused.** Renaming = change `name` only. Removal = add `deprecated: true` (history keeps rendering). A unit test asserts every `exerciseId` referenced by the default program exists, and backup import warns (does not fail) on unknown IDs, rendering them as "(exercício removido)".
- Video links are plain `https://` URLs opened with `target="_blank" rel="noopener"`; no embeds (works with offline shell, no CSP/iframe issues; Android can hand it to the YouTube app).

### Schema versioning and migrations (years of data)

Two coupled but separate version numbers:

| Number | Where | Meaning |
|--------|-------|---------|
| `SCHEMA_VERSION` (integer) | IndexedDB version **and** backup `schemaVersion` | Shape of stored data. Bumped only when structure/shape changes. |
| `APP_VERSION` (semver string) | `version.js`, backup `appVersion`, SW cache name | Code release. Informational + cache busting. |

**Migration design**

```js
// src/data/db.js  (sketch)
const MIGRATIONS = [
  // index 0 => upgrades v0 -> v1
  (db, tx) => {
    db.createObjectStore("settings", { keyPath: "key" });
    db.createObjectStore("programs", { keyPath: "id" });
    const s = db.createObjectStore("sessions", { keyPath: "id" });
    s.createIndex("startedAt", "startedAt"); s.createIndex("localDate", "localDate");
    db.createObjectStore("active", { keyPath: "key" });
    // ...
  },
  // index 1 => v1 -> v2 : e.g. add rpe default / rename field
  (db, tx) => { /* cursor over tx.objectStore("sessions") applying migrateSessionV1toV2 */ },
];
export const SCHEMA_VERSION = MIGRATIONS.length;

indexedDB.open("sistema-academia", SCHEMA_VERSION).onupgradeneeded = (e) => {
  const { oldVersion } = e;
  for (let v = oldVersion; v < SCHEMA_VERSION; v++) MIGRATIONS[v](e.target.result, e.target.transaction);
};
```

Rules:
1. **Append-only.** Never edit a shipped migration; add a new one. Migrations are numbered by array index so order is unambiguous.
2. **Structural change (stores/indexes) in `onupgradeneeded`; record transforms are pure functions in `domain/migrate.js`** (`sessionV1toV2(record) -> record`). The *same* pure functions are applied to a backup's JSON on import. One transform implementation, two call sites; a unit test feeds a frozen v1 fixture through the chain and compares to the expected current shape.
3. **Aborting is the rollback.** If any migration throws, abort the versionchange transaction: IndexedDB reverts the database to its previous version, and the app shows "Erro ao atualizar dados; seus dados estão intactos. Exporte um backup e contate o mantenedor." Do not catch-and-continue.
4. **Never `await` non-IndexedDB promises inside an upgrade/transaction** (fetch, timers): the transaction auto-commits and subsequent requests throw `TransactionInactiveError`. Migrations must be synchronous request chains.
5. **Downgrade guard.** If the DB version is newer than the code's `SCHEMA_VERSION` (user restored an old SW cache), `open()` fails with `VersionError`; show a blocking "versão do app mais antiga que seus dados" screen with an export button; never write.
6. **Prefer additive changes** (new optional fields, new stores) that need no data rewrite. Code reads with defaults (`s.rpe ?? null`). Most future changes should be "migration that only creates a store".
7. **`db.onversionchange = () => { db.close(); location.reload(); }`** so a second open tab/PWA window cannot block an upgrade.
8. **Pre-migration safety net:** on boot, if the stored `lastBackupAt` is > 14 days old, show a non-blocking backup nudge. (Do not try to auto-export inside the upgrade; the user-visible backup file is the real safety net.)

---

## Pure Domain Logic

### Progression engine (stateless, derived from history)

**Position:** the engine is a pure function of *recent history for one exercise + its prescription + user prefs + today*. It stores no state. Whatever the user actually lifted is the history, so manual deviations, missed weeks, restored backups and re-imports all produce a correct suggestion with no "state repair". (A stateful engine is the #1 source of "the app suggests nonsense after I imported/edited" bugs.)

```js
// src/domain/progression.js
/**
 * @param {Object} p
 * @param {{repMin:number, repMax:number, sets:number, incrementKg:number}} p.rx   prescription from the template item
 * @param {Array<{localDate:string, sets:Array<{load:number,reps:number,rpe?:number,warmup?:boolean}>}>} p.history
 *        sessions containing this exercise, MOST RECENT FIRST, already filtered (warmups excluded by the caller or here)
 * @param {{startLoadKg?:number, nextLoadOverrideKg?:number, incrementKg?:number}} p.prefs
 * @param {string} p.today   "YYYY-MM-DD" (injected; no Date.now() inside)
 * @param {{bodyWeightKg?:number, startRatioBW?:number}} p.hints   for first-ever suggestion
 * @returns {{phase:"discovery"|"increase"|"repeat"|"deload"|"return",
 *            loadKg:number, targetReps:number, reasonCode:string, reasonParams:object}}
 */
export function suggestNext({ rx, history, prefs, today, hints }) { /* ... */ }
```

Design constraints:
- **Return `reasonCode` + params, never display strings.** UI maps `"increase.allSetsAtMax"` to PT-BR text. Keeps domain testable and i18n-free.
- **Constants live in `domain/rules.js`** (e.g. `DELOAD_PCT = 0.10`, `LAYOFF_DAYS = 14`, `FAILS_BEFORE_DELOAD = 2`, `RPE_CAP_FOR_INCREASE = 9`, rounding step). Tuning the program = editing one table, with tests.
- **Phases** (all derivable from history):
  - `discovery`: no history -> suggest `prefs.startLoadKg` or heuristic (`bodyWeight * startRatioBW`, rounded to the load step, deliberately conservative) with an on-screen "start light; add load each set until RPE 7-8" protocol. The load actually done in the first session becomes history, which ends discovery automatically. (`exercisePrefs.discoveryDone` only exists for the user to force-exit.)
  - `increase` (double progression): all working sets reached `repMax` (and RPE <= cap if recorded) -> `+incrementKg`, targetReps = `repMin`.
  - `repeat`: otherwise keep load, aim `+1 rep` on the weakest set.
  - `deload`: failed to hit `repMin` on >= N consecutive sessions at the same load -> `-10%`.
  - `return`: gap since last session of this exercise > `LAYOFF_DAYS` -> reduce load by a step/percent (irregular weeks are the norm for this user).
- `nextLoadOverrideKg` wins once, then is consumed (the action clears it when the session finishes).
- Load rounding to the available increment (`incrementKg` per exercise: 2.5 bar, 5 stack machine, 1-2 dumbbell steps).

### Rotation / "next workout" (stateless)

```js
// src/domain/rotation.js
/** Next template = the one after the most recent COMPLETED session's template in program.rotation. */
export function nextTemplate(program, completedSessionsDesc) {
  const last = completedSessionsDesc.find(s => s.programId === program.id);
  const order = program.rotation;                  // e.g. ["A","B"]
  if (!last) return order[0];
  const i = order.indexOf(last.templateId);
  return order[(i + 1) % order.length] ?? order[0]; // template removed from program -> restart at first
}
```

- No stored "pointer": skipping a week changes nothing; doing the "wrong" template on purpose (user picks B from Today) simply makes the next one A. Abandoning a workout with zero sets logs nothing and does not advance. Finishing with >= 1 completed set counts as completed.
- Today screen shows `nextTemplate()` as the big primary button and the others as secondary choices.

### Other pure modules

| Module | Functions |
|--------|-----------|
| `records.js` | `estimate1RM(load, reps)` (Epley), `detectPRs(prevHistory, newSession)` -> `[{exerciseId, kind:"load"/"e1rm"/"repsAtLoad"/"volume", value}]`; called at finish (for the celebration) and on demand for the PR list. PRs are **recomputed, not stored**. |
| `goals.js` | `weeklyStreak(sessions, perWeek, today, weekStartsOn)`, `bodyWeightProgress(goal, metrics)`, `exerciseLoadProgress(goal, history)` |
| `nutrition.js` | `proteinTargetG(bodyWeightKg, gPerKg)`, `dayStatus(log, target)` for the light mode (traffic-light, not a number obsession) |
| `dates.js` | `localDate(ts)`, `weekKey(localDate, weekStartsOn)`, `daysBetween(a,b)` - the **only** place that touches `Date` arithmetic |
| `migrate.js` | `migrateDocument(doc, fromVersion) -> doc@current`, per-step pure transforms |

All of these are covered by `node --test` with fixture histories (beginner ramp, missed weeks, plateau, deload, layoff, import of an old backup).

---

## In-Progress Workout (surviving tab kill / reload)

Android aggressively kills background tabs/PWAs, **and launching the camera or YouTube app can unload the PWA**. The live workout therefore must be a *persisted* document, not component state.

**Pattern: write-through draft in the `active` store.**

```
tap "Concluir série"
   -> action.logSet(entryIdx, {load, reps, rpe})
        1. pure: draft' = applySet(draft, set)            (domain, no IO)
        2. store.set({ activeWorkout: draft' })           (UI updates immediately)
        3. repos.active.put(draft')   // one tiny put, awaited, errors -> toast, memory copy retained
        4. start rest timer: draft'.restEndsAt = now + restSec ; persisted in the same put
```

- **Rest timer uses an absolute `restEndsAt` timestamp**, never a decrementing counter. On every `visibilitychange`/boot, remaining = `restEndsAt - Date.now()`. Survives reload, background throttling and device sleep. At zero while foregrounded: `navigator.vibrate` + beep. While backgrounded the OS may freeze JS: the timer cannot be guaranteed to ring (see Pitfalls); on return, the UI immediately shows "descanso acabou há 40 s".
- **Boot sequence:** `main.js` reads `active/current`; if present -> router forces/offers `#/workout` with a "Continuar treino de hoje" banner (and a discard option). Never auto-discard.
- **Finish** = one `readwrite` transaction on `["sessions","active"]`: `sessions.put(finalSession)` + `active.delete("current")`. All-or-nothing; a kill mid-finish leaves either the draft intact or the session saved, never neither/both.
- **Staleness rule:** a draft older than ~12 h is offered as "treino não concluído de ontem: salvar ou descartar?" rather than silently resumed.
- Flush on `visibilitychange === "hidden"` and `pagehide` as belt-and-braces (the write-through should already have done it).
- Optional: Screen Wake Lock while on the workout screen (feature-detected; re-acquire on `visibilitychange`).

---

## Backup Export / Import Format

**Single JSON file**, human-inspectable, self-describing, versioned. Designed so a future maintainer can read it in a text editor and write a converter.

```json
{
  "app": "sistema-academia",
  "format": 1,
  "schemaVersion": 3,
  "appVersion": "1.2.0",
  "exportedAt": "2027-03-04T11:20:31-03:00",
  "device": { "ua": "...", "tz": "America/Sao_Paulo" },
  "counts": { "sessions": 41, "bodyMetrics": 18, "photos": 6 },
  "data": {
    "settings":   [ {"key":"restDefaultSec","value":90} ],
    "programs":   [ ... ],
    "exercisePrefs": [ ... ],
    "customExercises": [ ... ],
    "sessions":   [ ... ],
    "bodyMetrics":[ ... ],
    "dailyLogs":  [ ... ],
    "foodEntries":[ ... ],
    "goals":      [ ... ],
    "photos":     [ { "id":"...", "localDate":"...", "angle":"front", "mime":"image/jpeg", "w":1080, "h":1440, "dataBase64":"...", "thumbBase64":"..." } ]
  }
}
```

- `format` = envelope version (rarely changes). `schemaVersion` = data shape version (changes with migrations). Keep both; the envelope can evolve independently.
- `active` (in-progress draft) is **not** exported. `counts` lets import show "41 treinos, 18 medidas, 6 fotos" and detect truncated files.
- **Photos:** Blobs -> base64 inline (single-file simplicity; bounded by resize-at-capture). Offer a "Incluir fotos" toggle (default on; "sem fotos" produces a small file that is easy to WhatsApp). 1 yr of weekly 3-angle photos at ~200 KB ~ 30 MB raw / ~40 MB base64; acceptable, and the toggle is the escape hatch.
- **Export delivery (Android):** primary = `Blob` + `<a download>` (works everywhere, lands in Downloads). Enhancement = `navigator.canShare({files})` -> `navigator.share({files})` so the user can send straight to Drive/WhatsApp (feature-detect and fall back to download; support details vary by Chrome version). Do **not** depend on the File System Access API save picker (not available on Android Chrome). File name: `academia-backup-YYYY-MM-DD.json`. On success, write `settings.lastBackupAt`.
- **Import procedure** (`data/backup.js`), in order, aborting with a readable PT-BR error at the first failure:
  1. Parse; check `app === "sistema-academia"`; check `format` supported.
  2. If `schemaVersion > SCHEMA_VERSION`: refuse ("backup de uma versão mais nova do app").
  3. `migrateDocument(doc, doc.schemaVersion)` via the shared pure transforms.
  4. Structural validation (required fields/types per store; `counts` match; unknown `exerciseId`s -> warning only).
  5. Preview screen: counts + date range + "Substituir tudo" vs "Mesclar" (merge = `put` by id; newer `updatedAt`/`endedAt` wins; default is Replace).
  6. **Offer to export the current state first** (cheap undo).
  7. Apply in **one multi-store `readwrite` transaction** (clear + put for Replace). On any error the transaction aborts and the existing data is untouched.
  8. Convert base64 -> Blob for photos *before* opening the transaction (async work must not happen inside it).
- **Round-trip test** (`export -> wipe -> import -> deep-equal`) is a required automated test and must be re-run for every schema change.
- A backup-staleness nudge (last backup > 14 days or > 6 sessions since) is part of the architecture, not a nicety: **the backup file is the only redundancy this app has.**

---

## Service Worker & Offline

| Decision | Choice | Why |
|----------|--------|-----|
| Strategy | **Versioned precache of the complete shell, cache-first** | The whole app is ~30 small files; precaching all of them in `install` gives a *consistent* set per version. Runtime caching (stale-while-revalidate) can mix new `index.html` with old JS modules -> broken ES-module graph. |
| Cache name | `` `academia-${APP_VERSION}` ``; `activate` deletes every other `academia-*` cache | Clean upgrades, no stale accumulation |
| Precache list | Generated by `tools/gen-precache.mjs` (walks the tree, writes the array into `sw.js`) **or** hand-maintained + a test that fails if a file in `src/` is missing from the list | Forgetting one file = works online, breaks offline. This is the classic no-build-step failure. |
| Navigation | For any navigation request, respond with the cached `index.html` (hash routing means there is only one real document) | SPA offline |
| Updates | New SW installs in background and **waits** (no `skipWaiting()` by default). UI shows "Nova versão disponível - atualizar" in Settings / on Today when no workout is active; user taps -> `postMessage('SKIP_WAITING')` -> reload. | Never swap code under an in-progress workout; user-controlled |
| Cross-origin | Not handled by SW (YouTube = outbound links only) | Nothing to cache; nothing to break |
| Paths | **All relative** (`./src/main.js`), `start_url: "./"`, `scope: "./"`, SW registered with relative URL | GitHub Pages serves under `/<repo>/`; absolute `/` paths break there. |
| Storage durability | After first successful save call `navigator.storage.persist()` (and log `persisted()` in Settings > Diagnóstico) | Chrome grants it heuristically for installed PWAs (no prompt), protecting from automatic eviction; the user can still clear data manually, hence backups. |
| Longevity property | An installed PWA keeps working from the SW cache even if the host disappears; update checks fail silently offline | Directly serves the "no maintenance" constraint. Document that any static host works (GitHub Pages, Cloudflare Pages, Netlify, or `python -m http.server` on localhost - a secure context). |

---

## Routing (no server)

**Hash routing** (`#/hoje`, `#/treino`, `#/historico`, `#/historico/:exerciseId`, `#/corpo`, `#/comida`, `#/metas`, `#/config`).

- Static hosts (GitHub Pages) have no rewrite rules: History-API paths 404 on reload/deep-link, and the `404.html` redirect hack is a maintenance trap. Hash routes always resolve to `index.html`.
- Android hardware back button maps to hash history for free. From `#/treino` (live) back should not destroy state (it is persisted); optionally confirm before leaving.
- Router contract: `routes = { "/hoje": TodayScreen, "/historico/:id": ExerciseScreen, ... }`; each screen is `(params) => view` and loads its own data via repos on mount. Unknown route -> `#/hoje`.
- Bottom tab bar (thumb reach): Hoje | Histórico | Corpo | Comida | Mais. The live workout is a full-screen mode launched from Hoje (hides the tab bar to reduce mis-taps).

---

## Architectural Patterns

### Pattern 1: Derived-over-stored ("history is truth")

**What:** Next template, suggested load, PRs, streaks, goal progress are pure functions over stored history; only user *intent* (targets, overrides) and *facts* (what happened) are persisted.
**When to use:** Always in this app. Cheap at this data size; eliminates sync/repair bugs.
**Trade-offs:** Recomputation on each screen (microseconds-milliseconds at <1k sessions); you must keep the pure functions deterministic (inject `today`).

### Pattern 2: Write-through draft + atomic finalize

**What:** Live workout = a persisted document updated on every action; finishing swaps draft -> session in one transaction.
**When to use:** Any flow the OS may kill mid-way (this app: always).
**Trade-offs:** One small `put` per set (negligible); must treat the DB copy as authoritative on boot.

```js
// actions/workout.js
export async function finishWorkout() {
  const draft = store.get().activeWorkout;
  const session = toCompletedSession(draft, Date.now());           // pure
  await db.tx(["sessions", "active"], "readwrite", (t) => {
    t.sessions.put(session); t.active.delete("current");
  });
  store.set({ activeWorkout: null });
  return detectPRs(await repos.sessions.byExercises(exerciseIds(session)), session);
}
```

### Pattern 3: Unidirectional flow with thin store

**What:** `event -> action -> (pure domain) -> (repo IO) -> store.set -> render`. The store holds only ephemeral/session state; entity data is fetched per screen from repos. No global entity cache -> no cache invalidation, no dual source of truth.
**When to use:** Always; the app is small enough that screen-level queries are instantaneous.
**Trade-offs:** Slightly more `await` in screens; far fewer stale-data bugs.

### Pattern 4: Shared pure migrations (IDB upgrade + backup import)

**What:** Record transforms are pure functions in `domain/migrate.js`, invoked by both `onupgradeneeded` cursors and by backup import.
**When to use:** Every shape-changing schema bump.
**Trade-offs:** Discipline of keeping transforms pure/synchronous; payoff is one tested path for both entry points.

### Pattern 5: Capability-with-fallback modules

**What:** Wrap every optional platform API (Share files, Wake Lock, Vibration, Storage persist, reminders) in a tiny module that feature-detects and degrades silently.
**When to use:** Anything not universally available on Android Chrome + installed-PWA mode.
**Trade-offs:** A few extra files; the app never hard-fails on a missing API.

---

## Data Flow

### Key Data Flows

1. **Open app -> "what do I do today":** `main.js` opens DB (migrate) -> seeds program on first run -> loads `settings`, `active` -> Today screen queries last N completed sessions -> `nextTemplate()` -> for each item `suggestNext()` (history from recent sessions + `exercisePrefs` + latest body weight) -> renders "Treino B: supino 40 kg x 3 x 8-12 (subir de 37,5)".
2. **Log a set:** SetRow tap (prefilled with the suggestion, steppers for +/- load, reps; RPE optional single tap) -> `actions.logSet` -> store + `active.put` -> rest timer starts -> UI advances to next set.
3. **Finish workout:** `actions.finishWorkout` -> atomic transaction -> `detectPRs` -> summary screen (PRs, volume, "próximo treino: A") -> `lastBackupAt` nudge check.
4. **History/graph:** Exercise screen -> `repos.sessions.forExercise(id)` (index scan + filter) -> `domain` maps to series -> `SvgLineChart` (hand-rolled inline SVG ~60 lines; no chart library).
5. **Body/photos:** `<input type="file" accept="image/*" capture="environment">` (native camera app; no `getUserMedia` permission flow) -> `createImageBitmap` + canvas downscale (max ~1280 px long edge, JPEG q~0.8) + ~320 px thumb -> store Blobs in `photos`.
6. **Backup:** Settings -> `backup.export()` reads all stores in one read transaction -> base64 photos -> JSON Blob -> share/download -> `settings.lastBackupAt`. Import = reverse with validation + atomic write.
7. **Reminder (morning):** see Integration Points; a capability module with fallbacks, not a core flow.

### State Management

```
                 ┌──────────── store (in-memory) ────────────┐
                 │ route, settings, activeWorkout, ui flags  │
                 └───────▲───────────────────────┬───────────┘
                subscribe│                       │ set(patch)
   ┌─────────────────────┴──┐             ┌──────┴────────────────┐
   │ Screens / components   │──intent────▶│ actions (orchestrate) │
   └───────────▲────────────┘             └──────┬──────────┬─────┘
               │ query on mount                  │ pure     │ IO
               └──────── repos (IndexedDB) ◀─────┴──domain──┘
```

---

## Build Order (dependencies -> roadmap implications)

```
[1] PWA shell + router + db.js(migrations) + persist()   <- everything depends on this
      │
[2] seed: exercise catalog + default A/B program  ->  [3] domain: rotation + progression (+tests)
      │                                                     │
      └──────────────┬──────────────────────────────────────┘
                     ▼
[4] Today + live Workout (write-through draft, rest timer, finish)   <- CORE VALUE slice
                     │
        ┌────────────┼────────────────────┐
        ▼            ▼                    ▼
[5] History/PR/   [6] Backup export  [7] Body: weight, tape, photos
    charts            + import (round-trip test)
        │                                   │
        └──────────────┬────────────────────┘
                       ▼
[8] Nutrition (protein light/exact) + daily sleep/energy
                       ▼
[9] Goals (needs history + body)   ->   [10] Reminders, name/logo, polish, MAINTAINING.md
```

Ordering rationale and constraints:
1. **Backup export must ship with (or immediately after) the first screen that persists real data** (step 4 -> step 6), and certainly before the December start. Data is device-only; losing the phone/clearing site data is the dominant risk. Import hardening and the round-trip test can follow, but the **export format and `schemaVersion` must exist from step 1** because every later store adds to it.
2. **Domain (3) before UI (4):** the progression/rotation contracts fix the shape of `sessions` and `programs`; changing session shape after real data exists means a migration.
3. **Freeze the `sessions` shape early** (step 4) — it is the one record type with years of value and the one every later feature reads.
4. **Photos (7) are independent of the workout core** and carry the most storage/UX risk (camera unloading the PWA, size). Keep them out of the core milestone.
5. **Goals (9) last** among features: they only *read* history/body, and "exercise-load goals only after a base exists" falls out naturally.
6. Service worker precache generation (`gen-precache`) should be in place at step 1 and re-verified at each phase: add a "works in airplane mode" check to every phase's done-criteria.

---

## Scalability Considerations

Single user; "scale" = years of data on one phone.

| Scale | Estimate | Architecture Adjustments |
|-------|----------|--------------------------|
| 1 year (~150 sessions, ~5k sets, 50 weigh-ins, ~150 photos) | sessions+metrics < 2 MB; photos ~30 MB | None. All queries are instant. |
| 5 years (~750 sessions) | sessions < 10 MB; photos ~150 MB | Gallery must page thumbs (never full images); export offers "sem fotos". Still no cache layer. |
| 10 years | ~1500 sessions; ~300 MB photos | Consider splitting export: data JSON + separate photos file. Chrome quota is a large fraction of free disk, so storage is not the limit; backup file size and Drive/WhatsApp limits are. |

### Scaling Priorities

1. **First bottleneck: photo storage and backup size**, not query speed. Fix: resize at capture, thumbnails, `includePhotos` toggle, optionally a separate photos file later.
2. **Second: rendering a very long history list.** Fix: paginate by month; chart downsample. Not needed before year 2-3.

---

## Anti-Patterns

### Anti-Pattern 1: `localStorage` as the database

**What people do:** Stash sessions/metrics in `localStorage` because it is simpler.
**Why it's wrong:** ~5 MB cap, synchronous, strings only, no transactions (a kill mid-write corrupts a blob), no Blobs for photos, and two storage systems to back up.
**Do this instead:** IndexedDB for everything, including settings (key-value store).

### Anti-Pattern 2: Persisting derived/progression state as truth

**What people do:** Keep `currentLoad`, `failCount`, `programPointer` that are incremented on each workout.
**Why it's wrong:** Drifts after edits, imports, missed saves; needs repair logic and migrations.
**Do this instead:** Recompute from history every time; store only user overrides.

### Anti-Pattern 3: UTC timestamps as "the day"

**What people do:** `new Date().toISOString().slice(0,10)` for daily buckets.
**Why it's wrong:** Evening entries in UTC-3 get tomorrow's date; streaks and daily logs break silently.
**Do this instead:** `localDate` computed once via `dates.js` at write time.

### Anti-Pattern 4: Countdown timers driven by `setInterval` decrement

**What people do:** `seconds--` every second.
**Why it's wrong:** Freezes/drifts when the tab backgrounds or the screen locks; lost on reload.
**Do this instead:** Persist `restEndsAt`; render by subtraction; use `setInterval` only to repaint.

### Anti-Pattern 5: Unversioned or runtime-mixed service-worker caching

**What people do:** Cache-first with a constant cache name, or stale-while-revalidate for JS.
**Why it's wrong:** Users stay on old code forever, or get a half-updated module graph.
**Do this instead:** Versioned, atomic precache; user-initiated update; bump via `version.js` (+ generated list).

### Anti-Pattern 6: `skipWaiting()` + `clients.claim()` by default

**What people do:** Activate new SW immediately.
**Why it's wrong:** Swaps code under a live workout; with a no-build ES-module app it can load a mixed set.
**Do this instead:** Wait; prompt when idle.

### Anti-Pattern 7: History-API routing on static hosting

**What people do:** `/treino` style URLs.
**Why it's wrong:** 404 on reload on GitHub Pages; `404.html` hacks rot.
**Do this instead:** Hash routes.

### Anti-Pattern 8: Reusing/renaming-by-replacement exercise IDs; deleting catalog entries

**What people do:** "Fix" the catalog by changing an ID or removing an exercise.
**Why it's wrong:** Orphans years of history.
**Do this instead:** Immutable IDs, `deprecated: true`.

### Anti-Pattern 9: Build chain / framework treadmill

**What people do:** Vite + React + TS + a dozen packages.
**Why it's wrong:** In 3 years `npm install` fails, nobody can rebuild; contradicts "works for years without updates".
**Do this instead:** Native ES modules, no bundler; if a view library is wanted, vendor one pinned file (e.g. Preact + htm, ~5 KB) into `src/vendor/`. JSDoc types instead of TypeScript compile step.

### Anti-Pattern 10: Base64 photos stored in IndexedDB / full-size photos

**What people do:** Store camera originals (3-6 MB) as data URLs.
**Why it's wrong:** 33% bloat, memory spikes, slow gallery, giant backups.
**Do this instead:** Resize + JPEG at capture, store Blob + thumbnail, base64 only at export.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| YouTube | Outbound `<a target="_blank" rel="noopener">` per exercise | Only feature needing network; show "precisa de internet" hint. No embeds/iframes. |
| Static host (GitHub Pages etc.) | Serve repo root as-is; relative paths | Installed PWA survives host loss while cache/data remain. |
| Android share sheet / Downloads | `navigator.share({files})` with `<a download>` fallback | Feature-detect with `canShare`; verify on target device. |
| Camera | `<input type=file accept=image/* capture>` | The OS may unload the PWA during capture -> draft persistence + state restore are mandatory. |
| Notifications / reminder | **Capability module with fallbacks** (below) | The one area where "no server" bites. |

### Morning reminder (explicit risk)

The Notification Triggers API (`showTrigger`/`TimestampTrigger`), the only server-free way to schedule a local notification from a web app, is **abandoned** (Chrome's docs: "development ... has ended"; origin trial complete, never launched). Periodic Background Sync is not exact-time and is gated by engagement heuristics; Web Push needs a server. Therefore:

1. Primary, dependable approach: **export a recurring calendar event** (`.ics` with `RRULE` and a `VALARM`) at the chosen time, which the Android calendar/clock honors natively and offline; plus a one-screen guide "ou crie um alarme no Relógio".
2. Secondary: in-app banner on open ("Hoje é dia do Treino B").
3. Feature-detect `showTrigger` and use it only if some future Chrome ships it.
Mark as **needs a short spike** before the reminder phase; do not promise push-style reminders in requirements.

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `ui` -> `actions` | direct function calls (intents) | UI never imports `data/` for writes |
| `ui` -> `repos` | reads on mount only | Reads allowed for display; writes only via actions |
| `actions` -> `domain` | pure calls, inject `now`/`today` | Domain never calls `Date.now()` |
| `actions` -> `data` | `await repos.*`, `db.tx()` | Multi-store atomicity lives here |
| `domain/migrate` <-> `data/db` + `data/backup` | pure function reuse | One transform implementation |
| `sw.js` <-> app | `postMessage` for `SKIP_WAITING` and version query only | SW never touches IndexedDB |
| `version.js` -> `sw.js` + `backup.js` | imported/inlined constant | Single place to bump |

---

## Maintainability Without the Original Developer (architecture-level requirements)

- `docs/MAINTAINING.md` (deploy steps, "bump version here", "how to add an exercise", "how to add a migration", "how to restore from backup", "how to host elsewhere", "run tests: `node --test`") is a deliverable of the roadmap, not an afterthought.
- `docs/DATA-FORMAT.md` documents every store and the backup JSON with a schema-history table (version -> what changed).
- Domain tests run with Node's built-in test runner: **no `package.json` dependencies at all**.
- No runtime network dependency except YouTube links. No analytics, no CDN fonts (system font stack), no remote config.
- Comments explain *why* in `rules.js` (progression constants with the training-science reason) so the next person can tune them.
- Keep files small and single-purpose; prefer boring code over abstraction. If a file crosses ~300 lines, split it.

---

## Confidence and Gaps

| Claim | Confidence | Basis |
|-------|------------|-------|
| Layering, derived-over-stored, write-through draft, atomic finalize | HIGH | Standard local-first/IndexedDB practice; transaction semantics per spec |
| IndexedDB versioned migrations, abort = rollback, no non-IDB awaits in tx | HIGH | IndexedDB spec behavior |
| Hash routing on GitHub Pages; relative paths; versioned precache | HIGH | Well-known static-hosting constraints |
| `storage.persist()` granted heuristically for installed PWAs w/o prompt; users can still clear | MEDIUM | web.dev persistent-storage guidance; Chrome heuristics may have changed |
| Share-with-files on Android Chrome + download fallback | MEDIUM | web.dev Web Share docs; minimum versions inconsistent across sources -> feature-detect, verify on device |
| Notification Triggers abandoned; `.ics` fallback is dependable | MEDIUM-HIGH / MEDIUM | Chrome docs warning (undated); `.ics` behavior varies by calendar app, verify on the user's phone |
| Progression constants (increments, 10% deload, 14-day layoff, RPE cap) | LOW-MEDIUM | Reasonable defaults; to be validated against FEATURES/training-science research |
| Data-size estimates | MEDIUM | Back-of-envelope; photos dominate |

**Gaps / phase-research flags**
- Reminder phase: short spike on `.ics` VALARM behavior on the user's Android calendar app; confirm whether any exact-time alternative exists.
- UI approach (vanilla vs vendored Preact+htm) for the live workout screen: decide in STACK.md; vanilla full re-render risks losing input focus mid-entry, so the workout screen needs targeted updates or a tiny VDOM.
- Photo phase: verify camera-intent behavior and PWA reload on the target phone.
- Progression rule table sign-off (and whether beginners' discovery protocol needs a dedicated guided flow).

## Sources

- Chrome for Developers, Notification Triggers API (status: development ended): https://developer.chrome.com/docs/web-platform/notification-triggers (MEDIUM-HIGH; page undated warning)
- web.dev, Persistent storage / Offline data: https://web.dev/articles/persistent-storage , https://web.dev/learn/pwa/offline-data (MEDIUM)
- web.dev, Web Share API and file sharing: https://web.dev/web-share , https://web.dev/articles/web-share (MEDIUM; version numbers inconsistent)
- W3C IndexedDB spec (versionchange transactions, abort semantics, transaction auto-commit) (HIGH, from standard knowledge)
- Service Worker / PWA install criteria and hash-routing-on-static-hosting practice (HIGH, standard practice)

---
*Architecture research for: single-user offline-first workout tracker PWA*
*Researched: 2026-11-18*
