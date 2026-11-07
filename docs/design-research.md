# Streamline cloud experience redesign

The first interface presented a muted dashboard. The redesign makes the technical document's public-facing aviation experience the organizing idea: begin with a question, choose a journey, reveal moving air, compare a hypothetical alternative, and inspect the assumptions.

## Sources consulted

- [HackRPI 2026](https://hackrpi.com/): inspected the live page and its rendered typography and imagery. Its Barlow Condensed display typography, large compositions, paper-aircraft motif, cloud layers and numbered editorial labels informed the direction. Streamline's plane and cloud SVGs are original code-drawn illustrations; no HackRPI image assets or logos were copied. The calmer daylight palette follows the supplied technical document rather than reproducing the reference site's dark colors.
- [Flighty](https://flighty.com/): recognizable airport codes, route identity, and prominent understandable flight information informed the aviation vocabulary. Streamline does not claim Flighty's live tracking functionality.
- [Earth Nullschool](https://earth.nullschool.net/about.html): weather as the central subject, explicit atmospheric context, and nearby dataset identity informed the map. Streamline's moving marks illustrate frozen sampled wind vectors; they are not observations, evolving weather or extra meteorological resolution.
- [Nielsen Norman Group's usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/): clear system status, consistent controls, real-world language, recognizable saved journeys, keyboard selection, and recovery from failure.
- [Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/): retain a clear primary journey; move the detailed model and provenance into field notes and segment inspection. Scientific limitations remain visible beside the comparison.
- [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): generous primary actions, separated icon controls and visible keyboard focus. This is design guidance, not a claim of a completed accessibility conformance audit.

## Interaction decisions

1. An illustrated sky opening explains the question before exposing controls. Its primary link lands at the explorer; no registration or setup is required.
2. A horizontal airport composer replaces the sidebar. Airport codes lead, city names remain visible, and a full listbox provides worldwide search. The two curated stories remain recognizable and immediately usable after airport data loads.
3. The map becomes a full-width exploration surface. Pale ocean, paper-colored land, blue reference line and dashed orange alternative use color and shape redundantly. Geographic layers are bundled and require no third-party map key.
4. A boarding-pass comparison repeats the displayed route identity and model conditions. Modeled time leads, distance follows, and the relative fuel index stays explicitly labeled. The alternative is progressively revealed.
5. Showing wind marks and including wind in the physics are separate, clearly named controls. A global motion control stops decorative motion and wind animation; reduced-motion users start paused.
6. Field notes retain source timestamps, the pressure/altitude distinction, illustrative airspeed, grid convergence, exclusions, attribution and a downloadable exact scenario. No unsupported absolute fuel or emissions metric is introduced.

## Verification

Verify desktop and narrow-phone composition, airport keyboard search, both saved journeys, reverse direction, still-air recalculation, wind visibility, pause/resume, segment keyboard navigation, dialog dismissal and source information. Confirm no horizontal overflow, null fuel remains suppressed, and the solver's calculated results survive the presentation change.
