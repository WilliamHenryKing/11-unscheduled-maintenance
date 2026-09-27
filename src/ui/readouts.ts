import type { Piece, Trace } from "../game/types";

// Plain-language readouts for pieces and the beam. Shared by the panel and the live region.

export function stateText(piece: Piece, state: number): string {
  if (piece.kind === "aperture") return state === 0 ? "tube east–west" : "tube north–south";
  const deg = `${state * 45}°`;
  if (piece.kind === "mirror") return state % 2 === 1 ? `${deg} diagonal` : `${deg} square-on`;
  return deg;
}

/** Icon rotation in CSS degrees (clockwise) matching the bench as seen from the camera. */
export function iconAngle(piece: Piece, state: number): number {
  return piece.kind === "aperture" ? -state * 90 : -state * 45;
}

export type Fault = "scatters" | "blocks" | null;

export function faultOf(piece: Piece, trace: Trace): Fault {
  const mark = trace.marks.find((m) => m.pieceId === piece.id);
  if (mark?.kind === "scatter") return "scatters";
  if (mark?.kind === "stopped") return "blocks";
  return null;
}

export function beamSummary(trace: Trace): string {
  const faults = trace.marks.filter((m) => m.kind === "scatter" || m.kind === "stopped").length;
  const back = trace.marks.some((m) => m.kind === "backside");
  const parts = [`${trace.lit.length} of ${trace.receivers} receivers lit`];
  if (faults > 0) parts.push(`${faults} misalignment${faults > 1 ? "s" : ""}`);
  if (back) parts.push("light on a receiver's back");
  return parts.join(" · ");
}
