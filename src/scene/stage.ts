import gsap from "gsap";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { CONSTELLATIONS } from "../game/constellations";
import type { Level, States, Trace } from "../game/types";
import { BeamLayer } from "./beams";
import { buildBench, disposeGroup, toWorld } from "./bench";
import { CameraRig, type Insets } from "./camera";
import { ConstellationLayer, type SkyCue } from "./constellations";
import { Opening } from "./opening";
import { BEAM_Y, PALETTE } from "./palette";
import { buildPiece, type PieceView, rotationGoal, setLit } from "./pieces";
import { disposeTree } from "./resources";
import { buildSky, type StarField } from "./sky";

// The scene's public face. React calls these methods; the stage never touches game rules.

export class Stage {
  onPick: (id: string, step: 1 | -1) => void = () => {};
  onHover: (id: string | null) => void = () => {};
  onFirstFrame: () => void = () => {};
  onCue: (cue: SkyCue, i: number) => void = () => {};
  still = false;
  readonly opening = new Opening();

  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private rig = new CameraRig();
  private beams = new BeamLayer();
  private figures = new ConstellationLayer();
  private field: StarField;
  private bench: THREE.Group | null = null;
  private views = new Map<string, PieceView>();
  private level: Level | null = null;
  private lights: THREE.PointLight[] = [];
  private focusRing: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  private focusId: string | null = null;
  private hoverId: string | null = null;
  private raycaster = new THREE.Raycaster();
  private timer = new THREE.Timer();
  private frames = 0;
  private revealToken = 0;
  private skyActive = false;
  private disposed = false;
  private environmentTarget: THREE.WebGLRenderTarget;

