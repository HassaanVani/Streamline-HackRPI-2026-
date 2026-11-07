# Streamline

**Tagline:** Predict a flight. Read the wind. Understand the sky.

## Inspiration

A journey across the same ocean can take different amounts of time in opposite directions. We wanted to turn that familiar travel observation into something people could test and understand: an atmospheric flight lab that makes upper-atmosphere winds visible and connects them to the paths on a map.

## What it does

Streamline lets visitors choose airports worldwide and compare a shortest-distance path with a hypothetical wind-aware alternative. Curved wind flow makes the sampled atmosphere visible; a segment inspector connects wind components to modeled ground speed. Optional prediction experiments ask visitors to reverse a journey, remove wind, and test whether a detour helps on a short route.

In the bundled Atlantic snapshot, shortest-distance cruise is approximately 6h 06m eastbound and 7h 28m westbound: about 82 minutes between directions. In the westbound direction alone, the alternative is approximately five minutes quicker than its own shortest-distance baseline. These answer different questions. Both are simplified model results, not observed flights.

## How we built it

React and TypeScript provide the map workspace, accessible airport search and local replay. MapLibre renders bundled geography; a canvas layer interpolates display-only wind streamlines inside the sampled corridor. FastAPI runs bounded asynchronous jobs. Real NOAA GFS pressure-level winds come through Open-Meteo. A shared spherical, crosswind-corrected evaluator scores both paths, while directed Dijkstra searches the routing graph. Baseline inclusion, exact geometry rescoring, boundary checks and a finer-grid comparison keep the comparison accountable. Weather queries, timestamps and payload hashes support reproducibility.

## Challenges

The difficult parts included longitude wrapping, polar geometry, directed travel costs, keeping weather resolution separate from routing resolution, provider quotas, and explaining a hypothetical result without implying airline inefficiency. We also revised the interface to reduce simultaneous controls while keeping the evidence accessible.

## Accomplishments

A functioning frontend/backend explorer with real forecast inputs, worldwide airport search, wind-off and reverse evaluations, saved offline examples, scientific tests, explicit inconclusive states, and an optional prediction-based learning loop.

## What we learned

Complete this paragraph in the builder's own words before submitting. Describe one physics, geometry, data-provider or UI lesson you can explain under questioning. Do not substitute generated claims for personal experience.

## What's next

Test comprehension with people without aviation expertise and address observed failures. Extend the physics only with defensible aircraft performance data and operational constraints. Participant testing was unavailable during preparation; no measured learning improvement is claimed.

## Built with

Python, FastAPI, NumPy, React, TypeScript, Vite, MapLibre GL JS, Open-Meteo/NOAA GFS, OurAirports, Natural Earth, Docker, Caddy.

**Vultr:** add to Built with and select Best Use of Vultr only after the actual public deployment is verified. Deployment status is currently pending.

## Suggested tracks

- Best In The Clouds: direct fit through atmospheric winds and aviation exploration.
- Machine Learning / Data Science: consider the published data-analysis/visualization description; the route solver is deterministic and is not machine learning.
- Best Use of Vultr: only after verified use. Do not enter AI or sustainability claims on the strength of coding assistance or an unvalidated fuel estimate.

## Limitations and attribution

One frozen forecast, 250 hPa, illustrative 230m/s true airspeed, cruise-only geometry, and no operational feasibility assessment. Excludes airways, traffic, climb/descent, storms, aircraft-specific performance, contrails and non-CO2 effects. Relative fuel index assumes constant fuel flow; no absolute fuel or CO2 savings are claimed. Winds: Open-Meteo/NOAA GFS with source attribution and terms. Airports and geography: OurAirports and Natural Earth, public domain. AI coding assistance and a generated brand asset were used; the shipped routing solver and explanations are deterministic.

## Links and media to verify before publication

- Repository: https://github.com/HassaanVani/Streamline-HackRPI-2026-
- Public demo URL: Pending verified deployment
- Video: Pending recording
- Screenshots: use current images in docs/screenshots; preview each upload.
- Peer-test evidence: Pending actual participants

Do not publish placeholder values or claim pending work as completed.
