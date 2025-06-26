Fikir: 

Bir mobil oyun.
Platformlar: Android ve IOS

Openworm adında bir proje var. Bir laboratuar, bir solucanın yaşam formunu %100 olarak sanala aktarmış ve bütün kas sinir sistemleri ile simüle edilmiş bir versiyonu var.

Bunu kullanarak bir mobil oyun geliştireceğim. Şimdilik oyunun adı Virtual Worm;

Kodların sadece hareket sisteminden faydalanacağım belirli inputlar o koda girecek ve worm'ün canvas içerisindeki free hareketleri sağlanacak.

Kullanıcı eğer canvas'a besin bırakırsa worm ona yönlecenek.

Oyunda solucanını;
besleme: sandıklardan veya minigamelerden çıkan besinleri solucanına vererek
geliştirme: zeka, can, sosyallik ve mutluk değerlerini geliştirme, değerlerin inişli çıkışlı olması ve ilgi gerekliliği
günlük sandıklar: günlük sandıklar açarak itemlar elde etme.
bazı örnek itemlar:
1- besin
2- oyun alanı oluşturma item'ı

oyun alanı oluşturma itemı nedir?
herhangi bir lokasyondayken oyun alanı oluştur dersen 100 metrelik çevrende bir oyun alanı oluşur ve herke buna katılabilir. idle bir şekilde wormleri bu alanda sosyalleşir.
oyun alanında 3'den fazla worm varsa droplar açılır ve oyun alanına itemlar düşebilir.

worm'ün kendini savunması;
worm'e düzenli saldırılar olur worm kendini savunmak için içerisinde bulunduğu canvas'ın çevresine zehirli tarret mantığında toksik sıvı bırakmalı ve bunu düzenli olarak yenilemelidir. 48 saatte bir sıvı biter. 12 saatte bir sıvı süresi yenilenir.

sandık açma ek mekanizması; telefonda ivme ölçer sensörler ile yükseklik algılanır. kullanıcı riskli sandığı açmak için telefonunu 1 metreden daha fazla havaya atıp tutmalıdır.

worm'ler uzun süre gelişimini tamamladıktan sonra kelebeğe dönüşür.

(Roadmap)
Zaman	Hedef
Hafta 1	Hareket motoru + canvas + inputlara göre besin takibi (çekirdek mekanik)
Hafta 2	Oyun alanı kurma sistemi (harita konumlu sistem + idle sosyalleşme temeli)
Hafta 3	Toksik sıvı sistemi + saldırı simülasyonu (canvas çevresi)
Hafta 4	Sandık sistemi + statlar + UI (daha soft sistemler)
Hafta 5	Günlük görevler + mini testler + kullanıcı geri bildirimi
Hafta 6	MVP yayını + analytics entegrasyonu


MVP:
✅ Hafta 1: Temel Hareket ve Besin Takibi
[Task] Canvas içinde solucan hareket sistemi

OpenWorm motoru ile canvas’ta simülasyon temelli hareket sağlanacak.

[Task] Input üzerinden hedef yönelimi

Kullanıcı tarafından bırakılan input (örneğin besin) algılandığında solucan hedefe yönelmeli.

[Task] Besin objesi tanımı

Besinler canvas'a bırakılabilir nesne olarak tanımlanmalı ve hedeflenebilir olmalı.

[Deliverable]: Solucan inputa tepki vererek yön değiştirebiliyor.

✅ Hafta 2: Oyun Alanı Kurma Mekaniği
[Task] Lokasyon servislerinin entegrasyonu

Oyuncunun fiziksel lokasyonu kullanılabilir hale getirilecek (örn. GPS).

[Task] "Oyun alanı oluştur" UI & mantık

Oyuncu, bulunduğu lokasyonda 100m çaplı bir alan oluşturabilecek.

[Task] Oyun alanı etkileşim sistemi

Diğer oyuncular oyun alanını görebilmeli ve kendi worm’leriyle idle olarak katılabilmeli.

[Task] 3+ oyuncu olunca drop sistemi

Oyunda aynı alanda 3'ten fazla oyuncu varsa otomatik droplar tetiklenmeli.

[Deliverable]: Alan oluşturulabiliyor, başkaları katılabiliyor ve sistem çalışıyor.

✅ Hafta 3: Toksik Sıvı Sistemi ve Savunma
[Task] Toksik sıvı üretimi zamanlayıcı sistemi

48 saatte bir sıvı biter, 12 saatte bir yenilenebilir.

[Task] Canvas içinde sıvı alanı bırakma

Solucan çevresine belirli aralıklarla sıvı bırakmalı.

[Task] Düşman simülasyonu (placeholder AI)

Basit saldırgan bir varlık (örn. virüs) sıvı olmayan alanlara saldırı yapabilir.

[Deliverable]: Oyuncunun sıvı üretip bırakması ve savunma çalışıyor.

✅ Hafta 4: Sandık Sistemi ve Stat Yönetimi
[Task] Günlük sandık sistemi

Oyuncular her gün ücretsiz sandık açabilir.

[Task] Sandık içeriği: besin, item, alan oluşturucu

Loot çeşitleri oluşturulacak ve oranları belirlenecek.

[Task] Stat sistemleri (zeka, mutluluk, sosyallik, can)

Her stat zamanla düşer, belirli aksiyonlarla artar.

[Task] Stat UI

Kullanıcı bu statları görebilir ve etkilerini hissedebilir.

[Deliverable]: Sandık açılıyor, statlar artıyor/azalıyor.

✅ Hafta 5: Görevler ve Test Süreci
[Task] Günlük görev sistemi

Basit görevler: "Worm’ünü 2 kere besle", "Oyun alanı oluştur" gibi görevler listelenir.

[Task] Görev UI’si

Görevler kullanıcıya gösterilmeli ve tamamlandıklarında ödüller verilmeli.

[Task] Kullanıcı testleri (5–10 kişi ile test)

Oyunun temel akışı, hatalar ve kullanıcı deneyimi test edilir.

[Task] Feedback toplayıcı ekran/form

Oyundan sonra çıkan basit bir anket ya da mail adresi ile geri bildirim toplanır.

[Deliverable]: Oyunun ilk test versiyonu kullanıcıdan feedback alıyor.

✅ Hafta 6: MVP Yayını ve Hazırlık
[Task] TestFlight (iOS) ya da Android beta yayını

Uygulama mağazalarına beta sürüm yüklenmeli.

[Task] Basit analytics entegrasyonu

Stat düşüşü, giriş süreleri, sandbox kullanımı vs. takip edilmeli.

[Task] Hata toplama ve takip sistemi

Crash logları, bug raporları merkezi sistemde toplanmalı.

[Task] Roadmap sonrası planlama

MVP sonrası yapılacak yeni özellikler listelenmeli.

[Deliverable]: Yayınlanabilir, test edilebilir bir MVP sürümü.


