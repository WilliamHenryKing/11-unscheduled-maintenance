import { expect, test } from "bun:test";
import { nearestMirrorAngle } from "../src/ui/iconRotation";

test("repeated counter-clockwise mirror turns stay 45 degrees through the 3-to-0 wrap", () => {
  let angle = 0;
  for (let step = 1; step <= 12; step++) {
    const next = nearestMirrorAngle(angle, -(step % 4) * 45);
    expect(next - angle).toBe(-45);
    angle = next;
  }
});

test("clockwise reverse wraps do not spin the mirror icon through 135 degrees", () => {
  let angle = 0;
  for (let step = 1; step <= 12; step++) {
    const next = nearestMirrorAngle(angle, -((4 - (step % 4)) % 4) * 45);
    expect(next - angle).toBe(45);
    angle = next;
  }
});
