# Training and Nutrition Science for the Built-in Program

**Project:** Sistema Academia (personal gym PWA, single user)
**Researched:** 2026-11-18
**User profile:** male, 32 y, 70 kg, absolute beginner, goal = muscle + strength + energy + aesthetics, irregular 2-4 sessions/week, trains in the morning, Brazil (pt-BR)
**Overall confidence:** MEDIUM-HIGH for training and protein; MEDIUM for surplus and nutrition-behaviour; LOW-MEDIUM for measurement protocols and several numeric "practitioner" defaults (flagged inline)

> General fitness information, not medical advice. The app must show a one-time "faça um check-up médico antes de começar" notice (cardiovascular screen, especially at first use). Stop and seek care for chest pain, dizziness, sharp joint pain.

## How to read confidence and citation tags

- **[H]** peer-reviewed meta-analysis / position stand, consistent across sources.
- **[M]** single trial, narrative review, consensus statement, or a primary source I only saw through an abstract or secondary summary.
- **[L]** practitioner convention / heuristic with no direct trial. Encoded as a default because it is safe and reasonable, but the app should treat it as tunable.
- **(V)** = I located the source (abstract or summary) during this research session. **(K)** = cited from background knowledge of the literature and NOT re-opened in this session; verify the DOI before showing it to the user in an in-app "ciência" screen.
- Nutrient values: Brazilian TACO (UNICAMP/NEPA, 4th ed.) as reproduced on tabelatacoonline.com.br (V); the official PDF was not opened.

---

## 0. Executive decisions (what the app should encode)

| Topic | Default | Confidence |
|---|---|---|
| Split | Full body EVERY session; rotation A -> B -> A -> B (advances per completed session, never per weekday) | M-H |
| Frequency | 2-4 sessions/week; each major muscle trained every session; cap 4/week, >=1 rest day between sessions when possible | H (>=2x/week) |
| Weekly hard sets per muscle | ~5-6 at 2 sessions/week, ~8-9 at 3, ~10-12 at 4 (program is built so volume scales with attendance) | M |
| Rep ranges | 8-12 compound free-weight/DB, 10-15 machines and legs, 12-20 raises/calves; 20-45 s plank | M-H |
| Rest | 120 s compounds, 90 s secondary, 60 s isolation (timer defaults; allow +/- 30 s) | M-H |
| Effort | Sessions 1-2: RIR 3-4. Sessions 3-6: RIR 2-3. Session 7+: last set RIR 1-2. Never go to failure on free-weight squat/hinge | M |
| Progression | Double progression (rep range -> add load), default for every exercise | M (see section 3) |
| Starting load | 2-session "calibration" protocol (section 4) | L-M |
| Protein | Target **120 g/day** (1.7 g/kg); floor 112 g (1.6 g/kg); stretch 140 g (2.0 g/kg); no tracked benefit above ~154 g (2.2 g/kg) | H |
| Protein per meal | 25-40 g in 3 main meals + 10-20 g in 1-2 snacks (~0.4 g/kg/meal = 28 g) | M |
| Surplus | Lean bulk: +10-20% over maintenance, expected gain 0.25-0.5% BW/week (0.18-0.35 kg/week at 70 kg), steered by weekly average weight, not by calorie counting | M |
| Sleep | Goal 7-9 h; log hours + energy 1-5 | M-H |
| Body tracking | Daily weigh-in -> 7-day average; tape every 4 weeks; photos every 4 weeks | L-M |

---

## 1. Training fundamentals for a novice

### 1.1 Is full body the best split for a beginner?

**Verdict: full body is an excellent choice, but "best" is not proven; the evidence says it is not inferior and it is the most robust choice for an irregular schedule.**

Evidence:

- **Frequency per muscle.** Schoenfeld, Ogborn, Krieger 2016 meta-analysis (Sports Med): training a muscle >=2x/week produced greater hypertrophy than 1x/week when volume was not equated. [H] (V) https://doi.org/10.1007/s40279-016-0543-8
- **When weekly volume is equated, frequency per se does not matter.** Schoenfeld, Grgic, Krieger 2019 (J Sports Sci), 25 studies: no significant difference between higher and lower frequency volume-equated; a meta-regression of non-equated studies favoured higher frequency, effect modest. [H] (V) https://pubmed.ncbi.nlm.nih.gov/30558493/ . Critique: Henselmans notes "equated volume" was defined as sets x reps, which can hide lower effort at higher frequency. https://mennohenselmans.com/training-frequency-2018-meta-analysis-review/
- **Newer meta-regression (preprint):** Pelland et al. 2024 report separate dose-response curves for volume and frequency; frequency's effect on hypertrophy is small once volume is accounted for, but visible for strength. [M, not confirmed peer-reviewed in this session] (V) https://sportrxiv.org/index.php/server/preprint/view/460
- **ACSM 2026 position stand** (Currier et al., Med Sci Sports Exerc, overview of 137 reviews): headline is "go from no training to regular training"; train all major muscle groups >=2 days/week; hypertrophy benefits from ~10+ sets per muscle per week; machines vs free weights and complex periodization do not consistently matter for healthy adults. [M: I could read only the ACSM press page via search summaries and a secondary article; the primary paper and the ACSM page itself (HTTP 403) were not opened] (V) https://acsm.org/resistance-training-guidelines-update-2026/ , https://www.nfpt.com/beyond-the-guidelines-what-the-2026-acsm-position-stand-gets-right-and-what-it-changes-for-personal-trainers/
- **ACSM 2009 position stand** (still the clearest novice prescription): novices = 2-3 days/week, loads around 8-12 RM, 1-3 sets, 8-10 exercises covering the major muscle groups. [H] (V) https://pubmed.ncbi.nlm.nih.gov/19204579/

**Why full body fits THIS user:** every session hits every muscle, so a missed day costs nothing structurally; 2 sessions/week already gives 2x/week per muscle (ACSM minimum); 3-4 sessions raise volume automatically. A body-part or upper/lower split would leave muscles at 1x/week on 2-session weeks. The user's recollection ("full body is what gives more results to a beginner") is therefore supported as "meets the frequency evidence and is schedule-robust", not as "proven superior".

### 1.2 Weekly sets per muscle for beginners

- Schoenfeld, Ogborn, Krieger 2017 (J Sports Sci), 15 studies / 34 groups: graded dose-response; <5 sets/week/muscle gave ~5.4% hypertrophy gain, 10+ sets almost double (the categorical trend alone was p=0.074; the continuous relation was significant); the data only inform up to ~10 sets. [H] (V partial) https://doi.org/10.1080/02640414.2016.1210197 (K for DOI)
- Krieger 2010 (J Strength Cond Res) (K): multiple sets > single set for hypertrophy (ES 0.34 vs 0.24).
- ACSM 2009: novices 1-3 sets; ACSM 2026: ~10 sets/muscle/week for hypertrophy (secondary summary, see above).
- Novices respond to lower volumes than trained people and also recover slower from the unfamiliar stimulus (see 1.5). **Default: start low, let volume grow with attendance.** With the program in section 2 the *effective hard sets per muscle per week* are about:

