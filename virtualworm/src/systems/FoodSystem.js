import { SCREEN } from '../constants/GameConstants';

export class FoodSystem {
  constructor() {
    this.foods = [];
  }

  // Besin bırakma işlemi
  placeFood(locationX, locationY) {
    // Menü barı alanı dışında mı?
    if (locationY > SCREEN.HEIGHT - SCREEN.MENU_BAR_HEIGHT) return this.foods;
    
    const newFood = { x: locationX, y: locationY };
    const updatedFoods = [...this.foods, newFood];
    this.foods = updatedFoods;
    return updatedFoods;
  }

  // Besin yeme işlemi
  consumeFood(foods, targetFood) {
    return foods.filter(f => f !== targetFood);
  }

  // Besinleri al
  getFoods() {
    return this.foods;
  }

  // Besinleri güncelle
  setFoods(foods) {
    this.foods = foods;
  }

  // Tüm besinleri temizle
  clearFoods() {
    this.foods = [];
    return this.foods;
  }
} 