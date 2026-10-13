"""OdometerProvider interface for the telematics adapter module."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass
class OdometerReading:
    """A single odometer reading returned by a telematics provider."""

    vehicle_id: str
    odometer_km: float
    reading_timestamp: datetime
    raw_payload: dict[str, Any] | None = None


class OdometerProvider(ABC):
    """Abstract base class defining the provider-agnostic telematics interface.

    All telematics access must go through this interface.
    No code may import LiveProvider or MockProvider directly.
    """

    @abstractmethod
    async def fetch_readings(self, vehicle_ids: list[str]) -> list[OdometerReading]:
        """Fetch the latest odometer readings for the given vehicle IDs.

        Args:
            vehicle_ids: A list of vehicle identifiers (registration numbers or
                         internal IDs, as agreed with the provider implementation).

        Returns:
            A list of OdometerReading instances, one per vehicle for which
            data is available.  Vehicles with no data are omitted rather than
            raising an error.
        """
        raise NotImplementedError


__all__ = ["OdometerProvider", "OdometerReading"]
