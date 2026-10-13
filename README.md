# month-boundary-iterator

Yields every month-start timestamp (in UTC) between two `Date` values, with options for inclusive or exclusive endpoints.

## Usage

```js
import { monthBoundaryIterator } from 'month-boundary-iterator';

const start = new Date('2024-01-15T00:00:00Z');
const end = new Date('2024-05-15T00:00:00Z');

// Default: both endpoints exclusive
for (const boundary of monthBoundaryIterator(start, end)) {
  console.log(boundary.toISOString());
}
// 2024-02-01T00:00:00.000Z
// 2024-03-01T00:00:00.000Z
// 2024-04-01T00:00:00.000Z
// 2024-05-01T00:00:00.000Z

// Include endpoints if they land exactly on a month boundary
const strictStart = new Date('2024-01-01T00:00:00Z');
const strictEnd = new Date('2024-03-01T00:00:00Z');
const all = [...monthBoundaryIterator(strictStart, strictEnd, {
  includeStart: true,
  includeEnd: true,
})];
```

## Why

Generating monthly reporting buckets between two timestamps is a small, repeated task. Most date libraries provide month-stepping but gloss over the boundary semantics: should the start or end timestamp itself be included when it coincides with a month start? This library makes that explicit.

All comparisons are done in UTC. This is a deliberate trade-off: it avoids timezone-dependent results so the same input always produces the same output on any machine, but it means you must pass UTC timestamps (or accept that a local midnight will be a different instant).

## Edge case

A timestamp is only treated as a month boundary when its UTC date component is the first of the month and the time is exactly `00:00:00.000Z`. A start of `2024-02-01T00:00:00.001Z` is not a boundary — the first yielded value will be `2024-03-01T00:00:00Z`.

If `start` is after `end`, the iterator throws a `RangeError` by default. Pass `{ throwOnReversed: false }` to silently yield nothing instead.
