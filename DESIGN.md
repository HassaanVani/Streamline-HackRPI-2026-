# Streamline design context

Read `docs/ui-overhaul-audit.md` (current visual decisions), `docs/ux-research.md` (research and test tasks), and `docs/ui-audit.md` (history) before changing the interface.

Audience assumption: a curious visitor or hackathon judge with little aviation knowledge. The task is to explore how forecast winds affect hypothetical cruise routes and explain the result. Peer testing remains necessary.

## Current visual system

A chart desk, not a floating-card dashboard. Desktop has a fixed 340px control rail, its own map region, a table attached below the map and a playback control attached to its upper edge. Below 850px, the map comes first and the remaining tools flow vertically. Do not shrink text to fit every tool into a phone viewport.

- No decorative rounded containers, capsules, panel shadows, glass blur, vignette, or gradients. Geographic points and native selection controls retain their useful shapes.
- System sans-serif, no remote font dependency. Use monospace only for data, time, codes and source labels. Hierarchy comes from scale, weight, alignment and spacing.
- Warm-white controls, sky-blue water, cream land, navy text. Cobalt denotes primary actions; teal denotes the wind-aware path. ATC changes semantic colors only, not the structure or font system.
- Solid reference path, dashed alternative, persistent text labels. Keep the actual airport pair, frozen forecast time and pressure on the chart.
- Primary controls are filled or explicitly bordered. Secondary actions are underlined. Preserve focus and keyboard behavior; flat styling must not hide clickability.
- Use rules and spacing to group controls. Do not wrap an input inside another visual card.

## Interaction and truthfulness

Explore accepts worldwide airports. Challenges are optional predictions checked against actual saved results. Reward unique experiments evaluated, not clicks or time on page; replay does not change first-attempt credit. No fictional real-world performance, currencies or pilot ranks.

Keep clear identities for pending, failed, saved, computed, changed selection and zero-wind states. Never substitute a saved example for a failed requested journey. Keep 250 hPa, frozen GFS, 230m/s illustrative airspeed and operational feasibility not assessed explicit. No live-aircraft or generative-AI claims.

Do not restore a marketing hero, feature-card grid, fake operations status, simulated ticket, teaser slogans or decorative animation. Do not claim user validation without testing people.

## Presentation typography

Scientific evidence must compete successfully with the invitation heading. Normal durations use 16px monospace; desktop Present mode uses 22px durations, 30px result headings and 14px qualifications, and omits the secondary fuel index. The Present control is only offered above 1200px; the rehearsed setup is 1440px wide. Desktop chart and results share grid rows so wrapped text cannot cover chart controls.

Never equate an unstable result with equality. Keep inconclusive, equal, small and reportable results distinct. The 82-minute Atlantic direction comparison and the roughly five-minute westbound route improvement answer different questions. See `docs/demo.md` for the judging narrative.
