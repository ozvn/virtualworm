import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableWithoutFeedback, Text, TouchableOpacity } from 'react-native';
import { Canvas, Circle } from '@shopify/react-native-skia';
import WormEngine from '../engine/WormEngine';

const { width, height } = Dimensions.get('window');
const WORM_SIZE = 20;
const FOOD_SIZE = 16;
const MENU_BAR_HEIGHT = 70;
const SENSE_RADIUS = 120; // Solucanın algı yarıçapı (pixel)

export default function GameScreen() {
  const [worm, setWorm] = useState({ x: width / 2, y: height / 2 });
  const [foods, setFoods] = useState([]); // Çoklu besin
  const [placingFood, setPlacingFood] = useState(false);
  const [target, setTarget] = useState(null);
  const [direction, setDirection] = useState('up');
  const [frame, setFrame] = useState(0);
  const [wormAngle, setWormAngle] = useState(0); // 0 = sağa bakıyor
  const engine = useMemo(() => new WormEngine(), []);
  const lastTimeRef = useRef(Date.now());

  // bounds
  const bounds = useMemo(() => ({
    minX: WORM_SIZE / 2,
    maxX: width - WORM_SIZE / 2,
    minY: WORM_SIZE / 2,
    maxY: height - MENU_BAR_HEIGHT - WORM_SIZE / 2,
  }), []);

  // Rastgele hedef belirle
  function pickRandomTarget(currentPos) {
    let tx, ty, dist;
    let tries = 0;
    do {
      tx = Math.random() * (bounds.maxX - bounds.minX - 80) + bounds.minX + 40;
      ty = Math.random() * (bounds.maxY - bounds.minY - 80) + bounds.minY + 40;
      dist = Math.hypot(tx - currentPos.x, ty - currentPos.y);
      tries++;
    } while ((dist < 60 || tx < bounds.minX + 40 || tx > bounds.maxX - 40 || ty < bounds.minY + 40 || ty > bounds.maxY - 40) && tries < 20);
    return { x: tx, y: ty };
  }

  // İlk hedefi bounds hazır olduğunda ata
  useEffect(() => {
    if (!target && bounds) {
      setTarget(pickRandomTarget(worm));
    }
  }, [bounds, target, worm]);

  // Kırmızı nokta bırakma (Canvas üstünde garanti tıklama)
  const handleFoodDrop = (e) => {
    if (!placingFood) return;
    // Ekran koordinatlarını doğrudan al
    const { locationX, locationY } = e.nativeEvent;
    // Menü barı alanı dışında mı?
    if (locationY > height - MENU_BAR_HEIGHT) return;
    setFoods(prev => [...prev, { x: locationX, y: locationY }]);
    setPlacingFood(false);
  };

  // Animasyon döngüsü
  useEffect(() => {
    let running = true;
    function loop() {
      if (!running) return;
      const now = Date.now();
      let deltaTime = (now - lastTimeRef.current) / 1000;
      if (deltaTime > 0.1 || deltaTime < 0) deltaTime = 1 / 60;
      lastTimeRef.current = now;
      setFrame(f => f + 1);
      // --- Algı alanı içinde besin varsa ona, yoksa her zaman mavi hedefe yönel ---
      const foodsInRange = foods.filter(f => Math.hypot(f.x - worm.x, f.y - worm.y) <= SENSE_RADIUS);
      let currentTarget = null;
      if (foodsInRange.length > 0) {
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
        currentTarget = closest;
      } else if (target) {
        // Besin yoksa her zaman mavi hedefe git
        currentTarget = target;
      } else {
        currentTarget = null;
      }
      if (!currentTarget) {
        requestAnimationFrame(loop);
        return;
      }
      // Hedefe giden vektör ve açı
      let dx = currentTarget.x - worm.x;
      let dy = currentTarget.y - worm.y;
      let dist = Math.hypot(dx, dy);
      if (dist === 0) dist = 1;
      dx /= dist;
      dy /= dist;
      let targetAngle = Math.atan2(dy, dx);
      // Daha belirgin ve yumuşak yay için sway ve offset artır
      const swayStrength = 1.5; // ÇOK daha büyük yaylanma
      const swayPeriod = 12; // Daha uzun periyot, daha yavaş ve büyük yaylar
      const swayAngle = Math.sin(frame / swayPeriod) * swayStrength;
      const arcOffset = Math.PI / 5; // sabit yay açısı (daha açılı hareket)
      targetAngle += swayAngle + arcOffset * Math.sin(frame / (swayPeriod * 2));
      // Çok daha yumuşak açı geçişi
      let angle = wormAngle;
      let diff = targetAngle - angle;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      angle += diff * 0.28; // çok daha yumuşak geçiş
      setWormAngle(angle);
      // Hareket vektörü
      let moveX = Math.cos(angle);
      let moveY = Math.sin(angle);
      // Çaprazda hız azaltma
      let speed = engine.speed;
      if (Math.abs(moveX) > 0.1 && Math.abs(moveY) > 0.1) {
        speed = speed * 0.69;
      }
      // Sensory inputlar: yeni vektör
      const sensoryInputs = [moveX, moveY, 1];
      let nextDirection = engine.getWormNextDirection(sensoryInputs);
      // Fallback: Eğer bu yön hedefe yaklaştırmıyorsa, açısal vektöre göre yön seç
      let fallbackDirection;
      if (Math.abs(moveX) > Math.abs(moveY)) {
        fallbackDirection = moveX > 0 ? 'right' : 'left';
      } else {
        fallbackDirection = moveY > 0 ? 'up' : 'down';
      }
      let testPos = engine.getNextPosition(worm, nextDirection, 1, bounds, speed);
      let distNow = Math.hypot(currentTarget.x - worm.x, currentTarget.y - worm.y);
      let distTest = Math.hypot(currentTarget.x - testPos.x, currentTarget.y - testPos.y);
      if (distTest >= distNow) {
        nextDirection = fallbackDirection;
      }
      setDirection(nextDirection);
      let nextPos = engine.getNextPosition(worm, nextDirection, deltaTime, bounds, speed);
      // Hedefe ulaştıysa: besin varsa besini kaldır, yoksa yeni random hedef ata
      const distToTarget = Math.hypot(nextPos.x - currentTarget.x, nextPos.y - currentTarget.y);
      if (foodsInRange.length > 0 && currentTarget) {
        // Besine ulaştıysa sadece o besini sil
        if (distToTarget < FOOD_SIZE) {
          setFoods(prev => prev.filter(f => f !== currentTarget));
          // Eğer başka besin yoksa yeni random hedef ata
          if (foods.length === 1) {
            setTarget(pickRandomTarget(nextPos));
          }
        }
      } else if (foodsInRange.length === 0 && currentTarget === target && distToTarget < WORM_SIZE) {
        // Mavi hedefe ulaştıysa yeni hedef ata
        setTarget(pickRandomTarget(nextPos));
      }
      setWorm({ ...nextPos });
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    return () => { running = false; };
  }, [engine, bounds, foods, target, worm, frame, wormAngle]);

  return (
    <View style={styles.container}>
      <View style={styles.canvasWrapper}>
        <Canvas style={styles.canvas}>
          {/* Alt duvar (menü barının üstü) */}
          <Circle cx={width / 2} cy={height - MENU_BAR_HEIGHT} r={2} color="#fff" />
          {/* Solucan */}
          <Circle cx={worm.x} cy={worm.y} r={WORM_SIZE / 2} color="green" />
          {/* Algı alanı (yarı saydam yuvarlak) */}
          <Circle cx={worm.x} cy={worm.y} r={SENSE_RADIUS} color="rgba(0,200,255,0.13)" />
          {/* Besinler (kırmızı noktalar) */}
          {foods.map((f, i) => (
            <Circle key={i} cx={f.x} cy={f.y} r={8} color="red" />
          ))}
          {/* Hedef (mavi nokta, her zaman göster) */}
          {target && (
            <Circle cx={target.x} cy={target.y} r={4} color="#00f" />
          )}
        </Canvas>
        {/* Sadece besin bırakma modunda aktif olan şeffaf View */}
        {placingFood && (
          <View
            style={styles.foodDropOverlay}
            pointerEvents="auto"
            onStartShouldSetResponder={() => true}
            onResponderRelease={handleFoodDrop}
          >
            <View style={styles.foodDropInfo} pointerEvents="none">
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Besin bırakmak için ekrana dokunun</Text>
            </View>
          </View>
        )}
        <View style={styles.debugInfo} pointerEvents="none">
          <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontSize: 16 }}>Yön: {direction}</Text>
          </View>
        </View>
      </View>
      {/* Alt Menü */}
      <View style={styles.menuBar}>
        <TouchableOpacity
          style={[styles.menuButton, placingFood && { backgroundColor: '#ffb347' }]}
          onPress={() => setPlacingFood(prev => !prev)}
        >
          <Text style={styles.menuButtonText}>Besin Bırak</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  canvasWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  canvas: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  debugInfo: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  menuBar: {
    width: '100%',
    height: 70,
    backgroundColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    zIndex: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 10,
  },
  menuButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 8,
    elevation: 2,
  },
  menuButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
  },
  foodDropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.08)', // hafif karartma
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodDropInfo: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 40,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 24,
  },
}); 