| Sessions/week | Quads | Hams/glutes | Chest | Back (lats+mid) | Shoulders | Biceps | Triceps | Calves | Core |
|---|---|---|---|---|---|---|---|---|---|
| 2 (A+B) | 6 | 5 | 5* | 6 | 7* | 2 (+indirect) | 2 (+indirect) | 2 | 4 |
| 3 (A B A) | 9 | 7 | 8* | 9 | 10* | 4 | 3 | 4 | 6-7 |
| 4 (A B A B) | 12 | 10 | 10* | 12 | 14* | 4 | 4 | 4 | 8 |

\* includes ~half-credit for pressing assistance (overhead press hitting chest/delts, bench hitting front delts/triceps). These are design estimates [L]; direct counts are in the exercise table.

The 2-session week is the minimum viable week and sits at the low end of the dose-response curve, still productive for a novice. The app should show a gentle nudge ("3 treinos por semana rendem mais"), never a guilt message.

### 1.3 Rep ranges and load

- Hypertrophy is similar across a wide load spectrum (roughly 30-85% 1RM) provided sets are taken near failure; heavier loads favour maximal strength. Schoenfeld, Grgic, Van Every, Plotkin 2021 (Sports 9:32). [H] (V) https://www.mdpi.com/2075-4663/9/2/32 . Corroborated by Lopez et al. 2021 network meta-analysis (K).
- ACSM 2009 novices: 8-12 RM. [H] (V)
- **Default ranges** (all inside the hypertrophy-effective zone): 8-12 for free-weight/dumbbell compounds (technique-limited, so do not chase high reps); 10-15 for machine compounds, legs, and curls; 12-20 for lateral raises and calves (small muscles, low technical load). [M]
- For the novice, easier-to-learn higher-rep sets (>=8) also reduce technique risk versus heavy low-rep work. [L]

### 1.4 Rest intervals

- Singer et al. 2024 Bayesian meta-analysis (Front Sports Act Living; 9 studies): small hypertrophic benefit of rest >60 s; no appreciable difference beyond ~90 s; heterogeneity high. [M-H] (V) https://frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2024.1429789/abstract
- Strength: >=2 min on multi-joint lifts tends to be better (Grgic et al. 2018, Sports Med; Schoenfeld 2016 JSCR, 3 vs 1 min in trained men) (K).
- **Default timer:** compound 120 s, secondary 90 s, isolation 60 s; user-adjustable (60-180 s). Total session ~55-65 min.

### 1.5 Proximity to failure (RIR) for novices

- Failure vs non-failure produces similar hypertrophy and strength when volume is matched (Grgic et al. 2022 meta-analysis; Refalo et al. 2023) (K). ACSM 2026 lists training to momentary failure as not consistently necessary; secondary summary says 1-2 RIR performs similarly to failure. [M] (V)
- Robinson et al. 2024 (Sports Med) exploratory meta-regressions: strength gains similar across a wide RIR range, hypertrophy rises as sets end closer to failure; authors caution the analysis is exploratory. [M] (V) https://doi.org/10.1007/s40279-024-02069-2
- **RIR estimation is imperfect, even for novices.** Halperin et al. 2022 scoping review + meta-analysis (Sports Med; 12 studies, n=414): people *underpredict* repetitions to failure by ~1 rep on average (95% CI 0.17-1.73), huge heterogeneity; accuracy improves close to failure, in later sets and with heavier loads; training status did not clearly matter. [M-H] (V) https://pubmed.ncbi.nlm.nih.gov/34542869/ . **Implication:** a user who reports "0-1 left" often had ~1-2 in reserve; the app should not over-react to reported RIR 0-1 and should instead rely on rep counts vs the range.
- **Early-training damage.** In untrained people the first weeks bring unaccustomed-exercise muscle damage/swelling, and early size gains are partly swelling (Damas et al. 2016, Eur J Appl Physiol). [M] (V) https://link.springer.com/doi/10.1007/s00421-015-3243-4 (DOI per search listing; verify). This justifies a gentler ramp (below).

**Default effort schedule (counted in sessions, not weeks, because the schedule is irregular):**

| Phase | Sessions | Working sets | Target effort |
|---|---|---|---|
| 0 Calibração | 1-2 | 2 per exercise after ramp sets | RIR 3-4, learn form |
| 1 Adaptação | 3-6 | 2 per exercise | RIR 3 -> 2 |
| 2 Base | 7+ | prescribed (3 compound / 2 accessory) | last set of each exercise RIR 1-2; earlier sets RIR 2-3 |

[L-M] The ramp is practitioner convention supported by the damage/swelling evidence and by RIR inaccuracy; the exact session counts are tunable constants.

**Safety override:** no sets to failure on leg press, goblet squat, stiff/RDL, overhead press; failure only on machines/isolation and only from Phase 2. Stop a set when rep speed collapses or form degrades, whichever comes first.

---

## 2. Concrete full-body program: A/B rotation (every session = legs + push + pull + core)

### 2.1 Structure and rotation logic

- Two sessions, **A** and **B**, both full body. They differ only in exercise selection (different variants for the same patterns). Neither is an upper/lower or body-part split.
- Both sessions contain: a knee-dominant leg exercise, a hip-dominant/hamstring exercise, a horizontal push, a vertical push or shoulder exercise, a vertical pull, a horizontal pull (B) / vertical pull (A), arm work, core.
- **"Próximo treino" rule:** next = the opposite of the last *completed* session. Missed days never skip or reorder. A session counts as completed if >=70% of prescribed exercises are logged; otherwise it is "incomplete", the same letter is offered again next time. [L]
- Sessions/week: any of 2, 3, 4. Warn (soft) if two sessions are logged on the same day, and if a 5th session is logged in a rolling 7 days. Nothing blocks the user.
- **Rotation vs "this week one thing, next week another":** see section 2.5.

### 2.2 Session A (about 55-60 min)

| # | Exercício (PT-BR) | English | Slot | Sets x reps | Rest | Machine-first / easier alternative | YouTube search (pt-BR) |
|---|---|---|---|---|---|---|---|
| A1 | Leg press 45° | 45° leg press | Quads/glutes (knee-dominant) | 3 x 10-15 | 120 s | (already machine) alt: Cadeira extensora 3x10-15 | "leg press 45 como fazer execução correta iniciante" |
| A2 | Supino reto com halteres | Dumbbell bench press | Chest/triceps (horizontal push) | 3 x 8-12 | 120 s | **Supino reto na máquina (chest press)**; or Flexão de braço inclinada | "supino reto com halteres execução correta iniciante" / "supino máquina como fazer" |
| A3 | Puxada frontal (na polia alta) | Lat pulldown | Lats/biceps (vertical pull) | 3 x 8-12 | 120 s | Puxada com triângulo ou pegada neutra; Barra assistida (máquina) | "puxada frontal polia execução correta iniciante" |
| A4 | Mesa flexora | Lying leg curl | Hamstrings | 2 x 10-15 | 90 s | Cadeira flexora (sentado) | "mesa flexora como fazer execução correta" |
| A5 | Elevação lateral com halteres | Dumbbell lateral raise | Side delts | 2 x 12-20 | 60 s | Elevação lateral na polia ou máquina | "elevação lateral halteres execução correta" |
| A6 | Rosca direta (halteres ou barra W) | Dumbbell/EZ-bar biceps curl | Biceps | 2 x 10-15 | 60 s | Rosca na polia baixa; Rosca na máquina (scott) | "rosca direta halteres execução correta" |
| A7 | Panturrilha em pé (máquina ou degrau) | Standing calf raise | Calves | 2 x 10-15 (slow, full range) | 60 s | Panturrilha no leg press | "panturrilha em pé máquina execução correta" |
| A8 | Prancha | Plank | Core | 2 x 20-45 s | 60 s | Prancha com joelhos apoiados; Prancha inclinada (mãos no banco) | "prancha abdominal como fazer iniciante" |

