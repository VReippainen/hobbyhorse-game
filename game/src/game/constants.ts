export const GRAVITY = 0.65;
export const JUMP_FORCE = -12;
export const BASE_SPEED = 5;
export const SPEED_INCREMENT = 0.0015;
export const MIN_SPAWN_INTERVAL = 50;
export const MAX_SPAWN_INTERVAL = 120;
export const INITIAL_SPAWN_DELAY = 1260; // ~21s at 60fps before first obstacle
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 56;
export const GROUND_HEIGHT = 60;

export const OBSTACLE_CONFIGS = {
  jump: { width: 36, height: 40, speedMultiplier: 1 },
  dog: { width: 40, height: 30, speedMultiplier: 1 },
  car: { width: 64, height: 36, speedMultiplier: 1.8 },
} as const;
