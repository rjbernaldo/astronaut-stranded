"use client";

import React, { useState } from "react";
import GameCanvas from "../components/GameCanvas";
import styles from "./page.module.css";

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = () => {
    setGameStarted(true);
  };

  return (
    <main className={styles.main}>
      {!gameStarted ? (
        <div className={styles.startScreen}>
          <h1 className={styles.title}>ASTRONAUT: STRANDED</h1>
          <p className={styles.description}>
            You are stranded on a hostile alien planet. Find the escape pod and
            survive the onslaught of xenomorphs.
          </p>

          <div className={styles.instructionsContainer}>
            <div className={styles.instructionsColumn}>
              <h2>Controls:</h2>
              <ul>
                <li>WASD: Movement</li>
                <li>Mouse: Aim</li>
                <li>Left Click: Shoot</li>
                <li>R: Reload Weapon</li>
                <li>Space: Toggle Flashlight</li>
                <li>1-3: Switch Weapons</li>
              </ul>
            </div>

            <div className={styles.instructionsColumn}>
              <h2>Weapons:</h2>
              <ul>
                <li>Pistol (1): Reliable sidearm</li>
                <li>Rifle (2): Automatic, high rate of fire</li>
                <li>Shotgun (3): Powerful at close range</li>
              </ul>
            </div>

            <div className={styles.instructionsColumn}>
              <h2>Enemies:</h2>
              <ul>
                <li>Scout: Fast but weak</li>
                <li>Brute: Slow but powerful</li>
                <li>Spitter: Ranged acid attacks</li>
              </ul>
            </div>
          </div>

          <button className={styles.startButton} onClick={startGame}>
            START MISSION
          </button>

          <div className={styles.footer}>
            <p>
              Inspired by the film <em>Alien</em> (1979)
            </p>
            <p>A Vampire Survivors-like roguelike survival game</p>
          </div>
        </div>
      ) : (
        <GameCanvas />
      )}
    </main>
  );
}
