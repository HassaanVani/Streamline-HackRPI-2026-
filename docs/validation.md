# Validation evidence

## Automated checks

The local backend suite covers analytical zero wind, along-wind and crosswind physics, meteorological direction, invalid edges, vector interpolation, antimeridian and high-latitude geometry, Dijkstra/A* equivalence, baseline inclusion, missing weather, provider quota/schema failures, saved replay, reverse direction, wind-off, queue bounds, deduplication, failed jobs, expired IDs and subprocess termination on deadline.

`fixture-validation.json` records network-free replays of all 12 saved scenarios, their payload and scenario hashes, numerical comparisons, grid sensitivity and measured solve durations. The fine-grid check is an engineering stability check, not a guarantee of meteorological or aircraft-model accuracy.

A live uncached RJTT–KLAX acquisition and solve completed successfully through the API during implementation: approximately 2.61 seconds inside the computation process, 2.744% less modeled time than the great-circle baseline, 0.0042% resolution sensitivity and no boundary warning. This is a single measured run on the developer's machine, not an SLA. Its result is not promoted to a bundled example because the initial live smoke test did not retain the raw response fixture.

Frontend checks include generated OpenAPI types, strict TypeScript compilation, a Vite production build and dependency audit. MapLibre was upgraded to a patched release after the initial dependency audit. The geography is bundled Natural Earth data; no paid map key or remote map-tile request is required.

## Browser checks

Desktop and mobile checks are recorded after the final browser pass. The implementation includes keyboard combobox selection, reduced-motion behavior, static arrows, a keyboard segment inspector, a native modal drawer, non-color route labels, and the text comparison outside the map canvas.

## Deployment and remaining human checks

Vultr deployment is prepared with a multistage Dockerfile, Compose configuration, Caddy and health checks. Public deployment remains pending the owner's Vultr account and promotional credit activation. Docker is not installed on the developer machine; CI performs the container build and HTTP smoke tests.

Five-peer comprehension testing, the in-person judged presentation and Devpost submission require real participants and have not been completed by the implementation agent. Use `docs/demo.md` to conduct and record them. A backup screen recording is also a human handoff unless a recorded artifact is added later.
