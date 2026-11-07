import { useId, useMemo, useState } from "react";
import { Search, MapPin } from "lucide-react";
import type { Airport } from "./types";
export default function AirportSearch({
  label,
  value,
  onChange,
  airports,
  disabled = false,
}: {
  label: string;
  value: Airport | null;
  onChange: (a: Airport) => void;
  airports: Airport[];
  disabled?: boolean;
}) {
  const id = useId(),
    [query, setQuery] = useState(""),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(0);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return airports
      .filter((a) =>
        `${a.iata || ""} ${a.id} ${a.name} ${a.municipality}`
          .toLowerCase()
          .includes(q),
      )
      .sort(
        (a, b) =>
          Number(![a.id, a.iata, a.icao].some((v) => v?.toLowerCase() === q)) -
            Number(
              ![b.id, b.iata, b.icao].some((v) => v?.toLowerCase() === q),
            ) || Number(b.scheduled_service) - Number(a.scheduled_service),
      )
      .slice(0, 6);
  }, [query, airports]);
  function select(a: Airport) {
    onChange(a);
    setQuery("");
    setOpen(false);
    setActive(0);
  }
  return (
    <div className={`journey-airport ${open ? "is-searching" : ""}`}>
      <label htmlFor={id}>
        {label === "From" ? "DEPARTURE" : "DESTINATION"}
        <span>{value?.country || "WORLDWIDE"}</span>
      </label>
      <div className="airport-entry">
        <input
          id={id}
          disabled={disabled}
          role="combobox"
          aria-label={label}
          aria-autocomplete="list"
          aria-controls={`${id}-list`}
          aria-expanded={open}
          aria-activedescendant={
            open && matches[active] ? `${id}-${active}` : undefined
          }
          autoComplete="off"
          value={open ? query : value?.iata || value?.id || ""}
          placeholder={open ? "City or airport" : "Choose"}
          onFocus={() => {
            setOpen(true);
            setQuery("");
            setActive(0);
          }}
          onBlur={() => setOpen(false)}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) =>
                Math.min(i + 1, Math.max(0, matches.length - 1)),
              );
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(0, i - 1));
            }
            if (e.key === "Enter" && open) {
              e.preventDefault();
              if (matches[active]) select(matches[active]);
            }
          }}
        />
        <Search size={17} />
      </div>
      <span className="airport-city">
        {open
          ? query.length < 2
            ? "Search by city, name, or code"
            : "Pick an airport below"
          : value?.municipality ||
            value?.name ||
            "Find your corner of the world"}
      </span>
      {open && (
        <div
          className="airport-suggestions"
          id={`${id}-list`}
          role="listbox"
          aria-label={`${label} airports`}
        >
          {matches.map((a, i) => (
            <div
              role="option"
              aria-selected={i === active}
              id={`${id}-${i}`}
              key={a.id}
              onPointerDown={(e) => {
                e.preventDefault();
                select(a);
              }}
            >
              <MapPin size={17} />
              <span>
                <strong>{a.municipality || a.name}</strong>
                <small>{a.name}</small>
              </span>
              <b>{a.iata || a.id}</b>
            </div>
          ))}
          {!matches.length && (
            <p>
              {!airports.length
                ? "Airport data is loading…"
                : query.length < 2
                  ? "Type at least two letters to search worldwide."
                  : "No airports found. Try another name or code."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
