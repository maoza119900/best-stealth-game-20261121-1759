// The simulation for Mothlight: movement, collision, vision cones with
// line of sight, guard alert states, noise, lanterns, and win/lose. No DOM
// in here, so the same code runs in the browser and in a headless check.
import { FIELD, GAME, GUARD, PLAYER, STEP } from './config.js';
import { LEVELS } from './level.js';

export const EVENT_LANTERN = 1;
export const EVENT_SPOTTED = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_LEVEL_CLEAR = 8;
export const EVENT_WIN = 16;
export const EVENT_OVER = 32;
export const EVENT_PEBBLE = 64;

export const GUARD_PATROL = 'patrol';
export const GUARD_CHASE = 'chase';
export const GUARD_SEARCH = 'search';
export const GUARD_INVESTIGATE = 'investigate';

const VIEW_W = FIELD.cols * 40;
const VIEW_H = FIELD.rows * 40;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/** True when the segment from (x1,y1) to (x2,y2) is blocked by a wall. */
function blockedByWalls(x1, y1, x2, y2, walls) {
  for (const w of walls) {
    if (pointInRect(x2, y2, w)) return true;
    const edges = [
      [w.x, w.y, w.x + w.w, w.y],
      [w.x + w.w, w.y, w.x + w.w, w.y + w.h],
      [w.x + w.w, w.y + w.h, w.x, w.y + w.h],
      [w.x, w.y + w.h, w.x, w.y],
    ];
    for (const [ax, ay, bx, by] of edges) {
      if (segmentsCross(x1, y1, x2, y2, ax, ay, bx, by)) return true;
    }
  }
  return false;
}

/** Move a circle by (dx, dy), sliding along wall rectangles. */
function moveCircle(body, dx, dy, walls) {
  const r = body.radius;
  let nx = clamp(body.x + dx, r, VIEW_W - r);
  for (const w of walls) {
    if (nx + r > w.x && nx - r < w.x + w.w && body.y + r > w.y && body.y - r < w.y + w.h) {
      nx = dx > 0 ? w.x - r : w.x + w.w + r;
    }
  }
  body.x = nx;
  let ny = clamp(body.y + dy, r, VIEW_H - r);
  for (const w of walls) {
    if (body.x + r > w.x && body.x - r < w.x + w.w && ny + r > w.y && ny - r < w.y + w.h) {
      ny = dy > 0 ? w.y - r : w.y + w.h + r;
    }
  }
  body.y = ny;
}

function makeGuard(def, level) {
  const first = def.waypoints[0];
  return {
    x: first.x,
    y: first.y,
    radius: GUARD.radius,
    dir: 0,
    waypointIndex: 1 % def.waypoints.length,
    waypoints: def.waypoints,
    state: GUARD_PATROL,
    suspicion: 0,
    wait: 0,
    lastSeen: null,
    loseTimer: 0,
    searchTimer: 0,
    investigate: null,
    speedFactor: level.guardSpeed,
    viewRange: GUARD.viewRange * level.viewRange,
  };
}

