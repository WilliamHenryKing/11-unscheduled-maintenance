import * as THREE from "three";

const query = new URLSearchParams(location.search);
export const wantsTitle = query.has("intro") || (!import.meta.env.DEV && !query.has("e2e"));
export type OpeningPhase = "title" | "glide" | "done";
const ease = (value: number) => {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

/** Move along the broken light path, then rise to see the whole instrument. */
export class Opening {
  phase: OpeningPhase = wantsTitle ? "title" : "done";
  onDone: (() => void) | null = null;
  private time = 0;
  private eye = new THREE.Vector3();
  private rotation = new THREE.Quaternion();
  private from = new THREE.Vector3();
  private to = new THREE.Vector3();
  private fov = 44;

  begin(reduced: boolean) {
    if (this.phase !== "title") return;
    this.phase = reduced ? "done" : "glide";
    this.time = 0;
    if (reduced) this.onDone?.();
  }

  /** The rig supplies the normal pose and HUD offsets before each call. */
  update(camera: THREE.PerspectiveCamera, dt: number, reduced: boolean) {
    if (this.phase === "done") return;
    const veil = document.getElementById("arrival");
    if (!veil || veil.classList.contains("is-done")) this.time += Math.min(dt, 0.05);
    const phone = camera.aspect < 0.8;
    const normalX = camera.view?.offsetX ?? 0;
    const normalY = camera.view?.offsetY ?? 0;
    let weight = 1;
    if (this.phase === "title") {
      const t = reduced ? 1 : ease(this.time / 10);
      this.from.set(-4.5, 1.5, phone ? 11 : 5.8);
      this.to.set(phone ? 5 : 5.8, phone ? 7.5 : 4.3, phone ? 16 : 9.2);
      camera.position.copy(this.from).lerp(this.to, t);
      if (!reduced) camera.position.y += Math.sin(this.time * 0.22) * 0.06;
      this.from.set(-0.8, 0.5, -0.6);
      this.to.set(0, 0.2, 0);
      camera.lookAt(this.from.lerp(this.to, t));
      camera.fov = 44;
      this.eye.copy(camera.position);
      this.rotation.copy(camera.quaternion);
      this.fov = camera.fov;
    } else {
      const t = reduced ? 1 : ease(this.time / 2.8);
      camera.position.lerp(this.eye, 1 - t);
      camera.position.y += Math.sin(Math.PI * t) * 0.8;
      camera.quaternion.slerp(this.rotation, 1 - t);
      camera.fov = THREE.MathUtils.lerp(this.fov, camera.fov, t);
      weight = 1 - t;
      if (t === 1) {
        this.phase = "done";
        this.onDone?.();
      }
    }
    camera.setViewOffset(
      innerWidth,
      innerHeight,
      THREE.MathUtils.lerp(normalX, phone ? 0 : -innerWidth * 0.2, weight),
      THREE.MathUtils.lerp(normalY, phone ? -innerHeight * 0.2 : 0, weight),
      innerWidth,
      innerHeight,
    );
    camera.updateProjectionMatrix();
  }
}
