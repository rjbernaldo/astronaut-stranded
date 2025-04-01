import {
  Position,
  WeaponStats,
  EnemyStats,
  GameState as GameUIState,
  Direction,
  WeaponType,
} from "../types";
import { Astronaut } from "../game/Astronaut";
import { Enemy } from "../game/Enemy";
import { Projectile } from "../game/Projectile";
import { GameMap } from "../game/Map";
import seedrandom from "seedrandom";

// Constants
const DIFFICULTY_SCALING_INTERVAL = 60; // Seconds between difficulty increases
const INITIAL_DIFFICULTY = 1;

// Action types
export enum ActionType {
  MOVE_PLAYER = "MOVE_PLAYER",
  SHOOT = "SHOOT",
  RELOAD = "RELOAD",
  SWITCH_WEAPON = "SWITCH_WEAPON",
  TOGGLE_AUTO_AIM = "TOGGLE_AUTO_AIM",
  UPDATE_WEAPON_STATS = "UPDATE_WEAPON_STATS",
  TAKE_DAMAGE = "TAKE_DAMAGE",
  UPDATE_ENTITIES = "UPDATE_ENTITIES",
  AUTO_AIM_AND_SHOOT = "AUTO_AIM_AND_SHOOT",
  LEVEL_UP = "LEVEL_UP",
}

// Action interfaces
export interface Action {
  type: ActionType;
  payload?: any;
}

export interface MovePlayerAction extends Action {
  type: ActionType.MOVE_PLAYER;
  payload: {
    direction: Direction;
    deltaTime: number;
  };
}

export interface ShootAction extends Action {
  type: ActionType.SHOOT;
  payload: {
    timestamp: number;
  };
}

export interface ReloadAction extends Action {
  type: ActionType.RELOAD;
}

export interface SwitchWeaponAction extends Action {
  type: ActionType.SWITCH_WEAPON;
  payload: {
    weaponType: WeaponType;
  };
}

export interface ToggleAutoAimAction extends Action {
  type: ActionType.TOGGLE_AUTO_AIM;
}

export interface UpdateWeaponStatsAction extends Action {
  type: ActionType.UPDATE_WEAPON_STATS;
  payload: {
    stats: WeaponStats;
  };
}

export interface TakeDamageAction extends Action {
  type: ActionType.TAKE_DAMAGE;
  payload: {
    amount: number;
  };
}

export interface UpdateEntitiesAction extends Action {
  type: ActionType.UPDATE_ENTITIES;
  payload: {
    deltaTime: number;
    timestamp: number;
  };
}

export interface AutoAimAndShootAction extends Action {
  type: ActionType.AUTO_AIM_AND_SHOOT;
  payload: {
    timestamp: number;
  };
}

// Complete state interface
export interface GameStateData {
  player: Astronaut;
  enemies: Enemy[];
  projectiles: Projectile[];
  map: GameMap;
  rng: seedrandom.PRNG;
  cameraPosition: Position;
  lastEnemySpawnTime: number;
  enemySpawnInterval: number;
  enemySpawnCount: number;
  ui: GameUIState;
  isPaused: boolean;
  autoAimEnabled: boolean;
  mousePosition: Position;
  mouseDown: boolean;
  keysPressed: Set<string>;
  currentWeaponStats: WeaponStats | null;
  notifications: Notification[];
}

// Add this interface for notifications
export interface Notification {
  message: string;
  color: string;
  startTime: number;
  duration: number; // in milliseconds
}

/**
 * Central game state manager that holds all game data
 * and provides methods to dispatch actions
 */
export class CentralGameState {
  private state: GameStateData;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: { [key: string]: Function[] } = {};

  constructor(
    canvas: HTMLCanvasElement,
    seed?: string,
    initialWeaponStats?: WeaponStats | null
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;

    // Initialize random number generator
    seed = seed || Math.random().toString();
    const rng = seedrandom(seed);

    // Create map
    const map = new GameMap(seed);

    // Create player in the center of the map
    const startX = Math.floor(map.width / 2) * map.tileSize;
    const startY = Math.floor(map.height / 2) * map.tileSize;
    const player = new Astronaut({ x: startX, y: startY }, initialWeaponStats);

    // Initial state
    this.state = {
      player,
      enemies: [],
      projectiles: [],
      map,
      rng,
      cameraPosition: { ...player.position },
      lastEnemySpawnTime: 0,
      enemySpawnInterval: 5000, // ms
      enemySpawnCount: 5,
      ui: {
        score: 0,
        isGameOver: false,
        waveNumber: 1,
        difficultyLevel: INITIAL_DIFFICULTY,
        gameTime: 0,
        nextLevelTime: DIFFICULTY_SCALING_INTERVAL,
        playerLevel: 1,
        playerXp: 0,
        xpForNextLevel: 100, // Base XP needed for level 2
        kills: 0,
        statsHistory: [],
      },
      isPaused: false,
      autoAimEnabled: true,
      mousePosition: { x: 0, y: 0 },
      mouseDown: false,
      keysPressed: new Set<string>(),
      currentWeaponStats: initialWeaponStats || null,
      notifications: [],
    };
  }

