import { describe, expect, test } from "bun:test";
import { Vector3 } from "three";
import { aperturePasses, DX, DY, reflect, turn } from "../src/game/optics";
import type { Dir, Piece, PieceKind } from "../src/game/types";
import { angleFor, rotationGoal } from "../src/scene/pieces";

const Y = new Vector3(0, 1, 0);
const DIRS: Dir[] = [0, 1, 2, 3];
const piece = (kind: PieceKind): Piece => ({
  id: kind,
  kind,
  x: 0,
  y: 0,
  state: 0,
  fixed: false,
  label: kind,
});
const direction = (dir: Dir) => new Vector3(DX[dir], 0, DY[dir]);

test("the rendered diagonal mirror reflects every incoming direction according to the rules", () => {
  for (const kind of ["mirror", "splitter"] as const) {
    const part = piece(kind);
    for (const state of [1, 3]) {
      const normal = new Vector3(0, 0, 1).applyAxisAngle(Y, angleFor(part, state));
      for (const dir of DIRS) {
        const out = reflect(state, dir);
        if (out === null) throw new Error("A diagonal must reflect");
        expect(direction(dir).reflect(normal).distanceTo(direction(out))).toBeLessThan(1e-10);
      }
    }
  }
});

test("the rendered aperture axis passes the same directions as its optical rule", () => {
  const part = piece("aperture");
  for (const state of [0, 1]) {
    const axis = new Vector3(1, 0, 0).applyAxisAngle(Y, angleFor(part, state));
    for (const dir of DIRS) {
      expect(Math.abs(axis.dot(direction(dir))) > 0.5).toBe(aperturePasses(state, dir));
    }
  }
});

test("source and receiver lenses face their authored cardinal direction", () => {
  for (const kind of ["source", "receiver"] as const) {
    const part = piece(kind);
    for (const dir of DIRS) {
      const face = new Vector3(1, 0, 0).applyAxisAngle(Y, angleFor(part, dir));
      expect(face.distanceTo(direction(dir))).toBeLessThan(1e-10);
    }
  }
});

describe.each([1, -1] as const)("mirror motion step %s", (step) => {
  test("each turn stays 45 degrees through repeated state wraps", () => {
    const part = piece("mirror");
    let state = 0;
    let angle = angleFor(part, state);
    for (let i = 0; i < 8; i++) {
      state = turn(part, state, step);
      const goal = rotationGoal(part, angle, state);
      expect(goal - angle).toBeCloseTo((step * Math.PI) / 4, 10);
      angle = goal;
    }
    expect(angle).toBeCloseTo(step * Math.PI * 2, 10);
  });
});

test("a wrapped mirror in mid-turn targets the nearby equivalent angle on reset", () => {
  const part = piece("mirror");
  const midway = (7 * Math.PI) / 8;
  expect(rotationGoal(part, midway, 0)).toBeCloseTo(Math.PI, 10);
  expect(rotationGoal(part, midway, 3)).toBeCloseTo((3 * Math.PI) / 4, 10);
});
