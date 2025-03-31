import {
  GameState,
  Position,
  Direction,
  WeaponStats,
  Notification,
  EnemyType,
  EnemyStats,
} from "../types";

import { Astronaut } from "./Astronaut";
import { Enemy } from "./Enemy";
import { GameMap } from "./Map";
import { Projectile } from "./Projectile";
import seedrandom from "seedrandom";

// Constants for difficulty scaling
const DIFFICULTY_INCREASE_TIME = 60; // Seconds between difficulty increases
const INITIAL_DIFFICULTY = 1;

export class GameLoop {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastTime: number = 0;
  private keysPressed: Set<string> = new Set();
  private mousePosition: Position = { x: 0, y: 0 };
  private mouseDown: boolean = false;

  private player: Astronaut;
  private map: GameMap;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private cameraPosition: Position = { x: 0, y: 0 };
  private rng: seedrandom.PRNG;

  private lastEnemySpawnTime: number = 0;
  private enemySpawnInterval: number = 5000; // ms
  private enemySpawnCount: number = 5;

  private gameState: GameState = {
    player: null!, // Set in constructor
    enemies: [],
    projectiles: [],
    map: null!, // Set in constructor
    rng: null!, // Set in constructor
    cameraPosition: { x: 0, y: 0 },
    lastEnemySpawnTime: 0,
    enemySpawnInterval: 5000, // ms
    enemySpawnCount: 5,
    ui: {
      score: 0,
      waveNumber: 1,
      difficultyLevel: 1,
      gameTime: 0,
      nextLevelTime: 60, // 60 seconds
      isGameOver: false,
      playerLevel: 1,
      playerXp: 0,
      xpForNextLevel: 100, // Base XP needed for level 2
    },
    isPaused: false,
    autoAimEnabled: true,
    mousePosition: { x: 0, y: 0 },
    mouseDown: false,
    keysPressed: new Set<string>(),
    currentWeaponStats: null,
    notifications: [], // Initialize empty notifications array
  };

  private animationFrameId: number | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    seed?: string,
    initialWeaponStats?: WeaponStats | null
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;

    // Create map with random seed
    seed = seed || Math.random().toString();
    this.rng = seedrandom(seed);
    this.map = new GameMap(seed);

    // Create player in the center of the map
    const startX = Math.floor(this.map.width / 2) * this.map.tileSize;
    const startY = Math.floor(this.map.height / 2) * this.map.tileSize;
    this.player = new Astronaut({ x: startX, y: startY }, initialWeaponStats);

