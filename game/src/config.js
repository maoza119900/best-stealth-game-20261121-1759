// Tuning and look for Mothlight: sizes, speeds, colours. Everything the
// simulation and the renderer share lives here so a number changes in one
// place.
export const STEP = 1 / 60;
export const TILE = 40;
export const FIELD = { cols: 24, rows: 16 };
export const VIEW = { width: FIELD.cols * TILE, height: FIELD.rows * TILE };

export const PLAYER = {
  radius: 11,
  walkSpeed: 165,
  sneakSpeed: 85,
  // Running is the default pace; sneaking is Shift. Noise radius while
  // running: guards inside it hear you and come looking.
  noiseRadius: 95,
  sneakNoiseRadius: 0,
};

export const GUARD = {
  radius: 13,
  patrolSpeed: 62,
  chaseSpeed: 148,
  searchSpeed: 95,
  viewRange: 210,
  // Half-angle of the vision cone, in radians (~38 degrees each side).
  viewHalfAngle: 0.66,
  // Suspicion fills 0..1. Rates are per second while the player is seen.
  suspicionRate: 1.35,
  suspicionCloseRate: 2.4,
  suspicionDecay: 0.45,
  // Inside this range a moving player is seen almost at once.
  closeRange: 70,
  // A guard that loses you searches this long, then walks home.
  searchSeconds: 4,
  // How far a pebble or a footstep can be heard from.
  hearRadius: 260,
};

export const GAME = {
  wings: 3,
  lanternsPerLevel: 3,
  // Catching a lantern: +100. Clearing a level: +250 and a time bonus.
  lanternScore: 100,
  levelScore: 250,
  ghostBonus: 200,
  // Seconds of time bonus left at most (1 point per 0.1 s under par).
  levelParSeconds: 90,
};

export const COLORS = {
  lawnA: '#16281f',
  lawnB: '#13241c',
  lawnEdge: '#0d1a14',
  wall: '#3a3f4a',
  wallTop: '#565d6d',
  bush: '#1e4d2e',
  bushLeaf: '#2c6b3f',
  bushDeep: '#173d24',
  lantern: '#ffb347',
  lanternGlow: 'rgba(255, 179, 71, 0.20)',
  exit: '#bfe8ff',
  exitGlow: 'rgba(191, 232, 255, 0.20)',
  player: '#f2ead8',
  playerWing: '#d8c9a3',
  guard: '#e8b34b',
  guardBody: '#2b3446',
  cone: 'rgba(255, 196, 66, 0.20)',
  coneAlert: 'rgba(255, 84, 66, 0.30)',
  coneSuspicious: 'rgba(255, 196, 66, 0.34)',
  hud: '#e8e4d5',
  hudDim: '#9aa58f',
  danger: '#ff6b5e',
  ok: '#8fd6a0',
};

export const BEST_KEY = 'mothlight-best';
