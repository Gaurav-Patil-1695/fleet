"""Date arithmetic helpers used by the scheduling service."""

from datetime import date, timedelta
from dateutil.relativedelta import relativedelta


def add_months(reference_date: date, months: int) -> date:
    """Return the date that is `months` calendar months after `reference_date`.

    Uses relativedelta to correctly handle month-end edge cases (e.g. Jan 31
    + 1 month = Feb 28/29).
    """
    return reference_date + relativedelta(months=months)


def add_days(reference_date: date, days: int) -> date:
    """Return the date that is `days` calendar days after `reference_date`."""
    return reference_date + timedelta(days=days)


def earliest_date(*dates: date) -> date:
    """Return the earliest date from the provided arguments.

    Raises ValueError if no dates are supplied.
    """
    if not dates:
        raise ValueError("At least one date must be provided.")
    return min(dates)


def latest_date(*dates: date) -> date:
    """Return the latest date from the provided arguments.

    Raises ValueError if no dates are supplied.
    """
    if not dates:
        raise ValueError("At least one date must be provided.")
    return max(dates)


def days_between(start: date, end: date) -> int:
    """Return the number of calendar days between `start` and `end`.

    The result is positive when `end` is after `start`, negative when before.
    """
    return (end - start).days


def is_overdue(due_date: date, reference_date: date | None = None) -> bool:
    """Return True if `due_date` is strictly before `reference_date`.

    When `reference_date` is None the current UTC date is used.
    """
    today = reference_date if reference_date is not None else date.today()
    return due_date < today


def next_service_date_by_months(
    last_serviced_at: date,
    month_interval: int,
) -> date:
    """Compute the calendar-month-based next service date.

    Adds `month_interval` whole calendar months to `last_serviced_at`.
    """
    return add_months(last_serviced_at, month_interval)


def compute_next_service_due_date(
    last_serviced_at: date,
    km_interval: int,
    month_interval: int,
    current_odometer_km: int,
    last_serviced_odometer_km: int,
) -> date:
    """Return the earliest of the km-based and month-based service due dates.

    Business rules (BR-2):
    - Month trigger: `last_serviced_at` + `month_interval` calendar months.
    - Km trigger: estimated date when the vehicle will accumulate `km_interval`
      km of travel since the last service, derived from daily average usage.
      If usage cannot be estimated the km-trigger date is omitted and only the
      month-trigger is used.

    Parameters
    ----------
    last_serviced_at:
        The date the vehicle was last serviced.
    km_interval:
        Number of kilometres between services.
    month_interval:
        Number of calendar months between services.
    current_odometer_km:
        Most recent odometer reading (km).
    last_serviced_odometer_km:
        Odometer reading at the time of the last service (km).
    """
    month_due = next_service_date_by_months(last_serviced_at, month_interval)

    km_remaining = (
        last_serviced_odometer_km + km_interval
    ) - current_odometer_km

    today = date.today()
    days_since_service = days_between(last_serviced_at, today)

    km_since_service = current_odometer_km - last_serviced_odometer_km

    if days_since_service > 0 and km_since_service > 0:
        daily_km = km_since_service / days_since_service
        days_until_km_due = km_remaining / daily_km
        km_due = today + timedelta(days=days_until_km_due)
        return earliest_date(month_due, km_due)

    # Cannot estimate km-based date; fall back to month trigger only.
    return month_due
