# Feature Research

**Domain:** Personal gym/workout tracker for one absolute-beginner user (offline PWA, Android, pt-BR, rotating A/B full-body program, morning training)
**Researched:** 2026-11-18
**Confidence:** MEDIUM overall. Official vendor docs (StrongLifts support, Hevy help center, Chrome docs, Morton 2018 meta-analysis) are HIGH. Competitor comparisons and "what users love/hate" come mostly from affiliate/vendor blogs and aggregators, so they are MEDIUM/LOW. Direct Reddit threads and app-store review text could not be retrieved, so user sentiment is inferred and flagged as such. Items marked *(background knowledge)* come from general domain knowledge, not from a fetched source this session.

---

## How the competitors map to this project

| App | What it is | What matters for us | Known friction |
|-----|------------|---------------------|----------------|
| **StrongLifts 5x5** | Fixed A/B alternating beginner program with auto-progression | **Closest model to our product.** Alternating A/B (not weekdays), one tap per set circle (extra taps = failed set), auto-add weight when all sets are completed, deload 10% after 3 consecutive failed sessions (configurable, HIGH, official support page). Missed sets mean same weight next time. | Locked to barbell 5x5; paywall for extras (MEDIUM). |
| **Strong** | Minimal, fastest-reputation logger | Previous values preloaded, auto rest timer, plate calculator, automatic PR flag, e1RM/volume/bodyweight charts (MEDIUM, comparison blog). | Free tier capped at 3 routines; no coaching, no progression engine. |
| **Hevy** | Logger plus social feed, dominant in BR app stores | Per-exercise rest timer started on set completion, set types (warm-up), optional per-set RPE toggle, supersets, previous performance, free unlimited routines (HIGH, Hevy help center). | Logger, not a coach: no auto-progression engine, so a beginner is left without direction (MEDIUM, Arvo comparison). Social features add complexity and occasional sync bugs (LOW, anecdotal). |
| **JEFIT** | Huge exercise database and program library | Exercise encyclopedia with instructions. | Dated, heavy UI, slow on older devices (MEDIUM/LOW). A big library is exactly what an absolute beginner does NOT need. |
| **Fitbod** | Paid algorithm that generates each workout | Beginner-friendly in reviews, adapts to logged history. | Repetitive or generic workouts, needs about 10-15 logged workouts before personalization is useful, about $16/month, billing and support complaints (MEDIUM). Randomized workouts also hurt motor-learning for a first-timer. |
| **Boostcamp** | Free library of named programs (coach/athlete-authored) | Free logger, RIR/RPE, plate calculator, rest timers, offline-capable (vendor claims, MEDIUM). | Little personalization, "can be confusing to navigate," limited analytics (MEDIUM). |
| **Liftosaur** | Open-source, scriptable ("Liftoscript") planner/tracker | Built-in Linear and Double progression plus custom scripting; proves a web-based, local-first tracker is viable (HIGH, official docs). | Scripting is power-user territory. Do not copy the scripting layer. |
| **Alpha Progression** | Auto per-set progression based on performance and RIR | Progression suggestions at set and program level are its selling point (vendor, MEDIUM). | RIR/RPE autoregulation thinner than marketed; expert settings paywalled. |
| **FitNotes (Android)** | Free, ads-free, fully offline log | Reputation for simplicity and offline reliability, CSV export plus separate full backup file (MEDIUM). CSV alone cannot restore; use a separate backup format. | Logger only. |
| **Caliber** | Coach-led (human) | Not researched in depth; only referenced in a competitor's comparison. | n/a |
| **MacroFactor / MyFitnessPal** | Nutrition trackers | *(background knowledge)* MacroFactor: trend-weight smoothing, adherence-neutral UI. MFP: huge crowd-sourced food DB, but noisy entries, ads, and key features paywalled. Both assume full calorie/macro counting, which this user explicitly does not want. | Use ideas only (smoothed weight trend), not the model. |
| **Brazilian apps** | Searched; no BR-specific workout logger stood out. Hevy has a pt-BR store listing. Many BR apps are gym-provided (e.g. Tecnofit, MFit) or generic "ficha" apps (Gym WP, Gym Day, SmartGym). | LOW confidence: no evidence found of a BR-specific must-have. The pt-BR differentiator is simply a genuinely Portuguese, beginner-oriented UX with correct terminology (carga, série, repetição, descanso, "quanto sobrou"). | Not researched deeply. |

