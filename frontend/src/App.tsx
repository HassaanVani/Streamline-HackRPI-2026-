import { useEffect, useRef, useState, lazy, Suspense } from "react";
import {
  ArrowLeftRight,
  ArrowDownToLine,
  Info,
  LoaderCircle,
  Pause,
  Play,
  RotateCcw,
  Wind,
  X,
} from "lucide-react";
import useExplorer from "./useExplorer";
import AirportSearch from "./AirportSearch";
import Logo from "./components/Logo";
import Challenges from "./components/Challenges";
import Methodology, { utc } from "./components/Methodology";
const FlightMap = lazy(() => import("./FlightMap"));
type Kind = "great_circle" | "wind_optimized";
function time(s: number) {
  const m = Math.round(s / 60);
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}
function city(s: string) {
  return s.split(" (")[0];
}
const warningText: Record<string, string> = {
  DOMAIN_BOUNDARY:
    "Search reached the edge of the weather region. The result may change with wider coverage.",
  RESOLUTION_SENSITIVE: "The result changes by more than 1% on a finer grid.",
  MAP_PROJECTION_LIMIT:
    "Polar geometry extends beyond the map’s 85° display limit.",
};

export default function App() {
  const [theme, setTheme] = useState<"clouds" | "atc">(() =>
    localStorage.getItem("streamline-theme") === "atc" ? "atc" : "clouds",
  );
  useEffect(() => {
    localStorage.setItem("streamline-theme", theme);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "clouds" ? "#dceef8" : "#080f13");
  }, [theme]);
  const x = useExplorer(),
    r = x.scenario;
  const [paused, setPaused] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [playing, setPlaying] = useState(false),
    [elapsed, setElapsed] = useState(0),
    [speed, setSpeed] = useState(900),
    [playbackStarted, setPlaybackStarted] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [mode, setMode] = useState<"explore" | "challenge">("explore");
  const [challengeRevealed, setChallengeRevealed] = useState(false);
  const [inspection, setInspection] = useState(false),
    [kind, setKind] = useState<Kind>("wind_optimized");
  const total = r
    ? Math.max(
        r.metrics.great_circle.modeled_duration_s,
        r.metrics.wind_optimized.modeled_duration_s,
      )
    : 1;
  const selected = r?.metrics[kind].segment_metrics;
  const segment = selected?.[Math.min(x.segment, selected.length - 1)];
  const identity = r?.scenario_id;
  useEffect(() => {
    setPlaying(false);
    setElapsed(0);
    setPlaybackStarted(false);
    setInspection(false);
  }, [identity]);
  useEffect(() => {
    if (!playing) return;
    let frame = 0,
      previous = performance.now(),
      lastUpdate = previous;
    const tick = (now: number) => {
      if (now - lastUpdate >= 75) {
        const dt = (now - previous) / 1000;
        previous = now;
        lastUpdate = now;
        setElapsed((value) => Math.min(total, value + dt * speed));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, total]);
  useEffect(() => {
    if (elapsed >= total) setPlaying(false);
  }, [elapsed, total]);
  function inspect(index: number, route: Kind) {
    setKind(route);
    x.setSegment(index);
    setInspection(true);
  }
  async function example(id: string) {
    const e = x.examples.find((e) => e.scenario_id === id);
    if (!e) return;
    const a = x.airports.find((a) => a.id === e.origin_id),
      b = x.airports.find((a) => a.id === e.destination_id);
    if (a && b) await x.compare(a, b, true);
  }
  function play() {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (elapsed >= total) setElapsed(0);
    setPlaybackStarted(true);
    setPlaying(true);
  }
  return (
    <div className="workspace" data-theme={theme}>
      <a className="skip-link" href="#workspace-mode">
        Skip to explorer controls
      </a>
      <header className="app-bar">
        <a className="brand" href="/" aria-label="Streamline home">
          <Logo />
          <span>streamline</span>
        </a>
        <span className="app-description">Wind-aware flight explorer</span>
        <div className="bar-actions">
          <button
            className="theme-switch"
            role="switch"
            aria-checked={theme === "atc"}
            aria-label="ATC theme"
            onClick={() => setTheme(theme === "clouds" ? "atc" : "clouds")}
          >
            <span className={theme === "clouds" ? "active" : ""}>Clouds</span>
            <span className={theme === "atc" ? "active" : ""}>ATC</span>
          </button>
          <button onClick={() => x.setMethodology(true)}>
            <Info size={16} />
            Model & data
          </button>
          <button
            onClick={x.download}
            disabled={!r}
            aria-label="Download scenario"
          >
            <ArrowDownToLine size={17} />
          </button>
        </div>
      </header>
      <main className="map-workspace">
        <Suspense
          fallback={
            <div className="map-loading" role="status">
              Loading map…
            </div>
          }
        >
          <FlightMap
            theme={theme}
            scenario={r}
            showWinds={x.showWinds}
            showAlternative={true}
            segment={inspection ? x.segment : -1}
            inspectKind={kind}
            onInspect={inspect}
            elapsed={playbackStarted ? elapsed : null}
            motionPaused={paused}
          />
        </Suspense>
        <div className="workspace-tools">
          <div
            className="workspace-mode"
            id="workspace-mode"
            tabIndex={-1}
            role="group"
            aria-label="Explorer mode"
          >
            <button
              aria-pressed={mode === "explore"}
              onClick={() => {
                if (mode !== "explore" && x.loading) x.cancel();
                setMode("explore");
              }}
            >
              Free explore
            </button>
            <button
              aria-pressed={mode === "challenge"}
              onClick={() => {
                if (mode !== "challenge") {
                  setMode("challenge");
                  setChallengeRevealed(false);
                  setInspection(false);
                }
              }}
            >
              Wind challenges
            </button>
          </div>
          {mode === "challenge" ? (
            <Challenges
              disabled={!!x.loading}
              onReset={() => setChallengeRevealed(false)}
              onReveal={() => setChallengeRevealed(true)}
              onRun={async (origin, destination, wind) => {
                const a = x.airports.find((a) => a.id === origin),
                  b = x.airports.find((a) => a.id === destination);
                if (a && b) return x.compare(a, b, wind);
              }}
            />
          ) : (
            <aside
              id="route-controls"
              className={`route-panel ${optionsOpen ? "options-open" : ""}`}
              aria-label="Route controls"
            >
              <div className="panel-heading">
                <h1>Compare flight paths</h1>
                <button
                  className="panel-options"
                  onClick={() => setOptionsOpen(!optionsOpen)}
                  aria-expanded={optionsOpen}
                >
                  {optionsOpen ? "Close options" : "Options"}
                </button>
                <p>
                  Choose two airports. Calculate a route through the forecast
                  winds.
                </p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void x.compare();
                }}
              >
                <AirportSearch
                  label="From"
                  value={x.origin}
                  onChange={x.setOrigin}
                  airports={x.airports}
                  disabled={!!x.loading}
                />
                <button
                  className="reverse-button"
                  type="button"
                  disabled={!!x.loading}
                  onClick={() => {
                    const origin = x.origin,
                      destination = x.destination;
                    x.setOrigin(destination);
                    x.setDestination(origin);
                    void x.compare(destination, origin, x.windEnabled);
                  }}
                  aria-label="Reverse journey"
                >
                  <ArrowLeftRight size={16} />
                  <span>Reverse</span>
                </button>
                <AirportSearch
                  label="To"
                  value={x.destination}
                  onChange={x.setDestination}
                  airports={x.airports}
                  disabled={!!x.loading}
                />
                <button
                  className="calculate-button"
                  type="submit"
                  disabled={
                    !!x.loading ||
                    !x.origin ||
                    !x.destination ||
                    x.origin.id === x.destination.id
                  }
                >
                  {x.loading ? (
                    <>
                      <LoaderCircle size={17} className="spin" />
                      Calculating…
                    </>
                  ) : (
                    <>Calculate route</>
                  )}
                </button>
              </form>
              {r && (
                <div className="compact-source">
                  250 hPa · {utc(r.provenance.valid_time)}
                </div>
              )}
              {x.loading && (
                <div className="status-message" role="status">
                  <span>{x.loading}</span>
                  {r && <button onClick={x.cancel}>Cancel</button>}
                </div>
              )}
              {x.error && (
                <p className="error-message" role="alert">
                  {x.error}
                </p>
              )}
              {x.airportError && (
                <p className="error-message">
                  Airport search failed to load. Reload to try again.
                </p>
              )}
              <div className="saved-routes">
                <label htmlFor="saved-route">Saved comparisons</label>
                <select
                  id="saved-route"
                  value={
                    x.examples.find(
                      (e) =>
                        e.origin_id === r?.origin.id &&
                        e.destination_id === r?.destination.id &&
                        e.wind_enabled,
                    )?.scenario_id || ""
                  }
                  disabled={!!x.loading || !x.airports.length}
                  onChange={(e) => void example(e.target.value)}
                >
                  <option value="" disabled>
                    Select a route
                  </option>
                  {x.examples
                    .filter((e) => e.wind_enabled)
                    .map((e) => (
                      <option key={e.scenario_id} value={e.scenario_id}>
                        {e.label}
                      </option>
                    ))}
                </select>
              </div>
              <div className="layer-controls">
                <div>
                  <span>
                    <Wind size={16} />
                    Include winds in calculation
                  </span>
                  <button
                    role="switch"
                    aria-label="Include winds in the model"
                    aria-checked={x.windEnabled}
                    disabled={!!x.loading || !r}
                    onClick={() =>
                      void x.compare(r?.origin, r?.destination, !x.windEnabled)
                    }
                  >
                    <i />
                  </button>
                </div>
                <label>
                  <input
                    type="checkbox"
                    checked={x.showWinds}
                    onChange={(e) => x.setShowWinds(e.target.checked)}
                  />
                  Wind vectors & contours
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={!paused}
                    onChange={(e) => setPaused(!e.target.checked)}
                  />
                  Animate wind vectors
                </label>
              </div>
              {r && (
                <div className="source-details">
                  <span>
                    {r.data_mode === "saved_forecast"
                      ? "Saved forecast"
                      : "Computed forecast"}{" "}
                    · 250 hPa
                  </span>
                  <strong>{utc(r.provenance.valid_time)}</strong>
                  <span>NOAA GFS via Open-Meteo</span>
                  <button onClick={() => x.setMethodology(true)}>
                    Assumptions & limitations
                  </button>
                </div>
              )}
            </aside>
          )}
        </div>
        {r && (mode === "explore" || challengeRevealed) && (
          <>
            {mode === "explore" && (
              <section
                className="playback-panel"
                aria-label="Modeled journey playback"
              >
                <div className="playback-heading">
                  <h2>Journey playback</h2>
                  <span>Modeled, not a recorded flight</span>
                </div>
                <div className="playback-controls">
                  <button
                    onClick={play}
                    disabled={!!x.loading}
                    aria-label={
                      playing
                        ? "Pause journey playback"
                        : "Play journey playback"
                    }
                  >
                    {playing ? <Pause size={17} /> : <Play size={17} />}
                  </button>
                  <button
                    aria-label="Reset playback"
                    onClick={() => {
                      setPlaying(false);
                      setElapsed(0);
                      setPlaybackStarted(false);
                    }}
                  >
                    <RotateCcw size={16} />
                  </button>
                  <div className="elapsed">
                    <strong>{time(elapsed)}</strong>
                    <span>elapsed / {time(total)}</span>
                  </div>
                  <label>
                    Speed
                    <select
                      aria-label="Playback speed"
                      value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value))}
                    >
                      <option value={360}>360×</option>
                      <option value={900}>900×</option>
                      <option value={1800}>1800×</option>
                    </select>
                  </label>
                </div>
                <input
                  className="timeline"
                  type="range"
                  aria-label="Modeled elapsed time"
                  min="0"
                  max={Math.ceil(total)}
                  value={elapsed}
                  onChange={(e) => {
                    setElapsed(Number(e.target.value));
                    setPlaybackStarted(true);
                    setPlaying(false);
                  }}
                />
                <p>
                  Both paths run on the same clock. A dot stops when its modeled
                  journey ends.
                </p>
              </section>
            )}
            {inspection && segment && (
              <section
                className="inspection-panel"
                aria-label="Route segment details"
              >
                <div className="inspection-heading">
                  <h2>At this point</h2>
                  <button
                    aria-label="Close segment inspector"
                    onClick={() => setInspection(false)}
                  >
                    <X size={17} />
                  </button>
                </div>
                <label>
                  Inspect route
                  <select
                    value={kind}
                    onChange={(e) => {
                      setKind(e.target.value as Kind);
                      x.setSegment(0);
                    }}
                  >
                    <option value="wind_optimized">Wind-aware route</option>
                    <option value="great_circle">Shortest distance</option>
                  </select>
                </label>
                <input
                  type="range"
                  aria-label="Route segment"
                  min="0"
                  max={(selected?.length || 1) - 1}
                  value={Math.min(x.segment, (selected?.length || 1) - 1)}
                  onChange={(e) => x.setSegment(Number(e.target.value))}
                />
                <div className="segment-readings">
                  <div>
                    <span>Along-route wind</span>
                    <strong>{segment.along_mps.toFixed(1)} m/s</strong>
                  </div>
                  <div>
                    <span>Crosswind</span>
                    <strong>
                      {Math.abs(segment.cross_mps).toFixed(1)} m/s
                    </strong>
                  </div>
                  <div>
                    <span>Ground speed</span>
                    <strong>{segment.ground_speed_mps.toFixed(1)} m/s</strong>
                  </div>
                </div>
              </section>
            )}
            <section className="comparison-dock" aria-label="Route comparison">
              <div className="dock-title">
                <h2>
                  {r.origin.iata || r.origin.id}
                  <span>→</span>
                  {r.destination.iata || r.destination.id}
                </h2>
                <span>
                  {city(r.origin.municipality)} to{" "}
                  {city(r.destination.municipality)}
                </span>
                {x.dirty && <b>Selection changed — calculate to update</b>}
              </div>
              <div className="metric-grid">
                <div className="metric-header">
                  <span>Path</span>
                  <span>Cruise time</span>
                  <span>Distance</span>
                  <span>Fuel index</span>
                </div>
                {(["great_circle", "wind_optimized"] as const).map((route) => (
                  <div key={route} className={`metric-row ${route}`}>
                    <span>
                      <i
                        className={`route-line ${route === "great_circle" ? "reference" : "alternative"}`}
                      />
                      {route === "great_circle"
                        ? "Shortest distance"
                        : "Wind-aware"}
                    </span>
                    <strong>{time(r.metrics[route].modeled_duration_s)}</strong>
                    <span>
                      {Math.round(
                        r.metrics[route].distance_m / 1000,
                      ).toLocaleString()}{" "}
                      km
                    </span>
                    <span>
                      {r.metrics[route].fuel_index.toFixed(
                        route === "great_circle" ? 0 : 1,
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <div className="comparison-result">
                <strong>
                  {r.comparison.meaningful
                    ? `About ${Math.round(Math.abs(r.comparison.time_difference_s) / 60)} min ${r.comparison.time_difference_s >= 0 ? "less" : "more"}`
                    : "No meaningful difference"}
                </strong>
                <span>
                  {r.comparison.meaningful
                    ? `${Math.abs(r.comparison.percent_difference).toFixed(1)}% modeled cruise-time difference`
                    : "Under these model assumptions"}
                </span>
                <button
                  onClick={() => {
                    setInspection(!inspection);
                    x.setSegment(0);
                  }}
                >
                  Inspect route
                </button>
              </div>
              <p className="model-note">
                Hypothetical cruise only · 230 m/s airspeed · operational
                feasibility not assessed
                {!x.windEnabled ? " · Zero-wind counterfactual" : ""}
              </p>
              {r.warnings
                .filter((w) => warningText[w])
                .map((w) => (
                  <p className="model-warning" key={w}>
                    {warningText[w]}
                  </p>
                ))}
            </section>
          </>
        )}
      </main>
      <Methodology
        open={x.methodology}
        onClose={() => x.setMethodology(false)}
        scenario={r}
        onDownload={x.download}
      />
    </div>
  );
}
