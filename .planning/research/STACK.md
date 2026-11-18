# Stack Research

**Domain:** Personal, single-user, offline-first, installable PWA gym tracker (Android Chrome), static hosting, zero-maintenance for years
**Researched:** 2026-11-18
**Confidence:** HIGH on core stack and storage; MEDIUM on sharing/backup behaviour on Android; LOW-MEDIUM on anything involving background reminders (deliberately designed around it)

## Executive Decision

**No build step. Plain ES modules + a vendored ~17 KB UI layer (Preact + htm via an import map) + IndexedDB through a vendored 1-file wrapper (`idb`) behind your own thin `db.js`. Hand-written CSS. Hand-written SVG charts. One hand-written service worker. Deploy by committing files to a GitHub Pages branch (no CI).**

The governing insight: a *shipped* web app does not rot; the *toolchain that produces it* does. Browser APIs used here (IndexedDB, Service Worker, ES modules, SVG, Cache API) are backwards-compatible by Chrome policy. `node_modules`, Vite major versions, Node engine floors and GitHub Actions versions are not. With no build step, the repository IS the deployed site: anyone (or any future AI) can open `app.js`, edit, push, and it works. Nothing needs `npm install` to keep running or to be edited.

Evidence of toolchain churn, checked today: Vite is at 8.3.8 and requires Node `^20.19.0 || >=22.12.0` (npm registry) — i.e. a Vite project from 2022 would not build on today's required Node without migration work. That is exactly the failure mode the owner cannot absorb.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Vanilla ES modules (native `<script type="module">`) | n/a (browser-native) | App code organisation, no bundler | Chrome Android supports modules and import maps (Chrome 89+); source == deployed artifact; zero toolchain to rot | HIGH |
| Preact | 11.2.0 (npm `latest` dist-tag; verified `dist/preact.mjs` = 12 KB, ESM-only) | Declarative UI + hooks (`preact/hooks`, 3.6 KB) | Needed for correct state-driven re-rendering without losing input focus/keyboard during timer ticks and set logging (a vanilla `innerHTML` re-render destroys focused inputs and is XSS-prone with user notes). Vendored as static files, so it never changes under you | HIGH |
| htm | 3.1.1 (1.2 KB; `dist/htm.mjs` + `preact/index.mjs`) | JSX-like tagged templates, no compiler | Gives component syntax with zero build. Frozen/finished library (last release 2022, not deprecated); vendored so maintenance status is irrelevant | HIGH |
| idb | 8.0.4 (`build/index.js`, 11 KB unminified, 0 runtime deps) | Promise wrapper over IndexedDB | ~1.2 KB brotli; thin enough that if it ever broke you can replace it with raw IndexedDB in one file. You only touch it through your own `db.js` | HIGH |
| IndexedDB (browser-native) | n/a | All persistent data incl. photo Blobs | Only sane local store for structured data + Blobs; `localStorage` cannot hold photos and is synchronous | HIGH |
| Service Worker + Cache API (hand-written, ~60 lines) | n/a | Offline app shell, installability | No Workbox (it is a build-chain dependency with its own churn). A cache-first precache SW is trivial | HIGH |
| Web App Manifest | n/a | Installable PWA on Android Chrome (WebAPK) | Install criteria (web.dev): HTTPS, `name`/`short_name`, `start_url`, `display: standalone`, 192 px + 512 px icons | HIGH |
| GitHub Pages ("Deploy from a branch", root or `/docs`) | n/a | Free static hosting | No Actions workflow needed (workflows/action versions are a rot vector). Free plan requires a PUBLIC repo (private repos need a paid plan) — fine, because user data never lives in the repo. Soft limits (100 GB/month bandwidth) are irrelevant for one user | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) own SVG chart module | ~150 LOC | Line charts (load per exercise, body weight, measurements) and bar charts (protein/day, weekly frequency) | Default. Series are tiny (hundreds of points over years); inline SVG is themeable with the same CSS variables as the app, scales via `viewBox` (no devicePixelRatio/resize code), and is accessible. MEDIUM confidence: costs a few hours of build time vs a library |
| uPlot | 1.6.32 (`dist/uPlot.iife.min.js` 51 KB / 22 KB gzip, + `uPlot.min.css` 1.9 KB; MIT, zero deps) | Canvas charting fallback | Only if the hand-rolled SVG chart proves slow to get right (tooltips, nice axis ticks, time axis). Vendor the single iife file; it has built-in time axis, unlike Chart.js |
| Node built-in `node:test` | Node >= 20 (dev machine only) | Unit tests for pure logic (double progression, PR detection, protein totals, import/export round-trip, migrations) | Dev-time only, zero install. Keep logic in DOM-free modules so it is testable |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Any static server (`python -m http.server`, `npx serve`) | Local dev | Service workers work on `http://localhost`. No dev server with HMR needed |
| Chrome on Android + `chrome://inspect` (USB debugging) | Real-device testing | Mandatory for: install flow, Wake Lock, Share API, persist() result, notifications. Emulators/desktop lie about these |
| `tools/stamp-sw.mjs` (own ~30-line Node script, no deps, run by hand before commit) | Rewrites the `CACHE_VERSION` and precache file list in `sw.js` from the directory tree | Without a bundler nobody generates the precache manifest; forgetting a file means it is missing offline. Script is dev-time only; if lost, the list can be edited by hand |
| Lighthouse (Chrome DevTools) | PWA installability audit | One-time check before the December launch |

