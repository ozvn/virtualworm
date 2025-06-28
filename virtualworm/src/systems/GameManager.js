import WormEngine from '../engine/WormEngine';
import { WormMovementSystem } from './WormMovementSystem';
import { EnemySystem } from './EnemySystem';
import { ToxicSubstanceSystem } from './ToxicSubstanceSystem';
import { FoodSystem } from './FoodSystem';
import { RestSystem } from './RestSystem';
import { SpeedSystem } from './SpeedSystem';
import { SCREEN, WORM, FOOD, TOXIC, ENEMY } from '../constants/GameConstants';

export class GameManager {
  constructor() {
    // Initialize all systems
    this.engine = new WormEngine();
    this.movementSystem = new WormMovementSystem(this.engine);
    this.enemySystem = new EnemySystem();
    this.toxicSystem = new ToxicSubstanceSystem();
    this.foodSystem = new FoodSystem();
    this.restSystem = new RestSystem();
    this.speedSystem = new SpeedSystem();
    
    // Game state
    this.worm = { x: SCREEN.WIDTH / 2, y: SCREEN.HEIGHT / 2, health: 100, hunger: 100 };
    this.target = null;
    this.direction = 'up';
    this.frame = 0;
    this.wormAngle = 0;
    this.currentTime = Date.now();
    this.lastTime = Date.now();
    
    // UI state
    this.placingFood = false;
    this.isPlacingToxic = false;
    this.selectedToxicArea = null;
    this.showDeveloperPanel = false;
  }

  // Initialize game
  initialize() {
    this.toxicAreas = this.toxicSystem.initializeToxicAreas();
    this.enemies = [];
    this.foods = [];
    this.foodSystem.setFoods(this.foods);
    
    // Set initial target
    if (!this.target) {
      this.target = this.movementSystem.pickRandomTarget(this.worm);
    }
  }

  // Main game loop update
  update() {
    const now = Date.now();
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.currentTime = now;
    this.frame++;

    // Açlık yavaşça azalsın
    this.worm.hunger = Math.max(0, this.worm.hunger - 2 * deltaTime); // saatte 2 birim

    // Açlık çok düşükse can yavaşça azalsın
    if (this.worm.hunger <= 0) {
      this.worm.health = Math.max(0, this.worm.health - 5 * deltaTime);
    }
    // Açlık yüksekse can yavaşça dolsun
    else if (this.worm.hunger > 60 && this.worm.health < 100) {
      this.worm.health = Math.min(100, this.worm.health + 3 * deltaTime);
    }

    // Update rest system
    const restStatus = this.restSystem.checkRestStatus(now);
    if (restStatus.restEnded) {
      // Rest ended, continue with normal speed
    }

    // Check if should start rest
    if (this.restSystem.shouldStartRest(now)) {
      this.restSystem.startRest(now);
      this.restSystem._nextCooldown = null;
    }

    // Update speed system
    const burstStatus = this.speedSystem.checkBurstStatus(now);
    if (burstStatus.burstEnded) {
      // Burst ended, start rest automatically
      this.restSystem.startRest(now);
      this.restSystem._nextCooldown = null;
    } else if (this.speedSystem.shouldChangeSpeed(now)) {
      this.speedSystem.changeSpeed();
    }

    // Apply rest speed if resting
    const restSpeedMultiplier = this.restSystem.getRestSpeedMultiplier();
    const finalSpeedMultiplier = this.speedSystem.applyRestSpeed(restSpeedMultiplier);

    // Update enemies
    const prevHealth = this.worm.health;
    this.enemies = this.enemySystem.updateEnemies(
      this.enemies, 
      this.worm, 
      this.toxicAreas, 
      now, 
      deltaTime,
      (enemyHit) => {
        // Düşman çarpışmasında can azalt
        this.worm.health = Math.max(0, this.worm.health - 10);
      }
    );
    if (this.worm.health !== prevHealth) {
      // Can değiştiyse bir şey yapılabilir (ileride animasyon vs.)
    }

    // Spawn enemies if needed
    if (this.enemySystem.shouldSpawnEnemy(this.toxicAreas, now)) {
      const newEnemy = this.enemySystem.spawnEnemy(this.worm, now);
      if (newEnemy) {
        this.enemies.push(newEnemy);
      }
    }

    // Update worm movement (her zaman çağrılmalı)
    this.updateWormMovement(finalSpeedMultiplier);
  }

