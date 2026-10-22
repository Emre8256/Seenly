# 10Signal — Social Perception & Personality Platform

10Signal, bireylerin kendilerini nasıl gördükleri (*Self View*) ile çevrelerindeki insanların onları nasıl deneyimlediklerini (*Outside View*) karşılaştıran iki katmanlı bir sosyal algı, kişilik analizi ve ayna platformudur.

Kullanıcı önce 10 temel sosyal sinyal üzerinden kendini değerlendirir; ardından ürettiği özel davet bağlantısıyla arkadaşlarından anonim değerlendirmeler toplar. Sistem; kör noktaları, illüzyonları, kimlik kartlarını ve arkadaşların tahmin doğruluğunu psikometrik modellerle hesaplar.

---

## 1. Sistem Mimarisi

```text
┌─────────────────────────────────┐
│     İstemci Tarayıcısı (SPA)     │
│   React 18 + Vite + Tailwind 4  │
└────────────────┬────────────────┘
                 │ HTTPS / JSON API
                 ▼
┌─────────────────────────────────┐
│  Ters Vekil (Reverse Proxy)     │  <-- SSL/TLS Terminasyonu (HTTPS)
│   (Hedef: api.10signal.me)      │  <-- TRUSTED_PROXY_CIDRS koruması
└────────────────┬────────────────┘
                 │ HTTP (İç Ağ)
                 ▼
┌─────────────────────────────────┐       ┌──────────────────────────────┐
│     Spring Boot 3.2.5 API       │ ----> │    PostgreSQL 16 Database    │
│       (Java 17 LTS JRE)         │       │  Flyway Migration (V1 - V8)  │
│  Port 8080 (API) / 8081 (Mgmt)  │       └──────────────────────────────┘
└───────┬─────────────────┬───────┘
        │                 │
        ▼                 ▼
┌───────────────┐ ┌──────────────────────────────┐
│ Brevo REST API│ │  Lemon Squeezy Webhooks      │
│  (Outbox ile  │ │ (Plus & Kapasite Paketleri)  │
│  asenkron)    │ │ (HMAC-SHA256 Doğrulama)      │
└───────────────┘ └──────────────────────────────┘
```

---

## 2. Teknoloji Yığını

### Frontend (`frontend/`)
- **Çalışma Zamanı & Derleyici:** Node.js (>=20), React `18.3.1`, Vite `7.x`
- **Stil & Tasarım:** Tailwind CSS `v4`, Modern Editorial "Porselen / Paper Wash" teması, Fraunces serif & Geist fontları
- **Yönlendirme:** Native Hash-Based Routing (`#/`, `#/dashboard`, `#/settings`, `#/identities`, `#/faq`, `#/plans`, `#/friend/:slug`)
- **Sosyal Kart & Paylaşım:** `html2canvas` ve dinamik Canvas 2D render motoru (Instagram Story & WhatsApp)
- **Çoklu Dil (i18n):** `LocaleContext` (Türkçe `tr` ve İngilizce `en` tam simetrik JSON katalogları)
- **Test:** Vitest 3, React Testing Library, Playwright (E2E)

### Backend (`backend/`)
- **Çalışma Zamanı & Çatı:** Java 17 LTS, Spring Boot `3.2.5`
- **Veri & ORM:** Spring Data JPA, Hibernate 6, HikariCP, PostgreSQL 16
- **Veritabanı Migration:** Flyway (V1 - V8 forward-only migration zinciri)
- **İşlem Modeli:** Transactional Outbox Pattern (`email_outbox`), `@Version` iyimser kilit, `FOR UPDATE SKIP LOCKED`
- **Güvenlik & Kriptografi:** SHA-256 token/slug hashing, AES-256-GCM OTP payload şifreleme, IP/Fingerprint rate-limiting, Spring Security CORS filtreleri
- **Gözlemlenebilirlik:** Micrometer, Prometheus (`/actuator/prometheus`), Logback JSON structured logging, güvenlik denetim günlüğü (`tensignal.audit`)
- **E-posta Entegrasyonu:** Brevo Transactional Email REST API v3
- **Ödeme Entegrasyonu:** Lemon Squeezy (Plus abonelik/ömür boyu erişim & kapasite paketleri)

---

## 3. Dizin Organizasyonu