## Installation

No runtime install. Vendoring is a one-time, dev-machine step; afterwards `node_modules` is deleted and never needed again.

```bash
# One-time vendoring (copies exact files into the repo, then discard node_modules)
npm pack preact@11.2.0 htm@3.1.1 idb@8.0.4
# Extract the tarballs, then copy ONLY these files into /vendor:
#   preact/dist/preact.mjs            -> vendor/preact.mjs
#   preact/hooks/dist/hooks.mjs       -> vendor/preact-hooks.mjs
#   htm/dist/htm.mjs                  -> vendor/htm.mjs
#   idb/build/index.js                -> vendor/idb.js
# Optional fallback charting:
npm pack uplot@1.6.32   # -> dist/uPlot.iife.min.js + dist/uPlot.min.css
```

The one non-obvious wiring: `hooks.mjs` imports the bare specifier `"preact"` and `htm/preact` imports `"preact"` + `"htm"`, so `index.html` needs an import map (must come before any module script):

```html
<script type="importmap">
{ "imports": {
    "preact": "./vendor/preact.mjs",
    "preact/hooks": "./vendor/preact-hooks.mjs",
    "htm": "./vendor/htm.mjs",
    "idb": "./vendor/idb.js"
} }
</script>
```

Use relative URLs everywhere (GitHub Pages project sites live under `/<repo>/`, not `/`). Add an empty `.nojekyll` file at the publish root so GitHub does not run Jekyll over the files.

## Storage Design (the part that must not fail)

