export type ObstacleType = "jump" | "dog" | "car";

export interface Obstacle {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  speedMultiplier: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  isJumping: boolean;
}

export interface GameState {
  player: Player;
  obstacles: Obstacle[];
  speed: number;
  score: number;
  highScore: number;
  gameOver: boolean;
  started: boolean;
  groundY: number;
  frameCount: number;
}
