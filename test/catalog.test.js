import test from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISES, youtubeUrl } from '../src/data/exercises.js';
import { PROGRAM } from '../src/data/program.js';

const ids = (tpl) => PROGRAM[tpl].items.map((i) => i.exerciseId);

test('program A and B have exactly the PROG-01 exercises, in order', () => {
  assert.deepEqual(ids('A'), [
    'leg_press_45', 'db_bench_press', 'lat_pulldown', 'lying_leg_curl',
    'db_lateral_raise', 'db_biceps_curl', 'standing_calf_raise', 'plank',
  ]);
  assert.deepEqual(ids('B'), [
    'goblet_squat', 'db_shoulder_press', 'seated_cable_row', 'db_romanian_deadlift',
    'pec_deck', 'cable_triceps_pushdown', 'crunch',
  ]);
});

test('every program exercise exists in the library and the library has exactly 15', () => {
  for (const id of [...ids('A'), ...ids('B')]) assert.ok(EXERCISES[id], `falta ${id}`);
  assert.equal(Object.keys(EXERCISES).length, 15);
});

test('exercise names are the Brazilian gym names from PROG-01', () => {
  const names = [...ids('A'), ...ids('B')].map((id) => EXERCISES[id].name);
  assert.deepEqual(names, [
    'Leg press 45°', 'Supino reto com halteres', 'Puxada frontal', 'Mesa flexora',
    'Elevação lateral', 'Rosca direta', 'Panturrilha em pé', 'Prancha',
    'Agachamento goblet', 'Desenvolvimento com halteres', 'Remada baixa', 'Stiff com halteres',
    'Voador', 'Tríceps na polia', 'Abdominal',
  ]);
});

test('every exercise has pt-BR teaching content', () => {
  for (const ex of Object.values(EXERCISES)) {
    assert.ok(ex.steps.length >= 3 && ex.steps.length <= 5, `${ex.id}: steps 3-5`);
    assert.ok(ex.steps.every((s) => typeof s === 'string' && s.trim()), `${ex.id}: steps vazios`);
    assert.ok(ex.mistakes.length >= 2, `${ex.id}: mistakes >= 2`);
    assert.ok(ex.mistakes.every((s) => typeof s === 'string' && s.trim()), `${ex.id}: mistakes vazios`);
    assert.ok(ex.muscles.primary.length >= 1, `${ex.id}: músculo principal`);
    assert.ok(ex.setup.trim().length > 0, `${ex.id}: setup`);
    assert.ok(ex.youtubeQuery.trim().length > 0, `${ex.id}: youtubeQuery`);
  }
});

test('youtubeUrl is a youtube SEARCH url whose query decodes back to youtubeQuery', () => {
  const prefix = 'https://www.youtube.com/results?search_query=';
  for (const ex of Object.values(EXERCISES)) {
    const url = youtubeUrl(ex);
    assert.ok(url.startsWith(prefix), url);
    assert.equal(decodeURIComponent(url.slice(prefix.length)), ex.youtubeQuery);
  }
});
