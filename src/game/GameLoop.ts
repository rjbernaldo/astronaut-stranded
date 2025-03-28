import { Astronaut } from "./Astronaut";
import { Enemy } from "./Enemy";
import { GameMap } from "./Map";
import { Projectile } from "./Projectile";
import { Position, EnemyStats } from "../types";
import seedrandom from "seedrandom";

export interface GameState {
  isGameOver: boolean;
  hasWon: boolean;
  score: number;
  waveNumber: number;
  timeElapsed: number;
}

export class GameLoop {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastTime: number = 0;
  private keysPressed: Set<string> = new Set();
  private mousePosition: Position = { x: 0, y: 0 };
  private mouseDown: boolean = false;

  private astronaut: Astronaut;
  private map: GameMap;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private cameraPosition: Position = { x: 0, y: 0 };
  private rng: seedrandom.PRNG;

  private lastEnemySpawnTime: number = 0;
  private enemySpawnInterval: number = 5000; // ms
  private enemySpawnCount: number = 5;

  private gameState: GameState = {
    isGameOver: false,
    hasWon: false,
    score: 0,
    waveNumber: 1,
    timeElapsed: 0,
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
    this.astronaut = new Astronaut({ x: startX, y: startY });

    // Set camera to player position
    this.cameraPosition = { ...this.astronaut.position };

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener("keydown", (e) => {
      this.keysPressed.add(e.key.toLowerCase());

      // Reload on 'r' press
      if (e.key.toLowerCase() === "r") {
        this.astronaut.reload();
      }

      // Weapon switching
      if (e.key === "1") {
        this.astronaut.switchWeapon("pistol");
      } else if (e.key === "2") {
        this.astronaut.switchWeapon("rifle");
      } else if (e.key === "3") {
        this.astronaut.switchWeapon("shotgun");
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
    this.gameState.timeElapsed += deltaTime;

    // Handle player input
    this.handleInput(deltaTime, timestamp);

    // Update player
    this.astronaut.update(deltaTime, timestamp);

    // Check if player is on hazard tile
    if (
      this.map.isTileHazard(
        this.astronaut.position.x,
        this.astronaut.position.y
      )
    ) {
      this.astronaut.takeDamage(10 * deltaTime); // Damage over time
    }

    // Check if player reached the exit
    if (
      this.map.isTileExit(this.astronaut.position.x, this.astronaut.position.y)
    ) {
      this.gameState.hasWon = true;
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
      this.astronaut.position.x,
      this.astronaut.position.y,
      this.astronaut.lightRadius
    );

    // Update camera position (follow player)
    this.cameraPosition = {
      x: this.astronaut.position.x,
      y: this.astronaut.position.y,
    };

    // Check game over condition
    if (this.astronaut.health <= 0) {
      this.gameState.isGameOver = true;
    }
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
    let nextX = this.astronaut.position.x;
    let nextY = this.astronaut.position.y;
    const movementDistance = this.astronaut.speed * deltaTime;

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
      this.astronaut.move(direction, deltaTime);
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
    this.astronaut.setRotation(angle);
  }

  private shoot(timestamp: number): void {
    if (!this.astronaut.activeWeapon) return;

    const didShoot = this.astronaut.shoot(timestamp);

    if (didShoot) {
      // Create projectiles
      const newProjectiles = this.astronaut.activeWeapon.createProjectiles(
        { ...this.astronaut.position },
        this.astronaut.rotation
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
    // Create a reference to the map walls for enemy line of sight
    const walls = this.map.getWalls();

    // Update each enemy
    this.enemies.forEach((enemy) => {
      enemy.update(deltaTime, this.astronaut.position, timestamp, walls);

      // Check for collision with player
      const distanceToPlayer = Math.sqrt(
        Math.pow(this.astronaut.position.x - enemy.position.x, 2) +
          Math.pow(this.astronaut.position.y - enemy.position.y, 2)
      );

      // If enemy touches player and can attack, deal damage
      if (distanceToPlayer < enemy.attackRange && enemy.canAttack(timestamp)) {
        const damage = enemy.attack(timestamp);
        this.astronaut.takeDamage(damage);
      }

      // Check for collision with walls
      this.handleEnemyWallCollisions(enemy);
    });

    // Filter out inactive enemies
    this.enemies = this.enemies.filter((enemy) => enemy.active);
  }

  private handleEnemyWallCollisions(enemy: Enemy): void {
    const walls = this.map.getWalls();
    const enemyRadius =
      enemy.type === "Brute" ? 25 : enemy.type === "Spitter" ? 20 : 15;

    for (const wall of walls) {
      // For each wall segment, check for collision
      for (let i = 0; i < wall.length; i++) {
        const p1 = wall[i];
        const p2 = wall[(i + 1) % wall.length];

        // Calculate the closest point on the line segment to the enemy
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) continue; // Skip if line segment has zero length

        // Normalize the direction vector
        const nx = dx / length;
        const ny = dy / length;

        // Calculate the projection of the vector from p1 to enemy onto the line segment
        const projectionLength =
          (enemy.position.x - p1.x) * nx + (enemy.position.y - p1.y) * ny;

        // Clamp the projection to the line segment
        const clampedProjection = Math.max(
          0,
          Math.min(length, projectionLength)
        );

        // Calculate the closest point on the line segment
        const closestX = p1.x + clampedProjection * nx;
        const closestY = p1.y + clampedProjection * ny;

        // Calculate the distance from the enemy to the closest point
        const distanceX = enemy.position.x - closestX;
        const distanceY = enemy.position.y - closestY;
        const distance = Math.sqrt(
          distanceX * distanceX + distanceY * distanceY
        );

        // If the enemy is colliding with the wall, push it away
        if (distance < enemyRadius) {
          // Calculate the push direction
          const pushDistance = enemyRadius - distance;

          if (distance > 0) {
            const pushX = (distanceX / distance) * pushDistance;
            const pushY = (distanceY / distance) * pushDistance;

            // Push the enemy away from the wall
            enemy.position.x += pushX;
            enemy.position.y += pushY;
          } else {
            // If the distance is zero, push in a random direction
            const angle = Math.random() * Math.PI * 2;
            enemy.position.x += Math.cos(angle) * enemyRadius;
            enemy.position.y += Math.sin(angle) * enemyRadius;
          }
        }
      }
    }
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

    // Spawn enemies
    for (let i = 0; i < this.enemySpawnCount; i++) {
      // Spawn outside player's view but not too far
      const angle = this.rng() * Math.PI * 2;
      const distance = 300 + this.rng() * 200; // Just outside light radius

      const spawnX = this.astronaut.position.x + Math.cos(angle) * distance;
      const spawnY = this.astronaut.position.y + Math.sin(angle) * distance;

      // Skip if spawn position is a wall
      if (!this.map.isTileWalkable(spawnX, spawnY)) continue;

      // Determine enemy type based on wave number
      let enemyType: "Scout" | "Brute" | "Spitter";
      const typeRoll = this.rng();

      if (this.gameState.waveNumber < 3) {
        enemyType = "Scout"; // Only scouts in early waves
      } else if (this.gameState.waveNumber < 5) {
        enemyType = typeRoll < 0.7 ? "Scout" : "Spitter";
      } else {
        if (typeRoll < 0.6) {
          enemyType = "Scout";
        } else if (typeRoll < 0.9) {
          enemyType = "Spitter";
        } else {
          enemyType = "Brute";
        }
      }

      // Create enemy stats based on type
      let stats: EnemyStats;

      switch (enemyType) {
        case "Scout":
          stats = {
            type: "Scout",
            health: 20,
            speed: 2.5, // Increased speed to hunt better
            attackRange: 20,
            attackDamage: 10,
            attackSpeed: 1,
          };
          break;
        case "Brute":
          stats = {
            type: "Brute",
            health: 50,
            speed: 1.5, // Increased speed to hunt better
            attackRange: 25,
            attackDamage: 20,
            attackSpeed: 2,
          };
          break;
        case "Spitter":
          stats = {
            type: "Spitter",
            health: 30,
            speed: 2, // Increased speed to hunt better
            attackRange: 100, // Ranged attack
            attackDamage: 5,
            attackSpeed: 1.5,
          };
          break;
      }

      // Create and add enemy
      const enemy = new Enemy({ x: spawnX, y: spawnY }, stats);
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
    const radians = (this.astronaut.rotation * Math.PI) / 180;
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

    const healthPercent = this.astronaut.health / 100;
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
      `Health: ${Math.floor(this.astronaut.health)}`,
      padding + 10,
      padding + 15
    );

    // Draw ammo counter
    if (this.astronaut.activeWeapon) {
      const weaponName = this.astronaut.activeWeapon.stats.name;
      const currentAmmo = this.astronaut.ammo.get(weaponName) || 0;
      const reserveAmmo = this.astronaut.reserves.get(weaponName) || 0;

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
    const playerX = x + this.astronaut.position.x / mapRatio;
    const playerY = y + this.astronaut.position.y / mapRatio;

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

    if (this.gameState.hasWon) {
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
}
