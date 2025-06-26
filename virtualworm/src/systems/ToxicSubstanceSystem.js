import { TOXIC_AREAS, TOXIC, TEST } from '../constants/GameConstants';

export class ToxicSubstanceSystem {
  constructor() {
    this.initializeToxicAreas();
  }

  // Toksik alanları başlat
  initializeToxicAreas() {
    return TOXIC_AREAS.map(area => ({
      ...area,
      hasToxic: false,
      lastRenewal: 0,
      remainingTime: 0,
      startTime: 0
    }));
  }

  // Toksik sıvı bırakma işlemi
  placeToxicSubstance(toxicAreas, selectedToxicArea, onComplete) {
    if (!selectedToxicArea) return toxicAreas;
    
    // 3 saniye bekle
    setTimeout(() => {
      const now = Date.now();
      const updatedAreas = toxicAreas.map(area => 
        area.id === selectedToxicArea.id 
          ? { 
              ...area, 
              hasToxic: true, 
              lastRenewal: now,
              remainingTime: TOXIC.DURATION,
              startTime: now
            }
          : area
      );
      onComplete(updatedAreas);
    }, 3000);
  }

  // Toksik sıvı durumu kontrolü
  getToxicAreaStatus(area, currentTime) {
    if (!area.hasToxic) {
      return { isActive: false, remaining: 0, canRenew: false };
    }
    
    const elapsed = currentTime - area.startTime;
    const remaining = Math.max(0, area.remainingTime - elapsed);
    const isExpired = remaining <= 0;
    const canRenew = remaining <= TOXIC.RENEWAL_THRESHOLD;
    
    return { isActive: !isExpired, remaining, canRenew };
  }

  // Aktif toksik alanları say
  getActiveToxicAreasCount(toxicAreas, currentTime) {
    if (!Array.isArray(toxicAreas)) return 0;
    return toxicAreas.filter(area => {
      const status = this.getToxicAreaStatus(area, currentTime);
      return status.isActive;
    }).length;
  }

  // Toksik alanları sıfırla (geliştirici fonksiyonu)
  resetToxicAreas() {
    return this.initializeToxicAreas();
  }

  // Tüm toksik alanları doldur (geliştirici fonksiyonu)
  fillAllToxicAreas() {
    const now = Date.now();
    return TOXIC_AREAS.map(area => ({
      ...area,
      hasToxic: true,
      lastRenewal: now,
      remainingTime: TOXIC.DURATION,
      startTime: now
    }));
  }

  // Test için toksik alanları doldur (geliştirici fonksiyonu)
  fillToxicAreasForTest() {
    const now = Date.now();
    return TOXIC_AREAS.map(area => ({
      ...area,
      hasToxic: true,
      lastRenewal: now,
      remainingTime: TEST.TOXIC_DURATION,
      startTime: now
    }));
  }

  // Toksik durum detaylarını formatla
  formatToxicStatus(toxicAreas, currentTime) {
    let statusText = "=== TOKSİK ALAN DURUMLARI ===\n\n";
    
    toxicAreas.forEach((area, index) => {
      const status = this.getToxicAreaStatus(area, currentTime);
      
      statusText += `${index + 1}. ${area.id.toUpperCase()}:\n`;
      statusText += `   Durum: ${area.hasToxic ? (status.isActive ? '✅ Aktif' : '❌ Süresi Bitti') : '⚪ Boş'}\n`;
      
      if (area.hasToxic) {
        const hours = Math.floor(status.remaining / (60 * 60 * 1000));
        const minutes = Math.floor((status.remaining % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((status.remaining % (60 * 1000)) / 1000);
        statusText += `   Kalan Süre: ${hours}s ${minutes}dk ${seconds}sn\n`;
      }
      statusText += '\n';
    });
    
    return statusText;
  }

  // Yenileme kontrolü
  canRenewToxicArea(area, currentTime) {
    const status = this.getToxicAreaStatus(area, currentTime);
    return !status.isActive || status.canRenew;
  }

  // Yenileme mesajı oluştur
  getRenewalMessage(area, currentTime) {
    const status = this.getToxicAreaStatus(area, currentTime);
    
    if (!status.isActive) {
      return {
        title: "Toksik Sıvı Yenile",
        message: "Bu alana toksik sıvı bırakmak istiyor musunuz?",
        canRenew: true
      };
    } else if (status.canRenew) {
      const hours = Math.floor(status.remaining / (60 * 60 * 1000));
      const minutes = Math.floor((status.remaining % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((status.remaining % (60 * 1000)) / 1000);
      
      return {
        title: "Toksik Sıvı Yenile",
        message: `Bu alanda toksik sıvı var ama süresi azalıyor.\nKalan süre: ${hours}s ${minutes}dk ${seconds}sn\n\nYenilemek istiyor musunuz?`,
        canRenew: true
      };
    } else {
      const hours = Math.floor(status.remaining / (60 * 60 * 1000));
      const minutes = Math.floor((status.remaining % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((status.remaining % (60 * 1000)) / 1000);
      const renewalHours = Math.floor((status.remaining - TOXIC.RENEWAL_THRESHOLD) / (60 * 60 * 1000));
      const renewalMinutes = Math.floor(((status.remaining - TOXIC.RENEWAL_THRESHOLD) % (60 * 60 * 1000)) / (60 * 1000));
      const renewalSeconds = Math.floor(((status.remaining - TOXIC.RENEWAL_THRESHOLD) % (60 * 1000)) / 1000);
      
      return {
        title: "Toksik Sıvı Durumu",
        message: `Bu alanda toksik sıvı var.\nKalan süre: ${hours}s ${minutes}dk ${seconds}sn\n\nYenilenebilir: ${renewalHours}s ${renewalMinutes}dk ${renewalSeconds}sn sonra`,
        canRenew: false
      };
    }
  }
} 