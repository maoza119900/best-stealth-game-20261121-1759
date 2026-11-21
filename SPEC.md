# Mothlight — SPEC

A top-down stealth game, built from scratch in plain Canvas 2D + ES modules.
No library, no network request, no copied art, names, characters or levels.

## Fantasy

You are Pip, a small moth-thief in the moonlit garden of the Ember Manor.
Three ember-lanterns burn in the garden. Slip past the manor's lantern-guards,
gather all three lanterns, and reach the moon-gate unseen. One loud mistake
and the guards come running.

## Core loop

- Move with WASD / arrow keys. Hold Shift to sneak (slower, smaller noise,
  harder to spot). Mouse click (or Space) tosses a pebble at the cursor: the
  nearest guard walks over to investigate the noise.
- Guards patrol fixed waypoints and sweep the garden with vision cones.
  Walls block sight; bushes hide you completely while you stand still inside
  them (moving inside a bush rustles and can be seen up close).
- Being inside a vision cone fills the guard's suspicion. A full meter means
  spotted: the guard chases you. Break line of sight to lose the chase; the
  guard then searches your last seen spot and returns to patrol.
- Get caught (a chasing guard touches you) and you lose a wing — 3 wings,
  then the night ends (game over). Collect all 3 lanterns, then reach the
  moon-gate to clear the level. 3 levels, each larger and more guarded.
- Score: lanterns, time bonus, and a "ghost" bonus for clearing a level
  without ever being spotted.

## Levels

1. **First Garden** — 2 guards, open lawn, 2 bushes, teaches cones and cover.
2. **Hedge Maze** — 4 guards, hedge walls force routing, 4 bushes, pebble
   distractions matter.
3. **Ember Court** — 5 guards, faster patrols, long sight lines, tight timing.

Every level is data in `level.js`: walls, bushes, guard waypoints, lanterns,
exit, player start. Nothing is hard-coded in the world step.

## Rules the code enforces

- Vision is a cone (range + half-angle) plus line of sight: a wall segment
  between guard and player blocks the view. Detection fills faster when you
  are close, moving, and out of cover; sneaking and distance slow it.
- Noise: running makes noise in a radius; a pebble makes a louder point
  noise. Guards investigate the loudest recent noise, then resume patrol.
- Alert states per guard: PATROL → SUSPICIOUS (saw something briefly) →
  CHASE (meter full) → SEARCH (lost you) → PATROL. The HUD shows the worst
  guard state so the player always knows the heat.
- Fixed 1/60 s simulation steps, seeded RNG (`?seed=N` fixes the layout
  jitter), deterministic screenshot scenes via `?shot=start|play|hide|win`.

## Presentation

- Night palette: deep blue-green lawn, warm amber lantern light, pale
  moon-gate. Guards are amber cones on dark blue bodies; Pip is a pale moth
  with two wings that flutter as she moves.
- HUD: lanterns collected, wings left, level, timer, suspicion bar, and a
  one-line hint. Title, pause, level-clear, win and game-over screens.
- Sound is synthesized with WebAudio (soft footsteps, a chime on lantern
  pickup, a low alarm on spotted) — no audio files, and the game plays
  silently if audio is unavailable.
- Screens and text are in English; the game is fully playable by keyboard
  alone (mouse only adds the pebble toss).

## Files

- `game/index.html` — canvas + status line, loads `src/main.js` only.
- `game/src/config.js` — sizes, speeds, colours, tuning.
- `game/src/random.js` — seeded RNG.
- `game/src/level.js` — the three level definitions.
- `game/src/world.js` — simulation: movement, collision, vision, guard AI,
  noise, win/lose. No DOM in here, so it can be stepped headlessly.
- `game/src/input.js` — keyboard + mouse.
- `game/src/audio.js` — tiny WebAudio synth.
- `game/src/render.js` — all canvas drawing + screens.
- `game/src/shots.js` — staged screenshot scenes (real rules, scripted
  movement, fixed seeds).
- `game/src/main.js` — boot, fixed-step loop, `?shot=` mode.
- `main.ts` — copies `game/` + `screenshots/` to `/output`, writes
  `/output/dossier.json` with the kit's `buildDossier`.
- `screenshots/` — 4 real browser renders: title, mid-level play, hiding
  in a bush as a cone sweeps past, and the win screen.
