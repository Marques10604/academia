import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReport, REPORT_QUESTION } from '../src/domain/report.js';

const TODAY = '2026-11-18';
const EXERCISES = {
  leg_press_45: { name: 'Leg press 45°', type: 'reps' },
  plank: { name: 'Prancha', type: 'time' },
};

const session = (id, localDate, entries) => ({
  id, localDate, startedAt: Date.parse(`${localDate}T10:00:00Z`), endedAt: Date.parse(`${localDate}T10:50:00Z`),
  complete: true, entries,
});
const entry = (exerciseId, sets, extra = {}) => ({
  exerciseId, unit: 'kg', sets: sets.map(([load, reps, kind = 'work']) => ({ kind, load, reps, at: 0 })), ...extra,
});

const SESSIONS = [
  session('a', '2026-11-02', [
    entry('leg_press_45', [[20, 15, 'warmup'], [40, 12], [40, 11]]),
    entry('plank', [[0, 30], [0, 25]]),
  ]),
  session('b', '2026-11-16', [
    entry('leg_press_45', [[45, 10]]),
    entry('plank', [[0, 45]]),
  ]),
];

const base = { sessions: [], days: [], exercises: EXERCISES, today: TODAY, weeklyGoal: 3, proteinTargetG: null, weightGoal: null, profileKg: 70 };

test('empty data: says so in plain words and still asks the question', () => {
  const text = buildReport(base);
  assert.ok(text.includes('gerado em 18/11/2026'));
  assert.ok(text.includes('meta de 3 treinos por semana'));
  assert.ok(text.includes('- Ainda não concluí nenhum treino.'));
  assert.ok(text.includes('- Ainda sem cargas registradas.'));
  assert.ok(text.includes('PERGUNTA'));
  assert.ok(text.includes('Responda em português'));
  for (const bad of ['undefined', 'NaN', 'null']) assert.ok(!text.includes(bad), bad);
});

test('the question is the fixed text at the end', () => {
  assert.ok(buildReport(base).endsWith(REPORT_QUESTION));
});

test('frequency and first -> last best work set per exercise', () => {
  const text = buildReport({ ...base, sessions: SESSIONS });
  assert.ok(text.includes('- Treinos concluídos: 2 (desde 02/11/2026)'));
  assert.ok(text.includes('- Último treino: 16/11/2026'));
  assert.ok(text.includes('- Últimas 4 semanas: 2 treinos (média de 0,5 por semana)'));
  assert.ok(text.includes('- Leg press 45°: 40 kg × 12 (02/11) → 45 kg × 10 (16/11), 2 treinos'));
  assert.ok(text.includes('- Prancha: 30 s → 45 s, 2 treinos'));
});

test('a warm-up set heavier than the work sets never appears', () => {
  const heavy = [session('w', '2026-11-10', [entry('leg_press_45', [[100, 5, 'warmup'], [40, 12]])])];
  const text = buildReport({ ...base, sessions: heavy });
  assert.ok(text.includes('- Leg press 45°: 40 kg × 12 (10/11), 1 treino'));
  assert.ok(!text.includes('100'));
});

test('a placa exercise is written as placa', () => {
  const placa = [session('p', '2026-11-10', [entry('leg_press_45', [[6, 12]], { unit: 'placa' })])];
  assert.ok(buildReport({ ...base, sessions: placa }).includes('placa 6 × 12 (10/11), 1 treino'));
});

test('weight, sleep and energy averages', () => {
  const days = [
    { localDate: '2026-11-17', weightKg: 70.4, sleep: 4, energy: 3 },
    { localDate: '2026-11-18', weightKg: 70.6, sleep: 3, energy: 4 },
  ];
  const text = buildReport({ ...base, days });
  assert.ok(text.includes('- Peso médio (7 dias): 70,5 kg (2 pesagens)'));
  assert.ok(text.includes('- Sono: média 3,5 (2 registros)'));
  assert.ok(text.includes('- Energia: média 3,5 (2 registros)'));
});

test('weight 4 weeks ago, goal and waist', () => {
  const days = [
    { localDate: '2026-10-21', weightKg: 69 },
    { localDate: '2026-11-18', weightKg: 71 },
    { localDate: '2026-10-01', waistCm: 85 },
    { localDate: '2026-11-01', waistCm: 83.5 },
  ];
  const text = buildReport({ ...base, days, weightGoal: { targetKg: 75, startKg: 70, setAt: '2026-11-01' } });
  assert.ok(text.includes('- Peso médio há 4 semanas: 69 kg'));
  assert.ok(text.includes('- Meta de peso: 75 kg'));
  assert.ok(text.includes('- Cintura: 83,5 cm em 01/11 (antes: 85 cm em 01/10)'));
});

test('empty weight, sleep and protein sections say so', () => {
  const text = buildReport(base);
  assert.ok(text.includes('- Sem pesagens nos últimos 7 dias.'));
  assert.ok(text.includes('- Sono: sem registros.'));
  assert.ok(text.includes('- Energia: sem registros.'));
  assert.ok(text.includes('- Sem anotações nos últimos 7 dias.'));
});

test('protein average against the automatic target', () => {
  const days = [
    { localDate: '2026-11-17', protein: [{ g: 100 }, { g: 20 }] },
    { localDate: '2026-11-18', protein: [{ g: 100 }] },
  ];
  const text = buildReport({ ...base, days });
  assert.ok(text.includes('- Meta: 120 g por dia'));
  assert.ok(text.includes('- Média: 110 g por dia anotado (2 dias); 1 dia com 112 g ou mais'));
});

test('a typed protein target wins', () => {
  assert.ok(buildReport({ ...base, proteinTargetG: 150 }).includes('- Meta: 150 g por dia'));
});

test('the name is never in the report, even when a name field is passed', () => {
  const text = buildReport({ ...base, sessions: SESSIONS, name: 'Ivonilson', profile: { name: 'Ivonilson' } });
  assert.ok(!text.includes('Ivonilson'));
});

test('junk settings fall back to safe values', () => {
  const text = buildReport({ ...base, weeklyGoal: 'x', weightGoal: 'abc', proteinTargetG: 'y', profileKg: undefined });
  assert.ok(text.includes('meta de 3 treinos por semana'));
  assert.ok(!text.includes('Meta de peso'));
  assert.ok(text.includes('- Meta: 120 g por dia'));
  for (const bad of ['undefined', 'NaN']) assert.ok(!text.includes(bad), bad);
});

test('the streak line appears when the goal was met', () => {
  const week = ['2026-11-16', '2026-11-17'].map((d, i) => session('s' + i, d, [entry('leg_press_45', [[40, 12]])]));
  const text = buildReport({ ...base, sessions: week, weeklyGoal: 2 });
  assert.ok(text.includes('- Sequência: 1 semana com a meta batida'));
});
