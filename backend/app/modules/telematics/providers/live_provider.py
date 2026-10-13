"""LiveOdometerProvider — calls real telematics HTTP endpoint using config credentials.

Selected when TELEMATICS_MODE=live.
All telematics access must go through the OdometerProvider interface.
No code may import this class directly — use the factory instead.
"""

import logging
from datetime import datetime, timezone
from typing import Any

import httpx

from app.config import settings
from app.modules.telematics.providers import OdometerProvider, OdometerReading

logger = logging.getLogger(__name__)


class LiveOdometerProvider(OdometerProvider):
    """Live implementation of OdometerProvider.

    Fetches real odometer readings from the configured telematics HTTP
    endpoint.  Selected when TELEMATICS_MODE=live.

    Configuration is read exclusively from environment variables:
        TELEMATICS_LIVE_BASE_URL     — base URL of the telematics service
        TELEMATICS_API_KEY           — API key sent in the Authorization header
        TELEMATICS_REQUEST_TIMEOUT_SECONDS — per-request timeout
    """

    def __init__(self) -> None:
        self._base_url: str = settings.TELEMATICS_LIVE_BASE_URL.rstrip("/")
        self._api_key: str = settings.TELEMATICS_API_KEY
        self._timeout: float = float(settings.TELEMATICS_REQUEST_TIMEOUT_SECONDS)

    def _build_headers(self) -> dict[str, str]:
        """Build HTTP headers for the telematics API request."""
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def _parse_timestamp(self, raw: Any) -> datetime:
        """Parse a timestamp string from the API response into an aware datetime.

        Falls back to the current UTC time if parsing fails, logging a warning.
        """
        if isinstance(raw, str):
            try:
                dt = datetime.fromisoformat(raw)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except ValueError:
                logger.warning(
                    "Failed to parse timestamp %r; falling back to utcnow", raw
                )
        return datetime.now(tz=timezone.utc)

    def _parse_reading(self, item: dict[str, Any]) -> OdometerReading | None:
        """Parse a single item from the API response into an OdometerReading.

        Returns None if required fields are missing or malformed.
        """
        try:
            vehicle_id: str = str(item["vehicle_id"])
            odometer_km: float = float(item["odometer_km"])
            reading_timestamp: datetime = self._parse_timestamp(item.get("timestamp"))
            return OdometerReading(
                vehicle_id=vehicle_id,
                odometer_km=odometer_km,
                reading_timestamp=reading_timestamp,
                raw_payload=item,
            )
        except (KeyError, TypeError, ValueError) as exc:
            logger.warning("Skipping malformed telematics item %r: %s", item, exc)
            return None

    async def fetch_readings(self, vehicle_ids: list[str]) -> list[OdometerReading]:
        """Fetch the latest odometer readings from the live telematics endpoint.

        Sends a POST request to ``{TELEMATICS_LIVE_BASE_URL}/readings`` with
        the list of vehicle IDs and returns one OdometerReading per vehicle
        for which the API returned valid data.  Vehicles absent from the
        response (no data available) are silently omitted.

        Args:
            vehicle_ids: A list of vehicle identifiers.

        Returns:
            A list of OdometerReading instances for vehicles with data.

        Raises:
            httpx.HTTPStatusError: When the telematics API returns a non-2xx
                status code.
            httpx.RequestError: When a network-level error prevents the
                request from completing.
        """
        if not vehicle_ids:
            return []

        url = f"{self._base_url}/readings"
        payload: dict[str, Any] = {"vehicle_ids": vehicle_ids}

        logger.debug(
            "Fetching live telematics readings for %d vehicle(s) from %s",
            len(vehicle_ids),
            url,
        )

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                url,
                json=payload,
                headers=self._build_headers(),
            )
            response.raise_for_status()

        data: Any = response.json()

        # The API is expected to return a JSON object with a "readings" list,
        # or a bare JSON array.  Both shapes are handled gracefully.
        if isinstance(data, dict):
            items: list[Any] = data.get("readings", [])
        elif isinstance(data, list):
            items = data
        else:
            logger.warning(
                "Unexpected telematics API response shape: %r; returning empty list",
                type(data),
            )
            return []

        readings: list[OdometerReading] = []
        for item in items:
            if not isinstance(item, dict):
                logger.warning("Skipping non-dict telematics item: %r", item)
                continue
            reading = self._parse_reading(item)
            if reading is not None:
                readings.append(reading)

        logger.debug(
            "Received %d valid reading(s) from live telematics endpoint", len(readings)
        )
        return readings


__all__ = ["LiveOdometerProvider"]
