import React, { useRef, useEffect } from "react";
import { GameLoop } from "../game/GameLoop";

interface GameCanvasProps {
  width?: number;
  height?: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  width = 800,
  height = 600,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create game instance
    const game = new GameLoop(canvasRef.current);

    // Start game loop
    game.start();

    // Clean up event listeners on unmount
    return () => {
      // Remove event listeners if needed
      window.removeEventListener("keydown", () => {});
      window.removeEventListener("keyup", () => {});
      canvasRef.current?.removeEventListener("mousemove", () => {});
      canvasRef.current?.removeEventListener("mousedown", () => {});
      canvasRef.current?.removeEventListener("mouseup", () => {});
    };
  }, []);

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
