import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableWithoutFeedback, Text, TouchableOpacity, Alert } from 'react-native';
import { Canvas, Circle, Path } from '@shopify/react-native-skia';
import WormEngine from '../engine/WormEngine';

const { width, height } = Dimensions.get('window');
const WORM_SIZE = 20;
const FOOD_SIZE = 16;
const MENU_BAR_HEIGHT = 70;
const SENSE_RADIUS = 120; // Solucanın algı yarıçapı (pixel)
const TOXIC_AREA_SIZE = 60; // Toksik sıvı alanı boyutu
const ENEMY_SIZE = 15; // Düşman boyutu

// Toksik sıvı alanları için sabitler
const TOXIC_AREAS = [
  { id: 'topLeft', x: 80, y: 80 },
  { id: 'topRight', x: width - 80, y: 80 },
  { id: 'bottomLeft', x: 80, y: height - MENU_BAR_HEIGHT - 80 },
  { id: 'bottomRight', x: width - 80, y: height - MENU_BAR_HEIGHT - 80 }
];

// Zamanlayıcı sabitleri (milisaniye)
const TOXIC_DURATION = 48 * 60 * 60 * 1000; // 48 saat
const TOXIC_RENEWAL_THRESHOLD = 12 * 60 * 60 * 1000; // 12 saat

// Test için kısa süreler (geliştirme aşamasında)
// const TOXIC_DURATION = 30 * 1000; // 30 saniye
// const TOXIC_RENEWAL_THRESHOLD = 10 * 1000; // 10 saniye

// Dinlenme sistemi sabitleri
const REST_PROBABILITY = 0.008; // Her frame'de %0.8 ihtimalle dinlenme başlat (daha az sıklık)
const MIN_REST_DURATION = 2000; // Minimum 2 saniye dinlenme
const MAX_REST_DURATION = 8000; // Maksimum 8 saniye dinlenme
const REST_COOLDOWN = 15000; // Dinlenme sonrası 15 saniye bekleme
const REST_VARIANCE = 0.3; // Dinlenme süresinde %30 varyasyon

// Hız değişkenliği sabitleri
const SPEED_CHANGE_PROBABILITY = 0.015; // Her frame'de %1.5 ihtimalle hız değişimi
const SPEED_BURST_PROBABILITY = 0.003; // Her frame'de %0.3 ihtimalle depar (burst)
const SPEED_BURST_DURATION = 2000; // Depar süresi 2 saniye
const SPEED_BURST_COOLDOWN = 10000; // Depar sonrası 10 saniye bekleme
const MIN_SPEED_MULTIPLIER = 0.9; // Minimum %90 hız
const MAX_SPEED_MULTIPLIER = 1.1; // Maksimum %110 hız
const BURST_SPEED_MULTIPLIER = 1.2; // Depar %120 hız
const REST_SPEED_MULTIPLIER = 0.3; // Dinlenme sırasında %30 hız (minimal hareket)