### 2.3 Session B (about 55-60 min)

| # | Exercício (PT-BR) | English | Slot | Sets x reps | Rest | Machine-first / easier alternative | YouTube search (pt-BR) |
|---|---|---|---|---|---|---|---|
| B1 | Agachamento goblet (com halter) | Goblet squat | Quads/glutes (knee-dominant, free weight) | 3 x 8-12 | 120 s | Leg press 45° or Agachamento no Smith / hack | "agachamento goblet como fazer iniciante" |
| B2 | Desenvolvimento com halteres (sentado) | Seated dumbbell shoulder press | Shoulders/triceps (vertical push) | 3 x 8-12 | 120 s | **Desenvolvimento na máquina** | "desenvolvimento com halteres sentado execução correta" |
| B3 | Remada baixa (na polia, sentado) | Seated cable row | Mid-back/lats/biceps (horizontal pull) | 3 x 8-12 | 120 s | **Remada na máquina com apoio no peito** (chest-supported row); Remada curvada apoiada no banco inclinado | "remada baixa polia execução correta iniciante" |
| B4 | Stiff com halteres (levantamento terra romeno) | Dumbbell Romanian deadlift | Hamstrings/glutes (hip hinge) | 3 x 8-12 | 120 s | **Elevação pélvica** (hip thrust) or Mesa flexora; Extensão de quadril na máquina | "stiff com halteres como fazer sem machucar a lombar" |
| B5 | Voador (peck deck) / Crucifixo na máquina | Machine chest fly | Chest | 2 x 10-15 | 90 s | Crucifixo com halteres (leve) | "voador peck deck execução correta" |
| B6 | Tríceps na polia (pushdown com corda ou barra) | Cable triceps pushdown | Triceps | 2 x 10-15 | 60 s | Tríceps testa com halteres; Tríceps na máquina | "tríceps na polia corda execução correta" |
| B7 | Abdominal (crunch no solo ou na máquina) | Crunch / machine crunch | Core | 2 x 12-20 | 60 s | Elevação de joelhos (prancha alta -> sentado) ou Dead bug | "abdominal crunch execução correta sem forçar o pescoço" |

Optional swap pool (same slot, same set/rep logic): Cadeira extensora (leg extension), Elevação pélvica (hip thrust), Remada curvada com halteres, Puxada com pegada neutra, Supino inclinado com halteres, Rosca martelo, Tríceps testa, Cadeira adutora/abdutora (low priority). Do NOT add exercises before 8-12 weeks (2.5).

**Weekly-set sanity check (2 sessions):** quads 6, hams/glutes 5, chest 3 direct + 2 fly + press assistance, lats/back 6, delts 2 lateral + 3 press, arms 2+2, calves 2, core 4. [L]

### 2.4 Which exercises a total beginner learns first

Order of teaching (the app should show a "Semana de aprendizado" tutorial card per exercise on first use, with text cues + YouTube link):

1. **Machine patterns first (sessions 1-2):** Leg press 45°, Supino na máquina, Puxada frontal, Remada na máquina/baixa, Mesa flexora. Machines fix the path and reduce the skill barrier; ACSM 2026 summary: machines vs free weights do not consistently differ for hypertrophy. [M] (V)
2. **Then two simple free-weight patterns:** Agachamento goblet (teaches squat depth/torso position) and Stiff com halteres with very light load (teaches hip hinge: hips back, neutral spine). Spend the first 2-3 sessions at "light, perfect reps" on these.
3. **Core:** Prancha (first), then abdominal.
4. **Barbell lifts** (back squat, bench, conventional deadlift): out of scope for the initial program; offer as an optional "progressão avançada" after >=12 weeks and a clean goblet/hinge. [L]

**Execution cues the exercise library should store (3-5 bullets per exercise, examples):** Leg press - feet shoulder-width mid-platform, knees track over toes, lower until ~90° knee without pelvis tucking, do not lock knees hard. Lat pulldown - slight lean back, pull bar to upper chest, elbows down, no swinging. Goblet - hold halter at chest, heels flat, sit between hips, chest up. Stiff - soft knees, push hips back, halter slides along thighs, stop at hamstring stretch, back neutral. (Cue text is editorial [L]; the source is general coaching practice.)

### 2.5 Rotating "this week this, next week that": does it help?

- **Alternating per session (A/B) - yes.** It is the program above; it lets each session cover the whole body while varying stimulus slightly.
- **Alternating per week (week 1 = routine X only, week 2 = routine Y only) - no.** If X and Y are different muscle groups, each muscle gets trained every 14 days (violates the >=2x/week evidence). If both are full body, it is just A/B with a different clock and no benefit.
- **Does varying exercises help?** Baz-Valle et al. 2019 (PLoS ONE; 8 weeks, 21 trained men): randomly varying exercise selection each session gave similar strength/hypertrophy as a fixed selection, with higher intrinsic motivation. [M, small, trained men] (V) https://pmc.ncbi.nlm.nih.gov/articles/PMC6934277 . So variation is not harmful for growth, but gives no growth edge.
- **Cost of constant switching for a novice:** motor-learning needs repetition; the app's progression logic needs repeated exposure to the same exercise; load history is meaningless across new exercises ("program hopping"). [L]
- **Default:** keep the same A/B exercises for the first 8-12 weeks (or ~24 sessions, whichever is later), then allow swapping at most 2-3 accessory exercises within the same slot (swap pool above). Log history per exercise id, and when a swap happens start the new exercise in calibration mode.

---

## 3. Progression model

### 3.1 Double progression vs linear progression - evaluation

| | Linear progression (LP) (fixed jump every session/week) | Double progression (DP) (reps first, then load) |
|---|---|---|
| Direct evidence in novices | No head-to-head trials found | No head-to-head trials found |
| Support | Practitioner tradition (e.g. +2.5 kg/session on barbell lifts); novices adapt fast | ACSM 2009 rule literally is DP: when the user can perform the current load for 1-2 reps over the target, increase load 2-10%. [H] (V) |
| Fit to wide rep range (hypertrophy 8-15) | Poor: forces fixed reps | Native |
| Fit to irregular attendance | Poor: fixed schedule jumps assume sessions on a regular rhythm; one missed week breaks the logic | Good: progression depends on performance, not on calendar |
| Fit to "I don't know my starting load" | Poor: needs a good start load or fails quickly | Good: the rep range self-corrects a mis-estimated start |
| Machine/dumbbell jumps are coarse (2.5-5 kg) | Jumps often 5-10%+ and stall fast | Rep progression bridges coarse jumps |
| Complexity for app/UI | Trivial | Slightly more logic, still simple |

