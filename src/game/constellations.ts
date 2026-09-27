// Fictional constellations revealed by each repair, growing stranger up the dome slit.
// Star coordinates are in a unit square (x right, y up); lines join star indices.

export interface Constellation {
  name: string;
  catalogue: string;
  note: string;
  stars: [number, number][];
  lines: [number, number][];
  /** Elevation of the constellation above the horizon, in degrees, along the dome slit. */
  elevation: number;
  /** Angular half-size in degrees. */
  size: number;
}

export const CONSTELLATIONS: Constellation[] = [
  {
    name: "The Tern",
    catalogue: "Catalogued · UM-01",
    note: "A familiar bird over the horizon. The telescope can see again.",
    stars: [
      [-0.9, 0.3],
      [-0.35, 0.05],
      [0, -0.15],
      [0.4, 0.1],
      [0.95, 0.45],
      [0.05, -0.6],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [2, 5],
    ],
    elevation: 18,
    size: 5.5,
  },
  {
    name: "The Borrowed Key",
    catalogue: "Catalogued · UM-02",
    note: "Listed in the old charts, though nobody remembers who lent it.",
    stars: [
      [-0.8, 0.35],
      [-0.5, 0.65],
      [-0.2, 0.35],
      [-0.5, 0.05],
      [0.2, 0.35],
      [0.9, 0.35],
      [0.9, 0.0],
      [0.55, 0.35],
      [0.55, 0.05],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [2, 4],
      [4, 7],
      [7, 5],
      [5, 6],
      [7, 8],
    ],
    elevation: 30,
    size: 5.5,
  },
  {
    name: "The Kettle Left On",
    catalogue: "Uncatalogued · UM-03",
    note: "Three faint stars rise from its spout like steam. They move a little each night.",
    stars: [
      [-0.6, -0.55],
      [0.45, -0.55],
      [0.6, -0.05],
      [0.1, 0.25],
      [-0.5, 0.2],
      [-0.75, -0.1],
      [0.95, 0.15],
      [0.75, 0.55],
      [0.95, 0.85],
      [-0.15, 0.5],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
      [2, 6],
      [3, 9],
      [9, 4],
    ],
    elevation: 42,
    size: 5.5,
  },
  {
    name: "The Heron, Counting",
    catalogue: "Uncatalogued · UM-04",
    note: "It stands on one leg. The number of stars in its tail changes when nobody is looking.",
    stars: [
      [0.15, -0.95],
      [0.15, -0.3],
      [-0.35, 0.05],
      [0.3, 0.1],
      [0.45, 0.55],
      [0.2, 0.9],
      [0.75, 0.75],
      [-0.85, -0.05],
      [-0.8, 0.25],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 1],
      [3, 4],
      [4, 5],
      [5, 6],
      [2, 7],
      [2, 8],
    ],
    elevation: 54,
    size: 5.5,
  },
  {
    name: "The Door Ajar",
    catalogue: "Not in any catalogue · UM-05",
    note: "A doorway of four stars, with a fifth where the handle would be. Light seems to come from behind it.",
    stars: [
      [-0.45, -0.85],
      [-0.45, 0.85],
      [0.45, 0.85],
      [0.45, -0.85],
      [0.25, 0.0],
      [0.7, 0.65],
      [0.7, -0.6],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [2, 5],
      [5, 6],
      [6, 3],
    ],
    elevation: 66,
    size: 5.5,
  },
  {
    name: "The Instrument",
    catalogue: "Discovery · UM-11",
    note: "A telescope drawn in stars, pointed straight back down at this dome. Its eyepiece star blinks once for every repair you made tonight.",
    stars: [
      [-0.95, -0.55],
      [0.55, 0.45],
      [0.75, 0.15],
      [-0.75, -0.85],
      [-0.1, -0.2],
      [-0.35, -0.95],
      [0.2, -0.95],
      [0.95, 0.75],
      [-0.9, -0.95],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [4, 6],
      [1, 7],
      [7, 2],
      [0, 8],
    ],
    elevation: 82,
    size: 8,
  },
];

/** Index of the star that answers back in the finale. */
export const ANSWERING_STAR = 7;
