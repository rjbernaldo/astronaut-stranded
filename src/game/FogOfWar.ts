import { Position } from "../types";
import { GameMap } from "./Map";

export class FogOfWar {
  private fogCanvas: HTMLCanvasElement;
  private fogCtx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    // Create a separate canvas for fog of war
    this.fogCanvas = document.createElement("canvas");
    this.fogCanvas.width = width;
    this.fogCanvas.height = height;
    this.fogCtx = this.fogCanvas.getContext("2d")!;
  }

  update(playerPosition: Position, lightRadius: number, map: GameMap): void {
    // Update explored tiles based on player's light radius
    map.setTileExplored(playerPosition.x, playerPosition.y, lightRadius);
  }

  render(
    ctx: CanvasRenderingContext2D,
    playerPosition: Position,
    lightRadius: number,
    cameraPosition: Position
  ): void {
    // Clear fog canvas
    this.fogCtx.fillStyle = "rgba(0, 0, 0, 0.9)";
    this.fogCtx.fillRect(0, 0, this.width, this.height);

    // Calculate player position on screen
    const screenX = playerPosition.x - cameraPosition.x + this.width / 2;
    const screenY = playerPosition.y - cameraPosition.y + this.height / 2;

    // Clear fog around player (light radius)
    this.fogCtx.globalCompositeOperation = "destination-out";

    // Create a gradient for the light falloff
    const gradient = this.fogCtx.createRadialGradient(
      screenX,
      screenY,
      0,
      screenX,
      screenY,
      lightRadius
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
    gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.8)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    this.fogCtx.fillStyle = gradient;
    this.fogCtx.beginPath();
    this.fogCtx.arc(screenX, screenY, lightRadius, 0, Math.PI * 2);
    this.fogCtx.fill();

    // Add some flickering to the light (randomize the intensity slightly)
    const flickerSize = lightRadius * (0.95 + Math.random() * 0.1);
    const flickerOpacity = 0.7 + Math.random() * 0.3;

    this.fogCtx.fillStyle = `rgba(0, 0, 0, ${flickerOpacity})`;
    this.fogCtx.beginPath();
    this.fogCtx.arc(screenX, screenY, flickerSize, 0, Math.PI * 2);
    this.fogCtx.fill();

    // Reset composite operation
    this.fogCtx.globalCompositeOperation = "source-over";

    // Add a subtle light beam in the direction the player is facing
    // (This would need rotation information from the player)

    // Render the fog to the main canvas
    ctx.drawImage(this.fogCanvas, 0, 0);

    // Add a subtle vignette effect
    this.renderVignette(ctx);

    // Add film grain
    this.renderFilmGrain(ctx);
  }

  private renderVignette(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      this.height * 0.5,
      this.width / 2,
      this.height / 2,
      this.height
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private renderFilmGrain(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";

    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const size = Math.random() * 2;

      if (Math.random() > 0.5) {
        ctx.fillRect(x, y, size, size);
      }
    }
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.fogCanvas.width = width;
    this.fogCanvas.height = height;
  }
}