**Verdict:** Default to **double progression** for all exercises, with a "boost" allowance in the first sessions so it behaves like linear progression while the user is clearly under-loaded (below). The user's memory of "3x12 -> add weight" is double progression with range 8-12 (he's right), and the evidence base supports it for hypertrophy-oriented novice training. Note honestly: the superiority of DP over LP in novices has not been tested head-to-head; the choice is driven by the ACSM rule, the wide effective rep/load range, the irregular schedule, and the unknown starting load. Confidence: [M].

### 3.2 Exact DP rules (encodable)

Per exercise store `rep_min`, `rep_max`, `sets`, `increment_kg`.

```
For each working set record: load_kg, reps, rir (optional 0..4+).

After a session, for each exercise (use the working sets only):
  S = list of working-set reps at the current load.

RULE UP (increase load):
  if every set in S reached rep_max with clean form (rir >= 1 reported or unknown)
      -> next session load += increment_kg, target reps = rep_min..rep_max again.
  BOOST: if all sets reached rep_max AND reported rir >= 3 on the last set
         -> next load += 2 x increment_kg (capped at +10% of current load).
         (only allowed in sessions 1-12 of this exercise)
  If the smallest possible jump is > 10% of the current load (light dumbbells):
      require reps >= rep_max + 2 on all sets (i.e. "reps over") before jumping. [ACSM 2-10% rule]

RULE HOLD (same load next time, try to add reps):
  if at least one set is between rep_min and rep_max-1 and total reps (sum over sets)
  is equal or lower than last time but >= rep_min on every set:
      -> keep load; aim to add 1 rep to the weakest set.

RULE DROP-AFTER-INCREASE (reps fall after a load increase):
  It is NORMAL for reps to fall to the bottom of the range after a jump.
  - If every set >= rep_min at the new load: continue (rule HOLD) until all sets reach rep_max again.
  - If any set < rep_min (e.g. 7 reps on an 8-12 range) once: keep the same load next session (a single bad day is common).
  - If any set < rep_min in 2 consecutive sessions at the same load: reduce load by one increment (or 5-10%)
    and rebuild; flag a "stall".
  - Never reduce the load because of ONE session with fewer reps in later sets if first-set reps >= rep_min.

STALL (no progress):
  Count sessions in which total reps at the same load did not increase.
  - 3 consecutive no-progress sessions on an exercise: reduce load ~10% (round to equipment) and rebuild with RIR 2-3.
  - Before reducing, show "check sleep/food/technique" prompts using the last 7 days of sleep and energy entries.

MISSED/FAILED SESSION:
  - Abandoned session (< 70% done): no changes to targets; offer same letter next time.
  - Failed set (could not reach rep_min or form broke): log it; do not penalize; apply DROP-AFTER-INCREASE logic.
```

Increments (smallest practical jump; keep within ACSM 2-10% where possible):

| Equipment | Default `increment_kg` | Notes |
|---|---|---|
| Leg press 45° (plate-loaded) | +5 kg (2.5 kg/side) up to 100 kg, then +10 kg | sled weight differs per gym; load numbers are not comparable across machines [L] |
| Selectorized machines/cables (chest press, pulldown, row, curl, extension, fly, pushdown) | +1 pin (typically 2.5-5 kg); use add-on 1-1.25 kg plates if the gym has them | for lateral-raise/curl cable movements use the smallest step [L] |
| Dumbbells | next available pair: +1 kg per hand under ~10 kg, +2 kg per hand 10-20 kg, +2.5 kg above | use "reps over" rule when jump >10% [L] |
| Barbell (future) | +2.5 kg upper, +5 kg lower | [L] |
| Bodyweight (plank) | +5 s until 60 s, then harder variation or weight plate on back | [L] |

Source basis: ACSM 2009 2-10% rule (V); the kg values are rounding conventions to typical Brazilian commercial-gym equipment [L].

### 3.3 Deload and gaps

- **No scheduled deload in the first ~12 weeks.** Coleman et al. 2024 (PeerJ; 39 participants, 9 weeks): a full week off mid-program did not change lower-body hypertrophy, power or local endurance but left strength slightly lower than continuous training. [M] (V) https://peerj.com/articles/16777 . Bell et al. 2023 Delphi consensus defines deloading as a planned or reactive reduction in training stress to manage fatigue; it is practitioner consensus, not trial evidence. [M] (V) https://shura.shu.ac.uk/32417
- **Reactive deload trigger (default):** >=2 exercises stalled AND (average energy <= 2/5 or sleep < 6 h on >=3 of the last 7 days) -> 1 week: same exercises, 2 sets each, load -10-20%, RIR 4. [L]
- **Natural gaps (irregular schedule):** if the last session was >=10 days ago, resume at 90% of last working load for the first session; >=28 days -> 80% and treat as calibration week. Strength is largely retained for a few weeks of cessation (Bosquet et al. 2013 meta-analysis; K), so these haircuts are conservative. [L]

---

## 4. Starting-load discovery (first 1-2 weeks)

**Goal:** find, per exercise, a load that gives ~10 clean reps with ~3 reps in reserve ("RPE 7"), in at most 2 sessions, without a 1RM test. A 1RM test is unnecessary and unsafe for a novice.

Evidence base: the RIR-based RPE scale (Zourdos et al. 2016, J Strength Cond Res; Helms et al. 2016; K) and the RIR-accuracy limits in section 1.5 (people misjudge by ~1 rep, so we want a conservative start and a self-correcting progression rule). The step sizes below are practitioner protocol [L]. The ACSM 2009 8-12 RM novice recommendation sets the rep target (V).

**Protocol "Calibração" (sessions 1 and 2):**

1. Machines first, one exercise at a time. Set the lightest load (empty bar 20 kg is too heavy for many: use dumbbells/machine minimum). Do 8-10 slow reps as a **form set**. Stop if any technique cue fails.
2. **Ramp:** add load (about +10-20% of the previous, or +1-2 machine pins; +2 kg per hand for dumbbells) and do 10 reps. After each set ask: "Quantas repetições a mais você conseguiria com boa forma? (0, 1, 2, 3, 4+)" and give the guidance "se ficou em dúvida, escolha o número maior" (people tend to underestimate their reserve, Halperin). Max 4 ramp sets per exercise to avoid fatigue.
3. **Stop ramping** when the answer is 3 (target) or the last 2 reps were clearly slower than the first. Save this load as `calibrated_load`.
4. Do the working sets of that session at `calibrated_load` (2 sets in sessions 1-2, per section 1.5). The first rep of every set should look like the last.
5. **Session 2:** start at 90% of `calibrated_load` (round down) for set 1, then repeat the ramp up to the new 3-RIR load (usually +1 pin / +1-2 kg more than session 1).
6. From session 3 on, DP rules (3.2) take over with `rep_min..rep_max`. If the user is under-loaded the BOOST rule corrects it within 2-3 sessions.

