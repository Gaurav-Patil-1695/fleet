# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: builder — install Python dependencies into a virtual environment
# ---------------------------------------------------------------------------
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build tools needed for some native extensions (asyncpg, bcrypt)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create an isolated venv so we can copy it cleanly to the runtime stage
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy only the dependency manifest first to maximise layer cache reuse
COPY requirements.txt .

RUN pip install --upgrade pip --no-cache-dir \
    && pip install --no-cache-dir -r requirements.txt

# ---------------------------------------------------------------------------
# Stage 2: runtime — lean image with the venv and application code only
# ---------------------------------------------------------------------------
FROM python:3.11-slim AS runtime

LABEL maintainer="FleetMaint Team"
LABEL description="Fleet Maintenance Backend API"

WORKDIR /app

# Runtime system deps (libpq for asyncpg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Pull the pre-built venv from the builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy alembic configuration and migrations
COPY alembic.ini .
COPY migrations/ ./migrations/

# Copy the application source
COPY app/ ./app/

# Non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser

# Default environment values — override via docker run -e or docker-compose
ENV APP_ENV=production \
    PORT=8000 \
    HOST=0.0.0.0 \
    WORKERS=2

EXPOSE 8000

# Run Alembic migrations then start Uvicorn.
# Using a shell form so the environment variables are expanded at runtime.
CMD alembic upgrade head && \
    uvicorn app.main:app \
        --host "${HOST}" \
        --port "${PORT}" \
        --workers "${WORKERS}" \
        --proxy-headers \
        --forwarded-allow-ips='*'
