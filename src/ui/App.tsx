import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { sound } from "../audio/sound";
import { CONSTELLATIONS } from "../game/constellations";
import { adjustable, LEVELS } from "../game/levels";
import { trace } from "../game/optics";
import { type Action, createGame, type GameState, levelAt, reduce } from "../game/state";
import { type OpeningPhase, wantsTitle } from "../scene/opening";
import type { Stage } from "../scene/stage";
import { Adjusters } from "./Adjusters";
import { EndingCard, RevealCard } from "./Cards";
import { Header } from "./Header";
import { focusPlayControl, useKeys, useReducedMotion, useStageLayout } from "./hooks";
import { MuteToggle } from "./MuteToggle";
import { Guide, Title } from "./Opening";
import { useBeamCues, useSkyCues } from "./sound";

const GUIDE_KEY = "unscheduled-maintenance:guide-v1";
const initialGuide = () => {
  try {
    return localStorage.getItem(GUIDE_KEY) ? -1 : 0;
  } catch {
    return 0;
  }
};

export function App({ stage }: { stage: Stage }) {
  const [game, dispatch] = useReducer(
    (s: GameState, a: Action) => reduce(s, a),
    undefined,
    () => (wantsTitle ? createGame() : reduce(createGame(), { type: "start" })),
  );
  const level = levelAt(game);
  const parts = useMemo(() => adjustable(level), [level]);
  const traced = useMemo(() => trace(level, game.states), [level, game.states]);
  const [revealed, setRevealed] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [opening, setOpening] = useState<OpeningPhase>(wantsTitle ? "title" : "done");
  const [guide, setGuide] = useState(initialGuide);
  const reduced = useReducedMotion();
  const headerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  useStageLayout(stage, headerRef, panelRef);

  const playing = opening === "done" && game.phase === "playing";
  const choosePart = useCallback((id: string) => {
    setFocusId(id);
    setGuide((g) => (g === 0 ? 1 : g));
  }, []);
  const skipGuide = () => {
    setGuide(-1);
    try {
      localStorage.setItem(GUIDE_KEY, "seen");
    } catch {
      /* Optional storage. */
    }
  };
  useEffect(() => {
    stage.opening.onDone = () => {
      setOpening("done");
      dispatch({ type: "start" });
      requestAnimationFrame(() =>
        document.querySelector<HTMLCanvasElement>("canvas.stage")?.focus(),
      );
    };
    return () => {
      stage.opening.onDone = null;
    };
  }, [stage]);
  useEffect(() => {
    if (game.phase === "solved") setGuide((g) => (g >= 0 ? 2 : g));
  }, [game.phase]);
  const turnPart = useCallback(
    (id: string, step: 1 | -1) => {
      if (!playing) return;
      choosePart(id);
      const part = parts.find((p) => p.id === id);
      if (playing && part) {
        const rate = 0.94 + Math.random() * 0.12;
        sound.play(part.kind === "mirror" ? "turnMirror" : "turnTube", { rate });
      }
      dispatch({ type: "turn", id, step });
    },
    [choosePart, parts, playing],
  );
  const reset = () => {
    if (playing) sound.play("reset");
    dispatch({ type: "reset" });
  };
  /** Card buttons: a soft click, then the step. */
  const press = (action: Action) => {
    if (action.type === "next" && guide >= 0) skipGuide();
    sound.play("ui");
    dispatch(action);
    if (action.type === "next" || action.type === "start") focusPlayControl();
  };

  useBeamCues(level.index, traced);
  useSkyCues(stage);

  useEffect(() => {
    stage.still = reduced;
  }, [stage, reduced]);

  useEffect(() => {
    stage.onPick = turnPart;
  }, [stage, turnPart]);

  // A new bench for each repair; a fresh sky for each night.
  // biome-ignore lint/correctness/useExhaustiveDependencies: rebuild only when the repair changes
  useEffect(() => {
    if (level.index === 0) stage.clearSky();
    void stage.showLevel(level, game.states, trace(level, game.states), stage.still);
    setFocusId(null);
  }, [stage, level]);

  useEffect(() => {
    stage.update(game.states, traced);
  }, [stage, game.states, traced]);

  useEffect(() => {
    stage.setFocus(playing ? focusId : null);
  }, [stage, focusId, playing]);

  // Let the lit receivers glow a moment, then tilt up and draw the constellation.
  useEffect(() => {
    if (game.phase !== "solved") {
      if (game.phase !== "ending") setRevealed(false);
      return;
    }
    let live = true;
    const t = window.setTimeout(
      () => void stage.reveal(game.level, LEVELS.length).then(() => live && setRevealed(true)),
      stage.still ? 250 : 1100,
    );
    return () => {
      live = false;
      window.clearTimeout(t);
      stage.cancelReveal();
    };
  }, [stage, game.phase, game.level]);

  useKeys({
    enabled: playing,
    parts,
    focusId,
    setFocusId: choosePart,
    turn: turnPart,
    reset,
  });

  const constellation = CONSTELLATIONS[game.level];
  const final = game.level === LEVELS.length - 1;

  return (
    <>
      <Header
        ref={headerRef}
        level={level}
        total={LEVELS.length}
        trace={traced}
        hidden={opening !== "done" || game.phase === "ending"}
      />
      <div className={opening !== "done" || revealed ? "invisible" : ""}>
        <Adjusters
          ref={panelRef}
          parts={parts}
          states={game.states}
          trace={traced}
          focusId={focusId}
          disabled={!playing}
          onFocus={choosePart}
          onTurn={turnPart}
          onReset={reset}
        />
      </div>
      {opening === "title" && (
        <Title
          onBegin={() => {
            sound.play("ui");
            setOpening(reduced ? "done" : "glide");
            stage.opening.begin(reduced);
          }}
        />
      )}
      {opening === "done" && game.phase !== "ending" && guide >= 0 && (
        <Guide step={guide} revealed={revealed} final={final} onSkip={skipGuide} />
      )}
      {playing && guide < 0 && (
        <button
          type="button"
          className="guide-replay"
          aria-label="Replay the guide"
          onClick={() => {
            setFocusId(null);
            setGuide(0);
          }}
        >
          ?
        </button>
      )}
      {game.phase === "solved" && revealed && constellation && (
        <RevealCard
          constellation={constellation}
          final={final}
          onNext={() => press({ type: "next" })}
        />
      )}
      {game.phase === "ending" && (
        <EndingCard
          repairs={LEVELS.length}
          turns={game.totalTurns}
          onReplay={() => press({ type: "start" })}
        />
      )}
      <MuteToggle />
    </>
  );
}
