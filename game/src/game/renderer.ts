import { GameState, Obstacle } from "./types";
import { GROUND_HEIGHT } from "./constants";

export interface SpritePack {
  canter: string[];  // 5 frames
  jump: string[];    // 5 frames
  car: string[];     // 2 frames
  dog: string[];     // 2 frames
  hurdle: string;
}

// Processed offscreen canvases (grey background removed)
interface LoadedSprites {
  canter: HTMLCanvasElement[];
  jump: HTMLCanvasElement[];
  car: HTMLCanvasElement[];
  dog: HTMLCanvasElement[];
  hurdle: HTMLCanvasElement | null;
  ready: boolean;
}

const sprites: LoadedSprites = {
  canter: [],
  jump: [],
  car: [],
  dog: [],
  hurdle: null,
  ready: false,
};

// Remove the checkerboard grey background (both dark ~183 and light ~230 squares)
// by zeroing alpha of any grey pixel in those ranges.
function removeGreyBackground(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const isGrey = Math.abs(r - g) < 12 && Math.abs(g - b) < 12;
    const isDarkSquare = isGrey && r >= 168 && r <= 198;   // ~183
    const isLightSquare = isGrey && r >= 220 && r <= 245;  // ~230
    if (isDarkSquare || isLightSquare) {
      d[i + 3] = 0; // make transparent
    }
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

function loadProcessed(src: string, onDone: (canvas: HTMLCanvasElement) => void) {
  const img = new Image();
  img.onload = () => onDone(removeGreyBackground(img));
  img.src = src;
}

export function loadSpriteSheet(pack: SpritePack) {
  const total = pack.canter.length + pack.jump.length + pack.car.length + pack.dog.length + 1;
  let loaded = 0;

  function onOne() {
    loaded++;
    if (loaded === total) sprites.ready = true;
  }

  pack.canter.forEach(src => loadProcessed(src, c => { sprites.canter.push(c); onOne(); }));
  pack.jump.forEach(src => loadProcessed(src, c => { sprites.jump.push(c); onOne(); }));
  pack.car.forEach(src => loadProcessed(src, c => { sprites.car.push(c); onOne(); }));
  pack.dog.forEach(src => loadProcessed(src, c => { sprites.dog.push(c); onOne(); }));
  loadProcessed(pack.hurdle, c => { sprites.hurdle = c; onOne(); });
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState) {
  const { x, y, width, height } = state.player;
  const frames: HTMLCanvasElement[] = state.player.isJumping ? sprites.jump : sprites.canter;

  if (sprites.ready && frames.length === 5) {
    const frame = frames[Math.floor(state.frameCount / 6) % frames.length];
    const drawW = width * 2.8;
    const drawH = height * 2.2;
    const drawX = x - drawW * 0.2;
    const drawY = y - drawH * 0.35;
    ctx.drawImage(frame, drawX, drawY, drawW, drawH);
  } else {
    ctx.fillStyle = "#E05090";
    ctx.fillRect(Math.round(x), Math.round(y), width, height);
  }
}

function drawObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle, frameCount: number) {
  const px = Math.round(obs.x);
  const py = Math.round(obs.y);

  if (!sprites.ready) {
    drawObstacleFallback(ctx, obs, frameCount);
    return;
  }

  switch (obs.type) {
    case "car": {
      const frame = sprites.car[Math.floor(frameCount / 8) % 2];
      const aspect = frame.width / frame.height;
      const drawH = obs.height * 1.8;
      const drawW = drawH * aspect;
      const drawX = px - (drawW - obs.width) * 0.5;
      const drawY = py - (drawH - obs.height);
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(frame, -drawX - drawW, drawY, drawW, drawH);
      ctx.restore();
      break;
    }
    case "dog": {
      const frame = sprites.dog[Math.floor(frameCount / 10) % 2];
      const aspect = frame.width / frame.height;
      const drawH = obs.height * 2.0;
      const drawW = drawH * aspect;
      const drawX = px - (drawW - obs.width) * 0.5;
      const drawY = py - (drawH - obs.height);
      ctx.drawImage(frame, drawX, drawY, drawW, drawH);
      break;
    }
    case "jump": {
      if (!sprites.hurdle) break;
      const frame = sprites.hurdle;
      const aspect = frame.width / frame.height;
      const drawH = obs.height * 1.6;
      const drawW = drawH * aspect;
      const drawX = px - (drawW - obs.width) * 0.5;
      const drawY = py - (drawH - obs.height);
      ctx.drawImage(frame, drawX, drawY, drawW, drawH);
      break;
    }
  }
}

function drawObstacleFallback(ctx: CanvasRenderingContext2D, obs: Obstacle, frameCount: number) {
  const px = Math.round(obs.x);
  const py = Math.round(obs.y);
  const legAnim = Math.sin(frameCount * 0.15) * 2;

  switch (obs.type) {
    case "jump":
      ctx.fillStyle = "#DDDDDD";
      ctx.fillRect(px + 2, py, 6, obs.height);
      ctx.fillRect(px + obs.width - 8, py, 6, obs.height);
      ctx.fillStyle = "#E05030";
      ctx.fillRect(px, py + 2, obs.width, 6);
      ctx.fillRect(px, py + 12, obs.width, 6);
      break;
    case "dog":
      ctx.fillStyle = "#333333";
      ctx.fillRect(px + 6, py + 6, 26, 14);
      ctx.fillRect(px + 30, py + 2, 12, 12);
      ctx.fillRect(px + 8, py + 18, 4, 10 + legAnim);
      ctx.fillRect(px + 16, py + 18, 4, 10 - legAnim);
      break;
    case "car":
      ctx.fillStyle = "#DC2626";
      ctx.fillRect(px + 4, py + 10, 56, 20);
      ctx.fillRect(px + 16, py, 28, 14);
      break;
  }
}