**Mapping in the UI:** a "Descobrir carga" mode on each exercise's first two appearances, a button "Estava leve / Perfeito / Pesado" after each ramp set (maps to RIR 4+, 3, <=1) and automatic suggestion of the next ramp step; an exercise stays in calibration until it has two logged working sessions.

**Sanity ranges (do NOT use as targets, show only as "faixa típica" if desired) [L]:** beginner men often start goblet squat ~8-16 kg, DB bench 8-14 kg per hand, lateral raise 2-5 kg per hand, DB curl 6-10 kg per hand, lat pulldown 25-40 kg, seated row 25-40 kg, leg press (sled weight excluded) very gym dependent. These are unsourced and the calibration protocol should override them.

---

## 5. Nutrition

### 5.1 Protein target

- **Morton et al. 2018 (Br J Sports Med)**, 49 RCTs, 1,863 participants: protein supplementation augments resistance-training gains in fat-free mass; the benefit plateaued at a total protein intake of **~1.62 g/kg/day; the 95% CI of the breakpoint extends to ~2.2 g/kg/day**. Effect was smaller with age and (notably) larger in already-trained people than in untrained. [H] (V) https://pubmed.ncbi.nlm.nih.gov/28698222/ (CI upper bound 2.20 from the abstract, recalled K; the search summary confirmed 1.62 only).
- **ISSN position stand (Jäger et al. 2017):** 1.4-2.0 g/kg/day for most exercising people; per serving ~0.25 g/kg or 20-40 g of high-quality protein; spread every 3-4 h. [H] (V) https://doi.org/10.1186/s12970-017-0177-8
- **Iraki et al. 2019:** 1.6-2.2 g/kg/day for off-season muscle gain (narrative review). [M] (V) https://pubmed.ncbi.nlm.nih.gov/31247944/

For 70 kg:

| Level | g/kg | g/day |
|---|---|---|
| ISSN low | 1.4 | 98 |
| Morton plateau (point estimate) | 1.62 | **113** |
| User plan | **1.7** | **120** |
| ISSN high | 2.0 | 140 |
| Morton CI upper / Iraki top | 2.2 | **154** |

**Is 120 g reasonable? Yes.** It is ~1.7 g/kg, just above the Morton plateau and inside the ISSN range. App defaults: `target = 120 g`, `floor = 112 g` ("meta mínima"), `stretch = 140 g`. Show "dias com >= 112 g" as the adherence metric (not a hard 120). Honest nuance: Morton found the effect of extra protein is smaller in untrained people, so a beginner will gain even at somewhat lower intakes; 120 g is cheap insurance and also supports satiety/recovery, not a requirement for results. Confidence: [H] for the range, [M] for the specific 120 g choice.

Recalculate if body weight changes: `target = round(1.7 x kg / 5) x 5`.

### 5.2 Per-meal distribution

- Schoenfeld and Aragon 2018 (JISSN): a practical per-meal target is ~0.4 g/kg/meal across >=4 meals to reach ~1.6 g/kg/day; up to ~0.55 g/kg/meal if aiming 2.2 g/kg. For 70 kg: ~28 g/meal (up to ~38 g). Narrative review (first author discloses industry advisory role); the 20-25 g "ceiling" is not a hard physiological cap. [M] (V) https://pmc.ncbi.nlm.nih.gov/articles/PMC5828430
- **Default:** 3 main meals x 30-40 g (café da manhã, almoço, jantar) + 1-2 snacks x 10-20 g = 100-140 g. Practical split for 120 g: 30 + 35 + 35 + 20.
- Distribution matters less than the daily total (ISSN; Schoenfeld & Aragon). Do not nag about timing.

### 5.3 Protein portions in Brazil (TACO values, MEDIUM)

Per 100 g unless stated; TACO 4th ed. values as reproduced on tabelatacoonline.com.br (V). Portions are my typical kitchen sizes [L].

| Food (PT-BR) | Protein per 100 g | Typical portion | Protein per portion |
|---|---|---|---|
| Peito de frango sem pele, grelhado | ~32 g (TACO ~31-32; TBCA lists a lower ~24 g) | 1 filé médio 100-120 g | ~32-38 g |
| Carne bovina patinho, grelhado | 35.9 g (V) | 1 bife médio 100-120 g | ~36-43 g |
| Carne moída refogada / coxão mole / alcatra | ~27-32 g (K, not individually verified) | 1 porção 100 g cozida | ~27-32 g |
| Ovo de galinha cozido | 13.3 g (V) | 1 unidade (~50 g) | ~6-6.5 g (3 ovos ~19 g) |
| Feijão carioca cozido | 4.8 g (V) | 1 concha (~100-140 g) | ~5-7 g |
| Feijão preto cozido | 4.5 g (V) | 1 concha | ~5-6 g |
| Arroz branco cozido | ~2.5 g (K) | 4 colheres de sopa (~100 g) | ~2.5 g |
| Leite integral | ~3 g/100 mL (K) | 1 copo 200 mL | ~6 g |
| Iogurte natural | 4.1 g (V) | 1 pote 170 g | ~7 g |
| Queijo muçarela | 22.6 g (V) | 2 fatias (~40 g) | ~9 g |
| Queijo minas frescal | 17.4 g (V) | 1 fatia 40 g | ~7 g |
| Whey protein (concentrado) | label: typically ~20-24 g per 30 g scoop | 1 scoop | ~20-24 g (read the label) |
| Sardinha/atum em lata (escorrido) | ~25 g (K, not verified) | 1 lata ~ 80-120 g | ~20-30 g |
| Amendoim / pasta de amendoim | ~25 g (K) | 1 colher de sopa pasta (~15 g) | ~4 g |

Notes: 1 palm-size cooked piece of meat/chicken/fish ~= 100-120 g ~= 30-40 g protein. Feijão + arroz is a legitimate protein contributor (~7-9 g per prato) and complements amino acids; it should not be dismissed. Whey is a convenience, not a necessity.

**Example 120 g day:** café: 3 ovos + 1 iogurte (~25 g); almoço: filé de frango 120 g + feijão + arroz (~42 g); lanche: iogurte + 2 fatias de queijo (~16 g) or whey (~22 g); jantar: bife/ovos + feijão (~38 g). Total ~120-125 g.

### 5.4 The "dieta da selva": what it is, what the evidence says

