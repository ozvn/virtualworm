import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { Canvas, Circle } from '@shopify/react-native-skia';
import { SCREEN, WORM, FOOD } from '../constants/GameConstants';
import { WormMovementSystem } from '../systems/WormMovementSystem';
import { FoodSystem } from '../systems/FoodSystem';
import { useNavigation } from '@react-navigation/native';
import WormEngine from '../engine/WormEngine';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const AREA_RADIUS_METERS = 20;
const AREA_RADIUS_PX = SCREEN.WIDTH * 0.35; // visually scale for screen
const BOT_COLORS = ['#ff9800', '#9c27b0', '#03a9f4', '#e91e63'];

function getRandomPositionInArea(center, radiusPx) {
  const angle = Math.random() * 2 * Math.PI;
  const r = Math.random() * (radiusPx - WORM.SIZE);
  return {
    x: center.x + r * Math.cos(angle),
    y: center.y + r * Math.sin(angle),
  };
}

async function requestLocationPermission() {
  if (Platform.OS === 'ios') {
    const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    return result === RESULTS.GRANTED;
  }
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Konum İzni',
        message: 'Oyun alanı için konum izni vermelisiniz.',
        buttonNeutral: 'Daha Sonra',
        buttonNegative: 'İptal',
        buttonPositive: 'Tamam',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    return false;
  }
}

// Worm class
class Worm {
  constructor({ id, x, y, color, hunger = 100, isBot = false, angle = 0, target = null }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.color = color;
    this.hunger = hunger;
    this.isBot = isBot;
    this.angle = angle;
    this.target = target;
  }
  getHitbox() {
    return { x: this.x, y: this.y, r: WORM.SIZE / 2 };
  }
  isCollidingWith(other) {
    if (!other) return false;
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const dist = Math.hypot(dx, dy);
    return dist < WORM.SIZE; // Tam çakışma için yarıçapların toplamı
  }
}