| Decision | Recommendation | Why | Confidence |
|----------|----------------|-----|------------|
| IndexedDB access | `idb` 8.0.4 behind own `db.js` (~100 LOC: `get/put/getAll/range/tx`, versioned `upgrade` migrations) | Data volume is tiny (~3k sets/year); no need for Dexie query power. Migrations by `oldVersion` switch are plain and permanent. Rest of the app never imports `idb` directly | HIGH |
| Dexie | Not chosen (4.4.7; dexie.min.js 96 KB / 31 KB gzip; unpacked 3.2 MB) | Excellent library but ~30x heavier than the need, adds a sizable surface to read if something breaks. Choose it only if queries become relational/complex (they will not in this app) | HIGH |
| Object stores | `exercises`, `programs`, `sessions`, `sets` (index `exerciseId`+`date`), `foodLogs`, `bodyWeights`, `measurements`, `wellness`, `photos` (Blob + metadata), `settings`, `goals` | Separate `photos` store keeps the large Blobs out of normal reads | HIGH |
| Dates | Store a local-date string `YYYY-MM-DD` plus a ms timestamp per record | Avoids timezone/"which day does a 23:50 meal belong to" bugs | HIGH |
| Eviction protection | Call `navigator.storage.persist()` after first successful save (and display `persisted()` state in Settings) | Chromium decides silently by heuristics (site engagement, installed/bookmarked, notification permission); an installed PWA is the best case. Not guaranteed, and does NOT protect from the user clearing site data | MEDIUM-HIGH |
| Data-loss reality | Treat "clear Chrome data", uninstalling the WebAPK, changing the site URL/origin, or very low device storage as data-loss events | Persistence is protection from the browser, not from the user. Hence mandatory: visible "last backup: N days ago" banner and an easy export | HIGH |
| Photos | Capture via `<input type="file" accept="image/*" capture="environment">`; downscale with `createImageBitmap(file, {imageOrientation:'from-image'})` -> canvas -> `toBlob('image/jpeg', 0.8)` max ~1280 px long side (~150-300 KB each); store the `Blob` directly in IndexedDB; display with `URL.createObjectURL` and `revokeObjectURL` after use | Raw phone photos are 3-8 MB; unscaled they would exhaust quota within months. JPEG (not WebP) for portability when restored on another device | HIGH |
| Backup file | One `.json` document: `{app, schemaVersion, exportedAt, stores:{...}, photos:[{id, meta, dataUrl}]}`; photos as base64 data URLs (+33%, acceptable at ~100 photos); build with `new Blob([...chunks])`, not one giant string. Import validates `schemaVersion`, migrates, and writes in one transaction after confirmation. Provide "with photos / without photos" toggle | Single file is what the owner asked for (Drive/WhatsApp). JSON is human-inspectable forever, so data is recoverable even if the app dies | HIGH |
| Backup delivery on Android | (1) `<a download>` of a Blob URL = primary, works everywhere. (2) `navigator.share({files:[File]})` guarded by `navigator.canShare({files})` = secondary. Share the file as **`text/plain` with a `.txt`/`.json.txt` name**: Chromium only permits certain audio/image/pdf/video/text types, and reports show `application/json` throwing NotAllowedError ("Permission denied"). (3) Import via `<input type="file">` with no strict `accept` (Android pickers grey out unlisted types) | Do NOT depend on `showSaveFilePicker`: Chromium's "File System Access on Android" shipped in 2024 with known gaps (Save-As could only select existing files; no atomic writes). Re-test on the owner's phone; feature-detect and fall back | MEDIUM (sharing type list is from secondary sources — verify on device in the backup phase) |
| Number input | Use `<input type="text" inputmode="decimal">` and parse `,` and `.` yourself | pt-BR users type `72,5`; `type=number` + locale handling on Android is inconsistent | HIGH |

## Offline / Service Worker / Install

| Concern | Recommendation |
|---------|----------------|
| Caching strategy | Precache the whole app shell (HTML, JS modules, CSS, vendor files, icons, exercise library JSON) on `install`; **cache-first** for same-origin GET; no network calls at all except outbound YouTube links |
| Versioning | `const CACHE_VERSION = 'v1-<date>'` stamped by `tools/stamp-sw.mjs`; `activate` deletes old caches. Register with `{ updateViaCache: 'none' }` (browsers already bypass HTTP cache for the SW script, and GitHub Pages serves `max-age=600` on other files) |
| Update UX | New SW waits; show a small "Nova versão — recarregar" toast on `registration.waiting`. Do not auto-`skipWaiting` mid-workout |
| Routing | **Hash routing** (`#/treino`, `#/progresso`). GitHub Pages has no SPA 404 fallback, so History-API routes would 404 on reload |
| Manifest | `id` (set once, never change), `name`, `short_name`, `lang: "pt-BR"`, `start_url: "./"`, `scope: "./"`, `display: "standalone"`, `orientation: "portrait"`, `theme_color`/`background_color`, PNG icons 192 + 512 as `purpose:"any"` AND separate `purpose:"maskable"` entries (do not combine as "any maskable"). Optional `shortcuts` for "Iniciar treino" |
| Install | Chrome Android shows install via menu/mini-infobar after >=30 s of engagement; add an in-app "Instalar" button handling `beforeinstallprompt` (feature-detect; fall back to text instructions "Menu -> Adicionar à tela inicial") |
| Fonts/CSS | System font stack, hand-written CSS with custom properties, `prefers-color-scheme` dark mode. No webfonts (offline cost), no Tailwind/CSS frameworks (build step) |
| Exercise videos | Store YouTube **search-result URLs** (`youtube.com/results?search_query=...`), not individual video IDs. Videos get deleted/privatised over years; a search link cannot rot |
| Permanent URL | The origin is the identity of the database. Pick the final GitHub username/repo name BEFORE launch and never rename. Changing it orphans IndexedDB on the phone (recovery = export/import) |

## Platform Capabilities: Honest Feasibility

