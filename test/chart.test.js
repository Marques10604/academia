import test from 'node:test';
import assert from 'node:assert/strict';
import { chartGeometry } from '../src/ui/chart.js';

const P = (x, y) => ({ x, y });

test('chartGeometry: default size, first/last x, higher value is higher on screen, d starts with M', () => {
  const g = chartGeometry([{ points: [P(0, 10), P(10, 20)], style: 'line' }]);
  assert.equal(g.width, 320);
  assert.equal(g.height, 160);
  const [a, b] = g.series[0].coords;
  assert.equal(a.x, 40);
  assert.equal(b.x, 310);
  assert.ok(b.y < a.y, 'y of 20 is above y of 10');
  for (const c of g.series[0].coords) assert.ok(c.y >= 10 && c.y <= 138, 'inside the plot: ' + c.y);
  assert.ok(g.series[0].d.startsWith('M'));
  assert.equal(g.series[0].style, 'line');
});

test('chartGeometry: one point is centered with no path', () => {
  const g = chartGeometry([{ points: [P(3, 7)], style: 'linedots' }]);
  assert.equal(g.series[0].coords[0].x, 175);
  assert.equal(g.series[0].d, '');
});

test('chartGeometry: flat series stays finite and inside the plot, with one tick', () => {
  const g = chartGeometry([{ points: [P(0, 5), P(1, 5), P(2, 5)], style: 'line' }]);
  const ys = g.series[0].coords.map((c) => c.y);
  assert.ok(ys.every((y) => Number.isFinite(y) && y >= 10 && y <= 138));
  assert.equal(new Set(ys).size, 1);
  assert.equal(g.yTicks.length, 1);
  assert.equal(g.yTicks[0].value, 5);
});

test('chartGeometry: series share one y scale', () => {
  const alone = chartGeometry([{ points: [P(0, 10), P(1, 12)], style: 'line' }]);
  const both = chartGeometry([
    { points: [P(0, 10), P(1, 12)], style: 'line' },
    { points: [P(0, 30), P(1, 32)], style: 'dots' },
  ]);
  assert.ok(both.series[0].coords[1].y > alone.series[0].coords[1].y, 'series 1 moves down');
  assert.ok(both.series[1].coords[0].y < both.series[0].coords[0].y, 'higher series is above');
});

test('chartGeometry: y ticks are min, midpoint and max of the data', () => {
  const g = chartGeometry([{ points: [P(0, 20), P(1, 25), P(2, 30)], style: 'linedots' }]);
  assert.deepEqual(g.yTicks.map((t) => t.value), [20, 25, 30]);
  assert.ok(g.yTicks[2].y < g.yTicks[0].y);
});

test('chartGeometry: coordinates are rounded to 0.1', () => {
  const g = chartGeometry([{ points: [P(0, 1), P(3, 2), P(7, 4)], style: 'line' }]);
  for (const c of g.series[0].coords) {
    assert.equal(Math.round(c.x * 10) / 10, c.x);
    assert.equal(Math.round(c.y * 10) / 10, c.y);
  }
});