export function createWorld(random) {
  const state = {
    levelIndex: 0,
    score: 0,
    wings: GAME.wings,
    time: 0,
    levelTime: 0,
    status: 'play',
    spottedEver: false,
    levelSpotted: false,
    player: { x: 0, y: 0, radius: PLAYER.radius, sneaking: false, moving: false, face: 0 },
    guards: [],
    lanterns: [],
    level: null,
    flash: 0,
  };

  function loadLevel(index) {
    const level = LEVELS[index];
    state.level = level;
    state.levelIndex = index;
    state.levelTime = 0;
    state.levelSpotted = false;
    state.player.x = level.start.x;
    state.player.y = level.start.y;
    state.player.face = 0;
    state.guards = level.guards.map((g) => makeGuard(g, level));
    state.lanterns = level.lanterns.map((p) => ({ x: p.x, y: p.y, taken: false }));
  }

  function reset() {
    state.score = 0;
    state.wings = GAME.wings;
    state.time = 0;
    state.status = 'play';
    state.spottedEver = false;
    state.flash = 0;
    loadLevel(0);
  }

  function inBush(x, y) {
    for (const b of state.level.bushes) if (pointInRect(x, y, b)) return true;
    return false;
  }

  /** Can this guard see the player right now? */
  function canSee(guard) {
    const p = state.player;
    const dx = p.x - guard.x;
    const dy = p.y - guard.y;
    const dist = Math.hypot(dx, dy);
    if (dist > guard.viewRange) return false;
    const hidden = inBush(p.x, p.y) && !p.moving;
    if (hidden) return false;
    if (inBush(p.x, p.y) && p.moving && dist > GUARD.closeRange) return false;
    const angle = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(angle, guard.dir)) > GUARD.viewHalfAngle && dist > GUARD.closeRange * 0.6) {
      return false;
    }
    if (blockedByWalls(guard.x, guard.y, p.x, p.y, state.level.walls)) return false;
    return true;
  }

  function moveToward(body, tx, ty, speed, dt) {
    const dx = tx - body.x;
    const dy = ty - body.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return true;
    const step = Math.min(dist, speed * dt);
    moveCircle(body, (dx / dist) * step, (dy / dist) * step, state.level.walls);
    return dist - step < 2;
  }

  function step(dt, input, pebble) {
    if (state.status !== 'play') return 0;
    let events = 0;
    state.time += dt;
    state.levelTime += dt;
    if (state.flash > 0) state.flash -= dt;

    const p = state.player;
    const len = Math.hypot(input.dx, input.dy) || 1;
    const speed = input.sneak ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    p.sneaking = input.sneak;
    p.moving = input.dx !== 0 || input.dy !== 0;
    if (p.moving) p.face = Math.atan2(input.dy, input.dx);
    moveCircle(p, (input.dx / len) * speed * dt, (input.dy / len) * speed * dt, state.level.walls);

    // A thrown pebble: the nearest guard in earshot walks over to look.
    if (pebble) {
      events |= EVENT_PEBBLE;
      let best = null;
      let bestDist = Infinity;
      for (const g of state.guards) {
        const d = Math.hypot(pebble.x - g.x, pebble.y - g.y);
        if (d < GUARD.hearRadius && d < bestDist) {
          best = g;
          bestDist = d;
        }
      }
      if (best && best.state !== GUARD_CHASE) {
        best.state = GUARD_INVESTIGATE;
        best.investigate = { x: pebble.x, y: pebble.y };
        best.searchTimer = 0;
        best.suspicion = Math.max(best.suspicion, 0.4);
      }
    }

    // Running footsteps carry: guards in earshot turn toward the noise.
    if (p.moving && !p.sneaking) {
      for (const g of state.guards) {
        if (g.state === GUARD_PATROL && Math.hypot(p.x - g.x, p.y - g.y) < PLAYER.noiseRadius) {
          g.dir = Math.atan2(p.y - g.y, p.x - g.x);
          g.suspicion = Math.min(0.6, g.suspicion + dt * 0.5);
        }
      }
    }

    // Lantern pickup.
    for (const l of state.lanterns) {
      if (!l.taken && Math.hypot(p.x - l.x, p.y - l.y) < 30) {
        l.taken = true;
        state.score += GAME.lanternScore;
        events |= EVENT_LANTERN;
      }
    }

    // Exit: only opens once every lantern is taken.
    const allTaken = state.lanterns.every((l) => l.taken);
    if (allTaken && pointInRect(p.x, p.y, state.level.exit)) {
      state.score += GAME.levelScore;
      state.score += Math.max(0, Math.round((GAME.levelParSeconds - state.levelTime) * 10));
      if (!state.levelSpotted) state.score += GAME.ghostBonus;
      if (state.levelIndex + 1 >= LEVELS.length) {
        state.status = 'win';
        events |= EVENT_WIN;
      } else {
        events |= EVENT_LEVEL_CLEAR;
        loadLevel(state.levelIndex + 1);
      }
      return events;
    }

    // Guards.
    for (const g of state.guards) {
      const seen = canSee(g);
      const dist = Math.hypot(p.x - g.x, p.y - g.y);
      if (seen) {
        g.lastSeen = { x: p.x, y: p.y };
        g.loseTimer = 0;
        let rate = dist < GUARD.closeRange ? GUARD.suspicionCloseRate : GUARD.suspicionRate;
        rate *= 1 - (dist / g.viewRange) * 0.4;
        if (p.sneaking) rate *= 0.55;
        g.suspicion = Math.min(1, g.suspicion + rate * dt);
        if (g.suspicion >= 1 && g.state !== GUARD_CHASE) {
          g.state = GUARD_CHASE;
          state.spottedEver = true;
          state.levelSpotted = true;
          events |= EVENT_SPOTTED;
        }
      } else {
        g.suspicion = Math.max(0, g.suspicion - GUARD.suspicionDecay * dt);
      }

      if (g.state === GUARD_PATROL) {
        if (g.wait > 0) {
          g.wait -= dt;
        } else {
          const target = g.waypoints[g.waypointIndex];
          const arrived = moveToward(g, target.x, target.y, GUARD.patrolSpeed * g.speedFactor, dt);
          g.dir = Math.atan2(target.y - g.y, target.x - g.x);
          if (arrived) {
            g.waypointIndex = (g.waypointIndex + 1) % g.waypoints.length;
            g.wait = 0.7;
          }
        }
      } else if (g.state === GUARD_CHASE) {
        const target = seen ? { x: p.x, y: p.y } : g.lastSeen;
        if (target) {
          moveToward(g, target.x, target.y, GUARD.chaseSpeed * g.speedFactor, dt);
          g.dir = Math.atan2(target.y - g.y, target.x - g.x);
        }
        if (!seen) {
          g.loseTimer += dt;
          if (g.loseTimer > 1.5) {
            g.state = GUARD_SEARCH;
            g.searchTimer = GUARD.searchSeconds;
          }
        }
        if (Math.hypot(p.x - g.x, p.y - g.y) < p.radius + g.radius + 2) {
          state.wings -= 1;
          state.flash = 0.6;
          events |= EVENT_CAUGHT;
          if (state.wings <= 0) {
            state.status = 'over';
            events |= EVENT_OVER;
            return events;
          }
          // Caught: drop back at the garden gate, guards lose the trail.
          p.x = state.level.start.x;
          p.y = state.level.start.y;
          for (const other of state.guards) {
            other.state = GUARD_PATROL;
            other.suspicion = 0;
            other.lastSeen = null;
            other.investigate = null;
          }
          return events;
        }
      } else if (g.state === GUARD_SEARCH) {
        if (g.lastSeen && Math.hypot(g.lastSeen.x - g.x, g.lastSeen.y - g.y) > 4) {
          const arrived = moveToward(g, g.lastSeen.x, g.lastSeen.y, GUARD.searchSpeed * g.speedFactor, dt);
          if (arrived) g.searchTimer -= dt;
          else g.dir = Math.atan2(g.lastSeen.y - g.y, g.lastSeen.x - g.x);
        } else {
          g.searchTimer -= dt;
          g.dir += dt * 1.6;
        }
        if (g.searchTimer <= 0) {
          g.state = GUARD_PATROL;
          g.suspicion = 0;
          g.lastSeen = null;
        }
      } else if (g.state === GUARD_INVESTIGATE) {
        const target = g.investigate;
        if (target) {
          const arrived = moveToward(g, target.x, target.y, GUARD.searchSpeed * g.speedFactor, dt);
          g.dir = Math.atan2(target.y - g.y, target.x - g.x);
          if (arrived) {
            g.searchTimer -= dt * 0.5;
            g.dir += dt * 1.8;
            if (g.searchTimer <= -1.5) {
              g.state = GUARD_PATROL;
              g.investigate = null;
              g.searchTimer = 0;
            }
          }
        }
      }
    }
    return events;
  }

  reset();
  return { state, reset, step, loadLevel };
}
