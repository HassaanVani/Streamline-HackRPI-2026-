# Streamline: research into distinctive interfaces and useful gamification

Research and implementation notes, November 7, 2026. This is a desk-research synthesis and a review of the working interface. It is not a study of Streamline users. The user feedback in this chat is direct evidence of dissatisfaction with the earlier presentation-led interface and its later dark palette. The proposed learning benefits below remain hypotheses until tested with visitors.

## The product decision

Keep the working map as the main surface. Give a visitor two paths into it: **Free explore** for their own airports, and **Wind challenges** for a short sequence of prediction experiments. Preserve the default sky palette and optional ATC palette. Progress should reflect experiments actually evaluated, with explanations grounded in saved forecast results.

A visitor at a hackathon has limited time and may know little about aviation. That is an assumed context of use, not a researched persona. The immediate design question is whether they can do something, understand what changed, and explain the wind's role within a few minutes.

## What “less vibecoded” should mean

Removing rounded corners, gradients, or a particular font cannot establish authorship or quality. The useful target is an interface whose structure, words, and behavior follow this product's needs rather than a general website template.

Shin et al., *Interrogating Design Homogenization in Web Vibe Coding* (March 2026), analyze homogenization risks and propose productive friction as a mitigation. This is a risk analysis and framework, not evidence that a CSS pattern reliably identifies AI work. Our application: stop accepting the first attractive screen and require a reason for each major interaction. A wind explorer needs routes, weather evidence, and comparison; a marketing hero does not perform that task. [Research publication](https://www.microsoft.com/en-us/research/publication/interrogating-design-homogenization-in-web-vibe-coding/)

NN/g's *UX-Context Design* argues that product-specific context helps steer generated work away from generic results. Its proposed UX.md is explicitly a hypothesis, not an established standard. Our application: put the audience assumptions, terms, constraints, and acceptance tasks in the repository, so future changes preserve the same product intent. [Article](https://www.nngroup.com/articles/ux-context-design/)

## Principles translated into interface decisions

| Principle | Streamline problem | Decision | How to check it |
| --- | --- | --- | --- |
| Visual hierarchy | Every floating panel looks equally important | One mode selector and one task panel; challenge mode hides playback and comparison until the experiment produces a result | Ask a new visitor what to do next without coaching |
| Recognition | Airport codes and wind jargon demand prior knowledge | Keep city names with codes; give challenges named journeys and concrete answer choices | Ask a visitor to find New York–London |
| Feedback | A map can look like an illustration | Prediction → test → measured result → explanation; focus moves to the result | Run an experiment with keyboard only |
| User control | A tutorial can block exploration | Challenges are optional; any experiment can be selected; free exploration remains available | Leave midway and calculate a personal journey |
| Progressive disclosure | Too many controls compete at once | Flight playback remains in free exploration; forecast detail and methodology stay available separately | Check map visibility at narrow widths |
| Honest states | Decorative progress resembles functionality | Count only experiments with a successfully evaluated result; preserve progress on failure | Fail a load and retry |
| Redundant encoding | Colors alone cannot identify paths | Keep line styles and text labels across themes | Inspect both themes without relying on hue |

The hierarchy and grouping choices apply NN/g's guidance on scale, contrast, balance, and proximity. Their heuristics also support visible status, plain language, recognition, and user control. These are general evaluation lenses, not proof that this implementation is usable. [Visual principles](https://www.nngroup.com/articles/principles-visual-design/) · [Usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)

Progressive disclosure means prioritizing common tasks while keeping advanced actions findable. Here it justifies separate exploration and challenge tools on the same map, rather than another set of header pages. Do not hide the main calculation behind a tutorial or require a game score to access it. [Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/)

## Gamification: learn something, then earn progress

Self-determination theory identifies autonomy, competence, and relatedness as important motivational needs. It does not establish that adding points improves this product. Our design interpretation emphasizes choice of experiment and explanatory feedback; no social need is claimed to be satisfied by this single-user experience. [Theory overview](https://selfdeterminationtheory.org/the-theory/)

The mechanics implemented are deliberately tied to the model:

1. **Turn the Atlantic around.** Predict the faster direction. Evaluate the JFK–LHR and LHR–JFK shortest-distance cruise times under the same forecast timestamp. Show both times and their difference. Explain how reversing direction changes the along-route wind component.
2. **Take the wind away.** Predict which calculated path wins with zero wind. Load the saved still-air counterfactual and show both durations. Explain why extra distance does not create a benefit at fixed airspeed without wind.
3. **Does a detour pay off?** Predict the improvement band on CDG–FRA. Derive the answer from the displayed route durations. Explain that a wind-aware solver can reasonably choose a path with little or no advantage.

Answers come from the result payloads, not a hardcoded answer key. The first two experiments define similar times as within one minute. The third uses under 1%, 1–5%, and over 5% bands. These are game categories, not scientific significance thresholds. A boundary-limited or resolution-sensitive result cannot be scored. Reversed forecasts must share a valid time.

A wrong prediction still completes an experiment: the useful action is testing a hypothesis. The notebook separately reports how many first predictions matched. Replaying cannot improve that first-attempt count. Progress is local, optional, and resettable. It represents three experiments explored, not pilot skill, emissions saved, or operational competence. Loading an example never earns progress until it has passed the scoring checks.

No leaderboard, daily streak, fictional currency, countdown, confetti, or reward for merely opening the page is needed for this learning loop. That is a product judgment, not a universal claim that those mechanics are bad. A future route-drawing game could be worthwhile, but only if the user's exact path is evaluated by the shared physics engine; dragging a decorative curve would misrepresent the project's core.

## References as design material

HackRPI's site establishes the *In The Clouds* event theme. We borrow atmospheric color and an inviting tone, while preserving Streamline's map workspace instead of copying an event landing page. [HackRPI](https://www.hackrpi.com/)

Earth Nullschool is a strong domain reference: it presents atmospheric information as the subject and publishes its forecast sources and pressure-level context. For Streamline, that suggests visible wind evidence and explicit provenance. It does not justify implying global, continuously updated weather coverage: Streamline uses a frozen, bounded corridor snapshot. [Earth Nullschool methodology](https://earth.nullschool.net/about.html)

W3C's target-size guidance gives a 24 × 24 CSS pixel minimum with exceptions and encourages larger important controls. New prediction options and the test button use at least 44px height; the experiment chooser is keyboard accessible. Visible focus and text feedback accompany color. This is a targeted check, not a claim of full WCAG conformance. [W3C guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)

## Evaluation and remaining uncertainty

Automated checks cover scoring against real fixtures, a changed dataset producing a changed answer, zero wind, wrong journeys, mismatched timestamps, and unreliable-grid rejection. Existing playback tests remain in place. Browser checks exercise the prediction/reveal loop, wrong-answer feedback, mode switching, both palettes, persistence, reset, and phone layout. The research does not establish improved engagement, learning, or judging outcomes.

Before submission, ask five peers individually to: find the wind-aware path; predict a direction and run the test; explain the reversal in their own words; switch to their own journey; and name one excluded real-world constraint. Record completion, hesitation, and whether they need coaching. Do not count a correct multiple-choice guess as comprehension. Target at least four of five completing each core task unaided; treat that as a practical release goal, not statistical evidence. If the challenge panel obscures the map or visitors confuse modeled playback with real traffic, fix those failures before adding more game mechanics.
