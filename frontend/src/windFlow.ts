/** Display-only interpolation. No extra weather resolution; no extrapolation. */
export type FlowSample = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  speed: number;
};
type V = { dx: number; dy: number; speed: number };
type Triangle = {
  a: FlowSample;
  b: FlowSample;
  c: FlowSample;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  det: number;
};
export function windSampler(samples: FlowSample[], columns = 12) {
  const triangles: Triangle[] = [];
  for (let row = 0; row < Math.floor(samples.length / columns) - 1; row++)
    for (let col = 0; col < columns - 1; col++) {
      const a = samples[row * columns + col],
        b = samples[row * columns + col + 1],
        c = samples[(row + 1) * columns + col + 1],
        d = samples[(row + 1) * columns + col];
      const triples = [
        [a, b, c],
        [a, c, d],
      ];
      for (const [a, b, c] of triples) {
        const det = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
        if (Math.abs(det) < 1e-8) continue;
        triangles.push({
          a,
          b,
          c,
          det,
          minX: Math.min(a.x, b.x, c.x),
          maxX: Math.max(a.x, b.x, c.x),
          minY: Math.min(a.y, b.y, c.y),
          maxY: Math.max(a.y, b.y, c.y),
        });
      }
    }
  return (x: number, y: number): V | null => {
    for (const t of triangles) {
      if (x < t.minX || x > t.maxX || y < t.minY || y > t.maxY) continue;
      const { a, b, c, det } = t;
      const u = ((b.y - c.y) * (x - c.x) + (c.x - b.x) * (y - c.y)) / det;
      const v = ((c.y - a.y) * (x - c.x) + (a.x - c.x) * (y - c.y)) / det,
        w = 1 - u - v;
      if (Math.min(u, v, w) < -1e-7) continue;
      return {
        dx: u * a.dx + v * b.dx + w * c.dx,
        dy: u * a.dy + v * b.dy + w * c.dy,
        speed: u * a.speed + v * b.speed + w * c.speed,
      };
    }
    return null;
  };
}
export function buildWindFlow(
  samples: FlowSample[],
  width: number,
  height: number,
  columns = 12,
) {
  const sample = windSampler(samples, columns),
    paths: { x: number; y: number }[][] = [],
    occupied = new Set<string>();
  const key = (x: number, y: number) =>
    `${Math.round(x / 22)},${Math.round(y / 22)}`;
  function trace(x: number, y: number, sign: number) {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 22; i++) {
      const v = sample(x, y);
      if (!v || v.speed < 0.5) break;
      const norm = Math.hypot(v.dx, v.dy);
      if (norm < 1e-7) break;
      const mid = sample(
        x + ((sign * v.dx) / norm) * 2.5,
        y + ((sign * v.dy) / norm) * 2.5,
      );
      if (!mid) break;
      const m = Math.hypot(mid.dx, mid.dy);
      if (m < 1e-7) break;
      x += ((sign * mid.dx) / m) * 5;
      y += ((sign * mid.dy) / m) * 5;
      if (x < 0 || y < 0 || x > width || y > height || !sample(x, y)) break;
      points.push({ x, y });
    }
    return points;
  }
  for (let y = 20, row = 0; y < height; y += 48, row++)
    for (let x = 20 + (row % 2) * 24; x < width; x += 56) {
      if (occupied.has(key(x, y)) || !sample(x, y)) continue;
      const points = [
        ...trace(x, y, -1).reverse(),
        { x, y },
        ...trace(x, y, 1),
      ];
      if (points.length < 5) continue;
      paths.push(points);
      for (const p of points) occupied.add(key(p.x, p.y));
    }
  return paths;
}
