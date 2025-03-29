import React, { useRef, useEffect } from "react";
import { GameLoop } from "../game/GameLoop";
import { WeaponStats } from "../types";

interface GameCanvasProps {
  width?: number;
  height?: number;
  initialWeaponStats?: WeaponStats | null;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  width = 800,
  height = 600,
  initialWeaponStats,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;

    const seed = Math.random().toString();
    const gameLoop = new GameLoop(canvas, seed, initialWeaponStats);
    gameLoop.start();

    return () => {
      gameLoop.stop();
    };
  }, [width, height, initialWeaponStats]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        display: "block",
        background: "#000",
        margin: "0 auto",
        cursor: "crosshair",
        // Add scan lines effect for retro look
        backgroundImage:
          "linear-gradient(transparent 50%, rgba(0, 0, 0, 0.1) 50%)",
        backgroundSize: "100% 4px",
      }}
    />
  );
};

export default GameCanvas;
