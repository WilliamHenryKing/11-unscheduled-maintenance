import { type RefObject, useEffect, useRef, useState } from "react";
import type { Piece } from "../game/types";
import type { Stage } from "../scene/stage";
import { keyCommand } from "./keyboard";

/** After an opening or result card closes, put keyboard play back on a visible control. */
export function focusPlayControl(onlyIfUnfocused = false) {
  window.requestAnimationFrame(() => {
    if (onlyIfUnfocused && document.activeElement !== document.body) return;
    document.querySelector<HTMLButtonElement>(".part-select:not(:disabled)")?.focus();
  });
}

export function useReducedMotion(): boolean {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Keep the renderer sized to the window and the bench framed in the space the HUD leaves. */
export function useStageLayout(
  stage: Stage,
  header: RefObject<HTMLElement | null>,
  panel: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const layout = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const wide = w >= 768;
      const head = header.current?.getBoundingClientRect();
      const side = panel.current?.getBoundingClientRect();
      const top = head ? head.bottom + 8 : 0;
      const bottom = !wide && side ? h - side.top + 8 : 16;
      const right = wide && side ? w - side.left + 8 : 0;
      const root = document.documentElement;
      root.style.setProperty("--maintenance-hud-bottom", `${top}px`);
      root.style.setProperty("--maintenance-panel-top", `${side ? side.top - 8 : h - 16}px`);
      stage.resize(w, h, { top: wide ? Math.min(top, h * 0.22) : top, bottom, right });
    };
    layout();
    const ro = new ResizeObserver(layout);
    if (header.current) ro.observe(header.current);
    if (panel.current) ro.observe(panel.current);
    window.addEventListener("resize", layout);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", layout);
      document.documentElement.style.removeProperty("--maintenance-hud-bottom");
      document.documentElement.style.removeProperty("--maintenance-panel-top");
    };
  }, [stage, header, panel]);
}

interface KeyOptions {
  enabled: boolean;
  parts: Piece[];
  focusId: string | null;
  setFocusId: (id: string) => void;
  turn: (id: string, step: 1 | -1) => void;
  reset: () => void;
}

/** 1–9 or arrows choose a part, Q/E turn it, R resets the drift. Buttons keep their own Enter/Space. */
export function useKeys(opts: KeyOptions) {
  const ref = useRef(opts);
  ref.current = opts;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { enabled, parts, focusId, setFocusId, turn, reset } = ref.current;
      if (!enabled || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          target.closest(".log-header"))
      )
        return;
      const command = keyCommand(
        e.key,
        parts.map((p) => p.id),
        focusId,
      );
      if (!command) return;
      if (command.type === "select") {
        setFocusId(command.id);
        const row = Array.from(
          document.querySelectorAll<HTMLElement>(".adjuster-list [data-part-id]"),
        ).find((item) => item.dataset.partId === command.id);
        row?.querySelector<HTMLButtonElement>(".part-select:not(:disabled)")?.focus();
      } else if (command.type === "turn") turn(command.id, command.step);
      else reset();
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
