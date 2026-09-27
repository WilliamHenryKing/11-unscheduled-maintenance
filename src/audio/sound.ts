// Sound design: a quiet music bed, an observatory hum, and instrument-like cues.
// Nothing is fetched or played until the first user gesture; the tab going hidden suspends it all.

export type Cue =
  | "turnMirror"
  | "turnTube"
  | "ui"
  | "lit"
  | "scatter"
  | "backside"
  | "reset"
  | "solved"
  | "star"
  | "dome"
  | "answer"
  | "discovery"
  | "toggle";

const FILES: Record<Cue | "music" | "hum", string> = {
  turnMirror: "turn-mirror",
  turnTube: "turn-tube",
  ui: "ui",
  lit: "lit",
  scatter: "scatter",
  backside: "backside",
  reset: "reset",
  solved: "solved",
  star: "star",
  dome: "dome",
  answer: "answer",
  discovery: "discovery",
  toggle: "toggle",
  music: "music",
  hum: "hum",
};

/** Per-cue mix levels, set by ear against the music bed. */
const LEVEL: Record<Cue, number> = {
  turnMirror: 0.55,
  turnTube: 0.6,
  ui: 0.35,
  lit: 0.6,
  scatter: 0.22,
  backside: 0.35,
  reset: 0.4,
  solved: 0.45,
  star: 0.35,
  dome: 0.4,
  answer: 0.5,
  discovery: 0.55,
  toggle: 0.35,
};

const MUTE_KEY = "unscheduled-maintenance:muted";
const MUSIC_GAP_S = 7;

export interface PlayOptions {
  rate?: number;
  gain?: number;
  delay?: number;
}

class Sound {
  muted = readMuted();
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private sfx: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private listeners = new Set<(muted: boolean) => void>();
  private musicTimer = 0;

  /** Call from a user gesture. Creates the context, then loads and starts the beds. */
  unlock() {
    if (this.ctx) {
      if (!document.hidden) void this.ctx.resume();
      return;
    }
    const Ctor =
      window.AudioContext ??
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(ctx.destination);
    this.music = ctx.createGain();
    this.music.gain.value = 0.42;
    this.music.connect(this.master);
    this.sfx = ctx.createGain();
    this.sfx.connect(this.master);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) void ctx.suspend();
      else void ctx.resume();
    });
    void this.load().then(() => {
      this.startHum();
      this.startMusic();
    });
  }

  private async load() {
    const ctx = this.ctx;
    if (!ctx) return;
    const base = import.meta.env.BASE_URL;
    await Promise.all(
      Object.entries(FILES).map(async ([key, file]) => {
        try {
          const res = await fetch(`${base}audio/${file}.mp3`);
          const data = await res.arrayBuffer();
          this.buffers.set(key, await ctx.decodeAudioData(data));
        } catch {
          // A missing cue stays silent rather than breaking play.
        }
      }),
    );
  }

  /** Low observatory hum: the engine loop, trimmed at both ends and softened with a low-pass. */
  private startHum() {
    const ctx = this.ctx;
    const buffer = this.buffers.get("hum");
    if (!ctx || !buffer || !this.master) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.loopStart = 0.08;
    src.loopEnd = buffer.duration - 0.08;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 520;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 4);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(0, 0.08);
  }

  /** The music plays through, rests a few seconds, then begins again. */
  private startMusic() {
    const ctx = this.ctx;
    const buffer = this.buffers.get("music");
    if (!ctx || !buffer || !this.music) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.music);
    src.onended = () => {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = window.setTimeout(() => this.startMusic(), MUSIC_GAP_S * 1000);
    };
    src.start(ctx.currentTime + 0.3);
  }

  play(cue: Cue, opts: PlayOptions = {}) {
    const ctx = this.ctx;
    const buffer = this.buffers.get(cue);
    if (!ctx || !buffer || !this.sfx || ctx.state !== "running") return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = opts.rate ?? 1;
    const gain = ctx.createGain();
    gain.gain.value = LEVEL[cue] * (opts.gain ?? 1);
    src.connect(gain).connect(this.sfx);
    src.start(ctx.currentTime + (opts.delay ?? 0));
  }

  /** Briefly lower the music under a feature cue such as the discovery jingle. */
  duck(seconds: number) {
    const ctx = this.ctx;
    if (!ctx || !this.music) return;
    const g = this.music.gain;
    const now = ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0.15, now + 0.2);
    g.setValueAtTime(0.15, now + seconds);
    g.linearRampToValueAtTime(0.42, now + seconds + 1.5);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    try {
      window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
      // Not persisted; still applies for this visit.
    }
    if (this.ctx && this.master) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(muted ? 0 : 1, now, 0.05);
    }
    for (const fn of this.listeners) fn(muted);
  }

  subscribe(fn: (muted: boolean) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export const sound = new Sound();

/** Start audio on the first pointer or key press; later gestures resume a context the browser suspended. */
export function unlockOnGesture() {
  const unlock = () => sound.unlock();
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}
