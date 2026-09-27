import { LEVELS } from "./levels";
import { trace, turn } from "./optics";
import type { Level, States } from "./types";

/** title → playing → solved (sky reveal) → playing … → ending → playing (replay). */
export type Phase = "title" | "playing" | "solved" | "ending";

export interface GameState {
  phase: Phase;
  level: number;
  states: States;
  turns: number;
  totalTurns: number;
}

export type Action =
  | { type: "start" }
  | { type: "turn"; id: string; step: 1 | -1 }
  | { type: "reset" }
  | { type: "next" };

export function initialStates(level: Level): States {
  return Object.fromEntries(level.pieces.filter((p) => !p.fixed).map((p) => [p.id, p.state]));
}

export function levelAt(state: GameState, levels: Level[] = LEVELS): Level {
  const level = levels[state.level] ?? levels[0];
  if (!level) throw new Error("No levels defined");
  return level;
}

export function createGame(levels: Level[] = LEVELS): GameState {
  const first = levels[0];
  if (!first) throw new Error("No levels defined");
  return { phase: "title", level: 0, states: initialStates(first), turns: 0, totalTurns: 0 };
}

function open(index: number, totalTurns: number, levels: Level[]): GameState {
  const level = levels[index];
  if (!level) throw new Error(`No level ${index}`);
  return { phase: "playing", level: index, states: initialStates(level), turns: 0, totalTurns };
}

export function reduce(state: GameState, action: Action, levels: Level[] = LEVELS): GameState {
  switch (action.type) {
    case "start":
      return state.phase === "title" || state.phase === "ending" ? open(0, 0, levels) : state;
    case "turn": {
      if (state.phase !== "playing") return state;
      const level = levelAt(state, levels);
      const piece = level.pieces.find((p) => p.id === action.id);
      if (!piece || piece.fixed) return state;
      const current = state.states[piece.id] ?? piece.state;
      const states = { ...state.states, [piece.id]: turn(piece, current, action.step) };
      const solved = trace(level, states).solved;
      return {
        ...state,
        states,
        phase: solved ? "solved" : "playing",
        turns: state.turns + 1,
        totalTurns: state.totalTurns + 1,
      };
    }
    case "reset":
      if (state.phase !== "playing") return state;
      return { ...state, states: initialStates(levelAt(state, levels)) };
    case "next":
      if (state.phase !== "solved") return state;
      if (state.level + 1 >= levels.length) return { ...state, phase: "ending" };
      return open(state.level + 1, state.totalTurns, levels);
  }
}
