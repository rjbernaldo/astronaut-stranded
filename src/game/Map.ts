import seedrandom from "seedrandom";
import { Position, Tile } from "../types";

export class GameMap {
  tiles: Tile[][];
  tileSize: number;
  width: number;
  height: number;
  exitPosition: Position;

  constructor(seed: string) {
    this.tileSize = 32;
    this.width = Math.floor(20000 / this.tileSize); // 625 tiles
    this.height = Math.floor(20000 / this.tileSize); // 625 tiles
    this.tiles = this.generateMap(seed);
    this.exitPosition = { x: 0, y: 0 };
  }

  generateMap(seed: string): Tile[][] {
    const rng = seedrandom(seed);
    const map: Tile[][] = [];

    // Initialize map with all floor tiles - creating one big open area
    for (let y = 0; y < this.height; y++) {
      map[y] = [];
      for (let x = 0; x < this.width; x++) {
        map[y][x] = {
          type: "floor",
          explored: true, // Make all tiles visible immediately
        };
      }
    }

    // Place exit
    this.placeExit(map, rng);

    return map;
  }

  // This method is now empty since we don't want any walls
  generateWalls(map: Tile[][], rng: seedrandom.PRNG): void {
    // No walls to generate - empty method
  }

  // This method is now empty since we don't want any hazards
  generateHazards(map: Tile[][], rng: seedrandom.PRNG): void {
    // No hazards to generate - empty method
  }

  placeExit(map: Tile[][], rng: seedrandom.PRNG): void {
    // Place exit far from center (coordinates 0,0)
    const x = Math.floor(this.width * 0.8);
    const y = Math.floor(this.height * 0.8);
    map[y][x].type = "exit";
    this.exitPosition = {
      x: x * this.tileSize + this.tileSize / 2,
      y: y * this.tileSize + this.tileSize / 2,
    };
  }

  getTileAt(worldX: number, worldY: number): Tile | null {
    const tileX = Math.floor(worldX / this.tileSize);
    const tileY = Math.floor(worldY / this.tileSize);

    if (tileX >= 0 && tileX < this.width && tileY >= 0 && tileY < this.height) {
      return this.tiles[tileY][tileX];
    }

    return null;
  }

  isTileWalkable(worldX: number, worldY: number): boolean {
    const tile = this.getTileAt(worldX, worldY);
    return tile !== null && (tile.type === "floor" || tile.type === "exit");
  }

  isTileHazard(worldX: number, worldY: number): boolean {
    const tile = this.getTileAt(worldX, worldY);
    return tile !== null && tile.type === "hazard";
  }

  isTileExit(worldX: number, worldY: number): boolean {
    const tile = this.getTileAt(worldX, worldY);
    return tile !== null && tile.type === "exit";
  }

  setTileExplored(worldX: number, worldY: number, radius: number): void {
    // With all tiles already explored, this method doesn't need to do anything
    // But keeping it for compatibility with existing code
    const centerTileX = Math.floor(worldX / this.tileSize);
    const centerTileY = Math.floor(worldY / this.tileSize);
    const tileRadius = Math.ceil(radius / this.tileSize);

    for (let y = -tileRadius; y <= tileRadius; y++) {
      for (let x = -tileRadius; x <= tileRadius; x++) {
        const tileX = centerTileX + x;
        const tileY = centerTileY + y;

        if (
          tileX >= 0 &&
          tileX < this.width &&
          tileY >= 0 &&
          tileY < this.height
        ) {
          this.tiles[tileY][tileX].explored = true;
        }
      }
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    cameraPosition: Position,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    // Calculate visible tile range
    const startTileX = Math.max(
      0,
      Math.floor((cameraPosition.x - canvasWidth / 2) / this.tileSize)
    );
    const endTileX = Math.min(
      this.width - 1,
      Math.ceil((cameraPosition.x + canvasWidth / 2) / this.tileSize)
    );
    const startTileY = Math.max(
      0,
      Math.floor((cameraPosition.y - canvasHeight / 2) / this.tileSize)
    );
    const endTileY = Math.min(
      this.height - 1,
      Math.ceil((cameraPosition.y + canvasHeight / 2) / this.tileSize)
    );

    // Render visible tiles
    for (let y = startTileY; y <= endTileY; y++) {
      for (let x = startTileX; x <= endTileX; x++) {
        const worldX = x * this.tileSize;
        const worldY = y * this.tileSize;
        const screenX = worldX - cameraPosition.x + canvasWidth / 2;
        const screenY = worldY - cameraPosition.y + canvasHeight / 2;

        const tile = this.tiles[y][x];

        // Set tile color based on type
        switch (tile.type) {
          case "floor":
            ctx.fillStyle = "#1A1A1A"; // Dark gray floor
            break;
          case "wall":
            ctx.fillStyle = "#333333"; // Lighter gray wall
            break;
          case "hazard":
            ctx.fillStyle = "#336633"; // Dark green acid
            break;
          case "exit":
            ctx.fillStyle = "#4444AA"; // Blue-ish exit
            break;
        }

        // Draw tile
        ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

        // Add exit marker if this is the exit tile
        if (tile.type === "exit") {
          // Draw exit marker
          ctx.fillStyle = "rgba(100, 180, 255, 0.7)";
          ctx.beginPath();
          ctx.arc(
            screenX + this.tileSize / 2,
            screenY + this.tileSize / 2,
            this.tileSize / 3,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // Add a grid pattern overlay to help visually define the tiles
        ctx.strokeStyle = "rgba(50, 50, 50, 0.3)";
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);
      }
    }
  }
}
