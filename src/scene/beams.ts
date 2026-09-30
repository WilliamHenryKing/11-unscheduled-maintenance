import * as THREE from "three";
import type { Level, Mark, Trace } from "../game/types";
import { toWorld } from "./bench";
import { BEAM_Y, glowMaterial, PALETTE } from "./palette";
import { shared } from "./resources";

// The visible light path: a hot core, a soft halo, glints where it turns and marks where it fails.

const UNIT = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
const coreMat = new THREE.MeshBasicMaterial({ color: PALETTE.beam, toneMapped: false });
coreMat.color.multiplyScalar(2.2);
const haloMat = new THREE.MeshBasicMaterial({
  color: PALETTE.beam,
  transparent: true,
  opacity: 0.16,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  toneMapped: false,
});
const sprayMat = new THREE.MeshBasicMaterial({
  color: PALETTE.scatter,
  transparent: true,
  opacity: 0.5,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  toneMapped: false,
});
shared(UNIT);
for (const material of [coreMat, haloMat, sprayMat]) shared(material);

const MARK_STYLE: Record<Mark["kind"], { color: number; size: number; opacity: number }> = {
  lit: { color: PALETTE.beam, size: 0.9, opacity: 1 },
  scatter: { color: PALETTE.scatter, size: 1.1, opacity: 1 },
  stopped: { color: PALETTE.scatter, size: 0.55, opacity: 0.8 },
  backside: { color: PALETTE.scatter, size: 0.7, opacity: 0.85 },
  blocked: { color: PALETTE.beam, size: 0.45, opacity: 0.6 },
  lost: { color: PALETTE.beam, size: 0.5, opacity: 0.35 },
};

export interface Glint {
  sprite: THREE.Sprite;
  kind: Mark["kind"] | "turn";
  base: number;
}

export class BeamLayer {
  readonly group = new THREE.Group();
  glints: Glint[] = [];
  /** World positions where light is wasted, for the scene's warning lights. */
  faults: THREE.Vector3[] = [];

  update(level: Level, trace: Trace) {
    for (const child of [...this.group.children]) {
      this.group.remove(child);
      if (child instanceof THREE.Sprite) child.material.dispose();
    }
    this.glints = [];
    this.faults = [];

    for (const s of trace.segments) {
      const a = toWorld(level, s.x0, s.y0, BEAM_Y);
      const b = toWorld(level, s.x1, s.y1, BEAM_Y);
      const len = a.distanceTo(b);
      if (len < 0.001) continue;
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const horizontal = Math.abs(b.x - a.x) > Math.abs(b.z - a.z);
      for (const [mat, r] of [
        [coreMat, 0.022],
        [haloMat, 0.085],
      ] as const) {
        const mesh = new THREE.Mesh(UNIT, mat);
        mesh.position.copy(mid);
        mesh.scale.set(r, len, r);
        if (horizontal) mesh.rotation.z = Math.PI / 2;
        else mesh.rotation.x = Math.PI / 2;
        this.group.add(mesh);
      }
      if (s.end === "mirror" || s.end === "splitter")
        this.glint(b, "turn", PALETTE.beam, 0.55, 0.7);
    }

    for (const m of trace.marks) {
      const style = MARK_STYLE[m.kind];
      const p = toWorld(level, m.x, m.y, BEAM_Y);
      this.glint(p, m.kind, style.color, style.size, style.opacity);
      if (m.kind === "scatter") this.spray(p, m.x * 7 + m.y * 13);
      if (m.kind === "scatter" || m.kind === "backside" || m.kind === "stopped")
        this.faults.push(p);
    }
  }

  private glint(p: THREE.Vector3, kind: Glint["kind"], color: number, size: number, base: number) {
    const sprite = new THREE.Sprite(glowMaterial(color, base));
    sprite.position.copy(p);
    sprite.scale.setScalar(size);
    this.group.add(sprite);
    this.glints.push({ sprite, kind, base });
  }

  /** A few short stray rays fanning out from a misaligned mirror. */
  private spray(p: THREE.Vector3, seed: number) {
    for (let i = 0; i < 6; i++) {
      const angle = seed + i * 1.047 + Math.sin(seed + i) * 0.4;
      const tilt = Math.sin(seed * 3 + i) * 0.35;
      const len = 0.35 + 0.2 * Math.abs(Math.sin(seed + i * 2));
      const mesh = new THREE.Mesh(UNIT, sprayMat);
      mesh.scale.set(0.01, len, 0.01);
      const dir = new THREE.Vector3(Math.cos(angle), tilt, Math.sin(angle)).normalize();
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      mesh.position.copy(p).addScaledVector(dir, len / 2 + 0.05);
      this.group.add(mesh);
    }
  }

  /** Gentle shimmer; misalignments pulse so the eye finds them. */
  tick(time: number, still: boolean) {
    for (const g of this.glints) {
      const mat = g.sprite.material;
      if (still) mat.opacity = g.base;
      else if (g.kind === "scatter" || g.kind === "backside" || g.kind === "stopped")
        mat.opacity = g.base * (0.55 + 0.45 * Math.sin(time * 5));
      else mat.opacity = g.base * (0.9 + 0.1 * Math.sin(time * 13 + g.sprite.position.x * 3));
    }
    haloMat.opacity = still ? 0.16 : 0.15 + 0.02 * Math.sin(time * 9);
  }
}
