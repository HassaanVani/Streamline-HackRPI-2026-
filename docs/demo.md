# Three-minute judging demonstration

Use the tested local app at http://127.0.0.1:5173/. Open **Options**, then click **Present** on a desktop screen to enlarge evidence. This changes only the view, never the model. Keep the light theme unless the room makes the dark palette easier to read. Use browser zoom 100% and a 1440px-wide or larger window for the presentation layout.

## Set up before approaching a judge

- Start frontend and backend with the README commands. Confirm `/api/v1/health` reports `ready: true`. Public Vultr hosting has not been verified; do not claim deployment there.
- Open JFK → LHR, winds enabled. Reset playback. Open Challenges and reset experiment progress, then return to Explore. Load the app and both saved Atlantic directions before presenting.
- Confirm geography, wind vectors and both lines are visible. If WebGL fails, use the saved screenshot fallback in `docs/presentation/backup.html`.
- Rehearse once aloud with a timer. The core demo uses bundled results and needs no weather request. A new worldwide route is optional Q&A, after checking connectivity and provider capacity.

## Script and actions

**0:00–0:20 — The question.**

“Why can crossing the same ocean take different amounts of time? Streamline makes upper-atmosphere winds visible and lets you test how they affect hypothetical cruise paths.”

Point to the actual forecast timestamp and pressure surface. “This is a saved GFS forecast, not live aircraft traffic.”

**0:20–1:05 — Ask for a prediction.**

Use **Predict the Atlantic crossing →** below the journey controls to open the reversal experiment. Ask: “New York to London, or London to New York—which direction do you think is quicker?” Select the judge's answer and test it.

“In this snapshot, the shortest-distance path takes about **6h 06m eastbound** and **7h 28m westbound**. That's an approximately **82-minute directional difference**. Reversing the journey reverses the wind component along it.”

Do not call this an 82-minute optimization saving. It compares directions, not alternative routes.

**1:05–1:45 — Show the computation.**

Return to **Explore**. The current journey is LHR → JFK. Point to the solid reference and dashed wind-aware alternative.

“Now compare two paths in the **same direction**. The shortest-distance baseline is about **7h 28m**, and the wind-aware path is about **7h 23m**. Here, the extra distance trades against wind for about **five minutes** of modeled improvement.”

Open **More detail → Inspect route**, then move the segment slider about one-third of the way along, to show along-route wind and ground speed. “A shared crosswind-corrected evaluator scores every displayed segment. Directed Dijkstra searches a corridor graph, and a finer grid checks stability.” Close the inspector. Skip playback unless ahead of time; it is available for questions.

**1:45–2:15 — Remove the cause.**

Open **Options** and turn **Include winds in calculation** off. Both paths show approximately **6h 41m**.

“In still air at constant airspeed, distance governs time. The solver can select the shortest-distance path itself. This is a counterfactual, not another weather forecast.”

Do not confuse removing wind from calculation with hiding wind arrows.

**2:15–2:45 — Show the evidence and limits.**

Open **Model & data**. Point to forecast time, 250 hPa, illustrative 230m/s airspeed, finer-grid check, and excluded constraints.

“The weather inputs are real; the aircraft is deliberately simplified. We don't assess airways, traffic, storms or aircraft-specific performance. We report the shortest modeled time found on the grid, not an operational flight plan or a guaranteed global optimum.”

**2:45–3:00 — Finish.**

“The result is an interactive way to understand the atmosphere: make a prediction, test it, and inspect the evidence. The point is to make winds understandable—not to pretend this replaces airline dispatch.”

Stop. Let the judge ask the next question.

## Questions worth preparing for

**What is technically difficult?** Worldwide spherical geometry including the antimeridian; east/north interpolation; crosswind correction; directed graph costs; inclusion and rescoring of the baseline; boundary and resolution checks; reproducible weather provenance; bounded asynchronous work and saved browser replay.

**Is this AI?** The route solver is deterministic graph search and physics. The interface does not use a generative model to invent routes or explanations.

**Is the fuel number real?** It is a relative time-proportional index under constant fuel flow, baseline 100. It is not an aircraft-specific fuel or CO₂ estimate. The presentation hides that secondary column to keep the core comparison clear.

**Why is the improvement small?** Wind benefit has to pay for added distance. A small or zero result is valid. We do not inflate a result to make the story look stronger.

**Could airlines use it?** This is an educational model. Real dispatch requires the operational constraints and aircraft profiles it excludes.

**What happens offline?** Bundled airport data, geography and saved scenarios remain usable without the API. New routes need the backend and weather access.

**Where is the cloud part?** Explain upper-atmosphere wind visualization and the API/worker architecture. Claim Vultr use only after an actual deployment is verified. Prepared Docker/Caddy files are not deployment evidence.

## Submission and human handoff

Use the event's confirmed requirements for deadlines and judging. Complete Devpost, rehearse with a real timer, record a backup walkthrough, and run the five-peer comprehension script from `ux-research.md`. These human tasks are not marked complete by automated checks. Screenshot fallback is available; it is not a video recording.