**What it is (as far as sources agree).** A social-media "ancestral/primal" style that emphasizes unprocessed foods (meats, eggs, fruits, roots/tubers) and strongly restricts or excludes processed foods and, in some versions, entire groups (grains, legumes, dairy; one report describes a near-exclusive protein+fat version without rice, beans, fruit or vegetables, attributed to Roberto Brandini). Promoters also say "eat until satiated, no counting". Versions vary widely and there is no single codified protocol or authoritative source. (V) https://cfn.org.br/dieta-da-selva-os-riscos-por-tras-do-discurso-natural/ , https://www.gazetasp.com.br/saude/conheca-a-dieta-da-selva-que-fez-fogaca-perder-17-kg/ , https://www.portaltela.com/noticias/ciencia/2026/06/22/alerta-sobre-a-dieta-selva-que-elimina-frutas-verduras-e-carboidratos/ . The best-known testimonial (chef losing 17 kg in 3 months) also involved exercise 3-4x/week and is a weight-LOSS case, not evidence for muscle gain.

**Official reaction.** The Conselho Federal de Nutricionistas (CFN) states there is no scientific evidence supporting its safety, efficacy or claimed benefits for the general population, warns of nutrient gaps from group exclusion and of a disordered relationship with food. (V) cfn.org.br link above. [M: institutional position, not a trial]

**Balanced evaluation for THIS user (lean male beginner, goal = gain):**

| Aspect | Evidence | Verdict |
|---|---|---|
| Whole/minimally processed foods | Brazil's Guia Alimentar (2014) recommends in natura/minimally processed foods as the base (K). NIH inpatient RCT (Hall 2019, n=20): ultra-processed diet -> ~+500 kcal/day intake and ~+0.9 kg in 2 weeks vs unprocessed diet; protein difference may explain up to half the intake gap. [M] (V) https://www.nih.gov/news-events/nih-research-matters/eating-highly-processed-foods-linked-weight-gain | Good principle. Keep. |
| Protein-forward (meat, eggs) | Fits the 1.6-2.2 g/kg evidence; eggs/meat are dense protein sources | Good. Keep. |
| "Eat until satiated, no counting" for a *bulk* | Satiety signals (esp. in protein-rich, minimally processed diets) are designed to prevent surplus. Leidy et al. 2015: higher-protein meals modestly increase fullness; effect on later energy intake not supported; adherence drives results. [M] (V) https://pubmed.ncbi.nlm.nih.gov/25926512/ . The unprocessed arm of Hall 2019 ate less. I found NO trial of intuitive eating vs tracking for muscle gain in lean beginners. | Risk: ad-libitum whole-food eating can sit at maintenance or below, especially for a lean 70 kg man with a modest appetite. Needs a feedback loop (weekly weight). |
| Eating "enough" protein by instinct | Protein leverage idea (Simpson & Raubenheimer 2005, Obes Rev) says appetite regulates protein intake strongly, so a protein-rich diet is satiating; Hall's commentary: leverage is likely incomplete in humans. [M] | Plausible that many selva-eaters hit ~1.4-1.8 g/kg incidentally; not guaranteed. A cheap check (protein checklist) removes the doubt. |
| Dropping carbs/legumes/dairy | Carbohydrate is not obligatory for hypertrophy, but the Brazilian staple (arroz+feijão), fruit, tubers are the easiest calorie-dense, cheap, high-adherence sources for a surplus and fuel morning training [M-L]. Excluding legumes/grains removes fiber and cheap protein. | Do not exclude. Keep rice, beans, tubers, fruit. |
| Meat-heavy, fat-heavy variants | IARC (2015) classed processed meat Group 1 and red meat Group 2A (K); very high animal protein can raise uric acid (reported in lay press). Evidence for healthy young men at moderate intakes is weak-to-moderate. | Prefer chicken/fish/eggs/lean beef; limit processed meats (linguiça, salsicha, bacon). |
| Dietary self-monitoring | Self-monitoring is among the more reliable behaviour predictors in weight-management trials (Burke 2011, J Am Diet Assoc; K). Evidence is mostly for weight LOSS. | A light version is justified. |
| Eating-disorder risk | Rigid rules and moral food language are associated with disordered eating (CFN). The user does not want "neurose". | App must avoid calorie shaming; use positive checklists. |

**Verdict.** Adopt the compatible parts (real food, protein at every meal, eat when hungry plus a bit extra) and reject the parts that conflict with a muscle-gain goal for a lean beginner (relying only on satiety to define "enough" calories; excluding rice/beans/fruit/tubers; demonizing carbs). Confidence: MEDIUM for the verdict, LOW-MEDIUM for specifics because no direct trial exists.

**Lightweight middle path (what the app encodes):**

1. **Protein checklist per meal** (no grams entry needed): after each main meal tick "tinha uma porção de proteína (1 palma de carne/ovos/laticínio)". 1 palm ~ 30 g; 3 main meals ~ 90 g + snack ticks (+15 g each) -> app shows estimated daily protein (e.g. 3 ticks x 30 + 2 snack x 15 = 120). User may optionally enter exact grams (portion list in 5.3).
2. **Hand-portion method** (practitioner, popularized by Precision Nutrition; no trial specific to bulking): protein = 1-1.5 palms/meal; carbs = 1-2 cupped hands/meal (rice, beans, fruit, tubers); vegetables = 1 fist; fats = 1 thumb. [L]
3. **Hunger-neutral surplus rule:** "se o peso médio semanal não subiu em 2 semanas, adicione 1 porção de carboidrato por dia (ex: 1 banana + aveia, ou +4 col. de arroz, ou pão + ovo)". No calorie counting.
4. **Daily floor reminder** at ~19:00 if protein ticks are < 2: "faltam ~30 g: 3 ovos, 1 pote de iogurte + queijo, ou 1 scoop de whey".
5. **Allowed foods are never "proibidos"**; the app does not score "clean eating".

### 5.5 Calorie surplus for lean bulk

- Iraki et al. 2019: novices/intermediates 10-20% above maintenance, aiming 0.25-0.5% of body weight per week; larger surpluses mostly add fat. [M] (V) https://pubmed.ncbi.nlm.nih.gov/31247944/
- Slater et al. 2019: the exact surplus needed to maximize hypertrophy is unknown; surplus supports anabolism but guidance is thin and the energy cost of muscle gain is not well established. [M-H as a statement of uncertainty] (V) https://www.frontiersin.org/articles/10.3389/fnut.2019.00131/full
- For 70 kg: 0.25-0.5% = 0.18-0.35 kg/week. **Beginner default: aim for the lower-middle of that range (0.25-0.4%, ~0.2-0.3 kg/week)** because a lean novice can gain muscle fast but excess surplus mostly becomes fat; reconsider if waist grows faster than ~1 cm/month with weight (see 6.2). [L-M]
- Maintenance estimate (optional onboarding step, not required): Mifflin-St Jeor `BMR = 10 x kg + 6.25 x cm - 5 x age + 5` (Mifflin et al. 1990, AJCN; K) x activity 1.4-1.6. With 70 kg, 175 cm, 32 y: BMR ~1,640; maintenance ~2,300-2,600 kcal. +10-20% is ~+250-500 kcal/day. Treat as ballpark; the weight trend is the truth.

**Weekly adjustment rule (encode):**

| Observation (weekly average vs previous week average, 2-week rolling) | Action |
|---|---|
| Gain < +0.10 kg/week for 2 weeks | Add ~+200 kcal/day (1 carb portion + 1 snack). |
| +0.15 to +0.35 kg/week | Maintain. |
| > +0.50 kg/week for 3 weeks (or waist up > 1 cm in 4 weeks) | Reduce ~150-200 kcal/day. |
| Loss for 2 weeks | Eat more; check sleep/hunger; add 2 portions of carbs/day. |

