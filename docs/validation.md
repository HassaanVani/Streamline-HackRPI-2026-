# Validation evidence

## Automated checks

All 25 local backend tests pass. The suite covers analytical zero wind, along-wind and crosswind physics, meteorological direction, invalid edges, vector interpolation, antimeridian and high-latitude geometry, Dijkstra/A* equivalence, baseline inclusion, missing weather, provider quota/schema failures, saved replay, reverse direction, wind-off, queue bounds, deduplication, failed jobs, expired IDs and subprocess termination on deadline.

`fixture-validation.json` records network-free replays of all 12 saved scenarios, their payload and scenario hashes, numerical comparisons, grid sensitivity and measured solve durations. The fine-grid check is an engineering stability check, not a guarantee of meteorological or aircraft-model accuracy.

A live uncached RJTT–KLAX acquisition and solve completed successfully through the API during implementation: approximately 2.61 seconds inside the computation process, 2.744% less modeled time than the great-circle baseline, 0.0042% resolution sensitivity and no boundary warning. This is a single measured run on the developer's machine, not an SLA. Its result is not promoted to a bundled example because the initial live smoke test did not retain the raw response fixture.

Frontend checks include generated OpenAPI types, strict TypeScript compilation, a Vite production build and dependency audit. MapLibre was upgraded to a patched release after the initial dependency audit. The geography is bundled Natural Earth data; no paid map key or remote map-tile request is required.

## Browser checks

Browser verification passed at 1440 × 1000 and 390 × 844. The 390-pixel page has no horizontal overflow. Verified saved reveal, wind-off recalculation, reverse direction, the methodology dialog, worldwide HND/LAX search using Enter, computed antimeridian rendering, and keyboard segment inspection. With the API deliberately stopped, saved CDG–FRA, its reverse and wind-off variants remained usable. Screenshots are in `docs/screenshots/`. The implementation includes keyboard combobox selection, reduced-motion behavior, static arrows, a keyboard segment inspector, a native modal drawer, non-color route labels, and the text comparison outside the map canvas.

## Deployment and remaining human checks

Vultr deployment is prepared with a multistage Dockerfile, Compose configuration, Caddy and health checks. Public deployment remains pending the owner's Vultr account and promotional credit activation. Docker is not installed on the developer machine. [GitHub Actions run 42397360243](https://github.com/HassaanVani/Streamline-HackRPI-2026-/actions/runs/42397360243) passed the Linux container build and HTTP smoke tests, including health, static HTML and saved example index. Public Vultr runtime checks remain pending account setup.

Five-peer comprehension testing, the in-person judged presentation and Devpost submission require real participants and have not been completed by the implementation agent. Use `docs/demo.md` to conduct and record them. A backup screen recording is also a human handoff unless a recorded artifact is added later.

## Cloud experience redesign

The replacement interface was checked at 1280 × 720 and 390 × 844. The phone layout has no horizontal overflow. Verified the opening-to-explorer link, mobile airport listbox placement and Enter selection, the CDG–FRA saved comparison, still-air recalculation, LHR–JFK reverse comparison (7h 28m baseline / 7h 23m alternative), pause control and static-arrow label, Escape dismissal of field notes, and keyboard segment navigation. The map animation pauses while its surface is offscreen. The scientific evaluator remains unchanged, and all 12 saved fixtures still replay within 1e-6.

Research and the design decisions are recorded in `docs/design-research.md`. New evidence uses the `redesign-` screenshot prefix to distinguish it from the original interface. This is functional and visual QA, not five-peer comprehension testing or an accessibility conformance certification.

## Interactive map workspace

The map-first replacement was verified at 1440 × 900 and 390 × 844, plus the app's narrower desktop pane. At 390 × 844 the document has neither horizontal nor vertical overflow. The promotional page sections and ornamental branding were removed; `docs/ui-audit.md` records the component and copy search.

Verified real playback advancement, shared-clock seeking to 2h 26m, and a pointer click on the wind-aware line that selected segment 27 and displayed its along-route wind, crosswind and modeled ground speed. Four frontend tests cover the playback timing and geometry rules. The existing 25 backend tests also pass.

A Boston–Paris request was submitted through the browser using airport search, not the saved-example selector. It entered the queue, disabled the calculation inputs while working, and returned new geometry marked Computed forecast with approximately 6h 00m baseline time and 5h 57m alternative time (1.1% modeled improvement). Independent rounding of durations and their difference can differ by one minute; the difference is labeled About.

The compact Options panel was used to turn off model winds. JFK–LHR recalculated to 6h 41m on both paths and correctly reported no meaningful difference. This is distinct from hiding the vector and contour layers.

## Chart-desk visual overhaul

Seven frontend tests pass and production compilation succeeds. Browser QA checked airport search with keyboard selection, changed-selection identity, zero-wind recomputation, saved CDG–FRA, seeking, segment inspection, methodology, challenge prediction by Space/Enter, palette switching and the 390 × 844 layout. Computed styles on the challenge panel, results, mode controls and theme switch confirm zero radius, no shadow and no backdrop blur. The phone page has a 390px document width. The map now observes its real chart region when it resizes. Screenshots use the `chart-desk-` prefix. This remains implementation QA; peer comprehension testing is still pending.

## Typography and presentation readiness

Independent read-only subagent audit and recheck are summarized in `presentation/audit.md`. Updated evidence typography and desktop Present mode were checked at 1440 × 900: measured duration text is 22px and result text 30px. Standard layouts were checked at 1024 × 768 and 390 × 844 without horizontal overflow. The chart and comparison now share grid rows: at 1024px, map bottom and result top both measured 498.203125px, keeping chart navigation visible despite wrapped copy.

The complete bundled judging sequence was exercised with keyboard prediction, westbound route inspection, still-air evaluation and methodology. Four actual screenshots and a standalone keyboard-navigable fallback are in `presentation/`; the fallback was opened and its image loading/navigation checked. It is a screenshot fallback, not a recording. Nine frontend and 25 backend tests pass. New tests distinguish unstable, equal, small and subminute results.

The backend was restarted and an uncached KBOS–LFPG job completed as `computed_forecast`, stable, with a 1.0658% modeled difference. Timestamp, scenario identity and payload hash are in `presentation/readiness.json`. Local readiness does not establish public Vultr deployment. The live weather request remains outside the three-minute core script.

## Reduced sensory load

Default wind motion and contours are disabled; drawn arrows are spatially thinned for legibility without changing the input grid or route evaluation. Default playback is closed and the comparison shows time only. Options and More detail were browser-tested to reveal their controls, including playback and contours. Changed airport selections retain an explicit update notice even while the detailed result heading is hidden. Nine frontend tests and the production build pass.

## Atmospheric flow and identity

The isolated wind arrows have been replaced with cached, curved display streamlines. Screen-projected wind components are interpolated only within triangles of the sampled corridor, with midpoint integration for the curves. No vector extrapolation or additional weather resolution is claimed. Animation is illustrative, and reduced-motion/static controls remain available. Two new tests cover constant-component interpolation, coverage boundaries, flow direction and zero wind; all 11 frontend tests and the production build pass.

A new generated transparent soaring S mark replaces the earlier line glyph in both the header and favicon. The tab title is simply Streamline. The generated source is copied to `frontend/public/streamline-mark.png`, not referenced from a private generation directory.
