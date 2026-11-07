import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { Minus, Plus, RotateCcw, Wind, Layers3 } from "lucide-react";
import type { Scenario } from "./types";

function unwrap(coords: number[][]) {
  let last = coords[0][0];
  return coords.map(([lon, lat]) => {
    while (lon - last > 180) lon -= 360;
    while (lon - last < -180) lon += 360;
    last = lon;
    return [lon, Math.max(-85, Math.min(85, lat))];
  });
}

export default function FlightMap({
  scenario,
  showWinds,
  onToggleWinds,
  showAlternative,
  segment,
  motionPaused,
}: {
  scenario: Scenario | null;
  showWinds: boolean;
  onToggleWinds: () => void;
  showAlternative: boolean;
  segment: number;
  motionPaused: boolean;
}) {
  const container = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const current = useRef({
    scenario,
    showWinds,
    showAlternative,
    segment,
    motionPaused,
  });
  current.current = {
    scenario,
    showWinds,
    showAlternative,
    segment,
    motionPaused,
  };
  const [ready, setReady] = useState(false),
    [tileFailure, setTileFailure] = useState(false);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting),
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const markers = useRef<maplibregl.Marker[]>([]);
  const draw = useRef(() => {});
  const fit = useRef(() => {});
  useEffect(() => {
    if (!container.current) return;
    setReady(false);
    let m: maplibregl.Map;
    try {
      m = new maplibregl.Map({
        container: container.current,
        center: [-35, 47],
        zoom: 2.2,
        minZoom: 1,
        maxZoom: 9,
        dragRotate: false,
        pitchWithRotate: false,
        attributionControl: { compact: true },
        style: {
          version: 8,
          sources: {
            land: {
              type: "geojson",
              data: "/world.geojson",
              attribution:
                '<a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth · public domain</a>',
            },
          },
          layers: [
            {
              id: "background",
              type: "background",
              paint: { "background-color": "#d5e7f0" },
            },
            {
              id: "land",
              type: "fill",
              source: "land",
              paint: { "fill-color": "#edf0df", "fill-opacity": 1 },
            },
            {
              id: "borders",
              type: "line",
              source: "land",
              paint: {
                "line-color": "#9cb6b8",
                "line-width": 0.7,
                "line-opacity": 0.5,
              },
            },
          ],
        },
      });
    } catch {
      setTileFailure(true);
      return;
    }
    map.current = m;
    m.touchZoomRotate.disableRotation();
    m.on("error", () => setTileFailure(true));
    draw.current = () => {
      const c = canvas.current,
        ctx = c?.getContext("2d");
      if (!c || !ctx) return;
      const bounds = container.current!.getBoundingClientRect(),
        dpr = window.devicePixelRatio || 1;
      if (
        c.width !== Math.round(bounds.width * dpr) ||
        c.height !== Math.round(bounds.height * dpr)
      ) {
        c.width = Math.round(bounds.width * dpr);
        c.height = Math.round(bounds.height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, bounds.width, bounds.height);
      const state = current.current;
      if (!state.scenario || !state.showWinds) return;
      const center = m.getCenter().lng;
      for (const [index, w] of state.scenario.winds.samples.entries()) {
        const speed = Math.hypot(w.u_mps, w.v_mps);
        if (speed < 0.05) continue;
        let lon = w.lon;
        while (lon - center > 180) lon -= 360;
        while (lon - center < -180) lon += 360;
        const p = m.project([lon, Math.max(-85, Math.min(85, w.lat))]);
        if (p.x < 0 || p.y < 0 || p.x > bounds.width || p.y > bounds.height)
          continue;
        const angle = Math.atan2(-w.v_mps, w.u_mps),
          length = 11 + Math.min(26, speed * 0.45);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.strokeStyle = "#527994";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(-length / 2, 0);
        ctx.lineTo(length / 2, 0);
        ctx.moveTo(length / 2 - 4, -3);
        ctx.lineTo(length / 2, 0);
        ctx.lineTo(length / 2 - 4, 3);
        ctx.stroke();
        if (!state.motionPaused) {
          const travel = 48 + Math.min(28, speed * 0.5);
          const phase =
            ((performance.now() * (0.008 + speed * 0.0002) + index * 13) %
              travel) -
            travel / 2;
          ctx.strokeStyle = "rgba(255,255,255,.92)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(phase - 6, 0);
          ctx.lineTo(phase, 0);
          ctx.stroke();
        }
        ctx.restore();
      }
    };
    fit.current = () => {
      const s = current.current.scenario;
      if (!s) return;
      const coords = unwrap(s.routes.features[0].geometry.coordinates);
      // Fit unwrapped Mercator coordinates directly: this is stable across
      // antimeridian crossings and sidebar/inspector-driven canvas resizes.
      const merc = (lat: number) =>
        (1 -
          Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) /
        2;
      const xs = coords.map((p) => p[0] / 360),
        ys = coords.map((p) => merc(p[1]));
      const xmin = Math.min(...xs),
        xmax = Math.max(...xs),
        ymin = Math.min(...ys),
        ymax = Math.max(...ys);
      const { width, height } = container.current!.getBoundingClientRect();
      const zoom = Math.max(
        1,
        Math.min(
          6,
          Math.log2(
            Math.min(
              Math.max(80, width - 130) / (512 * Math.max(1e-6, xmax - xmin)),
              Math.max(80, height - 200) / (512 * Math.max(1e-6, ymax - ymin)),
            ),
          ),
        ),
      );
      const cy = (ymin + ymax) / 2 - 10 / (512 * 2 ** zoom);
      m.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
      m.jumpTo({
        center: [
          (xmin + xmax) * 180,
          (Math.atan(Math.sinh(Math.PI * (1 - 2 * cy))) * 180) / Math.PI,
        ],
        zoom,
        bearing: 0,
        pitch: 0,
      });
    };
    m.on("move", () => draw.current());
    m.on("resize", () => {
      draw.current();
      fit.current();
    });
    m.on("style.load", () => {
      m.addSource("routes", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      m.addLayer({
        id: "baseline",
        type: "line",
        source: "routes",
        filter: ["==", ["get", "kind"], "great_circle"],
        paint: {
          "line-color": "#5e7991",
          "line-width": 2.5,
          "line-opacity": 0.8,
        },
      });
      m.addLayer({
        id: "alternative-glow",
        type: "line",
        source: "routes",
        filter: ["==", ["get", "kind"], "wind_optimized"],
        paint: {
          "line-color": "#e97a4e",
          "line-width": 12,
          "line-opacity": 0.1,
          "line-blur": 5,
        },
      });
      m.addLayer({
        id: "alternative",
        type: "line",
        source: "routes",
        filter: ["==", ["get", "kind"], "wind_optimized"],
        paint: {
          "line-color": "#b84e2c",
          "line-width": 3.5,
          "line-dasharray": [3, 2],
        },
      });
      m.addSource("segment", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      m.addLayer({
        id: "segment",
        type: "circle",
        source: "segment",
        paint: {
          "circle-radius": 5,
          "circle-color": "#fff",
          "circle-stroke-color": "#b84e2c",
          "circle-stroke-width": 3,
        },
      });
      setReady(true);
    });
    return () => {
      markers.current.forEach((marker) => marker.remove());
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !scenario) return;
    const features = scenario.routes.features.map((f) => ({
      ...f,
      geometry: { ...f.geometry, coordinates: unwrap(f.geometry.coordinates) },
    }));
    (m.getSource("routes") as maplibregl.GeoJSONSource).setData({
      type: "FeatureCollection",
      features,
    } as GeoJSON.FeatureCollection);
    markers.current.forEach((marker) => marker.remove());
    const points = unwrap(scenario.routes.features[0].geometry.coordinates);
    markers.current = [scenario.origin, scenario.destination].map(
      (airport, i) => {
        const el = document.createElement("div");
        el.className = "airport-marker";
        el.setAttribute(
          "aria-label",
          `${airport.iata || airport.id}: ${airport.name}`,
        );
        const dot = document.createElement("i");
        const label = document.createElement("span");
        label.textContent = airport.iata || airport.id;
        el.append(dot, label);
        return new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat(
            points[i === 0 ? 0 : points.length - 1] as [number, number],
          )
          .addTo(m);
      },
    );
    fit.current();
    draw.current();
  }, [scenario, ready]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    for (const id of ["alternative", "alternative-glow"])
      m.setLayoutProperty(
        id,
        "visibility",
        showAlternative ? "visible" : "none",
      );
    const selected =
      scenario?.metrics[showAlternative ? "wind_optimized" : "great_circle"]
        .segment_metrics[segment];
    const center = m.getCenter().lng;
    let lon = selected?.lon || 0;
    while (lon - center > 180) lon -= 360;
    while (lon - center < -180) lon += 360;
    (m.getSource("segment") as maplibregl.GeoJSONSource).setData({
      type: "FeatureCollection",
      features: selected
        ? [
            {
              type: "Feature",
              properties: {},
              geometry: { type: "Point", coordinates: [lon, selected.lat] },
            },
          ]
        : [],
    });
    draw.current();
  }, [scenario, showWinds, showAlternative, segment, ready]);
  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    const animate = () => {
      draw.current();
      if (!motionPaused && showWinds && inView)
        frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [ready, motionPaused, showWinds, scenario, inView]);
  return (
    <section className="atmosphere-map" aria-label="Interactive journey map">
      <div ref={container} className="map-surface" />
      <canvas ref={canvas} className="wind-surface" aria-hidden="true" />
      <div className="map-instrument">
        <Layers3 size={16} />
        <span>250 hPa</span>
        <span className="instrument-divider" />
        <span>
          {scenario && !scenario.wind_enabled
            ? "Still-air experiment"
            : "Cruise-level winds"}
        </span>
      </div>
      <div className="map-toolbox">
        <button onClick={() => map.current?.zoomIn()} aria-label="Zoom in">
          <Plus size={20} />
        </button>
        <button onClick={() => map.current?.zoomOut()} aria-label="Zoom out">
          <Minus size={20} />
        </button>
        <button onClick={() => fit.current()} aria-label="Fit journey">
          <RotateCcw size={18} />
        </button>
      </div>
      <div className="map-key">
        <span>
          <i className="route-line reference" />
          Shortest distance
        </span>
        {showAlternative && (
          <span>
            <i className="route-line alternative" />
            Wind-based alternative
          </span>
        )}
        <small>Both paths are hypothetical.</small>
      </div>
      <button
        className={`wind-visibility ${showWinds ? "is-on" : ""}`}
        onClick={onToggleWinds}
        aria-pressed={showWinds}
      >
        <Wind size={17} />
        Show winds<span>{showWinds ? "ON" : "OFF"}</span>
      </button>
      {tileFailure && (
        <p className="map-fallback" role="status">
          The map could not load. You can still explore the complete comparison
          below.
        </p>
      )}
      <div className="map-footnote">
        {motionPaused ? "Static wind arrows" : "Wind motion is illustrative"} ·
        frozen forecast field
      </div>
    </section>
  );
}
