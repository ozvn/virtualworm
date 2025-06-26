import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Screen and UI Constants
export const SCREEN = {
  WIDTH: width,
  HEIGHT: height,
  MENU_BAR_HEIGHT: 70,
};

// Worm Constants
export const WORM = {
  SIZE: 20,
  BASE_SPEED: 60, // px/s
  SENSE_RADIUS: 120, // Solucanın algı yarıçapı (pixel)
};

// Food Constants
export const FOOD = {
  SIZE: 16,
};

// Enemy Constants
export const ENEMY = {
  SIZE: 15,
  BASE_SPEED: 40, // px/s
  SPAWN_INTERVAL: 8000, // 8 saniyede bir düşman
};

// Toxic Substance Constants
export const TOXIC = {
  AREA_SIZE: 70, // Toksik sıvı alanı boyutu
  DURATION: 48 * 60 * 60 * 1000, // 48 saat
  RENEWAL_THRESHOLD: 12 * 60 * 60 * 1000, // 12 saat
  PROTECTION_RADIUS: 90, // Toksik alanın 1.5 katı mesafede koruma
};

// Toxic Areas Positions
export const TOXIC_AREAS = [
  { id: 'topLeft', x: 80, y: 80 },
  { id: 'topRight', x: width - 80, y: 80 },
  { id: 'bottomLeft', x: 80, y: height - SCREEN.MENU_BAR_HEIGHT - 80 },
  { id: 'bottomRight', x: width - 80, y: height - SCREEN.MENU_BAR_HEIGHT - 80 }
];

// Rest System Constants
export const REST = {
  PROBABILITY: 0.008, // Her frame'de %0.8 ihtimalle dinlenme başlat
  MIN_DURATION: 2000, // Minimum 2 saniye dinlenme
  MAX_DURATION: 8000, // Maksimum 8 saniye dinlenme
  COOLDOWN: 15000, // Dinlenme sonrası 15 saniye bekleme
  VARIANCE: 0.3, // Dinlenme süresinde %30 varyasyon
  SPEED_MULTIPLIER: 0.3, // Dinlenme sırasında %30 hız
};

// Speed System Constants
export const SPEED = {
  CHANGE_PROBABILITY: 0.015, // Her frame'de %1.5 ihtimalle hız değişimi
  BURST_PROBABILITY: 0.003, // Her frame'de %0.3 ihtimalle depar (burst)
  BURST_DURATION: 2000, // Depar süresi 2 saniye
  BURST_COOLDOWN: 7000, // Depar sonrası 10 saniye bekleme
  MIN_MULTIPLIER: 0.7, // Minimum %70 hız
  MAX_MULTIPLIER: 1.5, // Maksimum %150 hız
  BURST_MULTIPLIER: 1.2, // Depar %120 hız
  DIAGONAL_MULTIPLIER: 0.69, // Çaprazda hız azaltma
};

// Game Bounds
export const BOUNDS = {
  MIN_X: WORM.SIZE / 2,
  MAX_X: width - WORM.SIZE / 2,
  MIN_Y: WORM.SIZE / 2,
  MAX_Y: height - SCREEN.MENU_BAR_HEIGHT - WORM.SIZE / 2,
};

// Animation Constants
export const ANIMATION = {
  SWAY_STRENGTH: 1.5, // ÇOK daha büyük yaylanma
  SWAY_PERIOD: 12, // Daha uzun periyot, daha yavaş ve büyük yaylar
  ARC_OFFSET: Math.PI / 5, // sabit yay açısı (daha açılı hareket)
  ANGLE_SMOOTHING: 0.28, // çok daha yumuşak geçiş
};

// Test Constants (for development)
export const TEST = {
  TOXIC_DURATION: 30 * 1000, // 30 saniye test süresi
  TOXIC_RENEWAL_THRESHOLD: 10 * 1000, // 10 saniye test süresi
};

// Enemy Spawn Threshold
export const ENEMY_SPAWN_THRESHOLD = 2; // 2'den az aktif toksik alan varsa düşman spawn et 