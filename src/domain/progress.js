// Pure history helpers for the History screens. Never reads the clock, never touches the DOM.
import { topSet } from './history.js';
import { daysBetween } from './dates.js';

// One row per saved workout, most recent first, whatever the input order.
// workSets counts 'work' sets only: warm-up and ramp sets do not count as training volume.
export function workoutRows(sessions) {
  return [...(sessions || [])]
    .sort((a, b) => b.startedAt - a.startedAt)
    .map((s) => ({
      id: s.id,
      localDate: s.localDate,
      startedAt: s.startedAt,
      templateId: s.templateId,
      short: s.short === true,
      complete: s.complete === true,
      minutes: Math.max(0, Math.round((s.endedAt - s.startedAt) / 60000)),
      workSets: (s.entries || []).reduce(
        (sum, e) => sum + (e.sets || []).filter((x) => x.kind === 'work').length, 0),
    }));
}

// One row per workout that has a work set of this exercise, most recent first.
// unit: how the load was typed in that workout ('kg' when the entry has no unit).
export function exerciseLog(sessions, exerciseId) {
  const out = [];
  for (const s of [...(sessions || [])].sort((a, b) => b.startedAt - a.startedAt)) {
    const entry = (s.entries || []).find((e) => e.exerciseId === exerciseId);
    if (!entry) continue;
    const sets = (entry.sets || []).filter((x) => x.kind === 'work');
    if (sets.length === 0) continue;
    out.push({
      sessionId: s.id, localDate: s.localDate, startedAt: s.startedAt, unit: entry.unit ?? 'kg', sets, top: topSet(sets),
    });
  }
  return out;
}

// What the chart plots for this exercise, oldest first: the best set of each workout.
//   time exercises   -> 'time' (best seconds)
//   loads all 0      -> 'reps' (best reps; bodyweight)
//   otherwise        -> 'load' in the most recent workout's unit (kg and placa never share a line)
// x = days since the first plotted workout.
export function chartPoints(log, exercise) {
  const rows = log || [];
  const bestReps = (r) => Math.max(...r.sets.map((s) => s.reps));
  let metric = 'load';
  let unit = rows[0]?.unit ?? 'kg';
  let kept = rows.filter((r) => r.unit === unit);
  let y = (r) => r.top.load;
  if (exercise?.type === 'time') {
    metric = 'time';
    kept = rows;
    y = bestReps;
  } else if (rows.length > 0 && rows.every((r) => r.sets.every((s) => s.load === 0))) {
    metric = 'reps';
    kept = rows;
    y = bestReps;
  }
  if (metric !== 'load') unit = null;
  const oldestFirst = [...kept].reverse();
  const first = oldestFirst[0]?.localDate;
  return {
    metric,
    unit,
    points: oldestFirst.map((r) => ({ x: daysBetween(first, r.localDate), y: y(r), localDate: r.localDate })),
  };
}
