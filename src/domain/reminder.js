// The morning reminder as a calendar file (.ics). Why a file and not a notification: Chrome cannot schedule a
// local notification without a server (Notification Triggers ended; Web Push needs a sender), so the honest
// reminder is the phone's own alarm or calendar (.planning/research/STACK.md "Platform Capabilities", PITFALLS 7).
// Pure: never reads the clock (the caller passes `now`), the DOM or storage.

export const DEFAULT_REMINDER_TIME = '06:30';
export const ICS_FILE_NAME = 'progride-lembrete.ics';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// What a time input returns ('HH:MM', 00:00-23:59) or the default for anything else (junk from a backup included).
export function cleanTime(value) {
  return typeof value === 'string' && TIME_RE.test(value) ? value : DEFAULT_REMINDER_TIME;
}

// RFC 5545 TEXT escaping: backslash, semicolon, comma and line breaks.
export function icsText(s) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// A daily recurring "Treino" event with an alarm at the start. DTSTART is a floating local time (no time zone),
// so it rings at the same wall-clock time wherever the phone is. Every line stays under 75 bytes (no folding).
// time: 'HH:MM'; startDate: 'YYYY-MM-DD' (first day); now: ms timestamp (DTSTAMP); uid: unique id.
export function buildIcs({ time, startDate, now, uid }) {
  const hhmm = cleanTime(time).replace(':', '');
  const stamp = new Date(now).toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Progride//Lembrete//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${icsText(uid)}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${String(startDate).replace(/-/g, '')}T${hhmm}00`,
    'DURATION:PT15M',
    'RRULE:FREQ=DAILY',
    `SUMMARY:${icsText('Treino')}`,
    `DESCRIPTION:${icsText('Hora do treino. Comeu algo leve? Uma banana ajuda.')}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText('Treino')}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n') + '\r\n';
}
