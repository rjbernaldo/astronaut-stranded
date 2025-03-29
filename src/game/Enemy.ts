import { EnemyStats, EnemyType, Position } from "../types";

export class Enemy {
  position: Position;
  health: number;
  speed: number;
  attackRange: number;
  attackDamage: number;
  attackSpeed: number;
  type: EnemyType;
  active: boolean;
  lastAttackTime: number;
  velocity: Position;
  pathTimer: number;
  lastKnownPlayerPos: Position;
  huntingMode: "direct" | "flanking" | "ambush";
  targetVelocity: Position;
  smoothingFactor: number;
  movementHistory: Position[];
  level: number;

  constructor(position: Position, stats: EnemyStats) {
    this.position = { ...position };
    this.health = stats.health;
    this.speed = stats.speed;
    this.attackRange = stats.attackRange;
    this.attackDamage = stats.attackDamage;
    this.attackSpeed = stats.attackSpeed;
    this.type = stats.type;
    this.active = true;
    this.lastAttackTime = 0;
    this.velocity = { x: 0, y: 0 };
    this.targetVelocity = { x: 0, y: 0 };
    this.smoothingFactor = 0.2; // Lower = smoother movement
    this.pathTimer = 0;
    this.lastKnownPlayerPos = { x: 0, y: 0 };
    this.movementHistory = []; // Store recent positions to detect stalling
    this.level = stats.level;

    // Assign hunting behavior based on enemy type
    if (this.type === "Scout") {
      this.huntingMode = "direct"; // Scouts go straight for the player
      this.smoothingFactor = 0.3; // More responsive
    } else if (this.type === "Brute") {
      this.huntingMode = "direct"; // Brutes charge directly
      this.smoothingFactor = 0.15; // Slower turns
    } else {
      this.huntingMode = "direct"; // Spitters now directly follow player instead of flanking
      this.smoothingFactor = 0.2; // Medium response for smooth movement
    }
  }

  update(deltaTime: number, playerPosition: Position, timestamp: number): void {
    if (!this.active) return;

    this.pathTimer += deltaTime;

    // Save player's last known position
    this.lastKnownPlayerPos = { ...playerPosition };

    // Calculate direction to player
    const dx = playerPosition.x - this.position.x;
    const dy = playerPosition.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Update targetVelocity based on hunting mode
    if (this.huntingMode === "direct") {
      // Direct approach - go straight for the player
      if (distance > 0) {
        this.targetVelocity = {
          x: (dx / distance) * this.speed,
          y: (dy / distance) * this.speed,
        };
      }
    } else if (this.huntingMode === "flanking") {
      // Flanking behavior - try to circle around to player's side
      // Update direction less frequently to prevent jerky movement
      if (this.pathTimer > 3) {
        this.pathTimer = 0;

        // Add perpendicular component to create circling motion
        const perpX = -dy / Math.max(distance, 1); // Perpendicular to the direction to player
        const perpY = dx / Math.max(distance, 1);

        // Weighted combination of direct approach and perpendicular movement
        this.targetVelocity = {
          x:
            (dx / Math.max(distance, 1)) * 0.7 * this.speed +
            perpX * 0.3 * this.speed,
          y:
            (dy / Math.max(distance, 1)) * 0.7 * this.speed +
            perpY * 0.3 * this.speed,
        };
      }
    } else if (this.huntingMode === "ambush") {
      // Ambush behavior - move less predictably but still smoothly
      if (this.pathTimer > 2) {
        this.pathTimer = 0;

        // Occasionally change direction to be less predictable
        const angle = Math.random() * Math.PI * 2;
        this.targetVelocity = {
          x:
            Math.cos(angle) * this.speed * 0.4 +
            (dx / Math.max(distance, 1)) * this.speed * 0.6,
          y:
            Math.sin(angle) * this.speed * 0.4 +
            (dy / Math.max(distance, 1)) * this.speed * 0.6,
        };
      }
    }

    // For Spitters, maintain optimal distance
    if (this.type === "Spitter") {
      // Remove backing away behavior - instead always approach
      if (distance > this.attackRange * 0.9) {
        // Just a slight speed boost if far from attack range
        this.targetVelocity.x *= 1.1;
        this.targetVelocity.y *= 1.1;
      }
    }

    // Smooth velocity transition (LERP)
    this.velocity.x +=
      (this.targetVelocity.x - this.velocity.x) * this.smoothingFactor;
    this.velocity.y +=
      (this.targetVelocity.y - this.velocity.y) * this.smoothingFactor;

    // Increase speed temporarily when player is far away (catch-up mechanic)
    if (distance > 300) {
      // Use smoother acceleration curve
      const speedMultiplier = 1 + Math.min(0.8, (distance - 300) / 1200);
      this.velocity.x *= speedMultiplier;
      this.velocity.y *= speedMultiplier;
    }

    // Store previous position to detect if we're stuck
    if (this.movementHistory.length >= 5) {
      this.movementHistory.shift(); // Remove oldest position
    }
    this.movementHistory.push({ ...this.position });

    // Check if we're stuck in one place
    if (this.movementHistory.length >= 5) {
      let stuckInPlace = true;
      const latestPos = this.movementHistory[this.movementHistory.length - 1];

      // Check if we've moved significantly in the last 5 frames
      for (let i = 0; i < this.movementHistory.length - 1; i++) {
        const pos = this.movementHistory[i];
        const moveDistance = Math.sqrt(
          Math.pow(latestPos.x - pos.x, 2) + Math.pow(latestPos.y - pos.y, 2)
        );

        // If we've moved more than a tiny amount, we're not stuck
        if (moveDistance > 1.0) {
          // Increased the threshold for stuck detection
          stuckInPlace = false;
          break;
        }
      }

      // If stuck, add a gentle random velocity component to break free
      if (stuckInPlace) {
        const escapeAngle = Math.random() * Math.PI * 2;
        this.velocity.x += Math.cos(escapeAngle) * this.speed * 0.3;
        this.velocity.y += Math.sin(escapeAngle) * this.speed * 0.3;
      }
    }

    // Move enemy
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Enemies of the same type should avoid clustering but less randomness
    this.avoidClustering(deltaTime);
  }

