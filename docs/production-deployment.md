# 10Signal — Production Deployment Runbook

Bu doküman, **10Signal** uygulamasının production ortamına güvenli, tekrarlanabilir ve sıfır veri kaybı prensibiyle dağıtımı (deployment) için eksiksiz operasyonel kılavuzdur.

---

## 1. Sunucu ve Sistem Gereksinimleri

| Bileşen | Minimum Gereksinim | Önerilen (Scale / Peak) |
|---|---|---|
| **İşletim Sistemi** | Ubuntu 22.04 LTS / Debian 12 (64-bit) | Ubuntu 24.04 LTS / Debian 12 |
| **CPU** | 2 vCPU (x86_64) | 4 vCPU |
| **RAM** | 4 GB ECC / Standart RAM | 8 GB RAM |
| **Disk** | 40 GB NVMe SSD | 80 GB NVMe SSD (ext4/xfs) |
| **Docker Engine** | v24.0+ veya v26.0+ | Docker CE 26.x + containerd |
| **Docker Compose** | Docker Compose v2.24+ (`docker compose`) | Compose v2.26+ |
| **Ağ Portları** | Yalnızca 80 (TCP), 443 (TCP/UDP HTTP/3) açık | Port 22 SSH (key-only), 80, 443 |

> [!IMPORTANT]
> **Güvenlik Sınırı:** Sunucu güvenlik duvarında (UFW / Cloud Security Group) **PostgreSQL portu 5432** ve **Spring Boot Actuator portu 8081** dış dünyaya **kesinlikle kapatılmalıdır**. Sadece Port 80 ve 443 (Caddy Reverse Proxy) internete açık olmalıdır.

---

## 2. DNS Hazırlığı

Aşağıdaki DNS kayıtlarını domain sağlayıcınızda (Cloudflare, Namecheap vb.) tanımlayın:

```text
# Frontend (Netlify Apex ve Subdomain)
10signal.me.            300   IN   A       75.2.60.5
www.10signal.me.        300   IN   CNAME   [netlify-site-name].netlify.app.

# Backend API (VPS Sunucusu)
api.10signal.me.        300   IN   A       <VPS_PUBLIC_IPV4>
api.10signal.me.        300   IN   AAAA    <VPS_PUBLIC_IPV6>  (opsiyonel)

# Brevo E-posta Kimlik Doğrulama (SPF, DKIM, DMARC)
10signal.me.            3600  IN   TXT     "v=spf1 include:spf.brevo.com ~all"
brevo._domainkey.10signal.me. 3600 IN TXT  "k=rsa; p=<BREVO_DKIM_PUBLIC_KEY>"
_dmarc.10signal.me.     3600  IN   TXT     "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@10signal.me"
```

---

## 3. Netlify Frontend Kurulumu

Frontend, repository içindeki `frontend/` dizininden derlenir ve Netlify üzerinde statik CDN olarak sunulur.

### Kurulum Adımları:
1. Netlify Dashboard -> **Add new site** -> **Import an existing project** -> GitHub repository seçin.
2. Temel Build Yapılandırması (`frontend/netlify.toml` tarafından otomatik okunur):
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
3. Netlify Environment Variables (Site configuration -> Environment variables):
   - `VITE_API_URL`: `https://api.10signal.me`
4. **Gizlilik Kuralı:** Hiçbir backend secret'ı (`JWT_SECRET`, `POSTGRES_PASSWORD`, `LEMON_SQUEEZY_API_KEY`, vb.) Netlify paneline **kesinlikle eklenmemelidir**. Yalnızca `VITE_` ile başlayan değişkenler build zamanında frontend bundle'a gömülür.
5. SPA Yönlendirme ve Güvenlik Header'ları `netlify.toml` üzerinden otomatik uygulanır (HSTS, CSP, X-Frame-Options DENY, immutable asset caching).

---

## 4. Production Environment Contract

Sunucu üzerinde `/opt/tensignal/.env.production` dosyasını oluşturun (dosya yetkileri: `chmod 600 .env.production`).

