import type { Scenario } from "./types";
export type ChallengeId = "reverse" | "calm" | "short";
export const challenges = [
  {
    id: "reverse",
    title: "Turn the Atlantic around",
    route: "JFK ⇄ LHR",
    question: "Same ocean. Same airspeed. Which direction takes less time?",
    detail:
      "Compare shortest-distance cruise times in the same frozen forecast. “Similar” means within one minute.",
    choices: ["New York → London", "London → New York", "Similar times"],
    origin: "EGLL",
    destination: "KJFK",
    wind: true,
  },
  {
    id: "calm",
    title: "Take the wind away",
    route: "JFK → LHR · zero wind",
    question: "With no wind, which of the two calculated paths wins?",
    detail:
      "Re-evaluate both paths in still air. “Similar” means within one minute.",
    choices: ["Shortest distance", "Wind-aware alternative", "Similar times"],
    origin: "KJFK",
    destination: "EGLL",
    wind: false,
  },
  {
    id: "short",
    title: "Does a detour pay off?",
    route: "CDG → FRA",
    question:
      "How much cruise time can the wind-aware path save on this short trip?",
    detail:
      "Predict the modeled improvement over the shortest-distance path, not a real flight.",
    choices: ["Under 1%", "1–5%", "Over 5%"],
    origin: "LFPG",
    destination: "EDDF",
    wind: true,
  },
] as const;
export type ChallengeResult = {
  answer: number;
  evidence: string;
  lesson: string;
  scenarioId: string;
};
function duration(seconds: number) {
  const m = Math.round(seconds / 60);
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}
export function evaluateChallenge(
  id: ChallengeId,
  result: Scenario,
  reference?: Scenario,
): ChallengeResult {
  const task = challenges.find((c) => c.id === id)!;
  if (
    result.origin.id !== task.origin ||
    result.destination.id !== task.destination ||
    result.wind_enabled !== task.wind
  )
    throw new Error("The result does not match this experiment. Try it again.");
  if (
    [...result.warnings, ...(reference?.warnings || [])].some((w) =>
      ["DOMAIN_BOUNDARY", "RESOLUTION_SENSITIVE"].includes(w),
    )
  )
    throw new Error(
      "This result is too sensitive to the search region or grid to score. Explore it without scoring.",
    );
  let answer: number, evidence: string, lesson: string;
  if (id === "reverse") {
    if (
      !reference ||
      reference.origin.id !== "KJFK" ||
      reference.destination.id !== "EGLL" ||
      !reference.wind_enabled ||
      reference.provenance.valid_time !== result.provenance.valid_time
    )
      throw new Error(
        "Matching eastbound and westbound forecasts are required. Try again.",
      );
    const east = reference.metrics.great_circle.modeled_duration_s,
      west = result.metrics.great_circle.modeled_duration_s;
    answer = Math.abs(east - west) <= 60 ? 2 : east < west ? 0 : 1;
    evidence = `New York → London: ${duration(east)}. London → New York: ${duration(west)}. ${Math.round(Math.abs(east - west) / 60)} minute difference in this snapshot.`;
    lesson =
      "Reversing the journey reverses the wind component along the path. The same wind can help one direction and slow the other. This result belongs to this forecast, not every crossing.";
  } else if (id === "calm") {
    const baseline = result.metrics.great_circle.modeled_duration_s,
      alternative = result.metrics.wind_optimized.modeled_duration_s;
    answer =
      Math.abs(baseline - alternative) <= 60
        ? 2
        : baseline < alternative
          ? 0
          : 1;
    evidence = `Shortest distance: ${duration(baseline)}. Alternative: ${duration(alternative)}. Wind is zero for both evaluations.`;
    lesson =
      "At a fixed airspeed with zero wind, extra distance adds time. The solver can use the shortest-distance path itself, so it does not need to invent a detour.";
  } else {
    const base = result.metrics.great_circle.modeled_duration_s,
      alt = result.metrics.wind_optimized.modeled_duration_s;
    const percent = ((base - alt) / base) * 100;
    answer = percent < 1 ? 0 : percent <= 5 ? 1 : 2;
    evidence = `${Math.max(0, percent).toFixed(1)}% modeled improvement. Shortest distance: ${duration(base)}; alternative: ${duration(alt)}.`;
    lesson =
      "A wind-aware search does not guarantee a useful detour. On a short journey, the extra distance may outweigh the wind benefit. Small differences also need a resolution check.";
  }
  return { answer, evidence, lesson, scenarioId: result.scenario_id };
}
