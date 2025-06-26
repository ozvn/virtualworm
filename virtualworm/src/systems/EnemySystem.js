import { SCREEN, ENEMY, WORM, TOXIC } from '../constants/GameConstants';

export class EnemySystem {
  constructor() {
    this.lastSpawnTime = Date.now();
  }

  // Düşman spawn sistemi
  spawnEnemy(worm, currentTime) {
    if (currentTime - this.lastSpawnTime < ENEMY.SPAWN_INTERVAL) return null;
    
    // Rastgele kenardan spawn
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
      case 0: // üst
        x = Math.random() * SCREEN.WIDTH;
        y = -ENEMY.SIZE;
        break;
      case 1: // sağ
        x = SCREEN.WIDTH + ENEMY.SIZE;
        y = Math.random() * (SCREEN.HEIGHT - SCREEN.MENU_BAR_HEIGHT);
        break;
      case 2: // alt
        x = Math.random() * SCREEN.WIDTH;
        y = SCREEN.HEIGHT - SCREEN.MENU_BAR_HEIGHT + ENEMY.SIZE;
        break;
      case 3: // sol
        x = -ENEMY.SIZE;
        y = Math.random() * (SCREEN.HEIGHT - SCREEN.MENU_BAR_HEIGHT);
        break;
    }
    
    const enemy = {
      id: Date.now() + Math.random(),
      x,
      y,
      targetX: worm.x,
      targetY: worm.y,
      speed: ENEMY.BASE_SPEED
    };
    
    this.lastSpawnTime = currentTime;
    return enemy;
  }

  // Düşmanın toksik sıvı alanına yakın olup olmadığını kontrol et
  isEnemyNearToxicArea(enemy, toxicAreas, currentTime) {
    return toxicAreas.some(area => {
      if (!area.hasToxic) return false;
      const elapsed = currentTime - area.startTime;
      const remaining = area.remainingTime - elapsed;
      if (remaining <= 0) return false; // Süresi bitmiş alanlar koruma sağlamaz
      
      const dist = Math.hypot(enemy.x - area.x, enemy.y - area.y);
      return dist < TOXIC.PROTECTION_RADIUS;
    });
  }

  // Düşman hareketi
  updateEnemies(enemies, worm, toxicAreas, currentTime, deltaTime) {
    return enemies.map(enemy => {
      // Toksik sıvı alanına yakınsa düşmanı yok et
      if (this.isEnemyNearToxicArea(enemy, toxicAreas, currentTime)) {
        return null; // null döndür, filter ile silinecek
      }
      
      // Worm'a doğru hareket
      const dx = enemy.targetX - enemy.x;
      const dy = enemy.targetY - enemy.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist > 0) {
        const speed = enemy.speed * deltaTime;
        const moveX = (dx / dist) * speed;
        const moveY = (dy / dist) * speed;
        
        return {
          ...enemy,
          x: enemy.x + moveX,
          y: enemy.y + moveY,
          targetX: worm.x, // Hedefi güncelle
          targetY: worm.y
        };
      }
      return enemy;
    }).filter(enemy => {
      // Null olan düşmanları sil (toksik sıvı tarafından yok edilenler)
      if (!enemy) return false;
      
      // Worm ile çarpışma kontrolü
      const distToWorm = Math.hypot(enemy.x - worm.x, enemy.y - worm.y);
      if (distToWorm < WORM.SIZE + ENEMY.SIZE) {
        // Çarpışma! Düşmanı sil
        return false;
      }
      
      // Ekran dışına çıkan düşmanları sil
      return enemy.x > -50 && enemy.x < SCREEN.WIDTH + 50 && 
             enemy.y > -50 && enemy.y < SCREEN.HEIGHT - SCREEN.MENU_BAR_HEIGHT + 50;
    });
  }

  // Düşman spawn kontrolü
  shouldSpawnEnemy(toxicAreas, currentTime) {
    const activeToxicAreas = toxicAreas.filter(area => {
      if (!area.hasToxic) return false;
      const elapsed = currentTime - area.startTime;
      const remaining = area.remainingTime - elapsed;
      return remaining > 0; // Sadece süresi dolmamış alanlar aktif sayılsın
    });
    
    return activeToxicAreas.length < 2; // 2'den az aktif toksik alan varsa düşman spawn et
  }

  // Düşmanı sil
  removeEnemy(enemies, enemyId) {
    return enemies.filter(enemy => enemy.id !== enemyId);
  }
} 