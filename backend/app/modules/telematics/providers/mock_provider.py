"""MockOdometerProvider — deterministic simulated readings for TELEMATICS_MODE=mock."""

from datetime import datetime, timezone
from typing import Any

from app.modules.telematics.providers import OdometerProvider, OdometerReading

# Deterministic base odometer values keyed by vehicle_id string.
# Each call returns the same value per vehicle_id so tests remain stable.
_BASE_ODOMETER_KM: float = 50_000.0
_ODOMETER_INCREMENT_PER_VEHICLE: float = 1_000.0

# Fixed timestamp used for all mock readings to keep output deterministic.
_FIXED_TIMESTAMP: datetime = datetime(2024, 1, 15, 8, 0, 0, tzinfo=timezone.utc)


def _deterministic_odometer(vehicle_id: str) -> float:
    """Return a deterministic odometer value derived from the vehicle_id string.

    The value is computed from the sum of ordinal values of the vehicle_id
    characters, scaled to a realistic range.  The same input always produces
    the same output with no randomness.
    """
    char_sum = sum(ord(c) for c in vehicle_id)
    return (
        _BASE_ODOMETER_KM
        + (char_sum % 500) * (_ODOMETER_INCREMENT_PER_VEHICLE / 500)
    )


def _build_raw_payload(vehicle_id: str, odometer_km: float) -> dict[str, Any]:
    """Build a schema-valid raw payload dict for the mock reading."""
    return {
        "source": "telematics_mock",
        "vehicle_id": vehicle_id,
        "odometer_km": odometer_km,
        "timestamp": _FIXED_TIMESTAMP.isoformat(),
        "provider": "mock",
    }


class MockOdometerProvider(OdometerProvider):
    """Deterministic mock implementation of OdometerProvider.

    Selected when TELEMATICS_MODE=mock.  Returns schema-valid, deterministic
    readings that require no network calls, making them suitable for automated
    tests and local development.

    The same vehicle_id always produces the same odometer_km value across
    calls, ensuring test repeatability.
    """

    async def fetch_readings(self, vehicle_ids: list[str]) -> list[OdometerReading]:
        """Return deterministic simulated odometer readings for each vehicle_id.

        Args:
            vehicle_ids: A list of vehicle identifiers.

        Returns:
            A list of OdometerReading instances — one per vehicle_id supplied.
            Ordering mirrors the input list.
        """
        readings: list[OdometerReading] = []
        for vehicle_id in vehicle_ids:
            odometer_km = _deterministic_odometer(vehicle_id)
            raw_payload = _build_raw_payload(vehicle_id, odometer_km)
            readings.append(
                OdometerReading(
                    vehicle_id=vehicle_id,
                    odometer_km=odometer_km,
                    reading_timestamp=_FIXED_TIMESTAMP,
                    raw_payload=raw_payload,
                )
            )
        return readings


__all__ = ["MockOdometerProvider"]
