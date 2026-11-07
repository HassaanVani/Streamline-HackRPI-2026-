import { useEffect, useRef } from "react";
import { ArrowDownToLine, ArrowUpRight, X } from "lucide-react";
import type { Scenario } from "../types";
export function utc(time: string) {
  return (
    new Date(time).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }) + " UTC"
  );
}
export default function Methodology({
  open,
  onClose,
  scenario,
  onDownload,
}: {
  open: boolean;
  onClose: () => void;
  scenario: Scenario | null;
  onDownload: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    else if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="science-dialog"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
      aria-labelledby="science-title"
    >
      <div className="science-top">
        <span className="mono">STREAMLINE / FIELD NOTES</span>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close methodology"
        >
          <X size={22} />
        </button>
      </div>
      <div className="science-body">
        <span className="section-kicker">03 / THE SCIENCE</span>
        <h2 id="science-title">
          A little wonder.
          <br />
          <em>All the workings.</em>
        </h2>
        <p className="science-lead">
          We ask a simple what-if: how would moving air change the time along a
          flight path?
        </p>
        {scenario && (
          <>
            <dl className="science-facts">
              <div>
                <dt>Atmosphere</dt>
                <dd>NOAA GFS via Open-Meteo</dd>
              </div>
              <div>
                <dt>Wind valid time</dt>
                <dd>{utc(scenario.provenance.valid_time)}</dd>
              </div>
              <div>
                <dt>Retrieved</dt>
                <dd>{utc(scenario.provenance.retrieved_at)}</dd>
              </div>
              <div>
                <dt>Pressure surface</dt>
                <dd>250 hPa, not a fixed altitude</dd>
              </div>
              <div>
                <dt>Illustrative airspeed</dt>
                <dd>230 m/s, held constant</dd>
              </div>
              <div>
                <dt>Path search</dt>
                <dd>Directed Dijkstra · 64 × 33 nodes</dd>
              </div>
              <div>
                <dt>Finer-grid check</dt>
                <dd>
                  128 × 65 ·{" "}
                  {scenario.validation.resolution_change_percent.toFixed(3)}%
                  time change
                </dd>
              </div>
            </dl>
            <h3>The same rules for both routes.</h3>
            <p>
              We sample a frozen wind field at 12 × 12 locations, interpolate
              east/north vectors, account for crosswind, and sum time along each
              displayed path. A finer routing grid adds no weather detail. The
              alternative is the shortest modeled time found on this grid, not a
              global optimum.
            </p>
            <h3>A relative fuel index, honestly labeled.</h3>
            <p>
              The shortest-distance baseline is 100. With constant fuel flow,
              this index is proportional to time; it is not an independent fuel
              model. Absolute fuel and CO₂ stay unavailable without a defensible
              aircraft profile.
            </p>
            <h3>These are hypothetical paths.</h3>
            <p>
              Neither line is an observed flight. Both model cruise between
              airport coordinates, excluding climb and descent. Airlines already
              account for real constraints that this explorer does not know.
            </p>
            <ul>
              {scenario.assumptions.exclusions.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p>
              Operational feasibility is not assessed. A modeled difference is
              not verified avoidable emissions or evidence of airline
              inefficiency.
            </p>
            <h3>Follow the evidence.</h3>
            <div className="source-links">
              <a
                href="https://open-meteo.com/en/docs/gfs-api"
                target="_blank"
                rel="noreferrer"
              >
                Open-Meteo / NOAA GFS <ArrowUpRight size={15} />
              </a>
              <a
                href="https://open-meteo.com/en/terms"
                target="_blank"
                rel="noreferrer"
              >
                Weather attribution · CC BY 4.0 <ArrowUpRight size={15} />
              </a>
              <a
                href="https://ourairports.com/data/"
                target="_blank"
                rel="noreferrer"
              >
                OurAirports · public domain <ArrowUpRight size={15} />
              </a>
              <a
                href="https://www.naturalearthdata.com/about/terms-of-use/"
                target="_blank"
                rel="noreferrer"
              >
                Natural Earth geography · public domain{" "}
                <ArrowUpRight size={15} />
              </a>
            </div>
            <div className="manifest-id mono">
              MODEL / {scenario.model_version}
              <br />
              SCENARIO / {scenario.scenario_id}
              <br />
              WEATHER SHA-256 / {scenario.provenance.payload_hash}
            </div>
            <button className="outline-button" onClick={onDownload}>
              <ArrowDownToLine size={17} />
              Download exact scenario
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