  // Update worm movement
  updateWormMovement(speedMultiplier) {
    const currentTarget = this.movementSystem.selectTarget(
      this.worm, 
      this.foods, 
      this.target, 
      this.isPlacingToxic, 
      this.selectedToxicArea
    );

    if (!currentTarget) return;

    const isResting = this.restSystem.getRestState().isResting;
    const movement = this.movementSystem.calculateMovement(
      this.worm, 
      currentTarget, 
      this.frame, 
      this.wormAngle, 
      speedMultiplier,
      isResting
    );

    this.worm = movement.nextPos;
    this.direction = movement.direction;
    this.wormAngle = movement.angle;

    // Check if target reached
    this.movementSystem.checkTargetReached(
      this.worm, 
      currentTarget, 
      this.foods, 
      this.isPlacingToxic, 
      this.selectedToxicArea,
      (type, targetFood) => {
        this.handleTargetReached(type, targetFood);
      },
      this.target
    );
  }

  // Handle target reached
  handleTargetReached(type, targetFood) {
    switch (type) {
      case 'toxic':
        this.handleToxicPlacement();
        break;
      case 'food':
        this.foods = this.foodSystem.consumeFood(this.foods, targetFood);
        this.foodSystem.setFoods(this.foods);
        // Yemek yendiğinde açlık azalsın
        this.worm.hunger = Math.min(100, this.worm.hunger + 30);
        if (this.foods.length === 0) {
          this.target = this.movementSystem.pickRandomTarget(this.worm);
        }
        break;
      case 'random':
        // Mavi hedefe ulaşıldı, yeni hedef ata (eski hedefle aynı olmasın)
        this.target = this.movementSystem.pickRandomTarget(this.worm, this.target);
        break;
    }
  }

  // Handle toxic placement
  handleToxicPlacement() {
    this.toxicSystem.placeToxicSubstance(
      this.toxicAreas, 
      this.selectedToxicArea, 
      (updatedAreas) => {
        this.toxicAreas = updatedAreas;
        this.selectedToxicArea = null;
        this.isPlacingToxic = false;
      }
    );
  }

  // Place food
  placeFood(locationX, locationY) {
    this.foods = this.foodSystem.placeFood(locationX, locationY);
    this.foodSystem.setFoods(this.foods);
  }

  // Handle toxic area press
  handleToxicAreaPress(area) {
    const message = this.toxicSystem.getRenewalMessage(area, this.currentTime);
    
    if (message.canRenew) {
      this.selectedToxicArea = area;
      this.isPlacingToxic = true;
    }
    
    return message;
  }

  // Remove enemy
  removeEnemy(enemyId) {
    this.enemies = this.enemySystem.removeEnemy(this.enemies, enemyId);
  }

  // Developer functions
  resetToxicAreas() {
    this.toxicAreas = this.toxicSystem.resetToxicAreas();
  }

  fillToxicAreas() {
    this.toxicAreas = this.toxicSystem.fillAllToxicAreas();
  }

  fillToxicAreasTest() {
    this.toxicAreas = this.toxicSystem.fillToxicAreasForTest();
  }

  showToxicStatus() {
    return this.toxicSystem.formatToxicStatus(this.toxicAreas, this.currentTime);
  }

  // Get game state
  getGameState() {
    return {
      worm: this.worm,
      foods: this.foods,
      enemies: this.enemies,
      toxicAreas: this.toxicAreas,
      target: this.target,
      direction: this.direction,
      frame: this.frame,
      wormAngle: this.wormAngle,
      currentTime: this.currentTime,
      placingFood: this.placingFood,
      isPlacingToxic: this.isPlacingToxic,
      selectedToxicArea: this.selectedToxicArea,
      showDeveloperPanel: this.showDeveloperPanel,
      restState: this.restSystem.getRestState(),
      speedState: this.speedSystem.getSpeedState(),
      health: this.worm.health,
      hunger: this.worm.hunger
    };
  }

  // Set UI state
  setPlacingFood(placing) {
    this.placingFood = placing;
  }

  setShowDeveloperPanel(show) {
    this.showDeveloperPanel = show;
  }

  // Get UI state
  getPlacingFood() {
    return this.placingFood;
  }

  getShowDeveloperPanel() {
    return this.showDeveloperPanel;
  }

  getIsPlacingToxic() {
    return this.isPlacingToxic;
  }

  getSelectedToxicArea() {
    return this.selectedToxicArea;
  }

  // Get active toxic areas count
  getActiveToxicAreasCount() {
    return this.toxicSystem.getActiveToxicAreasCount(this.toxicAreas, this.currentTime);
  }

  // Düşman spawn kalan süresi (ms)
  getEnemySpawnRemaining() {
    return this.enemySystem.getEnemySpawnRemaining(this.currentTime);
  }
} 