```bash
# ==============================================================================
# 10SIGNAL PRODUCTION ENVIRONMENT CONFIGURATION
# ==============================================================================

# 1. Ortam & Profil
SPRING_PROFILES_ACTIVE=prod
DEPLOYMENT_ENVIRONMENT=production

# 2. PostgreSQL 16
POSTGRES_DB=tensignal_prod
POSTGRES_USER=tensignal_app
POSTGRES_PASSWORD=<GUCLU_RASTGELE_VERITABANI_PAROLASI>
POSTGRES_MAX_POOL_SIZE=20
POSTGRES_MIN_IDLE=5

# 3. Backend JVM & Portlar
PORT=8080
MANAGEMENT_PORT=8081
JAVA_OPTS=-Xms512m -Xmx1536m -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError

# 4. Güvenlik & Kriptografi
# NOT: 10Signal kullanıcı oturumlarında JWT yerine TokenHashingService (32 bayt random URL-safe token + SHA-256) kullanır.
# OTP Payload Şifreleme Anahtarı: En az 32 karakterlik yüksek entropili string (SHA-256 ile 256-bit AES-GCM türetilir).
# Tavsiye edilen üretim komutu: openssl rand -hex 32 (64 karakter hex)
EMAIL_OTP_PAYLOAD_SECRET=<64_KARAKTER_HEX_SECRET>
OTP_HASH_PEPPER=<GUCLU_RASTGELE_PEPPER_MIN_16_KARAKTER>
OTP_CODE_EXPIRY_MINUTES=10

# 5. Reverse Proxy Güven Modeli
# Caddy'nin Docker public_web ağındaki bridge subnet'i (Spring Boot ClientIpResolver doğrulaması için)
TRUSTED_PROXY_CIDRS=172.28.0.0/16

# 6. CORS İzinleri (Netlify URL'leri)
CORS_ALLOWED_ORIGINS=https://10signal.me,https://www.10signal.me

# 7. Lemon Squeezy Ödeme Altyapısı
# Webhook Callback URL: https://api.10signal.me/api/v1/billing/webhooks/lemonsqueezy
PAYMENT_PROVIDER=lemonsqueezy
LEMON_SQUEEZY_API_KEY=<LEMON_SQUEEZY_LIVE_API_KEY>
LEMON_SQUEEZY_WEBHOOK_SECRET=<LEMON_SQUEEZY_LIVE_WEBHOOK_SECRET>
LEMON_SQUEEZY_STORE_ID=<LIVE_STORE_ID>
LEMON_SQUEEZY_CHECKOUT_URL_PLUS=https://tensignal.lemonsqueezy.com/buy/<VARIANT_ID_PLUS>
LEMON_SQUEEZY_CHECKOUT_URL_CAPACITY_50=https://tensignal.lemonsqueezy.com/buy/<VARIANT_ID_CAP_50>
LEMON_SQUEEZY_CHECKOUT_URL_CAPACITY_150=https://tensignal.lemonsqueezy.com/buy/<VARIANT_ID_CAP_150>
LEMON_SQUEEZY_CHECKOUT_URL_CAPACITY_300=https://tensignal.lemonsqueezy.com/buy/<VARIANT_ID_CAP_300>

# 8. Brevo Transactional Email
BREVO_API_KEY=<BREVO_LIVE_API_KEY>
BREVO_SENDER_EMAIL=noreply@10signal.me
BREVO_SENDER_NAME=10Signal
APP_FRONTEND_BASE_URL=https://10signal.me

# 9. Rate Limiting & Admin
RATE_LIMITING_ENABLED=true
ADMIN_RECOVERY_KEY=<GUCLU_ADMIN_KURTARMA_ANAHTARI>
```

---

## 5. Docker Compose Başlatma

Sunucuda proje dizinine gidin (`/opt/tensignal`):

```bash
# 1. Konfigürasyonu doğrula (syntax ve env kontrolü)
docker compose -f docker-compose.prod.yml --env-file .env.production config

# 2. Servisleri build et ve arka planda başlat
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# 3. Servis durumlarını izle
docker compose -f docker-compose.prod.yml ps
```

Beklenen çıktı:
```text
NAME                     IMAGE                  COMMAND                  SERVICE      STATUS
tensignal-caddy          caddy:2.9-alpine       "caddy run --config …"   caddy        Up (healthy)
tensignal-backend        tensignal-backend:prod "/deployments/run-ja…"   backend      Up (healthy)
tensignal-postgres       postgres:16-alpine     "docker-entrypoint.s…"   postgres     Up (healthy)
```

---

## 6. HTTPS ve Reverse Proxy Doğrulaması

Caddy, `api.10signal.me` adresi için Let's Encrypt / ZeroSSL üzerinden otomatik olarak TLS sertifikası üretir ve HTTP -> HTTPS (308) yönlendirmesi yapar.

### Doğrulama Komutları:
```bash
# 1. TLS sertifikası ve HTTP/2 - HTTP/3 protokol doğrulaması
curl -I https://api.10signal.me/api/v1/meta

# 2. Actuator engelleme doğrulaması (Dışarıdan 403 Forbidden dönmeli!)
curl -I https://api.10signal.me/actuator/health
# Beklenen: HTTP/2 403 Forbidden

# 3. Güvenlik başlıklarının doğrulanması
curl -sI https://api.10signal.me/api/v1/meta | grep -iE "(strict-transport|x-content-type|x-frame)"
```

