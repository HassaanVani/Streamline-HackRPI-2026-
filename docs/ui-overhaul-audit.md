# Major visual overhaul: audit, evidence and removals

November 7, 2026. This supersedes the rounded floating-panel treatment. The source research in `ux-research.md` remains useful; its earlier layout descriptions are historical.

## What the audit can and cannot establish

The user explicitly identified the previous appearance as generic and AI-looking. That is valid product feedback. A border radius, typeface or color is not evidence of authorship. The list below describes patterns in **our interface** that contributed to that perception, and the concrete decisions taken to remove them. It is not an AI detector or an instruction to make every other product look the same.

## Research and its implications

- **Design homogenization:** Shin et al. analyze risks in the vibe-coding lifecycle and propose productive friction. We applied deliberate rejection of the default card-based dashboard and wrote constraints that future revisions can be checked against. This is a framework, not a measured diagnosis of Streamline. [Microsoft Research publication](https://www.microsoft.com/en-us/research/publication/interrogating-design-homogenization-in-web-vibe-coding/)
- **Hierarchy:** NN/g describes using contrast, scale and grouping to guide attention. We now distinguish a stationary control rail, a large chart, and a ruled results table. A clear large heading and large airport codes replace many similarly sized small headings. [Visual hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)
- **Clickability matters even in a flat design:** NN/g's eye-tracking experiment found greater user effort with weak signifiers. Removing shadows is therefore accompanied by explicit button fills, borders, underlined links, native form controls and visible focus. “Flat” must not mean “everything looks like text.” The source's study is not a usability test of this app. [Experiment and limitations](https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/)
- **Disciplined typography:** GOV.UK maintains a small, tested type scale and responsive adjustments. We borrow the discipline of a defined hierarchy and consistent rhythm, not the government brand or restricted Transport font. Streamline uses a system sans-serif with monospace reserved for data. [Type scale](https://design-system.service.gov.uk/styles/type-scale/)
- **Action language:** GOV.UK recommends sentence-case button labels that describe an action. Calculate route, Test my prediction, Reverse, and Reset each correspond to actual behavior. [Buttons](https://design-system.service.gov.uk/components/button/)
- **Accessible interaction:** W3C explains minimum target size and spacing, with a larger enhanced threshold. Prediction rows and primary actions are large, controls retain keyboard behavior, and mobile no longer compresses every panel into one viewport. No full accessibility-conformance claim is made. [Target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)

## Suspect-pattern inventory and disposition

| Pattern found in the previous UI | Why it was a problem here | Systematic removal or replacement |
| --- | --- | --- |
| Rounded outer cards and rounded controls throughout | Repeated the same dashboard motif regardless of purpose | Removed decorative border radii; retained actual geographic point circles and native radio semantics |
| Frosted/translucent panels and backdrop blur | Reduced separation between chart and controls; resembled interchangeable glass cards | Opaque surfaces, ordinary borders; no backdrop-filter declarations |
| Repeated drop shadows and a map vignette | Added simulated depth without a useful layer hierarchy | Removed box shadows and vignette; use real spatial boundaries |
| Many detached floating panels | Every region competed for attention and covered the map | Fixed full-height rail; chart in its own region; comparison table attached to the bottom edge; playback attached to the top edge |
| Rounded mode pills | Looked like interchangeable dashboard filters | Plain mode tabs with an underline and pressed state |
| Theme capsule with nested pills | Added another decorative container | Text choices with an active underline; same persisted setting |
| Airport input inside a card inside a card | Nested containers distracted from the input | Open typographic fields separated by rules; focus still visibly identifies input |
| Equal-weight pale-blue surfaces | Weak focus and low visual differentiation | Warm-white controls, sky-blue water, cream land, dark text; saturated blue reserved for actions |
| Broad use of a fashionable web font | Shared a visual cadence with many template apps | Removed remote font import; system sans-serif for controls and headings; system monospace for measurements |
| Lots of 8–10px mobile copy | Technically fitted, but made reading secondary to fitting | Vertical mobile layout; map first, then controls and table; most body copy 12–14px or larger |
| Repeated teaser phrases | Added a generic narrative layer over a functioning tool | Direct task headings, named experiments and actual route identity |
| A large unanswered chart with no identifying title | Could be mistaken for wallpaper | Persistent airport pair, forecast UTC time and pressure level on the chart |
| Multiple CSS themes copied wholesale | Thousands of duplicated declarations encouraged patching instead of design | Replaced the stylesheet with one component system and a small set of semantic theme variables |
| Decoration implying live aviation operations | Would misstate the model | No radar sweeps, live badges, callsigns, fabricated flight IDs or clearances |
| Rewards unrelated to domain work | Would gamify clicks rather than understanding | Kept only prediction experiments, measured explanations and unique local completion |

## Retained on purpose

A circular endpoint means a location; a native radio circle means a choice. These are useful symbols, not rounded containers. MapLibre's attribution control remains recognizable and accessible. The flow-line logo is custom vector work already associated with the app. The source pressure, illustrative airspeed and operational limitations remain explicit. Line color, dash pattern and text all identify the alternative, so the design does not depend on hue alone.

The map geometry is now sized to its own chart region. Its fitter no longer reserves a phantom sidebar inside the canvas. A ResizeObserver updates the map when the chart's real region changes, including after a challenge reveals a comparison. Routes and per-segment physics have not been changed.

## Professional and fun

Professional means clear input boundaries, consistent alignment, meaningful table rules, legible units, honest feedback and complete states. Fun comes from choosing a place, watching the wind and challenging an intuition. The new cobalt action color, large airport typography and lighter chart make those actions more inviting; there is no need to simulate an airline ticket or add points for opening the page.

## Verification and remaining work

The implementation is checked with the existing scientific and playback contracts, production compilation, real-fixture challenge scoring and browser interaction. Screenshots record the actual UI. Browser checks cover airport search and saved journeys, playback, wind-off, inspection, challenges, both palettes and responsive layout. Structural assertions inspect the rendered UI for removed effects and horizontal overflow.

This is still an expert review and implementation, not human validation. The five-peer task script in `ux-research.md` remains the next usability test. A visibly different screenshot is evidence of a changed design, not evidence that learning or engagement improved.
