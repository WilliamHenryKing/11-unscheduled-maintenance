import { useEffect } from "react";
import { sound } from "../audio/sound";
import { useMuted } from "./sound";

/** Persistent sound switch: button plus the M key, remembered between visits. */
export function MuteToggle() {
  const [muted, setMuted] = useMuted();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "m" || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      sound.setMuted(!sound.muted);
      sound.play("toggle");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <button
      type="button"
      aria-pressed={muted}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      aria-keyshortcuts="M"
      title={`${muted ? "Unmute" : "Mute"} (M)`}
      onClick={() => {
        setMuted(!muted);
        sound.play("toggle");
      }}
      className="panel pointer-events-auto fixed top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-10 grid size-11 place-items-center rounded-full text-paper hover:text-brass md:top-auto md:right-6 md:bottom-6"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none">
        <path
          d="M4 9h4l5-4v14l-5-4H4z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {muted ? (
          <path
            d="M17 9l5 6m0-6l-5 6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  );
}
