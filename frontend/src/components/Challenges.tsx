import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import {
  challenges,
  evaluateChallenge,
  type ChallengeId,
  type ChallengeResult,
} from "../challenges";
import type { Scenario } from "../types";
type RecordEntry = { choice: number; correct: boolean };
type Notebook = Partial<Record<ChallengeId, RecordEntry>>;
const key = "streamline-experiments-v1";
function readNotebook(): Notebook {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "{}");
    return Object.fromEntries(
      challenges
        .filter(
          (c) =>
            Number.isInteger(stored[c.id]?.choice) &&
            stored[c.id].choice >= 0 &&
            stored[c.id].choice < 3 &&
            typeof stored[c.id].correct === "boolean",
        )
        .map((c) => [c.id, stored[c.id]]),
    );
  } catch {
    return {};
  }
}
export default function Challenges({
  onRun,
  onReveal,
  onReset,
  disabled,
}: {
  onRun: (
    origin: string,
    destination: string,
    wind: boolean,
  ) => Promise<Scenario | undefined>;
  onReveal: () => void;
  onReset: () => void;
  disabled: boolean;
}) {
  const [active, setActive] = useState(0),
    [choice, setChoice] = useState<number | null>(null);
  const [result, setResult] = useState<ChallengeResult | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [notebook, setNotebook] = useState<Notebook>(readNotebook);
  const request = useRef(0),
    feedback = useRef<HTMLDivElement>(null),
    heading = useRef<HTMLHeadingElement>(null);
  const task = challenges[active],
    count = Object.keys(notebook).length;
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(notebook));
    } catch {
      /* Progress still works in this session. */
    }
  }, [notebook]);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  useEffect(() => {
    heading.current?.focus();
  }, []);
  useEffect(() => {
    if (result) feedback.current?.focus();
  }, [result]);
  function select(index: number) {
    request.current++;
    setActive(index);
    setChoice(null);
    setResult(null);
    setError("");
    onReset();
  }
  async function run() {
    if (choice === null || busy) return;
    const token = ++request.current;
    setBusy(true);
    setError("");
    try {
      const reference =
        task.id === "reverse" ? await onRun("KJFK", "EGLL", true) : undefined;
      if (token !== request.current) return;
      if (task.id === "reverse" && !reference)
        throw new Error("The eastbound example could not load. Try again.");
      const scenario = await onRun(task.origin, task.destination, task.wind);
      if (token !== request.current) return;
      if (!scenario)
        throw new Error(
          "The saved comparison could not load. Try again. Your progress is unchanged.",
        );
      const outcome = evaluateChallenge(task.id, scenario, reference);
      setResult(outcome);
      setNotebook((old) =>
        old[task.id]
          ? old
          : {
              ...old,
              [task.id]: { choice, correct: choice === outcome.answer },
            },
      );
      onReveal();
    } catch (e) {
      if (token === request.current) setError((e as Error).message);
    } finally {
      if (token === request.current) setBusy(false);
    }
  }
  return (
    <aside
      className={`challenge-panel ${result ? "has-result" : ""}`}
      aria-label="Wind experiments"
    >
      <div className="challenge-heading">
        <div>
          <span className="experiment-kicker">Wind challenges</span>
          <h1 ref={heading} tabIndex={-1}>
            Three wind experiments.
          </h1>
        </div>
        <span className="experiment-count">{count} / 3 explored</span>
      </div>
      {!result && (
        <p className="challenge-intro">
          Choose an experiment, then predict its result.
        </p>
      )}
      <nav className="experiment-steps" aria-label="Choose an experiment">
        {challenges.map((c, index) => (
          <button
            key={c.id}
            onClick={() => select(index)}
            disabled={busy}
            aria-current={active === index ? "step" : undefined}
            aria-label={`${index + 1}. ${c.title}${notebook[c.id] ? ", explored" : ""}`}
          >
            <span>
              {notebook[c.id] ? <Check size={14} /> : `0${index + 1}`}
            </span>
            <span>{c.title}</span>
          </button>
        ))}
      </nav>
      <div className="experiment-body">
        <div className="experiment-route">{task.route}</div>
        <h2>{result ? task.title : task.question}</h2>
        {!result && <p>{task.detail}</p>}
        {!result ? (
          <>
            <fieldset disabled={busy || disabled}>
              <legend>Your prediction</legend>
              {task.choices.map((label, index) => (
                <label key={label} className={choice === index ? "chosen" : ""}>
                  <input
                    type="radio"
                    name="prediction"
                    value={index}
                    checked={choice === index}
                    onChange={() => setChoice(index)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
            <button
              className="test-prediction"
              disabled={choice === null || busy || disabled}
              onClick={() => void run()}
            >
              {busy ? "Opening forecast comparisons…" : "Test my prediction"}
              <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <div className="experiment-feedback" ref={feedback} tabIndex={-1}>
            <strong>
              {choice === result.answer
                ? "Your prediction held up."
                : "The forecast tells a different story."}
            </strong>
            <p className="correct-prediction">
              Result: {task.choices[result.answer]}
            </p>
            <p>{result.evidence}</p>
            <div role="note">{result.lesson}</div>
            <button
              className="test-prediction"
              onClick={() => select((active + 1) % challenges.length)}
            >
              {active < 2 ? "Next experiment" : "Explore another experiment"}
              <ArrowRight size={16} />
            </button>
          </div>
        )}
        {busy && (
          <p role="status">
            Using bundled forecast results. No weather request is needed.
          </p>
        )}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </div>
      <footer className="experiment-footer">
        <span>
          {count
            ? `${Object.values(notebook).filter((v) => v?.correct).length} of ${count} first predictions matched`
            : "Progress stays in this browser."}
          {count === 3 ? " · All three explored" : ""}
        </span>
        <button
          aria-label="Reset experiment progress"
          disabled={busy || !count}
          onClick={() => {
            setNotebook({});
            select(0);
          }}
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </footer>
      <p className="experiment-caveat">
        Saved Nov 7 forecast · illustrative cruise model.
        <br />
        Operational feasibility is not assessed.
      </p>
    </aside>
  );
}
