export type KeyCommand =
  | { type: "select"; id: string }
  | { type: "turn"; id: string; step: 1 | -1 }
  | { type: "reset" };

/** Number keys address exact labels; only the directional keys wrap around the parts. */
export function keyCommand(
  key: string,
  ids: readonly string[],
  selectedId: string | null,
): KeyCommand | null {
  if (!ids.length) return null;
  const normalized = key.toLowerCase();
  const index = ids.indexOf(selectedId ?? "");
  if (/^[1-9]$/.test(normalized)) {
    const id = ids[Number(normalized) - 1];
    return id ? { type: "select", id } : null;
  }
  if (["arrowright", "arrowdown", "arrowleft", "arrowup"].includes(normalized)) {
    const next = normalized === "arrowright" || normalized === "arrowdown" ? index + 1 : index - 1;
    const at = index < 0 && next < 0 ? ids.length - 1 : (next + ids.length) % ids.length;
    const id = ids[at];
    return id ? { type: "select", id } : null;
  }
  const id = ids[index] ?? ids[0];
  if ((normalized === "q" || normalized === "e") && id) {
    return { type: "turn", id, step: normalized === "q" ? 1 : -1 };
  }
  return normalized === "r" ? { type: "reset" } : null;
}
