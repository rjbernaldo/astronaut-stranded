import { CentralGameState, ActionType } from "../state/GameState";
import { Position, WeaponStats } from "../types";

/**
 * A new implementation of GameLoop that uses a centralized state management approach
 */
export class GameLoopState {
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private gameState: CentralGameState;

  constructor(
    canvas: HTMLCanvasElement,
    seed?: string,
    initialWeaponStats?: WeaponStats | null
  ) {
    // Initialize central game state
    this.gameState = new CentralGameState(canvas, seed, initialWeaponStats);

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

      // Toggle auto-aim with 't' key
      if (e.key.toLowerCase() === "t") {
        this.gameState.toggleAutoAim();
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

    // Handle player input
    this.handleInput(deltaTime, timestamp);

    // Auto-aim and shoot at nearby enemies
    this.gameState.autoAimAndShoot(timestamp);

    // Update all entities (player, projectiles, enemies)
    this.gameState.updateEntities(deltaTime, timestamp);

    // Check if player is on hazard tile
    if (
      state.map.isTileHazard(state.player.position.x, state.player.position.y)
    ) {
      this.gameState.takeDamage(10 * deltaTime); // Damage over time
    }

    // Spawn new enemies
    // TODO: Move this to the state class
    this.spawnEnemies(timestamp);

    // Auto-explore map around player
    state.map.setTileExplored(
      state.player.position.x,
      state.player.position.y,
      state.player.lightRadius
    );
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

    // TODO: Move this to the central state class

    // Check if it's time to spawn a new wave
    if (state.ui.waveNumber > 1) {
      if (timestamp - state.lastEnemySpawnTime < state.enemySpawnInterval)
        return;
    }

    state.lastEnemySpawnTime = timestamp;

    // Increase difficulty over time
    state.ui.waveNumber++;
    state.enemySpawnCount = Math.min(
      5 + Math.floor(state.ui.waveNumber / 2),
      20
    );

    // Decrease spawn interval over time (more frequent spawns)
    state.enemySpawnInterval = Math.max(5000 - state.ui.waveNumber * 200, 2000);

    // Calculate the view range (slightly larger than canvas)
    const viewRangeX = canvas.width * 0.5;
    const viewRangeY = canvas.height * 0.5;

    // Implement enemy spawning logic...
    // (Copied from original GameLoop for now)
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

    // Render HUD
    this.renderHUD();

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

    // Draw difficulty information (left side)
    const diffBarY = padding + barHeight + 10;
    ctx.fillStyle = "#333333";
    ctx.fillRect(padding, diffBarY, barWidth, barHeight);

    // Calculate time progress for next level
    const timeProgress = 1 - state.ui.nextLevelTime / 60; // Using the constant directly

    // Draw difficulty progress bar
    ctx.fillStyle = "#8844FF";
    ctx.fillRect(padding, diffBarY, barWidth * timeProgress, barHeight);
    ctx.strokeStyle = "#FFFFFF";
    ctx.strokeRect(padding, diffBarY, barWidth, barHeight);

    // Draw difficulty text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `Difficulty: ${state.ui.difficultyLevel}`,
      padding + 10,
      diffBarY + 15
    );

    // Draw time info
    const minutes = Math.floor(state.ui.gameTime / 60);
    const seconds = Math.floor(state.ui.gameTime % 60);
    const timeNextLevel = Math.max(0, Math.ceil(state.ui.nextLevelTime));

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `Time: ${minutes}:${seconds.toString().padStart(2, "0")}`,
      padding,
      diffBarY + barHeight + 20
    );

    ctx.fillText(
      `Next level: ${timeNextLevel}s`,
      padding,
      diffBarY + barHeight + 40
    );

    // Draw ammo counter
    if (state.player.activeWeapon) {
      const weaponName = state.player.activeWeapon.stats.name;
      const currentAmmo = state.player.ammo.get(weaponName) || 0;

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "24px monospace";
      ctx.textAlign = "right";
      ctx.fillText(
        `${currentAmmo} / ∞`, // ∞ symbol indicates unlimited ammo
        canvas.width - padding,
        canvas.height - padding
      );

      // Show weapon name
      ctx.font = "16px monospace";
      ctx.fillText(
        weaponName.toUpperCase(),
        canvas.width - padding,
        canvas.height - padding - 30
      );
    }

    // Draw score and wave
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px monospace";
    ctx.textAlign = "right";
    ctx.fillText(
      `Score: ${state.ui.score}`,
      canvas.width - padding,
      padding + 20
    );

    ctx.fillText(
      `Wave: ${state.ui.waveNumber}`,
      canvas.width - padding,
      padding + 40
    );

    // Display auto-aim status
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `Auto-aim: ${state.autoAimEnabled ? "ON" : "OFF"} (T to toggle)`,
      20,
      canvas.height - 20
    );
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
    const centerY = canvas.height / 2;

    // Semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Game over title
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "48px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (state.ui.isGameOver) {
      ctx.fillText("MISSION COMPLETE", centerX, centerY - 50);
      ctx.font = "24px monospace";
      ctx.fillText("You escaped the alien planet", centerX, centerY);
    } else {
      ctx.fillText("GAME OVER", centerX, centerY - 50);
      ctx.font = "24px monospace";
      ctx.fillText("You were overwhelmed by the aliens", centerX, centerY);
    }

    // Stats
    ctx.font = "20px monospace";
    ctx.fillText(`Score: ${state.ui.score}`, centerX, centerY + 50);
    ctx.fillText(
      `Waves Survived: ${state.ui.waveNumber}`,
      centerX,
      centerY + 80
    );

    // Restart prompt
    ctx.font = "16px monospace";
    ctx.fillText("Refresh the page to play again", centerX, centerY + 150);
  }
}
