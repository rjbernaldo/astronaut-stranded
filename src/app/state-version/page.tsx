"use client";

import { useEffect, useRef, useState } from "react";
import { GameLoopState } from "../../game/GameLoopState";
import GunCustomization from "../../components/GunCustomization";
import { WeaponStats } from "../../types";

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<GameLoopState | null>(null);
  const initializedRef = useRef(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [currentWeapon, setCurrentWeapon] = useState<WeaponStats | null>(null);

  // Initialize game when component mounts
  useEffect(() => {
    if (!canvasRef.current || initializedRef.current) return;

    initializedRef.current = true;
    const canvas = canvasRef.current;

    // Create a new game loop with the canvas
    const gameLoop = new GameLoopState(canvas);
    gameLoopRef.current = gameLoop;

    // Start the game loop
    gameLoop.start();

    // Set up keyboard listener for opening the customization menu
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "c") {
        if (!isCustomizationOpen) {
          // Pause the game and open customization
          if (gameLoopRef.current) {
            gameLoopRef.current.pause();
            // Get current weapon stats
            const state = gameLoopRef.current.getState();
            if (state.player.activeWeapon) {
              setCurrentWeapon(state.player.activeWeapon.stats);
            }
            setIsCustomizationOpen(true);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Clean up
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
      }
    };
  }, [isCustomizationOpen]);

  // Handle closing the customization menu
  const handleCloseCustomization = () => {
    setIsCustomizationOpen(false);

    // Resume the game
    if (gameLoopRef.current) {
      gameLoopRef.current.resume();
    }
  };

  // Handle saving weapon customization
  const handleSaveCustomization = (weaponStats: WeaponStats) => {
    // Update the weapon in the game
    if (gameLoopRef.current) {
      gameLoopRef.current.updateWeapon(weaponStats);
    }

    // Close the customization menu
    handleCloseCustomization();
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      {/* Game canvas */}
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Instructions */}
      <div className="absolute top-4 right-4 text-white text-sm bg-black/50 p-2 rounded">
        <p>WASD: Move</p>
        <p>Mouse: Aim/Shoot</p>
        <p>R: Reload</p>
        <p>1-3: Switch Weapons</p>
        <p>T: Toggle Auto-Aim</p>
        <p>C: Customize Weapon</p>
      </div>

      {/* Gun customization modal */}
      {isCustomizationOpen && currentWeapon && (
        <GunCustomization
          initialStats={currentWeapon}
          onClose={handleCloseCustomization}
          onSave={handleSaveCustomization}
        />
      )}
    </main>
  );
}
