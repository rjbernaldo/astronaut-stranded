import { Direction, Position, WeaponStats } from "../types";
import { Weapon } from "./Weapon";
import { INITIAL_WEAPON_STATS } from "../constants/weaponStats";

// Interface for tracking ejected bullet animations
interface EjectedBullet {
  timestamp: number;
  weaponName: string;
  progress: number; // 0 to 1 animation progress
  rotation: number; // Current rotation angle in degrees
  initialVelocity: { x: number; y: number }; // Initial velocity for arc trajectory
  position: { x: number; y: number }; // Current position
  bounced: boolean; // Has the bullet hit the edge of the canvas?
  opacity: number; // Opacity for fade out effect
  gravity: number; // Gravity effect
}

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
  ejectedBullets: EjectedBullet[]; // Track recently fired bullets for animation
  reloadStartTime: number | null; // Track when reload started
  movementVector: { x: number; y: number };
  walkingTime: number;

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
    this.speed = 75; // Increased from 50 to 75 for faster movement
    this.activeWeapon = null;
    this.weapons = new Map();
    this.reloading = false;
    this.lastFireTime = 0;
    this.ejectedBullets = []; // Initialize empty array for ejected bullets
    this.reloadStartTime = null;
    this.movementVector = { x: 0, y: 0 };
    this.walkingTime = 0;

    // Initialize default weapons if no custom weapon provided
    if (!initialWeaponStats) {
      this.addWeapon("pistol", {
        name: "pistol",
        ...INITIAL_WEAPON_STATS,
        projectileSpeed: 10,
        reserveAmmo: Infinity,
        ammoCapacity: INITIAL_WEAPON_STATS.magazineSize,
      });

      this.addWeapon("rifle", {
        name: "rifle",
        ...INITIAL_WEAPON_STATS,
        damage: INITIAL_WEAPON_STATS.damage * 1.5,
        range: INITIAL_WEAPON_STATS.range * 1.4,
        magazineSize: 30,
        fireRate: 0.1,
        projectileSpeed: 15,
        projectileCount: INITIAL_WEAPON_STATS.projectileCount * 2,
        reserveAmmo: Infinity,
        ammoCapacity: 30,
      });

      this.addWeapon("shotgun", {
        name: "shotgun",
        ...INITIAL_WEAPON_STATS,
        damage: INITIAL_WEAPON_STATS.damage * 0.8,
        range: INITIAL_WEAPON_STATS.range * 0.6,
        magazineSize: 6,
        fireRate: 1.0,
        projectileCount: 5,
        projectileSpeed: 8,
        pierce: INITIAL_WEAPON_STATS.pierce * 2.5,
        reserveAmmo: Infinity,
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

    if (currentAmmo <= 0) {
      // Auto reload when out of ammo
      this.reload();
      return false;
    }

    if (this.reloading) return false;

    // Check fire rate
    const elapsedTime = (timestamp - this.lastFireTime) / 1000;
    if (elapsedTime < this.activeWeapon.stats.fireRate) return false;

    // Update ammo count
    this.ammo.set(weaponName, currentAmmo - 1);
    this.lastFireTime = timestamp;

    // Add ejected bullet animation with random initial velocity
    // This creates a slightly different arc each time
    // Use a fixed angle towards top-right (315 degrees) with less variance
    const randomAngle = 315 + (Math.random() * 15 - 7.5); // Top-right = 315 degrees with less variance
    const radians = (randomAngle * Math.PI) / 180;
    const speed = 6 + Math.random() * 3; // Much higher initial speed for stronger ejection

    this.ejectedBullets.push({
      timestamp,
      weaponName,
      progress: 0,
      rotation: Math.random() * 360, // Random initial rotation
      initialVelocity: {
        x: Math.cos(radians) * speed,
        y: Math.sin(radians) * speed,
      },
      position: {
        x: 0,
        y: 0,
      },
      bounced: false,
      opacity: 1.0,
      gravity: 0.5 + Math.random() * 0.2, // Significantly increased gravity for more realistic physics
    });

    // Apply a small random rotation effect (simulating recoil)
    this.rotation += (Math.random() * 2 - 1) * 0.4;

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
    this.reloadStartTime = performance.now();

    // Start reload (will be completed after reload time)
    setTimeout(() => {
      // Always fill the magazine completely - unlimited ammo reserves
      this.ammo.set(weaponName, this.activeWeapon!.stats.magazineSize);
      this.reloading = false;
      this.reloadStartTime = null; // Reset reload start time
    }, this.activeWeapon.stats.reloadTime * 1000);

    return true;
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }

  update(deltaTime: number): void {
    // If there's no active weapon, exit early
    if (!this.activeWeapon) return;

    // Check if we need to reload automatically (when magazine is empty)
    const currentAmmo = this.ammo.get(this.activeWeapon.stats.name) || 0;
    if (currentAmmo === 0 && !this.reloading && this.activeWeapon) {
      this.reload();
    }

    // Handle reloading progress
    if (this.reloading && this.activeWeapon && this.reloadStartTime !== null) {
      const reloadTime = this.activeWeapon.stats.reloadTime * 1000; // Convert to ms
      const currentTime = performance.now();
      const elapsedTime = currentTime - this.reloadStartTime;

      if (elapsedTime >= reloadTime) {
        // Reload complete
        const weaponName = this.activeWeapon.stats.name;
        const magazineSize = this.activeWeapon.stats.magazineSize;

        this.ammo.set(weaponName, magazineSize);
        this.reloading = false;
        this.reloadStartTime = null; // Reset reload start time
      }
    }

    // Handle ejected bullet animation
    this.updateEjectedBullets(deltaTime);

    // Update movement vector based on direction
    if (this.movementVector.x !== 0 || this.movementVector.y !== 0) {
      // Normalize the vector for consistent speed in all directions
      const length = Math.sqrt(
        this.movementVector.x * this.movementVector.x +
          this.movementVector.y * this.movementVector.y
      );
      this.movementVector.x /= length;
      this.movementVector.y /= length;

      // Apply the speed
      this.movementVector.x *= this.speed;
      this.movementVector.y *= this.speed;

      // Update position
      this.position.x += this.movementVector.x * deltaTime;
      this.position.y += this.movementVector.y * deltaTime;

      // Reset movement vector
      this.movementVector.x = 0;
      this.movementVector.y = 0;
    }

    // Movement-based animation
    if (this.movementVector.x !== 0 || this.movementVector.y !== 0) {
      this.walkingTime += deltaTime;
    } else {
      // Reset walking animation when stationary
      this.walkingTime = 0;
    }
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

  // Get ejected bullets for animation
  getEjectedBullets(): EjectedBullet[] {
    return this.ejectedBullets;
  }

  updateEjectedBullets(deltaTime: number): void {
    // Update ejected bullet animations
    for (let i = this.ejectedBullets.length - 1; i >= 0; i--) {
      const bullet = this.ejectedBullets[i];

      // Update animation progress (animations last 2 seconds - longer for physics simulation)
      bullet.progress += deltaTime / 2.0;

      // Update rotation (spin effect) - we'll let the rotation continue until it's set to 90 in the rendering code
      // This ensures bullets can rotate freely until they hit the ground
      if (bullet.rotation !== 90) {
        bullet.rotation += deltaTime * 720; // 720 degrees per second = 2 full rotations/second
      }

      // Apply physics - calculate new position based on velocity and gravity
      bullet.initialVelocity.y += bullet.gravity * deltaTime * 15; // Increased gravity effect

      // Update position - each bullet has its own independent position
      bullet.position.x += bullet.initialVelocity.x * deltaTime * 60;
      bullet.position.y += bullet.initialVelocity.y * deltaTime * 60;

      // Gradually fade out the bullet
      if (bullet.progress > 0.7) {
        bullet.opacity = Math.max(0, 1 - (bullet.progress - 0.7) / 0.3);
      }

      // Remove completed animations
      if (bullet.progress >= 1) {
        this.ejectedBullets.splice(i, 1);
      }
    }
  }
}
