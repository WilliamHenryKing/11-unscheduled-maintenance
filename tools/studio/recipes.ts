import type { Recipes } from "./kit/build";
import {
  bend,
  blend,
  box,
  capsule,
  carve,
  chain,
  cone,
  cylinder,
  displace,
  ellipsoid,
  extrude,
  fbm,
  lathe,
  type Mat,
  mat,
  mirrorX,
  mottle,
  move,
  type Node,
  paint,
  polygon2,
  radial,
  rng,
  rotate,
  scale,
  sphere,
  subtract,
  torus,
  union,
  type Vec3,
} from "./kit/sdf";

const pick = <T>(r: () => number, list: T[]) => list[Math.floor(r() * list.length)] as T;
const range = (r: () => number, a: number, b: number) => a + (b - a) * r();
void [bend, blend, box, capsule, carve, chain, cone, cylinder, displace, ellipsoid, extrude, fbm, lathe, mirrorX, mottle, move, paint, polygon2, radial, rotate, scale, sphere, subtract, torus, union];
type Build = (seed: number, index: number) => Node;
void (0 as unknown as Mat | Vec3 | Build);

// UNSCHEDULED MAINTENANCE — precise instrument craft for the telescope repair: mirror cells,
// spider vanes, focusers, eyepieces, mount parts and gears in anodised metal and glass.
const ANOD = [0x1f2a3a, 0x3a3f46, 0x6a1f2a, 0x1f4a4a, 0xc9ccd1];
const metal = (r: () => number) => mat(pick(r, ANOD), 0.3, 0.9);
const mirrorCell: Build = (seed) => {
  const r = rng(seed);
  const rad = range(r, 0.08, 0.2);
  const cell = cylinder(rad * 1.12, rad * 0.25, rad * 0.03, metal(r));
  const mirror = move(cylinder(rad, rad * 0.12, rad * 0.01, mat(0xdfe6ea, 0.02, 1)), [0, rad * 0.12, 0]);
  const screws = radial(move(cylinder(rad * 0.06, rad * 0.35, rad * 0.01, mat(0xc49a4a, 0.3, 1)), [rad * 0.95, -rad * 0.05, 0]), 3);
  return union(subtract(cell, move(cylinder(rad * 1.01, rad * 0.2, 0), [0, rad * 0.12, 0])), mirror, screws);
};
const spider: Build = (seed) => {
  const r = rng(seed);
  const rad = range(r, 0.1, 0.22);
  const m = metal(r);
  const vanes = r() < 0.5 ? 4 : 3;
  return union(torus(rad, rad * 0.05, m), radial(move(box(rad, rad * 0.12, rad * 0.01, 0, m), [rad * 0.5, 0, 0]), vanes), rotate(move(cylinder(rad * 0.18, rad * 0.35, rad * 0.02, m), [0, 0, 0]), [0, 0, 0]), move(rotate(cylinder(rad * 0.16, rad * 0.03, 0, mat(0xdfe6ea, 0.02, 1)), [Math.PI / 4, 0, 0]), [0, -rad * 0.2, 0]));
};
const focuser: Build = (seed) => {
  const r = rng(seed);
  const m = metal(r);
  const brass = mat(0xc49a4a, 0.3, 1);
  const len = range(r, 0.08, 0.16);
  const tube = rotate(union(cylinder(0.03, len, 0.002, m), move(cylinder(0.038, len * 0.3, 0.003, m), [0, -len * 0.35, 0])), [Math.PI / 2, 0, 0]);
  const knobs = mirrorX(move(rotate(union(cylinder(0.018, 0.02, 0.003, brass), radial(move(box(0.004, 0.02, 0.004, 0.001, brass), [0.018, 0, 0]), 12)), [0, 0, Math.PI / 2]), [0.05, -0.02, -len * 0.3]));
  return union(tube, knobs, capsule([-0.045, -0.02, -len * 0.3], [0.045, -0.02, -len * 0.3], 0.004, 0.004, brass));
};
const eyepiece: Build = (seed) => {
  const r = rng(seed);
  const m = metal(r);
  const grip = mat(0x1a1a1a, 0.8);
  const h = range(r, 0.05, 0.1);
  const barrel = cylinder(0.016, h * 0.5, 0.002, mat(0xc9ccd1, 0.25, 1));
  const body = move(cylinder(range(r, 0.02, 0.03), h, 0.004, m), [0, h * 0.7, 0]);
  const ribs = union(...[0.55, 0.7, 0.85].map((t) => move(torus(0.026, 0.003, grip), [0, h * t + h * 0.2, 0])));
  const eyeLens = move(cylinder(0.012, 0.004, 0, mat(0x6a8ab8, 0.02, 0.5)), [0, h * 1.2, 0]);
  return union(barrel, body, ribs, eyeLens);
};
const mountPart: Build = (seed, index) => {
  const r = rng(seed);
  const m = metal(r);
  switch (index % 3) {
    case 0: // counterweight on a shaft
      return union(cylinder(range(r, 0.06, 0.1), range(r, 0.05, 0.1), 0.006, m), capsule([0, -0.2, 0], [0, 0.2, 0], 0.012, 0.012, mat(0xc9ccd1, 0.2, 1)), move(capsule([0.06, 0, 0], [0.1, 0, 0], 0.008, 0.008, mat(0xc49a4a, 0.3, 1)), [0, 0, 0]));
    case 1: // bearing
      return union(subtract(cylinder(0.06, 0.03, 0.004, m), cylinder(0.035, 0.1)), radial(move(sphere(0.009, mat(0xdfe6ea, 0.1, 1)), [0.047, 0, 0]), 12));
    default: // saddle clamp
      return union(box(0.2, 0.03, 0.08, 0.006, m), mirrorX(move(rotate(box(0.03, 0.05, 0.08, 0.006, m), [0, 0, 0.5]), [0.1, 0.02, 0])), move(rotate(cylinder(0.012, 0.06, 0.003, mat(0xc49a4a, 0.3, 1)), [0, 0, Math.PI / 2]), [0.13, 0.03, 0]));
  }
};

export const project = { id: "11-unscheduled-maintenance", name: "UNSCHEDULED MAINTENANCE", background: 0x14171f };
export const families: Recipes["families"] = [
  { id: "mirror-cell", count: 12, voxel: 0.0025, keep: 0.3, hero: true, build: mirrorCell },
  { id: "spider-vane", count: 10, voxel: 0.002, keep: 0.3, build: spider },
  { id: "focuser", count: 12, voxel: 0.0012, keep: 0.3, build: focuser },
  { id: "eyepiece", count: 32, voxel: 0.0008, keep: 0.3, build: eyepiece },
  { id: "mount-part", count: 36, voxel: 0.002, keep: 0.3, build: mountPart },
];
export const textures: Recipes["textures"] = [
  { id: "anodised-blue", ramp: [0x121a26, 0x1f2a3a, 0x2a3a4f], layers: [{ kind: "fibres", scale: 128, stretch: 24 }, { kind: "fbm", scale: 8, weight: 0.2 }], roughness: [0.25, 0.4], normal: 0.3 },
  { id: "machined-steel", ramp: [0x8a8e94, 0xc9ccd1, 0xe6e8eb], layers: [{ kind: "grain", rings: 120, warp: 0.05 }, { kind: "fbm", scale: 16, weight: 0.3 }], roughness: [0.15, 0.3], normal: 0.4 },
  { id: "knurled-grip", ramp: [0x0e0e0e, 0x1a1a1a, 0x2a2a2a], layers: [{ kind: "weave", count: 96 }], roughness: [0.6, 0.85], normal: 3 },
];