Ignore the first 1-2 weeks of gain (glycogen/water/gut contents after changing diet and starting training). [L]

---

## 6. Recovery, morning training, and measurement

### 6.1 Sleep and recovery

- Acute sleep deprivation (one night) reduced muscle protein synthesis by ~18%, raised cortisol 21% and lowered testosterone 24% in 13 healthy young adults (Lamon et al. 2021, Physiol Rep). [M-H, small trial, no resistance training] (V) https://doi.org/10.14814/phy2.14660
- Five nights of 4 h in bed lowered MyoPS, preserved by high-intensity interval exercise (Saner et al. 2020, J Physiol) (V via summary). Sustained sleep restriction reduced resistance-exercise quality/volume and raised perceived effort (Knowles et al. 2018/2022; K/V summary).
- Adults: AASM/SRS consensus recommends >=7 h/night (Watson et al. 2015; K) -> app goal 7-9 h.
- **There is no direct trial in novices of "X hours of sleep -> Y% less hypertrophy"**; the argument is mechanistic plus performance. [M]
- **Defaults:** `sleep_goal = 7-9 h`; daily check-in: hours slept + energy 1-5 + optional "dormi bem?". If sleep < 6 h before a session: suggest "+1 RIR today (pare 1 rep antes)" and continue, never "skip". If sleep <6 h on >=3 of 7 days: show a gentle recovery tip and count toward the reactive-deload trigger (3.3).
- Rest days: >=1 between sessions where possible; light walking is fine.

### 6.2 Morning training

- Time of day: Grgic et al. 2019 meta-analysis (11 studies) found similar strength and size gains regardless of training time; evening baseline strength is higher but training at your own time adapts you to it. [M] (V) https://mennohenselmans.com/best-time-to-work-out-meta-analysis/ . Train in the morning if that is what you will actually do.
- **Warm-up.** Direct trials on warm-up sets are limited; a 2021 narrative review recommends exercise-specific warm-ups (not static stretching) [M-L] (V) https://pmc.ncbi.nlm.nih.gov/articles/PMC8449772 . **Default:** 5 min easy cardio (bike/esteira) + dynamic mobility (leg swings, arm circles, 10 bodyweight squats) + 1-2 ramp sets on the first compound (e.g. 50% x 8, 75% x 5) before working sets. Morning = longer warm-up (body is stiffer). [L]
- **Fasted vs fed.** A 12-week trial (Vieira 2025; 28 young adults) and a 2025 meta-analysis summarized by coaches found no clear difference in strength or hypertrophy between fasted (10-12 h) and fed training; one other trial in trained lifters reported lower squat strength gains when fasted (secondary sources only; primary papers not opened). [M-L] (V) https://mennohenselmans.com/5-surprising-new-studies-on-how-to-build-muscle-in-2025/ . Carbohydrate before training helps longer/harder sessions and people fasting >8 h (secondary summary).
- **Default for a morning, absolute-beginner session:** a light pre-workout snack 30-60 min before (banana + iogurte, pão com ovo, or pão com queijo + café). If time/appetite prevents it, training fasted is acceptable; then eat a protein meal (25-40 g) within ~1-2 h after. Hydrate (water on waking). Total daily protein and sleep matter more than the exact pre/post timing (ISSN position stands on protein and nutrient timing; Aragon & Schoenfeld 2013; K).
- Optional app prompt in the morning reminder: "Já comeu algo leve? Um banana ajuda."

### 6.3 Body measurement

Sources here are mostly measurement-standard conventions (ISAK; WHO waist protocol, K) and coaching practice; no trial specific to this app. [L-M]. The one searched query for ISAK/photo protocols returned only commercial coaching blogs, so treat the details below as conventions.

**Weight**
- Weigh daily (or >=4 mornings/week) under the same conditions: on waking, after urinating, before eating/drinking, same scale/clothes. Record each; the app displays the **7-day average** and the week-over-week change. Single-day swings of 0.5-1.5 kg (water, food volume, salt, glycogen) are noise; weight also tends to be higher after weekends (Orsama et al. 2014; K).
- Decisions use the weekly average only (5.5).

**Tape measurements** (sites, in cm; every 4 weeks, same time/day, relaxed, no flex unless stated)
| Site | Landmark |
|---|---|
| Braço (relaxado), right | halfway between acromion tip and olecranon, arm hanging |
| Peito | at nipple/mid-sternum level, after a normal exhale, arms down |
| Cintura | midway between lowest rib and top of iliac crest (WHO) -> or at navel if the user finds it easier (state which and keep it the same) |
| Quadril | widest part of the buttocks (optional) |
| Coxa (right) | midway between inguinal fold and top of kneecap, standing, weight on both legs |
| Panturrilha (optional) | widest part, standing |

Take 2 readings; if they differ by >0.5 cm, take a third; save the mean. Tape error is ~0.5-1 cm, so changes of <1 cm are within noise; arm/thigh typically move ~0.5-1.5 cm in the first 8-12 weeks (practitioner expectation) [L].

**Photos** (every 4 weeks, local-only per project constraint): same location, light, distance (~2 m), camera at navel height, same time (morning, before breakfast), same clothing (shorts), relaxed standing. Three poses: frente, lado, costas. The app should show a ghost-outline overlay of the last photo and save the date/weight with each photo. [L]

---

## 7. Encodable seed data summary

```json
{
  "program": {
    "type": "full_body_rotation",
    "rotation": ["A", "B"],
    "advance_rule": "next = other letter after a completed (>=70%) session; independent of weekday",
    "phases": [
      {"id": "calibration", "sessions": [1, 2], "sets_per_exercise": 2, "target_rir": "3-4"},
      {"id": "adaptation", "sessions": [3, 6], "sets_per_exercise": 2, "target_rir": "3->2"},
      {"id": "base", "sessions_from": 7, "sets": "prescribed", "last_set_rir": "1-2"}
    ],
    "rest_seconds": {"compound": 120, "secondary": 90, "isolation": 60},
    "progression": {
      "type": "double_progression",
      "boost": {"max_pct": 10, "allowed_sessions": 12},
      "stall_sessions": 3,
      "stall_reduction_pct": 10,
      "gap_days_for_10pct_reduction": 10,
      "gap_days_for_20pct_reduction": 28
    },
    "deload": {"reactive": true, "sets": 2, "load_reduction_pct": [10, 20], "rir": 4}
  },
  "nutrition": {
    "protein_g_per_kg": {"floor": 1.6, "default": 1.7, "stretch": 2.0, "ceiling_note": 2.2},
    "protein_target_g_for_70kg": 120,
    "protein_floor_g": 112,
    "per_meal_g": {"main": [30, 40], "snack": [10, 20]},
    "surplus_pct": [10, 20],
    "target_weekly_gain_pct_bw": [0.25, 0.5],
    "target_weekly_gain_kg_at_70kg": [0.18, 0.35]
  },
  "recovery": {"sleep_goal_h": [7, 9], "low_sleep_h": 6},
  "measurement": {"weight": "daily, 7-day average", "tape_every_days": 28, "photos_every_days": 28}
}
```

