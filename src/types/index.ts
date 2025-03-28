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
  magazineSize: number;
  reserveAmmo: number;
  fireRate: number; // in seconds
  reloadTime: number; // in seconds
  recoil: number; // in degrees
  projectileCount: number; // 1 for single shot, more for shotgun
  spread: number; // in degrees
}

export type EnemyType = "Scout" | "Brute" | "Spitter";

export interface EnemyStats {
  type: EnemyType;
  health: number;
  speed: number;
  attackRange: number;
  attackDamage: number;
  attackSpeed: number; // in seconds
}
