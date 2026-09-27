import gsap from "gsap";
import * as THREE from "three";
import { ANSWERING_STAR, CONSTELLATIONS, type Constellation } from "../game/constellations";
import { glowMaterial, PALETTE } from "./palette";
import { slitDirection } from "./sky";

// Star figures beyond the slit. Hidden until their repair is done, then drawn star by star.

export const FIGURE_DISTANCE = 150;

const LINE_GEO = new THREE.PlaneGeometry(1, 1).translate(0.5, 0, 0);

interface Figure {
  group: THREE.Group;
  stars: THREE.Sprite[];
  lines: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[];
  lengths: number[];
}

function build(c: Constellation): Figure {
  const group = new THREE.Group();
  group.position.copy(slitDirection(c.elevation).multiplyScalar(FIGURE_DISTANCE));
  group.lookAt(0, 0, 0);
  const half = FIGURE_DISTANCE * Math.tan(THREE.MathUtils.degToRad(c.size));
  const pts = c.stars.map(([x, y]) => new THREE.Vector3(x * half, y * half, 0));
  const lineMat = new THREE.MeshBasicMaterial({
    color: PALETTE.starLine,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const lines: Figure["lines"] = [];
  const lengths: number[] = [];
  for (const [a, b] of c.lines) {
    const pa = pts[a];
    const pb = pts[b];
    if (!pa || !pb) continue;
    const mesh = new THREE.Mesh(LINE_GEO, lineMat);
    mesh.position.copy(pa);
    mesh.rotation.z = Math.atan2(pb.y - pa.y, pb.x - pa.x);
    lengths.push(pa.distanceTo(pb));
    mesh.scale.set(0.0001, 0.32, 1);
    mesh.visible = false;
    group.add(mesh);
    lines.push(mesh);
  }
  const stars = pts.map((p, i) => {
    const s = new THREE.Sprite(glowMaterial(0xf2f5ff, 0));
    s.position.copy(p);
    s.userData.size = i % 3 === 0 ? 5.2 : 3.8;
    s.scale.setScalar(0.01);
    group.add(s);
    return s;
  });
  group.visible = false;
  return { group, stars, lines, lengths };
}

export type SkyCue = "tilt" | "star" | "answer" | "discovery";

export class ConstellationLayer {
  readonly group = new THREE.Group();
  /** Timing hooks for sound; `i` counts stars or blinks. */
  onCue: (cue: SkyCue, i: number) => void = () => {};
  private figures: Figure[] = CONSTELLATIONS.map(build);
  private answering: THREE.Sprite | null = null;
  private tl: gsap.core.Timeline | null = null;

  constructor() {
    for (const f of this.figures) this.group.add(f.group);
  }

  /** Draw a figure. Resolves when the last line is in place. */
  reveal(index: number, instant: boolean): Promise<void> {
    const f = this.figures[index];
    if (!f) return Promise.resolve();
    f.group.visible = true;
    this.tl?.progress(1);
    const done = () => {
      f.stars.forEach((s) => {
        s.scale.setScalar(s.userData.size);
        s.material.opacity = 1;
      });
      f.lines.forEach((l, i) => {
        l.visible = true;
        l.scale.x = f.lengths[i] ?? 0;
      });
    };
    if (instant) {
      done();
      this.onCue("star", 0);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      f.stars.forEach((s, i) => {
        tl.call(() => this.onCue("star", i), [], 0.12 * i);
        tl.to(s.material, { opacity: 1, duration: 0.5 }, 0.12 * i);
        tl.to(s.scale, { x: s.userData.size, y: s.userData.size, duration: 0.6 }, 0.12 * i);
      });
      const start = 0.12 * f.stars.length + 0.2;
      f.lines.forEach((l, i) => {
        tl.set(l, { visible: true }, start + 0.22 * i);
        tl.to(
          l.scale,
          { x: f.lengths[i] ?? 0, duration: 0.4, ease: "power2.out" },
          start + 0.22 * i,
        );
      });
      this.tl = tl;
    });
  }

  /** The finale's discovery: one star of The Instrument blinks back, once per repair turn. */
  answer(blinks: number, instant: boolean) {
    const f = this.figures[this.figures.length - 1];
    const star = f?.stars[ANSWERING_STAR];
    if (!star) return;
    this.answering = star;
    star.material.color.setHex(PALETTE.beam);
    this.onCue("discovery", 0);
    if (instant) {
      this.onCue("answer", 0);
      return;
    }
    const big = star.userData.size * 2.4;
    const tl = gsap.timeline({ delay: 1.2 });
    for (let i = 0; i < blinks; i++) {
      tl.call(() => this.onCue("answer", i));
      tl.to(star.scale, { x: big, y: big, duration: 0.14, ease: "power2.out" });
      tl.to(star.scale, { x: star.userData.size, y: star.userData.size, duration: 0.3 });
    }
  }

  tick(time: number, still: boolean) {
    const s = this.answering;
    if (!s || still || gsap.isTweening(s.scale)) return;
    const k = s.userData.size * (1.15 + 0.2 * Math.sin(time * 1.6));
    s.scale.set(k, k, 1);
  }

  clear() {
    this.tl?.kill();
    this.tl = null;
    this.answering = null;
    for (const f of this.figures) {
      gsap.killTweensOf(f.stars.map((s) => s.scale));
      f.group.visible = false;
      for (const s of f.stars) {
        s.material.opacity = 0;
        s.material.color.setHex(0xf2f5ff);
        s.scale.setScalar(0.01);
      }
      for (const l of f.lines) {
        l.visible = false;
        l.scale.x = 0.0001;
      }
    }
  }
}
