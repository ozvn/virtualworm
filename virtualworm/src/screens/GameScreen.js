import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Text, TouchableOpacity, Alert } from 'react-native';
import { Canvas, Circle, Path } from '@shopify/react-native-skia';
import { GameManager } from '../systems/GameManager';
import { 
  SCREEN, 
  WORM, 
  FOOD, 
  TOXIC, 
  ENEMY, 
  REST, 
  SPEED 
} from '../constants/GameConstants';
import { useNavigation } from '@react-navigation/native';

export default function GameScreen() {
  const gameManager = useMemo(() => new GameManager(), []);
  const [gameState, setGameState] = useState(null);
  const animationRef = useRef(null);
  const navigation = useNavigation();

  // Initialize game
  useEffect(() => {
    gameManager.initialize();
    setGameState(gameManager.getGameState());
  }, []);

  // Game loop
  useEffect(() => {
    let running = true;
    
    function gameLoop() {
      if (!running) return;
      
      gameManager.update();
      setGameState(gameManager.getGameState());
      
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    
    animationRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      running = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (!gameState || !gameState.toxicAreas) return null;

  const {
    worm, foods, enemies, toxicAreas, target, direction, frame, wormAngle,
    currentTime, placingFood, isPlacingToxic, selectedToxicArea, showDeveloperPanel,
    restState, speedState
  } = gameState;

  // Food drop handler
  const handleFoodDrop = (e) => {
    if (!placingFood) return;
    const { locationX, locationY } = e.nativeEvent;
    if (locationY > SCREEN.HEIGHT - SCREEN.MENU_BAR_HEIGHT) return;
    
    gameManager.placeFood(locationX, locationY);
    gameManager.setPlacingFood(false);
    setGameState(gameManager.getGameState());
  };

  // Toxic area press handler
  const handleToxicAreaPress = (area) => {
    const message = gameManager.toxicSystem.getRenewalMessage(area, gameManager.currentTime);

    Alert.alert(
      message.title,
      message.message,
      [
        { text: "İptal", style: "cancel", onPress: () => {
          // İptal'e basılırsa hiçbir şey yapma, state değişmesin
          setGameState(gameManager.getGameState());
        } },
        ...(message.canRenew ? [{
          text: "Yenile",
          onPress: () => {
            gameManager.handleToxicAreaPress(area); // Sadece Yenile'ye basılırsa state güncelleniyor
            setGameState(gameManager.getGameState());
          }
        }] : [])
      ]
    );
  };

  // Enemy press handler
  const handleEnemyPress = (enemy) => {
    gameManager.removeEnemy(enemy.id);
    setGameState(gameManager.getGameState());
  };

  // Developer panel functions
  const resetToxicAreas = () => {
    gameManager.resetToxicAreas();
    setGameState(gameManager.getGameState());
    Alert.alert("Geliştirici", "Toksik alanlar sıfırlandı!");
  };

  const fillToxicAreas = () => {
    gameManager.fillToxicAreas();
    setGameState(gameManager.getGameState());
    Alert.alert("Geliştirici", "Tüm toksik alanlar dolduruldu!");
  };

  const fillToxicAreasTest = () => {
    gameManager.fillToxicAreasTest();
    setGameState(gameManager.getGameState());
    Alert.alert("Geliştirici", "Tüm toksik alanlar 30 saniye test süresiyle dolduruldu!");
  };

  const showToxicStatus = () => {
    const statusText = gameManager.showToxicStatus();
    Alert.alert("Toksik Sıvı Durumu", statusText);
  };

  return (
    <View style={styles.container}>
      {/* Açlık ve Can Göstergesi */}
      <View style={{ position: 'absolute', top: 60, left: 0, right: 0, zIndex: 30, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12, padding: 8 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', marginRight: 16 }}>Can: {Math.round(gameState.health)}</Text>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Açlık: {Math.round(gameState.hunger)}</Text>
        </View>
      </View>
      <View style={styles.canvasWrapper}>
        <Canvas style={styles.canvas}>
          {/* Alt duvar (menü barının üstü) */}
          <Circle cx={SCREEN.WIDTH / 2} cy={SCREEN.HEIGHT - SCREEN.MENU_BAR_HEIGHT} r={2} color="#fff" />
          
          {/* Solucan */}
          <Circle cx={worm.x} cy={worm.y} r={WORM.SIZE / 2} color="green" />
          
          {/* Algı alanı (yarı saydam yuvarlak) */}
          <Circle cx={worm.x} cy={worm.y} r={WORM.SENSE_RADIUS} color="rgba(0,200,255,0.13)" />
          
          {/* Besinler (kırmızı noktalar) */}
          {foods.map((f, i) => (
            <Circle key={i} cx={f.x} cy={f.y} r={FOOD.SIZE / 2} color="red" />
          ))}
          
          {/* Hedef (mavi nokta, her zaman göster) */}
          {target && !isPlacingToxic && (
            <Circle cx={target.x} cy={target.y} r={4} color="#00f" />
          )}
          
          {/* Toksik sıvı alanları */}
          {toxicAreas.map((area) => {
            const status = gameManager.toxicSystem.getToxicAreaStatus(area, currentTime);
            
            return (
              <React.Fragment key={area.id}>
                {/* Alan çerçevesi */}
                <Circle 
                  cx={area.x} 
                  cy={area.y} 
                  r={TOXIC.AREA_SIZE / 2} 
                  color={area.hasToxic 
                    ? (status.isActive ? "rgba(0,255,0,0.4)" : "rgba(255,0,0,0.4)") 
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
                      r={TOXIC.AREA_SIZE / 3} 
                      color={status.isActive ? "rgba(0,255,0,0.6)" : "rgba(255,0,0,0.6)"}
                    />
                    <Circle 
                      cx={area.x} 
                      cy={area.y} 
                      r={TOXIC.AREA_SIZE / 6} 
                      color={status.isActive ? "rgba(0,255,0,1)" : "rgba(255,0,0,1)"}
                    />
                  </>
                )}
              </React.Fragment>
            );
          })}
          
          {/* Düşmanlar (mor huni şeklinde) */}
          {enemies.map((enemy) => {
            const centerX = enemy.x;
            const centerY = enemy.y;
            const radius = ENEMY.SIZE;
            
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
              left: enemy.x - ENEMY.SIZE,
              top: enemy.y - ENEMY.SIZE,
              width: ENEMY.SIZE * 2,
              height: ENEMY.SIZE * 2,
            }]}
            onPress={() => handleEnemyPress(enemy)}
          />
        ))}
        
        {/* Toksik sıvı alanlarına tıklama overlay'i */}
        {toxicAreas.map((area) => (
          <TouchableOpacity
            key={area.id}
            style={[styles.toxicAreaOverlay, {
              left: area.x - TOXIC.AREA_SIZE / 2,
              top: area.y - TOXIC.AREA_SIZE / 2,
              width: TOXIC.AREA_SIZE,
              height: TOXIC.AREA_SIZE,
            }]}
            onPress={() => handleToxicAreaPress(area)}
          />
        ))}
        
        {/* Besin bırakma modu */}
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
        
        {/* Debug Info */}
        <View style={styles.debugInfo} pointerEvents="none">
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>x: {Math.round(worm.x)}, y: {Math.round(worm.y)}</Text>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>Can: {Math.round(gameState.health)}, Açlık: {Math.round(gameState.hunger)}</Text>
          <Text style={{ color: '#fff', fontSize: 13 }}>Frame: {frame}</Text>
          <Text style={{ color: '#fff', fontSize: 13 }}>Yön: {direction}</Text>
          <Text style={{ color: '#fff', fontSize: 13 }}>Açı: {Math.round(wormAngle)}</Text>
          <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontSize: 16 }}>Yön: {direction}</Text>
            <Text style={{ color: '#fff', fontSize: 12 }}>
              Aktif Toksik: {gameManager.getActiveToxicAreasCount()}/4
            </Text>
            <Text style={{ color: '#fff', fontSize: 12 }}>
              Düşman: {enemies.length}
            </Text>
            <Text style={{ color: '#fff', fontSize: 10 }}>
              Yeni düşman: {Math.ceil(gameManager.getEnemySpawnRemaining() / 1000)}s
            </Text>
            <Text style={{ color: '#fff', fontSize: 10 }}>
              {isPlacingToxic ? 'Toksik Bırakılıyor...' : (restState.isResting ? 'Dinleniyor...' : 'Hazır')}
            </Text>
            <Text style={{ color: '#fff', fontSize: 10 }}>
              Solucan: x={Math.round(worm.x)}, y={Math.round(worm.y)}
            </Text>
            {/* Hız durumu */}
            <Text style={{ 
              color: speedState.isBursting ? '#ff4444' : (restState.isResting ? '#ffeb3b' : '#4caf50'), 
              fontSize: 10 
            }}>
              Hız: {Math.round(speedState.speedMultiplier * 100)}%
              {speedState.isBursting && ' (DEPAR!)'}
            </Text>
            {/* Dinlenme süresi */}
            {restState.isResting && (
              <Text style={{ color: '#ffeb3b', fontSize: 10 }}>
                Dinlenme: {Math.ceil((restState.restDuration - (currentTime - restState.restStartTime)) / 1000)}s
              </Text>
            )}
            {/* Dinlenme cooldown */}
            {!restState.isResting && (currentTime - restState.lastRestTime) < REST.COOLDOWN && (
              <Text style={{ color: '#ff9800', fontSize: 8 }}>
                Cooldown: {Math.ceil((REST.COOLDOWN - (currentTime - restState.lastRestTime)) / 1000)}s
              </Text>
            )}
            {/* Toksik sıvı kalan süreleri */}
            {toxicAreas.filter(a => a.hasToxic).map((area) => {
              const status = gameManager.toxicSystem.getToxicAreaStatus(area, currentTime);
              const hours = Math.floor(status.remaining / (60 * 60 * 1000));
              const minutes = Math.floor((status.remaining % (60 * 60 * 1000)) / (60 * 1000));
              const seconds = Math.floor((status.remaining % (60 * 1000)) / 1000);
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
          onPress={() => {
            gameManager.setPlacingFood(!placingFood);
            setGameState(gameManager.getGameState());
          }}
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
          onPress={() => {
            gameManager.setShowDeveloperPanel(!showDeveloperPanel);
            setGameState(gameManager.getGameState());
          }}
        >
          <Text style={styles.menuButtonText}>Geliştirici</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: '#2196F3' }]}
          onPress={() => navigation.navigate('GameArea')}
        >
          <Text style={styles.menuButtonText}>Oyun Alanı Oluştur</Text>
        </TouchableOpacity>
      </View>
      
      {/* Geliştirici Panel */}
      {showDeveloperPanel && (
        <TouchableWithoutFeedback onPress={() => {
          gameManager.setShowDeveloperPanel(false);
          setGameState(gameManager.getGameState());
        }}>
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
    height: SCREEN.MENU_BAR_HEIGHT,
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
    backgroundColor: 'rgba(0,0,0,0.08)',
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