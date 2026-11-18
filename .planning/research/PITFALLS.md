# Pitfalls Research

**Domain:** Personal offline-first workout tracker PWA (Android, single user, absolute beginner, no server, GitHub Pages hosting, must survive without AI maintenance)
**Researched:** 2026-11-18
**Confidence:** MEDIUM-HIGH. Technical pitfalls rest on platform behavior that is well documented or verified this session (HIGH/MEDIUM). Behavioral pitfalls rest on widely replicated exercise-science and habit-formation findings plus domain experience (MEDIUM). Items marked LOW need on-device verification.

**Phase naming note:** The roadmap does not exist yet. Phases below use working names the roadmapper should map onto the real ones:
- **P1 Foundation:** hosting, PWA shell, service worker, storage layer, schema/versioning
- **P2 Workout Core:** program rotation, exercise library, set logging, rest timer, in-progress persistence
- **P3 Progression:** load discovery, double progression, history, charts, PRs
- **P4 Body and Habits:** weight, photos, measurements, protein, sleep/energy
- **P5 Goals, Reminders, Backup:** goals/streaks, morning reminder, export/import hardening
- **P6 Release and Handoff:** name/icon, final install test, docs for maintaining without AI

---

## Critical Pitfalls

### Pitfall 1: Data loss because storage is "just IndexedDB" and nobody asked for persistence

**What goes wrong:**
All workout history, photos and body data live only in the browser profile. They disappear if the user taps "Clear storage" or "Clear data" in Android app info or Chrome site settings, if Chrome is reset or reinstalled, if the phone is replaced or factory reset, or if the browser evicts the origin under storage pressure (best-effort storage is evictable). Uninstalling the PWA can also remove its site data on some Android versions. With no server, there is no second copy. Months of progress vanish, and a beginner's motivation vanishes with them.

**Why it happens:**
IndexedDB feels permanent. Developers test only on a desktop where nothing ever clears. Persistence protects against automatic eviction only. It does not protect against the user clearing data, which is the most likely cause.

**How to avoid:**
- Call `navigator.storage.persist()` at startup (and again after install). Chrome does not prompt. It grants based on heuristics such as installed state, engagement and notification permission. Show the result of `navigator.storage.persisted()` in Settings as a status line ("Storage protected: yes/no").
- Treat persistence as mitigation only. The real safety net is backup (see Pitfall 2).
- Add a "Do not clear data" warning in the Settings and Backup screens, in plain Portuguese. The user will be tempted to "free space" by clearing Chrome data.
- Store `lastBackupAt` and surface it prominently.
- Never keep the only copy of anything in `localStorage`. Put everything in one IndexedDB database with a single schema version.

**Warning signs:**
`persisted()` returns false on the real phone. Settings has no backup-age indicator. Nobody has ever tested "wipe data, then import backup" end to end.

**Phase to address:** P1 (persistence request, single DB) and P5 (backup UX). Verify the wipe-and-restore drill in P5.

---

### Pitfall 2: Backup exists but the user never does it (or it silently produces a useless file)

**What goes wrong:**
Export/import is built, ticked off, and never used. The first time it matters, the last backup is 4 months old or nonexistent. Variants: the export JSON is malformed or omits photos, the import was never tested against a real export, the file lands in a Downloads folder the user forgets, or the export only works through an API missing on Android.

**Why it happens:**
Manual backup has no natural trigger. Users, especially beginners with no mental model of "my data is only on this phone", do not self-initiate. Developers test export but not restore.

**How to avoid:**
- **Trigger-based nudges, not calendar nagging:** show a non-blocking banner when `lastBackupAt` is older than 14 days AND at least 3 workouts were logged since, or after every 10th workout. Show it on the post-workout "done" screen (a moment of accomplishment, not a mid-workout interrupt). Include a one-tap "Back up now" button.
- **Make backup one tap:** use `navigator.share({files:[...]})` (Web Share API with files, HTTPS only, must be triggered by a click) so the user can send it to Drive or WhatsApp straight from the share sheet. Feature-detect with `navigator.canShare({files})`. Fall back to a plain `<a download>` blob link. Do not depend on `showSaveFilePicker`: its Android support is recent and sources conflict, so treat it as optional only. Test whether the share sheet accepts `application/json` on the real phone (LOW confidence). If it does not, name the file `.json` but share as `text/plain`, or offer both.
- **Validate on export and import:** include `app`, `schemaVersion`, `exportedAt`, and record counts in the file. On import, do a dry run: parse, validate, show "X workouts, Y weights, Z photos, last workout date" and ask for confirmation before replacing anything. Never overwrite silently. Keep an automatic pre-import snapshot in memory or temp storage so a bad import can be undone.
- **Test the round trip in CI-less fashion:** a documented manual drill in the "Looks Done But Isn't" checklist (export, wipe, import, compare counts).
- Consider a second, human-readable CSV of workout history as an escape hatch the user could open in Sheets.
- Make the photos question explicit (see Pitfall 5).

**Warning signs:**
`lastBackupAt` is null after weeks of use. Import has only been tried with hand-written JSON. The backup button is buried in a menu. The file size is suspiciously small or enormous.

**Phase to address:** P5 (nudge logic, share flow, validated import). Export schema and `schemaVersion` field must be designed in P1 so it never has to change shape later.

---

### Pitfall 3: The app lives on a shared GitHub Pages origin and the origin or path changes later

