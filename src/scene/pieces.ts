import * as THREE from "three";
import type { Piece } from "../game/types";
import { BEAM_Y, glowMaterial, PALETTE } from "./palette";

// Procedural instrument parts. Each piece's `pivot` turns about Y; state → angle lives here.

const std = (color: number, metalness: number, roughness: number) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness });

const MAT = {
  base: std(PALETTE.darkSteel, 0.7, 0.45),
  steel: std(PALETTE.steel, 0.85, 0.35),
  brass: std(PALETTE.brass, 0.9, 0.3),
  frame: std(0x1a1e27, 0.6, 0.5),
  mirror: std(PALETTE.mirror, 1, 0.04),
  tube: new THREE.MeshStandardMaterial({
    color: 0x11151d,
    metalness: 0.5,
    roughness: 0.6,
    side: THREE.DoubleSide,
  }),
  glass: new THREE.MeshStandardMaterial({
    color: PALETTE.glass,
    metalness: 0.3,
    roughness: 0.05,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
  lens: new THREE.MeshStandardMaterial({
    color: 0x223047,
    emissive: PALETTE.beam,
    emissiveIntensity: 0.9,
    metalness: 0.2,
    roughness: 0.1,
  }),
  pick: new THREE.MeshBasicMaterial({ visible: false }),
};

const G = {
  base: new THREE.CylinderGeometry(0.34, 0.38, 0.08, 40),
  ring: new THREE.TorusGeometry(0.35, 0.022, 10, 48).rotateX(Math.PI / 2),
  post: new THREE.CylinderGeometry(0.035, 0.045, 1, 12),
  pick: new THREE.CylinderGeometry(0.48, 0.48, 1, 16),
};

export interface PieceView {
  piece: Piece;
  root: THREE.Group;
  pivot: THREE.Group;
  pick?: THREE.Mesh;
  lamp?: THREE.MeshStandardMaterial;
  halo?: THREE.Sprite;
}

function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

function post(top: number): THREE.Mesh {
  const m = new THREE.Mesh(G.post, MAT.steel);
  m.scale.y = top - 0.08;
  m.position.y = 0.08 + (top - 0.08) / 2;
  m.castShadow = true;
  return m;
}

function mirrorCell(pivot: THREE.Group, splitter: boolean) {
  if (splitter) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), MAT.glass);
    pane.position.set(0, BEAM_Y, 0);
    pivot.add(pane);
    for (const y of [0.165, -0.165]) pivot.add(box(0.66, 0.03, 0.05, MAT.brass, 0, BEAM_Y + y));
    for (const x of [0.315, -0.315]) pivot.add(box(0.03, 0.33, 0.05, MAT.frame, x, BEAM_Y));
  } else {
    pivot.add(box(0.66, 0.36, 0.05, MAT.frame, 0, BEAM_Y, -0.012));
    pivot.add(box(0.6, 0.3, 0.012, MAT.mirror, 0, BEAM_Y, 0.02));
    pivot.add(box(0.6, 0.3, 0.012, MAT.mirror, 0, BEAM_Y, -0.044));
  }
  pivot.add(post(BEAM_Y - 0.18));
}

function aperture(pivot: THREE.Group) {
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.62, 28, 1, true), MAT.tube);
  tube.rotation.z = Math.PI / 2;
  tube.position.y = BEAM_Y;
  tube.castShadow = true;
  pivot.add(tube);
  for (const x of [-0.31, 0.31]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.022, 8, 28), MAT.brass);
    rim.rotation.y = Math.PI / 2;
    rim.position.set(x, BEAM_Y, 0);
    pivot.add(rim);
  }
  pivot.add(post(BEAM_Y - 0.15));
}

function source(pivot: THREE.Group) {
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.8, 32), MAT.brass);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(-0.05, BEAM_Y, 0);
  barrel.castShadow = true;
  pivot.add(barrel);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.17, 32), MAT.lens);
  lens.rotation.y = Math.PI / 2;
  lens.position.set(0.355, BEAM_Y, 0);
  pivot.add(lens);
  pivot.add(box(0.12, BEAM_Y - 0.1, 0.3, MAT.frame, -0.1, (BEAM_Y + 0.02) / 2));
}

function receiver(view: PieceView) {
  const { pivot } = view;
  pivot.add(box(0.42, 0.4, 0.44, MAT.frame, -0.04, BEAM_Y, 0));
  pivot.add(box(0.05, 0.46, 0.5, MAT.steel, -0.27, BEAM_Y, 0));
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.08, 28), MAT.steel);
  lens.rotation.z = Math.PI / 2;
  lens.position.set(0.2, BEAM_Y, 0);
  pivot.add(lens);
  const lamp = new THREE.MeshStandardMaterial({
    color: 0x0c1018,
    emissive: PALETTE.lampOff,
    emissiveIntensity: 1,
    roughness: 0.2,
  });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 12), lamp);
  bulb.position.set(-0.04, BEAM_Y + 0.25, 0);
  pivot.add(bulb);
  pivot.add(box(0.3, BEAM_Y - 0.2, 0.3, MAT.base, -0.04, (BEAM_Y - 0.2) / 2 + 0.08));
  view.lamp = lamp;
  const halo = new THREE.Sprite(glowMaterial(PALETTE.beam, 0));
  halo.scale.setScalar(0.9);
  halo.position.set(0, BEAM_Y + 0.25, 0);
  view.root.add(halo);
  view.halo = halo;
}

function strut(root: THREE.Group) {
  root.add(box(0.2, 1.3, 0.2, MAT.frame, 0, 0.65, 0));
  root.add(box(0.3, 0.06, 0.3, MAT.steel, 0, 1.3, 0));
  root.add(box(0.36, 0.1, 0.36, MAT.base, 0, 0.05, 0));
}

/** Angle of a piece's pivot for a given state. */
export function angleFor(piece: Piece, state: number): number {
  switch (piece.kind) {
    case "mirror":
    case "splitter":
      return (state * Math.PI) / 4;
    case "aperture":
      return (state * Math.PI) / 2;
    case "source":
    case "receiver":
      return ((1 - state) * Math.PI) / 2;
    default:
      return 0;
  }
}

export function buildPiece(piece: Piece): PieceView {
  const root = new THREE.Group();
  const pivot = new THREE.Group();
  root.add(pivot);
  const view: PieceView = { piece, root, pivot };
  if (piece.kind !== "strut") {
    const base = new THREE.Mesh(G.base, MAT.base);
    base.position.y = 0.04;
    base.receiveShadow = true;
    root.add(base);
  }
  if (!piece.fixed) {
    const ring = new THREE.Mesh(G.ring, MAT.brass);
    ring.position.y = 0.085;
    root.add(ring);
    const pick = new THREE.Mesh(G.pick, MAT.pick);
    pick.position.y = 0.45;
    pick.userData.pieceId = piece.id;
    root.add(pick);
    view.pick = pick;
  }
  if (piece.kind === "mirror") mirrorCell(pivot, false);
  else if (piece.kind === "splitter") mirrorCell(pivot, true);
  else if (piece.kind === "aperture") aperture(pivot);
  else if (piece.kind === "source") source(pivot);
  else if (piece.kind === "receiver") receiver(view);
  else strut(root);
  pivot.rotation.y = angleFor(piece, piece.state);
  return view;
}

export function setLit(view: PieceView, lit: boolean) {
  if (!view.lamp || !view.halo) return;
  view.lamp.emissive.setHex(lit ? PALETTE.beam : PALETTE.lampOff);
  view.lamp.emissiveIntensity = lit ? 3 : 1;
  view.halo.material.opacity = lit ? 0.85 : 0;
}
