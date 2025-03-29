import { Astronaut } from "./Astronaut";
import { Enemy } from "./Enemy";
import { GameMap } from "./Map";
import { Projectile } from "./Projectile";
import { Position, EnemyStats, EnemyType, GameState } from "../types";
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
    score: 0,
    isGameOver: false,
    waveNumber: 1,
    difficultyLevel: INITIAL_DIFFICULTY,
    gameTime: 0,
    nextLevelTime: DIFFICULTY_INCREASE_TIME,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;

    // Create map with random seed
    const seed = Math.random().toString();
    this.rng = seedrandom(seed);
    this.map = new GameMap(seed);

    // Create player in the center of the map
    const startX = Math.floor(this.map.width / 2) * this.map.tileSize;
    const startY = Math.floor(this.map.height / 2) * this.map.tileSize;
    this.player = new Astronaut({ x: startX, y: startY });

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
    requestAnimationFrame(this.loop.bind(this));
  }

  private loop(timestamp: number): void {
    // Calculate delta time
    const deltaTime = (timestamp - this.lastTime) / 1000; // seconds
    this.lastTime = timestamp;

    // Update game state
    this.update(deltaTime, timestamp);

    // Render everything
    this.render();

    // Continue loop
    if (!this.gameState.isGameOver) {
      requestAnimationFrame(this.loop.bind(this));
    }
  }

  private update(deltaTime: number, timestamp: number): void {
    if (this.gameState.isGameOver) return;

    // Update game time
    this.gameState.gameTime += deltaTime;

    // Handle player input
    this.handleInput(deltaTime, timestamp);

    // Update player
    this.player.update(deltaTime, timestamp);

    // Check if player is on hazard tile
    if (this.map.isTileHazard(this.player.position.x, this.player.position.y)) {
      this.player.takeDamage(10 * deltaTime); // Damage over time
    }

    // Check if player reached the exit
    if (this.map.isTileExit(this.player.position.x, this.player.position.y)) {
      this.gameState.isGameOver = true;
      return;
    }

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

    // Shooting
    if (this.mouseDown) {
      this.shoot(timestamp);
    }

    // Rotation (aim toward mouse)
    this.aim();
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
    // Update each projectile
    for (const projectile of this.projectiles) {
      projectile.update(deltaTime);

      // Check collision with walls
      if (
        !this.map.isTileWalkable(projectile.position.x, projectile.position.y)
      ) {
        projectile.deactivate();
        continue;
      }

      // Check collision with enemies
      for (const enemy of this.enemies) {
        if (!enemy.active) continue;

        const dx = enemy.position.x - projectile.position.x;
        const dy = enemy.position.y - projectile.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Simple circular collision
        if (distance < 15) {
          // Enemy radius
          enemy.takeDamage(projectile.damage);
          projectile.deactivate();

          // Add score for hit
          if (!enemy.active) {
            this.gameState.score += 10;
          }

          break;
        }
      }
    }

    // Remove inactive projectiles
    this.projectiles = this.projectiles.filter((p) => p.active);
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
    if (timestamp - this.lastEnemySpawnTime < this.enemySpawnInterval) return;

    this.lastEnemySpawnTime = timestamp;

    // Increase difficulty over time
    this.gameState.waveNumber++;
    this.enemySpawnCount = Math.min(
      5 + Math.floor(this.gameState.waveNumber / 2),
      20
    );

    // Decrease spawn interval over time (more frequent spawns)
    this.enemySpawnInterval = Math.max(
      5000 - this.gameState.waveNumber * 200,
      2000
    );

    // Calculate the view range (slightly larger than canvas)
    const viewRangeX = this.canvas.width * 0.7;
    const viewRangeY = this.canvas.height * 0.7;

    for (let i = 0; i < this.enemySpawnCount; i++) {
      // Generate a position outside of the player's view
      let spawnX: number;
      let spawnY: number;
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
        1 + (this.gameState.difficultyLevel - 1) * 0.2;

      switch (enemyType) {
        case "Scout":
          stats = {
            type: "Scout",
            health: 20 * difficultyMultiplier,
            speed: this.player.speed * 0.8,
            attackRange: 20,
            attackDamage: 10 * difficultyMultiplier,
            attackSpeed: 1,
            level: this.gameState.difficultyLevel,
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
            level: this.gameState.difficultyLevel,
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
            level: this.gameState.difficultyLevel,
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

    // Render game over screen if needed
    if (this.gameState.isGameOver) {
      this.renderGameOver();
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
      1 - this.gameState.nextLevelTime / DIFFICULTY_INCREASE_TIME;

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
      `Difficulty: ${this.gameState.difficultyLevel}`,
      padding + 10,
      diffBarY + 15
    );

    // Draw time info
    const minutes = Math.floor(this.gameState.gameTime / 60);
    const seconds = Math.floor(this.gameState.gameTime % 60);
    const timeNextLevel = Math.max(0, Math.ceil(this.gameState.nextLevelTime));

    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.font = "16px monospace";
    this.ctx.textAlign = "left";
    this.ctx.fillText(
      `Time: ${minutes}:${seconds.toString().padStart(2, "0")}`,
      padding,
      diffBarY + barHeight + 20
    );

    this.ctx.fillText(
      `Next level: ${timeNextLevel}s`,
      padding,
      diffBarY + barHeight + 40
    );

    // Draw ammo counter
    if (this.player.activeWeapon) {
      const weaponName = this.player.activeWeapon.stats.name;
      const currentAmmo = this.player.ammo.get(weaponName) || 0;
      const reserveAmmo = this.player.reserves.get(weaponName) || 0;

      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.font = "24px monospace";
      this.ctx.textAlign = "right";
      this.ctx.fillText(
        `${currentAmmo} / ${reserveAmmo}`,
        this.canvas.width - padding,
        this.canvas.height - padding
      );

      // Show weapon name
      this.ctx.font = "16px monospace";
      this.ctx.fillText(
        weaponName.toUpperCase(),
        this.canvas.width - padding,
        this.canvas.height - padding - 30
      );
    }

    // Draw score and wave
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.font = "16px monospace";
    this.ctx.textAlign = "right";
    this.ctx.fillText(
      `Score: ${this.gameState.score}`,
      this.canvas.width - padding,
      padding + 20
    );

    this.ctx.fillText(
      `Wave: ${this.gameState.waveNumber}`,
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

    // Draw player position
    const mapRatio = 10000 / width; // Map size to mini-map size
    const playerX = x + this.player.position.x / mapRatio;
    const playerY = y + this.player.position.y / mapRatio;

    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.beginPath();
    this.ctx.arc(playerX, playerY, 3, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw exit position
    const exitX = x + this.map.exitPosition.x / mapRatio;
    const exitY = y + this.map.exitPosition.y / mapRatio;

    this.ctx.fillStyle = "#4444FF";
    this.ctx.beginPath();
    this.ctx.arc(exitX, exitY, 3, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw line pointing to exit
    this.ctx.strokeStyle = "rgba(68, 68, 255, 0.5)";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(playerX, playerY);
    this.ctx.lineTo(exitX, exitY);
    this.ctx.stroke();

    // Draw enemies on minimap
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      const enemyX = x + enemy.position.x / mapRatio;
      const enemyY = y + enemy.position.y / mapRatio;

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
    this.ctx.fillText(`Score: ${this.gameState.score}`, centerX, centerY + 50);
    this.ctx.fillText(
      `Waves Survived: ${this.gameState.waveNumber}`,
      centerX,
      centerY + 80
    );

    // Restart prompt
    this.ctx.font = "16px monospace";
    this.ctx.fillText("Refresh the page to play again", centerX, centerY + 150);
  }

  private updateGameState(deltaTime: number): void {
    // Update game time (convert deltaTime from ms to seconds)
    this.gameState.gameTime += deltaTime;

    // Update time until next difficulty level
    this.gameState.nextLevelTime -= deltaTime;

    // Check if it's time to increase difficulty
    if (this.gameState.nextLevelTime <= 0) {
      this.gameState.difficultyLevel += 1;
      this.gameState.nextLevelTime = DIFFICULTY_INCREASE_TIME;

      // Every 3 levels, increase spawn rate and count
      if (this.gameState.difficultyLevel % 3 === 0) {
        this.enemySpawnInterval = Math.max(0.5, this.enemySpawnInterval * 0.9);
        this.enemySpawnCount += 1;
      }
    }
  }
}
