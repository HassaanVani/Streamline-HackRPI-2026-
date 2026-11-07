# Map workspace and interface audit

The user requested a working map interface in place of the presentation-led page. This audit reviews observable interface patterns and copy; it does not claim that a visual marker can reliably identify AI authorship.

## Removed from the active interface

- The cloud illustration hero, introductory sections, navigation between page sections, closing pitch and promotional footer.
- Paper-airplane branding, sparkle accents, event stamps and ornamental clouds.
- The simulated boarding-pass number, barcode and ticket decoration.
- Repeated curiosity slogans and theatrical field-note headings.
- A reveal step that hid an already-computed comparison.

The old design screenshots and research documents remain historical evidence. They are not shipped as interface elements. The unused illustration component and its styling were deleted.

## Functional replacements

- A single map workspace shows both calculated paths immediately. Route controls, data provenance and comparative measurements are available without scrolling through a landing page.
- Journey playback runs both paths on the same modeled elapsed clock, using their per-segment durations. It supports play, pause, reset, seeking and speed selection. Display interpolation follows the drawn segments, including the antimeridian; this is not a recording or an aircraft-performance simulation.
- Click either path to inspect its wind components and modeled ground speed. The same inspector is available with a keyboard through the Inspect route button, route selector and segment slider.
- Wind vectors and 20 m/s speed contours are derived from the saved 12 × 12 forecast sample grid. Contours interpolate the sampled magnitudes for visualization only and do not affect route metrics or add weather resolution.
- A custom flow-line logo replaces the stock plane glyph. Geographic endpoint dots and playback dots remain because they identify actual model inputs and positions, not decoration.
- Narrow layouts collapse secondary controls under Options. The map, calculation action and current comparison remain on the workspace.

## Design principles applied

Task-first hierarchy; immediate feedback from real actions; clear units; visible displayed-route identity while inputs change; recognition through airport codes and saved comparisons; progressive disclosure for secondary settings; consistent route colors and line styles; keyboard equivalents for map interactions; and explicit separation of model output from observed flights.

These apply the principles researched in [Nielsen Norman Group's heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) and [progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/). No fake usage indicators, fabricated progress percentages or decorative status badges were added.

## Checks

Playback has automated cases for unequal segment durations, a shared clock with different arrival times, longitude wrapping, elapsed-time bounds and malformed timing. Browser QA covers playback advancement, seeking, direct map inspection, keyboard inspection, route calculation, still-air recalculation and narrow layouts. The existing scientific solver remains unchanged.

## ATC-inspired visual treatment

The map workspace now uses a dark radar palette, restrained green geography and vectors, amber for the hypothetical alternative, square endpoint symbols, monospaced readouts and sharper panel edges. A geographic latitude/longitude graticule replaces decorative grid imagery. There is no radar sweep, fabricated callsign, squawk, clearance or live-traffic status. Data values and calculations are unchanged.

### Clouds default and optional ATC theme

The default workspace uses pale sky-blue water, cloud-white land and panels, and teal alternatives. A keyboard-accessible Clouds / ATC switch changes both MapLibre layers and the controls without resetting the selected journey or playback. The preference persists locally. The real latitude/longitude grid remains subtle in both palettes.

Verified both palettes in the browser, preference persistence after reload, and the 390 × 844 layout with no horizontal overflow. Four playback tests and the production build pass. Explicitly bundle the MapLibre worker URL so Vite does not resolve it relative to its dependency cache. Screenshots: `screenshots/clouds-theme-desktop.png` and `screenshots/clouds-theme-phone.png`.

## Research-led wind challenges

See `ux-research.md` for the source synthesis, product decisions and peer-testing script, and `../DESIGN.md` for the maintained design context. Added optional prediction experiments on the same map rather than another header page. Free exploration retains airport search and playback. Challenges reveal measured evidence and an explanation, count unique experiments only after evaluation, and retain a first-attempt notebook locally. Failure does not count, and reset is available.

Browser QA completed all three experiments, correct and wrong predictions, keyboard Space/Enter activation, persisted progress after reload, replay without changing the first-attempt record, reset, and both themes. The 390 × 844 page has a 390px document width. Mobile result panels use a bounded scroll area to preserve space for the map and comparison. Seven frontend tests pass, including real-fixture scoring and invalid-result rejection. No peer-learning or engagement claim has been validated yet.
