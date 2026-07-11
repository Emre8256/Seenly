# Seenly Proje Dokumantasyonu

Bu dokuman, Seenly projesini devralacak kisi icin hazirlanmis kapsamli teknik ve urun dokumantasyonudur. Repo, kullanicinin kendi sosyal algisini olctugu, arkadaslarindan cevap topladigi ve bu cevaplar uzerinden "ben kendimi nasil goruyorum / insanlar beni nasil goruyor" karsilastirmasi yapan iki katmanli bir web uygulamasidir.

Dokumanin kapsami:

- Urun tanimi ve ana deger onerisi
- Tum kullanici akislari
- Frontend mimarisi, rotalar, state ve local/session storage kullanimi
- Backend mimarisi, REST API, DTO, entity, repository ve servisler
- Skorlama, sosyal kimlik, gap analizi ve reader style mantigi
- Ucretlendirme/kota ozellikleri
- Guvenlik, gizlilik ve spam korumasi
- Kurulum, calistirma, build ve devralma notlari

## 1. Kisa Ozet

Seenly, sosyal algi ve kisilik yansimasi odakli bir platformdur. Kullanici once kendisi hakkinda 10 soruluk bir testi doldurur. Sistem bu cevaplardan bir "self" profil cikarir, kullaniciya ozel bir panel ve arkadaslarla paylasilacak bir public link uretir. Arkadaslar bu linkten ayni 10 sosyal sinyal uzerinden kullaniciyi degerlendirir. Yeterli arkadas cevabi toplandiginda sistem dis algi profilini, self/dis algi farklarini, gap pattern'ini, cevaplayan arkadasin okuma stilini ve algi dogruluk skorunu hesaplar.

Teknik olarak:

- Backend: Java 17, Spring Boot 3.2.5, Spring Web, Spring Data JPA, Validation, Lombok, PostgreSQL/H2.
- Frontend: React 18, Vite 5, Tailwind CSS 4 plugin, custom CSS, hash-based routing.
- Lokal gelistirme: frontend Vite dev server `localhost:3000`, backend `localhost:8080`.
- API proxy: Vite `/api` isteklerini `http://localhost:8080` adresine yonlendirir.

## 2. Repo Yapisi

```text
Seenly/
  README.md
  PROJECT_DOCUMENTATION.md
  .gitignore

  backend/
    pom.xml
    src/main/java/com/seenly/backend/
      BackendApplication.java
      controller/
        SeenlyController.java
        BillingController.java
      dto/
        CreateSeenlyRequest.java
        CreateSeenlyResponse.java
        EmailAuthRequest.java
        FriendResponseInput.java
        ResponseSessionDto.java
        ResultSnapshotDto.java
        SubmitResponseResult.java
      entity/
        User.java
        Seenly.java
        SelfAnswer.java
        ResponseSession.java
        FriendResponse.java
        ResultSnapshot.java
        ReaderProfile.java
        ReaderXpTransaction.java
      exception/
        ErrorResponse.java
        FreeCapReachedException.java
        GlobalExceptionHandler.java
        QuotaExceededException.java
        ResourceNotFoundException.java
      repository/
      service/

  frontend/
    package.json
    package-lock.json
    vite.config.js
    index.html
    src/
      App.jsx
      main.jsx
      index.css
      services/api.js
      context/LocaleContext.jsx
      hooks/useSeenlyShare.js
      pages/
      components/
      content/locales/
      images/
    public/
    dist/
```

Not: `frontend/dist`, `backend/target` ve `frontend/node_modules` build/runtime ciktisi niteligindedir. Devralan kisi repo temizligi yapacaksa bu klasorlerin versiyon kontrol politikasini ayrica netlestirmelidir.

## 3. Urun Mantigi

Seenly'nin ana fikri dort katmandan olusur:

1. Self View: Kullanici kendisi hakkinda 10 sosyal sinyale cevap verir.
2. Outside View: Arkadaslar ayni sosyal sinyalleri kullanici icin cevaplar.
3. Gap Analysis: Self ortalamalari ile arkadas ortalamalari arasindaki farklar analiz edilir.
4. Reader Game: Cevaplayan arkadasin kullaniciyi ne kadar dogru okudugu hesaplanir ve bir reader style atanir.

Platformun ana sosyal sinyalleri:

- `samimiyet`
- `cekicilik`
- `zeka`
- `vizyon`
- `enerji`
- `guvenilirlik`
- `ego`
- `basari`
- `comertlik`
- `olgunluk`

Her sinyal 1-5 arasi Likert cevapla olculur. Backend hesaplamada bu degeri `(answerValue - 1) / 4.0` formuluyle 0.0-1.0 araligina normalize eder.

## 4. Kullanici Akislari

### 4.1 Landing ve Baslangic

Ana ekran `frontend/src/components/LandingPage.jsx` uzerinden render edilir. Landing sayfasi asagidaki bolumleri icerir:

- Site header
- Hero
- Social proof
- Opening statement
- How it works
- Use cases
- Example result
- Seenly codes
- Pricing
- Security
- Final CTA
- Footer

Kullanici iki temel aksiyondan birini secer:

- Yeni profil olusturmak
- Mevcut profil icin e-posta ile hizli giris yapmak

Bu akisi `QuizPage.jsx` yonetir. `currentIndex` state'i sayfa/step kontrolu icin kullanilir.

Onemli `currentIndex` anlamlari:

- `-1`: Landing page
- `-5`: E-posta girisi
- `-6`: OTP/dogrulama kodu girisi
- `-2`: Isim/nickname girisi
- `-4`: Baslamadan once bilgi ekrani
- `0..9`: Self quiz sorulari
- `-10`, `-11`: Quiz sonrasi dogrulama/submit akisinda kullanilan ara ekranlar

### 4.2 Yeni Profil Olusturma

Akis:

1. Kullanici landing uzerinden baslar.
2. E-posta alinir.
3. Mock dogrulama kodu istenir.
4. Kullanici 6 haneli kodu girer.
5. Kullanici gorunecek adini girer.
6. 10 self sorusunu cevaplar.
7. Frontend `POST /api/v1/seenly/create` endpoint'ine profil olusturma istegi yollar.
8. Backend raw owner token ve public slug uretir.
9. Backend self snapshot hesaplar.
10. Frontend `ownerToken` ve `publicSlug` degerlerini `localStorage` icine yazar.
11. Kullanici dashboard'a yonlendirilir.

Local storage anahtarlari:

- `seenly_owner_token`: Sahip paneli icin gizli raw token.
- `seenly_owner_slug`: Public arkadas linkinin slug degeri.
- `seenly_display_name`: Dashboard/header icin gorunecek ad.
- `seenly_locale`: Secili dil.

Session storage anahtarlari:

- `seenly_displayName`
- `seenly_email`
- `seenly_answers`
- `seenly_currentIndex`
- `seenly_isQuickLogin`

### 4.3 E-posta ile Geri Giris

Akis:

1. Kullanici login aksiyonunu secer.
2. E-posta girer.
3. `sendVerificationCode(email, isLogin=true)` cagrilir.
4. Backend bu e-posta ile olusturulmus son Seenly profilini arar.
5. Mock kod `123456` dogruysa `loginWithEmail` cagrilir.
6. Backend kullaniciya yeni owner token uretir, hash'ini DB'de gunceller ve raw token'i frontend'e dondurur.
7. Frontend token/slug'i localStorage'a yazar ve dashboard'a gider.

Onemli not: Mevcut implementasyonda mail gonderimi gercek degil, console log ve sabit kod `123456` uzerinden mock calisir.

### 4.4 Dashboard

Dashboard `frontend/src/pages/DashboardPage.jsx` tarafindan yonetilir.

Baslica islevleri:

- Owner token ile dashboard verisini ceker.
- Self profile kartini ve sinyal degerlerini gosterir.
- Arkadaslardan gelen cevap sayisini gosterir.
- Arkadas linkini kopyalar.
- WhatsApp ve Instagram Story paylasim akisini destekler.
- Response history listesini gosterir.
- Her response icin detay modalinda sinyal cevaplarini, accuracy ve cevap surelerini gosterir.
- Self / Outside / Gap tab mantigi kullanir.
- 3 cevaptan once dis algi/gap bilgilerini kilitli gosterir.
- Plus aboneligi ve ek kapasite paketi satin alma isteklerini tetikler.
- Logout yapar.

Dashboard veri kaynagi:

- `GET /api/v1/seenly/owner/{ownerToken}`

### 4.5 Arkadas Linki / Public Profil

Arkadas davet linki su formdadir:

```text
{origin}/#/friend/{publicSlug}
```

`FriendIntroPage.jsx` bu linki karsilar.

Akis:

1. Sayfa acilinca `incrementProfileClick(publicSlug)` sessizce cagrilir.
2. Public dashboard verisi `GET /api/v1/seenly/public/{publicSlug}` ile alinir.
3. Browser fingerprint hesaplanir.
4. `POST /api/v1/seenly/friend/{publicSlug}/check-eligibility` cagrilir.
5. Kullanici daha once cevap verdiyse veya kendi profilini cevaplamaya calisiyorsa quiz baslatilmaz.
6. Kota doluysa cevap butonu yerine limit uyarisi gosterilir.
7. Cevap verebiliyorsa kullanici friend quiz'e gecer.

### 4.6 Arkadas Quiz Akisi

`FriendQuizPage.jsx`, 10 soruluk friend quiz'i yonetir.

Ozellikler:

- 10 friend question ID kullanir.
- Cevaplar 1-5 arasi Likert seceneklerle alinir.
- Her soruda kalinan sure `friendTimeAnalytics` icine sinyal bazinda ms olarak yazilir.
- Quiz state'i `sessionStorage.seenly_friend_state` icinde tutulur.
- Submit sirasinda browser fingerprint gonderilir.

Submit endpoint:

```text
POST /api/v1/seenly/friend/{publicSlug}/respond
```

Payload:

```json
{
  "nickname": "",
  "fingerprintHash": "abc123",
  "friendResponses": [
    { "questionId": "classic_friend_samimiyet_01", "answerValue": 4 }
  ],
  "friendTimeAnalytics": {
    "samimiyet": 3200
  }
}
```

Basarili cevap sonrasi:

- Backend response session kaydeder.
- Kota kontrolu yapar.
- Snapshot yeniden hesaplanir.
- Reader style ve accuracy hesaplanir.
- Frontend sonucu `sessionStorage.seenly_friend_result` icine yazar.
- Slug `localStorage.seenly_evaluated_slugs` listesine eklenir.
- Kullanici friend result sayfasina yonlendirilir.

### 4.7 Arkadas Sonuc Sayfasi

`FriendResultPage.jsx`, cevaplayan arkadasa kendi reader style sonucunu gosterir.

Gosterilen bilgiler:

- Reader style kart gorseli
- Reader style adi ve tek cumlelik aciklama
- Accuracy yuzdesi
- WhatsApp paylasimi
- Instagram Story gorseli olusturma
- Kullanici login degilse kendi Seenly profilini olusturma CTA'i
- Kullanici login ise dashboard'a donme CTA'i

Reader style gorselleri:

- `balanced_reader`
- `clear_reader`
- `social_stranger`
- `telepathic_reader`
- `casual_explorer`

### 4.8 Identities Sayfasi

`IdentitiesPage.jsx`, sosyal kimlik kart katalogudur.

Ozellikler:

- 45 signature karti listelenir.
- Arama yapilabilir.
- Aile filtresi vardir: `stratega`, `imperia`, `aura`, `porta`, `gratia`.
- Dashboard'dan belirli bir kart acilacaksa `localStorage.seenly_selected_identity` kullanilir.
- Kart modalinda kimlik gorseli, aile bilgisi, tek cumlelik aciklama ve sinyal tabanli detay metni gosterilir.