  constructor(private canvas: HTMLCanvasElement) {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.AgXToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer = renderer;

    const scene = this.scene;
    scene.background = new THREE.Color(PALETTE.night);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    this.environmentTarget = pmrem.fromScene(room, 0.04);
    scene.environment = this.environmentTarget.texture;
    scene.environmentIntensity = 0.16;
    room.dispose();
    pmrem.dispose();

    // Key: moonlight falling through the slit. Fill: a dim hemisphere.
    const key = new THREE.DirectionalLight(PALETTE.moon, 3);
    key.position.set(-3, 12, -7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 5;
    key.shadow.bias = -0.0005;
    const sc = key.shadow.camera;
    sc.left = -6;
    sc.right = 6;
    sc.top = 6;
    sc.bottom = -6;
    sc.near = 1;
    sc.far = 30;
    scene.add(key, new THREE.HemisphereLight(0x2c3a58, 0x050609, 0.5));

    // Pooled warm lights for lit receivers and warning lights for misalignments.
    for (let i = 0; i < 4; i++) {
      const light = new THREE.PointLight(PALETTE.beam, 0, 3.2, 1.6);
      this.lights.push(light);
      scene.add(light);
    }

    const sky = buildSky();
    this.field = sky.field;
    scene.add(sky.group, this.beams.group, this.figures.group);

    this.focusRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.47, 0.018, 8, 64).rotateX(Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: PALETTE.focus, transparent: true, toneMapped: false }),
    );
    this.focusRing.visible = false;
    scene.add(this.focusRing);

    canvas.addEventListener("pointermove", this.handleMove);
    canvas.addEventListener("pointerleave", this.handleLeave);
    canvas.addEventListener("click", this.handleForward);
    canvas.addEventListener("contextmenu", this.handleBackward);
    this.timer.connect(document);
  }

  resize(width: number, height: number, insets: Insets) {
    if (this.disposed) return;
    this.renderer.setSize(width, height, false);
    this.field.uniforms.uPixel.value = this.renderer.getPixelRatio();
    this.rig.resize(width, height, insets);
    // Start drawing only once the canvas has its real size, so the first frame is a true one.
    if (this.frames === 0) this.renderer.setAnimationLoop(this.frame);
  }

  showLevel(level: Level, states: States, trace: Trace, instant: boolean) {
    if (this.disposed) return Promise.resolve();
    this.cancelReveal();
    this.skyActive = false;
    this.setHover(null);
    for (const v of this.views.values()) {
      gsap.killTweensOf(v.pivot.rotation);
      this.scene.remove(v.root);
      disposeGroup(v.root);
    }
    this.views.clear();
    if (this.bench) {
      this.scene.remove(this.bench);
      disposeGroup(this.bench);
    }
    this.level = level;
    this.bench = buildBench(level);
    this.scene.add(this.bench);
    for (const piece of level.pieces) {
      const view = buildPiece(piece);
      view.root.position.copy(toWorld(level, piece.x, piece.y));
      this.views.set(piece.id, view);
      this.scene.add(view.root);
    }
    this.focusId = null;
    this.placeRing();
    this.update(states, trace, true);
    return this.rig.showBench(level, instant);
  }

  update(states: States, trace: Trace, instant = this.still) {
    const level = this.level;
    if (this.disposed || !level) return;
    for (const view of this.views.values()) {
      const pivot = view.pivot;
      const goal = rotationGoal(
        view.piece,
        pivot.rotation.y,
        states[view.piece.id] ?? view.piece.state,
      );
      const delta = goal - pivot.rotation.y;
      gsap.killTweensOf(pivot.rotation);
      if (instant || Math.abs(delta) < 1e-4) pivot.rotation.y = goal;
      else gsap.to(pivot.rotation, { y: goal, duration: 0.22, ease: "power2.out" });
      setLit(view, trace.lit.includes(view.piece.id));
    }
    this.beams.update(level, trace);

    const warm = trace.lit
      .map((id) => this.views.get(id)?.root.position)
      .filter((p): p is THREE.Vector3 => !!p);
    this.lights.forEach((light, i) => {
      const lit = warm[i];
      const fault = this.beams.faults[i - warm.length];
      const at = lit ?? fault;
      light.intensity = at ? (lit ? 2.2 : 1.1) : 0;
      light.color.setHex(lit ? PALETTE.beam : PALETTE.scatter);
      if (at) light.position.set(at.x, BEAM_Y + 0.35, at.z);
    });
  }

  setFocus(id: string | null) {
    this.focusId = id;
    this.placeRing();
  }

  private setHover(id: string | null) {
    if (id === this.hoverId) return;
    this.hoverId = id;
    this.canvas.style.cursor = id ? "pointer" : "";
    this.placeRing();
    this.onHover(id);
  }

  private placeRing() {
    const id = this.hoverId ?? this.focusId;
    const view = id ? this.views.get(id) : undefined;
    this.focusRing.visible = !!view && this.canPick;
    if (view) this.focusRing.position.set(view.root.position.x, 0.02, view.root.position.z);
  }

  private pickAt(e: MouseEvent): string | null {
    if (!this.canPick) return null;
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.rig.camera);
    const picks = [...this.views.values()].flatMap((v) => (v.pick ? [v.pick] : []));
    const hit = this.raycaster.intersectObjects(picks, false)[0];
    return (hit?.object.userData.pieceId as string | undefined) ?? null;
  }

  private handleMove = (e: PointerEvent) => {
    if (e.pointerType === "mouse") this.setHover(this.pickAt(e));
  };

  private get canPick() {
    return !this.disposed && this.opening.phase === "done" && !this.skyActive;
  }

  private handleLeave = () => this.setHover(null);
  private handleForward = (e: MouseEvent) => this.handleClick(e, 1);
  private handleBackward = (e: MouseEvent) => {
    e.preventDefault();
    this.handleClick(e, -1);
  };

  private handleClick(e: MouseEvent, step: 1 | -1) {
    const id = this.pickAt(e);
    if (id) this.onPick(id, step);
  }

  /** Tilt up the slit and draw a repair's constellation. */
  async reveal(index: number, blinks: number) {
    const c = CONSTELLATIONS[index];
    if (!c || this.disposed) return;
    this.cancelReveal();
    const token = this.revealToken;
    this.skyActive = true;
    const final = index === CONSTELLATIONS.length - 1;
    this.setHover(null);
    this.placeRing();
    this.figures.onCue = (cue, i) => this.onCue(cue, i);
    this.onCue("tilt", index);
    await this.rig.lookUp(c.elevation, false, this.still);
    if (token !== this.revealToken) return;
    await this.figures.reveal(index, this.still);
    if (token !== this.revealToken) return;
    if (final) {
      await this.rig.lookUp(56, true, this.still, 3.2);
      if (token !== this.revealToken) return;
      await this.figures.answer(blinks, this.still);
    }
  }

  /** Invalidate continuations before settling the camera and drawing promises. */
  cancelReveal() {
    this.revealToken++;
    this.rig.cancel();
    this.figures.cancel();
  }

  clearSky() {
    this.cancelReveal();
    this.figures.clear();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.cancelReveal();
    for (const view of this.views.values()) gsap.killTweensOf(view.pivot.rotation);
    this.canvas.removeEventListener("pointermove", this.handleMove);
    this.canvas.removeEventListener("pointerleave", this.handleLeave);
    this.canvas.removeEventListener("click", this.handleForward);
    this.canvas.removeEventListener("contextmenu", this.handleBackward);
    this.canvas.style.cursor = "";
    this.opening.onDone = null;
    this.onPick = () => {};
    this.onHover = () => {};
    this.onFirstFrame = () => {};
    this.onCue = () => {};
    this.figures.onCue = () => {};
    this.timer.dispose();
    this.scene.environment = null;
    this.environmentTarget.dispose();
    disposeTree(this.scene, true);
    this.views.clear();
    this.bench = null;
    this.renderer.dispose();
  }

  private frame = () => {
    if (this.disposed) return;
    this.timer.update();
    const time = this.timer.getElapsed();
    const still = this.still;
    this.field.uniforms.uTime.value = time;
    this.field.uniforms.uTwinkle.value = still ? 0 : 1;
    this.beams.tick(time, still);
    this.figures.tick(time, still);
    this.focusRing.material.opacity = this.hoverId
      ? 0.9
      : 0.55 + (still ? 0 : 0.25 * Math.sin(time * 3));
    this.rig.apply(time, still);
    this.opening.update(this.rig.camera, this.timer.getDelta(), still);
    this.renderer.render(this.scene, this.rig.camera);
    if (++this.frames === 1) this.onFirstFrame();
  };
}
