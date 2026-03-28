import { GameState, Obstacle, ObstacleType } from "./types";
import {
  GRAVITY,
  JUMP_FORCE,
  BASE_SPEED,
  SPEED_INCREMENT,
  MIN_SPAWN_INTERVAL,
  MAX_SPAWN_INTERVAL,
  INITIAL_SPAWN_DELAY,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  GROUND_HEIGHT,
  OBSTACLE_CONFIGS,
} from "./constants";

let nextId = 0;
function genId() {
  return `obs_${nextId++}`;
}

export function createInitialState(canvasHeight: number): GameState {
  const groundY = canvasHeight - GROUND_HEIGHT - PLAYER_HEIGHT;
  const highScore = Number(localStorage.getItem("keppari_highscore") || "0");
  return {
    player: {
      x: 60,
      y: groundY,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      velocityY: 0,
      isJumping: false,
    },
    obstacles: [],
    speed: BASE_SPEED,
    score: 0,
    highScore,
    gameOver: false,
    started: false,
    groundY,
    frameCount: 0,
  };
}

export function jump(state: GameState): void {
  if (!state.player.isJumping && !state.gameOver) {
    state.player.velocityY = JUMP_FORCE;
    state.player.isJumping = true;
    if (!state.started) state.started = true;
  }
}

function spawnObstacle(state: GameState, canvasWidth: number): Obstacle {
  const types: ObstacleType[] = ["jump", "dog", "car"];
  // Cars more frequent as score increases
  const weights = [3, 3, 1 + Math.floor(state.score / 200)];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalWeight;
  let type: ObstacleType = "jump";
  for (let i = 0; i < types.length; i++) {
    r -= weights[i];
    if (r <= 0) { type = types[i]; break; }
  }

  const config = OBSTACLE_CONFIGS[type];
  const groundY = state.groundY + PLAYER_HEIGHT - config.height;

  return {
    id: genId(),
    type,
    x: canvasWidth + 20,
    y: groundY,
    width: config.width,
    height: config.height,
    speedMultiplier: config.speedMultiplier,
  };
}

let spawnTimer = 0;
let nextSpawnAt = 100;

export function resetSpawnTimer() {
  spawnTimer = 0;
  nextSpawnAt = INITIAL_SPAWN_DELAY;
}

function isColliding(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  // Shrink hitboxes slightly for forgiveness
  const pad = 6;
  return (
    ax + pad < bx + bw - pad &&
    ax + aw - pad > bx + pad &&
    ay + pad < by + bh - pad &&
    ay + ah - pad > by + pad
  );
}

export function update(state: GameState, canvasWidth: number): void {
  if (state.gameOver || !state.started) return;

  state.frameCount++;

  // Player physics
  state.player.velocityY += GRAVITY;
  state.player.y += state.player.velocityY;

  if (state.player.y >= state.groundY) {
    state.player.y = state.groundY;
    state.player.velocityY = 0;
    state.player.isJumping = false;
  }

  // Speed scaling
  state.speed = BASE_SPEED + state.score * SPEED_INCREMENT;

  // Obstacle movement
  for (const obs of state.obstacles) {
    obs.x -= state.speed * obs.speedMultiplier;
  }

  // Remove off-screen
  state.obstacles = state.obstacles.filter((o) => o.x + o.width > -20);

  // Spawn — prevent overlapping obstacles
  spawnTimer++;
  if (spawnTimer >= nextSpawnAt) {
    // Check if last obstacle has enough clearance
    const lastObs = state.obstacles[state.obstacles.length - 1];
    const minGap = 120 + state.speed * 15; // enough space to jump between
    const canSpawn = !lastObs || lastObs.x < canvasWidth - minGap;

    if (canSpawn) {
      state.obstacles.push(spawnObstacle(state, canvasWidth));
      spawnTimer = 0;
      const minInterval = Math.max(MIN_SPAWN_INTERVAL - state.score * 0.05, 30);
      nextSpawnAt = minInterval + Math.random() * (MAX_SPAWN_INTERVAL - minInterval);
    }
  }

  // Collision
  const p = state.player;
  for (const obs of state.obstacles) {
    if (isColliding(p.x, p.y, p.width, p.height, obs.x, obs.y, obs.width, obs.height)) {
      state.gameOver = true;
      if (state.score > state.highScore) {
        state.highScore = Math.floor(state.score);
        localStorage.setItem("keppari_highscore", state.highScore.toString());
      }
      return;
    }
  }

  // Score — only starts once obstacles begin arriving
  if (state.frameCount >= INITIAL_SPAWN_DELAY) {
    state.score += 0.15;
  }
}
