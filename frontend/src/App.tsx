import {
  ArrowDown,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CloudSun,
  Globe2,
  Info,
  LoaderCircle,
  Pause,
  Play,
  Send,
  Wind,
} from "lucide-react";
import useExplorer from "./useExplorer";
import AirportSearch from "./AirportSearch";
import SkyScene, { CloudBank, PaperPlane } from "./components/SkyScene";
import Methodology, { utc } from "./components/Methodology";
import { lazy, Suspense, useState } from "react";

const FlightMap = lazy(() => import("./FlightMap"));

function duration(seconds: number) {
  const m = Math.round(seconds / 60);
  return (
    <>
      {Math.floor(m / 60)}
      <small>h</small> {String(m % 60).padStart(2, "0")}
      <small>m</small>
    </>
  );
}
function minutes(seconds: number) {
  const value = Math.round(Math.abs(seconds) / 60);
  return `${value} ${value === 1 ? "minute" : "minutes"}`;
}
function city(name: string | undefined) {
  return name?.split(" (")[0] || "";
}
const warnings: Record<string, string> = {
  DOMAIN_BOUNDARY:
    "The path reaches the edge of our weather region. A wider search could change this result.",
  RESOLUTION_SENSITIVE:
    "This comparison changes by more than 1% on a finer grid. Treat the difference with caution.",
  MAP_PROJECTION_LIMIT:
    "This polar route extends beyond the map’s 85° display limit. The calculation uses the full path.",
};