// Draws the GTA-style WASTED overlay directly onto the canvas.
// opacity goes from 0→1 as it fades in.
// Call once to capture the frozen game frame before animating WASTED.
export function captureFrame(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext("2d")!;
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// opacity 0→1: fades in the text. Background tint is always the same fixed transparency.
export function renderWasted(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  frozenFrame: ImageData,
  opacity: number,
  score: number,
  highScore: number
) {
  const w = canvas.width;
  const h = canvas.height;

  // Restore the frozen game frame so the tint doesn't accumulate
  ctx.putImageData(frozenFrame, 0, 0);

  // Fixed semi-transparent red tint
  ctx.fillStyle = "rgba(160, 0, 0, 0.38)";
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.textAlign = "center";
  ctx.lineJoin = "round";

  // WASTED text — shifted up slightly to make room below
  const fontSize = Math.min(w * 0.155, 130);
  const wastedY = h * 0.38;
  ctx.font = `900 ${fontSize}px "Arial Black", Impact, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = fontSize * 0.09;
  ctx.strokeText("WASTED", w / 2, wastedY);
  ctx.fillStyle = "#C80000";
  ctx.fillText("WASTED", w / 2, wastedY);

  // Score + high score below WASTED
  const sf = Math.min(w * 0.024, 18);
  ctx.font = `${sf}px "Press Start 2P", monospace`;
  ctx.textBaseline = "top";
  const scoreY = wastedY + fontSize * 0.52 + 6;

  ctx.strokeStyle = "#000";
  ctx.lineWidth = sf * 0.2;
  ctx.strokeText(`SCORE: ${score}`, w / 2, scoreY);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(`SCORE: ${score}`, w / 2, scoreY);

  const bestY = scoreY + sf * 1.7;
  if (highScore > 0) {
    ctx.strokeText(`BEST: ${highScore}`, w / 2, bestY);
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillText(`BEST: ${highScore}`, w / 2, bestY);
  }

  // PLAY AGAIN button drawn on canvas
  const btnFontSize = Math.min(w * 0.02, 14);
  const btnLabel = "\u25B6 PLAY AGAIN";
  const btnPadX = btnFontSize * 2.2;
  const btnPadY = btnFontSize * 0.9;
  ctx.font = `${btnFontSize}px "Press Start 2P", monospace`;
  const btnTextW = ctx.measureText(btnLabel).width;
  const btnW = btnTextW + btnPadX * 2;
  const btnH = btnFontSize + btnPadY * 2;
  const btnX = w / 2 - btnW / 2;
  const btnTopY = (highScore > 0 ? bestY : scoreY) + sf * 1.7 + 4;

  ctx.fillStyle = "#C83010";
  ctx.fillRect(btnX, btnTopY, btnW, btnH);
  ctx.strokeStyle = "rgba(0,0,0,0.6)";
  ctx.lineWidth = 2;
  ctx.strokeRect(btnX, btnTopY, btnW, btnH);

  ctx.textBaseline = "middle";
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = btnFontSize * 0.15;
  ctx.strokeText(btnLabel, w / 2, btnTopY + btnH / 2);
  ctx.fillText(btnLabel, w / 2, btnTopY + btnH / 2);

  ctx.restore();
}

export function render(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: GameState) {
  const w = canvas.width;
  const h = canvas.height;

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h - GROUND_HEIGHT);
  skyGrad.addColorStop(0, "#4A9BD9");
  skyGrad.addColorStop(1, "#87CEEB");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h - GROUND_HEIGHT);

  // Clouds
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  const cloudOffset = (state.frameCount * 0.3) % (w + 200);
  for (let i = 0; i < 3; i++) {
    const cx = ((i * 300 + 100) - cloudOffset + w + 200) % (w + 200) - 100;
    const cy = 30 + i * 25;
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.arc(cx + 20, cy - 8, 16, 0, Math.PI * 2);
    ctx.arc(cx + 40, cy, 22, 0, Math.PI * 2);
    ctx.arc(cx + 18, cy + 5, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ground
  const groundY = h - GROUND_HEIGHT;
  ctx.fillStyle = "#6B8E23";
  ctx.fillRect(0, groundY, w, GROUND_HEIGHT);
  ctx.fillStyle = "#8B7355";
  ctx.fillRect(0, groundY + 8, w, GROUND_HEIGHT - 8);

  // Grass tufts
  ctx.fillStyle = "#7BA428";
  for (let i = 0; i < w; i += 20) {
    const gx = (i + state.frameCount * 2) % (w + 20) - 10;
    ctx.fillRect(w - gx, groundY + 2, 3, 6);
    ctx.fillRect(w - gx + 5, groundY, 2, 8);
  }

  // Obstacles
  for (const obs of state.obstacles) {
    drawObstacle(ctx, obs, state.frameCount);
  }

  // Player
  drawPlayer(ctx, state);

  // Score HUD
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(w - 180, 8, 172, 36);
  ctx.font = "10px 'Press Start 2P', monospace";
  ctx.fillStyle = "#FFDD44";
  ctx.textAlign = "right";
  ctx.fillText(`SCORE: ${Math.floor(state.score)}`, w - 16, 30);

  if (state.highScore > 0) {
    ctx.fillStyle = "#AAAAAA";
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillText(`HI: ${Math.floor(state.highScore)}`, w - 16, 16);
  }
}
