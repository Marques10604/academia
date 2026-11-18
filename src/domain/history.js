// Pure rotation and per-exercise history. Never reads the clock.

export function nextTemplate(sessionsDesc, rotation = ['A', 'B']) {
  const last = [...sessionsDesc]
    .sort((a, b) => b.startedAt - a.startedAt)
    .find((s) => s.complete === true);
  if (!last) return rotation[0];
  const i = rotation.indexOf(last.templateId);
  if (i === -1) return rotation[0];
  return rotation[(i + 1) % rotation.length];
}

// Most recent first; only sessions with at least one 'work' set of this exercise.
// opts.unit: only entries logged in that load unit ('kg' | 'placa'; entries without a unit are kg).
// opts.since: only sessions that started at or after this time (a unit change restarts the history).
export function exerciseHistory(sessionsDesc, exerciseId, opts = {}) {
  const out = [];
  const sorted = [...sessionsDesc].sort((a, b) => b.startedAt - a.startedAt);
  for (const s of sorted) {
    if (opts.since && s.startedAt < opts.since) continue;
    const entry = (s.entries || []).find((e) => e.exerciseId === exerciseId);
    if (!entry) continue;
    if (opts.unit && (entry.unit ?? 'kg') !== opts.unit) continue;
    const sets = (entry.sets || []).filter((x) => x.kind === 'work');
    if (sets.length === 0) continue;
    out.push({ localDate: s.localDate, startedAt: s.startedAt, sets, feel: entry.feel ?? null });
  }
  return out;
}

// Highest load; ties broken by most reps. null for an empty list.
export function topSet(sets) {
  let best = null;
  for (const s of sets || []) {
    if (!best || s.load > best.load || (s.load === best.load && s.reps > best.reps)) best = s;
  }
  return best;
}
