import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { GameLoop } from "../game/GameLoop";
import { WeaponStats } from "../types";

interface GameCanvasProps {
  width?: number;
  height?: number;
  initialWeaponStats?: WeaponStats | null;
  onLoaded?: () => void;
}

// Define the ref type
export interface GameCanvasRef {
  pause: () => void;
  resume: () => void;
  updateWeapon: (stats: WeaponStats) => void;
}

const GameCanvas = forwardRef<GameCanvasRef, GameCanvasProps>(
  ({ width = 800, height = 600, initialWeaponStats, onLoaded }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameLoopRef = useRef<GameLoop | null>(null);
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
    }));

    // Initialize the game loop only once
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || initializedRef.current) return;

      canvas.width = width;
      canvas.height = height;

      const seed = Math.random().toString();
      const gameLoop = new GameLoop(canvas, seed, initialWeaponStats);
      gameLoopRef.current = gameLoop;
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
    }, []); // Empty dependency array - only run on mount/unmount

    // Handle canvas size updates separately
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !gameLoopRef.current) return;

      canvas.width = width;
      canvas.height = height;
    }, [width, height]);

    // Handle weapon stats updates separately
    useEffect(() => {
      if (gameLoopRef.current && initialWeaponStats && initializedRef.current) {
        gameLoopRef.current.updateWeapon(initialWeaponStats);
      }
    }, [initialWeaponStats]);

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
