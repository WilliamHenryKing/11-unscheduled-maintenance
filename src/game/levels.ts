import type { Level, LevelDef, Piece, PieceKind } from "./types";

// Six authored repairs. Map characters: "." empty bench, "#" strut, anything else from the legend.
// Each repair teaches one rule; states listed are the drifted starting positions.
export const LEVEL_DEFS: LevelDef[] = [
  {
    title: "First Light",
    lesson: "One mirror has drifted square-on and scatters the beam. Turn it back onto a diagonal.",
    map: ["S..a.", ".....", "...bR"],
    legend: {
      S: { kind: "source", state: 1 },
      a: { kind: "mirror", state: 3, fixed: true },
      b: { kind: "mirror", state: 2 },
      R: { kind: "receiver", state: 3 },
    },
  },
  {
    title: "Two Drifts",
    lesson: "A mirror turns light by a right angle. Follow the beam one mirror at a time.",
    map: ["S...a.", "..#...", "..b.c.", "..R..."],
    legend: {
      S: { kind: "source", state: 1 },
      a: { kind: "mirror", state: 2 },
      b: { kind: "mirror", state: 3 },
      c: { kind: "mirror", state: 0 },
      R: { kind: "receiver", state: 0 },
    },
  },
  {
    title: "The Baffles",
    lesson: "Apertures are baffle tubes: light passes only along the tube, never across it.",
    map: ["...#...", "S.A.a..", "....B..", "....b.R"],
    legend: {
      S: { kind: "source", state: 1 },
      A: { kind: "aperture", state: 1 },
      B: { kind: "aperture", state: 0 },
      a: { kind: "mirror", state: 3, fixed: true },
      b: { kind: "mirror", state: 0 },
      R: { kind: "receiver", state: 3 },
    },
  },
  {
    title: "Wrong Side of the Lens",
    lesson: "A receiver sees only light entering its lens. Light on its back plate is wasted.",
    map: ["..a.b.", "......", "S.c.R.", "......", "..e.f."],
    legend: {
      S: { kind: "source", state: 1 },
      a: { kind: "mirror", state: 0 },
      b: { kind: "mirror", state: 2 },
      c: { kind: "mirror", state: 3 },
      e: { kind: "mirror", state: 3 },
      f: { kind: "mirror", state: 1 },
      R: { kind: "receiver", state: 0 },
    },
  },
  {
    title: "Half-Silvered",
    lesson: "A splitter passes half the light straight on and reflects the other half.",
    map: ["...#...", "S..s..R", ".......", "...a.AQ"],
    legend: {
      S: { kind: "source", state: 1 },
      s: { kind: "splitter", state: 1 },
      a: { kind: "mirror", state: 0 },
      A: { kind: "aperture", state: 1 },
      R: { kind: "receiver", state: 3 },
      Q: { kind: "receiver", state: 3 },
    },
  },
  {
    title: "Unscheduled",
    lesson: "The last alignment: one beam, three receivers. Everything you have learned at once.",
    map: ["..R..#.", ".......", "S.sA.m.", ".......", "Q.t..n.", "..P...."],
    legend: {
      S: { kind: "source", state: 1 },
      s: { kind: "splitter", state: 3 },
      A: { kind: "aperture", state: 1 },
      m: { kind: "mirror", state: 1 },
      t: { kind: "splitter", state: 3 },
      n: { kind: "mirror", state: 3 },
      R: { kind: "receiver", state: 2 },
      Q: { kind: "receiver", state: 1 },
      P: { kind: "receiver", state: 0 },
    },
  },
];

const NAMES: Record<PieceKind, string> = {
  source: "Telescope feed",
  mirror: "Mirror",
  splitter: "Splitter",
  aperture: "Aperture",
  receiver: "Receiver",
  strut: "Strut",
};

export function parseLevel(def: LevelDef, index: number): Level {
  const pieces: Piece[] = [];
  const counters: Partial<Record<PieceKind, number>> = {};
  const width = Math.max(...def.map.map((row) => row.length));
  def.map.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === ".") return;
      const spec = ch === "#" ? { kind: "strut" as const, state: 0 } : def.legend[ch];
      if (!spec) throw new Error(`Level "${def.title}": unknown map character "${ch}"`);
      const n = (counters[spec.kind] ?? 0) + 1;
      counters[spec.kind] = n;
      const fixed = spec.fixed ?? !["mirror", "splitter", "aperture"].includes(spec.kind);
      const tag = spec.kind === "receiver" ? ` ${n}` : ` ${String.fromCharCode(64 + n)}`;
      const plain = spec.kind === "source" || spec.kind === "strut";
      pieces.push({
        id: `${spec.kind}-${x}-${y}`,
        kind: spec.kind,
        x,
        y,
        state: spec.state,
        fixed,
        label: plain ? NAMES[spec.kind] : `${NAMES[spec.kind]}${tag}`,
      });
    });
  });
  return { index, title: def.title, lesson: def.lesson, width, height: def.map.length, pieces };
}

export const LEVELS: Level[] = LEVEL_DEFS.map(parseLevel);

export function adjustable(level: Level): Piece[] {
  return level.pieces.filter((p) => !p.fixed);
}
