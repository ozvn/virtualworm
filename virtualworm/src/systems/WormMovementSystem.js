import { BOUNDS, WORM, FOOD, ANIMATION, SPEED } from '../constants/GameConstants';

export class WormMovementSystem {
  constructor(engine) {
    this.engine = engine;
    this.currentSpeed = WORM.BASE_SPEED; // Başlangıç hızı
    this.justReachedTarget = false; // Mavi hedefe yeni ulaşıldı mı?
  }

  // Rastgele hedef belirle
  pickRandomTarget(currentPos, prevTarget = null) {
    let tx, ty, dist;
    let tries = 0;
    do {
      tx = Math.random() * (BOUNDS.MAX_X - BOUNDS.MIN_X - 80) + BOUNDS.MIN_X + 40;
      ty = Math.random() * (BOUNDS.MAX_Y - BOUNDS.MIN_Y - 80) + BOUNDS.MIN_Y + 40;
      dist = Math.hypot(tx - currentPos.x, ty - currentPos.y);
      tries++;
    } while (
      ((dist < 60 || tx < BOUNDS.MIN_X + 40 || tx > BOUNDS.MAX_X - 40 || ty < BOUNDS.MIN_Y + 40 || ty > BOUNDS.MAX_Y - 40)
      || (prevTarget && Math.abs(tx - prevTarget.x) < 2 && Math.abs(ty - prevTarget.y) < 2))
      && tries < 20
    );
    return { x: tx, y: ty };
  }

  // Hedef seçimi - algı alanı içindeki besinleri öncelikle
  selectTarget(worm, foods, target, isPlacingToxic, selectedToxicArea) {
    const foodsInRange = foods.filter(f => Math.hypot(f.x - worm.x, f.y - worm.y) <= WORM.SENSE_RADIUS);
    
    // Toksik sıvı bırakma modunda mı?
    if (isPlacingToxic && selectedToxicArea) {
      return selectedToxicArea;
    } else if (foodsInRange.length > 0) {
      // Algı alanındaki en yakın besin
      let minDist = Infinity;
      let closest = null;
      for (let f of foodsInRange) {
        let d = Math.hypot(f.x - worm.x, f.y - worm.y);
        if (d < minDist) {
          minDist = d;
          closest = f;
        }
      }
      return closest;
    } else if (target) {
      // Besin yoksa her zaman mavi hedefe git
      return target;
    }
    
    return null;
  }

  // Hedef kontrolü ve güncelleme
  checkTargetReached(worm, currentTarget, foods, isPlacingToxic, selectedToxicArea, onTargetReached, target) {
    const distToTarget = Math.hypot(worm.x - currentTarget.x, worm.y - currentTarget.y);

    // --- HARD CODE: Mavi hedefin hitbox'ı ile solucan çakışıyorsa, yeni hedef ata ---
    if (target && currentTarget === target && distToTarget < WORM.SIZE) {
      onTargetReached('random');
      this.justReachedTarget = true;
      return;
    }
    // ---

    if (isPlacingToxic && selectedToxicArea && distToTarget < 60) {
      onTargetReached('toxic');
    } else if (foods.some(f => f === currentTarget) && distToTarget < FOOD.SIZE) {
      onTargetReached('food', currentTarget);
      this.justReachedTarget = false;
    } else if (target && currentTarget === target && distToTarget < WORM.SIZE && !this.justReachedTarget) {
      // (Ekstra güvenlik için, flag ile tekrar tetiklenmesin)
      onTargetReached('random');
      this.justReachedTarget = true;
    } else if (!target || currentTarget !== target) {
      this.justReachedTarget = false;
    }
  }

  // Hareket hesaplama
  calculateMovement(worm, currentTarget, frame, wormAngle, speedMultiplier, isResting = false) {
    if (!currentTarget) return { nextPos: worm, direction: 'up', angle: wormAngle };
    
    // Hedefe giden vektör ve açı
    let dx = currentTarget.x - worm.x;
    let dy = currentTarget.y - worm.y;
    let dist = Math.hypot(dx, dy);
    if (dist === 0) dist = 1;
    dx /= dist;
    dy /= dist;
    let targetAngle = Math.atan2(dy, dx);
    
    // Daha belirgin ve yumuşak yay için sway ve offset artır
    const swayAngle = Math.sin(frame / ANIMATION.SWAY_PERIOD) * ANIMATION.SWAY_STRENGTH;
    const arcOffset = ANIMATION.ARC_OFFSET * Math.sin(frame / (ANIMATION.SWAY_PERIOD * 2));
    targetAngle += swayAngle + arcOffset;
    
    // Çok daha yumuşak açı geçişi
    let angle = wormAngle;
    let diff = targetAngle - angle;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    angle += diff * ANIMATION.ANGLE_SMOOTHING;
    
    // Hareket vektörü
    let moveX = Math.cos(angle);
    let moveY = Math.sin(angle);
    
    // Hedef hız
    let targetSpeed;
    if (isResting) {
      targetSpeed = WORM.BASE_SPEED * 0.25; // Dinlenirken %25 hız
    } else {
      targetSpeed = this.engine.speed * speedMultiplier;
    }
    if (Math.abs(moveX) > 0.1 && Math.abs(moveY) > 0.1) {
      targetSpeed = targetSpeed * SPEED.DIAGONAL_MULTIPLIER;
    }
    if (!Number.isFinite(targetSpeed)) targetSpeed = this.engine.speed;

    // İvme katsayısı (daha hızlı geçiş için 0.18)
    const ACCELERATION_FACTOR = 0.07; // Daha yumuşak ve yavaş ivmelenme
    this.currentSpeed += (targetSpeed - this.currentSpeed) * ACCELERATION_FACTOR;

    // Sensory inputlar: yeni vektör
    const sensoryInputs = [moveX, moveY, 1];
    let nextDirection = this.engine.getWormNextDirection(sensoryInputs);
    
    // Fallback: Eğer bu yön hedefe yaklaştırmıyorsa, açısal vektöre göre yön seç
    let fallbackDirection;
    if (Math.abs(moveX) > Math.abs(moveY)) {
      fallbackDirection = moveX > 0 ? 'right' : 'left';
    } else {
      fallbackDirection = moveY > 0 ? 'up' : 'down';
    }
    
    let testPos = this.engine.getNextPosition(worm, nextDirection, 1, BOUNDS, this.currentSpeed);
    let distNow = Math.hypot(currentTarget.x - worm.x, currentTarget.y - worm.y);
    let distTest = Math.hypot(currentTarget.x - testPos.x, currentTarget.y - testPos.y);
    if (distTest >= distNow) {
      nextDirection = fallbackDirection;
    }
    
    let nextPos = this.engine.getNextPosition(worm, nextDirection, 1/60, BOUNDS, this.currentSpeed);
    
    return { nextPos, direction: nextDirection, angle };
  }
} 