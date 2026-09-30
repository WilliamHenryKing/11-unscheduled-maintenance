import { useEffect, useRef } from "react";
import "./opening.css";

export function Title({ onBegin }: { onBegin: () => void }) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => button.current?.focus(), []);
  return (
    <section className="opening" aria-labelledby="opening-title">
      <div className="opening-copy">
        <p className="rise opening-eyebrow">Night log · 03:12 · Dome open</p>
        <h1 className="rise" id="opening-title">
          Unscheduled
          <br />
          <em>maintenance.</em>
        </h1>
        <p className="rise opening-premise">
          One beam has lost its way.
          <br />
          The sky is waiting for an answer.
        </p>
        <div className="rise">
          <button ref={button} type="button" className="opening-button" onClick={onBegin}>
            Begin maintenance <span aria-hidden="true">↗</span>
          </button>
          <span className="enter-note">or press Enter</span>
        </div>
      </div>
      <p className="opening-coordinate" aria-hidden="true">
        UM / 11
        <br />
        Optical alignment required
      </p>
    </section>
  );
}

export function Guide({
  step,
  revealed,
  final,
  onSkip,
}: {
  step: number;
  revealed: boolean;
  final: boolean;
  onSkip: () => void;
}) {
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const steps = [
    [
      "Find the drifting part",
      touch
        ? "Select a part in Adjusters, then use its arrows. A brass ring marks each adjustable part; a red glint marks where the light stops."
        : "Choose an adjuster with Tab or 1–9. On the bench, a brass ring marks a part you can turn. A red glint marks where the light stops.",
    ],
    [
      "Put the light back",
      `${touch ? "Use the ↺ / ↻ buttons" : "Use Q/E or the ↺ / ↻ buttons"} to turn the selected part. A diagonal mirror bends light by a right angle. Feed every receiver's lens.`,
    ],
    [
      "Your repair is written in the sky",
      revealed
        ? final
          ? "An unexpected star has answered. Choose Close the log to finish this night and read your repair record."
          : "The constellation is your repair log. Choose Next repair to meet the next optical rule. Reset drift lets you try a repair again."
        : "All receivers are lit. Watch the dome as the camera follows the restored light. A new constellation is appearing.",
    ],
  ];
  return (
    <aside
      className="repair-guide"
      data-revealed={revealed}
      aria-label="Maintenance guide"
      aria-live="polite"
    >
      <p className="opening-eyebrow">
        {step + 1}/3 · {steps[step]?.[0]}
      </p>
      <p>{steps[step]?.[1]}</p>
      <div className="guide-foot">
        <span aria-hidden="true">{steps.map((_, i) => (i === step ? "● " : "○ "))}</span>
        <button type="button" onClick={onSkip}>
          Skip the guide
        </button>
      </div>
    </aside>
  );
}
