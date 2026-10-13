/**
 * dateUtils.ts
 * Date formatting and relative-date helpers for service due display.
 */

/**
 * Format an ISO date string or Date object as a human-readable date.
 * e.g. "12 Jan 2025"
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format an ISO date string or Date object as a short date.
 * e.g. "12/01/2025"
 */
export function formatShortDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format an ISO datetime string or Date object as a human-readable datetime.
 * e.g. "12 Jan 2025, 14:30"
 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Returns the number of calendar days between today and a future due date.
 * Negative values indicate the date is in the past (overdue).
 */
export function daysUntilDue(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(date.getTime())) return null;
  const today = startOfDay(new Date());
  const due = startOfDay(date);
  const diffMs = due.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Returns a human-readable relative label for a service due date.
 * e.g. "Overdue by 3 days", "Due today", "Due in 5 days", "Due in 2 months"
 */
export function relativeDueLabel(value: string | Date | null | undefined): string {
  if (!value) return 'No due date';
  const days = daysUntilDue(value);
  if (days === null) return 'No due date';
  if (days < 0) {
    const abs = Math.abs(days);
    return abs === 1 ? 'Overdue by 1 day' : `Overdue by ${abs} days`;
  }
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days < 30) return `Due in ${days} days`;
  const months = Math.round(days / 30);
  return months === 1 ? 'Due in 1 month' : `Due in ${months} months`;
}

/**
 * Returns true if the given date is overdue (strictly before today).
 */
export function isOverdue(value: string | Date | null | undefined): boolean {
  const days = daysUntilDue(value);
  return days !== null && days < 0;
}

/**
 * Returns true if the given date is due within the specified number of days (inclusive).
 * Overdue dates also return true.
 */
export function isDueWithinDays(
  value: string | Date | null | undefined,
  withinDays: number,
): boolean {
  const days = daysUntilDue(value);
  return days !== null && days <= withinDays;
}

/**
 * Returns true if the due date is approaching soon (within 30 days) but not yet overdue.
 */
export function isDueSoon(value: string | Date | null | undefined): boolean {
  const days = daysUntilDue(value);
  return days !== null && days >= 0 && days <= 30;
}

/**
 * Returns the start of a given day (midnight local time) as a new Date.
 */
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Parse an ISO date string safely, returning null if invalid.
 */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format a date as an ISO date-only string (YYYY-MM-DD), suitable for input[type=date].
 */
export function toInputDateString(value: Date | null | undefined): string {
  if (!value || isNaN(value.getTime())) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
