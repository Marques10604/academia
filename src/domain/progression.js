// Pure double-progression engine. Never reads the clock: `today` is always a parameter.
// No DOM, no IndexedDB. Section numbers refer to .planning/research/TRAINING-SCIENCE.md.
import { topSet } from './history.js';
import { daysBetween } from './dates.js';

// Tunable constants. Change them here only; tests read the same values.
export const RULES = Object.freeze({
  CALIBRATION_SESSIONS: 2, // 4: two light sessions to find a working load before progressing
  ADAPTATION_UNTIL: 6, // 1.5: sessions 3-6 keep 2-3 reps in reserve and fewer sets
  BOOST_MAX_SESSIONS: 12, // 3.2: beginners may take a bigger jump only early on
  BOOST_CAP_PCT: 0.10, // 3.2: a boosted jump never exceeds ~10% of the load
  BIG_JUMP_PCT: 0.10, // 3.2: an increment above 10% of the load (small dumbbells) needs extra reps first
  BIG_JUMP_EXTRA_REPS: 2, // 3.2: ...namely repMax + 2
  FAIL_SESSIONS: 2, // 3.2: two sessions below the minimum reps at the same load -> lower it
  STALL_SESSIONS: 3, // 3.2: three sessions at the same load without more reps -> lower it
  STALL_DROP_PCT: 0.10, // 3.2: a stall deload is -10%
  LAYOFF_DAYS: 10, // 3.3: 10+ days away -> come back lighter
  LAYOFF_PCT: 0.90, // 3.3: ...at 90%
  LONG_LAYOFF_DAYS: 28, // 3.3: 28+ days away
  LONG_LAYOFF_PCT: 0.80, // 3.3: ...at 80%
  CALIBRATION_RESTART_PCT: 0.90, // 4: second calibration session starts at 90% of the first
  CALIBRATION_REPS: 10, // 4: calibration sets aim at about 10 reps
  MAX_RAMP_SETS: 4, // 4: at most 4 ramp sets, so discovery never tires the user out
  RAMP_STEP_PCT: 0.15, // 4: each ramp step is +10-20% of the load (15% as the middle)
});

const clean = (v) => Math.max(0, Math.round(v * 100) / 100);

// Nearest multiple of step (never negative, no float noise).
export function roundToStep(x, step) {
  if (!(step > 0)) return clean(x);
  return clean(Math.round(x / step) * step);
}

// Largest multiple of step that is <= x (never negative). The epsilon absorbs 0.9 * 30 style float error.
export function roundDownToStep(x, step) {
  if (!(step > 0)) return clean(x);
  return clean(Math.floor(x / step + 1e-9) * step);
}

// n = number of prior sessions with work sets for this exercise.
export function phaseFor(n) {
  if (n < RULES.CALIBRATION_SESSIONS) return 'calibracao';
  if (n < RULES.ADAPTATION_UNTIL) return 'adaptacao';
  return 'base';
}

const repsAtLoad = (session, load) => session.sets.filter((s) => s.load === load).map((s) => s.reps);
const sum = (arr) => arr.reduce((a, b) => a + b, 0);

