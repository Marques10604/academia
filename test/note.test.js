import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanNote, noteOf, NOTE_MAX, NOTE_LINES } from '../src/domain/units.js';

test('cleanNote trims and keeps the text as typed', () => {
  assert.equal(cleanNote('  banco no furo 4, almofada no 2  '), 'banco no furo 4, almofada no 2');
  assert.equal(cleanNote('ok\r\nsegunda linha'), 'ok\nsegunda linha');
});

test('cleanNote caps the note at 120 characters and 3 lines', () => {
  assert.equal(NOTE_MAX, 120);
  assert.equal(NOTE_LINES, 3);
  assert.equal(cleanNote('x'.repeat(300)).length, 120);
  assert.equal(cleanNote('a\nb\nc\nd\ne'), 'a\nb\nc');
});

test('cleanNote and noteOf treat missing values as an empty note', () => {
  assert.equal(cleanNote(undefined), '');
  assert.equal(cleanNote(null), '');
  assert.equal(cleanNote('   \n  '), '');
  assert.equal(noteOf(undefined), '');
  assert.equal(noteOf({ exerciseId: 'pec_deck', incrementKg: 5 }), ''); // record written by 0.2.0
  assert.equal(noteOf({ exerciseId: 'pec_deck', note: 'banco no furo 3' }), 'banco no furo 3');
});

test('cleanNote never interprets markup: it is only text', () => {
  const html = '<b>negrito</b> <img src=x onerror=alert(1)>';
  assert.equal(cleanNote(html), html);
});
