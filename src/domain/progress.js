// Pure history helpers for the History screens. Never reads the clock, never touches the DOM.

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