  // Getters
  getState(): GameStateData {
    return this.state;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  // Action creators
  movePlayer(direction: Direction, deltaTime: number): void {
    this.dispatch({
      type: ActionType.MOVE_PLAYER,
      payload: { direction, deltaTime },
    });
  }

  shoot(timestamp: number): void {
    this.dispatch({
      type: ActionType.SHOOT,
      payload: { timestamp },
    });
  }

  reload(): void {
    this.dispatch({
      type: ActionType.RELOAD,
    });
  }

  switchWeapon(weaponType: WeaponType): void {
    this.dispatch({
      type: ActionType.SWITCH_WEAPON,
      payload: { weaponType },
    });
  }

  toggleAutoAim(): void {
    this.dispatch({
      type: ActionType.TOGGLE_AUTO_AIM,
    });
  }

  updateWeapon(stats: WeaponStats): void {
    this.dispatch({
      type: ActionType.UPDATE_WEAPON_STATS,
      payload: { stats },
    });
  }

  takeDamage(amount: number): void {
    this.dispatch({
      type: ActionType.TAKE_DAMAGE,
      payload: { amount },
    });
  }

  updateEntities(deltaTime: number, timestamp: number): void {
    this.dispatch({
      type: ActionType.UPDATE_ENTITIES,
      payload: { deltaTime, timestamp },
    });
  }

  autoAimAndShoot(timestamp: number): void {
    this.dispatch({
      type: ActionType.AUTO_AIM_AND_SHOOT,
      payload: { timestamp },
    });
  }

  // Dispatcher
  private dispatch(action: Action): void {
    try {
      // Apply the action to update state
      this.state = this.reducer(this.state, action);

      // Notify subscribers
      if (this.callbacks[action.type]) {
        this.callbacks[action.type].forEach((callback) => {
          try {
            callback(this.state);
          } catch (error) {
            console.error(
              `Error in callback for action type ${action.type}:`,
              error
            );
          }
        });
      }

      // Always notify global subscribers
      if (this.callbacks["*"]) {
        this.callbacks["*"].forEach((callback) => {
          try {
            callback(this.state);
          } catch (error) {
            console.error(`Error in global callback:`, error);
          }
        });
      }
    } catch (error) {
      console.error(`Error dispatching action ${action.type}:`, error);
    }
  }

  // Subscribe to state changes
  subscribe(actionType: ActionType | "*", callback: Function): () => void {
    if (!this.callbacks[actionType]) {
      this.callbacks[actionType] = [];
    }

    this.callbacks[actionType].push(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks[actionType] = this.callbacks[actionType].filter(
        (cb) => cb !== callback
      );
    };
  }

  // Main reducer function
  private reducer(state: GameStateData, action: Action): GameStateData {
    switch (action.type) {
      case ActionType.MOVE_PLAYER:
        return this.handleMovePlayer(state, action as MovePlayerAction);

      case ActionType.SHOOT:
        return this.handleShoot(state, action as ShootAction);

      case ActionType.RELOAD:
        return this.handleReload(state, action as ReloadAction);

      case ActionType.SWITCH_WEAPON:
        return this.handleSwitchWeapon(state, action as SwitchWeaponAction);

      case ActionType.TOGGLE_AUTO_AIM:
        return {
          ...state,
          autoAimEnabled: !state.autoAimEnabled,
        };

      case ActionType.UPDATE_WEAPON_STATS:
        return this.handleUpdateWeapon(
          state,
          action as UpdateWeaponStatsAction
        );

      case ActionType.TAKE_DAMAGE:
        return this.handleTakeDamage(state, action as TakeDamageAction);

      case ActionType.UPDATE_ENTITIES:
        return this.handleUpdateEntities(state, action as UpdateEntitiesAction);

      case ActionType.AUTO_AIM_AND_SHOOT:
        return this.handleAutoAimAndShoot(
          state,
          action as AutoAimAndShootAction
        );

      case ActionType.LEVEL_UP:
        return this.handleLevelUp(state);

      default:
        return state;
    }
  }

  // Reducers for specific actions
  private handleMovePlayer(
    state: GameStateData,
    action: MovePlayerAction
  ): GameStateData {
    const { direction, deltaTime } = action.payload;

    // Calculate next position
    let nextX = state.player.position.x;
    let nextY = state.player.position.y;
    const movementDistance = state.player.speed * deltaTime;

    switch (direction) {
      case "up":
        nextY -= movementDistance;
        break;
      case "down":
        nextY += movementDistance;
        break;
      case "left":
        nextX -= movementDistance;
        break;
      case "right":
        nextX += movementDistance;
        break;
    }

    // Check collision with walls
    if (state.map.isTileWalkable(nextX, nextY)) {
      // Create a new player with updated position
      const player = state.player;
      player.move(direction, deltaTime);

      // Update camera position to follow player
      return {
        ...state,
        player,
        cameraPosition: { ...player.position },
      };
    }

    return state;
  }

  private handleShoot(
    state: GameStateData,
    action: ShootAction
  ): GameStateData {
    const { timestamp } = action.payload;

    if (!state.player.activeWeapon) return state;

    const didShoot = state.player.shoot(timestamp);

    if (didShoot) {
      // Create projectiles
      const newProjectiles = state.player.activeWeapon.createProjectiles(
        { ...state.player.position },
        state.player.rotation
      );

      // Add to projectiles array
      return {
        ...state,
        projectiles: [...state.projectiles, ...newProjectiles],
      };
    }

    return state;
  }

  private handleReload(
    state: GameStateData,
    action: ReloadAction
  ): GameStateData {
    state.player.reload();
    return state;
  }

  private handleSwitchWeapon(
    state: GameStateData,
    action: SwitchWeaponAction
  ): GameStateData {
    const { weaponType } = action.payload;
    state.player.switchWeapon(weaponType);
    return state;
  }

  private handleUpdateWeapon(
    state: GameStateData,
    action: UpdateWeaponStatsAction
  ): GameStateData {
    const { stats } = action.payload;
    state.player.updateWeapon(stats);
    return {
      ...state,
      currentWeaponStats: stats,
    };
  }

  private handleTakeDamage(
    state: GameStateData,
    action: TakeDamageAction
  ): GameStateData {
    const { amount } = action.payload;
    state.player.takeDamage(amount);

    // Check game over condition
    const isGameOver = state.player.health <= 0;

    return {
      ...state,
      ui: {
        ...state.ui,
        isGameOver: isGameOver || state.ui.isGameOver,
      },
    };
  }

  private handleUpdateEntities(
    state: GameStateData,
    action: UpdateEntitiesAction
  ): GameStateData {
    const { deltaTime, timestamp } = action.payload;
    const newState = { ...state };

    // Update player
    state.player.update(deltaTime);

    // Update projectiles
    const updatedProjectiles = this.updateProjectiles(state, deltaTime);

    // Update enemies
    const updatedEnemies = this.updateEnemies(state, deltaTime, timestamp);

    // Update game UI state
    const updatedUI = this.updateUIState(state.ui, deltaTime);

    return {
      ...state,
      projectiles: updatedProjectiles,
      enemies: updatedEnemies,
      ui: updatedUI,
    };
  }

  private updateProjectiles(
    state: GameStateData,
    deltaTime: number
  ): Projectile[] {
    // Update each projectile
    for (const projectile of state.projectiles) {
      projectile.update(deltaTime);

      // Check collision with walls
      if (
        !state.map.isTileWalkable(projectile.position.x, projectile.position.y)
      ) {
        projectile.deactivate();
        continue;
      }

      // Flag to track if projectile hit an enemy this frame
      let hitEnemyThisFrame = false;

      // Check collision with enemies
      for (const enemy of state.enemies) {
        if (!enemy.active) continue;

        const dx = enemy.position.x - projectile.position.x;
        const dy = enemy.position.y - projectile.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Simple circular collision
        if (distance < 15) {
          // Enemy radius
          // Deal damage to enemy
          enemy.takeDamage(projectile.damage);

          // Mark that we hit an enemy this frame
          hitEnemyThisFrame = true;

          // Reduce pierce count
          projectile.pierce--;

          // Only deactivate if pierce count is 0 or less
          if (projectile.pierce <= 0) {
            projectile.deactivate();
          }

          // Add score and XP for hit
          if (!enemy.active) {
            const scoreValue = enemy.getScoreValue();
            // Add score
            state.ui.score += scoreValue;

            // Add XP (same as score for now)
            state.ui.playerXp += scoreValue;

            // Check for level up
            this.checkForLevelUp(state.ui);
          }

          // If projectile is deactivated or we've hit an enemy this frame, stop checking more enemies
          // This ensures a projectile only hits one enemy per frame
          if (!projectile.active || hitEnemyThisFrame) {
            break;
          }
        }
      }
    }

    // Remove inactive projectiles
    return state.projectiles.filter((p) => p.active);
  }

  private updateEnemies(
    state: GameStateData,
    deltaTime: number,
    timestamp: number
  ): Enemy[] {
    // Update each enemy
    for (const enemy of state.enemies) {
      if (!enemy.active) continue;

      // Pass player position so enemies can follow
      enemy.update(deltaTime, state.player.position, timestamp);

      // Check for attack range
      const dx = state.player.position.x - enemy.position.x;
      const dy = state.player.position.y - enemy.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < enemy.attackRange && enemy.canAttack(timestamp)) {
        const damage = enemy.attack(timestamp);
        state.player.takeDamage(damage);
      }
    }

    // Remove dead enemies
    return state.enemies.filter((e) => e.active);
  }