**Key synthesis:** The market splits into (a) fast loggers (Strong, Hevy, FitNotes) that assume you already know what to do, and (b) paid coaches/generators (Fitbod, Alpha Progression) that are costly and opaque. A beginner needs a small "coach in a logger": a fixed program, explained exercises, a calibrated start, and visible auto-progression. StrongLifts proves the format works; no major app combines it with pt-BR instruction content, a load-discovery phase, and lightweight protein/body tracking. That combination is the differentiator.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Missing any of these makes the product feel broken versus Hevy/Strong/FitNotes.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **"Treino de hoje" home screen** (next workout in A/B rotation, one big start button) | Core Value of the project. Strong/StrongLifts surface "next workout" immediately. | LOW | "Próximo treino" = next in cycle after the last completed session; never tied to weekdays. Show "último treino há N dias." |
| **Fast set logging: 1-2 taps per set, prefilled** | The category's defining UX (Strong's reputation is "minimal taps per set"; StrongLifts: one tap on a circle logs a completed set). Constraint says one-hand use between sets. | MEDIUM | Prefill weight and reps from the suggestion (or last session). One tap = "done as planned." Tap to edit via big +/- steppers (no keyboard in the common path). Failed/short set = extra tap or quick rep stepper. Large targets, bottom-of-screen controls. |
| **Previous-session values inline** ("Anterior: 20 kg × 10") | Universal in Strong and Hevy; the main way users know what to beat. | LOW | Show per exercise, per set index. Doubles as the progressive-overload reference. |
| **Auto-starting rest timer** | Strong auto-starts it on set completion; Hevy per-exercise, configurable. | MEDIUM | Defaults: ~2 min compounds, ~90 s isolation (editable per exercise). +/-15 s buttons, vibration, sound. **PWA constraint:** implement as an end-timestamp compared to `Date.now()`, never tick counting. Screen Wake Lock keeps the screen on only while the page is foreground, and is released if the user switches apps. There is no reliable background alert; accept foreground-only alert plus recompute on `visibilitychange`. |
| **Workout draft persistence (resume in-progress session)** | Phones kill background tabs and users get interrupted. FitNotes-style offline reliability is the baseline. | MEDIUM | Write every logged set to IndexedDB immediately. On reopen, offer "continuar treino em andamento." This is a PWA-specific table stake that competitors get for free as native apps. |
| **Exercise library with instructions** (steps, common mistakes, muscles, machine setup) | A beginner who never entered a gym cannot use the app without this. JEFIT's reputation is the library. | MEDIUM (code LOW, content HIGH effort) | Only the ~10-14 exercises in the A/B program, not hundreds. Per exercise: pt-BR step-by-step, 3 common errors, target muscles, "ajuste do aparelho" (seat/handle), safety cue, substitutes, and a YouTube link. Authoring and accuracy review is the real work. |
| **Exercise detail one tap from the set screen** | Beginner will forget the cues mid-workout. | LOW | Bottom sheet from the exercise name; works offline. |
| **Video link to YouTube** | Project decision (text plus link, no GIFs). | LOW | Prefer a stable YouTube **search URL** (`youtube.com/results?search_query=...`) or curated video IDs with a search fallback, since video IDs rot. Only this needs network. |
| **Starting-load discovery ("calibração")** | Core pain: user does not know loads. Hevy/Strong leave this blank; Fitbod hides it in an algorithm. | MEDIUM | See Differentiators for the recommended design. Without it the user either guesses badly or quits. Listed here as table stakes for *this user*, even though competitors do not do it. |
| **Automatic progression: next-session load suggestion** | StrongLifts's whole premise; Liftosaur ships Linear and Double built in; Alpha Progression sells it. Project's Core Value. | MEDIUM | Recommend **double progression** (rep range, then add weight) as the default rule. Per-exercise configurable increment (barbell 2.5 kg, dumbbell/machine often 1-2 kg steps, so make it configurable per exercise). Rule needs a manual override that wins. |
| **Failure handling and conservative deload rule** | StrongLifts default: weight stays after a failed session; after 3 consecutive failed sessions weight drops 10% (HIGH). | LOW-MEDIUM | Same pattern here. Add "after a long break (>14 days), restart at ~90%" *(background knowledge, flag for validation)*. |
| **Per-exercise history list** | Every tracker has it. | LOW | Date, sets, reps, load, notes. |
| **Progress chart per exercise** (top-set load, and e1RM) | Strong shows e1RM, volume, and bodyweight charts. | MEDIUM | Epley e1RM, only for sets ≤ ~10 reps (accuracy drops beyond). For a beginner, "carga do melhor set por treino" is easier to read than e1RM, so show load first and e1RM as a toggle. Build charts with inline SVG or a tiny canvas helper (no heavy charting dependency). |
| **PR detection** | Strong flags automatically with a small animation; Hevy also automatic. | LOW-MEDIUM | Types: heaviest load at ≥N reps, most reps at a load, best e1RM. **Suppress during calibration** and during the first sessions of a new exercise, or beginners get a "PR" every set and the signal is worthless. |
| **Per-set notes / per-exercise notes** | Universal in loggers; for a beginner, machine settings ("banco no 4") are gold. | LOW | Persistent exercise note ("assento 5, pegada média") shown next session. |
| **Body weight log with chart** | Standard in Strong/Hevy; core goal tracking. | LOW | Add a 7-day moving average line; daily scale noise is large relative to expected change (about 0.25-0.5 kg/week for a novice gaining). |
| **Offline-first and installable (PWA)** | Gym signal is poor. FitNotes and Boostcamp are valued for offline reliability. | MEDIUM | Service worker precache, IndexedDB, no runtime network dependencies besides the video link. Request `navigator.storage.persist()` to reduce eviction risk. |
| **Backup/export and import** | Users distrust local-only data; FitNotes pairs CSV with a restorable backup. Here it is the only data-loss protection (no cloud). | LOW-MEDIUM | One `.json` full-state file (restorable) plus optional CSV of sets for spreadsheet use. Include a "último backup há N dias" nudge on the home screen. **Photos:** base64 inside JSON gets huge; keep photos out of the default backup and make photo export a separate optional action. |
| **Settings: units (kg), rest defaults, increments** | Every tracker. | LOW | kg only; pt-BR decimal comma. |
| **pt-BR UI throughout** | Project constraint. | LOW | Use the vocabulary users actually use: carga, série, repetições, descanso, "treino A/B." |

