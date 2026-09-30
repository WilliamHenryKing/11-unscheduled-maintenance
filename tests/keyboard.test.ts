import { expect, test } from "bun:test";
import { adjustable, LEVELS } from "../src/game/levels";
import { createGame, reduce } from "../src/game/state";
import { keyCommand } from "../src/ui/keyboard";

test("each numbered label selects that part and missing numbers never alias another part", () => {
  for (const level of LEVELS) {
    const ids = adjustable(level).map((piece) => piece.id);
    for (let number = 1; number <= 9; number++) {
      const id = ids[number - 1];
      expect(keyCommand(String(number), ids, null)).toEqual(id ? { type: "select", id } : null);
    }
  }
});

test("directional selection can visit every adjustable part and wrap in either direction", () => {
  for (const level of LEVELS) {
    const ids = adjustable(level).map((piece) => piece.id);
    let selected: string | null = null;
    const visited: string[] = [];
    for (let i = 0; i < ids.length; i++) {
      const command = keyCommand("ArrowRight", ids, selected);
      if (command?.type !== "select") throw new Error("Selection missing");
      selected = command.id;
      visited.push(selected);
    }
    expect(visited).toEqual(ids);
    const first = ids[0];
    const last = ids.at(-1);
    if (!first || !last) throw new Error("Repair has no adjusters");
    expect(keyCommand("ArrowRight", ids, selected)).toEqual({ type: "select", id: first });
    expect(keyCommand("ArrowLeft", ids, first)).toEqual({
      type: "select",
      id: last,
    });
  }
});

test("the keyboard route repairs the first optical chain and reset restores its drift", () => {
  const level = LEVELS[0];
  if (!level) throw new Error("First repair missing");
  const ids = adjustable(level).map((piece) => piece.id);
  let game = reduce(createGame(), { type: "start" });
  const wrongTurn = keyCommand("E", ids, null);
  if (wrongTurn?.type !== "turn") throw new Error("Turn missing");
  game = reduce(game, wrongTurn);
  expect(game.phase).toBe("playing");
  const reset = keyCommand("R", ids, null);
  if (reset?.type !== "reset") throw new Error("Reset missing");
  game = reduce(game, reset);
  const turn = keyCommand("Q", ids, null);
  if (turn?.type !== "turn") throw new Error("Turn missing");
  game = reduce(game, turn);
  expect(game.phase).toBe("solved");
  expect(game.turns).toBe(2);
});