export default function GameAreaScreen() {
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [worms, setWorms] = useState([]); // [{x, y, color, hunger, angle, target, ...}]
  const [foods, setFoods] = useState([]);
  const [frame, setFrame] = useState(0);
  const [dropActive, setDropActive] = useState(false);
  const [areaTargets, setAreaTargets] = useState([]); // Her solucan için hedef
  const foodSystem = useMemo(() => new FoodSystem(), []);
  const engine = useMemo(() => new WormEngine(), []);
  const movementSystem = useMemo(() => new WormMovementSystem(engine), [engine]);
  const animationRef = useRef(null);
  const areaCenter = useMemo(() => ({ x: SCREEN.WIDTH / 2, y: SCREEN.HEIGHT / 2 }), []);

  // Fetch location on mount
  useEffect(() => {
    (async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Konum izni gerekli', 'Oyun alanı için konum izni vermelisiniz.');
        setLoading(false);
        return;
      }
      Geolocation.getCurrentPosition(
        (position) => {
          setLocation(position.coords);
          setLoading(false);
        },
        (error) => {
          Alert.alert('Konum alınamadı', error.message);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    })();
  }, []);

  // Initialize player worm on first load
  useEffect(() => {
    if (!loading && worms.length === 0) {
      setWorms([
        new Worm({
          id: 'player',
          x: areaCenter.x,
          y: areaCenter.y,
          color: 'green',
          hunger: 100,
          isBot: false,
          angle: 0,
          target: null,
        })
      ]);
      setAreaTargets([getRandomPositionInArea(areaCenter, AREA_RADIUS_PX - WORM.SIZE)]);
    }
  }, [loading]);

  // Game loop
  useEffect(() => {
    if (loading) return;
    let running = true;
    function gameLoop() {
      if (!running) return;
      setFrame(f => f + 1);
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      running = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [loading]);

  // Update worms and food each frame
  useEffect(() => {
    if (worms.length === 0) return;
    // Drop system: if 3+ worms and not already active, spawn food
    if (worms.length >= 3 && !dropActive) {
      setDropActive(true);
      // Spawn 3 foods
      let newFoods = [];
      for (let i = 0; i < 3; i++) {
        newFoods.push(getRandomPositionInArea(areaCenter, AREA_RADIUS_PX - FOOD.SIZE));
      }
      setFoods(f => [...f, ...newFoods]);
      foodSystem.setFoods([...foods, ...newFoods]);
    }
    // Eğer solucan sayısı 3'ten azsa dropActive'i kapat ve besinleri temizle
    if (worms.length < 3 && dropActive) {
      setDropActive(false);
      setFoods([]);
      foodSystem.setFoods([]);
    }
    // Her solucan için hedef ve açı güncelle
    setWorms(prevWorms => prevWorms.map((worm, idx, allWorms) => {
      // Hedef: en yakın besin, yoksa mavi hedef
      let target = null;
      let minDist = Infinity;
      // Sadece 3+ solucan varsa besin hedefle
      if (worms.length >= 3) {
        foods.forEach(f => {
          const dist = Math.hypot(worm.x - f.x, worm.y - f.y);
          if (dist < minDist) {
            minDist = dist;
            target = f;
          }
        });
      }
      // Eğer besin yoksa, mavi hedefe git
      if (!target) {
        if (!worm.target || Math.random() < 0.01) {
          worm.target = areaTargets[idx] || getRandomPositionInArea(areaCenter, AREA_RADIUS_PX - WORM.SIZE);
        }
        target = worm.target;
      } else {
        worm.target = target;
      }
      // Hareket
      const move = movementSystem.calculateMovement(
        worm,
        target,
        frame,
        worm.angle || 0,
        1.0,
        false
      );
      // Hitbox çakışma kontrolü
      const nextPos = { ...worm, ...move.nextPos };
      const willCollide = allWorms.some((other, j) =>
        other.id !== worm.id &&
        Math.hypot(nextPos.x - other.x, nextPos.y - other.y) < WORM.SIZE
      );
      let newWorm;
      if (!willCollide) {
        newWorm = new Worm({ ...worm, ...move.nextPos, angle: move.angle, target });
      } else {
        newWorm = new Worm({ ...worm, angle: move.angle, target }); // Pozisyonu değiştirme
      }
      // Besin yeme (sadece 3+ solucan varsa)
      if (worms.length >= 3 && foods.some(f => Math.hypot(newWorm.x - f.x, newWorm.y - f.y) < FOOD.SIZE)) {
        const eaten = foods.find(f => Math.hypot(newWorm.x - f.x, newWorm.y - f.y) < FOOD.SIZE);
        setFoods(fs => fs.filter(f => f !== eaten));
        foodSystem.setFoods(foods.filter(f => f !== eaten));
        newWorm.hunger = Math.min(100, (worm.hunger || 100) + 30);
        // Besin yendiyse yeni besin oluştur
        const newFood = getRandomPositionInArea(areaCenter, AREA_RADIUS_PX - FOOD.SIZE);
        setFoods(fs => [...fs, newFood]);
        foodSystem.setFoods([...foods.filter(f => f !== eaten), newFood]);
      } else if (!foods.length && Math.hypot(newWorm.x - target.x, newWorm.y - target.y) < WORM.SIZE) {
        // Mavi hedefe ulaştıysa yeni hedef ata
        const newTarget = getRandomPositionInArea(areaCenter, AREA_RADIUS_PX - WORM.SIZE);
        let newTargets = [...areaTargets];
        newTargets[idx] = newTarget;
        setAreaTargets(newTargets);
        newWorm.target = newTarget;
      } else {
        newWorm.hunger = Math.max(0, (worm.hunger || 100) - 0.05);
      }
      return newWorm;
    }));
  }, [frame]);

  // Add bot worm
  const handleAddBot = () => {
    if (worms.length >= 6) {
      Alert.alert('Sınır', 'En fazla 6 solucan olabilir.');
      return;
    }
    const color = BOT_COLORS[(worms.length - 1) % BOT_COLORS.length];
    setWorms(w => [
      ...w,
      new Worm({
        id: `bot${w.length}`,
        ...getRandomPositionInArea(areaCenter, AREA_RADIUS_PX - WORM.SIZE),
        color,
        hunger: 100,
        isBot: true,
        angle: 0,
        target: null,
      })
    ]);
  };

  if (loading || !location) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Konum alınıyor...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#1a237e' }]}> {/* Farklı arka plan */}
      {/* Alan merkezi ve sınırı */}
      <Canvas style={styles.canvas}>
        <Circle cx={areaCenter.x} cy={areaCenter.y} r={AREA_RADIUS_PX} color="rgba(33,150,243,0.13)" />
        {/* Solucanlar */}
        {worms.map((worm, i) => (
          <Circle key={worm.id} cx={worm.x} cy={worm.y} r={WORM.SIZE / 2} color={worm.color} />
        ))}
        {/* Algı alanı */}
        {worms.map((worm, i) => (
          <Circle key={worm.id + '_sense'} cx={worm.x} cy={worm.y} r={WORM.SENSE_RADIUS} color="rgba(0,200,255,0.10)" />
        ))}
        {/* Besinler */}
        {foods.map((f, i) => (
          <Circle key={i} cx={f.x} cy={f.y} r={FOOD.SIZE / 2} color="red" />
        ))}
        {/* Mavi hedef (target) */}
        {worms.map((worm, i) => (
          !foods.length && worm.target && (
            <Circle key={worm.id + '_target'} cx={worm.target.x} cy={worm.target.y} r={4} color="#00f" />
          )
        ))}
      </Canvas>
      {/* Menü Bar */}
      <View style={styles.menuBar}>
        <TouchableOpacity style={[styles.menuButton, { backgroundColor: '#ff9800' }]} onPress={handleAddBot}>
          <Text style={styles.menuButtonText}>Bot Ekle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuButton, { backgroundColor: '#607d8b' }]} onPress={() => navigation.goBack()}>
          <Text style={styles.menuButtonText}>Çıkış</Text>
        </TouchableOpacity>
      </View>
      {/* Bilgi Paneli */}
      <View style={styles.infoPanel}>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Solucanlar: {worms.length} | Besin: {foods.length}</Text>
        <Text style={{ color: '#fff', fontSize: 12 }}>Alan merkezi: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a237e',
  },
  canvas: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  menuBar: {
    width: '100%',
    height: SCREEN.MENU_BAR_HEIGHT,
    backgroundColor: '#283593',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 2,
  },
  menuButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoPanel: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 24,
  },
}); 