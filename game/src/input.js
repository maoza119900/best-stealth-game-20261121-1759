// Keyboard and mouse: WASD / arrows to move, Shift to sneak, click (or
// Space) to toss a pebble at the cursor. The loop polls `read()` every
// frame; a pebble throw is a one-shot event, so `takePebble()` consumes it.
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';

const KEYS = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

export function createInput(canvas, onPebble) {
  const held = new Set();
  let sneak = false;
  let pebble = null;

  function key(e, down) {
    const dir = KEYS[e.code];
    if (dir) {
      if (down) held.add(dir);
      else held.delete(dir);
      e.preventDefault();
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') sneak = down;
    if (down && (e.code === 'Enter' || e.code === 'Space')) {
      // Space tosses a pebble ahead of the player; Enter confirms menus.
      if (e.code === 'Space') pebble = 'ahead';
      e.preventDefault();
    }
  }

  window.addEventListener('keydown', (e) => key(e, true));
  window.addEventListener('keyup', (e) => key(e, false));
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    if (onPebble) onPebble({ x, y });
  });

  return {
    read() {
      const dx = (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0);
      const dy = (held.has('down') ? 1 : 0) - (held.has('up') ? 1 : 0);
      return { dx, dy, sneak };
    },
    takePebble() {
      const p = pebble;
      pebble = null;
      return p;
    },
  };
}