| Capability | Verdict | Detail |
|------------|---------|--------|
| Screen Wake Lock during workout | **Works.** Chrome 84+, HTTPS | Request on workout start inside try/catch (may be refused on low battery); the lock is auto-released when the page is hidden, so re-request on `visibilitychange` when visible. Show a visible "tela ligada" indicator + user toggle. HIGH |
| Rest timer | **Works while the app is visible.** | Store `endsAt = Date.now()+ms` and recompute on each tick and on `visibilitychange`; never count down by decrementing. Alert with `navigator.vibrate()` + WebAudio beep (unlock audio on the first tap). With Wake Lock the screen stays on, so this is reliable in the gym. If the user leaves the app, JS timers are throttled/frozen: on return, show "descanso terminou há 40 s". Do not promise background alerts. HIGH |
| Local notifications while app is alive/foreground (`registration.showNotification`) | **Works**, needs permission granted by a user gesture | Usable for rest-timer-end when app is open but not visible only on a best-effort basis. MEDIUM |
| **Notification Triggers (`TimestampTrigger` / `showTrigger`) — scheduled local notification** | **DEAD. Do not use.** | Chrome's own docs banner: "The development of Notification Triggers API ... has ended." Origin trial (M80-M83) complete, Launch: "Not started", never shipped. HIGH |
| **Periodic Background Sync** for a morning reminder | **Unreliable; at best a bonus.** | Only after install + launched as an app; fires only if site-engagement score > 0; the browser, not you, chooses timing (tied to how often the app is opened, battery, connectivity; only on previously-used networks); `minInterval` is a floor, not a schedule; practical cadence is roughly once per 12-24 h at arbitrary hours. Cannot hit "07:00 every morning". Optional best-effort: on a `periodicsync` event, if local time is in 06:00-11:00 and no workout/notification today, show one notification; otherwise stay silent. Never make it the only reminder. LOW for reliability |
| **Web Push for a true 07:00 notification** | **Needs a server — rejected.** | Push must be sent by a server. A GitHub Actions cron sender is theoretically free but violates "no server", needs VAPID secrets/subscription storage, cron is best-effort-late, and GitHub disables scheduled workflows after 60 days of repo inactivity (official docs) — i.e. it WILL silently die in the maintenance-free scenario. HIGH |
| `intent://` to the Clock app (`SET_ALARM`) | **Do not rely on it.** | Chrome only launches activities that declare `BROWSABLE`; the Clock alarm activity is not documented as such, and `SET_ALARM` also carries a permission requirement. No working web example found. Treat as optional spike only. LOW |
| **Recommended morning reminder** | **OS-level alarm/calendar, guided by the app** | (a) In Settings, a "Lembrete matinal" screen with 3 illustrated steps to create a repeating alarm in the Android Clock app at the desired time, labelled "Treino" — rock solid, survives app removal, zero maintenance. (b) Also offer a downloadable `.ics` with a daily-recurring event (`RRULE`) at the chosen time and a `VALARM`; opened from Downloads it imports into Google Calendar. Caveat: Google Calendar is known to drop `VALARM` on import in some cases and fall back to the calendar's default reminders — acceptable because a timed event still notifies, but test on the owner's phone. (c) Optional PBS nudge as above. This is the honest answer to the PROJECT.md requirement; the roadmap should word the requirement as "reminder via OS alarm/calendar + best-effort in-app nudge". MEDIUM |
| Storage persistence | **Likely granted** for an installed PWA, silently (no prompt) | Show state in Settings; never block on it. MEDIUM-HIGH |
| Web Share with files | **Works on Chrome Android for permitted types**; JSON MIME may be rejected | See Backup delivery above. MEDIUM |
| File System Access (`showSaveFilePicker`) | **Avoid on Android** | Shipped for Android in 2024 with known limitations; use `<a download>` instead. MEDIUM |

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| No-build + vendored Preact/htm | **No-build vanilla JS + Web Components** (honest runner-up) | Choose if you want literally zero third-party code. Cost: Shadow DOM fights global CSS and form/IME behaviour; Custom Elements lifecycle boilerplate; hand-rolled re-rendering must preserve focus. A vanilla *non-Shadow* approach with a tiny `h()` helper and targeted DOM updates is viable and equally durable — but more code and more bug surface for a screen-heavy, input-heavy app. If the owner insists on zero libraries, this is the fallback; durability is equal, development cost is higher |
| No-build + vendored Preact/htm | **Vite 8 + Preact/Svelte (build + CI)** | Better DX (HMR, TS, tree-shaking, JSX) and smaller output, but: the *deployed output* keeps working forever, whereas the *source* needs Node `^20.19 \|\| >=22.12`, `npm install`, a lockfile whose transitive deps go stale/vulnerable, and (if deployed with Actions) action-version deprecations. In a world where the AI maintainer disappears, the owner cannot repair a broken toolchain. Only reconsider if the app grows to a scale (>10k LOC) where TypeScript pays for itself — it will not |
| No-build + vendored Preact/htm | Svelte/SvelteKit, Lit | Svelte needs a compiler (build step by definition). Lit is a fine no-build option (vendorable), but adds Shadow DOM and decorators/ecosystem baggage vs Preact+htm's smaller surface |
| `idb` 8.0.4 | Dexie 4.4.7 | If data model grows to need compound queries, live queries (`liveQuery`) or built-in versioned schema DSL. Acceptable choice; just heavier (96 KB min) |
| `idb` 8.0.4 | Raw IndexedDB | Equally valid; ~200 more lines. `idb` mainly removes callback/`IDBRequest` boilerplate; keep the wrapper isolated so you can swap |
| Own SVG charts | uPlot 1.6.32 (vendored) | If you want zoom/tooltips/time axis without writing them |
| Own SVG charts | Chart.js 4 | Heavier (tens of KB more), and its time scale needs an extra date-adapter package (extra dependency). Not worth it |
| GitHub Pages (branch deploy) | Cloudflare Pages / Netlify / GitLab Pages | All free and viable; Pages-from-branch needs no CI and no account beyond GitHub. Keep the site host-agnostic (relative URLs) so migrating = copying files, but remember a host change changes the origin and requires export/import |
| OS alarm/`.ics` reminder | Web Push via GitHub Actions cron | Never for this project (see feasibility table) |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Notification Triggers / `showTrigger` | Development officially ended; never shipped | OS alarm/calendar reminder |
| Firebase / Supabase / any BaaS, FCM push | Server dependency and free tiers pause/change; contradicts PROJECT.md out-of-scope | IndexedDB + file backup |
| Vite / Webpack / Parcel / Rollup / esbuild pipeline, npm scripts needed to run | Toolchain rot is the #1 maintenance risk without AI | Plain files + vendored libs |
| GitHub Actions deploy workflow | Action versions and runner images deprecate; adds a silent failure path | "Deploy from a branch" |
| Workbox / `vite-plugin-pwa` | Build-time dependency chain for a 60-line SW | Hand-written SW + `stamp-sw.mjs` |
| TypeScript as a build requirement | Needs compile step. (JSDoc + `// @ts-check` in editor is fine and free) | JSDoc types |
| React / Vue / Angular / Next.js / Nuxt / SvelteKit | Heavy, build-dependent, upgrade treadmill | Preact+htm vendored |
| Tailwind, Bootstrap, UI kits, icon fonts, Google Fonts / CDNs at runtime | Build step or network dependency; CDNs vanish and break offline | Hand-written CSS, inline SVG icons, system fonts |
| Loading libraries from a CDN (esm.sh, unpkg, jsDelivr) at runtime | CDN changes/outages = broken app years later; also fails offline until cached | Vendor files into `/vendor` |
| `localStorage` for workout data | Sync, ~5 MB, no Blobs, no transactions | IndexedDB (small settings only, if at all) |
| Photos as base64 in IndexedDB | +33% storage, slow | Store `Blob`; base64 only inside the export file |
| History-API routing | 404 on reload at GitHub Pages | Hash routing |
| `showSaveFilePicker` as the only export path | Android limitations | `<a download>` + Share fallback |
| Individual YouTube video IDs | Videos disappear | Search-query URLs |
| `type="number"` for weights/reps | Locale/decimal-comma issues on Android keyboards | `inputmode="decimal"` text input |
| Capacitor/Cordova/TWA/Play Store wrapper | Out of scope (PROJECT.md); needs dev account and rebuilds | Installable PWA |
| Renaming the GitHub repo/user after launch | Changes origin = orphaned IndexedDB | Decide name first; recover via backup |

