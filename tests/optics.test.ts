import { describe, expect, test } from "bun:test";
import { LEVELS, parseLevel } from "../src/game/levels";
import { aperturePasses, opposite, reflect, trace, turn } from "../src/game/optics";
import type { Level, LevelDef, Piece } from "../src/game/types";

const bench = (map: string[], legend: LevelDef["legend"]): Level =>
  parseLevel({ title: "test", lesson: "", map, legend }, 0);

describe("mirror rule", () => {
  test("diagonals turn light by a right angle", () => {
    expect(reflect(1, 1)).toBe(0); // "/" east → north
    expect(reflect(1, 2)).toBe(3); // "/" south → west
    expect(reflect(3, 1)).toBe(2); // "\" east → south
    expect(reflect(3, 0)).toBe(3); // "\" north → west
  });

  test("square-on mirrors scatter", () => {
    for (const dir of [0, 1, 2, 3] as const) {
      expect(reflect(0, dir)).toBeNull();
      expect(reflect(2, dir)).toBeNull();
    }
  });

  test("turning steps 45° both ways and wraps", () => {
    const mirror = { kind: "mirror" } as Piece;
    expect(turn(mirror, 3, 1)).toBe(0);
    expect(turn(mirror, 0, -1)).toBe(3);
    expect(turn({ kind: "splitter" } as Piece, 1, 1)).toBe(3);
    expect(turn({ kind: "aperture" } as Piece, 1, -1)).toBe(0);
  });
});

describe("aperture rule", () => {
  test("passes only along its tube", () => {
    expect(aperturePasses(0, 1)).toBe(true);
    expect(aperturePasses(0, 0)).toBe(false);
    expect(aperturePasses(1, 2)).toBe(true);
    expect(aperturePasses(1, 3)).toBe(false);
  });
});

describe("trace", () => {
  const S = { kind: "source" as const, state: 1 };

  test("a straight beam reaches a receiver that faces it", () => {
    const result = trace(bench(["S..R"], { S, R: { kind: "receiver", state: 3 } }), {});
    expect(result.solved).toBe(true);
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]?.end).toBe("lit");
  });

  test("light on a receiver's back is wasted", () => {
    const result = trace(bench(["S..R"], { S, R: { kind: "receiver", state: 1 } }), {});
    expect(result.solved).toBe(false);
    expect(result.marks[0]?.kind).toBe("backside");
  });

  test("a beam that leaves the bench is lost at the edge", () => {
    const result = trace(bench(["S..", "..R"], { S, R: { kind: "receiver", state: 0 } }), {});
    expect(result.marks[0]).toMatchObject({ kind: "lost", x: 2.5, y: 0 });
  });

  test("struts block and apertures stop cross-light", () => {
    const strut = bench(["S#R"], { S, R: { kind: "receiver", state: 3 } });
    expect(trace(strut, {}).marks[0]?.kind).toBe("blocked");
    const level = bench(["SAR"], {
      S,
      A: { kind: "aperture", state: 1 },
      R: { kind: "receiver", state: 3 },
    });
    expect(trace(level, {}).marks[0]?.kind).toBe("stopped");
    expect(trace(level, { "aperture-1-0": 0 }).solved).toBe(true);
  });

  test("a splitter feeds two receivers", () => {
    const level = bench(["S.sR", "....", "..Q."], {
      S,
      s: { kind: "splitter", state: 3 },
      R: { kind: "receiver", state: 3 },
      Q: { kind: "receiver", state: 0 },
    });
    const result = trace(level, {});
    expect(result.lit.sort()).toEqual(["receiver-2-2", "receiver-3-0"]);
    expect(result.solved).toBe(true);
  });

  test("a closed loop of mirrors terminates", () => {
    const level = bench(["S.s.a", ".....", "..b.c"], {
      S,
      s: { kind: "splitter", state: 3 },
      a: { kind: "mirror", state: 3 },
      b: { kind: "mirror", state: 1 },
      c: { kind: "mirror", state: 1 },
    });
    expect(trace(level, {}).segments.length).toBeLessThan(20);
  });

  test("opposite directions", () => {
    expect(opposite(0)).toBe(2);
    expect(opposite(3)).toBe(1);
  });
});

test("the first repair is one short chain with one meaningful misalignment", () => {
  const first = LEVELS[0];
  if (!first) throw new Error("missing level");
  const before = trace(first, {});
  expect(before.marks.map((m) => m.kind)).toEqual(["scatter"]);
  const after = trace(first, { "mirror-3-2": 3 });
  expect(after.solved).toBe(true);
  expect(after.segments).toHaveLength(3);
});
