# PRD: Virtual Worm (React Native)

## Ürün Adı
**Virtual Worm**

## Amaç
Kullanıcıların, gerçekçi bir solucan simülasyonu ile etkileşime geçtiği, beslediği, geliştirdiği ve sosyal alanlarda diğer oyuncularla buluşturduğu bir mobil oyun.

## Hedef Platformlar
- Android
- iOS

## Kullanılacak Teknolojiler ve Kütüphaneler
- **React Native**: Temel uygulama çatısı
- **react-native-game-engine**: Oyun döngüsü ve temel oyun mantığı
- **react-native-skia** veya **react-native-canvas**: 2D grafikler ve animasyonlar
- **react-native-sensors**: İvmeölçer ve diğer sensörler
- **react-native-maps**: Lokasyon tabanlı oyun alanı
- **react-navigation**: Ekranlar arası geçiş
- **Redux veya Context API**: Global state yönetimi
- **Firebase**: (Opsiyonel) Gerçek zamanlı veri, authentication, analytics

## Temel Özellikler
1. **Solucan Simülasyonu**
   - Basit hareket motoru (OpenWorm'den alınan algoritma)
   - Canvas üzerinde serbest hareket
   - Besinlere yönelme
   - **OpenWorm Hareket Sistemi Entegrasyonu:**
     - Solucan hareketi, sadeleştirilmiş bir yapay sinir ağı ile belirlenir.
     - Her hareket adımında, sensoryInputs (ör: rastgele değerler veya oyun içi inputlar) alınır.
     - Bu inputlar, birkaç katmanlı nöronlardan geçirilerek bir yön (up, down, left, right) seçilir.
     - Hareket algoritması TypeScript/JavaScript ile kolayca React Native'e entegre edilebilir.
     - Örnek fonksiyonlar: sigmoid, relu, tanh, softmax aktivasyonları; Neuron sınıfı; getWormNextDirection ve getNextPosition fonksiyonları.
     - **Kullanım Örneği:**
       ```js
       // Başlangıç pozisyonu
       let worm = { x: 0, y: 0 };
       // Her hareket adımında:
       const sensoryInputs = [Math.random(), Math.random(), Math.random()];
       const direction = getWormNextDirection(sensoryInputs);
       worm = getNextPosition(worm, direction);
       ```
     - sensoryInputs alanı, oyun içi besin, engel, oyuncu hareketi gibi faktörlerle genişletilebilir.

2. **Besleme ve Geliştirme**
   - Sandıklardan veya minigamelerden çıkan besinlerle besleme
   - Zeka, can, sosyallik, mutluluk statları
   - Statların zamanla azalması ve aksiyonlarla artması

3. **Oyun Alanı Oluşturma**
   - Lokasyon bazlı 100m çapında alan oluşturma
   - Diğer oyuncuların katılımı ve idle sosyalleşme
   - 3+ oyuncu ile drop sistemi

4. **Savunma ve Toksik Sıvı**
   - Canvas çevresine toksik sıvı bırakma
   - Saldırı simülasyonu (virüs gibi düşmanlar)
   - Sıvı üretimi ve zamanlayıcı

5. **Sandık Sistemi**
   - Günlük sandık açma
   - Sandıktan çıkan itemlar: besin, alan oluşturucu vb.

6. **Görevler ve Geri Bildirim**
   - Günlük görevler ve ödüller
   - Kullanıcı testleri ve feedback toplama

7. **Kelebeğe Dönüşüm**
   - Uzun süre gelişen worm'ün kelebeğe dönüşmesi

## Yol Haritası (Roadmap)

| Hafta | Hedefler |
|-------|----------|
| 1     | Proje kurulumu, temel ekranlar, oyun motoru ve canvas kurulumu |
| 2     | Solucan hareketi ve input sistemi, besin objesi |
| 3     | Lokasyon ve oyun alanı sistemi, idle sosyalleşme |
| 4     | Toksik sıvı ve savunma mekanizması, saldırı simülasyonu |
| 5     | Sandık ve stat sistemi, UI geliştirme |
| 6     | Görevler, testler, feedback ve MVP yayını |

## Klasör Yapısı Önerisi

```
virtualworm/
├── src/
│   ├── components/         # React Native bileşenleri
│   ├── engine/             # Oyun motoru ve hareket algoritmaları
│   ├── screens/            # Uygulama ekranları
│   ├── assets/             # Görseller, sesler
│   ├── store/              # State yönetimi (Redux/Context)
│   ├── services/           # API, Firebase, sensör servisleri
│   └── utils/              # Yardımcı fonksiyonlar
├── App.js                  # Giriş noktası
├── package.json            # Bağımlılıklar
├── PRD_ReactNative.md      # Bu doküman
└── readme.md               # Genel proje açıklaması
```

## Başarı Kriterleri (MVP)
- Solucan hareket ve besin takibi çalışıyor
- Oyun alanı oluşturulabiliyor ve başkaları katılabiliyor
- Toksik sıvı ve savunma mekanizması aktif
- Sandık ve stat sistemi çalışıyor
- Görevler ve feedback mekanizması mevcut
- Beta yayını ve analytics entegrasyonu tamam

---

Daha fazla detay veya örnek kod isterseniz, adım adım ilerleyebiliriz! 