```text
10Signal/
├── README.md                      # Ana proje kılavuzu (bu belge)
├── PROJECT_DOCUMENTATION.md       # Detaylı mimari, psikometri ve algoritma spesifikasyonu
├── docker-compose.dev.yml         # Yerel geliştirme PostgreSQL container yapılandırması
├── .gitignore                     # Git tarafından takip edilmeyen dosya kuralları
│
├── docs/                          # Ortak mimari ve entegrasyon dokümantasyonu
│   └── email-notifications.md     # Brevo transactional outbox mimarisi ve test kılavuzu
│
├── performance/                   # Yük ve performans testi script'leri
│   ├── k6-tensignal.js            # k6 yük testi senaryosu
│   └── node-load.mjs              # Node.js tabanlı kapsamlı API stres ve sınır testi
│
├── frontend/                      # React / Vite SPA istemci uygulaması
│   ├── src/                       # Bileşenler, sayfalar, hook'lar, servisler, i18n
│   ├── public/                    # Statik varlıklar (favicons, manifest)
│   ├── scripts/                   # Bundle budget ve i18n doğrulama araçları
│   ├── .env.example               # Frontend ortam değişkeni şablonu
│   └── package.json               # Frontend bağımlılıkları ve script'leri
│
└── backend/                       # Spring Boot REST API servisi
    ├── src/main/java/             # Controller, service, repository, entity, email, payment
    ├── src/main/resources/        # application.yml, migrations, i18n email şablonları
    ├── src/test/java/             # MockMvc ve entegrasyon test takımları
    ├── Dockerfile                 # Multi-stage production container tanımı
    ├── .env.example               # Backend ortam değişkeni şablonu
    ├── PRODUCTION_MIGRATION.md    # Veritabanı yükseltme ve Flyway rehberi
    ├── PRODUCTION_OBSERVABILITY.md# Metrikler, JSON log formatı ve alarm eşikleri
    ├── PRODUCTION_PERFORMANCE.md  # Performans kıyaslamaları ve optimizasyon raporu
    ├── PRODUCTION_RESILIENCE.md   # Hata toleransı, outbox worker ve kurtarma planı
    └── pom.xml                    # Maven bağımlılıkları ve compiler ayarları
```

---

## 4. Geliştirme Ortamı Gereksinimleri

Aşağıdaki yazılımların geliştirici makinesinde kurulu olması gerekir:

| Araç | Minimum Sürüm | Test Edilen Sürüm |
| :--- | :--- | :--- |
| **Node.js** | `>= 20.0.0` | `24.12.0 LTS` |
| **npm** | `>= 10.0.0` | `11.6.2` |
| **Java JDK** | `>= 17 LTS` | `OpenJDK 21 Temurin (Java 17 bytecode hedefi)` |
| **Apache Maven** | `>= 3.9.0` | `3.9.9` |
| **Docker & Compose**| `>= 24.0.0` | Docker Desktop / Docker Engine |

---

## 5. Hızlı Başlangıç (Local Development)

### Adım 1: Yerel PostgreSQL Veritabanını Başlatın

Repository kökünde bulunan Docker Compose dosyasıyla geliştirme veritabanını ayağa kaldırın:

```powershell
docker compose -f docker-compose.dev.yml up -d
```

- **Host:** `localhost:5432`
- **Database:** `seenly_dev`
- **User:** `seenly_dev`
- **Password:** `seenly_dev_password`

*(Not: Tablo isimleri ve veritabanı adı teknik geriye dönük uyumluluk nedeniyle `seenly_*` formatında korunmaktadır.)*

### Adım 2: Backend Servisini Çalıştırın

1. `backend/` dizinine geçin ve ortam şablonunu kopyalayın:
   ```powershell
   cd backend
   Copy-Item .env.example .env
   ```
2. Geliştirme profili varsayılan olarak `dev` olarak ayarlanmıştır (`application-dev.yml`).
3. Uygulamayı Maven ile derleyip başlatın:
   ```powershell
   mvn spring-boot:run
   ```
4. Backend API `http://localhost:8080`, yönetim portu `http://localhost:8081` üzerinde çalışacaktır. Flyway migration'ları otomatik olarak uygulanır.

### Adım 3: Frontend İstemcisini Çalıştırın

1. Ayrı bir terminalde `frontend/` dizinine geçin:
   ```powershell
   cd frontend
   npm ci
   ```
2. Geliştirme sunucusunu başlatın:
   ```powershell
   npm run dev
   ```
3. Tarayıcınızda `http://localhost:3000` adresini açın. Vite geliştirme proxy'si `/api` isteklerini otomatik olarak `http://localhost:8080` adresine iletir.

---

## 6. Test ve Derleme Komutları

### Frontend Komutları (`frontend/`)

