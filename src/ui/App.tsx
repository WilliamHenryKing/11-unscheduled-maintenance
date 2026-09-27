import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { CONSTELLATIONS } from "../game/constellations";
import { adjustable, LEVELS } from "../game/levels";
import { trace } from "../game/optics";
import { type Action, createGame, type GameState, levelAt, reduce } from "../game/state";
import type { Stage } from "../scene/stage";
import { Adjusters } from "./Adjusters";
import { EndingCard, HintCard, RevealCard, TitleCard } from "./Cards";
import { Header } from "./Header";
import { useHintSeen, useKeys, useReducedMotion, useStageLayout } from "./hooks";

export function App({ stage }: { stage: Stage }) {
  const [game, dispatch] = useReducer(
    (s: GameState, a: Action) => reduce(s, a),
    undefined,
    () => createGame(),
  );
  const level = levelAt(game);
  const parts = useMemo(() => adjustable(level), [level]);
  const traced = useMemo(() => trace(level, game.states), [level, game.states]);
  const [revealed, setRevealed] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [hintSeen, markHintSeen] = useHintSeen();
  const reduced = useReducedMotion();
  const headerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  useStageLayout(stage, headerRef, panelRef);

  const playing = game.phase === "playing";
  const turnPart = useCallback(
    (id: string, step: 1 | -1) => {
      setFocusId(id);
      markHintSeen();
      dispatch({ type: "turn", id, step });
    },
    [markHintSeen],
  );

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
    };
  }, [stage, game.phase, game.level]);

  useKeys({
    enabled: playing,
    parts,
    focusId,
    setFocusId,
    turn: turnPart,
    reset: () => dispatch({ type: "reset" }),
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
        hidden={game.phase === "title" || game.phase === "ending"}
      />
      <div className={game.phase === "title" || revealed ? "invisible" : ""}>
        <Adjusters
          ref={panelRef}
          parts={parts}
          states={game.states}
          trace={traced}
          focusId={focusId}
          disabled={!playing}
          onFocus={setFocusId}
          onTurn={turnPart}
          onReset={() => dispatch({ type: "reset" })}
        />
      </div>
      {game.phase === "title" && <TitleCard onStart={() => dispatch({ type: "start" })} />}
      {playing && !hintSeen && <HintCard onDismiss={markHintSeen} />}
      {game.phase === "solved" && revealed && constellation && (
        <RevealCard
          constellation={constellation}
          final={final}
          onNext={() => dispatch({ type: "next" })}
        />
      )}
      {game.phase === "ending" && (
        <EndingCard
          repairs={LEVELS.length}
          turns={game.totalTurns}
          onReplay={() => dispatch({ type: "start" })}
        />
      )}
    </>
  );
}
