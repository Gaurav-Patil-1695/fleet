"""scheduling_service.py

Core domain logic for calculating next service due date and odometer.

Business rules:
- BR-2: For light commercial vehicles, the service interval is 12,000 km or
  6 months, whichever falls first.
- BR-1: Heavy truck schedules are maintained separately with their own
  km_interval and month_interval values.

This service is called by readings, work_orders, and schedules modules.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from app.utils.datetime_utils import utcnow


def calculate_next_service(
    last_serviced_at: Optional[date | datetime],
    last_serviced_odometer_km: Optional[float],
    km_interval: Optional[float],
    month_interval: Optional[int],
) -> tuple[Optional[date], Optional[float]]:
    """Calculate next_service_due_date and next_service_due_odometer.

    Given the last service date/odometer and the schedule intervals, return the
    (next_service_due_date, next_service_due_odometer_km) tuple, choosing
    whichever threshold falls first.

    Args:
        last_serviced_at: The date (or datetime) the vehicle was last serviced.
        last_serviced_odometer_km: The odometer reading at the last service.
        km_interval: The km-based service interval from the schedule.
        month_interval: The month-based service interval from the schedule.

    Returns:
        A tuple of (next_service_due_date, next_service_due_odometer_km).
        Either element may be None if insufficient data is available to compute
        it.
    """
    next_due_date: Optional[date] = _calculate_next_due_date(
        last_serviced_at, month_interval
    )
    next_due_odometer: Optional[float] = _calculate_next_due_odometer(
        last_serviced_odometer_km, km_interval
    )
    return next_due_date, next_due_odometer


def _calculate_next_due_date(
    last_serviced_at: Optional[date | datetime],
    month_interval: Optional[int],
) -> Optional[date]:
    """Return the calendar-based next service due date.

    Args:
        last_serviced_at: The date (or datetime) the vehicle was last serviced.
        month_interval: Number of months between services.

    Returns:
        The next due date, or None if either input is None.
    """
    if last_serviced_at is None or month_interval is None:
        return None

    base_date: date
    if isinstance(last_serviced_at, datetime):
        base_date = last_serviced_at.date()
    else:
        base_date = last_serviced_at

    # Advance by month_interval months, handling year rollovers and short months.
    year = base_date.year
    month = base_date.month + month_interval
    year += (month - 1) // 12
    month = ((month - 1) % 12) + 1

    # Clamp the day to the last valid day of the target month.
    import calendar

    max_day = calendar.monthrange(year, month)[1]
    day = min(base_date.day, max_day)

    return date(year, month, day)


def _calculate_next_due_odometer(
    last_serviced_odometer_km: Optional[float],
    km_interval: Optional[float],
) -> Optional[float]:
    """Return the odometer-based next service due reading.

    Args:
        last_serviced_odometer_km: Odometer at the last service.
        km_interval: Km interval between services.

    Returns:
        The next due odometer value, or None if either input is None.
    """
    if last_serviced_odometer_km is None or km_interval is None:
        return None
    return last_serviced_odometer_km + km_interval


def pick_earlier_due_date(
    date_threshold: Optional[date],
    odometer_threshold: Optional[float],
    current_odometer_km: Optional[float],
    reference_date: Optional[date] = None,
) -> tuple[Optional[date], Optional[float]]:
    """Choose the whichever-falls-first due thresholds.

    This helper is useful when a caller needs to decide which of the two
    thresholds is "sooner" given the current odometer progress.

    It does NOT modify the due_date or due_odometer values — those are already
    absolute. It simply returns them unchanged so that the caller can store
    both and display whichever is sooner.

    Args:
        date_threshold: The calendar-based next service date.
        odometer_threshold: The odometer-based next service km.
        current_odometer_km: The vehicle's current odometer reading.
        reference_date: The date to compare against (defaults to today UTC).

    Returns:
        The same (date_threshold, odometer_threshold) tuple — both thresholds
        are stored; the caller uses both to determine which fires first.
    """
    # Both thresholds are always persisted; callers decide which to surface.
    # This function exists to centralise the "both" contract.
    return date_threshold, odometer_threshold


def is_service_due(
    next_service_due_date: Optional[date],
    next_service_due_odometer_km: Optional[float],
    current_odometer_km: Optional[float],
    reference_date: Optional[date] = None,
) -> bool:
    """Return True if either service threshold has been reached.

    Args:
        next_service_due_date: Calendar threshold.
        next_service_due_odometer_km: Odometer threshold.
        current_odometer_km: Current odometer reading.
        reference_date: Date to compare against (defaults to today UTC).

    Returns:
        True if the vehicle is at or past either threshold.
    """
    today: date = reference_date or utcnow().date()

    date_due = (
        next_service_due_date is not None and today >= next_service_due_date
    )

    odometer_due = (
        next_service_due_odometer_km is not None
        and current_odometer_km is not None
        and current_odometer_km >= next_service_due_odometer_km
    )

    return date_due or odometer_due