---

## 7. Flyway Migration Kontrolü

Uygulama açılışında Flyway, `V1`'den `V8`'e kadar tüm migration dosyalarını doğrular ve eksik varsa uygular.

```bash
# Migration loglarını incele
docker compose -f docker-compose.prod.yml logs backend | grep -i "DbMigrate"
```

Beklenen log:
```text
o.f.core.internal.command.DbValidate : Successfully validated 8 migrations
o.f.core.internal.command.DbMigrate  : Current version of schema "public": 8
o.f.core.internal.command.DbMigrate  : Schema "public" is up to date. No migration necessary.
```

Veritabanında kontrol:
```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U tensignal_app_user -d tensignal_prod -c "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;"
```

---

## 8. Backend Health ve Servis Gözlemlenebilirliği

Backend sağlık durumu yalnızca yerel veya private Docker ağı üzerinden sorgulanabilir:

```bash
# Backend Liveness & Readiness kontrolü
docker compose -f docker-compose.prod.yml exec backend curl -s http://localhost:8081/actuator/health | jq .

# PostgreSQL bağlantı kontrolü
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U tensignal_app_user -d tensignal_prod
```

### Kritik Log Alarmları:
| Alarm Kodu | Anlamı | Müdahale |
|---|---|---|
| `CRITICAL_EMAIL_OUTBOX_DESYNC` | Brevo outbox gönderimi veri tutarsızlığına uğradı. | Outbox tablosunu kontrol et; Brevo API durumunu ve quota'sını incele. |
| `LEMON_SQUEEZY_SIGNATURE_MISMATCH` | Webhook imzası uyuşmadı. | Webhook secret'ı ve Lemon Squeezy panelini kontrol et; olası sahte istekleri izle. |
| `PAYMENT_TRANSACTION_MANUAL_REVIEW` | İşlem manuel inceleme durumuna düştü. | `payment_transactions` tablosundaki transactionId'yi Lemon Squeezy Dashboard'da ara. |
| `HHH000342: Could not obtain connection` | Hikari bağlantı havuzu tükendi. | PostgreSQL connection limitini ve uzun süren sorguları incele. |

---

## 9. Lemon Squeezy Webhook Ayarları

