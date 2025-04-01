"use client";

import { useState, useRef, useEffect } from "react";
import GameCanvas, { GameCanvasRef } from "../components/GameCanvas";
import { WeaponStats } from "../types";
import GunCustomization from "../components/GunCustomization";
import { INITIAL_WEAPON_STATS } from "../constants/weaponStats";
import "./gun-customization.css";

type PartCategory =
  | "barrel"
  | "slide"
  | "frame"
  | "trigger"
  | "magazine"
  | "internal";

export default function Home() {
  const isBrowser = typeof window !== "undefined";
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGamePaused, setIsGamePaused] = useState(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [isLevelUp, setIsLevelUp] = useState(false);
  const [availableCredits, setAvailableCredits] = useState(200);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [initialWeaponStats, setInitialWeaponStats] = useState<WeaponStats>({
    name: "pistol",
    damage: INITIAL_WEAPON_STATS.damage,
    magazineSize: INITIAL_WEAPON_STATS.magazineSize,
    reserveAmmo: Infinity,
    fireRate: INITIAL_WEAPON_STATS.fireRate,
    reloadTime: INITIAL_WEAPON_STATS.reloadTime,
    projectileCount: 1,
    range: INITIAL_WEAPON_STATS.range,
    projectileSpeed: 10,
    pierce: INITIAL_WEAPON_STATS.pierce,
    ammoCapacity: INITIAL_WEAPON_STATS.magazineSize, // Initial magazine capacity
  });
  const gameCanvasRef = useRef<GameCanvasRef>(null);
  const [weaponStats, setWeaponStats] = useState<WeaponStats>({
    name: "pistol",
    damage: INITIAL_WEAPON_STATS.damage,
    magazineSize: INITIAL_WEAPON_STATS.magazineSize,
    reserveAmmo: INITIAL_WEAPON_STATS.magazineSize * 3,
    fireRate: INITIAL_WEAPON_STATS.fireRate,
    reloadTime: INITIAL_WEAPON_STATS.reloadTime,
    projectileCount: 1,
    range: INITIAL_WEAPON_STATS.range,
    customized: false,
    parts: {
      barrel: "standard-barrel",
      slide: "standard-slide",
      frame: "standard-frame",
      trigger: "standard-trigger",
      magazine: "standard-magazine",
      internal: "standard-internal",
    },
    projectileSpeed: 10,
    pierce: INITIAL_WEAPON_STATS.pierce,
    ammoCapacity: INITIAL_WEAPON_STATS.magazineSize,
  });

  // Pause the game when the customization modal is shown
  useEffect(() => {
    if (gameCanvasRef.current && gameLoaded) {
      if (isCustomizationOpen) {
        // Pause the game when customization modal opens
        gameCanvasRef.current.pause();
      } else {
        // Only resume if the game was previously started
        if (isGameStarted) {
          gameCanvasRef.current.resume();
        }
      }
    }
  }, [isCustomizationOpen, gameLoaded, isGameStarted]);

  // When game changes to started state, make sure to resume if paused
  useEffect(() => {
    if (
      isGameStarted &&
      gameCanvasRef.current &&
      gameLoaded &&
      !isCustomizationOpen
    ) {
      gameCanvasRef.current.resume();
    }
  }, [isGameStarted, gameLoaded, isCustomizationOpen]);

  // Set the level up callback after game is loaded
  useEffect(() => {
    if (gameCanvasRef.current && gameLoaded) {
      gameCanvasRef.current.setOnLevelUpCallback(handleLevelUp);
    }
  }, [gameLoaded]);

  const handleStartGame = () => {
    setIsGameStarted(true);
  };

  const handleLevelUp = () => {
    setIsLevelUp(true);
    setIsCustomizationOpen(true);
  };

  const handleCustomizeWeapon = () => {
    if (!isGameStarted) {
      // Start the game first if not already started
      setIsGameStarted(true);

      // Show level-up style customization for first-time upgrade
      setIsLevelUp(true);
    } else {
      // Regular customization during gameplay
      setIsLevelUp(false);
    }

    // Show the customization modal
    setIsCustomizationOpen(true);
  };

  const handleSaveCustomization = (
    equippedParts: Partial<Record<PartCategory, string>>,
    finalStats: WeaponStats
  ) => {
    // Update the weapon in the game first, before updating state
    if (gameCanvasRef.current && gameLoaded) {
      gameCanvasRef.current.updateWeapon(finalStats);
    }

    // Update state after game update
    setWeaponStats(finalStats);
    setIsCustomizationOpen(false);
    setIsLevelUp(false);
  };

  const handleCancelCustomization = () => {
    // If this is a level-up customization, don't allow cancellation
    if (isLevelUp) {
      return; // Don't close the modal - force player to make a choice
    }

    // Only close if not a level-up customization
    setIsCustomizationOpen(false);
    setIsLevelUp(false);
  };

  const handleGameLoaded = () => {
    setGameLoaded(true);

    // Initial weapon setup - only once when the game is first loaded
    if (gameCanvasRef.current) {
      console.log("Game loaded - updating initial weapon stats");
      gameCanvasRef.current.updateWeapon(weaponStats);
    }
  };

  return (
    <>
      {/* Game canvas */}
      {isGameStarted && (
        <GameCanvas
          ref={gameCanvasRef}
          onLoaded={handleGameLoaded}
          onLevelUp={handleLevelUp}
        />
      )}

      {/* Gun customization modal */}
      <GunCustomization
        initialWeaponStats={weaponStats}
        onSave={handleSaveCustomization}
        onCancel={handleCancelCustomization}
        isOpen={isCustomizationOpen}
        availableCredits={availableCredits}
        title={isLevelUp ? "LEVEL UP! Choose your upgrade" : undefined}
        message={
          isLevelUp
            ? "You've gained a level! Choose how to upgrade your weapon:"
            : undefined
        }
        isLevelUpCustomization={isLevelUp}
      />

      {/* Main UI - only show when game is not started */}
      {!isGameStarted && (
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

            {/* Weapon stats display */}
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

            <div className="flex justify-center">
              <button
                onClick={handleCustomizeWeapon}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                START MISSION
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Game UI controls when game is running */}
      {isGameStarted && (
        <div className="fixed top-4 right-4 z-10">
          <button
            onClick={handleCustomizeWeapon}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Upgrade Weapon
          </button>
        </div>
      )}
    </>
  );
}