export default function App() {
  const x = useExplorer();
  const [motionPaused, setMotionPaused] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [inspection, setInspection] = useState(false);
  const result = x.scenario;
  const outcome = result?.comparison;
  async function openExample(id: string) {
    const e = x.examples.find((e) => e.scenario_id === id);
    if (!e) return;
    const a = x.airports.find((a) => a.id === e.origin_id),
      b = x.airports.find((a) => a.id === e.destination_id);
    if (a && b) {
      x.setOrigin(a);
      x.setDestination(b);
      await x.compare(a, b, true, false);
    }
  }
  return (
    <div id="top" className={`sky-world ${motionPaused ? "motion-paused" : ""}`}>
      <a href="#explore" className="skip-link">
        Skip to flight explorer
      </a>
      <header className="sky-nav">
        <a className="wordmark" href="#top" aria-label="Streamline home">
          <Send size={27} strokeWidth={1.5} />
          <span>
            STREAMLINE<span className="wordmark-star">✦</span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#explore">
            THE JOURNEY <ArrowDown size={12} />
          </a>
          <button onClick={() => x.setMethodology(true)}>
            THE SCIENCE <ArrowUpRight size={13} />
          </button>
        </nav>
        <div className="nav-right">
          <button
            className="motion-control"
            onClick={() => setMotionPaused(!motionPaused)}
            aria-label={motionPaused ? "Resume animation" : "Pause animation"}
          >
            {motionPaused ? <Play size={14} /> : <Pause size={14} />}
            <span>{motionPaused ? "MOTION OFF" : "MOTION ON"}</span>
          </button>
          <a
            className="event-stamp"
            href="https://hackrpi.com"
            target="_blank"
            rel="noreferrer"
          >
            BUILT IN THE CLOUDS{" "}
            <span>
              HACKRPI ’26 <ArrowUpRight size={12} />
            </span>
          </a>
        </div>
      </header>
      <main>
        <section className="sky-hero" aria-labelledby="hero-title">
          <div className="hero-content">
            <div className="section-kicker">
              <span className="tiny-sun" />
              AN EXPLORER FOR THE AIR-CURIOUS
            </div>
            <h1 id="hero-title">
              WHY FLY
              <br />
              <span>THIS WAY?</span>
              <svg viewBox="0 0 290 18" aria-hidden="true">
                <path d="M3 12Q140-4 286 7M12 17Q153 5 271 12" />
              </svg>
            </h1>
            <p>
              The sky isn’t still. Follow the winds behind a flight, then
              explore a different way across.
            </p>
            <a href="#explore" className="hero-cta">
              LET’S FIND OUT <ArrowDown size={19} />
            </a>
            <span className="hero-side-note">
              A real wind snapshot.
              <br />A carefully labeled what-if.
            </span>
          </div>
          <SkyScene />
          <div className="hero-bottom mono">
            <span>NO PILOT’S LICENSE REQUIRED.</span>
            <span>
              JUST A LITTLE CURIOSITY. <span className="spark-symbol">✦</span>
            </span>
          </div>
        </section>
        <section
          className="journey-section"
          id="explore"
          aria-labelledby="journey-title"
        >
          <div className="explore-heading">
            <div>
              <span className="section-kicker">01 / CHOOSE YOUR JOURNEY</span>
              <h2 id="journey-title">
                Where does your
                <br />
                <em>curiosity take you?</em>
              </h2>
            </div>
            <p>
              Start over the Atlantic, or pick two airports anywhere in the
              world. We’ll meet you up there.
            </p>
          </div>
          <div className="explorer-stage">
            <form
              className="route-composer"
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
                className="swap-airports"
                type="button"
                aria-label="Reverse journey"
                disabled={!!x.loading}
                onClick={() => {
                  const a = x.origin;
                  x.setOrigin(x.destination);
                  x.setDestination(a);
                  void x.compare(
                    x.destination,
                    a,
                    x.windEnabled,
                    x.showAlternative,
                  );
                }}
              >
                <ArrowLeftRight size={20} />
              </button>
              <AirportSearch
                label="To"
                value={x.destination}
                onChange={x.setDestination}
                airports={x.airports}
                disabled={!!x.loading}
              />
              <div className="composer-action">
                <span className="mono">
                  <Globe2 size={12} />
                  THE WORLD IS OPEN
                </span>
                <button
                  type="submit"
                  className="takeoff-button"
                  disabled={
                    !!x.loading ||
                    !x.origin ||
                    !x.destination ||
                    x.origin.id === x.destination.id
                  }
                >
                  {x.loading ? (
                    <LoaderCircle size={20} className="spin" />
                  ) : (
                    <Send size={19} />
                  )}
                  <span>
                    {x.loading ? "READING THE SKY…" : "FOLLOW THE WIND"}
                  </span>
                  <ArrowUpRight size={18} />
                </button>
              </div>
            </form>
            <div className="example-strip">
              <span className="mono">OR BORROW A LITTLE INSPIRATION</span>
              {x.featured.map((e, i) => (
                <button
                  key={e.scenario_id}
                  disabled={!!x.loading || !x.airports.length}
                  onClick={() => void openExample(e.scenario_id)}
                  className={
                    result?.origin.id === e.origin_id &&
                    result.destination.id === e.destination_id
                      ? "active"
                      : ""
                  }
                >
                  <span>0{i + 1}</span>
                  {i === 0 ? "THE ATLANTIC CROSSING" : "THE SHORT HOP"}
                  <b>{e.label}</b>
                  <ArrowUpRight size={13} />
                </button>
              ))}
            </div>
            {x.airportError && (
              <p className="notice notice-warning">
                Airport search couldn’t load. Reload to restore the worldwide
                airport list.
              </p>
            )}
            {x.loading && (
              <div className="notice" role="status">
                <LoaderCircle size={18} className="spin" />
                <span>{x.loading}</span>
                {result && <button onClick={x.cancel}>Cancel</button>}
              </div>
            )}
            {x.error && (
              <div className="notice notice-warning" role="alert">
                <Info size={18} />
                <span>{x.error}</span>
                <button
                  onClick={() =>
                    void x.compare(
                      result?.origin,
                      result?.destination,
                      result?.wind_enabled,
                    )
                  }
                >
                  Reopen displayed journey
                </button>
              </div>
            )}
            <div className="map-intro">
              <span className="section-kicker">02 / MEET THE MOVING AIR</span>
              <span className="mono">
                {result
                  ? `${city(result.origin.municipality)} → ${city(result.destination.municipality)}`
                  : "OPENING THE SKY"}
              </span>
            </div>
            <Suspense
              fallback={
                <div className="map-loading" role="status">
                  <Wind size={25} />
                  <span>Opening your window onto the sky…</span>
                </div>
              }
            >
              <FlightMap
                scenario={result}
                showWinds={x.showWinds}
                onToggleWinds={() => x.setShowWinds(!x.showWinds)}
                showAlternative={x.showAlternative}
                segment={x.segment}
                motionPaused={motionPaused}
              />
            </Suspense>
            <div className="weather-caption">
              <span>
                <span className="data-dot" />
                {result?.data_mode === "saved_forecast"
                  ? "SAVED FORECAST EXAMPLE"
                  : "FORECAST COMPARISON"}
                <b>NOT A LIVE FLIGHT</b>
              </span>
              <span>
                {result
                  ? utc(result.provenance.valid_time)
                  : "Loading timestamp"}{" "}
                · NOAA GFS / Open-Meteo
              </span>
            </div>
          </div>
        </section>
        <section
          className="results-section"
          id="comparison"
          aria-labelledby="comparison-title"
        >
          <div className="results-heading">
            <div>
              <span className="section-kicker">03 / EXPLORE THE WHAT-IF</span>
              <h2 id="comparison-title">
                {x.showAlternative ? (
                  <>
                    A different path.
                    <br />
                    <em>What actually changes?</em>
                  </>
                ) : (
                  <>
                    The shortest line
                    <br />
                    <em>is only the beginning.</em>
                  </>
                )}
              </h2>
            </div>
            <div className="wind-experiment">
              <div>
                <Wind size={22} />
                <span>
                  <strong>Winds in the model</strong>
                  <small>
                    Turn them off to compare both paths with still air.
                  </small>
                </span>
              </div>
              <button
                role="switch"
                aria-label="Include winds in the model"
                aria-checked={x.windEnabled}
                disabled={!!x.loading || !result}
                onClick={() =>
                  void x.compare(
                    result?.origin,
                    result?.destination,
                    !x.windEnabled,
                    x.showAlternative,
                  )
                }
              >
                <span />
                {x.windEnabled ? "ON" : "OFF"}
              </button>
            </div>
          </div>
          {x.dirty && (
            <div className="notice notice-warning">
              <Info size={18} />
              Your airport selection changed. Follow the wind to update this
              comparison.
            </div>
          )}
          {result && x.base && x.alt ? (
            <>
              <div className="boarding-pass">
                <div className="pass-spine">
                  <Send size={19} />
                  <span>HYPOTHETICAL CRUISE COMPARISON</span>
                  <span>SL / 026</span>
                </div>
                <div className="pass-main">
                  <div className="pass-itinerary">
                    <div>
                      <small>DEPARTURE</small>
                      <strong>{result.origin.iata || result.origin.id}</strong>
                      <span>
                        {city(result.origin.municipality) || result.origin.name}
                      </span>
                    </div>
                    <div className="pass-connector">
                      <span />
                      <Send size={21} />
                      <span />
                    </div>
                    <div>
                      <small>DESTINATION</small>
                      <strong>
                        {result.destination.iata || result.destination.id}
                      </strong>
                      <span>
                        {city(result.destination.municipality) ||
                          result.destination.name}
                      </span>
                    </div>
                    <div className="pass-condition">
                      <CloudSun size={26} />
                      <span>
                        {x.windEnabled ? "WITH THE WIND" : "STILL-AIR WHAT-IF"}
                        <small>250 hPa · 230 m/s airspeed</small>
                      </span>
                    </div>
                  </div>
                  <div className="route-comparison">
                    <div className="comparison-labels">
                      <span>THE PATH</span>
                      <span>MODELED CRUISE TIME</span>
                      <span>DISTANCE</span>
                      <span>
                        RELATIVE FUEL INDEX{" "}
                        <button
                          onClick={() => x.setMethodology(true)}
                          aria-label="Explain relative fuel index"
                        >
                          <Info size={13} />
                        </button>
                      </span>
                    </div>
                    <div className="comparison-route baseline">
                      <div>
                        <i className="route-line reference" />
                        <strong>Shortest distance</strong>
                        <small>The great-circle baseline</small>
                      </div>
                      <div className="large-metric">
                        {duration(x.base.modeled_duration_s)}
                      </div>
                      <div>
                        {Math.round(x.base.distance_m / 1000).toLocaleString()}{" "}
                        <small>km</small>
                      </div>
                      <div>
                        100 <small>baseline</small>
                      </div>
                    </div>
                    {x.showAlternative ? (
                      <div className="comparison-route optimized">
                        <div>
                          <i className="route-line alternative" />
                          <strong>Wind-based alternative</strong>
                          <small>
                            Shortest modeled time found on this grid
                          </small>
                        </div>
                        <div className="large-metric">
                          {duration(x.alt.modeled_duration_s)}
                        </div>
                        <div>
                          {Math.round(x.alt.distance_m / 1000).toLocaleString()}{" "}
                          <small>km</small>
                        </div>
                        <div>
                          {x.alt.fuel_index.toFixed(1)}{" "}
                          <small>relative index</small>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="reveal-route"
                        disabled={!!x.loading}
                        onClick={() => {
                          x.setShowAlternative(true);
                          x.setSegment(0);
                        }}
                      >
                        <Wind size={25} />
                        <span>
                          Could the moving air suggest another way?
                          <small>Reveal the wind-based comparison.</small>
                        </span>
                        <ArrowRight size={24} />
                      </button>
                    )}
                  </div>
                  <div className="pass-verdict">
                    <span className="verdict-icon">
                      {x.showAlternative ? (
                        <Check size={20} />
                      ) : (
                        <Wind size={20} />
                      )}
                    </span>
                    <p>
                      {x.showAlternative ? (
                        outcome?.meaningful ? (
                          <>
                            About{" "}
                            <strong>
                              {minutes(outcome.time_difference_s)}{" "}
                              {outcome.time_difference_s >= 0 ? "less" : "more"}
                            </strong>{" "}
                            modeled cruise time (
                            {Math.abs(outcome.percent_difference).toFixed(1)}%)
                            compared with the shortest-distance path.
                          </>
                        ) : (
                          <>
                            No meaningful difference under these assumptions.{" "}
                            <strong>
                              Sometimes the shortest path holds up.
                            </strong>
                          </>
                        )
                      ) : x.calmTime && x.windEnabled ? (
                        <>
                          On this path, wind changes modeled time by about{" "}
                          <strong>
                            {minutes(x.base.modeled_duration_s - x.calmTime)}
                          </strong>{" "}
                          versus still air. Try reversing the journey.
                        </>
                      ) : (
                        <>
                          A wind pushing along the route changes ground speed.
                          Crosswinds matter, too.
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="pass-stub">
                  <div className="stub-sun">✦</div>
                  <span className="mono">
                    YOUR WINDOW
                    <br />
                    INTO THE ATMOSPHERE
                  </span>
                  <p>
                    Real winds.
                    <br />
                    Visible assumptions.
                    <br />
                    Room for curiosity.
                  </p>
                  <button onClick={() => x.setMethodology(true)}>
                    HOW WE ESTIMATED THIS <ArrowUpRight size={15} />
                  </button>
                  <div className="barcode" aria-hidden="true" />
                  <span className="mono">EXPLORE / NOT NAVIGATE</span>
                </div>
              </div>
              {result.warnings
                .filter((w) => warnings[w])
                .map((w) => (
                  <p className="notice notice-warning" key={w}>
                    <Info size={18} />
                    {warnings[w]}
                  </p>
                ))}
              <div className="result-footnotes">
                <p>
                  <Info size={15} />
                  Cruise model only. Neither line is an observed flight.
                  Operational feasibility is not assessed.
                </p>
                <button onClick={() => x.setMethodology(true)}>
                  <Info size={16} /> ASSUMPTIONS & SOURCES
                </button>
                <button onClick={x.download}>
                  <ArrowDownToLine size={16} />
                  TAKE THE SCENARIO WITH YOU
                </button>
              </div>
              <section className="air-inspector">
                <button
                  className="inspector-toggle"
                  aria-expanded={inspection}
                  aria-controls="air-inspector"
                  onClick={() => setInspection(!inspection)}
                >
                  <span>
                    <Wind size={21} />
                    Get to know the air along the path.
                  </span>
                  <span className="mono">
                    {inspection ? "CLOSE" : "TAKE A CLOSER LOOK"}
                    <ChevronDown size={17} />
                  </span>
                </button>
                {inspection && (
                  <div id="air-inspector" className="inspector-content">
                    <label htmlFor="segment">
                      Explore segment {x.segment + 1} of {x.selected?.length}
                    </label>
                    <input
                      id="segment"
                      type="range"
                      min="0"
                      max={(x.selected?.length || 1) - 1}
                      value={x.segment}
                      onChange={(e) => x.setSegment(Number(e.target.value))}
                    />
                    {x.selectedSegment && (
                      <div className="air-readings">
                        <div>
                          <small>WIND ALONG THE ROUTE</small>
                          <strong>
                            {x.selectedSegment.along_mps.toFixed(1)}{" "}
                            <span>m/s</span>
                          </strong>
                        </div>
                        <div>
                          <small>CROSSWIND</small>
                          <strong>
                            {Math.abs(x.selectedSegment.cross_mps).toFixed(1)}{" "}
                            <span>m/s</span>
                          </strong>
                        </div>
                        <div>
                          <small>MODELED GROUND SPEED</small>
                          <strong>
                            {x.selectedSegment.ground_speed_mps.toFixed(1)}{" "}
                            <span>m/s</span>
                          </strong>
                        </div>
                        <p>
                          A positive along-route wind pushes in the direction of
                          travel. The model adjusts the heading to counter
                          crosswind.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </>
          ) : (
            <p className="empty-state">
              {x.loading || "Choose a journey to begin exploring."}
            </p>
          )}
        </section>
        <section className="closing-sky">
          <CloudBank />
          <div>
            <span className="section-kicker">
              A DIFFERENT WAY TO SEE A FAMILIAR JOURNEY
            </span>
            <h2>
              Keep your head
              <br />
              <em>in the clouds.</em>
            </h2>
            <p>And your assumptions where everyone can see them.</p>
            <button
              className="outline-button"
              onClick={() => x.setMethodology(true)}
            >
              OPEN THE FIELD NOTES <ArrowUpRight size={18} />
            </button>
          </div>
          <PaperPlane />
        </section>
      </main>
      <footer className="sky-footer">
        <a className="wordmark" href="#top">
          <Send size={24} />
          <span>STREAMLINE</span>
        </a>
        <p>
          An aviation what-if, built at HackRPI 2026.
          <br />
          Weather: Open-Meteo / NOAA GFS · Airports: OurAirports · Geography:
          Natural Earth
        </p>
        <a
          href="https://github.com/HassaanVani/Streamline-HackRPI-2026-"
          target="_blank"
          rel="noreferrer"
        >
          VIEW THE WORKINGS <ArrowUpRight size={16} />
        </a>
      </footer>
      <Methodology
        open={x.methodology}
        onClose={() => x.setMethodology(false)}
        scenario={result}
        onDownload={x.download}
      />
    </div>
  );
}
