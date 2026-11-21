// The three gardens. Every level is data: walls and bushes are rectangles
// in pixels, guards walk their waypoint loops, lanterns are points, the
// exit is a rectangle, and the player starts at `start`. The field is
// 960 x 640 (24 x 16 tiles of 40 px); the border is solid.
export const LEVELS = [
  {
    name: 'First Garden',
    hint: 'Stay out of the amber cones. Bushes hide you — stand still inside one.',
    guardSpeed: 1.0,
    viewRange: 1.0,
    start: { x: 64, y: 64 },
    exit: { x: 872, y: 560, w: 64, h: 48 },
    walls: [
      { x: 280, y: 120, w: 120, h: 40 },
      { x: 560, y: 420, w: 120, h: 40 },
    ],
    bushes: [
      { x: 120, y: 420, w: 120, h: 80 },
      { x: 680, y: 120, w: 120, h: 80 },
    ],
    lanterns: [
      { x: 888, y: 80 },
      { x: 80, y: 560 },
      { x: 480, y: 320 },
    ],
    guards: [
      { waypoints: [{ x: 300, y: 200 }, { x: 660, y: 200 }] },
      { waypoints: [{ x: 760, y: 320 }, { x: 760, y: 520 }] },
    ],
  },
  {
    name: 'Hedge Maze',
    hint: 'Hedges block sight — use them. Toss a pebble (click) to pull a guard away.',
    guardSpeed: 1.1,
    viewRange: 1.0,
    start: { x: 64, y: 576 },
    exit: { x: 872, y: 32, w: 64, h: 48 },
    walls: [
      { x: 200, y: 0, w: 36, h: 240 },
      { x: 200, y: 400, w: 36, h: 240 },
      { x: 440, y: 160, w: 36, h: 320 },
      { x: 680, y: 0, w: 36, h: 240 },
      { x: 680, y: 400, w: 36, h: 240 },
      { x: 440, y: 480, w: 200, h: 36 },
    ],
    bushes: [
      { x: 80, y: 120, w: 100, h: 80 },
      { x: 320, y: 520, w: 100, h: 80 },
      { x: 520, y: 40, w: 100, h: 80 },
      { x: 780, y: 280, w: 100, h: 80 },
    ],
    lanterns: [
      { x: 888, y: 560 },
      { x: 80, y: 80 },
      { x: 560, y: 320 },
    ],
    guards: [
      { waypoints: [{ x: 320, y: 120 }, { x: 320, y: 520 }] },
      { waypoints: [{ x: 560, y: 120 }, { x: 560, y: 440 }] },
      { waypoints: [{ x: 520, y: 320 }, { x: 880, y: 320 }] },
      { waypoints: [{ x: 800, y: 120 }, { x: 800, y: 520 }] },
    ],
  },
  {
    name: 'Ember Court',
    hint: 'Five guards, long sight lines. Sneak (Shift) and time the patrols.',
    guardSpeed: 1.25,
    viewRange: 1.15,
    start: { x: 480, y: 576 },
    exit: { x: 448, y: 32, w: 64, h: 48 },
    walls: [
      { x: 300, y: 200, w: 60, h: 60 },
      { x: 600, y: 200, w: 60, h: 60 },
      { x: 300, y: 380, w: 60, h: 60 },
      { x: 600, y: 380, w: 60, h: 60 },
      { x: 450, y: 280, w: 60, h: 80 },
    ],
    bushes: [
      { x: 80, y: 280, w: 100, h: 80 },
      { x: 780, y: 280, w: 100, h: 80 },
      { x: 430, y: 480, w: 100, h: 80 },
    ],
    lanterns: [
      { x: 80, y: 80 },
      { x: 880, y: 80 },
      { x: 480, y: 400 },
    ],
    guards: [
      { waypoints: [{ x: 200, y: 140 }, { x: 760, y: 140 }] },
      { waypoints: [{ x: 200, y: 500 }, { x: 760, y: 500 }] },
      { waypoints: [{ x: 140, y: 200 }, { x: 140, y: 440 }] },
      { waypoints: [{ x: 820, y: 200 }, { x: 820, y: 440 }] },
      { waypoints: [{ x: 380, y: 240 }, { x: 580, y: 240 }] },
    ],
  },
];