### Differentiators (Competitive Advantage)

Aligned with the Core Value: "know what to do, how to do it, and with how much weight, and log it in seconds."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Guided starting-load calibration** | Solves the project's #1 unknown. No mainstream logger does it explicitly. | MEDIUM | Design: first 1-3 sessions per exercise are flagged "descobrindo carga" (hidden from PRs and goals). Start with the empty bar or lightest machine setting, aim for 10-12 reps. After each set, one 3-button question: "Sobrou muito / Sobrou pouco / Quase falhei" (plain-language RIR, not "RPE 7"). The app proposes the next set's load (+ if "muito," same if "pouco," − if "quase falhei"). Target landing zone is roughly 2-3 reps in reserve (sources agree on 2-3 RIR for novices; beginners misjudge effort, so bias conservatively and explain). When two consecutive sets land in the zone, lock that as the baseline and switch the exercise to double progression. Do not seed numeric starting loads: machine stacks differ per gym; only the Olympic bar (usually 20 kg) is safe to assume. |
| **A/B rotation without weekdays** | The user's week is irregular; StrongLifts does the same alternation but is barbell-only. | LOW | State is just "last completed workout → next one." Skipping days never breaks the plan. Weekly goal counts sessions, not days. |
| **Beginner-oriented plain-language coaching copy** | Competitors assume vocabulary. | LOW (content) | Glossary tooltips: série, repetição, falha, aquecimento, carga. A 1-page "Primeira semana" guide (how to start, what soreness is, how to pick weights). |
| **Exercise substitution ("aparelho ocupado")** | A first-timer panics when a machine is taken or missing. Hevy and others offer replacements but rarely beginner-framed. | MEDIUM | 1-2 pre-defined equivalents per exercise; history linked or recalibrated for the substitute. |
| **Smart warm-up suggestions** | Hevy Pro sells a warm-up calculator; beginners do not know to warm up. | LOW-MEDIUM | Simple ramp (e.g., 50% × 8, 70% × 5 of the working load) for the first big lift only; shown as optional, excluded from volume and PRs (warm-up set type). |
| **Weekly-based consistency goal and streak with built-in forgiveness** | Daily streaks punish exactly this user's irregular week; Journal of Consumer Research work on broken streaks suggests weekly counting and flexibility reduce abandonment (MEDIUM). | LOW-MEDIUM | Goal = N sessions per week (default 3). "Streak" = consecutive weeks hitting goal, with one "semana de folga" token per month. Never reset to zero with a guilt message; show "melhor sequência" and "semanas ativas" instead. |
| **Light protein mode** | Beginner follows "dieta da selva" and does not want counting. | MEDIUM | See the dedicated section below. |
| **Morning check-in screen (peso + sono 1-5 + energia 1-5)** | One 10-second ritual instead of three features. User trains in the morning, which matches fasted weigh-in timing. | LOW | Daily weigh-in optional; weekly average shown. Sleep/energy stored per day with a small trend chart; no automatic workout changes. |
| **Weight trend (smoothed) rather than raw daily weight** | Borrowed from MacroFactor-style UX *(background knowledge)*: cuts anxiety from daily noise. | LOW | 7-day moving average line, raw dots behind it. |
| **"Ready to progress" explanation** | Auto-progression builds trust only if it is explainable. Fitbod-style black boxes draw complaints. | LOW | Show one line: "Você fez 3×12 com 20 kg → hoje tente 22,5 kg × 8." |
| **Photo comparison (side by side) with a pose/time reminder** | Progress photos are motivational for aesthetics goals (project goal). | MEDIUM | Local storage as Blobs in IndexedDB. Capture via `<input type="file" capture>`, no custom camera. Side-by-side viewer of first vs latest. Fixed monthly prompt. |
| **Calendar reminder export (.ics with alarm)** | Workaround for PWA reminder limits (see below). | LOW | Offline, no server, reliable via Google Calendar/Clock. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Full calorie/macro tracking with food database and barcode scanner** | MyFitnessPal is the default idea of "diet tracking." | Needs a food DB (large, needs updates, or network), noisy data, high logging burden; user explicitly does not want "neurose"; exactly what kills adherence. | Protein-only light mode (portions or preset items), weekly average, no calories. |
| **AI/auto-generated randomized workouts (Fitbod-style)** | Feels modern, "personalized." | Reviews cite repetitive/generic results despite randomness; needs 10-15 workouts of data; opaque; a first-timer benefits from repeating the same few exercises to learn them. Also needs server or heavy logic. | Fixed A/B full-body program; deterministic double-progression rule. |
| **Custom program builder / Liftoscript-style scripting** | Power users love flexibility (Liftosaur). | Huge UI and testing surface; beginner does not know what to build; users could create dangerous programs. | Ship one vetted program as data in a JSON file; edit via code/backup only. Consider simple exercise swap only. |
| **Huge exercise library (JEFIT-style hundreds of exercises)** | Looks comprehensive. | Content authoring cost; overwhelms a beginner; each needs verified pt-BR instructions. | Library = only exercises in the program plus 1-2 substitutes each. |
| **GIFs / embedded video** | Easier than reading. | Bloats offline cache, copyright/licensing, project already ruled it out. | Text steps plus YouTube link. |
| **Social feed, followers, sharing (Hevy)** | Motivation. | Single user; adds cloud, moderation, sync bugs. | Local only; "compartilhar resumo" as a text/image share via Android share sheet if ever wanted. |
| **Daily streaks with loss messaging** | Duolingo effect. | User's schedule is irregular; breaking a daily streak triggers a "what the hell" quit effect (MEDIUM evidence). | Weekly goal and forgiving weekly streak. |
| **1RM test / max-attempt days** | Seems like the way to find starting loads. | Dangerous with poor technique and no spotter; not needed. | RIR-based calibration with light loads; e1RM estimated from sub-maximal sets only. |
| **Scheduled deload weeks for a novice** | "Everyone deloads." | Practitioners say beginners with <6-12 months training rarely need scheduled deloads (MEDIUM, coaching blogs); extra complexity and lost momentum. | Failure-triggered 10% reset (StrongLifts model) plus long-break reset. Revisit a scheduled deload only after ~6 months. |
| **Autoregulation from sleep/readiness scores** | Wearable-style "readiness." | Needs validated models; sleep/energy 1-5 data is subjective and sparse; changes loads invisibly. | Log sleep/energy for the user to see correlations; do not change load automatically. |
| **Smartwatch / Google Fit / Health Connect sync** | Convenience. | Out of scope; PWA cannot reach those APIs; adds permissions and breakage. | None. |
| **Cloud sync/accounts** | Backup comfort. | Out of scope (no server, no maintenance). | Manual JSON backup with age reminder. |
| **Gamification: XP, levels, badges, leaderboards** | Engagement. | Single user, gimmicky, extra UI; PRs and weekly streak already give feedback. | Quiet PR highlight and weekly streak only. |
| **Weekly volume per muscle group analytics** | Advanced apps (Alpha Progression) show it; even Strong/Hevy lack deep analytics (MEDIUM). | Meaningless for a 12-exercise full-body fixed program. | Session volume (sets × reps × kg) only. |
| **Supersets / drop sets / cluster sets / tempo tracking** | Present in Hevy. | The program has none of them; extra UI states. | Plain sets only (plus warm-up flag). |
| **Push notifications via server (Web Push)** | "Real" reminders. | Needs a server and VAPID keys; violates the no-maintenance constraint. | See Reminders section below. |

