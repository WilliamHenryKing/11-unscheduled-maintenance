import { describe, expect, test } from "bun:test";
import * as THREE from "three";
import { LEVELS } from "../src/game/levels";
import { buildBench, disposeGroup } from "../src/scene/bench";
import { buildPiece } from "../src/scene/pieces";
import { disposeTree, shared } from "../src/scene/resources";
import { withCanvasDocument } from "./sceneFixture";

describe("scene resource ownership", () => {
  test("replacing a receiver releases its lamp and halo without releasing cached geometry or glow", () => {
    const piece = LEVELS[0]?.pieces.find((p) => p.kind === "receiver");
    if (!piece) throw new Error("receiver missing");
    const view = withCanvasDocument(() => buildPiece(piece));
    const base = view.root.children.find((o) => o instanceof THREE.Mesh) as THREE.Mesh;
    const texture = view.halo?.material.map;
    const counts = { lamp: 0, halo: 0, cachedGeometry: 0, texture: 0 };
    const geometryDisposed = () => counts.cachedGeometry++;
    const textureDisposed = () => counts.texture++;
    base.geometry.addEventListener("dispose", geometryDisposed);
    texture?.addEventListener("dispose", textureDisposed);
    view.lamp?.addEventListener("dispose", () => counts.lamp++);
    view.halo?.material.addEventListener("dispose", () => counts.halo++);
    disposeGroup(view.root);
    expect(counts).toEqual({ lamp: 1, halo: 1, cachedGeometry: 0, texture: 0 });
    expect(view.root.children).toHaveLength(0);
    base.geometry.removeEventListener("dispose", geometryDisposed);
    texture?.removeEventListener("dispose", textureDisposed);
  });

  test("replacing the bench releases pedestal material and instanced hole buffers", () => {
    const level = LEVELS[0];
    if (!level) throw new Error("first repair missing");
    const bench = buildBench(level);
    const pedestal = bench.children[2] as THREE.Mesh<THREE.CylinderGeometry, THREE.Material>;
    const holes = bench.children.find((o) => o instanceof THREE.InstancedMesh);
    let materials = 0;
    let instances = 0;
    pedestal.material.addEventListener("dispose", () => materials++);
    holes?.addEventListener("dispose", () => instances++);
    disposeGroup(bench);
    expect(materials).toBe(1);
    expect(instances).toBe(1);
  });

  test("full teardown deduplicates owned resources and includes borrowed caches and shadow maps", () => {
    const geometry = shared(new THREE.BoxGeometry());
    const texture = shared(new THREE.Texture());
    const material = shared(new THREE.MeshBasicMaterial({ map: texture }));
    const scene = new THREE.Scene();
    const instances = new THREE.InstancedMesh(geometry, material, 3);
    scene.add(instances, new THREE.Mesh(geometry, material));
    const light = new THREE.DirectionalLight();
    const shadow = new THREE.WebGLRenderTarget(16, 16);
    light.shadow.map = shadow;
    scene.add(light);
    const spriteMaterial = new THREE.SpriteMaterial();
    const sprite = new THREE.Sprite(spriteMaterial);
    scene.add(sprite, new THREE.Sprite(spriteMaterial));
    const counts = {
      geometry: 0,
      material: 0,
      texture: 0,
      instances: 0,
      shadow: 0,
      spriteGeometry: 0,
    };
    geometry.addEventListener("dispose", () => counts.geometry++);
    material.addEventListener("dispose", () => counts.material++);
    texture.addEventListener("dispose", () => counts.texture++);
    instances.addEventListener("dispose", () => counts.instances++);
    shadow.addEventListener("dispose", () => counts.shadow++);
    const spriteDisposed = () => counts.spriteGeometry++;
    sprite.geometry.addEventListener("dispose", spriteDisposed);
    disposeTree(scene, true);
    expect(counts).toEqual({
      geometry: 1,
      material: 1,
      texture: 1,
      instances: 1,
      shadow: 1,
      spriteGeometry: 1,
    });
    expect(scene.children).toHaveLength(0);
    sprite.geometry.removeEventListener("dispose", spriteDisposed);
  });
});
