import { forwardRef } from "react";
import type { Piece, States, Trace } from "../game/types";
import { faultOf, iconAngle, stateText } from "./readouts";

interface Props {
  parts: Piece[];
  states: States;
  trace: Trace;
  focusId: string | null;
  disabled: boolean;
  onFocus: (id: string) => void;
  onTurn: (id: string, step: 1 | -1) => void;
  onReset: () => void;
}

function Icon({ piece, state }: { piece: Piece; state: number }) {
  const shape =
    piece.kind === "aperture" ? (
      <rect
        x="4"
        y="9"
        width="16"
        height="6"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    ) : (
      <line
        x1="3"
        y1="12"
        x2="21"
        y2="12"
        stroke="currentColor"
        strokeWidth={piece.kind === "mirror" ? 2.6 : 1.8}
        strokeDasharray={piece.kind === "splitter" ? "3 2" : undefined}
        strokeLinecap="round"
      />
    );
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0 text-beam transition-transform duration-200 motion-reduce:transition-none"
      style={{ transform: `rotate(${iconAngle(piece, state)}deg)` }}
    >
      {shape}
    </svg>
  );
}

const turnBtn =
  "grid size-11 place-items-center rounded-md border border-hair text-lg text-paper hover:border-brass hover:text-brass active:bg-white/5 disabled:opacity-40";

/** Labelled controls for every adjustable part: the keyboard and screen-reader route to the bench. */
export const Adjusters = forwardRef<HTMLElement, Props>(function Adjusters(props, ref) {
  const { parts, states, trace, focusId, disabled, onFocus, onTurn, onReset } = props;
  return (
    <section
      ref={ref}
      aria-label="Adjusters"
      className="panel pointer-events-auto fixed inset-x-2 bottom-2 rounded-xl p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:inset-x-auto md:top-6 md:right-6 md:bottom-auto md:w-72 md:p-3"
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="eyebrow">Adjusters</h2>
        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          className="rounded px-2 py-1 text-xs text-muted hover:text-paper disabled:opacity-40"
          aria-keyshortcuts="R"
        >
          Reset drift <span className="font-mono opacity-70">R</span>
        </button>
      </div>
      <ul className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
        {parts.map((piece, i) => {
          const state = states[piece.id] ?? piece.state;
          const fault = faultOf(piece, trace);
          const active = piece.id === focusId;
          const deg = piece.kind === "mirror" ? 45 : 90;
          return (
            <li
              key={piece.id}
              className={`flex min-w-[10.5rem] shrink-0 items-center gap-2 rounded-lg border p-1.5 md:min-w-0 ${
                active ? "border-focus/60 bg-white/[0.04]" : "border-transparent"
              }`}
            >
              <button
                type="button"
                disabled={disabled}
                aria-label={`${piece.label} counter-clockwise ${deg} degrees`}
                aria-keyshortcuts="Q"
                onFocus={() => onFocus(piece.id)}
                onClick={() => onTurn(piece.id, 1)}
                className={turnBtn}
              >
                ↺
              </button>
              <div className="min-w-0 flex-1 text-center md:flex md:items-center md:gap-2 md:text-left">
                <Icon piece={piece} state={state} />
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium">
                    <span className="mr-1 font-mono text-[10px] text-muted">{i + 1}</span>
                    {piece.label}
                  </div>
                  <div
                    className={`truncate font-mono text-[10px] ${fault ? "text-warn" : "text-muted"}`}
                  >
                    {fault ?? stateText(piece, state)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={disabled}
                aria-label={`${piece.label} clockwise ${deg} degrees`}
                aria-keyshortcuts="E"
                onFocus={() => onFocus(piece.id)}
                onClick={() => onTurn(piece.id, -1)}
                className={turnBtn}
              >
                ↻
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
});
