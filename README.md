# Seenly - Sosyal Algı ve Kişilik Değerlendirme Platformu

Seenly, kullanıcıların kendilerini nasıl değerlendirdiklerini ve arkadaşlarının onları nasıl algıladığını ölçen, interaktif ve oyunlaştırılmış bir sosyal algı platformudur.

## 🚀 Proje Hakkında

Seenly, kullanıcıların kendileri hakkında çeşitli soruları yanıtlayarak bir profil oluşturduğu, ardından bu profili arkadaşlarıyla paylaşarak "arkadaşlarımın gözünden ben" analizini görebildikleri bir web uygulamasıdır.

### Temel Özellikler
- **Kişisel Test (Self Quiz):** Profil sahibi kendi kişilik ve davranış kalıplarına yönelik soruları yanıtlar.
- **Arkadaş Testi (Friend Quiz):** Arkadaşlar, profil sahibini nasıl gördüklerine dair aynı soruları yanıtlar.
- **Sosyal Algı Analizi:** Arkadaşların verdiği cevaplar ile profil sahibinin kendi cevapları karşılaştırılarak algı doğruluğu (Accuracy) hesaplanır.
- **Oyunlaştırma (Gamification):** Cevaplayan arkadaşlar için algı stili (Reader Style), kazanılan tecrübe puanı (XP) ve seviye (Level) sistemi.
- **Güvenli ve Gizlilik Odaklı Dashboard:** Profil sahibinin arkadaşlarının detaylı veya maskelenmiş cevap analizlerini görebileceği panel.
- **Çoklu Dil Desteği:** Türkçe ve İngilizce dil desteği (Localization).

---

## 🛠️ Teknoloji Yığını

### Backend (Arka Ofis)
- **Dil:** Java 17
- **Çatı:** Spring Boot 3.2.5
- **Veritabanı:** PostgreSQL (Üretim/Production), H2 Database (Geliştirme/Bellek İçi)
- **Veri Erişimi:** Spring Data JPA
- **Araçlar & Kütüphaneler:** Maven, Lombok, Jakarta Validation
- **Mimari:** REST API (Controller, Service, Repository, DTO katmanları)

### Frontend (Önyüz)
- **Çatı/Dil:** React 18 (Vite tabanlı)
- **Tasarım/Stil:** Vanilla CSS (Özel premium temalar, responsive düzenler)
- **Yönlendirme (Routing):** Hash-based Router (`#/dashboard`, `#/friend/:slug` vb.)
- **Dil Desteği:** `LocaleContext` ve yerelleştirme JSON dosyaları (TR/EN)

---

## 📂 Proje Yapısı

```text
Seenly/
├── backend/                  # Spring Boot Java Projesi
│   ├── src/
│   │   ├── main/
│   │   │   └── java/com/seenly/backend/
│   │   │       ├── controller/   # API uç noktaları (Endpoints)
│   │   │       ├── dto/          # Veri transfer nesneleri (Data Transfer Objects)
│   │   │       ├── entity/       # Veritabanı varlıkları (JPA Entities)
│   │   │       ├── exception/    # Özel hata yakalama sınıfları (Custom Exceptions)
│   │   │       ├── repository/   # Veritabanı sorgu katmanı (Spring Data Repositories)
│   │   │       └── service/      # İş mantığı katmanı (Business Logic)
│   │   └── test/                 # Test sınıfları
│   └── pom.xml                   # Maven bağımlılık dosyası
│
└── frontend/                 # Vite & React Projesi
    ├── src/
    │   ├── components/           # Yeniden kullanılabilir React bileşenleri
    │   ├── content/
    │   │   └── locales/          # Dil dosyaları (TR/EN)
    │   ├── context/              # Context API (Dil vb.)
    │   ├── pages/                # Sayfa bileşenleri (Dashboard, Quiz, Result vb.)
    │   ├── services/             # API çağrı servisleri
    │   ├── App.jsx               # Ana uygulama bileşeni ve Router
    │   ├── index.css             # Genel stil dosyası
    │   └── main.jsx              # Giriş noktası
    ├── package.json              # Bağımlılıklar ve npm betikleri
    └── vite.config.js            # Vite yapılandırması
```

---

## ⚙️ Kurulum ve Çalıştırma

### 1. Gereksinimler
Projenin yerel ortamınızda çalışabilmesi için sisteminizde aşağıdaki araçların yüklü olması gerekir:
- **Java JDK 17** veya üzeri
- **Node.js** (v18+ önerilir) & npm
- **Maven** (veya IDE entegrasyonu)
- **PostgreSQL** (isteğe bağlı, varsayılan olarak H2 bellek içi veritabanı kullanılabilir)

---

### 2. Backend Geliştirme Ortamı
Backend dizinine gidin:
```bash
cd backend
```

#### Veritabanı Yapılandırması
Uygulama varsayılan olarak geliştirme modunda H2 bellek içi veritabanını kullanacak şekilde veya PostgreSQL'e bağlanacak şekilde ayarlanmıştır. Gerekli yapılandırmaları `backend/src/main/resources/application.properties` (varsa) veya ilgili ortam değişkenleriyle yapabilirsiniz.

#### Çalıştırma
Projeyi Maven üzerinden derlemek ve çalıştırmak için:
```bash
mvn spring-boot:run
```
Backend API varsayılan olarak `http://localhost:8080` portu üzerinde çalışmaya başlayacaktır.

---

### 3. Frontend Geliştirme Ortamı
Frontend dizinine gidin:
```bash
cd frontend
```

#### Bağımlılıkları Yükleme
Gerekli paketleri indirmek için:
```bash
npm install
```

#### Çalıştırma
Uygulamayı yerel geliştirme sunucusunda (Vite) başlatmak için:
```bash
npm run dev
```
Uygulama varsayılan olarak `http://localhost:5173` adresinde çalışacaktır. Tarayıcınızdan bu adrese giderek uygulamayı test edebilirsiniz.

---

## 🧪 API Uç Noktaları (Endpoints)

Backend tarafında sunulan temel REST API uç noktaları şunlardır:

| Metot | Uç Nokta | Açıklama |
| :--- | :--- | :--- |
| `POST` | `/api/v1/seenly/create` | Yeni profil oluşturur ve sahibinin cevaplarını kaydeder. |
| `GET` | `/api/v1/seenly/owner/{ownerToken}` | Sahip paneli (dashboard) verilerini getirir. |
| `GET` | `/api/v1/seenly/public/{publicSlug}` | Arkadaşların göreceği genel istatistikleri ve bilgileri getirir. |
| `POST` | `/api/v1/seenly/friend/{publicSlug}/respond` | Arkadaşın verdiği cevapları sisteme işler ve doğruluk skorunu hesaplar. |
| `POST` | `/api/v1/seenly/auth/send-code` | E-posta doğrulaması için simüle edilmiş doğrulama kodu gönderir. |
| `POST` | `/api/v1/seenly/auth/verify-code` | Gönderilen kodu doğrular. |
| `POST` | `/api/v1/seenly/auth/login-email` | E-posta doğrulama kodu ile giriş yapar ve geçici oturum anahtarı döndürür. |
| `POST` | `/api/v1/seenly/profile/{publicSlug}/increment-click` | Profil tıklanma/ziyaret sayısını artırır. |
