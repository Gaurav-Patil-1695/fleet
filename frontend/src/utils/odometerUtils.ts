/**
 * odometerUtils.ts
 * Odometer value formatting helpers.
 */

/**
 * Format an odometer reading as a human-readable string with thousands separator.
 * e.g. 123456 -> "123,456 km"
 */
export function formatOdometer(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${value.toLocaleString('en-GB')} km`;
}

/**
 * Format an odometer reading as a plain number string with thousands separator (no unit).
 * e.g. 123456 -> "123,456"
 */
export function formatOdometerPlain(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('en-GB');
}

/**
 * Format the remaining km until next service.
 * Positive values indicate km remaining; negative values indicate overdue by that many km.
 * e.g. 5000 -> "5,000 km remaining"
 * e.g. -200 -> "200 km overdue"
 */
export function formatKmRemaining(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  if (value < 0) {
    return `${Math.abs(value).toLocaleString('en-GB')} km overdue`;
  }
  if (value === 0) {
    return 'Service due now';
  }
  return `${value.toLocaleString('en-GB')} km remaining`;
}

/**
 * Calculate km remaining until next service.
 * Returns null if either value is not available.
 */
export function kmUntilService(
  currentOdometer: number | null | undefined,
  nextServiceOdometer: number | null | undefined,
): number | null {
  if (currentOdometer === null || currentOdometer === undefined) return null;
  if (nextServiceOdometer === null || nextServiceOdometer === undefined) return null;
  return nextServiceOdometer - currentOdometer;
}

/**
 * Returns true if the vehicle is overdue for service by odometer (current >= next service).
 */
export function isOdometerOverdue(
  currentOdometer: number | null | undefined,
  nextServiceOdometer: number | null | undefined,
): boolean {
  const remaining = kmUntilService(currentOdometer, nextServiceOdometer);
  return remaining !== null && remaining <= 0;
}

/**
 * Returns true if the vehicle is within the given km threshold of its next service.
 * Overdue vehicles also return true.
 */
export function isOdometerDueWithinKm(
  currentOdometer: number | null | undefined,
  nextServiceOdometer: number | null | undefined,
  withinKm: number,
): boolean {
  const remaining = kmUntilService(currentOdometer, nextServiceOdometer);
  return remaining !== null && remaining <= withinKm;
}

/**
 * Parse a user-supplied odometer string (may contain commas or spaces) to a number.
 * Returns null if the value cannot be parsed or is negative.
 */
export function parseOdometerInput(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const cleaned = value.replace(/[,\s]/g, '');
  const parsed = Number(cleaned);
  if (isNaN(parsed) || parsed < 0) return null;
  return parsed;
}

/**
 * Validate an odometer reading against the last known odometer value.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateOdometerReading(
  newValue: number | null | undefined,
  lastKnown: number | null | undefined,
): string | null {
  if (newValue === null || newValue === undefined) {
    return 'Odometer reading is required.';
  }
  if (newValue < 0) {
    return 'Odometer reading must not be negative.';
  }
  if (lastKnown !== null && lastKnown !== undefined && newValue < lastKnown) {
    return `Odometer reading must not be less than the last known value (${formatOdometer(lastKnown)}).`;
  }
  return null;
}
