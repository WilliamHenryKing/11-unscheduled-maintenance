import { expect, test } from "bun:test";
import { LEVELS } from "../src/game/levels";
import { createGame, reduce } from "../src/game/state";

test("title → playing", () => {
  const game = reduce(createGame(), { type: "start" });
  expect(game.phase).toBe("playing");
  expect(game.level).toBe(0);
});

test("turning the drifted mirror solves the first repair", () => {
  let game = reduce(createGame(), { type: "start" });
  game = reduce(game, { type: "turn", id: "mirror-3-2", step: 1 });
  expect(game.phase).toBe("solved");
  expect(game.turns).toBe(1);
  // No further turns once aligned.
  expect(reduce(game, { type: "turn", id: "mirror-3-2", step: 1 })).toBe(game);
});

test("fixed parts cannot be turned", () => {
  const game = reduce(createGame(), { type: "start" });
  expect(reduce(game, { type: "turn", id: "mirror-3-0", step: 1 })).toBe(game);
});

test("reset restores the drifted start but keeps the turn count", () => {
  let game = reduce(createGame(), { type: "start" });
  game = reduce(game, { type: "turn", id: "mirror-3-2", step: -1 });
  game = reduce(game, { type: "reset" });
  expect(game.states["mirror-3-2"]).toBe(2);
  expect(game.turns).toBe(1);
});

test("a full night ends, then replays from the first repair", () => {
  let game = reduce(createGame(), { type: "start" });
  const winning: Record<string, number>[] = [
    { "mirror-3-2": 3 },
    { "mirror-4-0": 3, "mirror-4-2": 1, "mirror-2-2": 1 },
    { "aperture-2-1": 0, "aperture-4-2": 1, "mirror-4-3": 3 },
    { "mirror-2-2": 1, "mirror-2-0": 1, "mirror-4-0": 3 },
    { "splitter-3-1": 3, "mirror-3-3": 3, "aperture-5-3": 0 },
    { "splitter-2-2": 1, "aperture-3-2": 0, "mirror-5-2": 3, "mirror-5-4": 1, "splitter-2-4": 1 },
  ];
  for (const [i, target] of winning.entries()) {
    expect(game.level).toBe(i);
    for (const [id, want] of Object.entries(target)) {
      let guard = 0;
      while (game.phase === "playing" && game.states[id] !== want && guard++ < 4) {
        game = reduce(game, { type: "turn", id, step: 1 });
      }
    }
    expect(game.phase).toBe("solved");
    game = reduce(game, { type: "next" });
  }
  expect(game.phase).toBe("ending");
  expect(game.totalTurns).toBeGreaterThan(LEVELS.length);
  game = reduce(game, { type: "start" });
  expect(game).toMatchObject({ phase: "playing", level: 0, turns: 0, totalTurns: 0 });
});
