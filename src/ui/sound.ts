import { useEffect, useRef, useState } from "react";
import { sound } from "../audio/sound";
import type { Trace } from "../game/types";
import type { Stage } from "../scene/stage";

/** The beam's changes, heard: receivers chime as they light, misalignments crackle. */
export function useBeamCues(levelIndex: number, trace: Trace) {
  const prev = useRef<{ level: number; trace: Trace } | null>(null);
  useEffect(() => {
    const before = prev.current;
    prev.current = { level: levelIndex, trace };
    if (!before || before.level !== levelIndex) return;
    const was = before.trace;
    const newlyLit = trace.lit.filter((id) => !was.lit.includes(id));
    newlyLit.forEach((_, i) => {
      sound.play("lit", {
        rate: 1 + 0.12 * (trace.lit.length - newlyLit.length + i),
        delay: 0.08 * i,
      });
    });
    const faults = (t: Trace) =>
      t.marks.filter((m) => m.kind === "scatter" || m.kind === "stopped").length;
    if (faults(trace) > faults(was)) sound.play("scatter", { rate: 0.9 + Math.random() * 0.2 });
    const back = (t: Trace) => t.marks.some((m) => m.kind === "backside");
    if (back(trace) && !back(was)) sound.play("backside");
    if (trace.solved && !was.solved) sound.play("solved", { delay: 0.25 });
  }, [levelIndex, trace]);
}

/** Sky reveal cues from the scene: the dome turning, stars arriving, the answering star. */
export function useSkyCues(stage: Stage) {
  useEffect(() => {
    stage.onCue = (cue, i) => {
      if (cue === "tilt") sound.play("dome", { rate: 0.85 });
      else if (cue === "star") sound.play("star", { rate: 0.85 + i * 0.08 });
      else if (cue === "answer") sound.play("answer", { rate: 1 + 0.04 * i });
      else {
        sound.duck(3);
        sound.play("discovery");
      }
    };
  }, [stage]);
}

export function useMuted(): [boolean, (muted: boolean) => void] {
  const [muted, setMuted] = useState(sound.muted);
  useEffect(() => sound.subscribe(setMuted), []);
  return [muted, (m: boolean) => sound.setMuted(m)];
}
