# Independent presentation audit — November 7, 2026

A read-only subagent reviewed the implementation, styles, methodology, demo script, and service readiness. This was an independent code/UI review, not a participant study.

| Finding | Resolution |
| --- | --- |
| The invitation heading dominated 10–12px scientific evidence | Reduced the heading, enlarged the table, improved source/body type, and added desktop Present view with 22px durations and 30px result headings |
| `meaningful=false` conflated uncertainty with equality | Comparison copy now checks `stable` first; inconclusive, equal, small and reportable results are separate; regression tests added |
| Relative fuel index could be mistaken for aircraft-specific fuel science | Added an adjacent definition; Presentation view omits the column; full details remain in Model & data |
| Backend was stopped | Restarted; readiness endpoint verified; uncached Boston–Paris completed with a stable 1.066% modeled advantage (see readiness.json) |
| Three-minute script depended on a potentially 90-second weather calculation | Core script now uses bundled examples; arbitrary journeys are optional Q&A |
| 82-minute direction effect could be confused with optimizer savings | Script explicitly distinguishes direction (about 82 minutes) from the westbound route alternative (about 5 minutes) |
| Theme persistence could crash startup if browser storage was blocked | Read/write now fall back to session behavior |
| README still credited removed remote fonts | Removed stale font reference |

The project is an educational cruise model with real forecast inputs. Do not claim verified operational savings, airline inefficiency, live flights or completed Vultr deployment. Public deployment remains unverified. The readiness verdict is for the tested local demonstration; real participant comprehension and the presenter's rehearsal still matter.

Recheck: the subagent found no additional blocker for the documented 1440px local demo after these fixes. Its missing-backup finding was addressed with `backup.html` and four actual browser captures. The Present control is hidden at widths where the larger layout is unavailable.