```powershell
# Vitest birim ve entegrasyon testlerini çalıştırır (95 test)
npm test

# Dil dosyaları arasındaki (TR/EN) anahtar simetrisini doğrular
npm run i18n:validate

# Production bundle derlemesini oluşturur (dist/)
npm run build

# Production derlemesini yapar ve JavaScript bütçe limitlerini (gzip < 85KB) denetler
npm run build:budget

# Playwright tarayıcı uçtan uca testlerini çalıştırır
npm run test:e2e
```

### Backend Komutları (`backend/`)

```powershell
# Tüm birim, servis ve MockMvc entegrasyon testlerini çalıştırır (258 test)
mvn test

# Testleri atlayarak production JAR paketini oluşturur (target/backend-0.0.1-SNAPSHOT.jar)
mvn package -DskipTests

# Belirli bir entegrasyon testini çalıştırmak için:
mvn test -Dtest=SecurityHardeningIntegrationTest
```

*(Not: `PostgreSqlMigrationIntegrationTest`, yerel ortamda Docker daemon aktif olmadığında `@Testcontainers(disabledWithoutDocker = true)` ile güvenli şekilde atlanır. Diğer 256 test yerel test veritabanında eksiksiz çalışır.)*

---

## 7. Ortam Değişkenleri ve Konfigürasyon Prensipleri

10Signal, Twelve-Factor App prensiplerine tam uyumludur. Hiçbir şifre, API anahtarı veya secret kaynak kodda saklanmaz.

- `backend/.env.example`: Backend için production ve dev ortam değişkeni referansı.
- `frontend/.env.example`: Frontend için `VITE_API_URL` yapılandırması.

### Kritik Ortam Değişkenleri:

| Değişken | Açıklama | Örnek / Varsayılan |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | Aktif Spring profili (`dev` veya `prod`) | `dev` |
| `DEPLOYMENT_ENVIRONMENT` | Dağıtım ortamı göstergesi (`development` / `production`) | `production` |
| `SPRING_DATASOURCE_URL` | Production PostgreSQL JDBC bağlantı adresi | `jdbc:postgresql://postgres:5432/tensignal_prod` |
| `CORS_ALLOWED_ORIGINS` | İzin verilen frontend alan adları (wildcard yasaktır) | `https://10signal.me` |
| `TRUSTED_PROXY_CIDRS` | Güvenilen ters vekil IP blokları (X-Forwarded-For) | `127.0.0.1/32` |
| `EMAIL_PROVIDER` | E-posta sağlayıcısı (`brevo`, `smtp`, `disabled`) | `brevo` |
| `BREVO_API_KEY` | Brevo REST API anahtarı | `xkeysib-...` |
| `EMAIL_OTP_PAYLOAD_SECRET` | Outbox OTP payload AES-256-GCM şifreleme anahtarı (>=32 karakter) | Rastgele 256-bit secret |
| `PAYMENT_PROVIDER` | Ödeme sağlayıcısı (`lemonsqueezy`, `disabled`) | `lemonsqueezy` |
| `LEMON_SQUEEZY_WEBHOOK_SECRET` | Lemon Squeezy webhook imza doğrulama anahtarı | `whsec_...` |

---

## 8. Veritabanı ve Migration (Flyway)

Veritabanı şema evrimi `backend/src/main/resources/db/migration/` altındaki SQL dosyalarıyla yönetilir:

- `V1__initial_schema.sql`: Temel tablolar (`users`, `seenlys`, `response_sessions`, `self_answers`, vb.)
- `V2__harden_legacy_security_state.sql`: Oturum kolonları, IP/fingerprint SHA-256 normalizasyonu, rate-limit tabloları
- `V3__production_resilience_and_payment_ledger.sql`: Ödeme hareket defteri, webhook tekillik kayıtları
- `V4__add_preferred_locale_to_users_and_seenlys.sql`: TR/EN kullanıcı tercihi desteği
- `V5__create_email_outbox_table.sql`: Transactional Outbox altyapısı (`email_outbox`)
- `V6__add_otp_salt_and_rename_hash_column.sql`: Güçlendirilmiş PBKDF2 OTP tuzlama kolonları
- `V7__create_user_notification_preferences_table.sql`: Kullanıcı bildirim tercihleri
- `V8__add_avatar_slug_to_users_and_seenlys.sql`: Karakter avatarları desteği

**Migration İlkeleri:**
- Migration'lar kesinlikle ileriye doğrudur (forward-only).
- Hibernate `ddl-auto: validate` modunda çalışır; veritabanı nesnelerini asla otomatik oluşturmaz veya değiştirmez.
- Production ortamında `clean-disabled: true` aktiftir; veri kaybına yol açabilecek sıfırlama komutları engellenmiştir.

