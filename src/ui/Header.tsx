import { forwardRef } from "react";
import type { Level, Trace } from "../game/types";
import { beamSummary } from "./readouts";

interface Props {
  level: Level;
  total: number;
  trace: Trace;
  hidden: boolean;
}

/** Log header: which repair, what it teaches, and a live readout of the beam. */
export const Header = forwardRef<HTMLElement, Props>(function Header(
  { level, total, trace, hidden },
  ref,
) {
  return (
    <header
      ref={ref}
      className={`pointer-events-none fixed inset-x-0 top-0 px-4 pr-16 pt-[max(0.9rem,env(safe-area-inset-top))] md:inset-x-auto md:left-6 md:top-6 md:max-w-md md:p-0 ${
        hidden ? "invisible" : ""
      }`}
    >
      <p className="eyebrow">Unscheduled maintenance · night log</p>
      <h1 className="mt-1 text-lg font-semibold tracking-tight md:text-2xl">
        <span className="mr-2 font-mono text-sm font-normal text-brass">
          {String(level.index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </span>
        {level.title}
      </h1>
      <p className="mt-1 text-[13px] leading-snug text-paper/80 md:text-sm">{level.lesson}</p>
      <p
        aria-live="polite"
        className={`mt-2 font-mono text-[11px] ${trace.solved ? "text-beam" : "text-muted"}`}
      >
        {trace.solved ? "Alignment nominal · all receivers lit" : beamSummary(trace)}
      </p>
    </header>
  );
});
