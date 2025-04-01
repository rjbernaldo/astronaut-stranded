import {
  CentralGameState,
  ActionType,
  GameStateData,
  Notification,
} from "../state/GameState";
import { Position, WeaponStats } from "../types";
import { Enemy } from "../game/Enemy";

// Constants
const DIFFICULTY_SCALING_INTERVAL = 60; // Seconds between difficulty increases

/**
 * A new implementation of GameLoop that uses a centralized state management approach
 */
export class GameLoopState {
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private gameState: CentralGameState;
  private onLevelUpCallback: (() => void) | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    seed?: string,
    initialWeaponStats?: WeaponStats | null
  ) {
    // Initialize central game state
    this.gameState = new CentralGameState(canvas, seed, initialWeaponStats);

    // Enable auto-aim permanently
    const state = this.gameState.getState();
    state.autoAimEnabled = true;

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for keyboard and mouse
   */
  private setupEventListeners(): void {
    const canvas = this.gameState.getCanvas();
    const state = this.gameState.getState();

    // Keyboard events
    window.addEventListener("keydown", (e) => {
      state.keysPressed.add(e.key.toLowerCase());

      // Reload on 'r' press
      if (e.key.toLowerCase() === "r") {
        this.gameState.reload();
      }

      // Weapon switching
      if (e.key === "1") {
        this.gameState.switchWeapon("pistol");
      } else if (e.key === "2") {
        this.gameState.switchWeapon("rifle");
      } else if (e.key === "3") {
        this.gameState.switchWeapon("shotgun");
      }
    });

    window.addEventListener("keyup", (e) => {
      state.keysPressed.delete(e.key.toLowerCase());
    });

    // Mouse events
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      state.mousePosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    });

    canvas.addEventListener("mousedown", () => {
      state.mouseDown = true;
    });

    canvas.addEventListener("mouseup", () => {
      state.mouseDown = false;
    });

    // Resize event
    window.addEventListener("resize", () => {
      this.handleResize();
    });
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    const canvas = this.gameState.getCanvas();

    // Adjust canvas size to window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  /**
   * Start the game loop
   */
  start(): void {
    // Set initial canvas size
    this.handleResize();

    // Start game loop
    const state = this.gameState.getState();
    state.isPaused = false;
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  /**
   * Stop the game loop and clean up resources
   */
  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Clean up event listeners
    window.removeEventListener("keydown", () => {});
    window.removeEventListener("keyup", () => {});
    this.gameState.getCanvas().removeEventListener("mousemove", () => {});
    this.gameState.getCanvas().removeEventListener("mousedown", () => {});
    this.gameState.getCanvas().removeEventListener("mouseup", () => {});
    window.removeEventListener("resize", () => {});
  }

  /**
   * Pause the game
   */
  pause(): void {
    const state = this.gameState.getState();

    if (!state.isPaused && this.animationFrameId) {
      state.isPaused = true;
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;

      // Render a paused indicator
      this.renderPausedOverlay();
    }
  }

  /**
   * Resume the game
   */
  resume(): void {
    const state = this.gameState.getState();

    if (state.isPaused) {
      state.isPaused = false;
      // Reset the lastTime to the current time to prevent a large time delta
      this.lastTime = performance.now();

      // Resume the animation loop
      this.animationFrameId = requestAnimationFrame(this.loop.bind(this));

      // Redraw the current state immediately to remove pause overlay
      this.render();
    }
  }

  /**
   * Update weapon stats
   */
  updateWeapon(weaponStats: WeaponStats): void {
    this.gameState.updateWeapon(weaponStats);
  }

  /**
   * Get the current game state
   */
  getState() {
    return this.gameState.getState();
  }

  /**
   * Set callback to be called when player levels up
   */
  setOnLevelUpCallback(callback: () => void): void {
    this.onLevelUpCallback = callback;

    // Keep track of the last level we saw
    let lastLevel = 1;

    // Setup a function to check if the player has leveled up
    this.gameState.subscribe("*", (state: any) => {
      // Only process if we have a callback
      if (!this.onLevelUpCallback) return;

      // Check if state has UI data
      if (state && state.ui) {
        // Check if player level has increased since we last checked
        if (state.ui.playerLevel > lastLevel) {
          // Update the last level we saw
          lastLevel = state.ui.playerLevel;

          // Call the level up callback
          this.onLevelUpCallback();
        }
      }
    });
  }

  /**
   * Main game loop
   */
  private loop(timestamp: number): void {
    const state = this.gameState.getState();

    // Stop the loop if game is paused
    if (state.isPaused) return;

    // Calculate delta time
    const deltaTime = (timestamp - this.lastTime) / 1000; // seconds
    this.lastTime = timestamp;

    // Update game state
    this.update(deltaTime, timestamp);

    // Render everything
    this.render();

    // Continue loop
    if (!state.ui.isGameOver) {
      this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
    }
  }

  /**
   * Update game state
   */
  private update(deltaTime: number, timestamp: number): void {
    const state = this.gameState.getState();

    if (state.ui.isGameOver) return;

    // Check if player is dead
    if (state.player.health <= 0) {
      state.ui.isGameOver = true;

      // Record final stats for the death screen
      state.ui.finalStats = {
        time: state.ui.gameTime,
        score: state.ui.score,
        wave: state.ui.waveNumber,
        level: state.ui.playerLevel,
        kills: state.ui.kills || 0,

        // Track stats over time for the graph
        history: [
          ...(state.ui.statsHistory || []),
          {
            time: state.ui.gameTime,
            health: 0, // Final health is 0
            score: state.ui.score,
            kills: state.ui.kills || 0,
            level: state.ui.playerLevel,
          },
        ],
      };

      // Render game over screen
      this.renderGameOver();
      return;
    }

    // Handle player input
    this.handleInput(deltaTime, timestamp);

    // Auto-aim and shoot
    if (state.autoAimEnabled) {
      this.gameState.autoAimAndShoot(timestamp);
    }

    // Update all entities
    this.gameState.updateEntities(deltaTime, timestamp);

    // Check if player is on hazard tile
    if (
      state.map.isTileHazard(state.player.position.x, state.player.position.y)
    ) {
      this.gameState.takeDamage(10 * deltaTime); // Damage over time
    }

    // Spawn new enemies
    this.spawnEnemies(timestamp);

    // Auto-explore map around player
    state.map.setTileExplored(
      state.player.position.x,
      state.player.position.y,
      state.player.lightRadius
    );

    // Record stats for history (every 5 seconds)
    if (!state.ui.statsHistory) {
      state.ui.statsHistory = [];
    }

    const lastRecord = state.ui.statsHistory[state.ui.statsHistory.length - 1];
    if (!lastRecord || state.ui.gameTime - lastRecord.time >= 5) {
      state.ui.statsHistory.push({
        time: state.ui.gameTime,
        health: state.player.health,
        score: state.ui.score,
        kills: state.ui.kills || 0,
        level: state.ui.playerLevel,
      });
    }
  }

  /**
   * Handle player input
   */
  private handleInput(deltaTime: number, timestamp: number): void {
    const state = this.gameState.getState();

    // Movement
    if (state.keysPressed.has("w")) {
      this.gameState.movePlayer("up", deltaTime);
    }
    if (state.keysPressed.has("s")) {
      this.gameState.movePlayer("down", deltaTime);
    }
    if (state.keysPressed.has("a")) {
      this.gameState.movePlayer("left", deltaTime);
    }
    if (state.keysPressed.has("d")) {
      this.gameState.movePlayer("right", deltaTime);
    }

    // Manual shooting - only override auto-aim if mouseDown is true
    if (state.mouseDown) {
      // Manual aim toward mouse
      this.aim();

      // Manual shooting
      this.gameState.shoot(timestamp);
    }
  }

  /**
   * Aim the player toward the mouse position
   */
  private aim(): void {
    const state = this.gameState.getState();
    const canvas = this.gameState.getCanvas();

    // Calculate direction from player to mouse
    const screenCenterX = canvas.width / 2;
    const screenCenterY = canvas.height / 2;

    const dx = state.mousePosition.x - screenCenterX;
    const dy = state.mousePosition.y - screenCenterY;

    // Calculate angle in radians, then convert to degrees
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Set player rotation
    state.player.setRotation(angle);
  }

  /**
   * Spawn new enemies
   */
  private spawnEnemies(timestamp: number): void {
    const state = this.gameState.getState();
    const canvas = this.gameState.getCanvas();

    // Check if it's time to spawn a new wave
    if (state.ui.waveNumber > 1) {
      if (timestamp - state.lastEnemySpawnTime < state.enemySpawnInterval)
        return;
    }

    state.lastEnemySpawnTime = timestamp;

    // Increase difficulty over time
    state.ui.waveNumber++;
    state.enemySpawnCount = Math.min(
      4 + Math.floor(state.ui.waveNumber / 2),
      15
    );

    // Decrease spawn interval over time (more frequent spawns)
    state.enemySpawnInterval = Math.max(6250 - state.ui.waveNumber * 200, 2500);

    // Calculate the view range (slightly larger than canvas)
    const viewRangeX = canvas.width * 0.5;
    const viewRangeY = canvas.height * 0.5;

    // Generate enemies for this wave
    for (let i = 0; i < state.enemySpawnCount; i++) {
      // Find a valid spawn position outside the player's view
      let spawnX: number = 0;
      let spawnY: number = 0;
      let validPosition = false;
      let attempts = 0;

      // Try to find a valid spawn position
      while (!validPosition && attempts < 10) {
        attempts++;

        // Determine spawn direction (from which edge)
        const spawnDirection = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

        // Calculate base spawn position depending on direction
        switch (spawnDirection) {
          case 0: // Top
            spawnX =
              state.player.position.x + (Math.random() * 2 - 1) * viewRangeX;
            spawnY = state.player.position.y - viewRangeY - Math.random() * 200;
            break;
          case 1: // Right
            spawnX = state.player.position.x + viewRangeX + Math.random() * 200;
            spawnY =
              state.player.position.y + (Math.random() * 2 - 1) * viewRangeY;
            break;
          case 2: // Bottom
            spawnX =
              state.player.position.x + (Math.random() * 2 - 1) * viewRangeX;
            spawnY = state.player.position.y + viewRangeY + Math.random() * 200;
            break;
          case 3: // Left
            spawnX = state.player.position.x - viewRangeX - Math.random() * 200;
            spawnY =
              state.player.position.y + (Math.random() * 2 - 1) * viewRangeY;
            break;
        }

        // Check if the position is valid (on a walkable tile)
        if (state.map.isTileWalkable(spawnX, spawnY)) {
          // Ensure minimum distance from player
          const distX = Math.abs(spawnX - state.player.position.x);
          const distY = Math.abs(spawnY - state.player.position.y);
          if (Math.sqrt(distX * distX + distY * distY) > 300) {
            validPosition = true;
          }
        }
      }

      if (validPosition) {
        // Calculate enemy level based on game difficulty
        const enemyLevel = Math.max(
          1,
          Math.floor(state.ui.difficultyLevel * 0.5)
        );

        // Determine enemy type based on difficulty and random chance
        let enemyType: "Scout" | "Brute" | "Spitter" = "Scout";

        const roll = Math.random() * 100;

        if (state.ui.difficultyLevel >= 3) {
          if (roll < 10 * state.ui.difficultyLevel) {
            // Higher chance of brutes as difficulty increases
            enemyType = "Brute";
          } else if (roll < 20 * state.ui.difficultyLevel) {
            // Higher chance of spitters as difficulty increases
            enemyType = "Spitter";
          }
        }

        // Create enemy stats
        const stats: any = {
          health: 0,
          speed: 0,
          attackRange: 0,
          attackDamage: 0,
          attackSpeed: 0,
          type: enemyType,
          level: enemyLevel,
        };

        // Adjust stats based on type
        switch (enemyType) {
          case "Scout":
            stats.health = 30 * enemyLevel;
            stats.speed = 64 + enemyLevel * 4; // Reduced by 20% from 80 + enemyLevel * 5
            stats.attackRange = 20;
            stats.attackDamage = 10 + enemyLevel * 2;
            stats.attackSpeed = 1;
            break;
          case "Brute":
            stats.health = 70 * enemyLevel;
            stats.speed = 32 + enemyLevel * 1.6; // Reduced by 20% from 40 + enemyLevel * 2
            stats.attackRange = 25;
            stats.attackDamage = 20 + enemyLevel * 4;
            stats.attackSpeed = 2;
            break;
          case "Spitter":
            stats.health = 40 * enemyLevel;
            stats.speed = 48 + enemyLevel * 2.4; // Reduced by 20% from 60 + enemyLevel * 3
            stats.attackRange = 150;
            stats.attackDamage = 8 + enemyLevel * 1.5;
            stats.attackSpeed = 1.5;
            break;
        }

        // Create and add enemy
        const enemy = new Enemy(
          { x: spawnX, y: spawnY },
          stats,
          state.player.position
        );
        state.enemies.push(enemy);
      }
    }
  }

  /**
   * Render the game
   */
  private render(): void {
    const state = this.gameState.getState();
    const ctx = this.gameState.getContext();
    const canvas = this.gameState.getCanvas();

    // Clear canvas
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render map
    state.map.render(ctx, state.cameraPosition, canvas.width, canvas.height);

    // Render enemies
    for (const enemy of state.enemies) {
      enemy.render(ctx, state.cameraPosition);
    }

    // Render projectiles - adjusted to draw at screen coordinates
    state.projectiles.forEach((projectile) => {
      // Calculate screen position for the projectile
      const screenPos = {
        x: projectile.position.x - state.cameraPosition.x + canvas.width / 2,
        y: projectile.position.y - state.cameraPosition.y + canvas.height / 2,
      };

      // Render projectile with screen position
      projectile.render(ctx, screenPos);
    });

    // Render player
    this.renderPlayer();

    // Render minimap
    this.renderMiniMap(state, ctx, canvas);

    // Render HUD
    this.renderHUD();

    // Render notifications
    this.renderNotifications();

    // Render game over screen if needed
    if (state.ui.isGameOver) {
      this.renderGameOver();
    }
  }

  /**
   * Render the player
   */
  private renderPlayer(): void {
    const state = this.gameState.getState();
    const ctx = this.gameState.getContext();
    const canvas = this.gameState.getCanvas();

    // Calculate screen position
    const screenX = canvas.width / 2;
    const screenY = canvas.height / 2;

    // Draw player
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(screenX, screenY, 15, 0, Math.PI * 2);
    ctx.fill();

    // Draw player direction (gun)
    const radians = (state.player.rotation * Math.PI) / 180;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(
      screenX + Math.cos(radians) * 20,
      screenY + Math.sin(radians) * 20
    );
    ctx.stroke();

    // Draw astronaut helmet
    ctx.fillStyle = "#AAAAFF";
    ctx.beginPath();
    ctx.arc(screenX, screenY, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Render the minimap
   */
  private renderMiniMap(
    state: GameStateData,
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ): void {
    // Minimap constants
    const mapSize = 150;
    const padding = 20;
    const borderWidth = 2;
    // Move minimap to top right instead of bottom right
    const mapX = canvas.width - mapSize - padding;
    const mapY = padding;

    // Save context state
    ctx.save();

    // Create clipping region for the minimap
    ctx.beginPath();
    ctx.rect(mapX, mapY, mapSize, mapSize);
    ctx.clip();

    // Calculate minimap scale (how much to zoom in/out)
    const mapScale = 0.1;

    // This keeps the player centered in the minimap
    const centerX = mapX + mapSize / 2 - state.player.position.x * mapScale;
    const centerY = mapY + mapSize / 2 - state.player.position.y * mapScale;

    // Draw minimap background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(mapX, mapY, mapSize, mapSize);

    // Draw map tiles on minimap
    const tileSize = state.map.tileSize * mapScale;
    const startTileX = Math.floor(
      (state.player.position.x - mapSize / mapScale / 2) / state.map.tileSize
    );
    const startTileY = Math.floor(
      (state.player.position.y - mapSize / mapScale / 2) / state.map.tileSize
    );
    const endTileX =
      startTileX + Math.ceil(mapSize / mapScale / state.map.tileSize) + 1;
    const endTileY =
      startTileY + Math.ceil(mapSize / mapScale / state.map.tileSize) + 1;

    for (let x = startTileX; x < endTileX; x++) {
      for (let y = startTileY; y < endTileY; y++) {
        if (x >= 0 && x < state.map.width && y >= 0 && y < state.map.height) {
          const tile = state.map.tiles[y][x]; // Direct array access since we have bounds checks

          if (tile.explored) {
            // Draw explored tiles
            let tileColor;

            switch (tile.type) {
              case "floor":
                tileColor = "#444";
                break;
              case "wall":
                tileColor = "#888";
                break;
              case "hazard":
                tileColor = "#A00";
                break;
              case "exit":
                tileColor = "#44F";
                break;
              default:
                tileColor = "#000";
            }

            ctx.fillStyle = tileColor;
            ctx.fillRect(
              centerX + x * state.map.tileSize * mapScale,
              centerY + y * state.map.tileSize * mapScale,
              tileSize,
              tileSize
            );
          }
        }
      }
    }

    // Draw enemies on minimap
    for (const enemy of state.enemies) {
      if (!enemy.active) continue;

      // Only draw enemies that are visible on minimap
      const enemyScreenX = centerX + enemy.position.x * mapScale;
      const enemyScreenY = centerY + enemy.position.y * mapScale;

      if (
        enemyScreenX >= mapX &&
        enemyScreenX <= mapX + mapSize &&
        enemyScreenY >= mapY &&
        enemyScreenY <= mapY + mapSize
      ) {
        // Draw enemy dot - color based on enemy type
        let enemyColor;
        switch (enemy.type) {
          case "Brute":
            enemyColor = "#F00"; // Red for brutes
            break;
          case "Spitter":
            enemyColor = "#FF0"; // Yellow for spitters
            break;
          default:
            enemyColor = "#F80"; // Orange for scouts
        }

        ctx.fillStyle = enemyColor;
        ctx.beginPath();
        ctx.arc(enemyScreenX, enemyScreenY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw player on minimap
    ctx.fillStyle = "#0AF"; // Bright blue for player
    ctx.beginPath();
    ctx.arc(mapX + mapSize / 2, mapY + mapSize / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw player direction
    const dirX = Math.cos((state.player.rotation * Math.PI) / 180) * 6;
    const dirY = Math.sin((state.player.rotation * Math.PI) / 180) * 6;
    ctx.strokeStyle = "#0AF";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(mapX + mapSize / 2, mapY + mapSize / 2);
    ctx.lineTo(mapX + mapSize / 2 + dirX, mapY + mapSize / 2 + dirY);
    ctx.stroke();

    // Draw minimap border
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    // Restore context state
    ctx.restore();
  }

  /**
   * Render the HUD
   */
  private renderHUD(): void {
    const state = this.gameState.getState();
    const ctx = this.gameState.getContext();
    const canvas = this.gameState.getCanvas();

    const padding = 20;
    const barWidth = 200;
    const barHeight = 20;

    // Draw health bar
    ctx.fillStyle = "#333333";
    ctx.fillRect(padding, padding, barWidth, barHeight);

    const healthPercent = state.player.health / 100;
    ctx.fillStyle = `rgb(${255 - healthPercent * 255}, ${
      healthPercent * 255
    }, 0)`;
    ctx.fillRect(padding, padding, barWidth * healthPercent, barHeight);

    ctx.strokeStyle = "#FFFFFF";
    ctx.strokeRect(padding, padding, barWidth, barHeight);

    // Draw health text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `Health: ${Math.floor(state.player.health)}`,
      padding + 10,
      padding + 15
    );

    // Draw Wave progress bar (replacing "difficulty")
    const waveBarY = padding + barHeight + 10;
    ctx.fillStyle = "#333333";
    ctx.fillRect(padding, waveBarY, barWidth, barHeight);

    // Calculate time progress for next wave
    const waveProgress =
      1 - state.ui.nextLevelTime / DIFFICULTY_SCALING_INTERVAL;

    // Draw wave progress bar
    ctx.fillStyle = "#FF6600"; // Orange color for wave
    ctx.fillRect(padding, waveBarY, barWidth * waveProgress, barHeight);
    ctx.strokeStyle = "#FFFFFF";
    ctx.strokeRect(padding, waveBarY, barWidth, barHeight);

    // Draw wave text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px monospace";
    ctx.textAlign = "left";
    const timeUntilNextWave = Math.max(0, Math.ceil(state.ui.nextLevelTime));
    ctx.fillText(
      `Wave ${state.ui.waveNumber} (Next: ${timeUntilNextWave}s)`,
      padding + 10,
      waveBarY + 15
    );

    // Draw player level progress bar
    const levelBarY = waveBarY + barHeight + 10;
    ctx.fillStyle = "#333333";
    ctx.fillRect(padding, levelBarY, barWidth, barHeight);

    // Calculate XP progress
    const xpProgress = state.ui.playerXp / state.ui.xpForNextLevel;

    // Draw level progress bar
    ctx.fillStyle = "#00AAFF"; // Blue color for XP
    ctx.fillRect(padding, levelBarY, barWidth * xpProgress, barHeight);
    ctx.strokeStyle = "#FFFFFF";
    ctx.strokeRect(padding, levelBarY, barWidth, barHeight);

    // Draw level text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `Level: ${state.ui.playerLevel} (${state.ui.playerXp}/${state.ui.xpForNextLevel} XP)`,
      padding + 10,
      levelBarY + 15
    );

    // Draw time info
    const minutes = Math.floor(state.ui.gameTime / 60);
    const seconds = Math.floor(state.ui.gameTime % 60);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `Time: ${minutes}:${seconds.toString().padStart(2, "0")}`,
      padding,
      levelBarY + barHeight + 20
    );

    // Draw score display
    ctx.fillText(
      `Score: ${state.ui.score}`,
      padding,
      levelBarY + barHeight + 45
    );

    // Draw ammo counter
    if (state.player.activeWeapon) {
      const weaponName = state.player.activeWeapon.stats.name;
      const currentAmmo = state.player.ammo.get(weaponName) || 0;
      const maxAmmo = state.player.activeWeapon.stats.magazineSize;

      // Position and dimensions for the ammo display
      const bulletWidth = 10;
      const bulletHeight = 24;
      const bulletSpacing = 4;
      const startX = canvas.width - padding - bulletWidth;
      const startY = canvas.height - padding - 30;

      // Background for ammo display
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(
        startX - maxAmmo * (bulletWidth + bulletSpacing) + bulletWidth,
        startY - 5,
        maxAmmo * (bulletWidth + bulletSpacing) + 10,
        bulletHeight + 10
      );

      // Display weapon name
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "16px monospace";
      ctx.textAlign = "right";
      ctx.fillText(
        weaponName.toUpperCase(),
        canvas.width - padding,
        startY - 15
      );

      // Get ejected bullets for animation
      const ejectedBullets = state.player.getEjectedBullets();

      // Draw reload progress bar if reloading
      if (state.player.reloading) {
        // Get the reload start time and duration
        const reloadTime = state.player.activeWeapon.stats.reloadTime * 1000; // Convert to ms
        const currentTime = performance.now();
        const reloadStartTime = state.player.reloadStartTime || currentTime;
        const elapsedTime = currentTime - reloadStartTime;
        const progress = Math.min(elapsedTime / reloadTime, 1);

        // Draw reload bar background
        const reloadBarHeight = 8;
        const reloadBarY = startY + bulletHeight + 8;
        const totalWidth =
          maxAmmo * (bulletWidth + bulletSpacing) - bulletSpacing;

        ctx.fillStyle = "#333333";
        ctx.fillRect(
          startX - totalWidth + bulletWidth,
          reloadBarY,
          totalWidth,
          reloadBarHeight
        );

        // Draw progress
        ctx.fillStyle = "#4CAF50"; // Green color
        ctx.fillRect(
          startX - totalWidth + bulletWidth,
          reloadBarY,
          totalWidth * progress,
          reloadBarHeight
        );

        // Draw text "RELOADING" above the progress bar
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.fillText("RELOADING", startX - totalWidth / 2, reloadBarY - 4);
        ctx.textAlign = "right"; // Reset text alignment
      }

      // Draw bullets
      for (let i = 0; i < maxAmmo; i++) {
        // Determine if this bullet is loaded/active
        const isActive = i < currentAmmo;

        // Position for this bullet
        const bulletX = startX - i * (bulletWidth + bulletSpacing);
        const bulletY = startY;

        // Check if this bullet is being ejected (for backward compatibility)
        let isEjecting = false;

        if (i === currentAmmo && ejectedBullets.length > 0) {
          // Find the most recent ejected bullet for this weapon
          const ejectedBullet = ejectedBullets.find(
            (b) => b.weaponName === weaponName
          );
          if (ejectedBullet) {
            isEjecting = true;
          }
        }

        // Only draw the bullet in place if it's not being ejected or it's not the current bullet
        if (!isEjecting || i !== currentAmmo) {
          // Draw bullet casing
          ctx.fillStyle = isActive ? "#FFD700" : "#555555"; // Gold for active, gray for spent
          ctx.fillRect(bulletX, bulletY, bulletWidth, bulletHeight);

          // Draw bullet tip
          ctx.fillStyle = isActive ? "#FFAA00" : "#333333";
          ctx.fillRect(bulletX, bulletY, bulletWidth, 6);
        }
      }

      // Display weapon statistics in bottom left
      if (state.player.activeWeapon) {
        const stats = state.player.activeWeapon.stats;
        const leftPadding = 20;
        const bottomPadding = 20;
        const lineHeight = 20;

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "16px monospace";
        ctx.textAlign = "left";

        // Display all weapon stats
        ctx.fillText(
          `WEAPON: ${stats.name.toUpperCase()}`,
          leftPadding,
          canvas.height - bottomPadding - lineHeight * 7
        );

        // Display damage
        ctx.fillText(
          `DMG: ${Math.floor(stats.damage)}`,
          leftPadding,
          canvas.height - bottomPadding - lineHeight * 6
        );

        // Display fire rate (rounds per second)
        ctx.fillText(
          `RATE: ${(1 / stats.fireRate).toFixed(1)} RPS`,
          leftPadding,
          canvas.height - bottomPadding - lineHeight * 5
        );

        // Display range
        ctx.fillText(
          `RANGE: ${Math.floor(stats.range)}`,
          leftPadding,
          canvas.height - bottomPadding - lineHeight * 4
        );

        // Display pierce (formerly knockback)
        ctx.fillText(
          `PIERCE: ${Math.floor(stats.pierce)}`,
          leftPadding,
          canvas.height - bottomPadding - lineHeight * 3
        );

        // Display projectile size
        ctx.fillText(
          `SIZE: ${Math.floor(stats.projectileCount)}`,
          leftPadding,
          canvas.height - bottomPadding - lineHeight * 2
        );

        // Magazine size
        ctx.fillText(
          `MAG: ${Math.floor(stats.magazineSize)}`,
          leftPadding,
          canvas.height - bottomPadding - lineHeight
        );

        // Reload time
        ctx.fillText(
          `RELOAD: ${stats.reloadTime.toFixed(1)}s`,
          leftPadding,
          canvas.height - bottomPadding
        );
      }
    }
  }

  /**
   * Render the paused overlay
   */
  private renderPausedOverlay(): void {
    const ctx = this.gameState.getContext();
    const canvas = this.gameState.getCanvas();

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Paused text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "32px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GAME PAUSED", centerX, centerY);
  }

  /**
   * Render the game over screen
   */
  private renderGameOver(): void {
    const state = this.gameState.getState();
    const ctx = this.gameState.getContext();
    const canvas = this.gameState.getCanvas();

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 3; // Move title up to make space for graph

    // Semi-transparent overlay with dark souls inspired fade
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Game over title
    ctx.fillStyle = "#FF0000";
    ctx.font = "64px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("YOU DIED", centerX, centerY - 30);

    // Final stats text
    ctx.fillStyle = "#AAAAAA";
    ctx.font = "18px monospace";
    ctx.textAlign = "center";

    const finalStats = state.ui.finalStats || {
      time: state.ui.gameTime,
      score: state.ui.score,
      wave: state.ui.waveNumber,
      level: state.ui.playerLevel,
      kills: state.ui.kills || 0,
    };

    // Format time as minutes:seconds
    const minutes = Math.floor(finalStats.time / 60);
    const seconds = Math.floor(finalStats.time % 60);
    const timeFormatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    ctx.fillText(`Time survived: ${timeFormatted}`, centerX, centerY + 40);
    ctx.fillText(`Final score: ${finalStats.score}`, centerX, centerY + 70);
    ctx.fillText(`Waves survived: ${finalStats.wave}`, centerX, centerY + 100);
    ctx.fillText(`Final level: ${finalStats.level}`, centerX, centerY + 130);
    ctx.fillText(`Enemies killed: ${finalStats.kills}`, centerX, centerY + 160);

    // Draw performance graph if we have history data
    if (state.ui.statsHistory && state.ui.statsHistory.length > 0) {
      this.renderStatsGraph(state, ctx, canvas);
    }

    // Draw restart button
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = centerX - buttonWidth / 2;
    const buttonY = canvas.height - 100;

    // Button background
    ctx.fillStyle = "#333";
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    // Button border
    ctx.strokeStyle = "#AAA";
    ctx.lineWidth = 2;
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

    // Button text
    ctx.fillStyle = "#FFF";
    ctx.font = "24px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("RESTART", centerX, buttonY + buttonHeight / 2);

    // Add click event listener for restart button if not already added
    if (!this._restartButtonAdded) {
      const canvas = this.gameState.getCanvas();
      this._restartButtonAdded = true;

      canvas.addEventListener("click", (e) => {
        if (state.ui.isGameOver) {
          const rect = canvas.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;

          if (
            clickX >= buttonX &&
            clickX <= buttonX + buttonWidth &&
            clickY >= buttonY &&
            clickY <= buttonY + buttonHeight
          ) {
            // Restart the game by refreshing the page
            window.location.reload();
          }
        }
      });
    }
  }

  // Track if we've added the restart button event listener
  private _restartButtonAdded: boolean = false;

  /**
   * Render the stats graph
   */
  private renderStatsGraph(
    state: GameStateData,
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ): void {
    const graphX = canvas.width * 0.15;
    const graphY = canvas.height / 2;
    const graphWidth = canvas.width * 0.7;
    const graphHeight = canvas.height * 0.25;

    // Get history data
    const history = state.ui.statsHistory || [];
    if (history.length < 2) return; // Need at least 2 points to draw a graph

    // Find max values for normalization
    const maxTime = Math.max(...history.map((point) => point.time));
    const maxScore = Math.max(...history.map((point) => point.score));
    const maxKills = Math.max(...history.map((point) => point.kills));
    const maxLevel = Math.max(...history.map((point) => point.level));

    // Draw graph background
    ctx.fillStyle = "rgba(30, 30, 30, 0.8)";
    ctx.fillRect(graphX, graphY, graphWidth, graphHeight);

    // Draw graph border
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 1;
    ctx.strokeRect(graphX, graphY, graphWidth, graphHeight);

    // Draw graph title
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px monospace";
    ctx.textAlign = "center";
    ctx.fillText("PERFORMANCE OVER TIME", graphX + graphWidth / 2, graphY - 10);

    // Draw axes labels
    ctx.textAlign = "left";
    ctx.fillText("Time →", graphX + graphWidth + 10, graphY + graphHeight);

    ctx.textAlign = "center";
    ctx.fillText("↑", graphX - 15, graphY - 5);
    ctx.fillText("Value", graphX - 15, graphY + graphHeight / 2);

    // Draw legend
    const legendX = graphX;
    const legendY = graphY - 40;
    const legendSpacing = 80;

    // Health
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(legendX, legendY, 15, 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.fillText("Health", legendX + 20, legendY + 4);

    // Score
    ctx.fillStyle = "#00FF00";
    ctx.fillRect(legendX + legendSpacing, legendY, 15, 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Score", legendX + legendSpacing + 20, legendY + 4);

    // Kills
    ctx.fillStyle = "#FFFF00";
    ctx.fillRect(legendX + legendSpacing * 2, legendY, 15, 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Kills", legendX + legendSpacing * 2 + 20, legendY + 4);

    // Level
    ctx.fillStyle = "#00FFFF";
    ctx.fillRect(legendX + legendSpacing * 3, legendY, 15, 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Level", legendX + legendSpacing * 3 + 20, legendY + 4);

    // Draw grid lines
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = graphY + (1 - i / 4) * graphHeight;
      ctx.beginPath();
      ctx.moveTo(graphX, y);
      ctx.lineTo(graphX + graphWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 4; i++) {
      const x = graphX + (i / 4) * graphWidth;
      ctx.beginPath();
      ctx.moveTo(x, graphY);
      ctx.lineTo(x, graphY + graphHeight);
      ctx.stroke();
    }

    // Function to get x coordinate for a time point
    const getX = (time: number) => {
      return graphX + (time / maxTime) * graphWidth;
    };

    // Function to get y coordinate for a value
    const getY = (value: number, max: number) => {
      // Avoid division by zero
      if (max === 0) return graphY + graphHeight;
      return graphY + (1 - value / max) * graphHeight;
    };

    // Draw health line
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((point, i) => {
      const x = getX(point.time);
      const y = getY(point.health, 100); // Health max is 100

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw score line
    ctx.strokeStyle = "#00FF00";
    ctx.beginPath();
    history.forEach((point, i) => {
      const x = getX(point.time);
      const y = getY(point.score, maxScore);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw kills line
    ctx.strokeStyle = "#FFFF00";
    ctx.beginPath();
    history.forEach((point, i) => {
      const x = getX(point.time);
      const y = getY(point.kills, maxKills);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw level line
    ctx.strokeStyle = "#00FFFF";
    ctx.beginPath();
    history.forEach((point, i) => {
      const x = getX(point.time);
      const y = getY(point.level, maxLevel);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  }

  /**
   * Render notifications
   */
  private renderNotifications(): void {
    const state = this.gameState.getState();
    const ctx = this.gameState.getContext();
    const canvas = this.gameState.getCanvas();
    const currentTime = performance.now();

    // Position notifications in the center-top of the screen
    const startY = 120;
    const padding = 10;
    let offsetY = 0;

    // Filter and update notifications (remove expired ones)
    state.notifications = state.notifications.filter((notification) => {
      const elapsed = currentTime - notification.startTime;
      return elapsed < notification.duration;
    });

    // Draw each notification
    state.notifications.forEach((notification, index) => {
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
      ctx.font = "bold 24px monospace";
      ctx.textAlign = "center";

      // Calculate text metrics for background
      const metrics = ctx.measureText(notification.message);
      const textWidth = metrics.width;
      const textHeight = 30; // Approximate text height

      // Draw semi-transparent background
      ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.7})`;
      ctx.fillRect(
        canvas.width / 2 - textWidth / 2 - padding,
        startY + offsetY,
        textWidth + padding * 2,
        textHeight + padding * 2
      );

      // Draw text with notification color and opacity
      ctx.fillStyle = notification.color;
      ctx.globalAlpha = opacity;
      ctx.fillText(
        notification.message,
        canvas.width / 2,
        startY + offsetY + textHeight + padding / 2
      );
      ctx.globalAlpha = 1;

      // Increase offset for next notification
      offsetY += textHeight + padding * 2 + 5;
    });
  }
}
