import type { Scenario } from "./types";
export function comparisonCopy(comparison: Scenario["comparison"]) {
  const {
    stable,
    meaningful,
    time_difference_s: delta,
    percent_difference: percent,
  } = comparison;
  if (!stable)
    return {
      title: "Comparison is inconclusive",
      detail: "The search boundary or grid sensitivity limits this result.",
    };
  if (!meaningful)
    return Math.abs(delta) < 1
      ? {
          title: "Same modeled cruise time",
          detail: "Neither path has a modeled time advantage.",
        }
      : {
          title: "Small modeled difference",
          detail: `${Math.abs(percent).toFixed(1)}% difference; below this model’s reporting threshold.`,
        };
  const unit = Math.abs(delta) < 60 ? "sec" : "min";
  const value = Math.round(Math.abs(delta) / (unit === "sec" ? 1 : 60));
  return {
    title: `About ${value} ${unit} ${delta >= 0 ? "less" : "more"}`,
    detail: `${Math.abs(percent).toFixed(1)}% modeled cruise-time difference`,
  };
}
