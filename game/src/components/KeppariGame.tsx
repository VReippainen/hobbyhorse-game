import { useRef, useEffect, useCallback, useState } from "react";
import { createInitialState, jump, update, resetSpawnTimer } from "@/game/engine";
import { render, renderWasted, captureFrame, loadSpriteSheet } from "@/game/renderer";
import { GameState } from "@/game/types";
import logo from "@/assets/logo.png";
import canter0 from "@/assets/canter0.png";
import canter1 from "@/assets/canter1.png";
import canter2 from "@/assets/canter2.png";
import canter3 from "@/assets/canter3.png";
import canter4 from "@/assets/canter4.png";
import jump0 from "@/assets/jump0.png";
import jump1 from "@/assets/jump1.png";
import jump2 from "@/assets/jump2.png";
import jump3 from "@/assets/jump3.png";
import jump4 from "@/assets/jump4.png";
import car0 from "@/assets/car0.png";
import car1 from "@/assets/car1.png";
import dog0 from "@/assets/dog0.png";
import dog1 from "@/assets/dog1.png";
import hurdle from "@/assets/hurdle.png";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 300;

const music = new Audio("/mini_doom.mp3");
music.loop = true;

const deathSound = new Audio("/death.wav");

export default function KeppariGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState(CANVAS_HEIGHT));
  const rafRef = useRef<number>(0);
  const [phase, setPhase] = useState<"menu" | "playing" | "over">("menu");
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem("keppari_highscore") || "0")
  );

  // Load all sprites once
  useEffect(() => {
    loadSpriteSheet({
      canter: [canter0, canter1, canter2, canter3, canter4],
      jump: [jump0, jump1, jump2, jump3, jump4],
      car: [car0, car1],
      dog: [dog0, dog1],
      hurdle,
    });
  }, []);

  const startGame = useCallback(() => {
    resetSpawnTimer();
    stateRef.current = createInitialState(CANVAS_HEIGHT);
    stateRef.current.started = true;
    setPhase("playing");
    jump(stateRef.current);
    music.currentTime = 0;
    music.play().catch(() => {/* autoplay blocked */});
  }, []);

  const handleJump = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver) {
      startGame();
      return;
    }
    if (!s.started) {
      startGame();
      return;
    }
    jump(s);
  }, [startGame]);

  // Input listeners
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === "menu") { startGame(); return; }
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleJump, phase]);

  // Game loop
  useEffect(() => {
    if (phase !== "playing") return;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const state = stateRef.current;
      update(state, CANVAS_WIDTH);
      render(ctx, canvas, state);

      if (state.gameOver) {
        setPhase("over");
        setHighScore(state.highScore);
        music.pause();
        deathSound.currentTime = 0;
        deathSound.play().catch(() => {/* autoplay blocked */});

        // Capture the frozen game frame, then animate WASTED on top
        const wastedCanvas = canvasRef.current;
        if (wastedCanvas) {
          const wastedCtx = wastedCanvas.getContext("2d");
          if (wastedCtx) {
            const frozen = captureFrame(wastedCanvas);
            const start = performance.now();
            const FADE_MS = 700;
            const finalScore = Math.floor(state.score);
            const finalHighScore = state.highScore;
            const step = (now: number) => {
              const opacity = Math.min((now - start) / FADE_MS, 1);
              renderWasted(wastedCtx, wastedCanvas, frozen, opacity, finalScore, finalHighScore);
              if (opacity < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          }
        }

        return; // stop the loop
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  // Menu screen
  if (phase === "menu") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
        <div
          className="relative bg-background border-2 border-border rounded-sm"
          style={{ width: CANVAS_WIDTH, maxWidth: "100vw", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
        >
          <div className="flex flex-col items-center py-10 px-4 w-full text-center" style={{display: 'flex', flexDirection: "column", alignItems:"center"}}>
            <img
              src={logo}
              alt="Alisa's Hobbyhorse Adventure"
              className="w-40 h-40 object-contain mb-6"
              style={{maxWidth: "200px"}}
            />
            <h2 className="font-pixel text-primary text-base mb-2 text-center tracking-wider">
              ALISA'S HOBBYHORSE
            </h2>
            <h2 className="font-pixel text-primary text-base mb-8 text-center tracking-wider">
              ADVENTURE
            </h2>

            <div className="flex flex-col gap-3 items-center">
              <button
                onClick={startGame}
                className="font-pixel text-xs bg-primary text-primary-foreground px-8 py-3 rounded-sm hover:opacity-90 transition-opacity border-2 border-primary/50"
              >
                ▶ START GAME
              </button>
            </div>

            {highScore > 0 && (
              <p className="font-pixel text-muted-foreground text-[8px] mt-6">
                BEST SCORE: {highScore}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-border rounded-sm cursor-pointer max-w-full"
          style={{ imageRendering: "pixelated", display: "block" }}
          onClick={handleJump}
          onTouchStart={(e) => {
            e.preventDefault();
            handleJump();
          }}
        />

      </div>

      <p className="font-pixel text-muted-foreground text-[8px] tracking-wider">
        SPACE / CLICK / TAP TO JUMP
      </p>
    </div>
  );
}
