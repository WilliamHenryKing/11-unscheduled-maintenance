import { afterEach, describe, expect, test } from "bun:test";
import gsap from "gsap";
import * as THREE from "three";
import { ConstellationLayer } from "../src/scene/constellations";
import { disposeTree } from "../src/scene/resources";
import { withCanvasDocument } from "./sceneFixture";

const layers: ConstellationLayer[] = [];
function layer() {
  const result = withCanvasDocument(() => new ConstellationLayer());
  layers.push(result);
  return result;
}
afterEach(() => {
  for (const figure of layers) {
    figure.clear();
    disposeTree(figure.group);
  }
  layers.length = 0;
  gsap.ticker.sleep();
});

describe("constellation reveal lifecycle", () => {
  test("clearing a drawing settles its promise and keeps the stars hidden", async () => {
    const figures = layer();
    let settled = false;
    void figures.reveal(0, false).then(() => {
      settled = true;
    });
    figures.clear();
    await Promise.resolve();
    expect(settled).toBe(true);
    gsap.globalTimeline.totalTime(gsap.globalTimeline.time() + 10);
    expect(figures.group.children.every((f) => !f.visible)).toBe(true);
    figures.group.traverse((object) => {
      if (object instanceof THREE.Sprite) expect(object.material.opacity).toBe(0);
    });
  });

  test("a replacement drawing releases the old waiter without firing its queued cues", async () => {
    const figures = layer();
    const cues: string[] = [];
    figures.onCue = (cue) => cues.push(cue);
    let settled = false;
    void figures.reveal(0, false).then(() => {
      settled = true;
    });
    await figures.reveal(1, true);
    expect(settled).toBe(true);
    gsap.globalTimeline.totalTime(gsap.globalTimeline.time() + 10);
    expect(cues).toEqual(["star"]);
  });

  test("clearing the finale cancels every delayed answering blink and settles the answer", async () => {
    const figures = layer();
    await figures.reveal(5, true);
    const cues: string[] = [];
    figures.onCue = (cue) => cues.push(cue);
    let settled = false;
    void figures.answer(6, false).then(() => {
      settled = true;
    });
    figures.clear();
    await Promise.resolve();
    gsap.globalTimeline.totalTime(gsap.globalTimeline.time() + 10);
    expect(settled).toBe(true);
    expect(cues).toEqual(["discovery"]);
    expect(figures.group.children.every((f) => !f.visible)).toBe(true);
  });
});
