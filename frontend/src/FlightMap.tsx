import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import mapWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
maplibregl.setWorkerUrl(mapWorkerUrl);
import { Minus, Plus, RotateCcw } from "lucide-react";
import type { Scenario } from "./types";
import { routePosition } from "./playback";
import { buildWindFlow } from "./windFlow";

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
  theme,
  scenario,
  showWinds,
  showContours,
  showAlternative,
  segment,
  motionPaused,
  elapsed,
  inspectKind,
  onInspect,
}: {
  theme: "clouds" | "atc";
  scenario: Scenario | null;
  showWinds: boolean;
  showContours: boolean;
  showAlternative: boolean;
  segment: number;
  motionPaused: boolean;
  elapsed: number | null;
  inspectKind: "great_circle" | "wind_optimized";
  onInspect: (segment: number, kind: "great_circle" | "wind_optimized") => void;
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
    theme,
    onInspect,
  });
  current.current = {
    scenario,
    showWinds,
    showAlternative,
    segment,
    motionPaused,
    theme,
    onInspect,
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
              paint: { "background-color": "#080f13" },
            },
            {
              id: "land",
              type: "fill",
              source: "land",
              paint: { "fill-color": "#0d1b1a", "fill-opacity": 1 },
            },
            {
              id: "borders",
              type: "line",
              source: "land",
              paint: {
                "line-color": "#29453b",
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
    const resize = new ResizeObserver(() => m.resize());
    resize.observe(container.current);
    m.touchZoomRotate.disableRotation();
    m.on("error", () => setTileFailure(true));
    let flowKey = "",
      flowPaths: { x: number; y: number }[][] = [];
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
      const cacheKey = [
        state.scenario.scenario_id,
        center,
        m.getCenter().lat,
        m.getZoom(),
        bounds.width,
        bounds.height,
      ].join(":");
      if (cacheKey !== flowKey) {
        const projected = state.scenario.winds.samples.map((w) => {
          let lon = w.lon;
          while (lon - center > 180) lon -= 360;
          while (lon - center < -180) lon += 360;
          const lat = Math.max(-85, Math.min(85, w.lat)),
            p = m.project([lon, lat]);
          const next = m.project([
            lon +
              (w.u_mps * 60) /
                (111320 * Math.max(0.087, Math.cos((lat * Math.PI) / 180))),
            Math.max(-85, Math.min(85, lat + (w.v_mps * 60) / 111320)),
          ]);
          return {
            x: p.x,
            y: p.y,
            dx: next.x - p.x,
            dy: next.y - p.y,
            speed: Math.hypot(w.u_mps, w.v_mps),
          };
        });
        flowPaths = buildWindFlow(projected, bounds.width, bounds.height);
        flowKey = cacheKey;
      }
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const [index, points] of flowPaths.entries()) {
        ctx.strokeStyle =
          state.theme === "atc"
            ? "rgba(132,197,157,.22)"
            : "rgba(56,126,161,.25)";
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        points.forEach((p, i) =>
          i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
        );
        ctx.stroke();
        if (!state.motionPaused) {
          const head = Math.floor(
            (performance.now() * 0.006 + index * 7) % points.length,
          );
          ctx.strokeStyle =
            state.theme === "atc"
              ? "rgba(167,227,186,.65)"
              : "rgba(40,116,155,.6)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let j = Math.max(0, head - 6); j <= head; j++) {
            const p = points[j];
            if (j === Math.max(0, head - 6)) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
        } else {
          const i = Math.floor(points.length * 0.65),
            p = points[i],
            q = points[Math.max(0, i - 1)],
            angle = Math.atan2(p.y - q.y, p.x - q.x);
          ctx.strokeStyle = state.theme === "atc" ? "#78a98c" : "#6e9fb8";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(
            p.x - 4 * Math.cos(angle - 0.5),
            p.y - 4 * Math.sin(angle - 0.5),
          );
          ctx.lineTo(p.x, p.y);
          ctx.lineTo(
            p.x - 4 * Math.cos(angle + 0.5),
            p.y - 4 * Math.sin(angle + 0.5),
          );
          ctx.stroke();
        }
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
              Math.max(100, width - 100) / (512 * Math.max(1e-6, xmax - xmin)),
              Math.max(100, height - 190) / (512 * Math.max(1e-6, ymax - ymin)),
            ),
          ),
        ),
      );
      const cy = (ymin + ymax) / 2 - 10 / (512 * 2 ** zoom);
      m.setPadding({
        top: 100,
        bottom: 35,
        left: 40,
        right: 40,
      });
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
    m.on("click", (event) => {
      if (!m.getLayer("alternative")) return;
      const hits = m.queryRenderedFeatures(
        [
          [event.point.x - 12, event.point.y - 12],
          [event.point.x + 12, event.point.y + 12],
        ],
        { layers: ["alternative", "baseline"] },
      );
      const hit = hits[0];
      const state = current.current;
      if (!hit || !state.scenario) return;
      const kind = hit.properties.kind as "great_circle" | "wind_optimized";
      const segments = state.scenario.metrics[kind].segment_metrics;
      let closest = 0,
        best = Infinity;
      segments.forEach((s, i) => {
        let lon = s.lon;
        while (lon - m.getCenter().lng > 180) lon -= 360;
        while (lon - m.getCenter().lng < -180) lon += 360;
        const p = m.project([lon, s.lat]);
        const d = (p.x - event.point.x) ** 2 + (p.y - event.point.y) ** 2;
        if (d < best) {
          best = d;
          closest = i;
        }
      });
      state.onInspect(closest, kind);
    });
    m.on("mousemove", (event) => {
      if (!m.getLayer("alternative")) return;
      const hits = m.queryRenderedFeatures(event.point, {
        layers: ["alternative", "baseline"],
      });
      m.getCanvas().style.cursor = hits.length ? "crosshair" : "";
    });
    m.on("style.load", () => {
      const grid: GeoJSON.Feature[] = [];
      for (let lon = -180; lon <= 180; lon += 10)
        grid.push({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: Array.from({ length: 81 }, (_, i) => [
              lon,
              -80 + i * 2,
            ]),
          },
        });
      for (let lat = -80; lat <= 80; lat += 10)
        grid.push({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: Array.from({ length: 181 }, (_, i) => [
              -180 + i * 2,
              lat,
            ]),
          },
        });
      m.addSource("graticule", {
        type: "geojson",
        data: { type: "FeatureCollection", features: grid },
      });
      m.addLayer({
        id: "graticule",
        type: "line",
        source: "graticule",
        paint: {
          "line-color": "#2b4d3d",
          "line-width": 0.6,
          "line-opacity": 0.1,
        },
      });
      m.addSource("contours", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      m.addLayer({
        id: "contours",
        type: "line",
        source: "contours",
        paint: {
          "line-color": "#477956",
          "line-opacity": 0.38,
          "line-width": 1,
        },
      });
      m.addSource("flight-positions", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

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
          "line-color": "#83aaa3",
          "line-width": 1.5,
          "line-opacity": 0.8,
        },
      });
      m.addLayer({
        id: "alternative-glow",
        type: "line",
        source: "routes",
        filter: ["==", ["get", "kind"], "wind_optimized"],
        paint: {
          "line-color": "#dbbb79",
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
          "line-color": "#dbbb79",
          "line-width": 2,
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
          "circle-color": "#0a1610",
          "circle-stroke-color": "#dbbb79",
          "circle-stroke-width": 1.5,
        },
      });
      m.addLayer({
        id: "flight-positions",
        type: "circle",
        source: "flight-positions",
        paint: {
          "circle-radius": 5,
          "circle-color": [
            "match",
            ["get", "kind"],
            "great_circle",
            "#83aaa3",
            "#dbbb79",
          ],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#0a1610",
        },
      });
      setReady(true);
    });
    return () => {
      markers.current.forEach((marker) => marker.remove());
      resize.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const dark = theme === "atc";
    const alt = dark ? "#dbbb79" : "#087f96",
      base = dark ? "#83aaa3" : "#6d7d86";
    const paints: [
      string,
      (
        | "background-color"
        | "fill-color"
        | "line-color"
        | "circle-color"
        | "circle-stroke-color"
      ),
      string,
    ][] = [
      ["background", "background-color", dark ? "#080f13" : "#d8ecf7"],
      ["land", "fill-color", dark ? "#0d1b1a" : "#f7f8ed"],
      ["borders", "line-color", dark ? "#29453b" : "#83b2c8"],
      ["graticule", "line-color", dark ? "#2b4d3d" : "#9dc4da"],
      ["contours", "line-color", dark ? "#477956" : "#7eb6cf"],
      ["baseline", "line-color", base],
      ["alternative", "line-color", alt],
      ["alternative-glow", "line-color", alt],
      ["segment", "circle-color", dark ? "#0a1610" : "#ffffff"],
      ["segment", "circle-stroke-color", alt],
      ["flight-positions", "circle-stroke-color", dark ? "#0a1610" : "#ffffff"],
    ];
    for (const [layer, property, value] of paints)
      m.setPaintProperty(layer, property, value);
    m.setPaintProperty("flight-positions", "circle-color", [
      "match",
      ["get", "kind"],
      "great_circle",
      base,
      alt,
    ]);
    draw.current();
  }, [theme, ready]);
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
    const contourFeatures: GeoJSON.Feature[] = [];
    const samples = scenario.winds.samples;
    for (const level of [20, 40, 60, 80, 100]) {
      for (let y = 0; y < 11; y++)
        for (let x = 0; x < 11; x++) {
          const corners = [
            samples[y * 12 + x],
            samples[y * 12 + x + 1],
            samples[(y + 1) * 12 + x + 1],
            samples[(y + 1) * 12 + x],
          ];
          if (corners.some((p) => !p)) continue;
          const crossings: number[][] = [];
          for (let edge = 0; edge < 4; edge++) {
            const a = corners[edge],
              b = corners[(edge + 1) % 4];
            const sa = Math.hypot(a.u_mps, a.v_mps),
              sb = Math.hypot(b.u_mps, b.v_mps);
            if (sa < level === sb < level) continue;
            const t = (level - sa) / (sb - sa);
            let dl = b.lon - a.lon;
            while (dl > 180) dl -= 360;
            while (dl < -180) dl += 360;
            crossings.push([a.lon + t * dl, a.lat + t * (b.lat - a.lat)]);
          }
          for (let i = 0; i + 1 < crossings.length; i += 2)
            contourFeatures.push({
              type: "Feature",
              properties: { speed: level },
              geometry: {
                type: "LineString",
                coordinates: unwrap([crossings[i], crossings[i + 1]]),
              },
            });
        }
    }
    (m.getSource("contours") as maplibregl.GeoJSONSource).setData({
      type: "FeatureCollection",
      features: contourFeatures,
    });
    fit.current();
    draw.current();
  }, [scenario, ready]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    m.setLayoutProperty(
      "contours",
      "visibility",
      showWinds && showContours ? "visible" : "none",
    );
    for (const id of ["alternative", "alternative-glow"])
      m.setLayoutProperty(
        id,
        "visibility",
        showAlternative ? "visible" : "none",
      );
    const selected = scenario?.metrics[inspectKind].segment_metrics[segment];
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
  }, [
    scenario,
    showWinds,
    showContours,
    showAlternative,
    segment,
    inspectKind,
    ready,
  ]);
  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    const animate = () => {
      draw.current();
      if (!motionPaused && showWinds && inView && scenario?.wind_enabled)
        frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [ready, motionPaused, showWinds, scenario, inView]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const features: GeoJSON.Feature[] = [];
    if (scenario && elapsed !== null)
      for (const route of scenario.routes.features) {
        const metrics = scenario.metrics[route.id];
        const p = routePosition(
          route.geometry.coordinates,
          metrics.segment_metrics.map((s) => s.modeled_duration_s),
          elapsed,
        );
        let lon = p.coordinates[0];
        while (lon - m.getCenter().lng > 180) lon -= 360;
        while (lon - m.getCenter().lng < -180) lon += 360;
        features.push({
          type: "Feature",
          properties: { kind: route.id },
          geometry: { type: "Point", coordinates: [lon, p.coordinates[1]] },
        });
      }
    (m.getSource("flight-positions") as maplibregl.GeoJSONSource).setData({
      type: "FeatureCollection",
      features,
    });
  }, [elapsed, scenario, ready]);
  return (
    <section className="flight-map" aria-label="Interactive flight route map">
      <div ref={container} className="map-surface" />
      <canvas ref={canvas} className="wind-surface" aria-hidden="true" />
      <div className="map-navigation">
        <button onClick={() => map.current?.zoomIn()} aria-label="Zoom in">
          <Plus size={19} />
        </button>
        <button onClick={() => map.current?.zoomOut()} aria-label="Zoom out">
          <Minus size={19} />
        </button>
        <button onClick={() => fit.current()} aria-label="Fit route">
          <RotateCcw size={17} />
        </button>
      </div>
      <div className="chart-title">
        <span>
          {scenario
            ? `${scenario.provenance.valid_time.replace("T", " ").slice(0, 16)} UTC · 250 hPa`
            : "250 hPa / FORECAST WIND FIELD"}
        </span>
        <h2>
          {scenario
            ? `${scenario.origin.iata || scenario.origin.id} → ${scenario.destination.iata || scenario.destination.id}`
            : "Wind & route chart"}
        </h2>
      </div>
      <div className="chart-key">
        <span>
          <i className="route-line reference" />
          Shortest distance
        </span>
        <span>
          <i className="route-line alternative" />
          Wind-aware route
        </span>
        {showContours && showWinds && (
          <span className="contour-key">
            <i />
            Wind speed contours, 20 m/s intervals
          </span>
        )}
      </div>
      <div className="chart-caption">
        {scenario && !scenario.wind_enabled
          ? "Zero-wind counterfactual"
          : `${motionPaused ? "Static" : "Animated"} wind vectors · ${scenario?.data_mode === "saved_forecast" ? "saved" : "computed"} forecast`}{" "}
        · click a route to inspect
      </div>
      {tileFailure && (
        <p className="map-fallback" role="status">
          Map unavailable. Route measurements and controls remain available.
        </p>
      )}
    </section>
  );
}
