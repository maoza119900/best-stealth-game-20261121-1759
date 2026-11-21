// Boot and the one loop for Mothlight: input is read every frame, the
// world advances in fixed 1/60 s steps (several in a slow frame, none in a
// fast one), and the renderer paints what is there. The game moves between
// five screens: title, play, paused, game over and win.
//
// ?seed=N fixes the layout jitter. ?shot=start|play|hide|win (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import {
  EVENT_CAUGHT,
  EVENT_LANTERN,
  EVENT_LEVEL_CLEAR,
  EVENT_OVER,
  EVENT_PEBBLE,
  EVENT_SPOTTED,
  EVENT_WIN,
  createWorld,
} from './world.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import {
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_WIN,
  createRenderer,
} from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts one visit.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, null);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, (point) => {
    if (screen === SCREEN_PLAY) pendingPebble = point;
  });
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let pendingPebble = null;
  let banner = null;
  let bannerUntil = 0;

  // Screen readers (and anyone watching the page's text) hear the screen
  // changes and each big moment.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    banner = null;
    screen = SCREEN_PLAY;
    announce(`Playing ${world.state.level.name}. ${world.state.wings} wings.`);
  }

  function handleEvents(events) {
    if (events & EVENT_LANTERN) {
      audio.lantern();
      announce('Lantern gathered.');
    }
    if (events & EVENT_PEBBLE) audio.pebble();
    if (events & EVENT_SPOTTED) {
      audio.spotted();
      announce('Spotted! Break line of sight!');
    }
    if (events & EVENT_CAUGHT) {
      audio.caught();
      announce(`Caught! ${world.state.wings} wings left.`);
    }
    if (events & EVENT_LEVEL_CLEAR) {
      audio.clear();
      banner = `Level clear — ${world.state.level.name}`;
      bannerUntil = performance.now() + 2200;
      announce(banner);
    }
    if (events & EVENT_WIN) {
      audio.clear();
      screen = SCREEN_WIN;
      best = Math.max(best, world.state.score);
      saveBest(best);
      announce(`You win! Score ${world.state.score}.`);
    }
    if (events & EVENT_OVER) {
      screen = SCREEN_OVER;
      best = Math.max(best, world.state.score);
      saveBest(best);
      announce(`Game over. Score ${world.state.score}.`);
    }
  }

  window.addEventListener('keydown', (e) => {
    audio.unlock();
    if (e.code === 'Enter') {
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN) startGame();
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
    }
    if (e.code === 'KeyP') {
      if (screen === SCREEN_PLAY) screen = SCREEN_PAUSED;
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
    }
  });

  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    if (screen === SCREEN_PLAY) {
      accumulator += elapsed;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        let pebble = pendingPebble;
        pendingPebble = null;
        if (!pebble) pebble = input.takePebble();
        if (pebble === 'ahead') {
          const p = world.state.player;
          pebble = { x: p.x + Math.cos(p.face) * 120, y: p.y + Math.sin(p.face) * 120 };
        }
        handleEvents(world.step(STEP, input.read(), pebble));
      }
      if (banner && now > bannerUntil) banner = null;
    }
    renderer.draw(world.state, screen, best, banner);
  }

  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
