# Streamline

**Why fly this way?** A public aviation explorer built at HackRPI 2026. Pick airports worldwide, reveal a frozen GFS wind field, and compare a shortest-distance path with a hypothetical wind-aware route.

This is an educational cruise model. Neither path is an observed flight or an operational flight plan. It does not establish airline inefficiency or avoidable emissions.

## Run locally

Requires Node 22.16+ and Python 3.13 with [uv](https://docs.astral.sh/uv/).

```sh
cd backend
uv sync --frozen
uv run uvicorn streamline.api:app --reload --host 127.0.0.1 --port 8000
```

In a second terminal:

```sh
cd frontend
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Vite proxies `/api` to port 8000. The 12 saved comparisons (three pairs × two directions × wind on/off) do not need a running API. Worldwide search uses the bundled 48,071-airport snapshot. The bundled Natural Earth map also works without external map tiles or keys; WebGL is required for the map, while the text comparison works without it.

## Deploy on Vultr

The intended cloud deployment is a Vultr instance running Docker Compose: a non-root FastAPI application serves both the built React app and API; Caddy provides compression and optional automatic HTTPS. See [the complete deployment guide](docs/vultr.md).

```sh
cp .env.example .env
# Set SITE_ADDRESS to a domain with an A record at this instance, or leave :80 for an IP demo.
docker compose up -d --build
docker compose logs --tail=100
```

No GPU, Kubernetes cluster, database, paid map API, or flight-data subscription is needed. New scenarios and weather caches are temporary. Saved examples are versioned in the image and repository.

## Interface design

The cloud-led experience follows the technical document’s public demo journey: choose airports, see the wind, compare a hypothetical route, and inspect field notes. The original SVG paper plane and clouds are decorative; the map arrows use the actual saved forecast vectors. A global motion control and reduced-motion defaults allow static exploration. See [design research and rationale](docs/design-research.md).

## What the model does

- Spherical great-circle geometry, including antimeridian crossings and polar corridors.
- Fixed 250 hPa GFS pressure surface; illustrative constant true airspeed of 230 m/s.
- Meteorological **from** direction converted to east/north vectors; bilinear interpolation of components rather than angles.
- Crosswind-corrected ground speed with three-point quadrature along each displayed geodesic edge.
- Directed Dijkstra on a 64 × 33 corridor graph, including the centerline baseline; one wider-corridor retry when necessary.
- A 128 × 65 resolution check; boundary and >1% resolution changes withhold meaningful-improvement claims.
- Relative fuel index = modeled time / baseline modeled time × 100. Absolute fuel and CO₂ remain null.

There are 33 lateral rows so the great-circle baseline lies exactly on the central row. Weather is sampled at only 12 × 12 locations over twice the initial routing width: a finer solver grid adds no meteorological detail. The result is the shortest modeled time **found on this grid**, not a global optimum. Both routes are evaluated with the same field and equation.

The fixed forecast timestamp is in `data/config.json`. We never silently substitute another time when it expires. Rerun acquisition intentionally to publish a new snapshot. Pressure level is not constant geometric altitude. Aircraft-specific performance, airways, airspace, weather hazards, climb/descent, clearances and traffic are excluded.

## Reproducible data

`data/weather/` retains raw provider payloads, request parameters, units, retrieval time and SHA-256 identities. `data/examples/` and `frontend/public/examples/` contain matching computed results. The UI exports the exact scenario JSON, including the shared evaluator's segment metrics.

To refresh the airport snapshot and the demo forecast fixtures (uses the network and provider quota):

```sh
cd backend
uv run python ../scripts/acquire.py --refresh
```

The acquisition script freezes the current UTC hour, requests GFS explicitly, checks units and timestamps, and evaluates three candidate airport pairs. It selects the smaller measured secondary example; no percentage is hardcoded into the interface. Without `--refresh`, the script replays the existing frozen timestamp and rejects mixed timestamps. Do not refresh during a judged demo.

Live worldwide requests sample approximately 144 locations with three batched HTTP requests. Free-provider accounting is location-based, not just request-based. The application admits at most six new jobs per hour and 24 per rolling day per service process; deduplicated and saved responses do not consume that budget. These conservative app limits are not a provider quota guarantee and reset with the process. Run exactly one API worker. Weather cache entries are bounded to 64 and include pair, valid time, model, pressure, width and resolution in their identity.

## API

Interactive documentation: http://127.0.0.1:8000/docs. The tracked schema is [docs/openapi.json](docs/openapi.json).

- `GET /api/v1/airports?q=JFK` — at most 20 ranked matches.
- `GET /api/v1/examples` — saved comparisons and provenance labels.
- `POST /api/v1/scenarios` — `{ "origin_id": "RJTT", "destination_id": "KLAX", "wind_enabled": true }`.
- `GET /api/v1/scenarios/{id}` — complete result or queued/running/failed job.
- `GET /api/v1/scenarios/{id}/winds` — downsampled vectors after completion.
- `GET /api/v1/health` — readiness, model version, fixed forecast time and queue state.

A cache hit returns 200. A new request returns 202 with `scenario_id` and `result_url`. Poll that URL; one worker runs isolated subprocesses, with at most two waiting jobs and a 90-second computation deadline. Expired or restarted jobs return a recoverable 404. Invalid requests return 422 and capacity/budget limits return 429. A job failure has a specific error code (`PROVIDER_LIMIT`, `MISSING_WIND`, `NO_MODEL_PATH`, `SOLVER_TIMEOUT`); the UI retains the previous clearly labeled comparison. No arbitrary URL, file, date, aircraft profile, or weather identifier can be submitted.

## Validation

```sh
cd backend
uv run pytest -q
uv run python ../scripts/export_schema.py
cd ../frontend
npm run types
npm run build
npm audit --omit=dev --audit-level=high
```

CI checks tests, schema synchronization, TypeScript, the production build, dependency advisories, Compose syntax, and a container build with HTTP smoke tests. See [validation evidence](docs/validation.md) and [the three-minute demo script](docs/demo.md). Five-peer comprehension testing must be performed with real people; it is not replaced by automated tests.

## Attribution

- **Open-Meteo / NOAA GFS**: weather data, [CC BY 4.0 and noncommercial API terms](https://open-meteo.com/en/terms). Each scenario includes the requested model, valid time, retrieval time, source URL, payload hash and attribution. A forecast is not an observation or a verified reconstruction.
- **OurAirports**: dated airport data, [public domain](https://ourairports.com/data/). Community data may contain errors; acquisition metadata is in `data/airports-provenance.json`.
- **Natural Earth**: bundled country geometry, [public domain](https://www.naturalearthdata.com/about/terms-of-use/), from the [maintainer's dataset](https://github.com/nvkelso/natural-earth-vector).
- Interface fonts: Barlow Condensed, DM Sans, IBM Plex Mono and Instrument Serif via Google Fonts, with system fallbacks. The app remains usable if fonts fail to load.

Dependency licenses remain with their respective authors. The original technical design is retained alongside the application.