  private updateUIState(ui: GameUIState, deltaTime: number): GameUIState {
    // Update game time
    const gameTime = ui.gameTime + deltaTime;

    // Update time until next difficulty level
    let nextLevelTime = ui.nextLevelTime - deltaTime;
    let difficultyLevel = ui.difficultyLevel;

    // Check if it's time to increase difficulty
    if (nextLevelTime <= 0) {
      difficultyLevel += 1;
      nextLevelTime = DIFFICULTY_SCALING_INTERVAL;
    }

    return {
      ...ui,
      gameTime,
      nextLevelTime,
      difficultyLevel,
    };
  }

  private handleAutoAimAndShoot(
    state: GameStateData,
    action: AutoAimAndShootAction
  ): GameStateData {
    const { timestamp } = action.payload;

    // Skip if auto-aim is disabled
    if (!state.autoAimEnabled) return state;

    if (!state.player.activeWeapon || state.enemies.length === 0) return state;

    // Get the weapon's range
    const weaponRange = state.player.activeWeapon.stats.range || 500;

    // Find the closest enemy within range
    let closestEnemy: Enemy | null = null;
    let closestDistance = weaponRange;

    for (const enemy of state.enemies) {
      if (!enemy.active) continue;

      const dx = enemy.position.x - state.player.position.x;
      const dy = enemy.position.y - state.player.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }

    // If we found an enemy within range, aim and shoot at it
    if (closestEnemy) {
      // Calculate direction from player to enemy
      const dx = closestEnemy.position.x - state.player.position.x;
      const dy = closestEnemy.position.y - state.player.position.y;

      // Calculate angle in radians, then convert to degrees
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      // Set player rotation to aim at the enemy
      state.player.setRotation(angle);

      // Use the shoot action
      return this.handleShoot(state, {
        type: ActionType.SHOOT,
        payload: { timestamp },
      });
    }

    return state;
  }

