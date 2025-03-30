export interface Position {
  x: number;
  y: number;
}

export type Direction = "up" | "down" | "left" | "right";

export interface Tile {
  type: "floor" | "wall" | "hazard" | "exit";
  explored: boolean;
}

export interface ProjectileOptions {
  position: Position;
  velocity: Position;
  damage: number;
  range: number;
  speed: number;
}

export interface WeaponStats {
  name: string;
  damage: number;
  fireRate: number;
  accuracy: number;
  range: number;
  projectileSpeed: number;
  projectileSize: number;
  knockback: number;
  ammoCapacity: number;
  reloadTime: number;
  magazineSize: number;
  reserveAmmo: number;
  projectileCount: number;
  spread: number;
  recoil: number;
  // Add more properties as needed
}

export type EnemyType = "Scout" | "Brute" | "Spitter";

export interface EnemyStats {
  health: number;
  speed: number;
  damage: number;
  attackRange: number;
  attackSpeed: number;
  scoreValue: number;
  // Add more properties as needed
}

export interface GameState {
  // Player state
  player: any; // Will be the Astronaut instance

  // Camera position
  cameraPosition: Position;

  // Entities
  enemies: any[]; // Will be Enemy instances
  projectiles: any[]; // Will be Projectile instances

  // Map
  map: any; // Will be GameMap instance

  // Input state
  keysPressed: Set<string>;
  mousePosition: Position;
  mouseDown: boolean;

  // Game state
  isPaused: boolean;

  // Auto-aim
  autoAimEnabled: boolean;

  // Weapon stats
  currentWeaponStats: WeaponStats | null;

  // UI state
  ui: {
    score: number;
    waveNumber: number;
    difficultyLevel: number;
    gameTime: number;
    nextLevelTime: number;
    isGameOver: boolean;
  };

  // Enemy spawning
  lastEnemySpawnTime: number;
  enemySpawnInterval: number;
  enemySpawnCount: number;
}

export interface UIState {
  score: number;
  waveNumber: number;
  difficultyLevel: number;
  gameTime: number;
  nextLevelTime: number;
  isGameOver: boolean;
}