Not: Backend tarafindaki hesaplanan family ID'leri `grounded_presence`, `warm_access`, `hidden_depth`, `clear_energy` seklindedir. Frontend Identities katalog filtresi ise editorial/katalog amacli farkli aile isimleri (`stratega`, `imperia`, `aura`, `porta`, `gratia`) kullanir.

### 4.9 FAQ Sayfasi

`FaqPage.jsx`:

- Iletisim bolumu
- `hello@seenly.co` mail linki
- Instagram ve TikTok linkleri
- Aranabilir FAQ akordiyonu
- Locale bazli FAQ JSON verisi

### 4.10 Plans Sayfasi

`PlansPage.jsx`:

- Free, Premium/Plus ve Pro kartlarini gosterir.
- Butonlar su an checkout acmak yerine quiz baslatma akisina yonlendirir.
- Gercek ucretlendirme entegrasyonu yoktur; backend tarafinda mock/manuel subscribe-plus ve buy-pack endpointleri vardir.

## 5. Frontend Mimarisi

### 5.1 Routing

Uygulama React Router kullanmaz. `frontend/src/App.jsx` icindeki hash parser ile route secilir.

Desteklenen route'lar:

```text
#/                         quiz/landing
#/result                   ResultPage
#/dashboard                DashboardPage
#/identities               IdentitiesPage
#/faq                      FaqPage
#/plans                    PlansPage
#/friend/{slug}            FriendIntroPage
#/friend/{slug}/quiz       FriendQuizPage
#/friend/{slug}/result     FriendResultPage
```

Route guard davranislari:

- Ana quiz route'una girildiginde localStorage'da owner token varsa dashboard'a gider.
- Kullanici kendi `seenly_owner_slug` degerine sahip friend linkini acarsa dashboard'a yonlendirilir.
- Token baska tab'de silinirse storage event ile session temizlenir ve ana sayfaya gidilir.

### 5.2 API Katmani

Tum ana frontend API cagrilari `frontend/src/services/api.js` icindedir.

Base URL:

```js
const API_PREFIX = import.meta.env.VITE_API_URL || '';
const BASE_URL = `${API_PREFIX}/api/v1/seenly`;
```

Lokal dev'de `VITE_API_URL` bos kalabilir; Vite proxy `/api` isteklerini backend'e aktarir.

Fonksiyonlar:

- `createSeenly(displayName, email, selfAnswers)`
- `sendVerificationCode(email, isLogin = false)`
- `verifyCode(email, code)`
- `getOwnerDashboard(ownerToken)`
- `getPublicDashboard(publicSlug)`
- `getBrowserFingerprint()`
- `checkEligibility(publicSlug, fingerprintHash)`
- `submitFriendResponse(publicSlug, nickname, fingerprintHash, friendResponses, friendTimeAnalytics)`
- `loginWithEmail(email, code)`
- `incrementProfileClick(publicSlug)`
- `subscribePlus(ownerToken)`
- `buyCapacityPack(ownerToken, amount)`

### 5.3 Locale Sistemi

`LocaleContext.jsx` iki dili destekler:

- `tr`
- `en`

Yuklenen icerik kategorileri:

- `ui`
- `signatures`
- `families`
- `gaps`
- `readerStyles`
- `questions`
- `faq`

Helper'lar:

- `t(category, key)`: string doner, yoksa key'i fallback olarak dondurur.
- `getObject(category, id)`: obje doner, yoksa null.

Locale `localStorage.seenly_locale` icinde tutulur ve `document.documentElement.lang` guncellenir.

### 5.4 Frontend Icerik Kataloglari

TR locale dosyalarinda mevcut ana kataloglar:

- `questions.json`: 20 soru anahtari, 10 self + 10 friend.
- `signatures.json`: 45 sosyal kimlik.
- `families.json`: 4 backend family kopyasi.
- `gaps.json`: 8 gap pattern kopyasi.
- `reader_styles.json`: 5 reader style.
- `faq.json`: FAQ listesi.
- `ui.json`: 300+ UI metni.

Soru ID yapisi:

```text
classic_self_{signal}_01
classic_friend_{signal}_01
```

Backend lens/sinyal adini `questionId.split("_")[2]` ile cikarir. Bu yuzden yeni soru eklerken ID formatinin korunmasi cok onemlidir.

### 5.5 Paylasim Altyapisi

`frontend/src/hooks/useSeenlyShare.js` iki paylasim tipi saglar:

- WhatsApp deep link: `https://api.whatsapp.com/send?text=...`
- Instagram Story generator

Instagram Story generator:

- `html2canvas` dinamik import edilir.
- 1080x1920 boyutunda off-screen DOM olusturulur.
- Kart gorseli canvas'a render edilir.
- Mobilde `navigator.share` desteklenirse dosya share edilir.
- Desktop'ta PNG indirilir.
- Sonrasinda kullaniciya Instagram'a link sticker ekleme modal'i gosterilir.

### 5.6 Styling ve Assetler

Ana stil dosyasi:

- `frontend/src/index.css`

Asset klasorleri:

- `frontend/src/images/KisilikKartlari` benzeri karakter kartlari
- `frontend/src/images/OkuyucuKartlari` reader style kartlari
- `frontend/src/images/Icons` 10 sosyal sinyal ikonlari
- `frontend/public/images` landing gorselleri

Not: Dosya isimlerinde Turkce karakterler vardir. Windows ortaminda calisir, ancak farkli OS/CI ortamlarinda encoding/case-sensitivity kontrol edilmelidir.

## 6. Backend Mimarisi

Backend klasik Spring Boot katmanlarina ayrilmistir:

- Controller: HTTP endpointleri
- DTO: Request/response sekilleri
- Entity: JPA modelleri
- Repository: Spring Data JPA sorgulari
- Service: Is kurallari ve hesaplama
- Exception: Global hata donusleri

Ana giris:

- `BackendApplication.java`

### 6.1 Controller'lar

#### SeenlyController

Base path:

```text
/api/v1/seenly
```

Sorumluluklari:

- Profil olusturma
- Auth mock kod gonderme/dogrulama
- Owner dashboard verisi
- Public dashboard verisi
- Friend eligibility kontrolu
- Friend response submit
- E-posta ile login
- Public profil click sayaci

