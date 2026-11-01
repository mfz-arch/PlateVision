/**
 * Returns YYYY-MM-DD in the USER'S LOCAL timezone.
 *
 * `new Date().toISOString()` returns the UTC date, which is wrong for anyone not
 * on UTC (e.g. a meal scanned at 01:00 in UTC+3 would be filed under yesterday).
 */
export function toLocalDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const DATE_STR_REGEX = /^\d{4}-\d{2}-\d{2}$/;