export default function GameScreen() {
  const [worm, setWorm] = useState({ x: width / 2, y: height / 2 });
  const [foods, setFoods] = useState([]); // Çoklu besin
  const [placingFood, setPlacingFood] = useState(false);
  const [target, setTarget] = useState(null);
  const [direction, setDirection] = useState('up');
  const [frame, setFrame] = useState(0);
  const [wormAngle, setWormAngle] = useState(0); // 0 = sağa bakıyor
  
  // Dinlenme sistemi state'leri
  const [isResting, setIsResting] = useState(false);
  const [restStartTime, setRestStartTime] = useState(0);
  const [restDuration, setRestDuration] = useState(0);
  const [lastRestTime, setLastRestTime] = useState(0);
  
  // Hız değişkenliği state'leri
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [isBursting, setIsBursting] = useState(false);
  const [burstStartTime, setBurstStartTime] = useState(0);
  const [lastBurstTime, setLastBurstTime] = useState(0);
  
  // Hafta 3: Toksik sıvı sistemi
  const [toxicAreas, setToxicAreas] = useState(() => 
    TOXIC_AREAS.map(area => ({
      ...area,
      hasToxic: false,
      lastRenewal: 0,
      remainingTime: 0,
      startTime: 0 // Başlangıç zamanı eklendi
    }))
  );
  const [enemies, setEnemies] = useState([]);
  const [isPlacingToxic, setIsPlacingToxic] = useState(false);
  const [selectedToxicArea, setSelectedToxicArea] = useState(null);
  const [showDeveloperPanel, setShowDeveloperPanel] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now()); // Gerçek zaman state'i
  
  const engine = useMemo(() => new WormEngine(), []);
  const lastTimeRef = useRef(Date.now());
  const lastEnemySpawnRef = useRef(Date.now());

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

  // Toksik sıvı alanına tıklama
  const handleToxicAreaPress = (area) => {
    const now = currentTime; // currentTime state'ini kullan
    const elapsed = now - area.startTime; // startTime'dan itibaren geçen süre
    const remainingTime = area.remainingTime - elapsed;
    
    if (remainingTime <= 0) {
      // Sıvı bitmiş, yenileyebilir
      Alert.alert(
        "Toksik Sıvı Yenile",
        "Bu alana toksik sıvı bırakmak istiyor musunuz?",
        [
          { text: "İptal", style: "cancel" },
          { 
            text: "Yenile", 
            onPress: () => {
              setSelectedToxicArea(area);
              setIsPlacingToxic(true);
            }
          }
        ]
      );
    } else if (remainingTime <= TOXIC_RENEWAL_THRESHOLD) {
      // 12 saatten az kaldı, yenileyebilir
      const hours = Math.floor(remainingTime / (60 * 60 * 1000));
      const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remainingTime % (60 * 1000)) / 1000);
      Alert.alert(
        "Toksik Sıvı Yenile",
        `Bu alanda toksik sıvı var ama süresi azalıyor.\nKalan süre: ${hours}s ${minutes}dk ${seconds}sn\n\nYenilemek istiyor musunuz?`,
        [
          { text: "İptal", style: "cancel" },
          { 
            text: "Yenile", 
            onPress: () => {
              setSelectedToxicArea(area);
              setIsPlacingToxic(true);
            }
          }
        ]
      );
    } else {
      // Sıvı var ve henüz yenilenemez
      const hours = Math.floor(remainingTime / (60 * 60 * 1000));
      const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remainingTime % (60 * 1000)) / 1000);
      const renewalHours = Math.floor((remainingTime - TOXIC_RENEWAL_THRESHOLD) / (60 * 60 * 1000));
      const renewalMinutes = Math.floor(((remainingTime - TOXIC_RENEWAL_THRESHOLD) % (60 * 60 * 1000)) / (60 * 1000));
      const renewalSeconds = Math.floor(((remainingTime - TOXIC_RENEWAL_THRESHOLD) % (60 * 1000)) / 1000);
      
      Alert.alert(
        "Toksik Sıvı Durumu",
        `Bu alanda toksik sıvı var.\nKalan süre: ${hours}s ${minutes}dk ${seconds}sn\n\nYenilenebilir: ${renewalHours}s ${renewalMinutes}dk ${renewalSeconds}sn sonra`
      );
    }
  };

  // Toksik sıvı bırakma işlemi
  const handleToxicPlacement = () => {
    if (!selectedToxicArea || !isPlacingToxic) return;
    
    // 3 saniye bekle
    setTimeout(() => {
      const now = Date.now();
      setToxicAreas(prev => prev.map(area => 
        area.id === selectedToxicArea.id 
          ? { 
              ...area, 
              hasToxic: true, 
              lastRenewal: now,
              remainingTime: TOXIC_DURATION,
              startTime: now // Başlangıç zamanını kaydet
            }
          : area
      ));
      
      setSelectedToxicArea(null);
      setIsPlacingToxic(false);
    }, 3000);
  };

  // Düşman spawn sistemi
  const spawnEnemy = () => {
    const now = Date.now();
    if (now - lastEnemySpawnRef.current < 8000) return; // 8 saniyede bir düşman (azaltıldı)
    
    // Rastgele kenardan spawn
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
      case 0: // üst
        x = Math.random() * width;
        y = -ENEMY_SIZE;
        break;
      case 1: // sağ
        x = width + ENEMY_SIZE;
        y = Math.random() * (height - MENU_BAR_HEIGHT);
        break;
      case 2: // alt
        x = Math.random() * width;
        y = height - MENU_BAR_HEIGHT + ENEMY_SIZE;
        break;
      case 3: // sol
        x = -ENEMY_SIZE;
        y = Math.random() * (height - MENU_BAR_HEIGHT);
        break;
    }
    
    const enemy = {
      id: Date.now() + Math.random(),
      x,
      y,
      targetX: worm.x,
      targetY: worm.y,
      speed: 40 // px/s - biraz yavaşlattım
    };
    
    setEnemies(prev => [...prev, enemy]);
    lastEnemySpawnRef.current = now;
  };

  // Düşmanın toksik sıvı alanına yakın olup olmadığını kontrol et
  const isEnemyNearToxicArea = (enemy) => {
    const now = currentTime;
    return toxicAreas.some(area => {
      if (!area.hasToxic) return false;
      const elapsed = now - area.startTime;
      const remaining = area.remainingTime - elapsed;
      if (remaining <= 0) return false; // Süresi bitmiş alanlar koruma sağlamaz
      
      const dist = Math.hypot(enemy.x - area.x, enemy.y - area.y);
      return dist < TOXIC_AREA_SIZE * 1.5; // Toksik alanın 1.5 katı mesafede
    });
  };

  // Geliştirici paneli fonksiyonları
  const resetToxicAreas = () => {
    setToxicAreas(prev => prev.map(area => ({
      ...area,
      hasToxic: false,
      lastRenewal: 0,
      remainingTime: 0
    })));
    Alert.alert("Geliştirici", "Toksik alanlar sıfırlandı!");
  };

  const fillToxicAreas = () => {
    const now = Date.now();
    setToxicAreas(prev => prev.map(area => ({
      ...area,
      hasToxic: true,
      lastRenewal: now,
      remainingTime: TOXIC_DURATION,
      startTime: now
    })));
    Alert.alert("Geliştirici", "Tüm toksik alanlar dolduruldu!");
  };

  const fillToxicAreasTest = () => {
    const now = Date.now();
    setToxicAreas(prev => prev.map(area => ({
      ...area,
      hasToxic: true,
      lastRenewal: now,
      remainingTime: 30 * 1000, // 30 saniye test süresi
      startTime: now
    })));
    Alert.alert("Geliştirici", "Tüm toksik alanlar 30 saniye test süresiyle dolduruldu!");
  };

  // Toksik durum detaylarını göster
  const showToxicStatus = () => {
    const now = currentTime;
    let statusText = "=== TOKSİK ALAN DURUMLARI ===\n\n";
    
    toxicAreas.forEach((area, index) => {
      const elapsed = now - area.startTime;
      const remaining = Math.max(0, area.remainingTime - elapsed);
      const isExpired = remaining <= 0;
      
      statusText += `${index + 1}. ${area.id.toUpperCase()}:\n`;
      statusText += `   Durum: ${area.hasToxic ? (isExpired ? '❌ Süresi Bitti' : '✅ Aktif') : '⚪ Boş'}\n`;
      
      if (area.hasToxic) {
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
        statusText += `   Kalan Süre: ${hours}s ${minutes}dk ${seconds}sn\n`;
      }
      statusText += '\n';
    });
    
    Alert.alert("Toksik Sıvı Durumu", statusText);
  };

  // Düşmana tıklama işlemi
  const handleEnemyPress = (enemy) => {
    setEnemies(prev => prev.filter(e => e.id !== enemy.id));
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
      setCurrentTime(now); // Gerçek zamanı güncelle

      // Dinlenme sistemi kontrolü
      if (!isResting && !isPlacingToxic) {
        // Dinlenme cooldown kontrolü
        const timeSinceLastRest = now - lastRestTime;
        if (timeSinceLastRest > REST_COOLDOWN) {
          // Rastgele dinlenme başlat - daha doğal dağılım
          if (Math.random() < REST_PROBABILITY) {
            // Temel dinlenme süresi
            const baseRestTime = Math.random() * (MAX_REST_DURATION - MIN_REST_DURATION) + MIN_REST_DURATION;
            // Varyasyon ekle (%30)
            const variance = baseRestTime * REST_VARIANCE * (Math.random() - 0.5);
            const restTime = Math.max(MIN_REST_DURATION, baseRestTime + variance);
            
            setIsResting(true);
            setRestStartTime(now);
            setRestDuration(restTime);
          }
        }
      } else if (isResting) {
        // Dinlenme süresi kontrolü
        const restElapsed = now - restStartTime;
        if (restElapsed >= restDuration) {
          // Dinlenme bitti
          setIsResting(false);
          setLastRestTime(now);
        }
        // Dinlenme devam ediyor, sadece solucan hareket etmesin
        // Düşmanlar ve diğer sistemler çalışmaya devam etsin
      }

      // Hız değişkenliği sistemi
      if (!isBursting && !isPlacingToxic) {
        const timeSinceLastBurst = now - lastBurstTime;
        if (timeSinceLastBurst > SPEED_BURST_COOLDOWN) {
          // Depar (burst) kontrolü
          if (Math.random() < SPEED_BURST_PROBABILITY) {
            setIsBursting(true);
            setBurstStartTime(now);
            setSpeedMultiplier(BURST_SPEED_MULTIPLIER);
          }
          // Normal hız değişimi kontrolü
          else if (Math.random() < SPEED_CHANGE_PROBABILITY) {
            const newMultiplier = Math.random() * (MAX_SPEED_MULTIPLIER - MIN_SPEED_MULTIPLIER) + MIN_SPEED_MULTIPLIER;
            setSpeedMultiplier(newMultiplier);
          }
        }
      } else if (isBursting) {
        // Depar süresi kontrolü
        const burstElapsed = now - burstStartTime;
        if (burstElapsed >= SPEED_BURST_DURATION) {
          // Depar bitti
          setIsBursting(false);
          setLastBurstTime(now);
          setSpeedMultiplier(1.0); // Normal hıza dön
        }
      }

      // Dinlenme sırasında hız ayarı
      if (isResting) {
        setSpeedMultiplier(REST_SPEED_MULTIPLIER);
      } else if (!isBursting) {
        // Dinlenme bittiyse ve depar modunda değilse normal hıza dön
        if (speedMultiplier === REST_SPEED_MULTIPLIER) {
          setSpeedMultiplier(1.0);
        }
      }

      // Toksik sıvı zamanlayıcı güncelleme - artık sadece görsel için
      // Gerçek hesaplama currentTime state'i ile yapılıyor

      // Düşman spawn kontrolü
      const activeToxicAreas = toxicAreas.filter(area => {
        if (!area.hasToxic) return false;
        const elapsed = now - area.startTime;
        const remaining = area.remainingTime - elapsed;
        return remaining > 0; // Sadece süresi dolmamış alanlar aktif sayılsın
      });
      if (activeToxicAreas.length < 2) { // 2'den az aktif toksik alan varsa düşman spawn et (azaltıldı)
        spawnEnemy();
      }

      // Düşman hareketi - dinlenme durumundan bağımsız olarak çalışır
      setEnemies(prev => prev.map(enemy => {
        // Toksik sıvı alanına yakınsa düşmanı yok et
        if (isEnemyNearToxicArea(enemy)) {
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
        if (distToWorm < WORM_SIZE + ENEMY_SIZE) {
          // Çarpışma! Düşmanı sil (oyun bitti uyarısı kaldırıldı)
          return false;
        }
        
        // Ekran dışına çıkan düşmanları sil
        return enemy.x > -50 && enemy.x < width + 50 && 
               enemy.y > -50 && enemy.y < height - MENU_BAR_HEIGHT + 50;
      }));

      // Dinlenme sırasında sadece solucan hareket etmesin
      if (isResting) {
        requestAnimationFrame(loop);
        return;
      }

      // --- Algı alanı içinde besin varsa ona, yoksa her zaman mavi hedefe yönel ---
      const foodsInRange = foods.filter(f => Math.hypot(f.x - worm.x, f.y - worm.y) <= SENSE_RADIUS);
      let currentTarget = null;
      
      // Toksik sıvı bırakma modunda mı?
      if (isPlacingToxic && selectedToxicArea) {
        currentTarget = selectedToxicArea;
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
      let speed = engine.speed * speedMultiplier; // Hız çarpanını uygula
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
      
      // Hedefe ulaştıysa kontrol et
      const distToTarget = Math.hypot(nextPos.x - currentTarget.x, nextPos.y - currentTarget.y);
      
      if (isPlacingToxic && selectedToxicArea && distToTarget < TOXIC_AREA_SIZE) {
        // Toksik sıvı bırakma hedefine ulaştı
        handleToxicPlacement();
      } else if (foodsInRange.length > 0 && currentTarget) {
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
  }, [engine, bounds, foods, target, worm, frame, wormAngle, toxicAreas, enemies, isPlacingToxic, selectedToxicArea, isResting, restStartTime, restDuration, lastRestTime, speedMultiplier, isBursting, burstStartTime, lastBurstTime]);

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
          {target && !isPlacingToxic && (
            <Circle cx={target.x} cy={target.y} r={4} color="#00f" />
          )}
          
          {/* Toksik sıvı alanları */}
          {toxicAreas.map((area, index) => {
            const now = currentTime;
            const elapsed = now - area.startTime;
            const remaining = Math.max(0, area.remainingTime - elapsed);
            const isExpired = remaining <= 0;
            
            return (
              <React.Fragment key={area.id}>
                {/* Alan çerçevesi */}
                <Circle 
                  cx={area.x} 
                  cy={area.y} 
                  r={TOXIC_AREA_SIZE / 2} 
                  color={area.hasToxic 
                    ? (isExpired ? "rgba(255,0,0,0.4)" : "rgba(0,255,0,0.4)") 
                    : "rgba(255,255,255,0.2)"
                  }
                  style="stroke"
                  strokeWidth={4}
                />
                {/* Toksik sıvı varsa top göster */}
                {area.hasToxic && (
                  <>
                    <Circle 
                      cx={area.x} 
                      cy={area.y} 
                      r={TOXIC_AREA_SIZE / 3} 
                      color={isExpired ? "rgba(255,0,0,0.6)" : "rgba(0,255,0,0.6)"}
                    />
                    <Circle 
                      cx={area.x} 
                      cy={area.y} 
                      r={TOXIC_AREA_SIZE / 6} 
                      color={isExpired ? "rgba(255,0,0,1)" : "rgba(0,255,0,1)"}
                    />
                  </>
                )}
              </React.Fragment>
            );
          })}
          
          {/* Düşmanlar (mor huni şeklinde) */}
          {enemies.map((enemy) => {
            // Huni şekli için path oluştur
            const centerX = enemy.x;
            const centerY = enemy.y;
            const radius = ENEMY_SIZE;
            
            // Huni şekli: üstte geniş, altta dar
            const path = `M ${centerX - radius} ${centerY - radius * 0.5} 
                         L ${centerX + radius} ${centerY - radius * 0.5} 
                         L ${centerX + radius * 0.3} ${centerY + radius * 0.8} 
                         L ${centerX - radius * 0.3} ${centerY + radius * 0.8} Z`;
            
            return (
              <Path
                key={enemy.id}
                path={path}
                color="purple"
                style="fill"
              />
            );
          })}
        </Canvas>
        
        {/* Düşmanlara tıklama overlay'i */}
        {enemies.map((enemy) => (
          <TouchableOpacity
            key={enemy.id}
            style={[styles.enemyOverlay, {
              left: enemy.x - ENEMY_SIZE,
              top: enemy.y - ENEMY_SIZE,
              width: ENEMY_SIZE * 2,
              height: ENEMY_SIZE * 2,
            }]}
            onPress={() => handleEnemyPress(enemy)}
          />
        ))}
        
        {/* Toksik sıvı alanlarına tıklama overlay'i */}
        {toxicAreas.map((area) => (
          <TouchableOpacity
            key={area.id}
            style={[styles.toxicAreaOverlay, {
              left: area.x - TOXIC_AREA_SIZE / 2,
              top: area.y - TOXIC_AREA_SIZE / 2,
              width: TOXIC_AREA_SIZE,
              height: TOXIC_AREA_SIZE,
            }]}
            onPress={() => handleToxicAreaPress(area)}
          />
        ))}
        
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
        
        {/* Toksik sıvı bırakma modu */}
        {isPlacingToxic && selectedToxicArea && (
          <View style={styles.toxicPlacementOverlay}>
            <View style={styles.toxicPlacementInfo} pointerEvents="none">
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                Toksik sıvı bırakılıyor... Solucan hedefe gidiyor
              </Text>
            </View>
          </View>
        )}
        
        <View style={styles.debugInfo} pointerEvents="none">
          <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontSize: 16 }}>Yön: {direction}</Text>
            <Text style={{ color: '#fff', fontSize: 12 }}>
              Aktif Toksik: {toxicAreas.filter(a => {
                if (!a.hasToxic) return false;
                const now = currentTime;
                const elapsed = now - a.startTime;
                const remaining = a.remainingTime - elapsed;
                return remaining > 0;
              }).length}/4
            </Text>
            <Text style={{ color: '#fff', fontSize: 12 }}>
              Düşman: {enemies.length}
            </Text>
            <Text style={{ color: '#fff', fontSize: 10 }}>
              {isPlacingToxic ? 'Toksik Bırakılıyor...' : (isResting ? 'Dinleniyor...' : 'Hazır')}
            </Text>
            {/* Hız durumu */}
            <Text style={{ 
              color: isBursting ? '#ff4444' : (isResting ? '#ffeb3b' : '#4caf50'), 
              fontSize: 10 
            }}>
              Hız: {Math.round(speedMultiplier * 100)}%
              {isBursting && ' (DEPAR!)'}
            </Text>
            {/* Dinlenme süresi */}
            {isResting && (
              <Text style={{ color: '#ffeb3b', fontSize: 10 }}>
                Dinlenme: {Math.ceil((restDuration - (currentTime - restStartTime)) / 1000)}s
              </Text>
            )}
            {/* Dinlenme cooldown */}
            {!isResting && (currentTime - lastRestTime) < REST_COOLDOWN && (
              <Text style={{ color: '#ff9800', fontSize: 8 }}>
                Cooldown: {Math.ceil((REST_COOLDOWN - (currentTime - lastRestTime)) / 1000)}s
              </Text>
            )}
            {/* Toksik sıvı kalan süreleri */}
            {toxicAreas.filter(a => a.hasToxic).map((area, index) => {
              const now = currentTime;
              const elapsed = now - area.startTime;
              const remaining = Math.max(0, area.remainingTime - elapsed);
              const hours = Math.floor(remaining / (60 * 60 * 1000));
              const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
              const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
              return (
                <Text key={area.id} style={{ color: '#fff', fontSize: 8 }}>
                  {area.id}: {hours}s {minutes}dk {seconds}sn
                </Text>
              );
            })}
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
        
        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: '#4CAF50' }]}
          onPress={showToxicStatus}
        >
          <Text style={styles.menuButtonText}>Toksik Durum</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: '#FF9800' }]}
          onPress={() => setShowDeveloperPanel(prev => !prev)}
        >
          <Text style={styles.menuButtonText}>Geliştirici</Text>
        </TouchableOpacity>
      </View>
      
      {/* Geliştirici Panel */}
      {showDeveloperPanel && (
        <TouchableWithoutFeedback onPress={() => setShowDeveloperPanel(false)}>
          <View style={styles.developerPanel}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.developerPanelContent}>
                <Text style={styles.developerPanelTitle}>Geliştirici Paneli</Text>
                <TouchableOpacity
                  style={styles.developerButton}
                  onPress={resetToxicAreas}
                >
                  <Text style={styles.developerButtonText}>Toksik Alanları Sıfırla</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.developerButton}
                  onPress={fillToxicAreas}
                >
                  <Text style={styles.developerButtonText}>Toksik Alanları Doldur</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.developerButton}
                  onPress={fillToxicAreasTest}
                >
                  <Text style={styles.developerButtonText}>Toksik Alanları 30 saniye test süresiyle doldur</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
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
    top: 120,
    left: 20,
    zIndex: 10,
  },
  menuBar: {
    width: '100%',
    height: 70,
    backgroundColor: '#333',
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
  toxicAreaOverlay: {
    position: 'absolute',
    zIndex: 5,
    backgroundColor: 'transparent',
  },
  toxicPlacementOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 15,
    backgroundColor: 'rgba(0,255,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toxicPlacementInfo: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 40,
    backgroundColor: 'rgba(0,255,0,0.8)',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 24,
  },
  developerPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  developerPanelTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  developerButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  developerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  developerPanelContent: {
    padding: 20,
  },
  enemyOverlay: {
    position: 'absolute',
    zIndex: 5,
    backgroundColor: 'transparent',
  },
}); 