#### BillingController

Base path:

```text
/api/billing
```

Sorumluluklari:

- Plus abonelik mock islemi
- Ek kapasite paketi mock islemi
- Hesap/profil silme

## 7. REST API Detaylari

### 7.1 Seenly API

#### POST `/api/v1/seenly/create`

Yeni profil olusturur.

Request:

```json
{
  "displayName": "Ayse",
  "email": "ayse@example.com",
  "selfAnswers": [
    { "questionId": "classic_self_samimiyet_01", "answerValue": 4 }
  ]
}
```

Validasyon:

- `displayName`: zorunlu, max 18 karakter.
- `selfAnswers`: tam 10 cevap olmali.
- Her cevapta `questionId` zorunlu.

Response:

```json
{
  "ownerToken": "raw-private-token",
  "publicSlug": "abc123xy",
  "resultSnapshot": {}
}
```

Not: Raw token sadece response ile istemciye verilir. DB'de SHA-256 hash saklanir.

#### POST `/api/v1/seenly/auth/send-code?isLogin=false`

Mock dogrulama kodu gonderir.

Request:

```json
{
  "email": "ayse@example.com"
}
```

Davranis:

- `isLogin=true` ise e-posta ile kayitli son Seenly profili aranir.
- Bulunamazsa 400 doner.
- Kod sabittir: `123456`.

#### POST `/api/v1/seenly/auth/verify-code`

Mock kodu dogrular.

Request:

```json
{
  "email": "ayse@example.com",
  "code": "123456"
}
```

Basarili ise `status=success` doner.

#### POST `/api/v1/seenly/auth/login-email`

E-posta ve kod ile login yapar.

Davranis:

- Kod `123456` degilse 400.
- E-postaya ait son Seenly profili bulunamazsa 400.
- Yeni raw owner token uretir.
- DB'deki `ownerTokenHash` guncellenir.
- Response olarak yeni `ownerToken` ve `publicSlug` doner.

#### GET `/api/v1/seenly/owner/{ownerToken}`

Owner dashboard verisini doner.

Davranis:

- Path'teki raw token SHA-256 ile hashlenir.
- `ownerTokenHash` ile profil bulunur.
- `ResultSnapshotDto` doner.

#### GET `/api/v1/seenly/public/{publicSlug}`

Public profil verisini doner.

Davranis:

- Slug ile profil bulunur.
- `ResultSnapshotDto` doner.
- DTO icinde response sayisi 3'ten azsa outside/gap alanlari null maskelenir.

#### POST `/api/v1/seenly/friend/{publicSlug}/check-eligibility`

Arkadasin cevap verebilir olup olmadigini kontrol eder.

Header:

```text
X-Owner-Token: optional
```

Request:

```json
{
  "fingerprintHash": "abc123"
}
```

Kontroller:

- Owner kendi profilini degerlendiremez.
- Ayni profil icin ayni IP + fingerprint tekrar cevap veremez.

Response:

```json
{ "eligible": true }
```

Uygun degilse 403 veya 409 ile `{ eligible: false, message: "..." }` doner.

#### POST `/api/v1/seenly/friend/{publicSlug}/respond`

Arkadas cevaplarini kaydeder.

Kontroller:

- Owner self-evaluation engeli.
- IP + fingerprint duplicate engeli.
- Free/paid kota kontrolu.
- Optimistic locking ile eszamanli kapasite yarisi korumasi.

Response:

```json
{
  "readerStyleId": "clear_reader",
  "xpGained": 15,
  "level": 1,
  "accuracy": 82.5,
  "resultSnapshot": {}
}
```

#### POST `/api/v1/seenly/profile/{publicSlug}/increment-click`

Public profil ziyaret/click sayacini artirir.

Response:

```json
{
  "status": "success",
  "totalProfileClicks": 12
}
```

### 7.2 Billing API

#### POST `/api/billing/subscribe-plus`

Owner token header veya query param ile alinir.

Header:

```text
X-Owner-Token: raw-token
```

Davranis:

- Seenly profilini token ile bulur.
- `User` yoksa olusturur.
- `user.isPremium=true` yapar.
- `seenly.isCapped=false` yapar.
- Guncel snapshot DTO doner.

#### POST `/api/billing/buy-pack?amount=100`

Ek kapasite paketi ekler.

Gecerli amount degerleri:

- `100`
- `250`
- `500`

Davranis:

- User yoksa olusturur.
- `purchasedExtraCapacity += amount`
- Yeni toplam kapasite response count'tan yuksekse profil uncapped yapilir.

#### DELETE `/api/billing/delete-account`

Owner token header veya query param ile alinir.

Davranis:

- User varsa response session'lardaki reader referanslari null'lanir.
- User'a bagli tum Seenly profilleri silinir.
- User ve cascade reader profile/xp transaction silinir.
- User yoksa yalnizca Seenly profili silinir.

## 8. Veri Modeli

### 8.1 User

Tablo: `users`

Alanlar:

- `id`: UUID
- `email`: unique
- `emailVerified`: boolean, default false
- `isPremium`: Boolean, default false
- `baseFormCapacity`: Integer, default 3
- `purchasedExtraCapacity`: Integer, default 0
- `createdAt`
- `updatedAt`
- `readerProfile`: one-to-one

User kavrami su an daha cok billing ve reader gamification icin vardir. Profil olusturma anonim baslayabilir; `Seenly.user` nullable'dir.

### 8.2 Seenly

Tablo: `seenlys`

Alanlar:

- `id`: UUID
- `user`: nullable many-to-one
- `publicSlug`: unique
- `ownerTokenHash`: unique
- `displayName`
- `email`
- `responseCount`
- `totalProfileClicks`
- `isCapped`
- `version`: optimistic locking
- `createdAt`
- `updatedAt`
- `resultSnapshot`: one-to-one
- `selfAnswers`: one-to-many
- `responseSessions`: one-to-many

Computed helper'lar:

