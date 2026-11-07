FROM node:22.16.0-alpine AS frontend
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.13.11-slim
COPY --from=ghcr.io/astral-sh/uv:0.10.0 /uv /usr/local/bin/uv
WORKDIR /app
COPY backend/pyproject.toml backend/uv.lock backend/.python-version ./backend/
RUN uv sync --frozen --no-dev --project backend
COPY backend/streamline/ ./backend/streamline/
COPY data/ ./data/
COPY --from=frontend /web/dist/ ./frontend/dist/
RUN useradd --create-home --uid 10001 streamline && mkdir -p /app/.cache && chown -R streamline:streamline /app/.cache
ENV STREAMLINE_STATIC_DIR=/app/frontend/dist PYTHONUNBUFFERED=1
USER streamline
WORKDIR /app/backend
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD ["/app/backend/.venv/bin/python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health',timeout=4)"]
CMD ["/app/backend/.venv/bin/uvicorn", "streamline.api:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
