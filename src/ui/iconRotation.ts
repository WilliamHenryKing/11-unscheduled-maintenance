/** A mirror line is unchanged by 180 degrees: retain a continuous, shortest-path display angle. */
export function nearestMirrorAngle(previous: number, target: number): number {
  const delta = ((((target - previous + 90) % 180) + 180) % 180) - 90;
  return previous + delta;
}
