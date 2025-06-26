import { SPEED } from '../constants/GameConstants';

export class SpeedSystem {
  constructor() {
    this.speedMultiplier = 1.0;
    this.isBursting = false;
    this.burstStartTime = 0;
    this.lastBurstTime = 0;
  }

  // Hız değişimi kontrolü
  shouldChangeSpeed(currentTime) {
    if (this.isBursting) return false;
    
    const timeSinceLastBurst = currentTime - this.lastBurstTime;
    if (timeSinceLastBurst <= SPEED.BURST_COOLDOWN) return false;
    
    return Math.random() < SPEED.CHANGE_PROBABILITY;
  }

  // Depar (burst) kontrolü
  shouldStartBurst(currentTime) {
    if (this.isBursting) return false;
    
    const timeSinceLastBurst = currentTime - this.lastBurstTime;
    if (timeSinceLastBurst <= SPEED.BURST_COOLDOWN) return false;
    
    return Math.random() < SPEED.BURST_PROBABILITY;
  }

  // Normal hız değişimi
  changeSpeed() {
    const newMultiplier = Math.random() * (SPEED.MAX_MULTIPLIER - SPEED.MIN_MULTIPLIER) + SPEED.MIN_MULTIPLIER;
    this.speedMultiplier = newMultiplier;
    return this.speedMultiplier;
  }

  // Depar başlat
  startBurst(currentTime) {
    this.isBursting = true;
    this.burstStartTime = currentTime;
    this.speedMultiplier = SPEED.BURST_MULTIPLIER;
    
    return {
      isBursting: this.isBursting,
      burstStartTime: this.burstStartTime,
      speedMultiplier: this.speedMultiplier
    };
  }

  // Depar durumu kontrolü
  checkBurstStatus(currentTime) {
    if (!this.isBursting) return { isBursting: false };
    
    const burstElapsed = currentTime - this.burstStartTime;
    if (burstElapsed >= SPEED.BURST_DURATION) {
      // Depar bitti
      this.isBursting = false;
      this.lastBurstTime = currentTime;
      this.speedMultiplier = 1.0; // Normal hıza dön
      return { isBursting: false, burstEnded: true };
    }
    
    return { 
      isBursting: true, 
      remainingTime: SPEED.BURST_DURATION - burstElapsed 
    };
  }

  // Hız çarpanını al
  getSpeedMultiplier() {
    return this.speedMultiplier;
  }

  // Hız çarpanını ayarla
  setSpeedMultiplier(multiplier) {
    this.speedMultiplier = multiplier;
  }

  // Hız durumunu al
  getSpeedState() {
    return {
      speedMultiplier: this.speedMultiplier,
      isBursting: this.isBursting,
      burstStartTime: this.burstStartTime,
      lastBurstTime: this.lastBurstTime
    };
  }

  // Hız durumunu güncelle
  updateSpeedState(state) {
    this.speedMultiplier = state.speedMultiplier;
    this.isBursting = state.isBursting;
    this.burstStartTime = state.burstStartTime;
    this.lastBurstTime = state.lastBurstTime;
  }

  // Hız durumunu sıfırla
  resetSpeed() {
    this.speedMultiplier = 1.0;
    this.isBursting = false;
    this.burstStartTime = 0;
    this.lastBurstTime = 0;
  }

  // Dinlenme sırasında hız ayarı
  applyRestSpeed(restSpeedMultiplier) {
    if (this.isBursting) return this.speedMultiplier;
    return restSpeedMultiplier;
  }
} 