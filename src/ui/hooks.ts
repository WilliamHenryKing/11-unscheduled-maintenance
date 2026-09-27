import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import type { Piece } from "../game/types";
import type { Stage } from "../scene/stage";

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

const HINT_KEY = "unscheduled-maintenance:hint-seen";

/** The first-time hint shows until the first turn or dismissal; remembered per browser when possible. */
export function useHintSeen(): [boolean, () => void] {
  const [seen, setSeen] = useState(() => {
    try {
      return window.localStorage.getItem(HINT_KEY) === "1";
    } catch {
      return false;
    }
  });
  const mark = useCallback(() => {
    setSeen(true);
    try {
      window.localStorage.setItem(HINT_KEY, "1");
    } catch {
      // Storage unavailable: the hint simply returns next visit.
    }
  }, []);
  return [seen, mark];
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
      if (!enabled || e.metaKey || e.ctrlKey || e.altKey || parts.length === 0) return;
      const index = parts.findIndex((p) => p.id === focusId);
      const current = parts[index] ?? parts[0];
      const key = e.key.toLowerCase();
      const pick = (i: number) => {
        const p = parts[(i + parts.length) % parts.length];
        if (p) setFocusId(p.id);
      };
      if (/^[1-9]$/.test(key)) pick(Number(key) - 1);
      else if (key === "arrowright" || key === "arrowdown") pick(index + 1);
      else if (key === "arrowleft" || key === "arrowup") pick(index < 0 ? -1 : index - 1);
      else if (key === "q" && current) turn(current.id, 1);
      else if (key === "e" && current) turn(current.id, -1);
      else if (key === "r") reset();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
