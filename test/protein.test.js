import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MEALS, PORTIONS, mealForHour, autoTarget, proteinTarget, proteinFloor, dayTotal, weekStats, portionLabel, mealLabel,
} from '../src/domain/protein.js';

test('autoTarget: 1,7 g per kg rounded to 5 g', () => {
  assert.equal(autoTarget(70), 120);
  assert.equal(autoTarget(80), 135);
  assert.equal(autoTarget(65), 110);
});

test('proteinTarget: a typed value wins, otherwise 1,7 g/kg of the average weight, profile weight or 70 kg', () => {
  assert.deepEqual(proteinTarget({ settingG: 140, avgKg: 70 }), { g: 140, auto: false });
  assert.equal(proteinTarget({ settingG: '140', avgKg: 70 }).auto, true, 'a string is ignored');
  assert.equal(proteinTarget({ settingG: 20, avgKg: 70 }).auto, true, '20 is below the minimum');
  assert.equal(proteinTarget({ settingG: 400, avgKg: 70 }).auto, true, '400 is above the maximum');
  assert.deepEqual(proteinTarget({ settingG: null, avgKg: 80 }), { g: 135, auto: true, kg: 80 });
  assert.deepEqual(proteinTarget({ avgKg: undefined, profileKg: 70 }), { g: 120, auto: true, kg: 70 });
  assert.deepEqual(proteinTarget({}), { g: 120, auto: true, kg: 70 });
  assert.deepEqual(proteinTarget({ avgKg: 'x', profileKg: 80 }), { g: 135, auto: true, kg: 80 }, 'only finite numbers count');
});

test('proteinFloor: 112 of 120 (1,6 vs 1,7 g/kg)', () => {
  assert.equal(proteinFloor(120), 112);
  assert.equal(proteinFloor(140), 131);
});

test('dayTotal: sums the finite grams of the day list', () => {
  assert.equal(dayTotal({ protein: [{ g: 12 }, { g: 28 }, { g: 'x' }, {}] }), 40);
  assert.equal(dayTotal(null), 0);
  assert.equal(dayTotal({ localDate: 'x' }), 0);
  assert.equal(dayTotal({ protein: 'abc' }), 0);
  assert.equal(dayTotal({ protein: [null, { g: 5 }] }), 5);
});

test('mealForHour: breakfast, lunch, snack, dinner', () => {
  assert.equal(mealForHour(7), 'cafe');
  assert.equal(mealForHour(10), 'almoco');
  assert.equal(mealForHour(14), 'almoco');
  assert.equal(mealForHour(15), 'lanche');
  assert.equal(mealForHour(18), 'jantar');
  assert.equal(mealForHour(23), 'jantar');
});

test('PORTIONS and labels', () => {
  const ids = PORTIONS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, 'unique ids');
  const g = Object.fromEntries(PORTIONS.map((p) => [p.id, p.g]));
  assert.deepEqual(g, { ovos2: 12, frango: 28, carne_moida: 22, sardinha: 20, feijao: 6, leite: 7, queijo: 6, iogurte: 7, whey: 22 });
  assert.equal(portionLabel('frango'), PORTIONS.find((p) => p.id === 'frango').label);
  assert.equal(portionLabel('outro'), 'Outro');
  assert.equal(portionLabel('<unknown>'), 'Outro');
  assert.equal(mealLabel('almoco'), 'Almoço');
  assert.equal(mealLabel('zzz'), '');
  assert.deepEqual(MEALS.map((m) => m.id), ['cafe', 'almoco', 'lanche', 'jantar']);
});

test('weekStats: days with protein in the last 7 days, average and days at or above the floor', () => {
  const today = '2026-11-18';
  const day = (localDate, total) => ({ localDate, protein: [{ g: total }] });
  const days = [
    day('2026-11-10', 200), // 8 days ago: outside
    day('2026-11-13', 130), day('2026-11-14', 90), day('2026-11-15', 115), day('2026-11-16', 100), day('2026-11-17', 120),
    day('2026-11-18', 71),
  ];
  assert.deepEqual(weekStats(days, today, 112), { logged: 6, avg: 104, hit: 3 });
  assert.deepEqual(weekStats([{ localDate: '2026-11-17' }, { localDate: '2026-11-16', protein: [] }], today, 112), { logged: 0, avg: null, hit: 0 });
  assert.deepEqual(weekStats([], today, 112), { logged: 0, avg: null, hit: 0 });
});