## Stack Patterns by Variant

**If the owner wants literally zero third-party code:**
- Drop Preact/htm; use vanilla modules, a ~40-line `h()`/`render` helper, event delegation, and update only specific nodes on timer ticks.
- Because durability is identical and the "no dependency" claim becomes absolute; accept more UI-plumbing code and be disciplined about escaping user text (`textContent`, never `innerHTML` with notes).

**If photos grow large (hundreds):**
- Add a "backup without photos" default and a separate "export photos only" action; keep `photos` in their own store.
- Because base64 export grows 33% and WhatsApp/Drive transfers get slow.

**If the real phone refuses JSON in `navigator.share`:**
- Share as `.txt` (`text/plain`) and accept `.txt` on import; keep the download path as the guaranteed method.

**If periodic background sync turns out to fire acceptably on the owner's phone (verify during the reminder phase):**
- Keep it as a nudge on top of the OS alarm, never instead of it.

## Version Compatibility

| Component | Needs | Notes |
|-----------|-------|-------|
| Import maps | Chrome 89+ | Android Chrome auto-updates; fine for a 2026 phone |
| Wake Lock | Chrome 84+ | Re-acquire on `visibilitychange` |
| Preact 11.2.0 + `hooks.mjs` + htm 3.1.1 | Same Preact copy for all three | Everything must resolve `"preact"` to ONE file via the import map (Preact must be a singleton, or hooks break subtly). Preact 11 ships ESM `.mjs` only (no `.module.js`/UMD); `htm/preact/index.mjs` imports `{h, Component, render}` from `"preact"` and `htm` |
| `idb` 8.0.4 | Any browser with IndexedDB | `build/index.js` is a plain ES module with no imports |
| Dev tooling | Node >= 20 (only for `stamp-sw.mjs` and `node:test`) | Optional; app runs and deploys without Node |
| GitHub Pages | Public repo on Free plan | Add `.nojekyll`; relative paths for project-site subpath |

