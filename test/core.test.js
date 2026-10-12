import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthBoundaryIterator } from '../src/index.js';

function utc(year, month, day = 1, hour = 0, minute = 0, second = 0, ms = 0) {
  return new Date(Date.UTC(year, month, day, hour, minute, second, ms));
}

function collect(start, end, options) {
  return Array.from(monthBoundaryIterator(start, end, options));
}

test('yields boundaries strictly between two mid-month dates', () => {
  const start = utc(2024, 0, 15);  // 2024-01-15
  const end = utc(2024, 4, 15);    // 2024-05-15
  const result = collect(start, end);
  assert.deepEqual(result, [
    utc(2024, 1, 1),  // Feb
    utc(2024, 2, 1),  // Mar
    utc(2024, 3, 1),  // Apr
    utc(2024, 4, 1),  // May
  ]);
});

test('excludeStart: start on a boundary is skipped by default', () => {
  const start = utc(2024, 0, 1);  // exactly 2024-01-01T00:00:00Z
  const end = utc(2024, 2, 1);    // exactly 2024-03-01T00:00:00Z
  const result = collect(start, end);
  assert.deepEqual(result, [
    utc(2024, 1, 1),
  ]);
});

test('includeStart: start on a boundary is yielded', () => {
  const start = utc(2024, 0, 1);
  const end = utc(2024, 2, 1);
  const result = collect(start, end, { includeStart: true });
  assert.deepEqual(result, [
    utc(2024, 0, 1),
    utc(2024, 1, 1),
  ]);
});

test('excludeEnd: end on a boundary is skipped by default', () => {
  const start = utc(2024, 0, 1);
  const end = utc(2024, 2, 1);
  const result = collect(start, end, { includeStart: true });
  assert.deepEqual(result, [
    utc(2024, 0, 1),
    utc(2024, 1, 1),
  ]);
});

test('includeEnd: end on a boundary is yielded', () => {
  const start = utc(2024, 0, 1);
  const end = utc(2024, 2, 1);
  const result = collect(start, end, { includeStart: true, includeEnd: true });
  assert.deepEqual(result, [
    utc(2024, 0, 1),
    utc(2024, 1, 1),
    utc(2024, 2, 1),
  ]);
});

test('includeEnd without includeStart: end boundary yielded, start skipped', () => {
  const start = utc(2024, 0, 1);
  const end = utc(2024, 2, 1);
  const result = collect(start, end, { includeEnd: true });
  assert.deepEqual(result, [
    utc(2024, 1, 1),
    utc(2024, 2, 1),
  ]);
});

test('start and end in same month with no boundary between them yields nothing', () => {
  const start = utc(2024, 2, 10);
  const end = utc(2024, 2, 20);
  const result = collect(start, end);
  assert.deepEqual(result, []);
});

test('start and end on same boundary: exclusive yields nothing', () => {
  const boundary = utc(2024, 0, 1);
  const result = collect(boundary, boundary);
  assert.deepEqual(result, []);
});

test('start and end on same boundary: includeStart and includeEnd yields once', () => {
  const boundary = utc(2024, 0, 1);
  const result = collect(boundary, boundary, { includeStart: true, includeEnd: true });
  assert.deepEqual(result, [utc(2024, 0, 1)]);
});

test('start on last day of month, end on first day of next month', () => {
  const start = utc(2024, 0, 31, 23, 59, 59, 999);  // 2024-01-31T23:59:59.999Z
  const end = utc(2024, 1, 1);                      // 2024-02-01T00:00:00Z
  const result = collect(start, end);
  assert.deepEqual(result, []);
});

test('start just before boundary, end just after: single boundary yielded', () => {
  const start = utc(2024, 1, 1, 0, 0, 0, -1);  // 2024-01-31T23:59:59.999Z
  const end = utc(2024, 1, 1, 0, 0, 0, 1);      // 2024-02-01T00:00:00.001Z
  const result = collect(start, end);
  assert.deepEqual(result, [utc(2024, 1, 1)]);
});

test('handles year rollover from December to January', () => {
  const start = utc(2024, 11, 15);  // 2024-12-15
  const end = utc(2025, 1, 15);    // 2025-02-15
  const result = collect(start, end);
  assert.deepEqual(result, [
    utc(2025, 0, 1),
    utc(2025, 1, 1),
  ]);
});

test('throws RangeError when start is after end (default)', () => {
  const start = utc(2024, 5, 1);
  const end = utc(2024, 0, 1);
  assert.throws(
    () => collect(start, end),
    { name: 'RangeError', message: 'start must not be after end' }
  );
});

test('throws TypeError for invalid start date', () => {
  assert.throws(
    () => collect(new Date('not a date'), utc(2024, 0, 1)),
    { name: 'TypeError', message: 'start must be a valid Date' }
  );
});

test('throws TypeError for invalid end date', () => {
  assert.throws(
    () => collect(utc(2024, 0, 1), new Date('not a date')),
    { name: 'TypeError', message: 'end must be a valid Date' }
  );
});

test('throwOnReversed=false yields nothing for reversed range', () => {
  const start = utc(2024, 5, 1);
  const end = utc(2024, 0, 1);
  const result = collect(start, end, { throwOnReversed: false });
  assert.deepEqual(result, []);
});
