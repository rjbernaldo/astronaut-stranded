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
    this.width = Math.floor(10000 / this.tileSize); // 312 tiles
    this.height = Math.floor(10000 / this.tileSize); // 312 tiles
    this.tiles = this.generateMap(seed);
    this.exitPosition = { x: 0, y: 0 };
  }

  generateMap(seed: string): Tile[][] {
    const rng = seedrandom(seed);
    const map: Tile[][] = [];

    // Initialize map with floor tiles
    for (let y = 0; y < this.height; y++) {
      map[y] = [];
      for (let x = 0; x < this.width; x++) {
        map[y][x] = {
          type: "floor",
          explored: false,
        };
      }
    }

    // Generate walls
    this.generateWalls(map, rng);

    // Generate hazards
    this.generateHazards(map, rng);

    // Place exit
    this.placeExit(map, rng);

    return map;
  }

  generateWalls(map: Tile[][], rng: seedrandom.PRNG): void {
    // Create some large wall structures
    for (let i = 0; i < 50; i++) {
      const startX = Math.floor(rng() * this.width);
      const startY = Math.floor(rng() * this.height);
      const size = 10 + Math.floor(rng() * 20);

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const mapX = (startX + x) % this.width;
          const mapY = (startY + y) % this.height;

          // Create hollow structures (only edges are walls)
          if (x === 0 || y === 0 || x === size - 1 || y === size - 1) {
            map[mapY][mapX].type = "wall";
          }
        }
      }
    }

    // Create some scattered walls
    for (let i = 0; i < this.width * this.height * 0.1; i++) {
      const x = Math.floor(rng() * this.width);
      const y = Math.floor(rng() * this.height);
      map[y][x].type = "wall";
    }
  }

  generateHazards(map: Tile[][], rng: seedrandom.PRNG): void {
    // Create acid pools
    for (let i = 0; i < 20; i++) {
      const centerX = Math.floor(rng() * this.width);
      const centerY = Math.floor(rng() * this.height);
      const radius = 3 + Math.floor(rng() * 5);

      for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
          const mapX = (centerX + x + this.width) % this.width;
          const mapY = (centerY + y + this.height) % this.height;

          // Create circular hazard pools
          const distance = Math.sqrt(x * x + y * y);
          if (
            distance < radius &&
            map[mapY][mapX].type === "floor" &&
            rng() < 0.7
          ) {
            map[mapY][mapX].type = "hazard";
          }
        }
      }
    }
  }

  placeExit(map: Tile[][], rng: seedrandom.PRNG): void {
    // Place exit far from center (coordinates 0,0)
    let attempts = 0;
    let placed = false;

    while (!placed && attempts < 100) {
      const x = Math.floor(rng() * this.width);
      const y = Math.floor(rng() * this.height);

      // Distance in tiles
      const distanceFromCenter = Math.sqrt(
        (x - this.width / 2) ** 2 + (y - this.height / 2) ** 2
      );

      // Make sure exit is far from center and on a floor tile
      if (distanceFromCenter > this.width / 3 && map[y][x].type === "floor") {
        map[y][x].type = "exit";
        this.exitPosition = {
          x: x * this.tileSize + this.tileSize / 2,
          y: y * this.tileSize + this.tileSize / 2,
        };
        placed = true;
      }

      attempts++;
    }

    // Fallback if exit placement failed
    if (!placed) {
      const x = Math.floor(this.width * 0.8);
      const y = Math.floor(this.height * 0.8);
      map[y][x].type = "exit";
      this.exitPosition = {
        x: x * this.tileSize + this.tileSize / 2,
        y: y * this.tileSize + this.tileSize / 2,
      };
    }
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
          const distance = Math.sqrt(x * x + y * y);
          if (distance <= tileRadius) {
            this.tiles[tileY][tileX].explored = true;
          }
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

        if (tile.explored) {
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

          // Add some visual details based on tile type
          if (tile.type === "wall") {
            // Add some grime texture to walls
            ctx.fillStyle = "rgba(30, 30, 30, 0.5)";
            ctx.fillRect(
              screenX + 2,
              screenY + 2,
              this.tileSize - 4,
              this.tileSize - 4
            );
          } else if (tile.type === "hazard") {
            // Add bubbling effect to acid
            for (let i = 0; i < 5; i++) {
              const bubbleX = screenX + Math.random() * this.tileSize;
              const bubbleY = screenY + Math.random() * this.tileSize;
              const bubbleSize = 1 + Math.random() * 3;

              ctx.fillStyle = "rgba(100, 255, 100, 0.7)";
              ctx.beginPath();
              ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
              ctx.fill();
            }
          } else if (tile.type === "exit") {
            // Draw exit marker
            ctx.fillStyle = "#AAAAFF";
            ctx.beginPath();
            ctx.arc(
              screenX + this.tileSize / 2,
              screenY + this.tileSize / 2,
              this.tileSize / 3,
              0,
              Math.PI * 2
            );
            ctx.fill();

            // Add an "E" label
            ctx.fillStyle = "#000000";
            ctx.font = "bold 16px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
              "E",
              screenX + this.tileSize / 2,
              screenY + this.tileSize / 2
            );
          }

          // Add grid lines for visibility
          ctx.strokeStyle = "rgba(50, 50, 50, 0.2)";
          ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);
        }
      }
    }
  }

  // Add a method to get wall positions for collision detection and line of sight
  getWalls(): Position[][] {
    const walls: Position[][] = [];

    // Convert tiles to wall polygons
    this.tiles.forEach((row, y) => {
      row.forEach((tile, x) => {
        // Skip non-wall tiles
        if (tile.type !== "wall") return;

        // Convert tile to world coordinates
        const tileX = x * this.tileSize;
        const tileY = y * this.tileSize;

        // Create a polygon for the wall (4 corners)
        const wallPolygon: Position[] = [
          { x: tileX, y: tileY }, // Top-left
          { x: tileX + this.tileSize, y: tileY }, // Top-right
          { x: tileX + this.tileSize, y: tileY + this.tileSize }, // Bottom-right
          { x: tileX, y: tileY + this.tileSize }, // Bottom-left
        ];

        walls.push(wallPolygon);
      });
    });

    return walls;
  }
}