---

## 9. E-posta ve Ödeme Mimarisi

### E-posta (Brevo & Transactional Outbox)
- **Doğrudan Ağ Çağrısı Yok:** Kullanıcı kayıt, giriş veya arkadaş değerlendirme istekleri sırasında SMTP/API çağrısı beklenmez.
- **Outbox Garantisi:** Bildirimler iş mantığıyla aynı veritabanı transaction'ında `email_outbox` tablosuna yazılır.
- **Şifreleme:** OTP kodları veritabanında açık tutulmaz; authenticated AES-256-GCM ile şifrelenir.
- **Asenkron Worker:** `@Scheduled` `EmailOutboxWorker`, `FOR UPDATE SKIP LOCKED` ile dağıtık güvenli kilit kullanarak kayıtları çeker, Brevo REST API üzerinden gönderir ve üstel geri çekilme (exponential backoff) uygular.

### Ödeme (Lemon Squeezy)
- **Paketler:** Plus Erişim, +50, +150 ve +300 Yanıt Kapasitesi.
- **Güvenli Webhook:** Gelen webhook istekleri HMAC-SHA256 imzasıyla doğrulanır.
- **Idempotency:** İşlenen tüm `event_id` değerleri `payment_provider_events` tablosunda saklanır; aynı olayın mükerrer hak tanımlaması engellenir.

---

## 10. Hedef Production Mimarisi

Gelecek Aşama 4 dağıtımında uygulanacak mimari:

1. **Frontend:** Netlify üzerinde CDN destekli SPA hosting (`https://10signal.me`).
2. **Backend:** Docker container içinde izole çalışan Spring Boot servisi (`https://api.10signal.me`).
3. **Database:** Docker container içinde çalışan PostgreSQL 16 (kalıcı host volume, dış internete kapalı).
4. **SSL / Reverse Proxy:** Nginx veya Caddy üzerinden HTTPS terminasyonu, HTTP -> HTTPS yönlendirmesi.
5. **Yönetim İzolasyonu:** Port 8081 (Prometheus/Actuator) genel internete kapatılarak yalnızca şirket içi izleme ağına açılır.

---

## 11. Güvenlik ve Üretim Güvenliği Kontrolleri

Backend bünyesindeki otomatik startup doğrulayıcıları:

- **`ProfileSafetyValidator`:** `prod` ve `dev` profillerinin aynı anda çalışmasını veya `dev` profili altında uzaktaki production veritabanına bağlanılmasını engeller.
- **`ProductionSafetyConfiguration`:** Production modunda wildcard (`*`) CORS'u, localhost origin'lerini, HTTP bağlantılarını ve zayıf/varsayılan `EMAIL_OTP_PAYLOAD_SECRET` değerlerini tespit ettiği anda uygulamanın açılışını durdurur.
- **`ProductionPaymentSafetyConfiguration`:** `test-hmac` gibi test ödeme sağlayıcılarını production'da kesinlikle engeller.
- **Zero-PII Loglama:** Log dosyalarına asla kullanıcı e-postası, OTP kodu, auth token'ı, kredi kartı veya oturum anahtarı yazılmaz.

---

## 12. İlgili Dokümantasyon Bağlantıları

- [Kapsamlı Mimari ve Psikometri Spesifikasyonu](file:///c:/Users/42oyu/OneDrive/Desktop/Seenly/PROJECT_DOCUMENTATION.md)
- [Brevo E-posta ve Transactional Outbox Rehberi](file:///c:/Users/42oyu/OneDrive/Desktop/Seenly/docs/email-notifications.md)
- [PostgreSQL ve Flyway Migration Kılavuzu](file:///c:/Users/42oyu/OneDrive/Desktop/Seenly/backend/PRODUCTION_MIGRATION.md)
- [Observability, Metrikler ve Audit Kataloğu](file:///c:/Users/42oyu/OneDrive/Desktop/Seenly/backend/PRODUCTION_OBSERVABILITY.md)
- [Performans Testi ve Kapasite Analizi](file:///c:/Users/42oyu/OneDrive/Desktop/Seenly/backend/PRODUCTION_PERFORMANCE.md)
- [Resilience, Transaction Sınırları ve Kurtarma](file:///c:/Users/42oyu/OneDrive/Desktop/Seenly/backend/PRODUCTION_RESILIENCE.md)
- [Frontend Kalite Kapısı ve Erişilebilirlik](file:///c:/Users/42oyu/OneDrive/Desktop/Seenly/frontend/PRODUCTION_QUALITY.md)