  // Helper method to make enemies avoid grouping up too much
  private avoidClustering(deltaTime: number): void {
    // This would normally check against other enemies,
    // but for simplicity, we'll just add occasional small movement
    // to create some separation behavior - reduced randomness

    if (Math.random() < 0.01) {
      // Further reduced jitter frequency
      const jitterAngle = Math.random() * Math.PI * 2;
      const jitterForce = this.speed * 0.1; // Further reduced jitter magnitude

      this.velocity.x += Math.cos(jitterAngle) * jitterForce * deltaTime;
      this.velocity.y += Math.sin(jitterAngle) * jitterForce * deltaTime;
    }
  }

  canAttack(timestamp: number): boolean {
    return timestamp - this.lastAttackTime >= this.attackSpeed * 1000;
  }

  attack(timestamp: number): number {
    this.lastAttackTime = timestamp;
    return this.attackDamage;
  }

  takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D, cameraOffset: Position): void {
    if (!this.active) return;

    // Adjust position based on camera offset
    const screenX = this.position.x - cameraOffset.x + ctx.canvas.width / 2;
    const screenY = this.position.y - cameraOffset.y + ctx.canvas.height / 2;

    // Set colors based on enemy type
    let color: string;
    let size: number;

    switch (this.type) {
      case "Scout":
        color = "#4CAF50"; // Green for Scout
        size = 15;
        break;
      case "Brute":
        color = "#F44336"; // Red for Brute
        size = 25;
        break;
      case "Spitter":
        color = "#9C27B0"; // Purple for Spitter
        size = 20;
        break;
      default:
        color = "#FFFFFF";
        size = 15;
    }

    // Draw enemy body
    ctx.fillStyle = color;
    ctx.beginPath();

    // Create xenomorph-like shape
    if (this.type === "Scout") {
      this.drawScout(ctx, screenX, screenY, size);
    } else if (this.type === "Brute") {
      this.drawBrute(ctx, screenX, screenY, size);
    } else if (this.type === "Spitter") {
      this.drawSpitter(ctx, screenX, screenY, size);
    } else {
      ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
    }

    ctx.fill();

    // Draw enemy name and level
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      `${this.type} Lvl ${this.level}`,
      screenX,
      screenY - size - 15
    );

    // Draw health indicator
    const healthPercent = this.health / this.getMaxHealth();
    ctx.fillStyle = `rgba(${255 - healthPercent * 255}, ${
      healthPercent * 255
    }, 0, 0.7)`;
    ctx.fillRect(screenX - 10, screenY - size - 10, 20 * healthPercent, 5);

    // Draw direction indicator (shows where the enemy is moving)
    const moveDir = Math.atan2(this.velocity.y, this.velocity.x);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(
      screenX + Math.cos(moveDir) * (size / 2 + 5),
      screenY + Math.sin(moveDir) * (size / 2 + 5)
    );
    ctx.stroke();
  }

  private drawScout(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ): void {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Elongated head
    ctx.beginPath();
    ctx.ellipse(x, y - size, size / 2, size, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawBrute(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ): void {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Broad shoulders
    ctx.beginPath();
    ctx.ellipse(x, y, size * 1.5, size * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawSpitter(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ): void {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Acid-spitting mouth
    ctx.beginPath();
    ctx.arc(x, y + size / 2, size / 4, 0, Math.PI * 2);
    ctx.fillStyle = "#AEFF00"; // Acid green
    ctx.fill();
  }

  private getMaxHealth(): number {
    switch (this.type) {
      case "Scout":
        return 20;
      case "Brute":
        return 50;
      case "Spitter":
        return 30;
      default:
        return 20;
    }
  }
}