export function suggestNext({ item, exercise, history, incrementKg, today }) {
  const inc = incrementKg ?? exercise.incrementKg;
  const hist = Array.isArray(history) ? history : [];
  const { repMin, repMax } = item;

  // (a) Calibration
  if (hist.length < RULES.CALIBRATION_SESSIONS) {
    const L0 = hist.length ? topSet(hist[0].sets).load : 0;
    const load = hist.length === 0 ? exercise.startLoadKg : roundDownToStep(RULES.CALIBRATION_RESTART_PCT * L0, inc);
    const targetReps = exercise.type === 'time'
      ? repMin
      : Math.min(repMax, Math.max(repMin, RULES.CALIBRATION_REPS));
    return {
      load, targetReps, mode: 'calibration', reasonCode: 'calibration',
      reasonParams: { session: hist.length + 1, of: RULES.CALIBRATION_SESSIONS },
    };
  }

  const latest = hist[0];
  const L = topSet(latest.sets).load;
  const S = repsAtLoad(latest, L);
  const out = (load, targetReps, reasonCode, reasonParams) =>
    ({ load, targetReps, mode: 'normal', reasonCode, reasonParams });

  // (b) Time exercises: more seconds, never more load
  if (exercise.type === 'time') {
    const best = Math.max(...latest.sets.map((s) => s.reps));
    if (best >= repMax) return out(0, repMax, 'timeMax', { seconds: best });
    const target = Math.min(repMax, best + inc);
    return out(0, target, 'timeUp', { seconds: target });
  }

  // (c) Layoff
  if (L > 0) {
    const gap = daysBetween(latest.localDate, today);
    if (gap >= RULES.LAYOFF_DAYS) {
      const long = gap >= RULES.LONG_LAYOFF_DAYS;
      let load = roundToStep((long ? RULES.LONG_LAYOFF_PCT : RULES.LAYOFF_PCT) * L, inc);
      if (load >= L) load = Math.max(0, L - inc); // small loads can round back to L; a "90%" must be lower
      return out(load, repMin, long ? 'layoff28' : 'layoff10', { days: gap, load });
    }
  }

  // (d) Increase: every set at the top of the range
  const need = L > 0 && inc > RULES.BIG_JUMP_PCT * L ? repMax + RULES.BIG_JUMP_EXTRA_REPS : repMax;
  if (S.length >= 2 && S.every((r) => r >= need)) {
    let step = inc;
    let code = 'increase';
    if (hist.length <= RULES.BOOST_MAX_SESSIONS && latest.feel === 'leve') {
      step = Math.min(2 * inc, Math.max(inc, roundToStep(RULES.BOOST_CAP_PCT * L, inc)));
      code = 'boost';
    }
    const load = clean(L + step);
    return out(load, repMin, code, { sets: S.length, reps: Math.min(...S), load });
  }

  // (e) Failure drop: below the minimum at the same load in the two latest sessions
  const failed = (session) => repsAtLoad(session, L).some((r) => r < repMin);
  if (hist.length >= RULES.FAIL_SESSIONS) {
    const recent = hist.slice(0, RULES.FAIL_SESSIONS);
    if (recent.every((s) => topSet(s.sets).load === L && failed(s))) {
      const load = Math.max(0, clean(L - inc));
      return out(load, repMin, 'dropFail', { repMin, load });
    }
  }

  // (f) Stall: three sessions at the same load without more total reps
  if (hist.length >= RULES.STALL_SESSIONS) {
    const recent = hist.slice(0, RULES.STALL_SESSIONS);
    if (recent.every((s) => topSet(s.sets).load === L)) {
      const newest = sum(repsAtLoad(recent[0], L));
      const oldest = sum(repsAtLoad(recent[RULES.STALL_SESSIONS - 1], L));
      if (newest <= oldest) {
        let load = roundToStep((1 - RULES.STALL_DROP_PCT) * L, inc);
        if (load >= L) load = Math.max(0, clean(L - inc));
        return out(load, repMin, 'stall', { load });
      }
    }
  }

  // (g) Hold: same load, aim one more rep on the weakest set
  return out(L, Math.min(repMax, Math.min(...S) + 1), 'hold', { load: L });
}

// Guided ramp (TRAINING-SCIENCE 4): sets of ~10 reps, after each one the user says how many reps were left
// (rir, 0..4 where 4 means "4 or more"). Target is "3 left". rampSets: [{load, reps, rir}] in order.
// Returns {done:false, nextLoad} to keep ramping, or {done:true, workingLoad}.
export function calibrationStep({ rampSets, incrementKg }) {
  const inc = incrementKg > 0 ? incrementKg : 1;
  const last = rampSets[rampSets.length - 1];
  if (last.rir >= 4) {
    if (rampSets.length >= RULES.MAX_RAMP_SETS) return { done: true, workingLoad: last.load };
    const jump = Math.max(inc, roundToStep(RULES.RAMP_STEP_PCT * last.load, inc));
    return { done: false, nextLoad: clean(last.load + jump) };
  }
  // 2 left is kept as is: people underestimate their reserve by about 1 rep (Halperin 2022).
  if (last.rir >= 2) return { done: true, workingLoad: last.load };
  // 1 or 0 left: too heavy, one increment down (never to zero).
  return { done: true, workingLoad: last.load > inc ? clean(last.load - inc) : last.load };
}
