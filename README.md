# UNSCHEDULED MAINTENANCE

Status: **v1 playable.** This is a compact optical-repair puzzle set in a dark observatory. The telescope's mirrors have drifted. Across six authored repairs you realign mirrors, apertures and splitters until the beam reaches every receiver. Each repair tilts the camera up through the dome slit to draw a stranger fictional constellation. The night ends with a discovery: a constellation shaped like the telescope itself, with one star that blinks back. It runs as one three.js scene with a React HUD. All geometry, shaders and the star field are made in code, and there are no external assets.

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

Tab reaches every control, and each one has a label. `prefers-reduced-motion` turns off the camera moves, twinkle and pulsing, and cuts straight to each result.

## Development

```sh
bun install --frozen-lockfile
bun run dev      # http://127.0.0.1:4521/
bun run check    # tsc, Biome, bun test, production build into dist/
bun run preview  # http://127.0.0.1:4621/
```

Layout: `src/game/` holds the pure rules (beam trace, levels, reducer, solver), with tests in `tests/`. `src/scene/` holds the three.js scene. `src/ui/` holds the React HUD. `src/main.tsx` does the wiring. The arrival veil lives in `index.html` and `src/loader.ts`. `development/` is old smoke-test tooling and is not part of the game.

## Credits

Code, geometry, shaders, levels and constellations are original to this project. No third-party art, audio or font assets are used. Type is the system font stack. Libraries: three.js (MIT; `RoomEnvironment` is used for mirror reflections), React (MIT), GSAP (GreenSock standard licence), Tailwind CSS (MIT).
