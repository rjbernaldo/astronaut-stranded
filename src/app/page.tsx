"use client";

import { useState, useRef, useEffect } from "react";
import GameCanvas, { GameCanvasRef } from "../components/GameCanvas";
import { WeaponStats } from "../types";
import GunCustomization from "../components/GunCustomization";
import "./gun-customization.css";

type PartCategory =
  | "barrel"
  | "slide"
  | "frame"
  | "trigger"
  | "magazine"
  | "internal";

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);
  const [showGunCustomization, setShowGunCustomization] = useState(false);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [isLevelUpCustomization, setIsLevelUpCustomization] = useState(false);
  const gameCanvasRef = useRef<GameCanvasRef>(null);
  const [weaponStats, setWeaponStats] = useState<WeaponStats>({
    name: "pistol",
    damage: 10,
    magazineSize: 7,
    reserveAmmo: 21,
    fireRate: 0.5,
    reloadTime: 2.0,
    recoil: 5,
    projectileCount: 1,
    spread: 0,
    range: 300,
    customized: false,
    parts: {
      barrel: "standard-barrel",
      slide: "standard-slide",
      frame: "standard-frame",
      trigger: "standard-trigger",
      magazine: "standard-magazine",
      internal: "standard-internal",
    },
  });

  // Pause the game when the customization modal is shown
  useEffect(() => {
    if (gameCanvasRef.current && gameLoaded) {
      if (showGunCustomization) {
        // Pause the game when customization modal opens
        gameCanvasRef.current.pause();
      } else {
        // Only resume if the game was previously started
        if (gameStarted) {
          gameCanvasRef.current.resume();
        }
      }
    }
  }, [showGunCustomization, gameLoaded, gameStarted]);

  // When game changes to started state, make sure to resume if paused
  useEffect(() => {
    if (
      gameStarted &&
      gameCanvasRef.current &&
      gameLoaded &&
      !showGunCustomization
    ) {
      gameCanvasRef.current.resume();
    }
  }, [gameStarted, gameLoaded, showGunCustomization]);

  // Set the level up callback after game is loaded
  useEffect(() => {
    if (gameCanvasRef.current && gameLoaded) {
      gameCanvasRef.current.setOnLevelUpCallback(handleLevelUp);
    }
  }, [gameLoaded]);

  const handleStartGame = () => {
    setGameStarted(true);
  };

  const handleLevelUp = () => {
    setIsLevelUpCustomization(true);
    setShowGunCustomization(true);
  };

  const handleCustomizeWeapon = () => {
    if (!gameStarted) {
      // Start the game first if not already started
      setGameStarted(true);
    }

    // Show the customization modal
    setIsLevelUpCustomization(false);
    setShowGunCustomization(true);
  };

  const handleSaveCustomization = (
    equippedParts: Partial<Record<PartCategory, string>>,
    finalStats: WeaponStats
  ) => {
    setWeaponStats(finalStats);
    setShowGunCustomization(false);
    setIsLevelUpCustomization(false);

    // Update the weapon in the game
    if (gameCanvasRef.current && gameLoaded) {
      gameCanvasRef.current.updateWeapon(finalStats);
    }
  };

  const handleCancelCustomization = () => {
    setShowGunCustomization(false);
    setIsLevelUpCustomization(false);

    // If we were in a level-up customization, we need to apply default bonuses
    if (isLevelUpCustomization && gameCanvasRef.current && gameLoaded) {
      // Apply default level up bonuses - we'll just update the current weapon with slight improvements
      const improvedStats = { ...weaponStats };
      improvedStats.damage *= 1.05; // 5% damage increase
      improvedStats.fireRate *= 0.98; // 2% faster firing
      improvedStats.reloadTime *= 0.97; // 3% faster reload
      gameCanvasRef.current.updateWeapon(improvedStats);
      setWeaponStats(improvedStats);
    }
  };

  const handleGameLoaded = () => {
    setGameLoaded(true);
  };

  return (
    <>
      {/* Game canvas - always render when game is started */}
      {gameStarted && (
        <GameCanvas
          ref={gameCanvasRef}
          initialWeaponStats={weaponStats}
          onLoaded={handleGameLoaded}
          onLevelUp={handleLevelUp}
        />
      )}

      {/* Gun customization modal */}
      <GunCustomization
        initialWeaponStats={weaponStats}
        onSave={handleSaveCustomization}
        onCancel={handleCancelCustomization}
        isOpen={showGunCustomization}
        availableCredits={1000}
        title={
          isLevelUpCustomization ? "LEVEL UP! Choose your upgrade" : undefined
        }
        message={
          isLevelUpCustomization
            ? "You've gained a level! Choose how to upgrade your weapon:"
            : undefined
        }
        isLevelUpCustomization={isLevelUpCustomization}
      />

      {/* Main UI - only show when game is not started */}
      {!gameStarted && (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-black text-white font-mono">
          <div className="max-w-3xl w-full bg-gray-900 p-8 rounded-lg border border-gray-800">
            <h1 className="text-4xl font-bold mb-6 text-center">
              ASTRONAUT: STRANDED
            </h1>

            <div className="mb-6">
              <h2 className="text-2xl mb-3 text-green-400">
                Mission Briefing:
              </h2>
              <p className="mb-4">
                You are an astronaut stranded on a hostile alien planet. Your
                ship has crashed, and the environment is filled with alien
                creatures hunting for you. Use your combat training and
                available resources to survive as long as possible.
              </p>
              <p className="mb-4">
                Search for resources, upgrade your weapons, and eliminate the
                alien threat. Good luck, astronaut. You'll need it.
              </p>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl mb-3 text-green-400">Controls:</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Move with <span className="bg-gray-800 px-2 rounded">W</span>{" "}
                  <span className="bg-gray-800 px-2 rounded">A</span>{" "}
                  <span className="bg-gray-800 px-2 rounded">S</span>{" "}
                  <span className="bg-gray-800 px-2 rounded">D</span>
                </li>
                <li>Aim with mouse</li>
                <li>Shoot with left mouse button</li>
                <li>
                  Reload with{" "}
                  <span className="bg-gray-800 px-2 rounded">R</span>
                </li>
                <li>
                  Switch weapons with{" "}
                  <span className="bg-gray-800 px-2 rounded">1</span>{" "}
                  <span className="bg-gray-800 px-2 rounded">2</span>{" "}
                  <span className="bg-gray-800 px-2 rounded">3</span>
                </li>
              </ul>
            </div>

            {weaponStats && (
              <div className="mb-6">
                <h2 className="text-2xl mb-3 text-green-400">
                  Equipped Weapon:
                </h2>
                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="text-xl mb-2">
                    {weaponStats.name.toUpperCase()}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Damage: {weaponStats.damage}</div>
                    <div>Fire Rate: {weaponStats.fireRate}s</div>
                    <div>Ammo: {weaponStats.magazineSize}</div>
                    <div>Reload: {weaponStats.reloadTime}s</div>
                  </div>
                  {weaponStats.customized && (
                    <div className="mt-2 text-green-400">CUSTOMIZED</div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleCustomizeWeapon}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Customize Weapon
              </button>
              <button
                onClick={handleStartGame}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                Start Mission
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Game UI controls when game is running */}
      {gameStarted && (
        <div className="fixed top-4 right-4 z-10">
          <button
            onClick={handleCustomizeWeapon}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Customize Weapon
          </button>
        </div>
      )}
    </>
  );
}
