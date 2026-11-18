import test from 'node:test';
import assert from 'node:assert/strict';
import { photoStatus, PHOTO_EVERY_DAYS } from '../src/domain/goals.js';

test('PHOTO_EVERY_DAYS is 28 (every 4 weeks)', () => {
  assert.equal(PHOTO_EVERY_DAYS, 28);
});

test('photoStatus: never photographed is due', () => {
  assert.deepEqual(photoStatus(null, '2026-11-18'), { due: true, daysSince: null, dueInDays: 0 });
});

test('photoStatus: recent photos are not due and say when', () => {
  assert.deepEqual(photoStatus('2026-11-01', '2026-11-18'), { due: false, daysSince: 17, dueInDays: 11 });
  assert.deepEqual(photoStatus('2026-11-18', '2026-11-18'), { due: false, daysSince: 0, dueInDays: 28 });
});

test('photoStatus: due from 28 days on', () => {
  assert.deepEqual(photoStatus('2026-10-21', '2026-11-18'), { due: true, daysSince: 28, dueInDays: 0 });
  assert.equal(photoStatus('2026-10-22', '2026-11-18').due, false);
  assert.equal(photoStatus('2026-09-01', '2026-11-18').due, true);
});

test('photoStatus: a value that is not a YYYY-MM-DD string counts as never', () => {
  for (const bad of ['ontem', 5, undefined, {}, '2026-11-1', '18/11/2026']) {
    assert.deepEqual(photoStatus(bad, '2026-11-18'), { due: true, daysSince: null, dueInDays: 0 }, String(bad));
  }
});
