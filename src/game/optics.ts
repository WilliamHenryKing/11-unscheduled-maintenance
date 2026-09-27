import type { Dir, Level, Mark, Piece, Segment, States, Trace } from "./types";

export const DX = [0, 1, 0, -1] as const;
export const DY = [-1, 0, 1, 0] as const;

export function opposite(dir: Dir): Dir {
  return ((dir + 2) % 4) as Dir;
}

/** Reflection off a mirror or splitter face. `null` when the mirror is square-on (misaligned). */
export function reflect(state: number, dir: Dir): Dir | null {
  if (state === 1) return ([1, 0, 3, 2] as const)[dir]; // "/"
  if (state === 3) return ([3, 2, 1, 0] as const)[dir]; // "\"
  return null;
}

export function aperturePasses(state: number, dir: Dir): boolean {
  return state === 0 ? dir % 2 === 1 : dir % 2 === 0;
}

/** Next state after one turn. Mirrors step 45°, splitters and apertures flip 90°. */
export function turn(piece: Piece, state: number, step: 1 | -1): number {
  if (piece.kind === "mirror") return (state + step + 4) % 4;
  if (piece.kind === "splitter") return state === 1 ? 3 : 1;
  if (piece.kind === "aperture") return state === 0 ? 1 : 0;
  return state;
}

export function stateOf(piece: Piece, states: States): number {
  return states[piece.id] ?? piece.state;
}

/** Where a beam stops short of a piece's centre, so it meets the housing rather than its core. */
const FACE: Record<Mark["kind"], number> = {
  lit: 0.22,
  scatter: 0,
  stopped: 0.28,
  backside: 0.3,
  blocked: 0.34,
  lost: 0.5,
};

/** Follow every ray from the source through the bench. Loops terminate on repeated (cell, dir). */
export function trace(level: Level, states: States): Trace {
  const grid = new Map<string, Piece>();
  for (const p of level.pieces) grid.set(`${p.x},${p.y}`, p);
  const source = level.pieces.find((p) => p.kind === "source");
  const receivers = level.pieces.filter((p) => p.kind === "receiver");
  const segments: Segment[] = [];
  const marks: Mark[] = [];
  const lit = new Set<string>();
  if (!source) return { segments, marks, lit: [], receivers: receivers.length, solved: false };

  const rays: { x: number; y: number; dir: Dir }[] = [
    { x: source.x, y: source.y, dir: source.state as Dir },
  ];
  const seen = new Set<string>();

  while (rays.length > 0) {
    const ray = rays.shift();
    if (!ray) break;
    const key = `${ray.x},${ray.y},${ray.dir}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const { dir } = ray;
    let cx = ray.x;
    let cy = ray.y;
    const end = (kind: Mark["kind"], piece?: Piece) => {
      const back = FACE[kind];
      const x = cx - DX[dir] * back;
      const y = cy - DY[dir] * back;
      segments.push({ x0: ray.x, y0: ray.y, x1: x, y1: y, end: kind });
      marks.push({ x, y, kind, pieceId: piece?.id });
    };

    for (;;) {
      cx += DX[dir];
      cy += DY[dir];
      if (cx < 0 || cy < 0 || cx >= level.width || cy >= level.height) {
        end("lost");
        break;
      }
      const piece = grid.get(`${cx},${cy}`);
      if (!piece) continue;
      const state = stateOf(piece, states);

      if (piece.kind === "aperture") {
        if (aperturePasses(state, dir)) continue;
        end("stopped", piece);
        break;
      }
      if (piece.kind === "mirror" || piece.kind === "splitter") {
        const out = reflect(state, dir);
        if (out === null) {
          end("scatter", piece);
          break;
        }
        segments.push({ x0: ray.x, y0: ray.y, x1: cx, y1: cy, end: piece.kind });
        rays.push({ x: cx, y: cy, dir: out });
        if (piece.kind === "splitter") rays.push({ x: cx, y: cy, dir });
        break;
      }
      if (piece.kind === "receiver") {
        if (dir === opposite(state as Dir)) {
          lit.add(piece.id);
          end("lit", piece);
        } else end("backside", piece);
        break;
      }
      end("blocked", piece);
      break;
    }
  }

  return {
    segments,
    marks,
    lit: [...lit],
    receivers: receivers.length,
    solved: receivers.length > 0 && lit.size === receivers.length,
  };
}
