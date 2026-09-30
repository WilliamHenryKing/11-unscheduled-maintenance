import gsap from "gsap";
import * as THREE from "three";
import type { Level } from "../game/types";
import { slitDirection } from "./sky";

// One camera, two places to look: down at the bench, or up through the dome slit.

export interface Insets {
  top: number;
  bottom: number;
  right: number;
}

interface Pose {
  pos: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

const BASE_FOV = 38;
const SKY_EYE = new THREE.Vector3(0, 1.2, 3.5);

export class CameraRig {
  readonly camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.1, 600);
  private pose: Pose = { pos: new THREE.Vector3(0, 9, 9), target: new THREE.Vector3(), fov: 38 };
  private level: Level | null = null;
  private sky: Pose | null = null;
  private skyArgs: [number, boolean] = [50, false];
  private width = 1;
  private height = 1;
  private insets: Insets = { top: 0, bottom: 0, right: 0 };
  private tween: gsap.core.Tween | null = null;
  private destination: Pose | null = null;
  private settle: (() => void) | null = null;

  resize(width: number, height: number, insets: Insets) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.insets = { ...insets };
    if (this.sky) this.sky = this.skyPose(...this.skyArgs);
    const fitted = this.sky ?? this.benchPose();
    if (this.tween) this.destination = fitted;
    else this.pose = fitted;
  }

  private get portrait() {
    return this.width / this.height < 0.8;
  }

  /** Fit the whole bench into the part of the screen the HUD leaves free. */
  private benchPose(): Pose {
    const level = this.level;
    const fov = BASE_FOV;
    const t = Math.tan(THREE.MathUtils.degToRad(fov / 2));
    const freeH = Math.max(this.height * 0.4, this.height - this.insets.top - this.insets.bottom);
    const freeW = Math.max(this.width * 0.5, this.width - this.insets.right);
    const tv = (t * freeH) / this.height;
    const th = (t * freeW) / this.height;
    const w = (level?.width ?? 6) + 1.2;
    const d = (level?.height ?? 4) + 1.2;
    const el = THREE.MathUtils.degToRad(this.portrait ? 68 : 57);
    const halfV = (d * Math.sin(el) + 1.4 * Math.cos(el)) / 2;
    const dist = Math.max(halfV / tv, w / 2 / th + (d / 2) * Math.cos(el) * 0.6) * 1.08;
    const target = new THREE.Vector3(0, 0.25, 0.1);
    const pos = target
      .clone()
      .add(new THREE.Vector3(0, Math.sin(el), Math.cos(el)).multiplyScalar(dist));
    return { pos, target, fov };
  }

  private skyPose(elevation: number, wide: boolean): Pose {
    const fov = wide ? (this.portrait ? 96 : 74) : this.portrait ? 50 : 36;
    const target = SKY_EYE.clone().add(slitDirection(elevation).multiplyScalar(100));
    return { pos: SKY_EYE.clone(), target, fov };
  }

  private moveTo(to: Pose, instant: boolean, duration = 2.4): Promise<void> {
    this.cancel();
    if (instant) {
      this.pose = to;
      return Promise.resolve();
    }
    const from = {
      pos: this.pose.pos.clone(),
      target: this.pose.target.clone(),
      fov: this.pose.fov,
    };
    const live: Pose = { pos: from.pos.clone(), target: from.target.clone(), fov: from.fov };
    this.pose = live;
    const p = { t: 0 };
    this.destination = to;
    return new Promise((resolve) => {
      this.settle = resolve;
      this.tween = gsap.to(p, {
        t: 1,
        duration,
        ease: "power2.inOut",
        onUpdate: () => {
          const destination = this.destination ?? to;
          live.pos.lerpVectors(from.pos, destination.pos, p.t);
          live.target.lerpVectors(from.target, destination.target, p.t);
          live.fov = from.fov + (destination.fov - from.fov) * p.t;
        },
        onComplete: () => {
          this.tween = null;
          this.pose = this.destination ?? to;
          this.destination = null;
          this.settle = null;
          resolve();
        },
      });
    });
  }

  /** Interrupted moves settle too, so their callers can discard stale continuations. */
  cancel() {
    this.tween?.kill();
    this.tween = null;
    this.destination = null;
    const settle = this.settle;
    this.settle = null;
    settle?.();
  }

  showBench(level: Level, instant: boolean): Promise<void> {
    this.level = level;
    this.sky = null;
    return this.moveTo(this.benchPose(), instant);
  }

  lookUp(elevation: number, wide: boolean, instant: boolean, duration?: number): Promise<void> {
    this.skyArgs = [elevation, wide];
    this.sky = this.skyPose(elevation, wide);
    return this.moveTo(this.sky, instant, duration);
  }

  apply(time: number, still: boolean) {
    const { pos, target, fov } = this.pose;
    const cam = this.camera;
    cam.position.copy(pos);
    if (!still && !this.sky && !this.tween) {
      cam.position.x += Math.sin(time * 0.17) * 0.35;
      cam.position.y += Math.sin(time * 0.23) * 0.12;
    }
    cam.lookAt(target);
    if (cam.fov !== fov || cam.aspect !== this.width / this.height) {
      cam.fov = fov;
      cam.aspect = this.width / this.height;
    }
    const { top, bottom, right } = this.insets;
    const ox = this.sky ? 0 : right / 2;
    const oy = (bottom - top) / 2;
    cam.setViewOffset(this.width, this.height, ox, oy, this.width, this.height);
  }
}
