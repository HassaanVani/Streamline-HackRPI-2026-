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
