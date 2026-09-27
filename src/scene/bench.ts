import * as THREE from "three";
import type { Level } from "../game/types";
import { PALETTE } from "./palette";

/** Grid cell (or fractional grid point) → world position on the bench top. */
export function toWorld(level: Level, x: number, y: number, height = 0): THREE.Vector3 {
  return new THREE.Vector3(x - (level.width - 1) / 2, height, y - (level.height - 1) / 2);
}

const plateMat = new THREE.MeshStandardMaterial({
  color: PALETTE.bench,
  metalness: 0.55,
  roughness: 0.62,
});
const edgeMat = new THREE.MeshStandardMaterial({
  color: PALETTE.benchEdge,
  metalness: 0.8,
  roughness: 0.35,
});
const lineMat = new THREE.LineBasicMaterial({
  color: PALETTE.engraving,
  transparent: true,
  opacity: 0.55,
});
const holeMat = new THREE.MeshBasicMaterial({ color: 0x07090d });

/** Optical breadboard: anodised plate, engraved cell grid, tapped holes, brass trim and pedestal. */
export function buildBench(level: Level): THREE.Group {
  const group = new THREE.Group();
  const w = level.width + 0.9;
  const d = level.height + 0.9;

  const plate = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, d), plateMat);
  plate.position.y = -0.11;
  plate.receiveShadow = true;
  group.add(plate);

  const lip = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.08, d + 0.12), edgeMat);
  lip.position.y = -0.2;
  lip.receiveShadow = true;
  group.add(lip);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.9, 2.2, 32),
    new THREE.MeshStandardMaterial({ color: 0x0e1219, metalness: 0.4, roughness: 0.7 }),
  );
  pedestal.position.y = -1.34;
  group.add(pedestal);

  // Engraved cell borders.
  const pts: number[] = [];
  const x0 = -level.width / 2;
  const z0 = -level.height / 2;
  for (let i = 0; i <= level.width; i++) pts.push(x0 + i, 0.002, z0, x0 + i, 0.002, -z0);
  for (let j = 0; j <= level.height; j++) pts.push(x0, 0.002, z0 + j, -x0, 0.002, z0 + j);
  const lines = new THREE.BufferGeometry();
  lines.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  group.add(new THREE.LineSegments(lines, lineMat));

  // Tapped holes at every cell corner.
  const corners = (level.width + 1) * (level.height + 1);
  const holes = new THREE.InstancedMesh(new THREE.CircleGeometry(0.04, 12), holeMat, corners);
  const m = new THREE.Matrix4();
  const rot = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
  let k = 0;
  for (let i = 0; i <= level.width; i++) {
    for (let j = 0; j <= level.height; j++) {
      m.makeTranslation(x0 + i, 0.003, z0 + j).multiply(rot);
      holes.setMatrixAt(k++, m);
    }
  }
  group.add(holes);
  return group;
}

export function disposeGroup(group: THREE.Object3D) {
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) obj.geometry.dispose();
  });
}
