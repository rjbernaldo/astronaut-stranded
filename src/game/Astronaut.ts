import { Direction, Position, WeaponStats } from "../types";
import { Weapon } from "./Weapon";

export class Astronaut {
  position: Position;
  health: number;
  ammo: Map<string, number>;
  reserves: Map<string, number>;
  lightRadius: number;
  rotation: number;
  speed: number;
  activeWeapon: Weapon | null;
  weapons: Map<string, Weapon>;
  reloading: boolean;
  lastFireTime: number;

  constructor(
    startPosition: Position,
    initialWeaponStats?: WeaponStats | null
  ) {
    this.position = startPosition;
    this.health = 100;
    this.ammo = new Map();
    this.reserves = new Map();
    this.lightRadius = 450; // Fixed high visibility radius
    this.rotation = 0;
    this.speed = 50;
    this.activeWeapon = null;
    this.weapons = new Map();
    this.reloading = false;
    this.lastFireTime = 0;

    // Initialize default weapons if no custom weapon provided
    if (!initialWeaponStats) {
      this.addWeapon("pistol", {
        name: "pistol",
        damage: 10,
        magazineSize: 7,
        reserveAmmo: Infinity, // Unlimited ammo reserves
        fireRate: 0.5,
        reloadTime: 2,
        recoil: 5,
        projectileCount: 1,
        spread: 0,
        accuracy: 95,
        range: 500,
        projectileSpeed: 10,
        projectileSize: 3,
        knockback: 2,
        ammoCapacity: 7,
      });

      this.addWeapon("rifle", {
        name: "rifle",
        damage: 15,
        magazineSize: 30,
        reserveAmmo: Infinity, // Unlimited ammo reserves
        fireRate: 0.1,
        reloadTime: 3,
        recoil: 3,
        projectileCount: 1,
        spread: 3,
        accuracy: 85,
        range: 700,
        projectileSpeed: 15,
        projectileSize: 2,
        knockback: 1,
        ammoCapacity: 30,
      });

      this.addWeapon("shotgun", {
        name: "shotgun",
        damage: 8,
        magazineSize: 6,
        reserveAmmo: Infinity, // Unlimited ammo reserves
        fireRate: 1,
        reloadTime: 0.8,
        recoil: 10,
        projectileCount: 5,
        spread: 15,
        accuracy: 70,
        range: 300,
        projectileSpeed: 8,
        projectileSize: 4,
        knockback: 5,
        ammoCapacity: 6,
      });

      // Set pistol as active weapon
      this.switchWeapon("pistol");
    } else {
      // Initialize with custom weapon and set unlimited reserves
      const modifiedStats = {
        ...initialWeaponStats,
        reserveAmmo: Infinity, // Ensure unlimited ammo for custom weapons too
      };
      this.addWeapon(modifiedStats.name, modifiedStats);
      this.switchWeapon(modifiedStats.name);
    }
  }

  addWeapon(name: string, stats: WeaponStats): void {
    const weapon = new Weapon(stats);
    this.weapons.set(name, weapon);
    this.ammo.set(name, stats.magazineSize);
    this.reserves.set(name, stats.reserveAmmo);
  }

  switchWeapon(name: string): void {
    if (this.weapons.has(name)) {
      this.activeWeapon = this.weapons.get(name) || null;
    }
  }

  move(direction: Direction, deltaTime: number): void {
    const movementDistance = this.speed * deltaTime;

    switch (direction) {
      case "up":
        this.position.y -= movementDistance;
        break;
      case "down":
        this.position.y += movementDistance;
        break;
      case "left":
        this.position.x -= movementDistance;
        break;
      case "right":
        this.position.x += movementDistance;
        break;
    }
  }

  setRotation(angle: number): void {
    this.rotation = angle;
  }

  shoot(timestamp: number): boolean {
    if (!this.activeWeapon) return false;

    const weaponName = this.activeWeapon.stats.name;
    const currentAmmo = this.ammo.get(weaponName) || 0;

    if (currentAmmo <= 0 || this.reloading) return false;

    // Check fire rate
    const elapsedTime = (timestamp - this.lastFireTime) / 1000;
    if (elapsedTime < this.activeWeapon.stats.fireRate) return false;

    // Update ammo count
    this.ammo.set(weaponName, currentAmmo - 1);
    this.lastFireTime = timestamp;

    // Apply recoil
    this.rotation += (Math.random() * 2 - 1) * this.activeWeapon.stats.recoil;

    return true;
  }

  reload(): boolean {
    if (!this.activeWeapon || this.reloading) return false;

    const weaponName = this.activeWeapon.stats.name;
    const currentAmmo = this.ammo.get(weaponName) || 0;

    // Only check if the magazine is already full
    if (currentAmmo === this.activeWeapon.stats.magazineSize) {
      return false;
    }

    this.reloading = true;

    // Start reload (will be completed after reload time)
    setTimeout(() => {
      // Always fill the magazine completely - unlimited ammo reserves
      this.ammo.set(weaponName, this.activeWeapon!.stats.magazineSize);
      this.reloading = false;
    }, this.activeWeapon.stats.reloadTime * 1000);

    return true;
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }

  update(deltaTime: number, timestamp: number): void {
    // Empty update - removed flashlight functionality
  }

  updateWeapon(stats: WeaponStats): void {
    // Replace the existing weapon with the new stats
    if (stats.name && this.weapons.has(stats.name)) {
      // Create a new weapon with updated stats
      this.addWeapon(stats.name, stats);
      // Make sure it's the active weapon
      this.switchWeapon(stats.name);
    }
  }
}
