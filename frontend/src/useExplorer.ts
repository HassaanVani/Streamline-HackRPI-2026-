import { useEffect, useRef, useState } from "react";
import type { Airport, Example, Job, Scenario } from "./types";
const API =
  (import.meta as unknown as { env: Record<string, string> }).env
    .VITE_API_BASE_URL || "";
async function getJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const r = await fetch(url, { signal });
  if (!r.ok) {
    let message =
      "The service is unavailable. Saved examples are still available.";
    try {
      message = (await r.json()).error.message;
    } catch {
      /* non-JSON host response */
    }
    throw new Error(message);
  }
  return r.json();
}

export default function useExplorer() {
  const [airports, setAirports] = useState<Airport[]>([]),
    [examples, setExamples] = useState<Example[]>([]);
  const [scenario, setScenario] = useState<Scenario | null>(null),
    [origin, setOrigin] = useState<Airport | null>(null),
    [destination, setDestination] = useState<Airport | null>(null);
  const [windEnabled, setWindEnabled] = useState(true),
    [showWinds, setShowWinds] = useState(true),
    [showAlternative, setShowAlternative] = useState(false);
  const [loading, setLoading] = useState("Opening saved journey"),
    [error, setError] = useState(""),
    [methodology, setMethodology] = useState(false),
    [segment, setSegment] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const [airportError, setAirportError] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    getJSON<Airport[]>("/airports.json", abort.signal)
      .then(setAirports)
      .catch((e) => {
        if (e.name !== "AbortError") setAirportError(true);
      });
    getJSON<Example[]>("/examples.json", abort.signal)
      .then(async (list) => {
        setExamples(list);
        const example = list.find(
          (e) =>
            e.origin_id === "KJFK" &&
            e.destination_id === "EGLL" &&
            e.wind_enabled,
        )!;
        const result = await getJSON<Scenario>(
          `/examples/${example.scenario_id}.json`,
          abort.signal,
        );
        setScenario(result);
        setOrigin(result.origin);
        setDestination(result.destination);
        setLoading("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError("Could not open the saved journey. Reload to try again.");
          setLoading("");
        }
      });
    return () => {
      abort.abort();
      controller.current?.abort();
    };
  }, []);
  function apply(result: Scenario, reveal: boolean) {
    setScenario(result);
    setOrigin(result.origin);
    setDestination(result.destination);
    setWindEnabled(result.wind_enabled);
    setShowAlternative(reveal);
    setSegment(0);
  }
  async function compare(
    a = origin,
    b = destination,
    wind = windEnabled,
    reveal = true,
  ) {
    if (!a || !b) return;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setError("");
    setLoading("Opening saved comparison");
    try {
      const saved = examples.find(
        (e) =>
          e.origin_id === a.id &&
          e.destination_id === b.id &&
          e.wind_enabled === wind,
      );
      if (saved) {
        apply(
          await getJSON<Scenario>(
            `/examples/${saved.scenario_id}.json`,
            abort.signal,
          ),
          reveal,
        );
        return;
      }
      setLoading("Reading the atmosphere and finding a path");
      const response = await fetch(`${API}/api/v1/scenarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin_id: a.id,
          destination_id: b.id,
          wind_enabled: wind,
        }),
        signal: abort.signal,
      });
      if (!response.headers.get("content-type")?.includes("application/json"))
        throw new Error(
          "The cloud service is starting or unavailable. Try again shortly, or open a saved journey.",
        );
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.error?.message || "The comparison service is unavailable.",
        );
      let result: Scenario | Job = payload;
      const deadline = Date.now() + 160_000;
      while (result.status === "queued" || result.status === "running") {
        if (Date.now() > deadline)
          throw new Error(
            "This comparison is taking too long. Try again or open a saved example.",
          );
        setLoading(result.stage);
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, 1200);
          abort.signal.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              reject(new DOMException("Aborted", "AbortError"));
            },
            { once: true },
          );
        });
        result = await getJSON<Scenario | Job>(
          `${API}${result.result_url}`,
          abort.signal,
        );
      }
      if (result.status === "failed")
        throw new Error(
          result.error?.message || "This journey could not be compared.",
        );
      apply(result as Scenario, reveal);
    } catch (e) {
      if ((e as Error).name !== "AbortError")
        setError(
          (e as Error).message ||
            "Unable to connect. Try one of the saved journeys.",
        );
    } finally {
      if (controller.current === abort) setLoading("");
    }
  }
  function cancel() {
    controller.current?.abort();
    setLoading("");
    setError(
      "Comparison cancelled in this browser. You can open a saved journey.",
    );
  }
  const dirty =
    !!scenario &&
    (origin?.id !== scenario.origin.id ||
      destination?.id !== scenario.destination.id);
  const base = scenario?.metrics.great_circle,
    alt = scenario?.metrics.wind_optimized;
  const selected =
    scenario?.metrics[showAlternative ? "wind_optimized" : "great_circle"]
      .segment_metrics;
  const selectedSegment = selected?.[Math.min(segment, selected.length - 1)];
  const featured = examples.filter((e) => e.featured && e.wind_enabled);
  const calm = examples.find(
    (e) =>
      e.origin_id === scenario?.origin.id &&
      e.destination_id === scenario?.destination.id &&
      !e.wind_enabled,
  );
  const [calmTime, setCalmTime] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    setCalmTime(null);
    if (calm)
      getJSON<Scenario>(`/examples/${calm.scenario_id}.json`)
        .then((r) => {
          if (live) setCalmTime(r.metrics.great_circle.modeled_duration_s);
        })
        .catch(() => {});
    return () => {
      live = false;
    };
  }, [calm?.scenario_id]);
  function download() {
    if (!scenario) return;
    const blob = new Blob([JSON.stringify(scenario, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `streamline-${scenario.scenario_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return {
    airports,
    examples,
    scenario,
    origin,
    setOrigin,
    destination,
    setDestination,
    windEnabled,
    showWinds,
    setShowWinds,
    showAlternative,
    setShowAlternative,
    loading,
    error,
    methodology,
    setMethodology,
    segment,
    setSegment,
    airportError,
    compare,
    cancel,
    dirty,
    base,
    alt,
    selected,
    selectedSegment,
    featured,
    calmTime,
    download,
  };
}