1. [Lemon Squeezy Dashboard](https://app.lemonsqueezy.com) -> **Settings** -> **Webhooks**.
2. **Add Webhook** butonuna tıklayın:
   - **Callback URL:** `https://api.10signal.me/api/v1/billing/webhooks/lemonsqueezy`
   - **Signing Secret:** `.env.production` dosyasındaki `LEMON_SQUEEZY_WEBHOOK_SECRET` ile birebir aynı değer.
   - **Events:**
     - `order_created`
     - `subscription_created`
     - `subscription_updated`
     - `subscription_cancelled`
     - `subscription_resumed`
     - `subscription_expired`
3. Webhook test isteği göndererek 200 OK yanıtı alındığını doğrulayın.

---

## 10. Brevo E-posta ve Sender Ayarları

1. [Brevo Dashboard](https://app.brevo.com) -> **Senders & IP** -> **Domains**.
2. `10signal.me` alan adını ekleyin ve Bölüm 2'deki DNS TXT (DKIM ve SPF) kayıtlarının onaylandığını (Authenticated) doğrulayın.
3. **Senders** sekmesinde `noreply@10signal.me` adresinin kayıtlı ve doğrulanmış olduğunu kontrol edin.
4. **SMTP & API** sekmesinden oluşturulan API anahtarını `.env.production` içine `BREVO_API_KEY` olarak yazın.

---

## 11. PostgreSQL Yedekleme ve Kurtarma (Backup / Restore)

> [!CAUTION]
> **Kurtarma Kuralı:** Asla canlı (canlı production) veritabanı üzerine doğrudan restore komutu çalıştırmayın! Yedekleri her zaman izole bir test veritabanına (`tensignal_restore_test`) yükleyerek bütünlüğü doğrulayın.

### 11.1. Manuel Yedek Alma (pg_dump)
```bash
BACKUP_DIR="/var/backups/tensignal"
mkdir -p "$BACKUP_DIR" && chmod 700 "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/tensignal_prod_$(date +%Y%m%d_%H%M%S).dump"

docker compose -f /opt/tensignal/docker-compose.prod.yml exec -T postgres \
  pg_dump -U tensignal_app_user -d tensignal_prod -Fc > "$BACKUP_FILE"

chmod 600 "$BACKUP_FILE"
echo "Yedek başarıyla alındı: $BACKUP_FILE"
```

### 11.2. Otomatik Günlük Cron Yedekleme
`/etc/cron.daily/tensignal-backup` dosyası oluşturun:
```bash
#!/bin/bash
set -euo pipefail
BACKUP_DIR="/var/backups/tensignal"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_$DATE.dump"

mkdir -p "$BACKUP_DIR"
docker compose -f /opt/tensignal/docker-compose.prod.yml exec -T postgres \
  pg_dump -U tensignal_app_user -d tensignal_prod -Fc > "$BACKUP_FILE"

# 30 günden eski yedekleri sil
find "$BACKUP_DIR" -type f -name "db_*.dump" -mtime +30 -delete
```
`chmod +x /etc/cron.daily/tensignal-backup` çalıştırın.

### 11.3. Güvenli Kurtarma (Restore Drill) Prosedürü
```bash
# 1. İzole doğrulama veritabanı oluştur
docker compose -f /opt/tensignal/docker-compose.prod.yml exec postgres \
  psql -U tensignal_app_user -d postgres -c "DROP DATABASE IF EXISTS tensignal_restore_test; CREATE DATABASE tensignal_restore_test OWNER tensignal_app_user;"

# 2. Yedeği test veritabanına restore et
cat /var/backups/tensignal/db_YYYYMMDD_HHMMSS.dump | docker compose -f /opt/tensignal/docker-compose.prod.yml exec -T postgres \
  pg_restore -U tensignal_app_user -d tensignal_restore_test --no-owner --clean --if-exists

# 3. Tablo ve kayıt sayılarını doğrula
docker compose -f /opt/tensignal/docker-compose.prod.yml exec postgres \
  psql -U tensignal_app_user -d tensignal_restore_test -c "SELECT COUNT(*) FROM owners; SELECT COUNT(*) FROM response_sessions;"
```

---

## 12. Rollback (Geri Dönüş) Prosedürü

Deployment sırasında veya hemen sonrasında kritik bir hata tespit edilirse:

### Senaryo A: Backend Kod Hatası (Şema Değişikliği Yok)
1. Önceki kararlı image tag'ine dönün:
   ```bash
   sed -i 's/backend:prod-v2/backend:prod-v1/' docker-compose.prod.yml
   docker compose -f docker-compose.prod.yml --env-file .env.production up -d backend
   ```
2. Netlify üzerinde önceki başarılı deploy'a "Rollback to this deploy" seçeneğiyle anında dönün.

### Senaryo B: Veritabanı Tutarsızlığı / Geri Dönüş
1. Servisleri geçici olarak durdurun:
   ```bash
   docker compose -f docker-compose.prod.yml stop backend
   ```
2. Deployment öncesi alınan son temiz yedeği uygulayın (Restore prosedürü).
3. Önceki çalışan backend container'ını başlatın.

---

## 13. Yayın Sonrası Smoke Testleri Checklist

Yayın tamamlandığında aşağıdaki adımları hem mobil cihazdan hem de masaüstü tarayıcıdan test edin:

- [ ] `https://10signal.me` açılıyor, SSL geçerli, konsolda CSP veya CORS hatası yok.
- [ ] 10 soruluk test yanıtlanabiliyor, oturum (`tensignal_owner_token`) sorunsuz oluşuyor.
- [ ] Paylaşılabilir arkadaş linki kopyalanabiliyor ve anonim yanıtlayıcı akışı çalışıyor.
- [ ] Ayarlar -> Profil alanında E-posta giriş ve OTP doğrulaması (Brevo üzerinden 4 haneli kod iletimi) başarılı çalışıyor.
- [ ] Paketler & Üyelik sekmesinde checkout linki Lemon Squeezy ödeme sayfasına yönlendiriyor.
- [ ] Ödeme dönüşünde (`/#/settings?tab=subscription&checkout=success`) `usePaymentVerification` polling mekanizması çalışıyor ve Plus hakları anında aktive oluyor.
- [ ] Tüm 10 Signal metrikleri ve Mors Kodu başarıyla açılıyor.

---

## 14. Olay Müdahalesi ve Alarm Kontrol Listesi

1. **Sunucu Disk Doluluğu:**
   ```bash
   df -h /
   docker system df
   docker system prune -a --volumes --force  # DİKKAT: postgres_data volume'ünü SİLMEYİN
   ```
2. **Caddy Sertifika Yenileme Hatası:**
   ```bash
   docker compose -f docker-compose.prod.yml logs caddy | grep -iE "(error|tls|certificate)"
   ```
3. **PostgreSQL Volume Yedek Kontrolü:**
   `/var/backups/tensignal` dizininde günlük dump dosyasının boyutunun 0 bayt olmadığını doğrulayın.
