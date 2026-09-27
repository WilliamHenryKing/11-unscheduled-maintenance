// Shared vocabulary of the optical bench. Grid x grows east, y grows south.

/** 0 north, 1 east, 2 south, 3 west. */
export type Dir = 0 | 1 | 2 | 3;

export type PieceKind = "source" | "mirror" | "splitter" | "aperture" | "receiver" | "strut";

/**
 * `state` meaning by kind:
 * - mirror: 0 "—", 1 "/", 2 "|", 3 "\" (45° steps). Only diagonals reflect.
 * - splitter: 1 "/" or 3 "\". Half-silvered: passes and reflects.
 * - aperture: 0 passes east–west, 1 passes north–south.
 * - source, receiver: the direction the lens faces.
 */
export interface Piece {
  id: string;
  kind: PieceKind;
  x: number;
  y: number;
  state: number;
  fixed: boolean;
  label: string;
}

export interface PieceSpec {
  kind: PieceKind;
  state: number;
  fixed?: boolean;
}

export interface LevelDef {
  title: string;
  /** One sentence taught in place, shown while the repair is open. */
  lesson: string;
  map: string[];
  legend: Record<string, PieceSpec>;
}

export interface Level {
  index: number;
  title: string;
  lesson: string;
  width: number;
  height: number;
  pieces: Piece[];
}

export type States = Record<string, number>;

export type EndKind =
  | "mirror"
  | "splitter"
  | "lit"
  | "scatter"
  | "stopped"
  | "backside"
  | "blocked"
  | "lost";

export interface Segment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  end: EndKind;
}

export interface Mark {
  x: number;
  y: number;
  kind: Exclude<EndKind, "mirror" | "splitter">;
  pieceId?: string;
}

export interface Trace {
  segments: Segment[];
  marks: Mark[];
  lit: string[];
  receivers: number;
  solved: boolean;
}
