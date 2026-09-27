import type { ReactNode } from "react";
import type { Constellation } from "../game/constellations";

const primary =
  "mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-brass/70 bg-brass/10 px-5 text-sm font-medium text-paper hover:bg-brass/20";

function Card({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <section
      role="dialog"
      aria-label={label}
      className={`panel card-in pointer-events-auto rounded-2xl p-6 ${wide ? "max-w-lg" : "max-w-md"}`}
    >
      {children}
    </section>
  );
}

export function TitleCard({ onStart }: { onStart: () => void }) {
  return (
    <div className="fixed inset-0 grid place-items-center bg-ink/50 p-4">
      <Card label="Unscheduled maintenance" wide>
        <p className="eyebrow">Night log · 03:12 · dome open</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Unscheduled Maintenance
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-paper/80">
          The telescope's mirrors have drifted in the cold. Put the starlight back on its path, one
          repair at a time, and see what the sky has been waiting to show you.
        </p>
        {/* biome-ignore lint/a11y/noAutofocus: the only action on the card */}
        <button type="button" autoFocus onClick={onStart} className={primary}>
          Begin maintenance <span aria-hidden="true">→</span>
        </button>
      </Card>
    </div>
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
  return (
    <div className="fixed inset-x-0 bottom-0 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-8">
      <Card label={constellation.name}>
        <p className={`eyebrow ${final ? "!text-beam" : ""}`}>{constellation.catalogue}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{constellation.name}</h2>
        <p className="mt-2 text-sm leading-relaxed text-paper/80">{constellation.note}</p>
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
  return (
    <div className="fixed inset-x-0 bottom-0 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-8">
      <Card label="Maintenance complete" wide>
        <p className="eyebrow">Log closed · 05:47 · dome closing</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Maintenance complete</h2>
        <p className="mt-2 font-mono text-xs text-muted">
          {repairs} repairs · {turns} turns · 1 new entry
        </p>
        <p className="mt-3 text-sm leading-relaxed text-paper/80">
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

export function HintCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[11.5rem] flex justify-center p-4 md:bottom-6 md:left-6 md:justify-start md:p-0">
      <section
        aria-label="How to repair"
        className="panel card-in pointer-events-auto max-w-sm rounded-xl p-4 text-sm"
      >
        <p className="eyebrow">How to repair</p>
        <ul className="mt-2 space-y-1.5 text-paper/85">
          <li>
            <strong className="text-brass">Tap</strong> a brass-ringed part to turn it 45°.
            Right-click or ↻ turns it back.
          </li>
          <li>Bring the beam to every receiver's lens. Red glints mark misalignments.</li>
          <li className="hidden font-mono text-xs text-muted md:block">
            Keys: 1–9 or ←/→ choose · Q/E turn · R reset
          </li>
        </ul>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-3 min-h-10 rounded-full border border-hair px-4 text-xs text-paper hover:border-brass"
        >
          Got it
        </button>
      </section>
    </div>
  );
}
