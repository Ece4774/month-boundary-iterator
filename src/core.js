/**
 * @typedef {Object} MonthBoundaryOptions
 * @property {boolean} [includeStart=false]  When true, yield `start` itself if it
 *   lands on a month boundary (i.e. its UTC date is 1 and its time is 00:00:00.000).
 * @property {boolean} [includeEnd=false]    When true, yield `end` itself if it
 *   lands on a month boundary.
 * @property {boolean} [throwOnReversed=true]  When true, throw if `start` is after
 *   `end`. When false, silently yield nothing.
 */

/**
 * Determine whether a Date sits exactly on a month boundary: the first day of a
 * month at exactly 00:00:00.000 UTC. We compare in UTC deliberately, so the
 * library is independent of the host's local timezone. That makes results
 * deterministic across machines — a test in Tokyo and a test in New York see
 * the same boundaries for the same input.
 *
 * @param {Date} date
 * @returns {boolean}
 */
function isMonthBoundary(date) {
  return date.getUTCMonth() !== undefined &&
    date.getUTCDate() === 1 &&
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;
}

/**
 * Floor a Date to the nearest preceding (or current) month boundary in UTC.
 *
 * We build a fresh Date from year/month components rather than mutating with
 * `setUTCDate(1)` etc. Mutation via the set* methods is error-prone here: setting
 * the date to 1 on the 31st of January advances the month because of day overflow,
 * which is not what we want. Constructing from parts is unambiguous.
 *
 * @param {Date} date
 * @returns {Date}
 */
function floorToMonthBoundary(date) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    1,
    0,
    0,
    0,
    0
  ));
}

/**
 * Advance a Date to the first instant of the next month in UTC.
 *
 * `Date.UTC` correctly normalises overflowing month values (month 12 becomes
 * January of the next year), so we never need to handle year rollover manually.
 *
 * @param {Date} date
 * @returns {Date}
 */
function addOneMonth(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
}

/**
 * Generator that yields every month-start timestamp between `start` and `end`.
 *
 * All boundaries are computed and compared in UTC. Each yielded value is a new
 * Date object so callers can mutate it without affecting subsequent iterations.
 *
 * Inclusive/exclusive rules:
 *  - `includeStart` controls whether `start` itself is yielded when it is
 *    exactly on a boundary.
 *  - `includeEnd` controls whether `end` itself is yielded when it is exactly on
 *    a boundary.
 *  - Boundaries strictly between `start` and `end` are always yielded.
 *
 * If `start > end` and `throwOnReversed` is true, a RangeError is thrown.
 * If `start > end` and `throwOnReversed` is false, the generator yields nothing.
 *
 * @param {Date} start
 * @param {Date} end
 * @param {MonthBoundaryOptions} [options={}]
 * @returns {Generator<Date, void, void>}
 */
export function* monthBoundaryIterator(start, end, options = {}) {
  const {
    includeStart = false,
    includeEnd = false,
    throwOnReversed = true,
  } = options;

  if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
    throw new TypeError('start must be a valid Date');
  }
  if (!(end instanceof Date) || Number.isNaN(end.getTime())) {
    throw new TypeError('end must be a valid Date');
  }

  if (start.getTime() > end.getTime()) {
    if (throwOnReversed) {
      throw new RangeError('start must not be after end');
    }
    return;
  }

  const startBoundary = floorToMonthBoundary(start);
  let cursor;

  // Decide the first cursor position: if `start` is exactly on a boundary the
  // first candidate is `start` itself (subject to includeStart); otherwise we
  // floor to the next boundary strictly after `start`.
  if (isMonthBoundary(start)) {
    cursor = includeStart ? new Date(start.getTime()) : addOneMonth(start);
  } else {
    cursor = startBoundary;
    // If `start` is within the same month as its floor, the floor is before
    // `start`, so jump to the next month boundary.
    if (cursor.getTime() <= start.getTime()) {
      cursor = addOneMonth(cursor);
    }
  }

  const endMs = end.getTime();

  while (cursor.getTime() < endMs) {
    yield new Date(cursor.getTime());
    cursor = addOneMonth(cursor);
  }

  // After the loop, cursor === endMs only when `end` is itself a boundary.
  if (includeEnd && cursor.getTime() === endMs) {
    yield new Date(cursor.getTime());
  }
}