- `getIsPremium()`: user varsa ve premium ise true.
- `getBaseFormCapacity()`: user yoksa 3.
- `getPurchasedExtraCapacity()`: user yoksa 0.

### 8.3 SelfAnswer

Tablo: `self_answers`

Alanlar:

- `id`
- `seenly`
- `questionId`
- `answerValue`
- `createdAt`

### 8.4 ResponseSession

Tablo: `response_sessions`

Alanlar:

- `id`
- `seenly`
- `reader`: nullable User
- `nickname`
- `fingerprintHash`
- `ipAddress`
- `responses`
- `friendTimeAnalytics`: element collection, signal key -> duration ms
- `createdAt`

### 8.5 FriendResponse

Tablo: `friend_responses`

Alanlar:

- `id`
- `responseSession`
- `questionId`
- `answerValue`
- `createdAt`

### 8.6 ResultSnapshot

Tablo: `result_snapshots`

Alanlar:

- `id`
- `seenly`
- `scoringVersion`: default `v1.0`
- `selfSignatureId`
- `selfFamilyId`
- `outsideSignatureId`
- `outsideFamilyId`
- `gapPatternId`
- `gapStrength`: `subtle`, `clear`, `strong`
- `confidenceBand`: `self_only`, `forming`, `outside_open`, `gap_open`, `stronger_signal`
- `createdAt`
- `updatedAt`

### 8.7 ReaderProfile

Tablo: `reader_profiles`

Alanlar:

- `id`
- `user`
- `xpTransactions`
- `xp`
- `level`
- `readerStyleId`
- `solvedCount`
- Privacy toggles:
  - `showReaderStyle`
  - `showReaderLevel`
  - `showSolvedCount`
  - `showTopLenses`
  - `hideSolvedProfiles`
  - `hideCalibration`
- `createdAt`
- `updatedAt`

### 8.8 ReaderXpTransaction

Tablo: `reader_xp_transactions`

Alanlar:

- `id`
- `readerProfile`
- `actionType`
- `xpAmount`
- `createdAt`

## 9. DTO'lar

### CreateSeenlyRequest

- `displayName`: required, max 18.
- `email`: optional.
- `selfAnswers`: required, exactly 10.

### CreateSeenlyResponse

- `ownerToken`
- `publicSlug`
- `resultSnapshot`

### EmailAuthRequest

Kullanildigi endpoint'e gore:

- `email`
- `code`

### FriendResponseInput

- `nickname`: max 18.
- `fingerprintHash`: required.
- `friendResponses`: required, exactly 10.
- `friendTimeAnalytics`: optional map.

### ResultSnapshotDto

Frontend'in ana dashboard/public veri modelidir.

Alanlar:

- `scoringVersion`
- `selfSignatureId`
- `selfFamilyId`
- `outsideSignatureId`
- `outsideFamilyId`
- `gapPatternId`
- `gapStrength`
- `confidenceBand`
- `responseCount`
- `totalProfileClicks`
- `totalResponders`
- `publicSlug`
- `displayName`
- `isPremium`
- `currentResponseCount`
- `maxResponseLimit`
- `selfAverages`
- `friendAverages`
- `friendTimeAnalytics`
- `responseSessions`

Privacy davranisi:

- `responseCount < 3` ise outside/gap alanlari null doner.
- `responseCount >= 3` ise outside/gap alanlari acilir.

### ResponseSessionDto

Dashboard response history icin kullanilir.

Alanlar:

- `id`
- `nickname`
- `completedAt`
- `signals`
- `readerType`
- `accuracy`
- `friendTimeAnalytics`

Not: Kodda `nickname` su an her zaman `"unknown_person"` olarak set ediliyor; session nickname'i frontend'e dogrudan tasinmiyor. Bu bilincli privacy tercihi olabilir veya ileride duzeltilecek bir davranis olabilir.

### SubmitResponseResult

- `readerStyleId`
- `xpGained`
- `level`
- `accuracy`
- `resultSnapshot`

## 10. Repository'ler

Backend repository katmani Spring Data JPA tabanlidir.

Ana repository'ler:

- `SeenlyRepository`
- `UserRepository`
- `SelfAnswerRepository`
- `FriendResponseRepository`
- `ResponseSessionRepository`
- `ResultSnapshotRepository`
- `ReaderProfileRepository`
- `ReaderXpTransactionRepository`

Kritik sorgular:

- Public slug ile profil bulma.
- Owner token hash ile profil bulma.
- E-postaya gore son profili bulma.
- User'a bagli Seenly profillerini bulma.
- Duplicate response session kontrolu: seenly id + IP + fingerprint.
- Account delete sirasinda reader referanslarini null'lama.

## 11. Servisler ve Is Mantigi

### 11.1 TokenHashingService

Sorumluluklar:

- Raw owner token uretir.
- Raw token'i SHA-256 + URL-safe Base64 ile hashler.
- Public slug uretir.

Detay:

- Owner token icin 32 random byte kullanilir.
- Public slug icin 6 random byte kullanilir, URL-safe Base64 ile yaklasik 8 karakter uretilir.
- DB'de raw owner token saklanmaz.

### 11.2 ScoringEngineService

Seenly'nin ana hesaplama motorudur.

#### Normalize

```text
normalized = (answerValue - 1) / 4.0
```

1 -> 0.0, 3 -> 0.5, 5 -> 1.0.

#### Lens Cikarma

```text
classic_self_samimiyet_01 -> samimiyet
classic_friend_zeka_01    -> zeka
```

Kod:

```java
questionId.split("_")[2]
```

#### Social Family Hesaplama

Backend family skor formulleri:

- `grounded_presence`: `(olgunluk + guvenilirlik + samimiyet) / 3`
- `warm_access`: `(samimiyet + comertlik + enerji) / 3`
- `hidden_depth`: `(zeka + vizyon + olgunluk) / 3`
- `clear_energy`: `(cekicilik + basari + ego + enerji) / 4`

En yuksek family skoru secilir.

#### Social Signature Hesaplama