  /**
   * Check if player has enough XP to level up
   * Uses a 50% increase for level requirements
   */
  private checkForLevelUp(ui: GameUIState): void {
    while (ui.playerXp >= ui.xpForNextLevel) {
      // Level up!
      ui.playerLevel++;

      // Subtract the XP used for this level
      ui.playerXp -= ui.xpForNextLevel;

      // Calculate new XP requirement with 50% increase
      ui.xpForNextLevel = Math.round(ui.xpForNextLevel * 1.5);

      // Apply level-up bonuses to player
      this.applyLevelUpBonuses(ui.playerLevel);
    }
  }

  /**
   * Apply bonuses to player based on their level
   */
  private applyLevelUpBonuses(level: number): void {
    const state = this.getState();

    // Improve player stats with each level
    // Speed bonus: +1% per level
    state.player.speed = state.player.speed * (1 + 0.01 * level);

    // Weapons get stronger with level
    if (state.player.activeWeapon) {
      const weaponName = state.player.activeWeapon.stats.name;

      // Get all weapons and improve their stats
      state.player.weapons.forEach((weapon, name) => {
        const stats = { ...weapon.stats };

        // Damage: +5% per level
        stats.damage *= 1 + 0.05 * level;

        // Fire rate: -2% cooldown per level (faster firing)
        stats.fireRate *= 1 - 0.02 * level;
        stats.fireRate = Math.max(0.05, stats.fireRate); // Cap to prevent too fast firing

        // Reload time: -3% per level (faster reloading)
        stats.reloadTime *= 1 - 0.03 * level;

        // Pierce: +10% per level (more penetration)
        stats.pierce *= 1 + 0.1 * level;

        // Update the weapon with new stats
        state.player.updateWeapon(stats);
      });
    }

    console.log(`Level Up! You are now level ${level}`);
  }

  // Add this method to create notifications
  addNotification(
    message: string,
    color: string = "#FFFFFF",
    duration: number = 3000
  ): void {
    const notification: Notification = {
      message,
      color,
      startTime: performance.now(),
      duration,
    };

    this.state.notifications.push(notification);
  }

  private handleLevelUp(state: GameStateData): GameStateData {
    // Implement level up logic
    return state;
  }
}
