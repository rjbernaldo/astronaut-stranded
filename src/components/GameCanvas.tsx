import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { GameLoopState } from "../game/GameLoopState";
import { WeaponStats } from "../types";

interface GameCanvasProps {
  width?: number;
  height?: number;
  initialWeaponStats?: WeaponStats | null;
  onLoaded?: () => void;
  onLevelUp?: () => void;
}

// Define the ref type
export interface GameCanvasRef {
  pause: () => void;
  resume: () => void;
  updateWeapon: (stats: WeaponStats) => void;
  setOnLevelUpCallback: (callback: () => void) => void;
}

const GameCanvas = forwardRef<GameCanvasRef, GameCanvasProps>(
  (
    { width = 800, height = 600, initialWeaponStats, onLoaded, onLevelUp },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameLoopRef = useRef<GameLoopState | null>(null);
    const initializedRef = useRef(false);

    // Expose methods via the ref
    useImperativeHandle(ref, () => ({
      pause: () => {
        if (gameLoopRef.current) {
          gameLoopRef.current.pause();
        }
      },
      resume: () => {
        if (gameLoopRef.current) {
          gameLoopRef.current.resume();
        }
      },
      updateWeapon: (stats: WeaponStats) => {
        if (gameLoopRef.current) {
          gameLoopRef.current.updateWeapon(stats);
        }
      },
      setOnLevelUpCallback: (callback: () => void) => {
        if (gameLoopRef.current) {
          gameLoopRef.current.setOnLevelUpCallback(callback);
        }
      },
    }));

    // Initialize the game loop only once
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || initializedRef.current) return;

      canvas.width = width;
      canvas.height = height;

      const seed = Math.random().toString();
      const gameLoop = new GameLoopState(canvas, seed, initialWeaponStats);
      gameLoopRef.current = gameLoop;

      // Set the level up callback if provided
      if (onLevelUp) {
        gameLoop.setOnLevelUpCallback(onLevelUp);
      }

      gameLoop.start();
      initializedRef.current = true;

      // Notify parent component that the game has loaded
      if (onLoaded) {
        onLoaded();
      }

      return () => {
        gameLoop.stop();
        gameLoopRef.current = null;
        initializedRef.current = false;
      };
    }, []);

    // Handle canvas size updates separately
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !gameLoopRef.current) return;

      canvas.width = width;
      canvas.height = height;
    }, [width, height]);

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
  }
);

GameCanvas.displayName = "GameCanvas";

export default GameCanvas;