Exercise ids to seed: `leg_press_45`, `db_bench_press`, `chest_press_machine`, `lat_pulldown`, `lying_leg_curl`, `db_lateral_raise`, `db_biceps_curl`, `standing_calf_raise`, `plank`, `goblet_squat`, `db_shoulder_press`, `shoulder_press_machine`, `seated_cable_row`, `chest_supported_row_machine`, `db_romanian_deadlift`, `hip_thrust`, `pec_deck`, `cable_triceps_pushdown`, `crunch`, plus swap-pool ids (`leg_extension`, `seated_leg_curl`, `db_incline_press`, `db_hammer_curl`, `skull_crusher`).

---

## 8. Gaps and phase-specific research flags

- **No head-to-head trial: double vs linear progression in novices** (design decision based on ACSM rule and fit, section 3.1). Re-evaluate with user data after ~12 weeks; the app could export per-exercise stall rates.
- **ACSM 2026 position stand details** were not read from the primary paper (page returned 403); numbers cited are from the ACSM press materials and secondary coverage. Verify before quoting specifics in the app's "ciência" screens.
- **Pelland et al. 2024 meta-regression** was seen as a preprint; confirm peer-reviewed status before citing.
- **No evidence on intuitive eating vs tracking for lean beginner bulking** was found; section 5.4 verdict is an inference.
- **Items cited from background knowledge (K) and not re-opened:** Schoenfeld 2017 DOI, Krieger 2010, Grgic 2018/2022, Refalo 2023, Lopez 2021, Zourdos/Helms RIR scale, Bosquet 2013, Mifflin 1990, Watson 2015, ISSN nutrient timing, IARC 2015, Burke 2011, Orsama 2014, Guia Alimentar 2014, TACO values for carnes moída/coxão/arroz/leite/sardinha/amendoim. Verify DOIs before displaying citations in-app.
- **Individualization:** height, injuries, medical status unknown. Onboarding must ask height (for optional TDEE) and display the medical-clearance notice.
- **Needs deeper research later:** exercise cue texts and common-error lists per exercise (editorial content, best sourced from a physiotherapist/coach review); Brazilian-gym equipment variability (sled weights, pin steps); whether a 3rd session type (C) is warranted for 4-session weeks.

---

## Sources

Peer-reviewed / position stands
- Morton et al. 2018, Br J Sports Med 52:376 - https://pubmed.ncbi.nlm.nih.gov/28698222/ (doi 10.1136/bjsports-2017-097608)
- Schoenfeld, Ogborn, Krieger 2016, Sports Med 46:1689 - https://doi.org/10.1007/s40279-016-0543-8
- Schoenfeld, Grgic, Krieger 2019, J Sports Sci - https://pubmed.ncbi.nlm.nih.gov/30558493/
- Schoenfeld, Ogborn, Krieger 2017, J Sports Sci 35:1073 - https://doi.org/10.1080/02640414.2016.1210197
- Schoenfeld, Grgic, Van Every, Plotkin 2021, Sports 9:32 - https://www.mdpi.com/2075-4663/9/2/32
- ACSM 2009 Progression models - https://pubmed.ncbi.nlm.nih.gov/19204579/
- ACSM 2026 resistance training position stand (Currier et al., MSSE) - https://acsm.org/resistance-training-guidelines-update-2026/ ; secondary: https://www.nfpt.com/beyond-the-guidelines-what-the-2026-acsm-position-stand-gets-right-and-what-it-changes-for-personal-trainers/
- Robinson et al. 2024, Sports Med - https://doi.org/10.1007/s40279-024-02069-2
- Pelland et al. 2024 (preprint) - https://sportrxiv.org/index.php/server/preprint/view/460
- Singer et al. 2024, Front Sports Act Living - https://frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2024.1429789/abstract
- Halperin et al. 2022, Sports Med (RIR accuracy) - https://pubmed.ncbi.nlm.nih.gov/34542869/
- Damas et al. 2016, Eur J Appl Physiol - https://link.springer.com/doi/10.1007/s00421-015-3243-4
- Baz-Valle et al. 2019, PLoS ONE - https://pmc.ncbi.nlm.nih.gov/articles/PMC6934277
- Bell et al. 2023, Sports Med Open (deload Delphi) - https://shura.shu.ac.uk/32417
- Coleman et al. 2024, PeerJ - https://peerj.com/articles/16777
- Jäger et al. 2017, ISSN protein position stand - https://doi.org/10.1186/s12970-017-0177-8
- Schoenfeld and Aragon 2018, JISSN - https://pmc.ncbi.nlm.nih.gov/articles/PMC5828430
- Iraki, Fitschen, Espinar, Helms 2019, Sports - https://pubmed.ncbi.nlm.nih.gov/31247944/
- Slater et al. 2019, Front Nutr - https://www.frontiersin.org/articles/10.3389/fnut.2019.00131/full
- Leidy et al. 2015, AJCN - https://pubmed.ncbi.nlm.nih.gov/25926512/
- Hall et al. 2019, Cell Metab (NIH summary) - https://www.nih.gov/news-events/nih-research-matters/eating-highly-processed-foods-linked-weight-gain
- Lamon et al. 2021, Physiol Rep - https://doi.org/10.14814/phy2.14660
- Warm-up narrative review 2021 - https://pmc.ncbi.nlm.nih.gov/articles/PMC8449772
- Time-of-day meta-analysis (Grgic et al. 2019), secondary review - https://mennohenselmans.com/best-time-to-work-out-meta-analysis/
- Fasted vs fed (2025 studies), secondary review - https://mennohenselmans.com/5-surprising-new-studies-on-how-to-build-muscle-in-2025/

Brazilian context
- CFN (Conselho Federal de Nutricionistas) on "Dieta da Selva" - https://cfn.org.br/dieta-da-selva-os-riscos-por-tras-do-discurso-natural/
- Press coverage: https://www.gazetasp.com.br/saude/conheca-a-dieta-da-selva-que-fez-fogaca-perder-17-kg/ , https://www.portaltela.com/noticias/ciencia/2026/06/22/alerta-sobre-a-dieta-selva-que-elimina-frutas-verduras-e-carboidratos/
- TACO values (4th ed. reproduction): https://www.tabelatacoonline.com.br/tabela-nutricional/taco/carne-bovina-patinho-sem-gordura-grelhado , .../ovo-de-galinha-inteiro-cozido-10minutos , .../queijo-mozarela , .../iogurte-natural , .../feijao-preto-cozido , .../queijo-minas-frescal , .../feijao-carioca-cozido , .../frango-peito-sem-pele-grelhado
- Guia Alimentar para a População Brasileira, 2nd ed. 2014 (K) - https://bvsms.saude.gov.br/bvs/publicacoes/guia_alimentar_populacao_brasileira_2ed.pdf
