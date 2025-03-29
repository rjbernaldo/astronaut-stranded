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
  level: number;

  constructor(position: Position, stats: EnemyStats, playerPosition: Position) {
    this.position = { ...position };
    this.health = stats.health;
    this.speed = stats.speed;
    this.attackRange = stats.attackRange;
    this.attackDamage = stats.attackDamage;
    this.attackSpeed = stats.attackSpeed;
    this.type = stats.type;
    this.active = true;
    this.lastAttackTime = 0;
    this.level = stats.level;

    // Initialize with velocity toward player
    const dx = playerPosition.x - this.position.x;
    const dy = playerPosition.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const directionX = dx / distance;
      const directionY = dy / distance;
      this.velocity = {
        x: directionX * this.speed,
        y: directionY * this.speed,
      };
    } else {
      this.velocity = { x: 0, y: 0 };
    }
  }

  update(deltaTime: number, playerPosition: Position, timestamp: number): void {
    if (!this.active) return;

    // Simple straight-line movement toward player
    const dx = playerPosition.x - this.position.x;
    const dy = playerPosition.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Only update direction if there's a distance to travel
    if (distance > 0) {
      // Normalize direction vector and multiply by speed
      const directionX = dx / distance;
      const directionY = dy / distance;

      // Set velocity directly - no smoothing or complex logic
      this.velocity = {
        x: directionX * this.speed,
        y: directionY * this.speed,
      };
    }

    // Update position based on velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Track last attack time for attack cooldown
    this.lastAttackTime = Math.min(timestamp, this.lastAttackTime);
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