---

## Deep-Dive Notes on Contested Features

### Starting-load discovery and progression (the heart of the product)

- **Evidence base:** Sources agree beginners should start light and aim for about 2-3 reps in reserve; "starting weight barely matters, consistent progression does." Beginners also tend to overestimate how hard sets are, so start conservative and let progression catch up. Practitioner guidance, MEDIUM confidence.
- **Progression rule (recommended default):** Double progression on a rep range (for example 3 × 8-12). When all sets hit the top of the range at acceptable effort, add the exercise's increment and drop target reps back to the bottom. This rule is simple enough to implement without scripting, supported natively by Liftosaur, and more forgiving than 5x5 linear for machine and dumbbell lifts where jumps are coarse.
- **Failure rule (StrongLifts-like):** If sets are missed, keep the weight. After 3 consecutive failed sessions, reduce about 10% (StrongLifts default, official).
- **Manual override always wins** (StrongLifts: manual weight edit overrides auto-progression).
- **Increments are per-exercise config**, because gym equipment is not in 2.5 kg steps everywhere. Unknown for this user's gym. Needs a gym-visit check (or ask the user).
- **Weight display for stack machines:** Some Brazilian gym machines use numbered stack pins rather than kg *(background knowledge, unverified)*. Allow a per-exercise "unidade" of kg or "pino/placa" so the app still works.

