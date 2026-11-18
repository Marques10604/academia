import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PROFILE, cleanName, greetingFor, initialWeightLine, NAME_MAX } from '../src/domain/profile.js';

test('default profile is Ivonilson at 70 kg, with no height', () => {
  assert.equal(DEFAULT_PROFILE.name, 'Ivonilson');
  assert.equal(DEFAULT_PROFILE.weightKg, 70);
  assert.equal('heightCm' in DEFAULT_PROFILE, false);
  assert.equal(initialWeightLine(70), 'Peso inicial: 70 kg');
});

test('greetingFor switches at 12h and 18h', () => {
  assert.equal(greetingFor(0, 'Ivonilson'), 'Bom dia, Ivonilson!');
  assert.equal(greetingFor(11, 'Ivonilson'), 'Bom dia, Ivonilson!');
  assert.equal(greetingFor(12, 'Ivonilson'), 'Boa tarde, Ivonilson!');
  assert.equal(greetingFor(17, 'Ivonilson'), 'Boa tarde, Ivonilson!');
  assert.equal(greetingFor(18, 'Ivonilson'), 'Boa noite, Ivonilson!');
  assert.equal(greetingFor(23, 'Ivonilson'), 'Boa noite, Ivonilson!');
});

test('greetingFor without a name has no comma', () => {
  assert.equal(greetingFor(9, ''), 'Bom dia!');
  assert.equal(greetingFor(9, '   '), 'Bom dia!');
  assert.equal(greetingFor(14, null), 'Boa tarde!');
  assert.equal(greetingFor(20, undefined), 'Boa noite!');
});

test('cleanName collapses spaces, trims and caps the length', () => {
  assert.equal(cleanName('  Ivonilson   Silva '), 'Ivonilson Silva');
  assert.equal(cleanName('a\nb'), 'a b');
  assert.equal(cleanName('x'.repeat(NAME_MAX + 10)).length, NAME_MAX);
  assert.equal(cleanName(null), '');
});
