import { describe, expect, test } from "bun:test";
import { CONSTELLATIONS } from "../src/game/constellations";
import { adjustable, LEVEL_DEFS, LEVELS } from "../src/game/levels";
import { trace } from "../src/game/optics";
import { minimumTurns, solutions } from "../src/game/solver";

describe.each(LEVELS.map((level) => [level.title, level] as const))("%s", (_title, level) => {
  test("starts drifted, not solved", () => {
    expect(trace(level, {}).solved).toBe(false);
  });

  test("can be repaired", () => {
    expect(solutions(level).length).toBeGreaterThan(0);
    expect(minimumTurns(level)).toBeGreaterThan(0);
  });

  test("has adjustable parts, one source and at least one receiver", () => {
    expect(adjustable(level).length).toBeGreaterThan(0);
    expect(level.pieces.filter((p) => p.kind === "source")).toHaveLength(1);
    expect(level.pieces.some((p) => p.kind === "receiver")).toBe(true);
  });

  test("fits a phone-sized bench", () => {
    expect(level.width).toBeLessThanOrEqual(7);
    expect(level.height).toBeLessThanOrEqual(6);
  });
});

test("difficulty climbs across the night", () => {
  const turns = LEVELS.map(minimumTurns);
  expect(turns[0]).toBe(1);
  expect(turns.at(-1)).toBeGreaterThanOrEqual(Math.max(...turns.slice(0, -1)));
});

test("every repair reveals a constellation, and lines join real stars", () => {
  expect(CONSTELLATIONS).toHaveLength(LEVEL_DEFS.length);
  for (const c of CONSTELLATIONS) {
    for (const [a, b] of c.lines) {
      expect(c.stars[a]).toBeDefined();
      expect(c.stars[b]).toBeDefined();
    }
  }
});

test("labels are unique within a repair", () => {
  for (const level of LEVELS) {
    const labels = adjustable(level).map((p) => p.label);
    expect(new Set(labels).size).toBe(labels.length);
  }
});