45 signature vardir. Her signature iki sinyalden olusur. Her kart icin:

```text
score = signal1_percent * signal2_percent
```

En yuksek score alan kart secilir.

Signature sinyal eslemeleri:

- `the_leader`: basari + olgunluk
- `the_visionary`: vizyon + zeka
- `the_magnet`: cekicilik + enerji
- `the_safe_haven`: guvenilirlik + samimiyet
- `the_social_star`: samimiyet + enerji
- `the_elite_mind`: vizyon + ego
- `the_noble_heart`: comertlik + samimiyet
- `the_silent_king`: olgunluk + zeka
- `the_alpha_achiever`: basari + ego
- `the_benevolent_guide`: comertlik + olgunluk
- `the_ice_queen_king`: cekicilik + ego
- `the_mastermind`: zeka + enerji
- `the_playmaker`: vizyon + basari
- `the_sweetheart`: samimiyet + cekicilik
- `the_empath`: samimiyet + zeka
- `the_dreamer`: samimiyet + vizyon
- `the_proud_friend`: samimiyet + ego
- `the_ambitious_sweetheart`: samimiyet + basari
- `the_calm_harbor`: samimiyet + olgunluk
- `the_seductive_mind`: cekicilik + zeka
- `the_aesthetic`: cekicilik + vizyon
- `the_charming_anchor`: cekicilik + guvenilirlik
- `the_star_player`: cekicilik + basari
- `the_party_host`: cekicilik + comertlik
- `the_mature_charm`: cekicilik + olgunluk
- `the_consultant`: zeka + guvenilirlik
- `the_know_it_all`: zeka + ego
- `the_strategist`: zeka + basari
- `the_intellectual_giver`: zeka + comertlik
- `the_innovator`: vizyon + enerji
- `the_idealist`: vizyon + guvenilirlik
- `the_philanthropist`: vizyon + comertlik
- `the_philosopher`: vizyon + olgunluk
- `the_golden_retriever`: enerji + guvenilirlik
- `the_showman`: enerji + ego
- `the_powerhouse`: enerji + basari
- `the_life_giver`: enerji + comertlik
- `the_steady_vibe`: enerji + olgunluk
- `the_gatekeeper`: guvenilirlik + ego
- `the_pillar`: guvenilirlik + basari
- `the_helper`: guvenilirlik + comertlik
- `the_protector`: guvenilirlik + olgunluk
- `the_proud_patron`: ego + comertlik
- `the_stoic_king`: ego + olgunluk
- `the_patron`: basari + comertlik

#### Self Result

Profil olusturulunca:

- Self answer ortalamalari hesaplanir.
- `selfFamilyId` hesaplanir.
- `selfSignatureId` hesaplanir.
- `confidenceBand = self_only` set edilir.
- Snapshot kaydedilir.

#### Outside / Gap Recalculate

Arkadas cevabi geldikce:

- `responseCount < 3`: `confidenceBand = forming`, outside/gap acilmaz.
- `responseCount >= 3`: friend answer ortalamalari hesaplanir, outside family/signature belirlenir, gap pattern ve strength hesaplanir, `confidenceBand = gap_open`.
- `responseCount >= 10`: `confidenceBand = stronger_signal`.

Kodda `outside_open` band'i teorik olarak mevcut ama mevcut kosullarda `responseCount >= 3` icin dogrudan `gap_open` set ediliyor.

#### Gap Pattern

Self ve outside arasindaki delta:

```text
delta = outsideAverage - selfAverage
```

Pattern skor mantigi:

- `warmer_outside`: samimiyet delta
- `louder_outside`: cekicilik delta + enerji delta
- `softer_outside`: samimiyet delta - ego delta
- `more_reserved_outside`: ego delta + olgunluk delta
- `clearer_outside`: guvenilirlik delta
- `hidden_depth`: zeka delta + vizyon delta
- `slow_reveal_gap`: olgunluk delta - enerji delta
- `misread_edge`: ego delta - samimiyet delta

En yuksek pattern secilir.

Gap strength:

- max absolute delta > 0.25: `strong`
- max absolute delta > 0.15: `clear`
- aksi halde: `subtle`

### 11.3 FriendResponseService

Arkadas response submit akisini transaction icinde yonetir.

Adimlar:

1. Public slug ile Seenly profilini bulur.
2. Free/premium kota kontrolu yapar.
3. ResponseSession'i Seenly ile baglar ve kaydeder.
4. `responseCount` degerini artirir.
5. Kota dolduysa `isCapped=true` yapar.
6. `saveAndFlush` ile optimistic lock kontrolunu tetikler.
7. Snapshot'i yeniden hesaplatir.
8. Reader style hesaplar.
9. Session reader'a bagliysa XP verir.
10. Reader style ID doner.

Kota mantigi:

- Premium kullanici icin limit `Integer.MAX_VALUE`.
- Premium degilse limit `baseFormCapacity + purchasedExtraCapacity`.
- User yoksa default limit 3.

### 11.4 ReaderGameService

Reader gamification mantigidir.

XP:

- Her completed friend quiz: 15 XP.
- Transaction action type: `completed_friend_quiz`.

Level esikleri:

- 0-49 XP: level 1
- 50+ XP: level 2
- 150+ XP: level 3
- 350+ XP: level 4
- 700+ XP: level 5
- 1200+ XP: level 6

Accuracy:

Arkadas cevaplari ile sahibin self cevaplari sinyal bazinda karsilastirilir.

```text
totalDiff = sum(abs(friendAnswer - selfAnswer))
maxDiff = count * 4
accuracy = 100 * (1 - totalDiff / maxDiff)
```

Reader style:

- `accuracy >= 90`: `telepathic_reader`
- `accuracy >= 75`: `clear_reader`
- `accuracy >= 55`: `balanced_reader`
- `accuracy >= 35`: `casual_explorer`
- aksi halde: `social_stranger`

## 12. Privacy, Guvenlik ve Abuse Koruma

### 12.1 Token Guvenligi