### Rest timer in a PWA

- Make the timer end-timestamp based, not interval-count based; recompute on resume (visibilitychange) (MEDIUM, StackOverflow guidance).
- Wake Lock API is supported in Chrome for Android but only holds while the page is active; it does not keep a background timer alive.
- Alert = vibrate plus sound while the screen is on. Do not promise background alerts.

### Plate calculator

- Strong and Boostcamp include one; Hevy conflicting. Low cost, moderate value: only relevant for barbell exercises (squat, bench, row if used), and only if the gym uses plates with standard sizes. Make it P2 and configurable (bar weight and available plates), shown as "por lado."

### Protein and meal logging (lightweight)

- **Science:** Morton et al. 2018 meta-analysis (49 trials, 1,863 participants): benefits to fat-free mass plateau around 1.6 g/kg/day, upper 95% CI about 2.2 g/kg/day (HIGH). For 70 kg: about 112 g (floor) up to about 154 g; the project's ~120 g target is within range. The "dieta da selva / eat to satiety" approach may or may not reach this; the app should make it easy to check without counting.
- **Recommended lightweight design (three tiers, user picks one):**
  1. **"Porções de proteína" counter (default):** each tap = one portion (about 25-30 g: a palm of meat/fish, 3-4 eggs, a whey scoop, a yogurt/cheese serving); daily target of about 4-5 portions. Lowest friction. Hand-portion methods are common in nutrition coaching *(background knowledge; not verified by search this session)*.
  2. **Quick-add presets:** editable list of ~15 common Brazilian foods with protein grams per usual portion (ovo, peito de frango 100 g, carne moída, feijão, leite, iogurte, whey, atum, queijo). User edits values. Values come from a static table (e.g., TACO/package labels), no network, no search.
  3. **Manual grams:** free number entry for users who know their total.
- **Display:** weekly average and "dias que bati a meta" in neutral colors; no red/failed states; no calories. MacroFactor-style adherence-neutral tone *(background knowledge)*.
- **Meal logging:** a list of meals is optional; avoid requiring it. Do not store photos of food.
- **Do not build:** search, barcode, recipes, calories, macros other than protein.

### Reminders in an offline PWA (highest feasibility risk)