    // Set camera to player position
    this.cameraPosition = { ...this.player.position };

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener("keydown", (e) => {
      this.keysPressed.add(e.key.toLowerCase());

      // Reload on 'r' press
      if (e.key.toLowerCase() === "r") {
        this.player.reload();
      }

      // Toggle auto-aim with 't' key
      if (e.key.toLowerCase() === "t") {
        this.gameState.autoAimEnabled = !this.gameState.autoAimEnabled;
      }

      // Weapon switching
      if (e.key === "1") {
        this.player.switchWeapon("pistol");
      } else if (e.key === "2") {
        this.player.switchWeapon("rifle");
      } else if (e.key === "3") {
        this.player.switchWeapon("shotgun");
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keysPressed.delete(e.key.toLowerCase());
    });

    // Mouse events
    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    });

    this.canvas.addEventListener("mousedown", () => {
      this.mouseDown = true;
    });

    this.canvas.addEventListener("mouseup", () => {
      this.mouseDown = false;
    });

    // Resize event
    window.addEventListener("resize", () => {
      this.handleResize();
    });
  }

  private handleResize(): void {
    // Adjust canvas size to window
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start(): void {
    // Set initial canvas size
    this.handleResize();

    // Start game loop
    this.gameState.isPaused = false;
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Clean up event listeners
    window.removeEventListener("keydown", () => {});
    window.removeEventListener("keyup", () => {});
    this.canvas.removeEventListener("mousemove", () => {});
    this.canvas.removeEventListener("mousedown", () => {});
    this.canvas.removeEventListener("mouseup", () => {});
    window.removeEventListener("resize", () => {});
  }

  pause(): void {
    if (!this.gameState.isPaused && this.animationFrameId) {
      this.gameState.isPaused = true;
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;

      // Render a paused indicator
      this.renderPausedOverlay();
    }
  }

  resume(): void {
    if (this.gameState.isPaused) {
      this.gameState.isPaused = false;
      // Reset the lastTime to the current time to prevent a large time delta
      // that would cause the game to "jump" forward
      this.lastTime = performance.now();

      // Resume the animation loop without restarting the game
      this.animationFrameId = requestAnimationFrame(this.loop.bind(this));

      // Redraw the current state immediately to remove pause overlay
      this.render();
    }
  }

  updateWeapon(weaponStats: WeaponStats): void {
    // Update the player's weapon with the new stats
    if (this.player) {
      this.player.updateWeapon(weaponStats);
    }
  }

  private loop(timestamp: number): void {
    // Stop the loop if game is paused
    if (this.gameState.isPaused) return;

    // Calculate delta time
    const deltaTime = (timestamp - this.lastTime) / 1000; // seconds
    this.lastTime = timestamp;

    // Update game state
    this.update(deltaTime, timestamp);

    // Render everything
    this.render();

    // Continue loop
    if (!this.gameState.isGameOver) {
      this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
    }
  }

  private update(deltaTime: number, timestamp: number): void {
    if (this.gameState.isGameOver) return;

    // Update game time
    this.gameState.gameTime += deltaTime;

    // Handle player input
    this.handleInput(deltaTime, timestamp);

    // Auto-aim and shoot at nearby enemies
    this.handleAutoAimAndShoot(timestamp);

    // Update player
    this.player.update(deltaTime, timestamp);

    // Check if player is on hazard tile
    if (this.map.isTileHazard(this.player.position.x, this.player.position.y)) {
      this.player.takeDamage(10 * deltaTime); // Damage over time
    }

    // // Check if player reached the exit
    // if (this.map.isTileExit(this.player.position.x, this.player.position.y)) {
    //   this.gameState.isGameOver = true;
    //   return;
    // }

    // Update projectiles
    this.updateProjectiles(deltaTime);

    // Update enemies
    this.updateEnemies(deltaTime, timestamp);

    // Spawn new enemies
    this.spawnEnemies(timestamp);

    // Auto-explore map around player
    this.map.setTileExplored(
      this.player.position.x,
      this.player.position.y,
      this.player.lightRadius
    );

    // Update camera position (follow player)
    this.cameraPosition = {
      x: this.player.position.x,
      y: this.player.position.y,
    };

    // Check game over condition
    if (this.player.health <= 0) {
      this.gameState.isGameOver = true;
    }

    // Update game state (difficulty, time, etc.)
    this.updateGameState(deltaTime);
  }

  private handleInput(deltaTime: number, timestamp: number): void {
    // Movement
    if (this.keysPressed.has("w")) {
      this.movePlayer("up", deltaTime);
    }
    if (this.keysPressed.has("s")) {
      this.movePlayer("down", deltaTime);
    }
    if (this.keysPressed.has("a")) {
      this.movePlayer("left", deltaTime);
    }
    if (this.keysPressed.has("d")) {
      this.movePlayer("right", deltaTime);
    }

    // Manual shooting - only override auto-aim if mouseDown is true
    if (this.mouseDown) {
      // Manual aim toward mouse
      this.aim();

      // Manual shooting
      this.shoot(timestamp);
    }
  }

  private movePlayer(
    direction: "up" | "down" | "left" | "right",
    deltaTime: number
  ): void {
    // Calculate next position
    let nextX = this.player.position.x;
    let nextY = this.player.position.y;
    const movementDistance = this.player.speed * deltaTime;

    switch (direction) {
      case "up":
        nextY -= movementDistance;
        break;
      case "down":
        nextY += movementDistance;
        break;
      case "left":
        nextX -= movementDistance;
        break;
      case "right":
        nextX += movementDistance;
        break;
    }

    // Check collision with walls
    if (this.map.isTileWalkable(nextX, nextY)) {
      this.player.move(direction, deltaTime);
    }
  }

  private aim(): void {
    // Calculate direction from player to mouse
    const screenCenterX = this.canvas.width / 2;
    const screenCenterY = this.canvas.height / 2;

    const dx = this.mousePosition.x - screenCenterX;
    const dy = this.mousePosition.y - screenCenterY;

    // Calculate angle in radians, then convert to degrees
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Set player rotation
    this.player.setRotation(angle);
  }

  private shoot(timestamp: number): void {
    if (!this.player.activeWeapon) return;

    const didShoot = this.player.shoot(timestamp);

    if (didShoot) {
      // Create projectiles
      const newProjectiles = this.player.activeWeapon.createProjectiles(
        { ...this.player.position },
        this.player.rotation
      );

      // Add to projectiles array
      this.projectiles.push(...newProjectiles);
    }
  }

  private updateProjectiles(deltaTime: number): void {
    this.projectiles.forEach((projectile, index) => {
      projectile.update(deltaTime);

      // Deactivate projectile if it goes out of range or hits a wall
      if (!projectile.active) {
        return;
      }

      // Check for collision with walls
      if (
        !this.map.isTileWalkable(projectile.position.x, projectile.position.y)
      ) {
        projectile.deactivate();
        return;
      }

      // Check for collision with enemies
      for (const enemy of this.enemies) {
        if (!enemy.active) continue;

        const dx = enemy.position.x - projectile.position.x;
        const dy = enemy.position.y - projectile.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 15) {
          // Enemy hit - apply damage
          enemy.takeDamage(projectile.damage);
          projectile.deactivate();

          // Check if enemy was defeated
          if (!enemy.active) {
            // Add score and XP for defeating enemy
            const scoreValue = enemy.getScoreValue();
            this.gameState.ui.score += scoreValue;
            this.addXp(scoreValue);
          }
          break;
        }
      }
    });

    // Remove inactive projectiles
    this.projectiles = this.projectiles.filter((p) => p.active);
  }

  /**
   * Add XP to the player and check for level up
   */
  private addXp(amount: number): void {
    // Add XP
    this.gameState.ui.playerXp += amount;

    // Check for level up
    this.checkForLevelUp();
  }

  /**
   * Check if player has enough XP to level up
   * Uses an exponential curve for level requirements
   */
  private checkForLevelUp(): void {
    const ui = this.gameState.ui;

    while (ui.playerXp >= ui.xpForNextLevel) {
      // Level up!
      ui.playerLevel++;

      // Subtract the XP used for this level
      ui.playerXp -= ui.xpForNextLevel;

      // Calculate new XP requirement with exponential scaling
      // Formula: baseXP * (growthFactor^(level-1))
      // This gives us: Level 1->2: 100 XP, 2->3: 200 XP, 3->4: 400 XP, etc.
      const baseXP = 100;
      const growthFactor = 2;
      ui.xpForNextLevel = Math.round(
        baseXP * Math.pow(growthFactor, ui.playerLevel - 1)
      );

      // Apply level-up bonuses to player
      this.applyLevelUpBonuses();

      // Add level up notification
      this.addNotification(
        `LEVEL UP! You are now level ${ui.playerLevel}`,
        "#00AAFF",
        5000
      );
    }
  }

  /**
   * Apply bonuses to player based on their level
   */
  private applyLevelUpBonuses(): void {
    const level = this.gameState.ui.playerLevel;

    // Improve player stats with each level
    // Speed bonus: +1% per level
    this.player.speed = this.player.speed * (1 + 0.01 * level);

    // Weapons get stronger with level
    if (this.player.activeWeapon) {
      // Get all weapons and improve their stats
      this.player.weapons.forEach((weapon, name) => {
        const stats = { ...weapon.stats };

        // Damage: +5% per level
        stats.damage *= 1 + 0.05 * level;

        // Fire rate: -2% cooldown per level (faster firing)
        stats.fireRate *= 1 - 0.02 * level;
        stats.fireRate = Math.max(0.05, stats.fireRate); // Cap to prevent too fast firing

        // Reload time: -3% per level (faster reloading)
        stats.reloadTime *= 1 - 0.03 * level;
        stats.reloadTime = Math.max(0.2, stats.reloadTime); // Minimum reload time

        // Update the weapon with new stats
        this.player.updateWeapon(stats);
      });
    }

    console.log(`Level Up! You are now level ${level}`);
  }

  /**
   * Add a notification to the queue
   */
  private addNotification(
    message: string,
    color: string = "#FFFFFF",
    duration: number = 3000
  ): void {
    const notification: Notification = {
      message,
      color,
      startTime: performance.now(),
      duration,
    };

    this.gameState.notifications.push(notification);
  }

  private updateEnemies(deltaTime: number, timestamp: number): void {
    // Update each enemy
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      // Pass camera offset so enemies can be drawn correctly
      enemy.update(deltaTime, this.player.position, timestamp);

      // Check for attack range
      const dx = this.player.position.x - enemy.position.x;
      const dy = this.player.position.y - enemy.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < enemy.attackRange && enemy.canAttack(timestamp)) {
        const damage = enemy.attack(timestamp);
        this.player.takeDamage(damage);
      }
    }

    // Remove dead enemies
    this.enemies = this.enemies.filter((e) => e.active);
  }

  private spawnEnemies(timestamp: number): void {
    // Check if it's time to spawn a new wave
    if (this.gameState.ui.waveNumber > 1) {
      if (
        timestamp - this.gameState.lastEnemySpawnTime <
        this.enemySpawnInterval
      )
        return;
    }

    this.gameState.lastEnemySpawnTime = timestamp;

    // Increase difficulty over time
    this.gameState.ui.waveNumber++;
    this.enemySpawnCount = Math.min(
      5 + Math.floor(this.gameState.ui.waveNumber / 2),
      20
    );

    // Decrease spawn interval over time (more frequent spawns)
    this.enemySpawnInterval = Math.max(
      5000 - this.gameState.ui.waveNumber * 200,
      2000
    );

    // Calculate the view range (slightly larger than canvas)
    const viewRangeX = this.canvas.width * 0.5;
    const viewRangeY = this.canvas.height * 0.5;

    for (let i = 0; i < this.enemySpawnCount; i++) {
      // Generate a position outside of the player's view
      let spawnX: number = 0;
      let spawnY: number = 0;
      let isOutsideView = false;

      // Keep trying until we get a position outside of view range
      while (!isOutsideView) {
        // Determine spawn direction (from which edge)
        const spawnDirection = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

        // Calculate base spawn position depending on direction
        switch (spawnDirection) {
          case 0: // Top
            spawnX =
              this.player.position.x + (Math.random() * 2 - 1) * viewRangeX;
            spawnY = this.player.position.y - viewRangeY - Math.random() * 200;
            break;
          case 1: // Right
            spawnX = this.player.position.x + viewRangeX + Math.random() * 200;
            spawnY =
              this.player.position.y + (Math.random() * 2 - 1) * viewRangeY;
            break;
          case 2: // Bottom
            spawnX =
              this.player.position.x + (Math.random() * 2 - 1) * viewRangeX;
            spawnY = this.player.position.y + viewRangeY + Math.random() * 200;
            break;
          case 3: // Left
            spawnX = this.player.position.x - viewRangeX - Math.random() * 200;
            spawnY =
              this.player.position.y + (Math.random() * 2 - 1) * viewRangeY;
            break;
        }

        // Ensure the position is walkable
        if (this.map.isTileWalkable(spawnX, spawnY)) {
          // Check that it's really outside the view
          const distX = Math.abs(spawnX - this.player.position.x);
          const distY = Math.abs(spawnY - this.player.position.y);

          if (distX > viewRangeX || distY > viewRangeY) {
            isOutsideView = true;
          }
        }
      }

      // Determine enemy type
      let enemyType: EnemyType;
      const typeRoll = Math.random();

      if (typeRoll < 0.5) {
        enemyType = "Scout";
      } else if (typeRoll < 0.8) {
        enemyType = "Brute";
      } else {
        enemyType = "Spitter";
      }

      // Create enemy stats based on current difficulty level
      let stats: EnemyStats;

      // Apply difficulty scaling to stats
      const difficultyMultiplier =
        1 + (this.gameState.ui.difficultyLevel - 1) * 0.2;

      switch (enemyType) {
        case "Scout":
          stats = {
            type: "Scout",
            health: 20 * difficultyMultiplier,
            speed: this.player.speed * 0.8,
            attackRange: 20,
            attackDamage: 10 * difficultyMultiplier,
            attackSpeed: 1,
            level: this.gameState.ui.difficultyLevel,
          };
          break;
        case "Brute":
          stats = {
            type: "Brute",
            health: 50 * difficultyMultiplier,
            speed: this.player.speed * 0.6,
            attackRange: 25,
            attackDamage: 20 * difficultyMultiplier,
            attackSpeed: 2,
            level: this.gameState.ui.difficultyLevel,
          };
          break;
        case "Spitter":
          stats = {
            type: "Spitter",
            health: 30 * difficultyMultiplier,
            speed: this.player.speed * 0.7,
            attackRange: 100,
            attackDamage: 5 * difficultyMultiplier,
            attackSpeed: 1.5,
            level: this.gameState.ui.difficultyLevel,
          };
          break;
      }

      // Create and add enemy
      const enemy = new Enemy(
        { x: spawnX, y: spawnY },
        stats,
        this.player.position
      );
      this.enemies.push(enemy);
    }
  }

  private render(): void {
    // Clear canvas
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render map
    this.map.render(
      this.ctx,
      this.cameraPosition,
      this.canvas.width,
      this.canvas.height
    );

    // Render enemies
    for (const enemy of this.enemies) {
      enemy.render(this.ctx, this.cameraPosition);
    }

    // Render projectiles - adjusted to draw at screen coordinates
    this.projectiles.forEach((projectile) => {
      // Calculate screen position for the projectile
      const screenPos = {
        x:
          projectile.position.x - this.cameraPosition.x + this.canvas.width / 2,
        y:
          projectile.position.y -
          this.cameraPosition.y +
          this.canvas.height / 2,
      };

      // Render projectile with screen position
      projectile.render(this.ctx, screenPos);
    });

    // Render player
    this.renderPlayer();

    // Render HUD
    this.renderHUD();

    // Render notifications
    this.renderNotifications();

    // Render game over screen if needed
    if (this.gameState.isGameOver) {
      this.renderGameOver();
    }

    // Render paused overlay if game is paused
    if (this.gameState.isPaused) {
      this.renderPausedOverlay();
    }
  }

  private renderPlayer(): void {
    // Calculate screen position
    const screenX = this.canvas.width / 2;
    const screenY = this.canvas.height / 2;

    // Draw player
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.beginPath();
    this.ctx.arc(screenX, screenY, 15, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw player direction (gun)
    const radians = (this.player.rotation * Math.PI) / 180;
    this.ctx.strokeStyle = "#FFFFFF";
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(screenX, screenY);
    this.ctx.lineTo(
      screenX + Math.cos(radians) * 20,
      screenY + Math.sin(radians) * 20
    );
    this.ctx.stroke();

    // Draw astronaut helmet
    this.ctx.fillStyle = "#AAAAFF";
    this.ctx.beginPath();
    this.ctx.arc(screenX, screenY, 10, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private renderHUD(): void {
    const padding = 20;
    const barWidth = 200;
    const barHeight = 20;

    // Draw health bar
    this.ctx.fillStyle = "#333333";
    this.ctx.fillRect(padding, padding, barWidth, barHeight);

    const healthPercent = this.player.health / 100;
    this.ctx.fillStyle = `rgb(${255 - healthPercent * 255}, ${
      healthPercent * 255
    }, 0)`;
    this.ctx.fillRect(padding, padding, barWidth * healthPercent, barHeight);

    this.ctx.strokeStyle = "#FFFFFF";
    this.ctx.strokeRect(padding, padding, barWidth, barHeight);

    // Draw health text
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.font = "16px monospace";
    this.ctx.textAlign = "left";
    this.ctx.fillText(
      `Health: ${Math.floor(this.player.health)}`,
      padding + 10,
      padding + 15
    );

    // Draw difficulty information (left side)
    const diffBarY = padding + barHeight + 10;
    this.ctx.fillStyle = "#333333";
    this.ctx.fillRect(padding, diffBarY, barWidth, barHeight);

    // Calculate time progress for next level
    const timeProgress =
      1 - this.gameState.ui.nextLevelTime / DIFFICULTY_INCREASE_TIME;

    // Draw difficulty progress bar
    this.ctx.fillStyle = "#8844FF";
    this.ctx.fillRect(padding, diffBarY, barWidth * timeProgress, barHeight);
    this.ctx.strokeStyle = "#FFFFFF";
    this.ctx.strokeRect(padding, diffBarY, barWidth, barHeight);

    // Draw difficulty text
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.font = "16px monospace";
    this.ctx.textAlign = "left";
    this.ctx.fillText(
      `Difficulty: ${this.gameState.ui.difficultyLevel}`,
      padding + 10,
      diffBarY + 15
    );

    // Draw player level progress bar
    const levelBarY = diffBarY + barHeight + 10;
    this.ctx.fillStyle = "#333333";
    this.ctx.fillRect(padding, levelBarY, barWidth, barHeight);

    // Calculate XP progress
    const xpProgress =
      this.gameState.ui.playerXp / this.gameState.ui.xpForNextLevel;

    // Draw level progress bar
    this.ctx.fillStyle = "#00AAFF"; // Blue color for XP
    this.ctx.fillRect(padding, levelBarY, barWidth * xpProgress, barHeight);
    this.ctx.strokeStyle = "#FFFFFF";
    this.ctx.strokeRect(padding, levelBarY, barWidth, barHeight);

    // Draw level text
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.font = "16px monospace";
    this.ctx.textAlign = "left";
    this.ctx.fillText(
      `Level: ${this.gameState.ui.playerLevel} (${this.gameState.ui.playerXp}/${this.gameState.ui.xpForNextLevel} XP)`,
      padding + 10,
      levelBarY + 15
    );

    // Draw time info
    const minutes = Math.floor(this.gameState.ui.gameTime / 60);
    const seconds = Math.floor(this.gameState.ui.gameTime % 60);
    const timeNextLevel = Math.max(
      0,
      Math.ceil(this.gameState.ui.nextLevelTime)
    );

    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.font = "16px monospace";
    this.ctx.textAlign = "left";
    this.ctx.fillText(
      `Time: ${minutes}:${seconds.toString().padStart(2, "0")}`,
      padding,
      levelBarY + barHeight + 20
    );

    this.ctx.fillText(
      `Next level: ${timeNextLevel}s`,
      padding,
      levelBarY + barHeight + 40
    );

    // Draw ammo counter
    if (this.player.activeWeapon) {
      const weaponName = this.player.activeWeapon.stats.name;
      const currentAmmo = this.player.ammo.get(weaponName) || 0;
      const maxAmmo = this.player.activeWeapon.stats.magazineSize;

      // Position and dimensions for the ammo display
      const bulletWidth = 10;
      const bulletHeight = 24;
      const bulletSpacing = 4;
      const startX = this.canvas.width - padding - bulletWidth;
      const startY = this.canvas.height - padding - 30;

      // Background for ammo display
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      this.ctx.fillRect(
        startX - maxAmmo * (bulletWidth + bulletSpacing) + bulletWidth,
        startY - 5,
        maxAmmo * (bulletWidth + bulletSpacing) + 10,
        bulletHeight + 10
      );

      // Display weapon name
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.font = "16px monospace";
      this.ctx.textAlign = "right";
      this.ctx.fillText(
        weaponName.toUpperCase(),
        this.canvas.width - padding,
        startY - 15
      );

      // Get ejected bullets for animation
      const ejectedBullets = this.player.getEjectedBullets();

      // Draw reload progress bar if reloading
      if (this.player.reloading) {
        // Get the reload start time and duration
        const reloadTime = this.player.activeWeapon.stats.reloadTime * 1000; // Convert to ms
        const currentTime = performance.now();
        const reloadStartTime = this.player.reloadStartTime || currentTime;
        const elapsedTime = currentTime - reloadStartTime;
        const progress = Math.min(elapsedTime / reloadTime, 1);

        // Draw reload bar background
        const reloadBarHeight = 4;
        const reloadBarY = startY + bulletHeight + 3;
        const totalWidth =
          maxAmmo * (bulletWidth + bulletSpacing) - bulletSpacing;

        this.ctx.fillStyle = "#333333";
        this.ctx.fillRect(
          startX - totalWidth + bulletWidth,
          reloadBarY,
          totalWidth,
          reloadBarHeight
        );

        // Draw progress
        this.ctx.fillStyle = "#4CAF50"; // Green color
        this.ctx.fillRect(
          startX - totalWidth + bulletWidth,
          reloadBarY,
          totalWidth * progress,
          reloadBarHeight
        );

        // Draw text "RELOADING..." if desired
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.font = "12px monospace";
        this.ctx.fillText(
          "RELOADING",
          this.canvas.width - padding,
          reloadBarY + 15
        );
      }

      // Draw bullets
      for (let i = 0; i < maxAmmo; i++) {
        // Determine if this bullet is loaded/active
        const isActive = i < currentAmmo;

        // Position for this bullet
        const bulletX = startX - i * (bulletWidth + bulletSpacing);
        const bulletY = startY;

        // Check if this bullet is being ejected
        let isEjecting = false;
        let ejectionProgress = 0;

        if (i === currentAmmo && ejectedBullets.length > 0) {
          // Find the most recent ejected bullet for this weapon
          const ejectedBullet = ejectedBullets.find(
            (b) => b.weaponName === weaponName
          );
          if (ejectedBullet) {
            isEjecting = true;
            ejectionProgress = ejectedBullet.progress;
          }
        }

        if (isEjecting) {
          // Get the ejected bullet
          const ejectedBullet = ejectedBullets.find(
            (b) => b.weaponName === weaponName
          );
          if (!ejectedBullet) continue;

          // Animation parameters
          const progress = ejectedBullet.progress;
          const rotation = ejectedBullet.rotation;
          const initialVelocity = ejectedBullet.initialVelocity;

          // Calculate arc trajectory
          // Initial upward movement with gravity effect
          const gravity = 8; // Gravity effect
          const timeSquared = progress * progress;

          // Calculate position based on initial velocity and gravity
          const xOffset = initialVelocity.x * progress * 50; // Scale for visual effect
          const yOffset =
            (initialVelocity.y * progress - 0.5 * gravity * timeSquared) * 50; // Gravity formula

          // Calculate opacity (fade out towards the end of animation)
          const fadeOpacity = Math.max(0, 1 - progress * 1.5);

          // Save context for rotation
          this.ctx.save();

          // Translate to bullet position with offset
          this.ctx.translate(
            bulletX + bulletWidth / 2 + xOffset,
            bulletY + bulletHeight / 2 + yOffset
          );

          // Rotate the bullet
          this.ctx.rotate((rotation * Math.PI) / 180);

          // Draw ejected bullet with animation (centered at origin after translation)
          this.ctx.globalAlpha = fadeOpacity;
          this.ctx.fillStyle = "#FFD700";
          this.ctx.fillRect(
            -bulletWidth / 2,
            -bulletHeight / 2,
            bulletWidth,
            bulletHeight
          );
          this.ctx.fillStyle = "#FFAA00";
          this.ctx.fillRect(
            -bulletWidth / 2,
            -bulletHeight / 2,
            bulletWidth,
            6
          );

          // Restore context
          this.ctx.globalAlpha = 1;
          this.ctx.restore();
        }

        // Only draw the bullet in place if it's not being ejected or it's not the current bullet
        if (!isEjecting || i !== currentAmmo) {
          // Draw bullet casing
          this.ctx.fillStyle = isActive ? "#FFD700" : "#555555"; // Gold for active, gray for spent
          this.ctx.fillRect(bulletX, bulletY, bulletWidth, bulletHeight);

          // Draw bullet tip
          this.ctx.fillStyle = isActive ? "#FFAA00" : "#333333";
          this.ctx.fillRect(bulletX, bulletY, bulletWidth, 6);
        }
      }
    }

    // Draw score and wave
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.font = "16px monospace";
    this.ctx.textAlign = "right";
    this.ctx.fillText(
      `Score: ${this.gameState.ui.score}`,
      this.canvas.width - padding,
      padding + 20
    );

    this.ctx.fillText(
      `Wave: ${this.gameState.ui.waveNumber}`,
      this.canvas.width - padding,
      padding + 40
    );

    // Draw mini-map
    this.renderMiniMap(
      this.canvas.width - 150 - padding,
      padding + 60,
      150,
      150
    );

    // Display auto-aim status
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.font = "16px monospace";
    this.ctx.textAlign = "left";
    this.ctx.fillText(
      `Auto-aim: ${this.gameState.autoAimEnabled ? "ON" : "OFF"} (T to toggle)`,
      20,
      this.canvas.height - 20
    );
  }

  private renderMiniMap(
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    // Draw mini-map background
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(x, y, width, height);
    this.ctx.strokeStyle = "#FFFFFF";
    this.ctx.strokeRect(x, y, width, height);

    // Save context to restore later
    this.ctx.save();

    // Create clipping region for the minimap
    this.ctx.beginPath();
    this.ctx.rect(x, y, width, height);
    this.ctx.clip();

    // Calculate minimap scale (how much to zoom in/out)
    const scale = 0.05; // Smaller value = more zoomed out view

    // Calculate the top-left corner of the visible area
    // This keeps the player centered in the minimap
    const mapCenterX = x + width / 2;
    const mapCenterY = y + height / 2;

    // Draw map tiles within visible area
    const tileSize = this.map.tileSize * scale;
    const visibleTilesX = Math.ceil(width / tileSize) + 2;
    const visibleTilesY = Math.ceil(height / tileSize) + 2;

    // Calculate the starting tile coordinates
    const startTileX = Math.floor(
      this.player.position.x / this.map.tileSize - visibleTilesX / 2
    );
    const startTileY = Math.floor(
      this.player.position.y / this.map.tileSize - visibleTilesY / 2
    );

    // Draw visible tiles
    for (let ty = 0; ty < visibleTilesY; ty++) {
      for (let tx = 0; tx < visibleTilesX; tx++) {
        const tileX = startTileX + tx;
        const tileY = startTileY + ty;

        // Skip tiles outside the map bounds
        if (
          tileX < 0 ||
          tileX >= this.map.width ||
          tileY < 0 ||
          tileY >= this.map.height
        ) {
          continue;
        }

        // Get tile type
        const tile = this.map.tiles[tileY][tileX];

        // Calculate screen position for this tile
        const screenX =
          mapCenterX +
          (tileX * this.map.tileSize - this.player.position.x) * scale;
        const screenY =
          mapCenterY +
          (tileY * this.map.tileSize - this.player.position.y) * scale;

        // Draw tile with color based on type
        if (tile.type === "floor") {
          this.ctx.fillStyle = "#333333"; // Dark gray for floor
        } else if (tile.type === "wall") {
          this.ctx.fillStyle = "#666666"; // Light gray for walls
        } else if (tile.type === "exit") {
          this.ctx.fillStyle = "#4444AA"; // Blue for exit
        }

        this.ctx.fillRect(screenX, screenY, tileSize, tileSize);
      }
    }

    // Draw enemies on minimap
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      const enemyX =
        mapCenterX + (enemy.position.x - this.player.position.x) * scale;
      const enemyY =
        mapCenterY + (enemy.position.y - this.player.position.y) * scale;

      // Only draw enemies that are visible on minimap
      if (
        enemyX >= x &&
        enemyX <= x + width &&
        enemyY >= y &&
        enemyY <= y + height
      ) {
        // Different colors for different enemy types
        switch (enemy.type) {
          case "Scout":
            this.ctx.fillStyle = "#4CAF50"; // Green
            break;
          case "Brute":
            this.ctx.fillStyle = "#F44336"; // Red
            break;
          case "Spitter":
            this.ctx.fillStyle = "#9C27B0"; // Purple
            break;
        }

        this.ctx.beginPath();
        this.ctx.arc(enemyX, enemyY, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Draw player position (always at center)
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.beginPath();
    this.ctx.arc(mapCenterX, mapCenterY, 3, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw player direction
    const radians = (this.player.rotation * Math.PI) / 180;
    const dirX = mapCenterX + Math.cos(radians) * 5;
    const dirY = mapCenterY + Math.sin(radians) * 5;

    this.ctx.strokeStyle = "#FFFFFF";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(mapCenterX, mapCenterY);
    this.ctx.lineTo(dirX, dirY);
    this.ctx.stroke();

    // Draw a "N" for North orientation
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.font = "10px monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText("N", x + width - 10, y + 12);

    // Restore context
    this.ctx.restore();
  }

  private renderGameOver(): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Semi-transparent overlay
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Game over title
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.font = "48px monospace";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    if (this.gameState.isGameOver) {
      this.ctx.fillText("MISSION COMPLETE", centerX, centerY - 50);
      this.ctx.font = "24px monospace";
      this.ctx.fillText("You escaped the alien planet", centerX, centerY);
    } else {
      this.ctx.fillText("GAME OVER", centerX, centerY - 50);
      this.ctx.font = "24px monospace";
      this.ctx.fillText("You were overwhelmed by the aliens", centerX, centerY);
    }

    // Stats
    this.ctx.font = "20px monospace";
    this.ctx.fillText(
      `Score: ${this.gameState.ui.score}`,
      centerX,
      centerY + 50
    );
    this.ctx.fillText(
      `Waves Survived: ${this.gameState.ui.waveNumber}`,
      centerX,
      centerY + 80
    );

    // Restart prompt
    this.ctx.font = "16px monospace";
    this.ctx.fillText("Refresh the page to play again", centerX, centerY + 150);
  }

  private renderPausedOverlay(): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Semi-transparent overlay
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Paused text
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.font = "32px monospace";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("GAME PAUSED", centerX, centerY);
  }

  private updateGameState(deltaTime: number): void {
    // Update game time (convert deltaTime from ms to seconds)
    this.gameState.gameTime += deltaTime;

    // Update time until next difficulty level
    this.gameState.ui.nextLevelTime -= deltaTime;

    // Check if it's time to increase difficulty
    if (this.gameState.ui.nextLevelTime <= 0) {
      this.gameState.ui.difficultyLevel += 1;
      this.gameState.ui.nextLevelTime = DIFFICULTY_INCREASE_TIME;

      // Every 3 levels, increase spawn rate and count
      if (this.gameState.ui.difficultyLevel % 3 === 0) {
        this.enemySpawnInterval = Math.max(0.5, this.enemySpawnInterval * 0.9);
        this.enemySpawnCount += 1;
      }
    }
  }

  // Auto-aim at the closest enemy within range and shoot if possible
  private handleAutoAimAndShoot(timestamp: number): void {
    // Skip if auto-aim is disabled
    if (!this.gameState.autoAimEnabled) return;

    if (!this.player.activeWeapon || this.enemies.length === 0) return;

    // Get the weapon's range
    const weaponRange = this.player.activeWeapon.stats.range || 500;

    // Find the closest enemy within range
    let closestEnemy: Enemy | null = null;
    let closestDistance = weaponRange;

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      const dx = enemy.position.x - this.player.position.x;
      const dy = enemy.position.y - this.player.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }

    // If we found an enemy within range, aim and shoot at it
    if (closestEnemy) {
      // Calculate direction from player to enemy
      const dx = closestEnemy.position.x - this.player.position.x;
      const dy = closestEnemy.position.y - this.player.position.y;

      // Calculate angle in radians, then convert to degrees
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      // Set player rotation to aim at the enemy
      this.player.setRotation(angle);

      // Use the same shooting method as manual shooting to ensure projectiles are created
      this.shoot(timestamp);

      // Check if we need to reload
      if (this.player.activeWeapon) {
        const weaponName = this.player.activeWeapon.stats.name;
        const currentAmmo = this.player.ammo.get(weaponName) || 0;

        if (currentAmmo <= 0 && !this.player.reloading) {
          this.player.reload();
        }
      }
    }
  }

  /**
   * Render notifications
   */
  private renderNotifications(): void {
    const currentTime = performance.now();

    // Position notifications in the center-top of the screen
    const startY = 120;
    const padding = 10;
    let offsetY = 0;

    // Filter and update notifications (remove expired ones)
    this.gameState.notifications = this.gameState.notifications.filter(
      (notification) => {
        const elapsed = currentTime - notification.startTime;
        return elapsed < notification.duration;
      }
    );

    // Draw each notification
    this.gameState.notifications.forEach((notification, index) => {
      const elapsed = currentTime - notification.startTime;

      // Calculate opacity (fade in/out effect)
      let opacity = 1;
      const fadeTime = 500; // time spent fading in/out in ms

      if (elapsed < fadeTime) {
        // Fade in
        opacity = elapsed / fadeTime;
      } else if (elapsed > notification.duration - fadeTime) {
        // Fade out
        opacity = (notification.duration - elapsed) / fadeTime;
      }

      // Set text style
      this.ctx.font = "bold 24px monospace";
      this.ctx.textAlign = "center";

      // Calculate text metrics for background
      const metrics = this.ctx.measureText(notification.message);
      const textWidth = metrics.width;
      const textHeight = 30; // Approximate text height

      // Draw semi-transparent background
      this.ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.7})`;
      this.ctx.fillRect(
        this.canvas.width / 2 - textWidth / 2 - padding,
        startY + offsetY,
        textWidth + padding * 2,
        textHeight + padding * 2
      );

      // Draw text with notification color and opacity
      this.ctx.fillStyle = notification.color;
      this.ctx.globalAlpha = opacity;
      this.ctx.fillText(
        notification.message,
        this.canvas.width / 2,
        startY + offsetY + textHeight + padding / 2
      );
      this.ctx.globalAlpha = 1;

      // Increase offset for next notification
      offsetY += textHeight + padding * 2 + 5;
    });
  }
}
