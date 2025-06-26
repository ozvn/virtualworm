import { REST } from '../constants/GameConstants';

export class RestSystem {
  constructor() {
    this.isResting = false;
    this.restStartTime = 0;
    this.restDuration = 0;
    this.lastRestTime = 0;
  }

  // Dinlenme başlatma kontrolü
  shouldStartRest(currentTime) {
    if (this.isResting) return false;
    
    const timeSinceLastRest = currentTime - this.lastRestTime;
    if (timeSinceLastRest <= REST.COOLDOWN) return false;
    
    return Math.random() < REST.PROBABILITY;
  }

  // Dinlenme başlat
  startRest(currentTime) {
    // Temel dinlenme süresi
    const baseRestTime = Math.random() * (REST.MAX_DURATION - REST.MIN_DURATION) + REST.MIN_DURATION;
    // Varyasyon ekle (%30)
    const variance = baseRestTime * REST.VARIANCE * (Math.random() - 0.5);
    const restTime = Math.max(REST.MIN_DURATION, baseRestTime + variance);
    
    this.isResting = true;
    this.restStartTime = currentTime;
    this.restDuration = restTime;
    
    return {
      isResting: this.isResting,
      restStartTime: this.restStartTime,
      restDuration: this.restDuration
    };
  }

  // Dinlenme durumu kontrolü
  checkRestStatus(currentTime) {
    if (!this.isResting) return { isResting: false };
    
    const restElapsed = currentTime - this.restStartTime;
    if (restElapsed >= this.restDuration) {
      // Dinlenme bitti
      this.isResting = false;
      this.lastRestTime = currentTime;
      return { isResting: false, restEnded: true };
    }
    
    return { 
      isResting: true, 
      remainingTime: this.restDuration - restElapsed 
    };
  }

  // Dinlenme sırasında hız çarpanı
  getRestSpeedMultiplier() {
    return this.isResting ? REST.SPEED_MULTIPLIER : 1.0;
  }

  // Dinlenme durumunu al
  getRestState() {
    return {
      isResting: this.isResting,
      restStartTime: this.restStartTime,
      restDuration: this.restDuration,
      lastRestTime: this.lastRestTime
    };
  }

  // Dinlenme durumunu güncelle
  updateRestState(state) {
    this.isResting = state.isResting;
    this.restStartTime = state.restStartTime;
    this.restDuration = state.restDuration;
    this.lastRestTime = state.lastRestTime;
  }

  // Dinlenme durumunu sıfırla
  resetRest() {
    this.isResting = false;
    this.restStartTime = 0;
    this.restDuration = 0;
    this.lastRestTime = 0;
  }
} 