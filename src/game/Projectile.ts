import { Position, ProjectileOptions } from "../types";

export class Projectile {
  position: Position;
  velocity: Position;
  damage: number;
  range: number;
  distanceTraveled: number;
  active: boolean;
  speed: number;

  constructor(options: ProjectileOptions) {
    this.position = { ...options.position };
    this.velocity = { ...options.velocity };
    this.damage = options.damage;
    this.range = options.range;
    this.distanceTraveled = 0;
    this.active = true;
    this.speed = options.speed * 2.5;
  }

  update(deltaTime: number): void {
    // Update position based on velocity and speed
    const moveX = this.velocity.x * this.speed * deltaTime;
    const moveY = this.velocity.y * this.speed * deltaTime;

    this.position.x += moveX;
    this.position.y += moveY;

    // Track distance traveled
    this.distanceTraveled += Math.sqrt(moveX * moveX + moveY * moveY);

    // Check if projectile has reached its maximum range
    if (this.distanceTraveled >= this.range) {
      this.active = false;
    }
  }

  deactivate(): void {
    this.active = false;
  }

  render(ctx: CanvasRenderingContext2D, screenPosition?: Position): void {
    if (!this.active) return;

    // Use provided screen position or default to world position
    const renderX = screenPosition ? screenPosition.x : this.position.x;
    const renderY = screenPosition ? screenPosition.y : this.position.y;

    // Draw projectile
    ctx.fillStyle = "#FFEE44";
    ctx.beginPath();
    ctx.arc(renderX, renderY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Add tracer effect
    const tracerLength = 15;
    const tracer = ctx.createLinearGradient(
      renderX,
      renderY,
      renderX - (this.velocity.x * tracerLength) / this.speed,
      renderY - (this.velocity.y * tracerLength) / this.speed
    );
    tracer.addColorStop(0, "rgba(255, 238, 68, 1)");
    tracer.addColorStop(1, "rgba(255, 238, 68, 0)");

    ctx.strokeStyle = tracer;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(renderX, renderY);
    ctx.lineTo(
      renderX - (this.velocity.x * tracerLength) / this.speed,
      renderY - (this.velocity.y * tracerLength) / this.speed
    );
    ctx.stroke();
  }
}
