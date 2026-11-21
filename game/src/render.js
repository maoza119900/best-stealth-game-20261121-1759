// All canvas drawing for Mothlight: the night garden, vision cones, the
// moth and the guards, the HUD, and the title / pause / win / game-over
// screens. Pure drawing — it reads the world state and never mutates it.
import { COLORS, FIELD, GAME, GUARD, TILE, VIEW } from './config.js';
import { GUARD_CHASE, GUARD_INVESTIGATE, GUARD_SEARCH } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const W = VIEW.width;
  const H = VIEW.height;

  function checker() {
    for (let row = 0; row < FIELD.rows; row += 1) {
      for (let col = 0; col < FIELD.cols; col += 1) {
        ctx.fillStyle = (row + col) % 2 === 0 ? COLORS.lawnA : COLORS.lawnB;
        ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
      }
    }
    ctx.strokeStyle = COLORS.lawnEdge;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, W - 4, H - 4);
  }

  function drawExit(exit, allTaken, time) {
    const cx = exit.x + exit.w / 2;
    const cy = exit.y + exit.h / 2;
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.4);
    ctx.save();
    ctx.globalAlpha = allTaken ? 0.85 : 0.3;
    ctx.fillStyle = COLORS.exitGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 46 + pulse * 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = allTaken ? COLORS.exit : '#5d7d8c';
    ctx.beginPath();
    ctx.arc(cx, cy, 20, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx - 20, cy, 40, 16);
    ctx.fillStyle = '#0d1a14';
    ctx.beginPath();
    ctx.arc(cx, cy, 13, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx - 13, cy, 26, 16);
    ctx.restore();
    ctx.fillStyle = COLORS.hudDim;
    ctx.font = '12px sans-serif';
    // The gate can sit at the field's right edge: keep its label on screen.
    if (cx > VIEW.width - 100) {
      ctx.textAlign = 'right';
      ctx.fillText(allTaken ? 'MOON-GATE OPEN' : 'MOON-GATE (LOCKED)', VIEW.width - 8, exit.y + exit.h + 16);
    } else {
      ctx.textAlign = 'center';
      ctx.fillText(allTaken ? 'MOON-GATE OPEN' : 'MOON-GATE (LOCKED)', cx, exit.y + exit.h + 16);
    }
  }

  function drawLantern(lantern, time) {
    if (lantern.taken) return;
    const flicker = 0.85 + 0.15 * Math.sin(time * 5 + lantern.x);
    ctx.save();
    ctx.globalAlpha = 0.8 * flicker;
    ctx.fillStyle = COLORS.lanternGlow;
    ctx.beginPath();
    ctx.arc(lantern.x, lantern.y, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(lantern.x - 2, lantern.y + 8, 4, 8);
    ctx.fillStyle = COLORS.lantern;
    ctx.beginPath();
    ctx.arc(lantern.x, lantern.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(lantern.x, lantern.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBush(bush) {
    ctx.fillStyle = COLORS.bushDeep;
    ctx.fillRect(bush.x, bush.y, bush.w, bush.h);
    ctx.fillStyle = COLORS.bush;
    for (let i = 0; i < 9; i += 1) {
      const cx = bush.x + 12 + ((i * 37) % (bush.w - 20));
      const cy = bush.y + 12 + ((i * 53) % (bush.h - 20));
      ctx.beginPath();
      ctx.arc(cx, cy, 13, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = COLORS.bushLeaf;
    for (let i = 0; i < 6; i += 1) {
      const cx = bush.x + 18 + ((i * 61) % (bush.w - 30));
      const cy = bush.y + 16 + ((i * 29) % (bush.h - 28));
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawWall(wall) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(wall.x, wall.y, wall.w, 6);
    ctx.fillRect(wall.x, wall.y, 6, wall.h);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(wall.x + 0.5, wall.y + 0.5, wall.w - 1, wall.h - 1);
  }

  function drawCone(guard) {
    const alert = guard.state === GUARD_CHASE;
    const wary = guard.suspicion > 0.05 || guard.state === GUARD_SEARCH || guard.state === GUARD_INVESTIGATE;
    ctx.fillStyle = alert ? COLORS.coneAlert : wary ? COLORS.coneSuspicious : COLORS.cone;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.arc(guard.x, guard.y, guard.viewRange, guard.dir - GUARD.viewHalfAngle, guard.dir + GUARD.viewHalfAngle);
    ctx.closePath();
    ctx.fill();
  }

  function drawGuard(guard, time) {
    drawCone(guard);
    ctx.fillStyle = COLORS.guardBody;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 6, 0, Math.PI * 2);
    ctx.fill();
    // Facing tick.
    ctx.strokeStyle = COLORS.guard;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.dir) * 18, guard.y + Math.sin(guard.dir) * 18);
    ctx.stroke();
    // Suspicion ring.
    if (guard.suspicion > 0.02) {
      ctx.strokeStyle = guard.state === GUARD_CHASE ? COLORS.danger : COLORS.lantern;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, guard.radius + 6, -Math.PI / 2, -Math.PI / 2 + guard.suspicion * Math.PI * 2);
      ctx.stroke();
    }
    const mark = guard.state === GUARD_CHASE ? '!' : guard.suspicion > 0.05 ? '?' : null;
    if (mark) {
      ctx.fillStyle = guard.state === GUARD_CHASE ? COLORS.danger : COLORS.lantern;
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(mark, guard.x, guard.y - guard.radius - 8);
    }
  }

  function drawPlayer(player, time) {
    const flutter = player.moving ? Math.sin(time * 18) * 0.5 : Math.sin(time * 4) * 0.12;
    const px = player.x;
    const py = player.y;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(player.face);
    ctx.fillStyle = COLORS.playerWing;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.rotate(side * (0.6 + flutter * 0.4));
      ctx.beginPath();
      ctx.ellipse(-2, side * 9, 11, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2f22';
    ctx.beginPath();
    ctx.arc(8, -2.5, 1.8, 0, Math.PI * 2);
    ctx.arc(8, 2.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (player.sneaking) {
      ctx.strokeStyle = 'rgba(242, 234, 216, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(px, py, 17, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawHud(state, screen) {
    const taken = state.lanterns.filter((l) => l.taken).length;
    const worst = state.guards.reduce((m, g) => Math.max(m, g.suspicion), 0);
    const chasing = state.guards.some((g) => g.state === GUARD_CHASE);
    ctx.fillStyle = 'rgba(10, 18, 13, 0.72)';
    ctx.fillRect(0, 0, W, 34);
    ctx.fillStyle = COLORS.hud;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Level ${state.levelIndex + 1} · ${state.level.name}`, 12, 18);
    ctx.fillText(`Lanterns ${taken}/${GAME.lanternsPerLevel}`, 250, 18);
    ctx.fillText(`Wings ${'✦'.repeat(Math.max(0, state.wings))}${'·'.repeat(GAME.wings - Math.max(0, state.wings))}`, 390, 18);
    ctx.fillText(`Score ${state.score}`, 520, 18);
    const mm = String(Math.floor(state.levelTime / 60)).padStart(2, '0');
    const ss = String(Math.floor(state.levelTime % 60)).padStart(2, '0');
    ctx.fillText(`${mm}:${ss}`, 640, 18);
    // Suspicion bar.
    ctx.fillStyle = '#222';
    ctx.fillRect(700, 11, 120, 12);
    ctx.fillStyle = chasing ? COLORS.danger : worst > 0.05 ? COLORS.lantern : COLORS.ok;
    ctx.fillRect(700, 11, 120 * worst, 12);
    ctx.fillStyle = COLORS.hud;
    ctx.textAlign = 'left';
    ctx.fillText(chasing ? 'SPOTTED!' : worst > 0.05 ? 'Suspicious…' : 'Unseen', 830, 18);
    ctx.textBaseline = 'alphabetic';
    if (screen === SCREEN_PLAY) {
      ctx.fillStyle = COLORS.hudDim;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.level.hint, W / 2, H - 10);
    }
  }

  function overlay(title, lines, accent) {
    ctx.fillStyle = 'rgba(8, 14, 11, 0.78)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = accent ?? COLORS.hud;
    ctx.font = 'bold 54px Georgia, serif';
    ctx.fillText(title, W / 2, H / 2 - 70);
    ctx.fillStyle = COLORS.hud;
    ctx.font = '17px sans-serif';
    lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, H / 2 - 10 + i * 28);
    });
  }

  function draw(state, screen, best, banner) {
    ctx.clearRect(0, 0, W, H);
    checker();
    const level = state.level;
    const allTaken = state.lanterns.every((l) => l.taken);
    drawExit(level.exit, allTaken, state.time);
    for (const l of state.lanterns) drawLantern(l, state.time);
    for (const b of level.bushes) drawBush(b);
    for (const g of state.guards) drawGuard(g, state.time);
    drawPlayer(state.player, state.time);
    for (const w of level.walls) drawWall(w);
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255, 60, 40, ${Math.min(0.45, state.flash)})`;
      ctx.fillRect(0, 0, W, H);
    }
    drawHud(state, screen);
    if (banner) {
      ctx.fillStyle = 'rgba(10, 18, 13, 0.8)';
      const bw = 420;
      ctx.fillRect((W - bw) / 2, 52, bw, 36);
      ctx.fillStyle = COLORS.ok;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(banner, W / 2, 75);
    }
    if (screen === SCREEN_TITLE) {
      overlay('MOTHLIGHT', [
        'A moth-thief slips through the Ember Manor garden.',
        'Gather all three ember-lanterns, then reach the moon-gate unseen.',
        '',
        'Move: WASD / arrows · Sneak: hold Shift · Toss a pebble: click or Space',
        'Bushes hide you when you stand still. Amber cones are watching.',
        '',
        'Press Enter to play — P pauses',
      ]);
    } else if (screen === SCREEN_PAUSED) {
      overlay('Paused', ['Press P or Enter to keep sneaking.']);
    } else if (screen === SCREEN_OVER) {
      overlay(
        'The night ends',
        [`Score ${state.score} · Best ${Math.max(best, state.score)}`, '', 'Press Enter to try again'],
        COLORS.danger,
      );
    } else if (screen === SCREEN_WIN) {
      overlay(
        'Ghost of the garden',
        [
          `Every lantern gathered, every gate passed — score ${state.score}.`,
          state.spottedEver ? 'Seen along the way — but never caught.' : 'Never spotted once. A perfect ghost.',
          `Best ${Math.max(best, state.score)}`,
          '',
          'Press Enter to play again',
        ],
        COLORS.ok,
      );
    }
  }

  return { draw };
}
