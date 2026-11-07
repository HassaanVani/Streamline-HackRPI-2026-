export type PlaybackPoint = {
  coordinates: [number, number];
  segment: number;
  finished: boolean;
};

/** Position on the displayed route at a shared modeled elapsed time. */
export function routePosition(
  coordinates: number[][],
  durations: number[],
  elapsed: number,
): PlaybackPoint {
  if (
    coordinates.length !== durations.length + 1 ||
    !durations.length ||
    durations.some((t) => !Number.isFinite(t) || t <= 0)
  ) {
    throw new Error(
      "Route geometry and positive segment durations must align.",
    );
  }
  const total = durations.reduce((a, b) => a + b, 0);
  let remaining = Math.max(0, Math.min(elapsed, total));
  let index = 0;
  while (index < durations.length - 1 && remaining > durations[index])
    remaining -= durations[index++];
  const t = Math.min(1, remaining / durations[index]);
  const a = coordinates[index],
    b = coordinates[index + 1];
  let delta = b[0] - a[0];
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return {
    coordinates: [a[0] + delta * t, a[1] + (b[1] - a[1]) * t],
    segment: index,
    finished: elapsed >= total,
  };
}
