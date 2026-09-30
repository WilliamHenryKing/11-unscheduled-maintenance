import { afterEach, describe, expect, test } from "bun:test";
import gsap from "gsap";
import { LEVELS } from "../src/game/levels";
import { CameraRig } from "../src/scene/camera";

const level = LEVELS[0];
if (!level) throw new Error("first repair missing");
const desktop = { top: 80, bottom: 16, right: 340 };
const phone = { top: 82, bottom: 240, right: 0 };
const rigs: CameraRig[] = [];
function rig() {
  const result = new CameraRig();
  rigs.push(result);
  result.resize(1440, 900, desktop);
  return result;
}

function newTween(before: gsap.core.Animation[]) {
  const tween = gsap.globalTimeline
    .getChildren(false, true, false)
    .find((t) => !before.includes(t));
  if (!tween) throw new Error("camera move did not schedule a tween");
  return tween.pause();
}

afterEach(() => {
  for (const camera of rigs) camera.cancel();
  rigs.length = 0;
  gsap.ticker.sleep();
});

describe("camera move lifecycle", () => {
  test("a new bench move settles an interrupted sky move immediately", async () => {
    const moving = rig();
    let settled = false;
    void moving.lookUp(30, false, false).then(() => {
      settled = true;
    });
    await moving.showBench(level, true);
    expect(settled).toBe(true);
    const reference = rig();
    await reference.showBench(level, true);
    moving.apply(0, true);
    reference.apply(0, true);
    expect(moving.camera.position.distanceTo(reference.camera.position)).toBeLessThan(1e-9);
  });

  test("explicit cancellation settles a move without waiting for its old duration", async () => {
    const moving = rig();
    let settled = false;
    void moving.lookUp(66, false, false).then(() => {
      settled = true;
    });
    moving.cancel();
    await Promise.resolve();
    expect(settled).toBe(true);
  });

  test("resizing during a bench flight finishes at the current phone fit", async () => {
    const moving = rig();
    const before = gsap.globalTimeline.getChildren(false, true, false);
    const flight = moving.showBench(level, false);
    const tween = newTween(before);
    tween.progress(0.4);
    moving.resize(320, 568, phone);
    tween.progress(1);
    await flight;
    moving.apply(0, true);

    const reference = rig();
    reference.resize(320, 568, phone);
    await reference.showBench(level, true);
    reference.apply(0, true);
    expect(moving.camera.position.distanceTo(reference.camera.position)).toBeLessThan(1e-9);
    expect(moving.camera.quaternion.angleTo(reference.camera.quaternion)).toBeLessThan(1e-7);
    expect(moving.camera.view).toEqual(reference.camera.view);
  });

  test("a portrait resize during the finale uses the portrait field of view", async () => {
    const moving = rig();
    const before = gsap.globalTimeline.getChildren(false, true, false);
    const flight = moving.lookUp(56, true, false);
    const tween = newTween(before);
    tween.progress(0.4);
    moving.resize(320, 568, phone);
    tween.progress(1);
    await flight;
    moving.apply(0, true);
    expect(moving.camera.fov).toBe(96);
    expect(moving.camera.aspect).toBe(320 / 568);
  });
});