## Sources

- npm registry (`registry.npmjs.org/<pkg>/latest`, tarballs inspected locally): preact 11.2.0 (dist-tags latest 11.2.0, rc 11.0.0-rc.2, legacy 8.5.3; dist/preact.mjs 11.97 KB, hooks.mjs 3.6 KB), htm 3.1.1, idb 8.0.4 (0 runtime deps), dexie 4.4.7 (dexie.min.js 96 KB), uplot 1.6.32 (MIT, 0 deps), vite 8.3.8 (engines node `^20.19.0 || >=22.12.0`) — HIGH, fetched 2026-11-18
- https://developer.chrome.com/docs/web-platform/notification-triggers — banner "development ... has ended"; Launch: Not started — HIGH
- https://developer.chrome.com/docs/capabilities/periodic-background-sync — installed-only, engagement > 0, browser-controlled timing — HIGH
- https://developer.chrome.com/docs/capabilities/web-apis/wake-lock — Chrome 84, auto-release on hidden, re-acquire pattern — HIGH
- https://web.dev/articles/persistent-storage — silent heuristic grant (engagement, installed/bookmarked, notification permission) — HIGH
- https://web.dev/articles/install-criteria — manifest/HTTPS/icon requirements — HIGH (page does not state a SW requirement)
- https://web.dev/articles/web-share and MDN `Navigator.canShare` — permitted file categories; JSON rejection reports via Stack Overflow ("Permission denied" for `application/json`, OK for `text/plain`) — MEDIUM (secondary source; verify on device)
- Blink-dev "Intent to Ship: File System Access on Android and WebView" (Sept 2024) — known Android gaps — MEDIUM (may have changed by 2026; test on device)
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits — Pages: public repos on Free plan, 100 GB/month soft bandwidth; 1 GB site size figure from secondary sources — MEDIUM-HIGH
- GitHub Actions docs ("disable and enable workflows") — scheduled workflows auto-disabled after 60 days of inactivity in public repos — HIGH
- https://preactjs.com/guide/v10/no-build-workflows — import-map + htm no-build pattern, singleton warning (page notes v11 is now current) — HIGH
- Chrome Android intents docs (developer.chrome.com/docs/android/intents) and Android `AlarmClock` reference — BROWSABLE requirement, `SET_ALARM` permission — MEDIUM (conclusion inferred; no working web example found)
- Google Calendar `.ics` VALARM import behaviour: Stack Overflow / Google support threads — LOW-MEDIUM (anecdotal; test on device)

---
*Stack research for: personal offline-first gym tracker PWA (Android, GitHub Pages, no build, no server)*
*Researched: 2026-11-18*
