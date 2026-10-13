"""Factory for selecting the correct OdometerProvider based on TELEMATICS_MODE.

No code may import LiveOdometerProvider or MockOdometerProvider directly.
All callers must obtain a provider through get_odometer_provider().
Switching between mock and live requires only a configuration change.
"""

import logging
from functools import lru_cache

from app.config import settings
from app.modules.telematics.providers import OdometerProvider

logger = logging.getLogger(__name__)

_MODE_MOCK = "mock"
_MODE_LIVE = "live"


@lru_cache(maxsize=1)
def get_odometer_provider() -> OdometerProvider:
    """Return the configured OdometerProvider instance.

    The active provider is selected solely from the TELEMATICS_MODE environment
    variable.  No code change is required to switch between mock and live modes.

    Supported values for TELEMATICS_MODE:
        ``mock`` — returns a deterministic MockOdometerProvider (default for
                   development and testing; requires no network access).
        ``live`` — returns a LiveOdometerProvider that calls the real
                   telematics HTTP endpoint.

    Returns:
        An OdometerProvider instance appropriate for the configured mode.

    Raises:
        ValueError: When TELEMATICS_MODE is set to an unrecognised value.
    """
    mode: str = (settings.TELEMATICS_MODE or _MODE_MOCK).strip().lower()

    if mode == _MODE_MOCK:
        # Import inside the branch so that LiveOdometerProvider is never loaded
        # in mock mode, and MockOdometerProvider is never loaded in live mode.
        from app.modules.telematics.providers.mock_provider import MockOdometerProvider  # noqa: PLC0415

        logger.info("Telematics provider: MockOdometerProvider (TELEMATICS_MODE=%s)", mode)
        return MockOdometerProvider()

    if mode == _MODE_LIVE:
        from app.modules.telematics.providers.live_provider import LiveOdometerProvider  # noqa: PLC0415

        logger.info("Telematics provider: LiveOdometerProvider (TELEMATICS_MODE=%s)", mode)
        return LiveOdometerProvider()

    raise ValueError(
        f"Unknown TELEMATICS_MODE={mode!r}. "
        f"Supported values are {_MODE_MOCK!r} and {_MODE_LIVE!r}."
    )


__all__ = ["get_odometer_provider"]
