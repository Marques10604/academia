import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanTime, icsText, buildIcs, DEFAULT_REMINDER_TIME, ICS_FILE_NAME } from '../src/domain/reminder.js';

const NOW = Date.UTC(2026, 10, 18, 12, 0, 0);
const input = { time: '06:45', startDate: '2026-11-19', now: NOW, uid: 'progride-1@progride' };

test('constants', () => {
  assert.equal(DEFAULT_REMINDER_TIME, '06:30');
  assert.equal(ICS_FILE_NAME, 'progride-lembrete.ics');
});

test('cleanTime keeps a valid HH:MM and falls back to 06:30', () => {
  assert.equal(cleanTime('06:45'), '06:45');
  assert.equal(cleanTime('00:00'), '00:00');
  assert.equal(cleanTime('23:59'), '23:59');
  for (const bad of ['6:45', '24:00', '12:60', '', null, undefined, 'abc', 645, '06:45:00', ' 06:45']) {
    assert.equal(cleanTime(bad), '06:30', String(bad));
  }
});

test('icsText escapes backslash, semicolon, comma and newline', () => {
  assert.equal(icsText('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne');
  assert.equal(icsText('a\r\nb'), 'a\\nb');
  assert.equal(icsText(null), '');
});

test('buildIcs writes exactly the daily Treino event with an alarm', () => {
  const text = buildIcs(input);
  assert.ok(text.endsWith('\r\n'));
  assert.deepEqual(text.slice(0, -2).split('\r\n'), [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Progride//Lembrete//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:progride-1@progride',
    'DTSTAMP:20261118T120000Z',
    'DTSTART:20261119T064500',
    'DURATION:PT15M',
    'RRULE:FREQ=DAILY',
    'SUMMARY:Treino',
    'DESCRIPTION:Hora do treino. Comeu algo leve? Uma banana ajuda.',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Treino',
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]);
});

test('no line passes 75 bytes (no folding needed) and every break is CRLF', () => {
  const text = buildIcs(input);
  for (const line of text.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75, line);
  assert.ok(!/(^|[^\r])\n/.test(text), 'LF sem CR');
});

test('an invalid time gives the default 06:30', () => {
  assert.ok(buildIcs({ ...input, time: 'xx' }).includes('DTSTART:20261119T063000'));
});

test('the start time is floating local time (no Z, no TZID)', () => {
  const dtstart = buildIcs(input).split('\r\n').find((l) => l.startsWith('DTSTART'));
  assert.ok(!dtstart.includes('Z') && !dtstart.includes('TZID'));
});
