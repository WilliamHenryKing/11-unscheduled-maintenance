import { type ReactNode, useEffect, useId } from "react";
import type { Constellation } from "../game/constellations";
import { focusPlayControl } from "./hooks";

const primary =
  "mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-brass/70 bg-brass/10 px-5 text-sm font-medium text-paper hover:bg-brass/20";

function Card({
  label,
  description,
  children,
  wide,
}: {
  label: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => () => focusPlayControl(true), []);
  return (
    <section
      role="dialog"
      aria-label={label}
      aria-describedby={description}
      className={`maintenance-card panel card-in pointer-events-auto rounded-2xl p-6 ${wide ? "max-w-lg" : "max-w-md"}`}
    >
      {children}
    </section>
  );
}

export function RevealCard({
  constellation,
  final,
  onNext,
}: {
  constellation: Constellation;
  final: boolean;
  onNext: () => void;
}) {
  const description = useId();
  return (
    <div className="fixed inset-x-0 bottom-0 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-8">
      <Card label={constellation.name} description={description}>
        <p className={`eyebrow ${final ? "!text-beam" : ""}`}>{constellation.catalogue}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{constellation.name}</h2>
        <p id={description} className="mt-2 text-sm leading-relaxed text-paper/80">
          {constellation.note}
        </p>
        {/* biome-ignore lint/a11y/noAutofocus: moves focus to the only next step */}
        <button type="button" autoFocus onClick={onNext} className={primary}>
          {final ? "Close the log" : "Next repair"} <span aria-hidden="true">→</span>
        </button>
      </Card>
    </div>
  );
}

export function EndingCard({
  repairs,
  turns,
  onReplay,
}: {
  repairs: number;
  turns: number;
  onReplay: () => void;
}) {
  const description = useId();
  return (
    <div className="fixed inset-x-0 bottom-0 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-8">
      <Card label="Maintenance complete" description={description} wide>
        <p className="eyebrow">Log closed · 05:47 · dome closing</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Maintenance complete</h2>
        <p className="mt-2 font-mono text-xs text-muted">
          {repairs} repairs · {turns} turns · 1 new entry
        </p>
        <p id={description} className="mt-3 text-sm leading-relaxed text-paper/80">
          The report goes in as routine. Under “notes” you write only: <em>UM-11 answers.</em>{" "}
          Tomorrow night the mirrors will drift again, and you will know where to look.
        </p>
        {/* biome-ignore lint/a11y/noAutofocus: moves focus to the only next step */}
        <button type="button" autoFocus onClick={onReplay} className={primary}>
          Begin a new night <span aria-hidden="true">↺</span>
        </button>
      </Card>
    </div>
  );
}
