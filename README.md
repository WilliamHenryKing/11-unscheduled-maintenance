# UNSCHEDULED MAINTENANCE

Status: **v1 playable.** This is a compact optical-repair puzzle set in a dark observatory. The telescope's mirrors have drifted. Across six authored repairs you realign mirrors, apertures and splitters until the beam reaches every receiver. Each repair tilts the camera up through the dome slit to draw a stranger fictional constellation. The night ends with a discovery: a constellation shaped like the telescope itself, with one star that blinks back. It runs as one three.js scene with a React HUD. All geometry, shaders and the star field are made in code. The sound (music, ambience and cues) uses CC0 assets, credited below.

## How to play

- **Goal:** bring the warm beam from the telescope feed (the brass barrel) into the lens of every receiver. A receiver's lamp lights when it is fed.
- **Mirrors** turn light by a right angle, but only when they sit on a diagonal. A mirror that has drifted square-on scatters the beam, which shows as a pulsing red glint.
- **Apertures** are baffle tubes. Light passes along the tube, never across it.
- **Receivers** only see light entering their lens. Light on the back plate is wasted.
- **Splitters** (half-silvered glass) send light straight on and turn it at the same time.
- Parts with a **brass ring** can be adjusted. Parts without one are locked.

Controls:

| Action | Mouse / touch | Keyboard |
| --- | --- | --- |
| Turn a part 45° counter-clockwise | Click or tap it, or press ↺ in Adjusters | `Q` |
| Turn it back (clockwise) | Right-click it, or press ↻ | `E` |
| Choose a part | Click or tap it, or press its buttons | `1`–`9`, `←`/`→` |
| Reset the level's drift | "Reset drift" | `R` |
| Mute or unmute sound (remembered) | Speaker button | `M` |

Tab reaches every control, and each one has a label. `prefers-reduced-motion` turns off the camera moves, twinkle and pulsing, and cuts straight to each result.

## Sound

- **Music:** a quiet ambient bed that plays through, rests seven seconds and starts again.
- **Ambience:** a low-passed observatory hum loop.
- **Cues:** every meaningful event has one. Turning a mirror gives a metal tick, and turning an aperture or splitter a switch. Receivers chime as they light, rising in pitch per receiver. New misalignments crackle, and light on a receiver's back plate bongs. Solving plays a confirmation, the camera tilt a dome-shutter sound, and each star drawn a pluck. The answering star gives a glass ping per blink, and the discovery a steel-drum jingle that ducks the music. The cards, reset and mute each have soft clicks.

Nothing is fetched or played before the first click, tap or key press. That first gesture starts audio. Hiding the tab suspends everything, and showing it again resumes. Mute persists between visits. The files are mono MP3 SFX plus the 64 kbps music track, about 1.2 MB in total, in `public/audio/`.

## Development

```sh
bun install --frozen-lockfile
bun run dev      # http://127.0.0.1:4521/
bun run check    # tsc, Biome, bun test, production build into dist/
bun run preview  # http://127.0.0.1:4621/
```

Layout: `src/game/` holds the pure rules (beam trace, levels, reducer, solver), with tests in `tests/`. `src/scene/` holds the three.js scene. `src/ui/` holds the React HUD. `src/main.tsx` does the wiring. The arrival veil lives in `index.html` and `src/loader.ts`. `development/` is old smoke-test tooling and is not part of the game.

## Credits

Code, geometry, shaders, levels and constellations are original to this project. No third-party art or font assets are used.

Audio, all CC0 (public domain dedication, https://creativecommons.org/publicdomain/zero/1.0/), transcoded to MP3 for this project:

| File | Original | Author | Source |
| --- | --- | --- | --- |
| `music.mp3` | *Observing The Star* (`ObservingTheStar.ogg`) | yd | https://opengameart.org/content/another-space-background-track |
| `hum.mp3` | `spaceEngineLow_001.ogg` (Sci-fi Sounds) | Kenney | https://kenney.nl/assets/sci-fi-sounds |
| `dome.mp3` | `doorOpen_001.ogg` (Sci-fi Sounds) | Kenney | https://kenney.nl/assets/sci-fi-sounds |
| `turn-mirror.mp3` | `impactMetal_light_000.ogg` (Impact Sounds) | Kenney | https://kenney.nl/assets/impact-sounds |
| `turn-tube.mp3` | `switch_002.ogg` (Interface Sounds) | Kenney | https://kenney.nl/assets/interface-sounds |
| `ui.mp3` | `select_002.ogg` (Interface Sounds) | Kenney | https://kenney.nl/assets/interface-sounds |
| `lit.mp3` | `glass_002.ogg` (Interface Sounds) | Kenney | https://kenney.nl/assets/interface-sounds |
| `answer.mp3` | `glass_005.ogg` (Interface Sounds) | Kenney | https://kenney.nl/assets/interface-sounds |
| `scatter.mp3` | `error_004.ogg` (Interface Sounds) | Kenney | https://kenney.nl/assets/interface-sounds |
| `backside.mp3` | `bong_001.ogg` (Interface Sounds) | Kenney | https://kenney.nl/assets/interface-sounds |
| `reset.mp3` | `back_002.ogg` (Interface Sounds) | Kenney | https://kenney.nl/assets/interface-sounds |
| `solved.mp3` | `confirmation_004.ogg` (Interface Sounds) | Kenney | https://kenney.nl/assets/interface-sounds |
| `star.mp3` | `pluck_001.ogg` (Interface Sounds) | Kenney | https://kenney.nl/assets/interface-sounds |
| `toggle.mp3` | `toggle_001.ogg` (Interface Sounds) | Kenney | https://kenney.nl/assets/interface-sounds |
| `discovery.mp3` | `jingles_STEEL16.ogg` (Music Jingles) | Kenney | https://kenney.nl/assets/music-jingles |

Thanks to Kenney (www.kenney.nl) and yd. Credit isn't required under CC0, but it's given here gladly. Type is the system font stack. Libraries: three.js (MIT; `RoomEnvironment` is used for mirror reflections), React (MIT), GSAP (GreenSock standard licence), Tailwind CSS (MIT).