- **Notification Triggers API (scheduled local notifications):** official Chrome page says development has ended and launch was never started (HIGH). Do not build on it.
- **Web Push:** needs a server. Out of scope.
- **Periodic Background Sync:** Chrome's own page says its cadence is not sufficient for this use (HIGH).
- **Recommended approach:** (a) a very strong in-app "next workout" entry point, "há N dias sem treinar" banner, and weekly progress bar; (b) a one-tap **.ics download** (or "add to calendar" instructions) that creates a recurring morning event with an alarm, so the Android calendar app fires the reminder reliably, offline and with no maintenance; (c) optional in-app best-effort notification if the app is opened. Mark reminders as a **spike/research flag** before promising them in the roadmap.
- **Irregular schedule caveat:** a calendar alarm cannot know the user skipped a day; use the reminder as a daily gentle "treinar hoje?" at chosen time, or let the user pick days manually. Conditional reminders ("only if you have not trained in 2 days") are not possible offline.

### Goals and streaks

- Weekly session goal (default 3 for full body) with progress ring.
- Weekly streak with one forgiveness token per month (inspired by Duolingo's streak freeze; academic support for weekly/flexible streak definitions, MEDIUM).
- Body weight goal as a target range and direction, not a single number; show weekly rate-of-change (target ~0.25-0.5 kg/week gain *(background knowledge, validate)*).
- Exercise load goals only after calibration completes (matches Key Decision in PROJECT.md).
- PR count and "último PR" as soft goals.

### Deload

- Not scheduled for v1. Failure-triggered 10% drop and long-absence reset only. Evidence for beginners needing scheduled deloads is weak; a 2026 randomized trial in untrained men found no disadvantage from a reduced-volume deload week but did not test a stall-triggered load cut (LOW/MEDIUM, abstract-level). Flag for revisit after about 6 months of use.

---

## Feature Dependencies

```
Exercise library (data model + content)
    └──required by──> Workout session screen
                          ├──requires──> Program / A-B rotation state
                          ├──requires──> Set logging (prefill, previous values)
                          │                  ├──requires──> Draft persistence (IndexedDB write per set)
                          │                  └──enhances──> Rest timer (starts on set complete)
                          └──produces──> History records
                                             ├──required by──> Progression engine (double progression, failure rule)
                                             │                     └──requires──> Calibration phase (starting load)
                                             ├──required by──> PR detection (suppressed during calibration)
                                             ├──required by──> Per-exercise charts (load, e1RM, volume)
                                             └──required by──> Load goals (only after calibration)

Calibration phase ──requires──> "Quanto sobrou" input per set
Substitution ──requires──> Exercise library with equivalents + history linkage
Warm-up suggestions ──requires──> Set types (warm-up excluded from volume/PR)

Body weight log ──required by──> Weight trend chart ──required by──> Weight goal
Morning check-in (peso + sono + energia) ──enhances──> Body weight log
Protein light mode ──independent──> (shares daily-log screen with check-in)
Photos ──independent──> (storage size conflicts with JSON backup size)

Weekly goal/streak ──requires──> Completed-session records
Reminders (.ics) ──independent──> (needs no data)

Backup/export ──requires──> Stable schema + versioning (must exist before any data is entered)
Backup photos ──conflicts──> Single small JSON file (keep photos separate)
Scheduled deload ──conflicts──> Failure-triggered progression model for v1 (avoid both)
Daily streak ──conflicts──> Irregular A/B rotation schedule
```

### Dependency Notes

- **Progression requires calibration:** Without a trustworthy baseline load, "next-load suggestion" is meaningless; calibration's output is the progression engine's input.
- **PR detection requires calibration awareness:** otherwise every calibration set is a PR and the feature loses meaning.
- **Draft persistence is part of logging, not a later enhancement:** a PWA tab can be killed mid-set.
- **Backup requires schema versioning:** the export format must carry a version number from day one, otherwise future import breaks silently (no maintainer later).
- **Photos conflict with JSON backup size:** decide early that photos are stored separately (or exported separately).
- **Library content is on the critical path for the first usable build:** the app is unusable for this user without instructions, and content authoring/review is slower than code.

---

## MVP Definition

### Launch With (v1: must be usable at the first December 2026 gym session)

- [ ] A/B full-body program as data, "Treino de hoje" screen, rotation state: core of Core Value
- [ ] Exercise library for the program's exercises with steps, errors, muscles, machine setup, YouTube link
- [ ] Fast set logging with prefill, previous-session values inline, draft persistence
- [ ] Auto-starting rest timer (timestamp-based, wake lock, vibration/sound)
- [ ] Calibration phase (3-button "quanto sobrou") feeding double progression with failure rule and manual override
- [ ] History per exercise plus basic progress chart (load per session)
- [ ] PR detection (suppressed while calibrating)
- [ ] Offline PWA install, storage persistence request
- [ ] Backup/export/import `.json` with schema version and "último backup" nudge
- [ ] Body weight log (with 7-day average) in a morning check-in with sleep/energy 1-5

### Add After Validation (v1.x: first weeks of real use)

- [ ] Light protein mode (portion counter plus presets): trigger: after 1-2 weeks of consistent training
- [ ] Weekly goal and forgiving weekly streak
- [ ] Reminder via .ics export (after feasibility spike)
- [ ] Progress photos and measurements (monthly cadence, so not needed in week 1)
- [ ] Plate calculator and warm-up suggestions
- [ ] e1RM and session-volume charts
- [ ] Exercise substitution
- [ ] Exercise load goals (after calibration completes)
- [ ] CSV export

### Future Consideration (v2+)

- [ ] Scheduled deload weeks (after ~6 months)
- [ ] Program progression to intermediate split (upper/lower or PPL) when linear progression stalls on most lifts
- [ ] Sleep/energy vs performance correlation view
- [ ] Share-sheet summary image

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Treino de hoje plus A/B rotation | HIGH | LOW | P1 |
| Fast set logging with prefill and previous values | HIGH | MEDIUM | P1 |
| Draft persistence (resume session) | HIGH | MEDIUM | P1 |
| Rest timer | HIGH | MEDIUM | P1 |
| Exercise library with instructions plus video link | HIGH | MEDIUM (content-heavy) | P1 |
| Starting-load calibration | HIGH | MEDIUM | P1 |
| Double progression plus failure rule | HIGH | MEDIUM | P1 |
| Per-exercise history and load chart | HIGH | MEDIUM | P1 |
| PR detection | MEDIUM | LOW-MEDIUM | P1 |
| Backup/export/import (versioned) | HIGH | LOW-MEDIUM | P1 |
| Offline PWA installable | HIGH | MEDIUM | P1 |
| Body weight log plus trend | MEDIUM | LOW | P1 |
| Morning check-in (peso, sono, energia) | MEDIUM | LOW | P1 |
| Weekly goal and forgiving streak | MEDIUM | LOW-MEDIUM | P2 |
| Light protein mode | MEDIUM-HIGH | MEDIUM | P2 |
| Reminder (.ics / best-effort) | MEDIUM | LOW (after spike) | P2 |
| Progress photos | MEDIUM | MEDIUM | P2 |
| Body measurements | LOW-MEDIUM | LOW | P2 |
| Plate calculator | LOW-MEDIUM | LOW | P2 |
| Warm-up suggestions | MEDIUM | LOW-MEDIUM | P2 |
| Exercise substitution | MEDIUM | MEDIUM | P2 |
| e1RM / volume charts | MEDIUM | MEDIUM | P2 |
| Load goals | MEDIUM | LOW | P2 |
| CSV export | LOW | LOW | P3 |
| Scheduled deload | LOW | MEDIUM | P3 |
| Sleep/performance correlation | LOW | MEDIUM | P3 |

**Priority key:** P1 = must have at first gym session; P2 = add during first weeks; P3 = defer.

---

## Competitor Feature Analysis

| Feature | Strong / Hevy | StrongLifts | Fitbod / Alpha Progression | Our Approach |
|---------|---------------|-------------|----------------------------|--------------|
| Starting load | User guesses | User guesses (starts at bar) | Estimated from profile/history | Guided calibration per exercise with plain-language effort buttons |
| Progression | None (Hevy) / basic | Linear +5 lb on completed sets, 10% deload after 3 fails | Opaque algorithm | Double progression, explainable, with failure reset and manual override |
| Program | Build your own or import | Fixed A/B 5x5 | Generated | Fixed A/B full-body, rotation without weekdays |
| Set logging | Prefilled, fast | One tap per set circle | Standard | Prefill plus single-tap confirm plus steppers; one-hand layout |
| Instructions | Videos/GIFs in app | Short guides | Videos | Text steps plus YouTube link, offline |
| Rest timer | Auto | Auto | Auto | Auto, timestamp-based, foreground-only alert |
| PR | Auto, Strong has animation | Basic | Present | Auto; suppressed during calibration |
| Charts | e1RM, volume, bodyweight | Basic | Muscle recovery/volume | Load per exercise, e1RM toggle, weight trend |
| Nutrition | None | None | None | Light protein mode only |
| Streak | Weekly (Hevy workouts per week) *(background knowledge)* | n/a | Streaks (varies) | Weekly goal plus forgiving streak |
| Reminders | Native push | Native push | Native push | .ics calendar alarm plus in-app nudges (PWA limit) |
| Backup | Cloud account | Cloud account | Cloud account | Manual `.json` export/import |
| Price | Free tier, Pro optional | Free tier plus Pro | About $16/month (Fitbod) | Free, self-hosted |

---

## Sources

- StrongLifts support, Increments and deload settings: https://support.stronglifts.com/article/22-increments (HIGH, official)
- Hevy help center and features pages (rest timer, warm-up, RPE toggle, supersets): https://help.hevyapp.com/hc/en-us/articles/33106320824727, https://www.hevyapp.com/features/workout-settings/ (HIGH, official)
- Strong vs Hevy comparison (features, free-tier limits): https://repreturn.com/strong-app-vs-hevy/ (MEDIUM, third-party)
- Liftosaur docs / overview / GitHub: https://www.liftosaur.com/docs, https://github.com/astashov/liftosaur (HIGH for existence of Linear/Double and open-source; MEDIUM for details)
- Boostcamp reviews (Fortune, BarBend, vendor pages): https://fortune.com/article/boostcamp-review/, https://www.boostcamp.app/best/free (MEDIUM; vendor claims flagged)
- Alpha Progression comparisons (mostly vendor): https://alphaprogression.com/en/blog/alpha-progression-vs-caliber (LOW-MEDIUM)
- Fitbod review aggregation (complaints about repetition, billing): https://www.indiehackers.com/post/fitbod-app-review-2026-honest-take-after-real-testing-45d5f07a1b, https://www.trustpilot.com/review/fitbod.me (MEDIUM)
- JEFIT vs Hevy vs Strong vs Fitbod (vendor-written, biased): https://www.jefit.com/blog/fitbod-vs-strong-vs-jefit-vs-hevy (LOW)
- FitNotes coverage (offline, free, CSV + backup): https://www.ghacks.net/?p=90924, https://www.whistleout.com/CellPhones/Apps/fitnotes-app-review (MEDIUM)
- Novice starting-load and RPE guidance: https://fitnessvolt.com/rpe-training/guides/rpe-for-beginners/, https://www.boxrox.com/?p=238798 (MEDIUM, practitioner)
- Deload for beginners: https://www.barbellmedicine.com/?p=12397, https://ericcressey.com/strength-training-programs-4-reasons-deload, https://www.strongerbyscience.com/making-your-novice-strength-training-routine-more-effective/ (MEDIUM, practitioner opinion)
- Morton et al. 2018 protein meta-analysis (BJSM): https://pubmed.ncbi.nlm.nih.gov/28698222/ (HIGH)
- Notification Triggers API status: https://developer.chrome.com/docs/web-platform/notification-triggers (HIGH, official; dated 2019, "development has ended")
- Screen Wake Lock API: https://developer.chrome.com/articles/wake-lock/, https://caniuse.com/wake-lock (HIGH)
- Streak design (weekly vs daily, flexibility): https://knowledge.insead.edu/marketing/consumer-streaks-are-motivating-key-keeping-them-alive, https://mobbin.com/blog/streaks-are-about-losing-a-study-of-859-streak-designs (MEDIUM; vendor stats unverified)
- Brazilian app landscape: https://www.hardware.com.br/artigos/academia-sem-sair-de-casa-7-apps-de-treino-gratuitos-que-valem-a-pena/amp/ (LOW)

**Not verified this session (carry as assumptions):** Reddit thread sentiment (r/fitness, r/workout), Google Play review text, MyFitnessPal/MacroFactor feature details, Brazilian gym machine unit conventions (kg vs numbered pins), hand-portion protein method, "restart at 90% after >14 days" rule, novice weight-gain rate target.

---
*Feature research for: personal beginner gym/workout tracker (offline PWA, pt-BR)*
*Researched: 2026-11-18*
