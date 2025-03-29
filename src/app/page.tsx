"use client";

import { useState } from "react";
import GameCanvas from "../components/GameCanvas";
import { WeaponStats } from "../types";
import GunCustomization from "../components/GunCustomization";
import "./gun-customization.css";

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);
  const [showGunCustomization, setShowGunCustomization] = useState(false);
  const [playerCredits, setPlayerCredits] = useState(100);
  const [weaponStats, setWeaponStats] = useState<WeaponStats | null>(null);

  const handleStartGame = () => {
    setGameStarted(true);
  };

  const handleCustomizeWeapon = () => {
    setShowGunCustomization(true);
  };

  const handleSaveCustomization = (stats: WeaponStats) => {
    setWeaponStats(stats);
    setShowGunCustomization(false);
  };

  const handleCancelCustomization = () => {
    setShowGunCustomization(false);
  };

  if (showGunCustomization) {
    return (
      <GunCustomization
        initialWeaponStats={weaponStats}
        playerCredits={playerCredits}
        onSave={handleSaveCustomization}
        onCancel={handleCancelCustomization}
      />
    );
  }

  if (gameStarted) {
    return <GameCanvas initialWeaponStats={weaponStats} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-black text-white font-mono">
      <div className="max-w-3xl w-full bg-gray-900 p-8 rounded-lg border border-gray-800">
        <h1 className="text-4xl font-bold mb-6 text-center">
          ASTRONAUT: STRANDED
        </h1>

        <div className="mb-6">
          <h2 className="text-2xl mb-3 text-green-400">Mission Briefing:</h2>
          <p className="mb-4">
            You are an astronaut stranded on a hostile alien planet. Your ship
            has crashed, and the environment is filled with alien creatures
            hunting for you. Use your combat training and available resources to
            survive as long as possible.
          </p>
          <p className="mb-4">
            Search for resources, upgrade your weapons, and eliminate the alien
            threat. Good luck, astronaut. You'll need it.
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
              Reload with <span className="bg-gray-800 px-2 rounded">R</span>
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
            <h2 className="text-2xl mb-3 text-green-400">Equipped Weapon:</h2>
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="text-xl mb-2">{weaponStats.name.toUpperCase()}</h3>
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
  );
}
