import { adjustable } from "./levels";
import { trace } from "./optics";
import type { Level, PieceKind, States } from "./types";

const OPTIONS: Partial<Record<PieceKind, number[]>> = {
  mirror: [0, 1, 2, 3],
  splitter: [1, 3],
  aperture: [0, 1],
};

/** Every combination of adjustable states that lights all receivers. Levels are tiny, so brute force. */
export function solutions(level: Level): States[] {
  const parts = adjustable(level);
  const found: States[] = [];
  const walk = (i: number, states: States) => {
    const part = parts[i];
    if (!part) {
      if (trace(level, states).solved) found.push({ ...states });
      return;
    }
    for (const s of OPTIONS[part.kind] ?? [part.state]) walk(i + 1, { ...states, [part.id]: s });
  };
  walk(0, {});
  return found;
}

/** Fewest turns from the drifted start to any solution (turns go either way). */
export function minimumTurns(level: Level): number {
  const parts = adjustable(level);
  let best = Number.POSITIVE_INFINITY;
  for (const sol of solutions(level)) {
    let turns = 0;
    for (const p of parts) {
      const target = sol[p.id] ?? p.state;
      if (p.kind === "mirror") {
        const d = Math.abs(target - p.state);
        turns += Math.min(d, 4 - d);
      } else if (target !== p.state) turns += 1;
    }
    best = Math.min(best, turns);
  }
  return best;
}
