# Three minute judging demo

## 0:00 to 0:25

“Everyone has watched a flight cross a map. But the air around that flight is moving too. Streamline makes that invisible part of the journey visible.”

Open the saved JFK–LHR example. Point out the airport pair, actual wind valid time and 250 hPa label. Explain that the reference is a modeled shortest-distance path, not an observed flight.

## 0:25 to 1:00

Point to the arrows. “These arrows show the direction the air is moving. The aircraft's speed through air is different from its speed over the ground.” Hide and restore the arrow layer. This is a visual toggle; the separate Model winds switch changes the physics.

Toggle Model winds off and on. Compare the displayed cruise time. Use the computed result; never announce a fixed percentage from memory.

## 1:00 to 1:45

Reveal the wind-based alternative. “We search a directed graph, account for crosswind, and evaluate both paths under the same assumptions.” Show the time, distance and relative fuel index. The frozen JFK–LHR field gives only a small improvement; that is an honest result, not a failed demo.

Reverse the journey. The same geographic wind field is evaluated in the opposite direction. Explain the changed ground speed rather than implying airlines missed an obvious saving.

## 1:45 to 2:15

Open the saved CDG–FRA example. “Sometimes the shortest path holds up.” If time permits, select a worldwide airport pair and run the cloud computation. Keep the saved examples as the reliable demo path.

## 2:15 to 3:00

Open Assumptions & sources. Show the data timestamp, airspeed assumption, grid check and exclusions. “This isn't flight planning. Airlines account for airspace, traffic, performance and weather hazards that this educational model does not know.”

Download the scenario manifest. Explain that the weather payload hashes and versioned inputs make the comparison reproducible. Describe Vultr hosting only after the public deployment is verified; before that, say the deployment package targets Vultr.

Close: “Our contribution is letting anyone inspect the forces behind a flight and understand what a simplified what-if can—and cannot—tell them.”

## Submission preparation

Target Best In The Clouds and, after a verified Vultr deployment, opt into Best Use of Vultr. Submit by November 8, 2026 at 9 AM Eastern, refine before the 11 AM stop, and present to at least six judges. Record a backup screen capture of this flow, retain screenshots, and verify the published event instructions before submission. Devpost submission and the live presentation remain human deliverables.

## Five-peer comprehension check

Ask five people to explore briefly without coaching. Record each person's answer to: Which path is hypothetical? What does the wind switch do? Name one real-world constraint the model excludes. Note confusion and fix labels before adding features. Record real results in the validation report; do not invent peer responses.