**What goes wrong:**
IndexedDB, caches and service workers are scoped to the **origin** (`username.github.io`), not the repo path. Consequences:
1. If the user (or you) later renames the GitHub account, renames the repo in a way that changes the URL, or moves to a custom domain, the installed PWA points at a new origin and **all data is invisible** (it stays in the old origin's storage).
2. Any other project site under the same `username.github.io` shares IndexedDB and `localStorage` with this app. Two apps can clash on database names, cache names and service worker scope, and clearing one app's data can wipe the other's.
3. A project site is served from `/<repo>/`, not `/`. Absolute paths (`/index.html`, `/sw.js`, `/icons/x.png`) break there. `start_url`, `scope`, service worker registration and cache precache lists all must be path-correct, or the app installs but is blank offline.

**Why it happens:**
Works fine on `localhost:5500` (root path), breaks on Pages. Origin scoping is not intuitive.

**How to avoid:**
- Decide the **final URL before the user ever installs** and treat it as permanent. Prefer a dedicated GitHub account or org used only for this, or at least a repo name that is final (the name is "provisional", so keep the repo name generic and independent from the app display name). The app name and icon can change in the manifest later, but the URL must not.
- Namespace everything: database name `sistema-academia-v1`, cache prefix `sa-`, never generic names like `db`, `cache`, `workbox-*` defaults.
- Use **relative paths everywhere** (`./`, `scope: "./"`, `start_url: "./index.html"` or `"./"`) so the app is path-agnostic. Register the service worker as `./sw.js`.
- Add an empty `.nojekyll` file (Pages' Jekyll step can drop files/folders starting with `_`).
- Remember GitHub Pages paths are **case-sensitive** (Windows dev machine is not). Match filename case exactly.
- Backup/restore is the sanctioned migration path if the origin must ever change. Document this in the handoff README.
- Test on the real deployed URL, on the phone, in airplane mode, before declaring any phase done. Do not trust localhost.

**Warning signs:**
Manifest or SW uses `/`-prefixed paths. App works at `localhost` but shows a 404 shell when launched from the home screen offline. Repo is renamed after the first install.

**Phase to address:** P1 (URL decision, relative paths, namespacing, `.nojekyll`). P6 re-verifies on the final URL.

---

### Pitfall 4: Service worker update traps (stuck on an old version, or half-updated cache)

**What goes wrong:**
The user's phone keeps serving an old `index.html` or JS from cache forever (cache-first with a never-changing cache name). Or the new service worker installs but stays "waiting" until every app window closes, which a standalone PWA rarely does, so fixes never arrive. Worse: new HTML loads with old JS (or vice versa), producing a mixed-version app that crashes or corrupts data. Because there is no AI later, a bug fix that cannot reach the phone is a dead end.

**Why it happens:**
Cache-first strategy plus an unchanged cache key. Developers forget that the SW file itself is what triggers updates. Android keeps the PWA process alive in the background so "close and reopen" often does not activate the new worker. GitHub Pages serves with `Cache-Control: max-age=600`, adding a delay.

**How to avoid:**
- Version the cache name from a single `VERSION` constant (`sa-v7`) that changes with every release. In `activate`, delete all caches that do not match.
- Precache the full app shell as one atomic list (HTML, JS, CSS, icons, data files such as the exercise library) in `install` using `cache.addAll`, so a version is either completely present or not installed.
- Use `skipWaiting()` plus `clients.claim()` **only if** you also reload the page safely. A safer pattern for a data app: on `controllerchange` or when a waiting worker is detected, show a small "New version available, tap to update" toast. Apply it only between workouts, never mid-session (see Pitfall 6).
- Network-first (with cache fallback) for `index.html` and the version file, cache-first for hashed or versioned assets.
- Show the app version in Settings (`v7 - 2026-12-02`) so the user can tell the AI-free maintainer which version he has.
- Never make a data-model change without a matching migration shipped in the same release (see Pitfall 8).
- Include a "Force update" button in Settings that unregisters the SW, deletes caches (never IndexedDB) and reloads. This is the user's own escape hatch.

**Warning signs:**
Settings shows a version that does not match the deployed one. Changes visible on desktop but not on the phone. DevTools shows a "waiting" worker.

**Phase to address:** P1 (SW strategy and versioning), P6 (verify update flow with a real v1 to v2 upgrade on the phone before handoff).

---

### Pitfall 5: Progress photos bloat storage and blow up backups

**What goes wrong:**
Raw phone photos are 3-8 MB each. Weekly photos x 3 angles over a year is hundreds of MB. Storage quota pressure raises eviction risk, the app slows, and a JSON backup with base64 photos is 33% larger than the binary and may exceed what WhatsApp or Drive handles comfortably, or crash the tab (building a huge string in memory).

**Why it happens:**
Developers store the camera output as-is and embed base64 in JSON because it is convenient.

**How to avoid:**
- Downscale on capture with canvas or `createImageBitmap` to max ~1080-1280 px on the long edge, JPEG quality ~0.7. Target 100-250 KB per photo. Store as `Blob` in IndexedDB, not base64, and keep metadata (date, angle, weight at the time) in a separate record.
- Generate small thumbnails (~200 px) for the gallery. Load full images lazily.
- Cap photo frequency sensibly in the UX (suggest every 2-4 weeks, not daily).
- Backup design: separate **data backup** (small JSON, includes everything except photo blobs) from **photo backup** (optional second file, or a zip if a tiny no-dependency approach exists). Make the default fast and small, and explain "photos are not included unless you choose." Be explicit so the user is not surprised later. Ship the data JSON first (P5) and photo export as an explicit optional step.
- Show storage used (`navigator.storage.estimate()`) in Settings.
- Photos must use a camera-friendly input (`<input type="file" accept="image/*" capture>`). Know the Android hazard in Pitfall 6.

**Warning signs:**
`storage.estimate().usage` climbs past ~100 MB. Export takes several seconds or the tab freezes. Backup file over ~10 MB without the user knowing why.

**Phase to address:** P4 (photo pipeline) and P5 (photo-aware backup).

---

### Pitfall 6: In-progress workout lost on reload, back button, camera, or Android killing the page

**What goes wrong:**
Mid-workout the user switches to WhatsApp or YouTube (to watch the exercise video, which is a core flow of this app), the phone locks, the browser process is reclaimed by Android, or the user hits the Android back gesture, or pulls down (pull-to-refresh) in standalone mode. The page reloads and the half-finished session, with 10 sets logged, is gone. Opening the camera for a photo can have the same effect on low-memory phones. This is the single most damaging failure for the Core Value ("register each set in seconds").

**Why it happens:**
Session state held only in JS memory or component state, saved "when the workout finishes".

**How to avoid:**
- **Write-through persistence:** every set is written to IndexedDB the moment it is confirmed, as part of a draft `activeSession` record (status `in_progress`, startedAt, exercises, sets). There is no "save" button for sets.
- On app start, check for an active session and route directly to it ("Resume your workout from 08:12"). Support abandon-session and "finish later" explicitly.
- Persist UI-critical transient state too: which exercise is current, rest timer `endAt` timestamp, unfinished weight/reps input (debounced).
- Handle Android back: intercept via the History API so back moves within the app (from set screen to workout overview) instead of closing the app. Do not trap the user.
- CSS `overscroll-behavior-y: contain` on the body to disable pull-to-refresh reloads.
- Request a screen Wake Lock during an active session (`navigator.wakeLock.request('screen')`), re-acquire on `visibilitychange`, and fail gracefully if denied. A locked screen means a cold app reopen with sweaty hands.
- Link to YouTube in a way that returns cleanly (`target="_blank"` / external link) and verify that returning restores the session.
- Write a "kill the tab mid-workout" test into the manual QA checklist.

**Warning signs:**
Sets are only persisted in the "finish workout" handler. No `activeSession` concept. Reloading during the workout shows the home screen.

**Phase to address:** P2 (core; must be there from the first working logging screen, never retrofitted).

---

### Pitfall 7: The morning reminder does not fire (no push server, no reliable scheduler)

**What goes wrong:**
The app promises "lembrete matinal de treino" and it never rings, or rings only when the app is open. A PWA with no server cannot reliably schedule a local notification at 07:00:
- The Notification Triggers / `TimestampTrigger` API that was meant for this has **not shipped**. Chrome's own documentation states its development has ended (verified this session).
- Web Push needs a push server and keys, which violates the "no server" constraint.
- Periodic Background Sync is Chrome-only, requires an installed PWA with sufficient engagement, and its timing is browser-decided (hours, not minutes), not an alarm.
- `setTimeout` in a page or SW does not survive the process being killed. OEM battery optimizers (Xiaomi, Samsung, Huawei, etc.) kill background web processes aggressively.
- Android's "unused app" auto-reset can revoke notification permission if the user stops using the app for months (LOW-MEDIUM confidence).

**Why it happens:**
Notification demos use push or in-page timers on desktop. "Local notification at a given time" sounds trivial but is not available to the web on Android.

**How to avoid:**
- **Do not make the reminder the headline feature or promise exact timing in-app.** Treat it as best-effort, and say so in the UI copy.
- Make the reliable reminder one the user owns on the phone: provide an **"Add alarm to calendar" button that generates a recurring `.ics` event** (daily or on chosen weekdays, 07:00, with a notification alert) that opens in Google Calendar, or a link/instructions to create a recurring phone alarm with the label "Treino". This uses native Android reliability and has zero maintenance cost.
- As a bonus layer only: when the app is opened, show a contextual "Hoje é dia de treino?" screen, and optionally try Notification permission + a scheduled attempt via triggers/periodic sync where available, behind feature detection.
- Ask for Notification permission only after the user opts in to reminders, in response to a tap, never on first launch.
- In the roadmap, mark this requirement "best-effort via calendar/alarm" and keep it out of the critical path. Verify on the user's actual phone brand (unknown now, so it is an open question).

**Warning signs:**
Reminder works in the dev session with the screen on, but not after the phone has been idle overnight. The design depends on `Notification` + `setTimeout`.

**Phase to address:** P5 (design decision to use calendar/alarm export). Flag for phase-specific research once the phone model is known.

---

### Pitfall 8: Schema migration breaks old data (and old backups)

**What goes wrong:**
In week 6 a new field is added (e.g. RPE, warm-up flag, per-exercise increment) and the IndexedDB upgrade code is missing or buggy, so old rows crash the UI or the DB open fails. Or a backup exported by v3 cannot be imported by v7. Or the user restores a v7 backup into an old cached v3 app that silently drops fields. There is no developer on call to fix it.

**Why it happens:**
No explicit versioning from day one, ad hoc property additions, lack of migration tests. Exercise renames or deletions orphan history.

**How to avoid:**
- Design for evolution from the start: a numeric `schemaVersion` in the IndexedDB version and in every exported file. Write migrations as ordered, idempotent functions (`v1->v2`, `v2->v3`) run in `onupgradeneeded` and on import. Import accepts any older version and migrates in memory before writing. Import of a **newer** version than the app understands must refuse with a clear message and suggest updating the app.
- Prefer **additive** changes (new optional fields with defaults) and treat missing fields as defaults at read time.
- **Stable IDs:** exercises and program templates have immutable string IDs (`supino-reto-halteres`), never array indexes or display names. History rows reference the ID **and snapshot the name** at logging time, so editing or removing a library entry never rewrites history.
- Separate **static content** (exercise library, program templates, ship with the app code and get updated via SW) from **user data** (sessions, sets, body data, in IndexedDB). Updating the library must never touch user data.
- Keep a minimum set of fixture backups (v1 sample) in the repo and a documented manual test: "import v1 fixture into current build".
- Use a tiny hand-written IndexedDB wrapper or a very small vendored lib. Do not depend on a framework that will need upgrading.

**Warning signs:**
No `schemaVersion` in the export. Exercise identified by array position. A release where "just add a field" had no migration step.

**Phase to address:** P1 (versioning scheme, ID policy, content/data separation). Every later phase that touches the model must ship its migration plus fixture test.

---

### Pitfall 9: Logging a set is too slow or fiddly at the gym

**What goes wrong:**
The Core Value says "register a set in seconds, one-handed". Real conditions: sweaty thumbs, gloves, bad light, 4G with no signal, a phone in the other hand. If each set needs 6+ taps, typing weight and reps into small fields, or hunting for the "next exercise", the user stops logging by week 2 and the whole progression engine starves of data.

**Why it happens:**
Designed at a desk, tested sitting down. Generic number inputs. Every set treated as new data entry.

**How to avoid:**
- **Pre-fill from the suggestion/last session:** the default weight and reps are the suggested ones, so a normal set is **one tap ("Done")**. Edit only on deviation, with large +/- steppers (per-exercise increment, e.g. 2.5 kg) and a quick reps picker rather than a keyboard.
- Touch targets at least 48 px, primary actions in the thumb zone (bottom of the screen), high contrast, no hover-only affordances.
- Auto-start the rest timer on "Done" (with a visible countdown), auto-advance to the next set or exercise.
- **pt-BR decimal trap:** Android keyboards in Brazil produce `42,5` with a comma. `parseFloat("42,5")` returns 42, silently dropping the half kilo. Normalize `,` to `.` on parse, use `inputmode="decimal"`, or avoid the keyboard entirely with steppers. Display with a comma, store as a number.
- No loading spinners, no network calls, no modal confirmations on the logging path. Undo for the last set instead of "are you sure".
- Use `requestAnimationFrame`-friendly lightweight rendering. No heavy frameworks. Keep the logging screen under a handful of DOM nodes.
- Optional fields (RPE / "reps in reserve") must be skippable with zero extra taps, and appear as a single optional row, not a required step.
- Rest timer must compute from a stored `endAt` timestamp, not by decrementing a counter in `setInterval` (Android throttles background timers). Use vibration (`navigator.vibrate`) and a sound only after a user gesture has occurred, and expect these to be unreliable with the screen locked (Wake Lock helps).
- Usability-test on the actual phone, standing up, in the actual gym on day one of December and budget a "gym-feedback" fix cycle.

**Warning signs:**
Logging a normal set takes more than 2 taps. A numeric keyboard appears for every set. The user logs sets after the workout instead of during it ("batch logging at home").

**Phase to address:** P2 (log screen, timer), validated with real use in P3. Plan an explicit usability polish pass after the first week of real gym use.

---

### Pitfall 10: Timezone and date bugs in daily logs

**What goes wrong:**
Sleep/energy, weight, protein and "did I train today" entries land on the wrong day. Classic cause: using `new Date().toISOString().slice(0,10)`, which is **UTC**. In Brazil (UTC-3), anything logged after 21:00 local, such as the nightly sleep/energy note or an evening protein entry, gets tomorrow's date. Streaks then break or double-count. A workout that started at 23:50 and ended at 00:20 is split. Date strings sorted as locale-formatted text (`18/11/2026`) sort wrongly.

**Why it happens:**
UTC-based date helpers are the default. Locale string formats used as keys. Brazil abolished DST in 2019, so DST bugs are unlikely, but travel or a changed phone timezone can still shift dates.

**How to avoid:**
- Store each day-keyed entry with a **local calendar date string `YYYY-MM-DD`** derived from local getters (`getFullYear/getMonth/getDate`), plus a separate full ISO timestamp (`createdAt`) for ordering. Compute "today" in one single helper (`localDateKey()`) and use it everywhere.
- Define a session's date by its **start** time, in local time. Let the user edit the date of any entry (forgot to log yesterday).
- Weeks for the "weekly frequency" goal: pick and document the week start (Monday in Brazil) and calculate week keys from local dates, not from `Date` math across time zones.
- Format dates for display with `Intl.DateTimeFormat('pt-BR')`. Never parse display strings.
- Unit tests (or a tiny node script) for the boundary cases: 23:59, 00:01, month and year boundaries, leap day.

**Warning signs:**
`toISOString` appears in date-key code. A late-night entry shows up on tomorrow's chart.

**Phase to address:** P1 (date helper utility), reused in P4 and P5 (streaks, goals).

---

### Pitfall 11: Hidden hosting and "maintenance without AI" dependencies

**What goes wrong:**
The app works for months and then breaks because something external changed: a CDN-hosted chart library or font disappeared (offline use breaks immediately), a build toolchain stops running on the user's machine, an npm dependency is abandoned, YouTube video links die (deleted or private videos), or the user cannot redeploy because nobody documented how. With the Claude subscription ending, nobody can repair it.

**Why it happens:**
Convenience: CDN script tags, npm frameworks, bundlers. Specific video IDs hard-coded for 20-30 exercises.

**How to avoid:**
- **Zero build step if possible:** plain HTML, CSS and ES modules deployed as-is to GitHub Pages. If a chart library is unavoidable, **vendor the file into the repo** and precache it. Even better, draw simple line charts with inline SVG or `<canvas>` (about 100 lines of code). No CDN fonts, no remote images.
- Everything needed for a workout must be precached (verify by opening the installed app in airplane mode after a fresh install). Only YouTube needs network.
- **Exercise video links:** use YouTube **search-result links** (`https://www.youtube.com/results?search_query=...`) as the primary link, or a few well-chosen channels with a search fallback, so a deleted video does not become a dead end. If specific video IDs are used, store them as a data field so they can be swapped by editing a single file, and keep text instructions as the primary content.
- Write a **MAINTENANCE.md** (in Portuguese for the user) covering: how to edit exercises, how to deploy (drag files / `git push`), how to bump the version, how to test offline, and what never to change (URL, DB name, IDs). Pin the repo under the user's own GitHub account (not just a Claude-session workspace) and keep a zip copy of the repo in Drive.
- Keep the code understandable to a non-expert: small files, comments in plain English or Portuguese, no clever abstractions.

**Warning signs:**
Any `<script src="https://...">`. A `package.json` with more than a handful of runtime dependencies. No written deploy steps.

**Phase to address:** P1 (no-build/vendored decision), P6 (MAINTENANCE.md, offline fresh-install test).

---

### Pitfall 12: The installed icon/name change problem (WebAPK identity)

**What goes wrong:**
Name and logo are "to be defined". On Android Chrome, installing a PWA creates a WebAPK whose name, icon and `start_url` were minted at install time. Changing them later updates only lazily (Chrome checks periodically) and sometimes requires uninstall and reinstall. Reinstalling is risky if the user also clears site data (Pitfall 1). A missing maskable icon makes the launcher icon look wrong (white-padded square).

**Why it happens:**
The branding is decided after the first install on a test phone.

**How to avoid:**
- Settle the name, short name and icons **before the user's first real install** (P6 release phase, or earlier if the user installs a preview). Provide 192 and 512 PNG icons plus a `purpose: "maskable"` icon with safe-zone padding, and a themed `theme_color`/`background_color`.
- Use a stable manifest `id` so the app identity does not change when `start_url` is tweaked.
- If the identity must change after install, tell the user to **export a backup first**, then reinstall.
- Check installability on the real device (Chrome menu shows "Install app", not "Add to home screen" shortcut, which behaves differently and loses standalone mode).

**Warning signs:**
Home screen icon is a screenshot-like tile. The app opens in a Chrome tab with an address bar.

**Phase to address:** P1 (manifest skeleton with `id`), P6 (final name/icon before real install).

---

## Behavioral and Product Pitfalls (absolute beginner)

### Pitfall 13: Dropping out in the first 4-8 weeks

**What goes wrong:**
This is the dominant failure of any gym app for a novice. Typical triggers: the first two weeks of muscle soreness (DOMS) feel like "something is wrong", the gym feels intimidating (machines unknown, nobody to ask), no visible results by week 3-4 (visible change in the mirror lags; strength rises fast but looks do not), one missed week creates a "broken streak" guilt spiral, and sessions are too long (8-10 exercises, 90 minutes) so the habit does not survive a busy week. Commonly cited industry figures put roughly half of new gym members out within about six months (LOW-MEDIUM confidence on exact numbers, strong consensus on direction).

**Why it happens:**
Apps optimize for tracking and charts, not for the first 30 days of habit formation. Programs designed for experienced lifters are handed to a beginner.

**How to avoid:**
- **Keep sessions short and finishable:** full body, ~5-7 exercises, 2-3 working sets each, target 40-55 min including rest. A "short version" (3-4 core exercises) for low-time days counts as a completed workout.
- **Make progress visible early and honestly:** show strength numbers going up (small wins from week 1: "+2 reps", "+2.5 kg", "first PR"), because strength gains arrive long before body changes. Celebrate "workouts completed" and "first time on machine X", not weight.
- **Normalize soreness:** a first-two-weeks screen or tip ("dor muscular tardia e normal; some em 2-3 dias; dor aguda/articular nao e") and a lighter first week by design.
- **Onboarding for the intimidated:** a "primeiro dia" guide (how to adjust the seat, which machine is which, ask staff, etiquette) and an explicit "use the machine or a light dumbbell" start. Minimal text, in the exercise screens.
- **Habit design:** define success as sessions per week with a minimum viable target (2 sessions is a win, 3 is the goal). A missed workout never produces red or "you failed" language. Habit research suggests a single missed day does not meaningfully derail habit formation; formation takes weeks (median about two months in the Lally et al. study, with wide variance, MEDIUM confidence).
- **Early-warning signal in the app:** if no workout in 10 days, show a gentle "bem-vindo de volta, retome com o treino leve" screen (see Pitfall 17), not a guilt screen.

**Warning signs:**
Average session length over 60 minutes. Fewer than 2 sessions in a week more than twice in the first month. Long gaps after week 2. The user starts skipping the logging.

**Phase to address:** P2 (short session design, first-day guide), P3 (early wins), P5 (flexible goals/streaks).

---

### Pitfall 14: Ego lifting and too-fast progression

**What goes wrong:**
A beginner who does not know his starting weights either (a) guesses far too heavy (form breaks down, injury, or a grinder session that kills motivation) or (b) is told by an auto-progression rule to add weight every session regardless of how it felt. Dumbbell and machine jumps are not uniform: +2.5 kg on a 10 kg dumbbell is a 25% leap. The suggested load becomes a lie after a bad night of sleep, and the user either fails the suggestion repeatedly or grits through ugly reps.

**Why it happens:**
Naive "+X kg every session" logic. No concept of reps in reserve. One-size increments. Beginners also confuse "heavy" with "good".

**How to avoid:**
- **Load discovery phase (first 2 sessions of each exercise, or first 1-2 weeks):** start deliberately light (movement-learning weights), ask the single question after each set: "Quanto sobrou?" (Muito / Dava mais 2-3 / No limite). Use that to jump to a working weight in 2-3 steps, aiming at about 2-3 reps in reserve for the first weeks. Present it as a "find your weight" mission, not a test.
- **Double progression with guard rails:** a rep range (e.g. 8-12). Add reps first, and **only when all working sets hit the top of the range (with good form / RPE not maxed) suggest the next load**. Never suggest an increase after a failed or "no limite" session.
- **Per-exercise increments reflecting equipment:** upper-body small (1-2.5 kg, or the next pin or dumbbell), lower-body larger (2.5-5 kg). Allow the user to set his gym's actual increments (his machine's weight stack steps, available dumbbells), since 1.25 kg plates and fractional weights often do not exist.
- **Cap the weekly increase** and always allow "keep the same weight" and "reduce" in one tap. The suggestion is a suggestion; the user decides.
- Prefer machines and dumbbell/bodyweight movements for the first weeks over barbell squat/deadlift unless form is taught well.
- Sanity checks on entry: if a logged weight is more than ~30-40% above or below the last session, ask "is this right?" (also catches typos like 800 kg, which would otherwise create a fake PR and wreck charts).

**Warning signs:**
Many "failed" sessions on the suggested load. Logged weights jump irregularly. Form-related notes or pain flags increasing. A logged 100 kg "PR" in week 1.

**Phase to address:** P3 (load discovery, progression engine, increments). Needs phase-specific research (see Research Flags).

---

### Pitfall 15: Program-hopping and swapping the plan every week

**What goes wrong:**
Beginners change routines after 2 weeks because another influencer's split looks better, destroying the one thing that works: repeating the same exercises long enough to progress. The app makes this worse if it offers easy program switching, unlimited free-form workout building and a catalogue of 20 programs.

**Why it happens:**
Novelty seeking, social media noise (the user already follows "dieta da selva" influencers), and boredom.

**How to avoid:**
- Ship **one** well-justified full-body A/B program and **commit** to it with an explicit 8-12 week block. Show "Semana 3 de 12" and what progress to expect.
- Make changing the program an **intentional, slightly harder action** (Settings, confirmation, a note that history is kept). Provide **exercise swap** inside a session (equipment busy, pain) as a lightweight, always-available action that does not alter the program, and log the substitution.
- No program marketplace, no free-form template editor in v1.
- At the end of the block, show a review ("what you gained") before offering next steps.

**Warning signs:**
The program change feature is built before the history screens. The user asks for a new program in week 3.

**Phase to address:** P2 (single program + swap), P6/roadmap backlog for "next block" only after real usage.

---

### Pitfall 16: Over-tracking burnout (too many fields, too many modules)

**What goes wrong:**
The requirements list is broad: sets, RPE, nutrition, weight, photos, measurements, sleep, energy, goals. If daily use requires touching all of it, the app turns into homework. People abandon trackers that demand more than about a minute a day outside the workout. Nutrition logging is the classic killer, and this user explicitly does not want "neurosis".

**Why it happens:**
Feature-completeness over adherence. Every field seems small in isolation.

**How to avoid:**
- Strict tiering of effort: **Tier 1 (always, in the workout):** weight and reps via one-tap done. **Tier 2 (optional, 5 seconds):** "quanto sobrou", sleep/energy 1-5 (two taps), protein via simple "refeições com proteína hoje: 0-4" or portion counting. **Tier 3 (rare, scheduled):** body weight (weekly suggested), photos and tape measurements (every 2-4 weeks).
- **Every optional field must be skippable and must never block** finishing a workout or leaving a screen. No required forms. No daily "you haven't logged X" nags beyond a single gentle weekly prompt.
- Protein "light mode": meal-level checklist or hand-portion estimates with a daily target shown as a **range and a progress ring**, not a gram ledger. Offer exact grams only as an opt-in. (Evidence context: about 1.6 g/kg/day is the level beyond which extra protein gives little added muscle benefit in meta-analysis, with upper confidence around 2.2 g/kg. For 70 kg that is roughly 110-150 g/day, so ~120 g is plausible but not sacred, MEDIUM confidence.)
- Build modules in order of Core Value. If time runs short, nutrition, measures and photos are the first to be cut or simplified.
- Review the home screen: it should answer "what do I do today?" with one big button, not display twelve widgets.

**Warning signs:**
The workout cannot be completed without filling optional data. The home screen has more than ~4 actions. The user stops logging nutrition by week 2 and then feels guilty and avoids the whole app.

**Phase to address:** P2 (keep the logging path lean), P4 (light-touch body/nutrition/sleep UX), roadmap prioritization throughout.

---

### Pitfall 17: A missed week "breaks" the plan, and a long gap makes the next session dangerous

**What goes wrong:**
Two linked failures. First, fixed weekly plans ("Monday = Workout A") show missed days in red and the user feels behind. Second, the app resumes suggesting last session's weights after a 3-week break (illness, travel), when the body has detrained, which risks injury or a demoralizing failure.

**Why it happens:**
Calendar-bound schedules, streaks counting consecutive days, progression logic that ignores time since last session.

**How to avoid:**
- Keep the project decision: **rotation, not weekdays**. "Next workout" is whichever of A/B is next in rotation, independent of the date.
- **Goals and streaks on a weekly basis, with slack:** "weekly frequency streak" counts weeks that met the (modest) target; allow a one-week grace/pause ("semana de descanso") so one bad week does not reset to zero. Show "this week: 1 of 3" neutrally. Never use alarming red.
- **Detraining rule:** if more than ~14 days passed since an exercise was last done, the suggestion drops (roughly 10-20% reduction, longer breaks bigger) and the screen says why ("voltando de uma pausa, comece mais leve"). After 4+ weeks, re-run the short load-discovery.
- **Illness/travel pause:** a one-tap "pausa" mode that freezes streak and reminders.

**Warning signs:**
Streak logic keyed to consecutive days. Suggestions identical regardless of the gap. User opens the app after a break and sees "0 streak" in red.

**Phase to address:** P3 (gap-aware progression), P5 (streak/goal design).

---

### Pitfall 18: Unrealistic goals, scale obsession, and demoralizing body data

**What goes wrong:**
The user wants muscle and aesthetics. Typical beginner expectations (+5 kg of muscle in 2 months) clash with reality. A beginner male can often gain on the order of 0.5-1 kg of lean mass per month early on, slowing later (rule-of-thumb figures, MEDIUM-LOW confidence, individuals vary widely). Daily body weight fluctuates 1-2 kg from water, food and sleep, so a daily weight chart looks like noise and a bad day reads as failure. Photos in different lighting and poses mislead. Tape measurements taken inconsistently mislead too. Goal-setting UIs that accept "gain 8 kg by February" set the user up to quit.

**Why it happens:**
Charts of raw data with no smoothing, free-form goal inputs, no expectation setting.

**How to avoid:**
- Show a **7-day (or weekly) moving average** as the main body-weight line, with raw points faint. Suggest weighing at the same time (morning, after the toilet) 1-3 times per week. Do not show day-over-day deltas in red.
- **Goal templates with realistic ranges** and a warning when input is outside plausible bounds. Weight goals expressed as a range over a longer horizon; **process goals first** (workouts per week, sessions completed, first pull-up variation, first time lifting body weight on leg press). The project already says load goals only after a baseline exists. Keep that.
- Progress photo helper: same place, same light, same pose, same time of day, relaxed and flexed optional; a ghost overlay of the previous photo is a nice-to-have, not v1. Measurements monthly at most, with a note on where to measure (same landmarks).
- Frame strength as the leading indicator: charts per exercise are the main "evidence" in the first 8 weeks.

**Warning signs:**
Weight goal date less than ~8 weeks away with an unrealistic delta. Daily weight chart as the home screen hero. Many missed body-weight entries, followed by quitting.

**Phase to address:** P4 (body-data UX, smoothing, photo guidance), P5 (goal templates).

---

### Pitfall 19: Pain and injury signals get ignored (or the app gives false medical certainty)

**What goes wrong:**
Beginners confuse soreness with pain and push through joint or sharp pain. Poor form on unfamiliar movements (squat, deadlift, overhead press) is the main early injury risk. An app that mechanically suggests "+2.5 kg" on an exercise that hurts is irresponsible. Conversely, the app should not pretend to diagnose.

**Why it happens:**
Trackers record numbers only. Pain is not a first-class concept.

**How to avoid:**
- A one-tap **"Doeu / desconforto"** flag per exercise (not per set, not required). A flagged exercise blocks auto-increase, shows safe guidance ("dor muscular e normal; dor aguda, em articulação ou que piora: pare, troque o exercício e procure um profissional se persistir"), and offers an easy-regression alternative.
- Execution text per exercise must include the 2-3 most common errors (already planned) and a "when to reduce weight" cue. Prefer machine/regressed variants early.
- A short pre-start screen suggesting a medical check or PAR-Q-style questions for a 32-year-old new to training (informational, not blocking). Add a neutral "this app is not medical advice" line in Settings/About.
- Log substitutions and pain flags in history so patterns are visible ("shoulder pain flagged 3 times in 2 weeks").

**Warning signs:**
Repeated pain flags on one movement. Progression continuing despite flags. No pain concept in the data model.

**Phase to address:** P2 (data model includes the flag and swap), P3 (progression honors flags).

---

### Pitfall 20: Plateaus, stalls and "deload" handled badly (or over-engineered)

**What goes wrong:**
A novice following double progression will eventually stall on some lifts. The app keeps suggesting the same weight (feels broken), or the user loses motivation, or the roadmap over-builds a sophisticated periodization/auto-deload engine that is never needed in the first 3 months and cannot be debugged without AI.

**Why it happens:**
Copying advanced-lifter features, or having no stall logic at all.

**How to avoid:**
- Beginners progress quickly for the first 8-12 weeks. A scheduled deload is rarely needed at the start. Keep logic simple and transparent:
  - **Stall rule:** if the same load fails to hit the minimum rep target for 3 consecutive sessions, suggest a ~10% reduction and rebuild (or swap the exercise variation), explained in one sentence.
  - **Optional soft deload prompt** around week 6-8 or when several lifts stall together or the user reports low energy plus bad sleep (the energy/sleep notes can feed a gentle "consider an easier week" suggestion). It must be a suggestion, never automatic.
- Make stall detection a pure function over history that is easy to read and test.
- Show plateau as a normal event ("platos acontecem; aqui esta o plano") rather than a failure state.
- Leave rich features (RIR autoregulation, periodization blocks) out of v1 (see Technical Debt).

**Warning signs:**
Many lines of progression code, special cases per exercise, or hard-to-explain suggestions. Users (the one user) override the suggestion most of the time.

**Phase to address:** P3 (simple stall rule). Revisit after 8 weeks of real data (post-v1).

---

### Pitfall 21: Wrong or fake PRs and misleading charts

**What goes wrong:**
Typos or test entries create impossible PRs that permanently dominate charts. Warm-up sets are counted as working sets. A rep PR at a lighter weight is confused with a weight PR. Changing the exercise variation or machine (a "Leg Press" in another gym) breaks continuity. Bodyweight movements and machines with different weights per brand are not comparable.

**How to avoid:**
- Mark each set as `warmup` or `working` (default working; warm-ups optional and excluded from PR/volume/progression).
- Define PR types explicitly: **max weight at >= N reps**, or estimated 1RM (Epley) only as a secondary, clearly labeled metric. Use "best set" per exercise per date for charts.
- Allow editing and deleting any past set; recompute derived PR data from raw history (derive on read, do not store PR flags permanently) so fixes propagate.
- Add the range sanity check from Pitfall 14.
- Note the machine/gym in an optional free-text field on the exercise; do not force it.

**Warning signs:**
PR flags stored as fields on sets. A chart y-axis exploded by one outlier. Warm-up sets inflate weekly volume.

**Phase to address:** P2 (set model), P3 (PR/chart logic).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep state in memory, save at "Finish workout" | Simple code | Lose whole sessions on reload (Pitfall 6) | Never |
| `localStorage` for history | Zero setup | 5 MB cap, sync blocking, no queries, data split across stores | Only for trivial UI prefs (never user data) |
| Store photos as base64 in JSON/IDB | Easy export | Bloated storage, 33% larger, memory spikes | Never |
| UTC date keys (`toISOString().slice(0,10)`) | One-liner | Wrong day for evening entries in UTC-3 (Pitfall 10) | Never |
| Reference exercises by name or array index | Faster to write | Renames and reordering corrupt history | Never |
| No `schemaVersion` in DB or export | Skips design thinking | Impossible to migrate old data or backups (Pitfall 8) | Never |
| CDN scripts/fonts | Quick charts and fonts | Breaks offline and breaks when the CDN dies | Never for anything used in-gym |
| Framework + bundler (React/Vite etc.) | Familiar DX | Needs updates and a build environment with no AI available | Only if the user can still build; default to no-build |
| Hard-coded YouTube video IDs spread through code | Quick content | Dead links, scattered fixes | Acceptable only if centralized in one data file with a search-link fallback |
| `skipWaiting` + auto reload on update | Instant updates | Mid-workout reload, mixed-version state | Acceptable only if update is applied between sessions |
| Elaborate periodization/auto-deload engine | Impressive | Unmaintainable without AI, unneeded for a beginner | Never in v1 |
| Manual JSON export as the only backup | Cheap | Not done in practice (Pitfall 2) | Acceptable only with nudges and a tested restore |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GitHub Pages | Absolute `/` paths; unknown repo path; no `.nojekyll`; case-mismatched filenames; changing account or repo name later | Relative paths, `.nojekyll`, exact filename case, permanent URL decided before install, test on the live URL |
| Service Worker + Pages | Cache-first with fixed cache name; HTTP `max-age=600` delays; update stuck in "waiting" | Versioned caches, atomic precache, update toast between workouts, version shown in Settings, "force update" button |
| YouTube | Hard-coded video IDs that rot; embedding iframes that fail offline | Outbound links (search-URL fallback), text instructions as the primary content, graceful offline message |
| Web Share API | Assuming JSON files are always shareable; calling it without a click | Feature-detect `canShare({files})`, call from a click, fall back to `<a download>` |
| Android camera (`input capture`) | Page reloads when returning from the camera and loses state | Persist state before opening, restore on load, test on a low-memory phone |
| Notifications | Relying on in-page timers or Notification Triggers (development ended) | Calendar/alarm export for the reliable reminder; permissions only on opt-in |
| Android Chrome install | Testing only "Add to home screen" shortcut mode; changing name/icon after install | Test true install (WebAPK) on the device; finalize branding before the real install |
| Wake Lock | Acquire once and forget; lost on tab hide | Re-request on `visibilitychange`, handle failure silently |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading the whole history into memory for charts | Slow startup, janky charts | Query by exercise and date range with IDB indexes; precompute per-exercise summaries lazily | A few thousand sets (about 6-12 months of use) |
| Full-resolution photos | Slow gallery, large storage, backups fail | Resize at capture, thumbnails, lazy-load | Dozens of photos |
| Re-rendering the whole DOM on each tap | Laggy logging | Update only the changed row, keep the logging screen small | Immediate on low-end Android |
| `setInterval` countdown for rest timer | Drift and freezing when throttled/locked | Store `endAt`, recompute remaining time on each tick and on `visibilitychange` | Whenever the screen locks |
| Large JSON string building for export | Tab freeze, crash | Stream or build in chunks; exclude photos by default | Photos in base64 or very long history |
| Precaching too many assets | Slow first install, install failures | Small shell, lazy-cache the exercise images (none planned), no GIFs (already out of scope) | Hundreds of KB per exercise |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Importing a backup without validation | Corrupt or malicious JSON breaks or overwrites data; script injection if names are rendered as HTML | Validate schema, cap sizes, render all user text with `textContent` (never `innerHTML`) |
| Overwriting data on import without a snapshot | Irreversible loss on a wrong file | Dry-run summary, explicit confirmation, keep a pre-import copy until the next successful launch |
| Sharing backup via WhatsApp/Drive without awareness | Health data and photos land in chats/cloud | Make the contents explicit in the export UI; photos opt-in; the user decides where it goes |
| Progress photos left in the system gallery | Privacy leak if the phone is shared | Keep the photo store inside IndexedDB (not saved to the gallery), say so in the UI |
| Third-party scripts (analytics, CDN) | Tracking, supply-chain risk, offline breakage | None. No analytics, no external scripts |
| Medical claims | False authority if the app says "you have an injury" | Neutral, general guidance plus a non-medical-advice disclaimer |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Home screen shows dashboards instead of "today's workout" | Slows the one task that matters | One big "Start Workout A/B" button; everything else secondary |
| Required fields (RPE, notes) on each set | Logging abandoned | All optional, skip by default |
| Red/"failed" visuals for missed sessions | Guilt, drop-out | Neutral language, weekly targets with grace |
| Kg-only decimal keyboard, comma/dot issues | Wrong weights recorded | Steppers, `inputmode="decimal"`, normalize `,` to `.` |
| Small tap targets and dense tables | Mis-taps with sweaty hands | 48 px+ targets, thumb-zone actions |
| Charts of raw daily weight | Noise reads as failure | Moving average, weekly view |
| Unexplained suggestions ("do 47.5 kg") | Mistrust, override or ignore | One-line reason ("fez 3x12 com 45 kg, subindo 2.5") |
| Back button closes the app mid-workout | Frustration, data worries | Back navigates within the app; session auto-resumes |
| Notification permission asked on first launch | Denied permanently | Ask only after the user opts in to reminders |
| Wall of exercise text | Not read at the machine | Short steps (3-5 bullets), common errors, a video link, bold the single most important cue |
| Light theme in a dim gym or dark gym glare | Eye strain | Support dark mode and high contrast; test in bright and dim settings |

## "Looks Done But Isn't" Checklist

- [ ] **Offline mode:** Often only works while the cache is warm. Verify by fresh-installing on the phone, opening the app once online, switching to airplane mode, force-stopping the app, and doing a full workout.
- [ ] **Install:** Often only a home-screen shortcut. Verify it launches standalone (no browser bar) with the right icon and name.
- [ ] **Persistent storage:** Often never requested. Verify `navigator.storage.persisted()` result is shown in Settings.
- [ ] **Backup/restore round trip:** Often export-only. Verify: export, clear site data, import, and compare counts, charts and photos.
- [ ] **Backup nudges:** Often missing. Verify the banner appears after the threshold and disappears after a successful export.
- [ ] **In-progress workout:** Often lost on reload. Verify by killing the app mid-session, reopening, and seeing the resume prompt with all sets intact.
- [ ] **Rest timer:** Often wrong after lock/background. Verify with the screen locked for the rest period.
- [ ] **Service worker update:** Often never tested. Verify by deploying v2 with a visible change and a schema change, and watching the phone update without data loss.
- [ ] **Schema migration:** Often untested. Verify by loading a v1 backup fixture into the latest build.
- [ ] **Dates:** Often wrong at night. Verify by changing the phone clock to 23:30 and 00:30 and logging sleep/weight.
- [ ] **pt-BR decimals:** Often parsed wrong. Verify entering `42,5` yields 42.5 everywhere, charts included.
- [ ] **GitHub Pages paths:** Often fine locally. Verify the live URL including icons, manifest, SW scope, case-sensitive file names.
- [ ] **Reminder:** Often works only while open. Verify the calendar/alarm path rings with the phone idle overnight, on the real phone model.
- [ ] **Photos:** Often huge. Verify a stored photo is under ~300 KB and that the backup size is sane.
- [ ] **First-run experience:** Often a blank state. Verify day-1 flow: guide, load-discovery start, first workout fully completable by a total novice.
- [ ] **Maintainability handoff:** Often forgotten. Verify MAINTENANCE.md lets the user redeploy and version-bump without help.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Data wiped, backup exists | LOW | Reinstall the PWA, Settings > Import, verify counts |
| Data wiped, no backup | HIGH | Nothing automated can restore it. Start fresh; seed the first sessions from memory or notes. This is why Pitfalls 1-2 are Critical |
| User stuck on an old version | LOW-MEDIUM | Settings > Force update (clear caches, keep IndexedDB). Last resort: backup, reinstall, import |
| Origin or URL changed | MEDIUM | Open the old URL in the browser (if still reachable), export backup there, then import into the new install |
| Migration bug corrupts rows | MEDIUM-HIGH | Restore the last pre-upgrade backup into the fixed build; keep the automatic pre-migration snapshot to enable this |
| Wrong dates in logs | LOW | Edit-date feature on entries; run a one-off fix migration |
| Fake PR or typo data | LOW | Edit/delete set; PRs derived on read so they heal automatically |
| Dropped out for weeks | LOW (product) | Gap-aware "welcome back" session at ~85% of previous loads; do not show old streak failure |
| Pain flagged repeatedly | MEDIUM | Swap the exercise, lower the load, and suggest professional assessment if persistent |
| Reminder not firing | LOW | Fall back to the calendar/phone alarm path |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1 Data loss / persistence | P1, P5 | `persisted()` shown; wipe-and-restore drill passes |
| 2 Backup never done / bad file | P5 (schema in P1) | Nudge banner works; round-trip with counts match; share sheet tested on the phone |
| 3 Origin/path/Pages traps | P1, re-verified P6 | Live URL works offline on the phone; relative paths only; namespaced DB/cache names |
| 4 Service worker update traps | P1, verified P6 | v1 to v2 upgrade test on the phone; version visible; force-update works |
| 5 Photo bloat | P4, P5 | Stored photo size under ~300 KB; backup excludes photos by default |
| 6 In-progress workout lost | P2 | Kill-app-mid-session test resumes with all sets |
| 7 Reminder not firing | P5 | `.ics`/alarm path rings; permission asked only on opt-in |
| 8 Schema migration | P1, every later phase | v1 fixture imports into latest; unknown newer version refused |
| 9 Slow logging UX | P2, polish after first gym week | Normal set equals 1 tap; used one-handed at the gym |
| 10 Timezone/date bugs | P1 (helper), P4, P5 | 23:30/00:30 clock test; boundary tests |
| 11 Hidden dependencies/maintenance | P1, P6 | Zero CDN URLs; MAINTENANCE.md walkthrough |
| 12 WebAPK identity change | P1, P6 | Final name/icon set before real install; true standalone install |
| 13 Drop-out in weeks 4-8 | P2, P3, P5 | Session under ~55 min; early-win messaging; weekly (not daily) goals |
| 14 Ego lifting / over-fast progression | P3 | Load discovery works; no increase after a hard/failed session; per-exercise increments |
| 15 Program-hopping | P2 | Single program; swap-exercise exists; no program catalogue |
| 16 Over-tracking | P2, P4 | Workout completable with zero optional fields; home screen has one primary action |
| 17 Missed week / long gap | P3, P5 | Gap greater than 14 days lowers suggestion; streak has grace |
| 18 Unrealistic goals / weight noise | P4, P5 | Moving-average weight; goal range validation; process goals first |
| 19 Pain/injury signals | P2, P3 | Flag exists; flagged exercise stops auto-increase |
| 20 Plateau/deload | P3 | Simple 3-fail rule; no complex periodization |
| 21 Fake PRs/charts | P2, P3 | Warm-up flag; PR derived on read; range check |

## Research Flags (for the roadmapper)

- **P3 Progression:** Needs phase-specific research or an explicit design spike. Specifics: rep ranges and load-discovery protocol for a novice, per-exercise increments, stall and detraining rules.
- **P5 Reminder and backup:** Needs on-device verification. Unknowns: the user's phone model/OEM battery policy, whether Android share sheet accepts JSON, calendar `.ics` import behavior.
- **P1 Foundation:** Standard patterns. Low research risk, but the decisions (final URL, DB namespace, ID policy, schema versioning) are irreversible once the user has data, so decide them before writing code.
- **P2 Workout Core:** Standard patterns, but must be validated by real gym use; reserve slack for a usability pass after the first week in December.
- **P4 Body and Habits:** Standard. Only the protein "light mode" design warrants a short decision (portion-based vs grams) using the evidence range above.

## Sources

- Chrome for Developers, "Notification Triggers API" (page states that development has ended and launch is not started; triggers require a service worker registration and are lost if site data is cleared) - https://developer.chrome.com/docs/web-platform/notification-triggers - HIGH (official, fetched this session)
- Chromium discussion on `navigator.storage.persist()` heuristics (no prompt in Chrome; installed/engagement/notification-based; clearing storage still wipes data; old 2016-2017 criteria) - https://groups.google.com/a/chromium.org/g/chromium-discuss/c/AWMgYFD_gJs and https://web.dev/learn/pwa/offline-data - MEDIUM
- web.dev, "How to share files" (`navigator.canShare`, HTTPS, user gesture; permitted file types limited) - https://web.dev/articles/files/share-files - HIGH for the API contract, LOW for JSON acceptance on-device
- Chromium "Intent to Ship: File System Access on Android" and caniuse `showSaveFilePicker` (support on Android Chrome is recent and sources conflict) - https://caniuse.com/mdn-api_window_showsavefilepicker - MEDIUM
- Same-origin sharing of storage across GitHub Pages project sites (localStorage/IndexedDB are origin-scoped) - https://tomashubelbauer.github.io/github-pages-local-storage and MDN IndexedDB docs - MEDIUM-HIGH
- Android camera-capture or process-kill page reload reports (Vue/Chrome report; Mozilla bug on Android unloading the PWA process) - https://bugzilla.mozilla.org/show_bug.cgi?id=1807994 - LOW-MEDIUM; treated as a hazard to test, not a confirmed Chrome behavior
- Exercise science from background knowledge (not freshly fetched): Morton et al. 2018 protein meta-analysis (plateau near 1.6 g/kg, upper CI about 2.2); Lally et al. 2009 habit formation (median about 66 days, single misses not decisive); beginner lean-mass gain rules of thumb; typical double-progression and stall/deload practice - MEDIUM/LOW, recommend verification in the P3 and P4 phase research
- Domain experience: common failure modes of workout-logging apps (slow logging, over-tracking, streak guilt, wrong PRs) - MEDIUM

---
*Pitfalls research for: personal offline gym tracker PWA for an absolute beginner (Android, GitHub Pages, no server, no AI maintenance)*
*Researched: 2026-11-18*
