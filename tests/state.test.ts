import { expect, test } from "bun:test";
import { trace } from "../src/game/optics";
import { minimumTurns } from "../src/game/solver";
import { createGame, initialStates, levelAt, reduce } from "../src/game/state";

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

test("a full night follows minimum-turn repairs, then replays with a fresh bench and score", () => {
  let game = reduce(createGame(), { type: "start" });
  // Ordinary turn actions, including reverse turns and mirror state wraps.
  const routes: [string, 1 | -1][][] = [
    [["mirror-3-2", 1]],
    [
      ["mirror-4-0", 1],
      ["mirror-2-2", 1],
      ["mirror-2-2", 1],
      ["mirror-4-2", 1],
    ],
    [
      ["aperture-2-1", 1],
      ["aperture-4-2", 1],
      ["mirror-4-3", -1],
    ],
    [
      ["mirror-2-0", 1],
      ["mirror-4-0", 1],
      ["mirror-2-2", 1],
      ["mirror-2-2", 1],
    ],
    [
      ["splitter-3-1", 1],
      ["mirror-3-3", -1],
      ["aperture-5-3", 1],
    ],
    [
      ["aperture-3-2", 1],
      ["mirror-5-2", 1],
      ["mirror-5-2", 1],
      ["mirror-5-4", 1],
      ["mirror-5-4", 1],
    ],
  ];
  let total = 0;
  for (const [i, route] of routes.entries()) {
    expect(game.level).toBe(i);
    const level = levelAt(game);
    expect(game.states).toEqual(initialStates(level));
    expect(game.turns).toBe(0);
    expect(trace(level, game.states).solved).toBe(false);
    expect(route.length).toBe(minimumTurns(level));
    expect(reduce(game, { type: "next" })).toBe(game);
    for (const [j, [id, step]] of route.entries()) {
      game = reduce(game, { type: "turn", id, step });
      expect(game.turns).toBe(j + 1);
      expect(game.phase).toBe(j === route.length - 1 ? "solved" : "playing");
      expect(trace(level, game.states).solved).toBe(game.phase === "solved");
    }
    total += route.length;
    expect(game.phase).toBe("solved");
    expect(game.totalTurns).toBe(total);
    expect(reduce(game, { type: "reset" })).toBe(game);
    game = reduce(game, { type: "next" });
  }
  expect(game.phase).toBe("ending");
  expect(game.totalTurns).toBe(20);
  game = reduce(game, { type: "start" });
  expect(game).toMatchObject({ phase: "playing", level: 0, turns: 0, totalTurns: 0 });
  expect(game.states).toEqual(initialStates(levelAt(game)));
  expect(trace(levelAt(game), game.states).solved).toBe(false);
  game = reduce(game, { type: "turn", id: "mirror-3-2", step: 1 });
  expect(game).toMatchObject({ phase: "solved", turns: 1, totalTurns: 1 });
});

test("reset on a later repair restores every part while retaining work already counted", () => {
  let game = reduce(createGame(), { type: "start" });
  game = reduce(game, { type: "turn", id: "mirror-3-2", step: 1 });
  game = reduce(game, { type: "next" });
  game = reduce(game, { type: "turn", id: "mirror-2-2", step: 1 });
  game = reduce(game, { type: "turn", id: "mirror-4-2", step: -1 });
  const level = levelAt(game);
  expect(game.states).not.toEqual(initialStates(level));
  game = reduce(game, { type: "reset" });
  expect(game.states).toEqual(initialStates(level));
  expect(game).toMatchObject({ phase: "playing", level: 1, turns: 2, totalTurns: 3 });
  expect(trace(level, game.states).solved).toBe(false);
  expect(reduce(game, { type: "next" })).toBe(game);
});