- Owner token raw olarak DB'de tutulmaz.
- `TokenHashingService.hashToken` SHA-256 + URL-safe Base64 kullanir.
- Token profile sahipligini kanitlamak icin path veya header ile kullanilir.

### 12.2 Public Slug

- Arkadas linkinde public slug kullanilir.
- Slug kisa ve URL-safe random string'dir.
- Slug sahibi panele erisim vermez; sadece public/friend akisini acar.

### 12.3 Zero-Leak Privacy

`ResultSnapshotDto` response count 3'ten azsa:

- `outsideSignatureId = null`
- `outsideFamilyId = null`
- `gapPatternId = null`
- `gapStrength = null`

Bu, az sayida arkadas cevabindan bireysel cevabi tahmin etmeyi zorlastirmak icin uygulanir.

### 12.4 Self-Evaluation Engeli

Friend endpointleri `X-Owner-Token` header'ini kontrol eder. Header'daki token, public slug'in owner token hash'i ile eslesirse cevap engellenir.

Frontend ayrica:

- Kullanici kendi owner slug'ina sahip friend route'una giderse dashboard'a yonlendirir.

### 12.5 Duplicate / Spam Koruma

Backend:

- IP adresi `httpRequest.getRemoteAddr()`
- Browser fingerprint hash

Bu ikili ile ayni profile tekrar cevap engellenir.

Frontend:

- Browser fingerprint user agent + language + screen width uzerinden basit hash ile hesaplanir.
- Cevaplanan slug'lar `localStorage.seenly_evaluated_slugs` icinde tutulur.

Not: Bu koruma temel seviyededir. VPN, farkli cihaz veya browser storage temizligi gibi durumlarda asilamaz degildir.

### 12.6 Eszamanli Kota Koruma

`Seenly.version` alaninda JPA `@Version` vardir. `FriendResponseService` response count artirdiktan sonra `saveAndFlush` yaparak optimistic locking kontrolunu tetikler. Ayni anda gelen submit'lerde quota race condition azaltir.

## 13. Ucretlendirme ve Kota Sistemi

### 13.1 Free Plan

User yoksa veya premium degilse default:

- `baseFormCapacity = 3`
- `purchasedExtraCapacity = 0`
- Toplam limit = 3

`responseCount >= limit` oldugunda:

- `seenly.isCapped = true`
- Yeni friend submit `QuotaExceededException` ile 403 doner.

### 13.2 Plus

`POST /api/billing/subscribe-plus`:

- User olusturur veya mevcut user'i alir.
- `isPremium = true`
- Profil uncapped olur.
- Limit frontend DTO'da `maxResponseLimit = -1` olarak doner.

### 13.3 Ek Kapasite Paketleri

`POST /api/billing/buy-pack?amount=...`

Gecerli paketler:

- 100
- 250
- 500

Ek kapasite `User.purchasedExtraCapacity` alanina eklenir.

### 13.4 Gercek Odeme Durumu

Mevcut kodda Stripe/Iyzico/PayPal gibi gercek bir odeme entegrasyonu yoktur. Billing endpointleri owner token ile dogrudan plan/kota gunceller. Production icin gercek checkout, webhook dogrulama ve entitlement senkronizasyonu eklenmelidir.

## 14. Hata Yonetimi

`GlobalExceptionHandler` merkezi hata cevaplari uretir.

Kapsanan hata tipleri:

- `ResourceNotFoundException`: 404
- `FreeCapReachedException`: 400
- `QuotaExceededException`: 403
- `MethodArgumentNotValidException`: 400
- `ObjectOptimisticLockingFailureException`: 409
- Genel `Exception`: 500

Hata response modeli:

- `timestamp`
- `status`
- `error`
- `message`
- `path`

## 15. Kurulum ve Calistirma

### 15.1 Gereksinimler

- Java 17+
- Maven
- Node.js 18+ onerilir
- npm
- PostgreSQL opsiyonel; H2 dependency mevcut ancak repo icinde `application.properties` gorunmuyor.

### 15.2 Backend

```bash
cd backend
mvn spring-boot:run
```

Varsayilan backend portu Spring Boot default davranisi ile `8080` olur.

Onemli not:

- Repo icinde `backend/src/main/resources/application.properties` bulunmuyor.
- Spring Boot Data JPA ve hem PostgreSQL hem H2 runtime dependency mevcut.
- Veritabani konfigurasyonu devralan kisi tarafindan netlestirilmelidir.
- Eger H2 auto-config kullanilacaksa datasource ayarlari gerekebilir.
- Production icin PostgreSQL datasource, username/password, ddl-auto/migration ayarlari mutlaka belirlenmelidir.

### 15.3 Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite dev server:

```text
http://localhost:3000
```

Proxy:

```text
/api -> http://localhost:8080
```

Production build:

```bash
cd frontend
npm run build
```

Preview:

```bash
cd frontend
npm run preview
```

### 15.4 Environment

Frontend opsiyonel env:

```text
VITE_API_URL=https://api.example.com
```

Bos birakilirsa relative `/api/...` kullanilir.

Backend icin production'da tipik olarak gerekli olacak env/properties:

```properties
spring.datasource.url=jdbc:postgresql://...
spring.datasource.username=...
spring.datasource.password=...
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

Not: Bu ayarlar repo icinde mevcut degil; deployment ortaminda saglanmalidir.

## 16. Test Durumu

Repo icinde gorunen aktif test dosyasi bulunmuyor. `spring-boot-starter-test` dependency mevcut, ancak otomatik test kapsami yazilmamis gorunuyor.

Devralan kisi icin onerilen ilk testler:

- `ScoringEngineService` unit testleri
- `ReaderGameService` accuracy ve level testleri
- `FriendResponseService` kota/duplicate/concurrency testleri
- `SeenlyController` API integration testleri
- Frontend icin quiz akisi ve route guard smoke testleri

## 17. Bilinen Teknik Borclar ve Dikkat Noktalari

1. README karakter kodlamasi bozuk gorunuyor.

   Terminalde README ve bazi dosya import path'leri mojibake olarak gorunuyor. Dosyalarin gercek encoding'i, editor ve git ayarlari kontrol edilmeli.

2. Gercek e-posta yok.

   OTP sistemi mock. Kod sabit `123456`. Production'a cikmadan mail provider, kod saklama, expiry, rate limit ve brute force korumasi eklenmeli.

3. Gercek payment yok.

   Billing endpointleri dogrudan entitlement guncelliyor. Gercek odeme akisi ve webhook dogrulamasi yok.

4. Backend config eksik.

   `application.properties` gorunmuyor. DB ve JPA davranisi netlestirilmeli.

5. Answer value range validasyonu eksik.

   DTO'larda `answerValue` icin 1-5 yorumu var ama `@Min(1)` / `@Max(5)` validasyonu gorunmuyor.

6. Public/private DTO ayrimi zayif.

   `getOwnerDashboard` ve `getPublicDashboard` ayni `ResultSnapshotDto` modelini kullaniyor. DTO her ne kadar <3 response icin masking yapsa da owner/public ayrimi ileride daha net yapilabilir.

7. ResponseSessionDto nickname'i maskeleyerek `"unknown_person"` donuyor.

   Bu privacy icin dogru olabilir; ancak nickname UI'da bekleniyorsa davranis tasarimla netlestirilmeli.

8. Reader XP akisi tam bagli degil.

   Friend response session'da `reader` nullable ve frontend friend submit'te login user reader olarak baglanmiyor. Bu nedenle XP verme pratikte her zaman calismayabilir.

9. Browser fingerprint basit.

   User agent + language + screen width hash'i guvenlik icin yeterli degil, sadece hafif abuse korumasi saglar.

10. `dist`, `target`, `node_modules` gibi ciktinin repo durumunda oldugu gorunuyor.

    Devralan kisi versiyon kontrol politikasini temizlemeli.

11. Identities aileleri ile backend family ID'leri farkli sistemler.

    Bu bilincli editorial ayrim olabilir; ama dokumante edilmezse kafa karistirabilir.

12. `outside_open` confidence band'i backend'de fiilen kullanilmiyor gibi.

    Kodda `responseCount >= 3` icin dogrudan `gap_open`, `>=10` icin `stronger_signal` set ediliyor.

13. Account deletion frontend tarafinda `site-header.jsx` icinden fetch ile dogrudan yapiliyor.

    `services/api.js` icinde merkezi `deleteAccount` fonksiyonu yok.

## 18. Devralma Icin Oncelikli Yol Haritasi

### Kisa Vadeli

- Encoding sorunlarini temizle.
- `.gitignore` politikasini netlestir; `node_modules`, `dist`, `target` gibi ciktinin repo durumunu duzenle.
- Backend `application.properties` veya environment config dosyasini ekle.
- Answer value icin `@Min(1)` ve `@Max(5)` validasyonlari ekle.
- Mock OTP yerine en azindan expiry'li ve rate limit'li gecici kod modeli kur.
- Billing endpointlerini production'da korumaya al veya gercek odeme entegrasyonuna bagla.

### Orta Vadeli

- Unit/integration testleri ekle.
- Owner DTO ve public DTO'yu ayir.
- Reader profile login/session baglantisini tamamla.
- Duplicate koruma icin daha saglam rate limit ve device/session modeli ekle.
- DB migration icin Flyway veya Liquibase ekle.
- API hata mesajlarini locale veya standart hata kodlari ile tasarla.

### Uzun Vadeli

- Gercek auth sistemi.
- Gercek email provider.
- Gercek payment ve subscription lifecycle.
- Admin panel / analytics panel.
- A/B test veya skor versiyonlama sistemi.
- Skoring engine'in config-driven hale getirilmesi.

## 19. Hizhli Referans

### Frontend komutlari

```bash
cd frontend
npm install
npm run dev
npm run build
npm run preview
```

### Backend komutlari

```bash
cd backend
mvn spring-boot:run
mvn test
```

### Ana endpointler

```text
POST   /api/v1/seenly/create
POST   /api/v1/seenly/auth/send-code
POST   /api/v1/seenly/auth/verify-code
POST   /api/v1/seenly/auth/login-email
GET    /api/v1/seenly/owner/{ownerToken}
GET    /api/v1/seenly/public/{publicSlug}
POST   /api/v1/seenly/friend/{publicSlug}/check-eligibility
POST   /api/v1/seenly/friend/{publicSlug}/respond
POST   /api/v1/seenly/profile/{publicSlug}/increment-click
POST   /api/billing/subscribe-plus
POST   /api/billing/buy-pack
DELETE /api/billing/delete-account
```

### Ana frontend route'lari

```text
#/
#/dashboard
#/identities
#/faq
#/plans
#/friend/{slug}
#/friend/{slug}/quiz
#/friend/{slug}/result
```

### Mock OTP

```text
123456
```

### Minimum cevap esigi

```text
3 friend response
```

### Default free kapasite

```text
3 response
```

## 20. Devralacak Kisi Icin Mental Model

Seenly'yi anlamanin en pratik yolu sudur:

1. `QuizPage` self cevaplari toplar.
2. `SeenlyController.createSeenly` profil, token, slug ve self snapshot uretir.
3. `DashboardPage` owner token ile snapshot'i okur.
4. Arkadas linki `FriendIntroPage` ile acilir.
5. `FriendQuizPage` friend cevaplarini ve cevap surelerini toplar.
6. `FriendResponseService` cevaplari kaydeder, kota kontrol eder ve snapshot'i yeniler.
7. `ScoringEngineService` sosyal kimlikleri ve gap'i hesaplar.
8. `ReaderGameService` cevaplayan arkadasin accuracy ve reader style sonucunu hesaplar.
9. Frontend locale JSON dosyalari semantic ID'leri kullaniciya gorunen metinlere cevirir.

Bu nedenle projede yeni bir sonuc tipi, yeni bir soru, yeni bir kart veya yeni bir analiz eklenecekse hem backend semantic ID hesaplama mantigi hem frontend locale/asset kataloglari birlikte guncellenmelidir.
