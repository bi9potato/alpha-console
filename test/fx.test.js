import test from 'node:test';
import assert from 'node:assert/strict';
import { calcChange, fetchRate, getAlertState, getFallbackRate } from '../src/fx.js';

test('calculates percentage change', () => {
  assert.equal(calcChange(110, 100), 10);
  assert.equal(calcChange(95, 100), -5);
});

test('detects alert thresholds', () => {
  const pair = { alertAbove: 7.3, alertBelow: 7.1 };
  assert.equal(getAlertState(7.35, pair).level, 'danger');
  assert.equal(getAlertState(7.05, pair).level, 'warning');
  assert.equal(getAlertState(7.2, pair).level, 'normal');
});

test('uses inverse fallback rate when direct rate is unavailable', () => {
  const direct = getFallbackRate('USD', 'CNY');
  const inverse = getFallbackRate('CNY', 'USD');
  assert.ok(Math.abs(direct * inverse - 1) < 0.000001);
});

test('fetchRate parses provider response', async () => {
  const mockFetch = async () => ({ ok: true, json: async () => ({ date: '2026-06-22', rates: { CNY: 7.2 } }) });
  const result = await fetchRate('USD', 'CNY', mockFetch);
  assert.deepEqual(result, { rate: 7.2, date: '2026-06-22', source: 'Frankfurter' });
});
