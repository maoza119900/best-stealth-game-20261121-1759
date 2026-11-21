// Staged screenshot scenes behind ?shot=start|play|hide|win. Each scene
// sets up a real world state with the game's own code, then steps the real
// rules forward for a fixed time, so the frame is what the game really
// looks like and the same seed always gives the same frame.
import { STEP } from './config.js';
import { SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const SAMPLE = STEP;

/** Step the world with a fixed input for `seconds`. */
function march(world, seconds, dx, dy, sneak = false) {
  const steps = Math.round(seconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) {
    world.step(SAMPLE, { dx, dy, sneak }, null);
    if (world.state.status !== 'play') break;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show. Unknown names stage the title.
 */
export function stageShot(name, world) {
  const state = world.state;
  if (name === 'play') {
    world.reset();
    // Walk straight down the quiet west edge to the lantern in the corner.
    march(world, 3.0, 0, 1);
    march(world, 0.6, 1, 0);
    march(world, 1.0, 0, 0);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'hide') {
    world.reset();
    // Crouch still in the north-east bush while the patrolling guard's cone
    // sweeps across it: hidden, unseen, heart pounding.
    state.player.x = 740;
    state.player.y = 160;
    march(world, 5.5, 0, 0);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'win') {
    world.reset();
    world.loadLevel(2);
    for (const lantern of state.lanterns) lantern.taken = true;
    state.player.x = state.level.exit.x + state.level.exit.w / 2;
    state.player.y = state.level.exit.y + state.level.exit.h / 2;
    march(world, 0.2, 0, 0);
    return { screen: state.status === 'win' ? SCREEN_WIN : SCREEN_PLAY, best: 0 };
  }
  // start (and anything else): the title over a garden already patrolling.
  world.reset();
  march(world, 5, 0, 0);
  return { screen: SCREEN_TITLE, best: 0 };
}
