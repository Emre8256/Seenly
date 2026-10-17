# 10Signal Email Notification Architecture & Production Guide

This document outlines the architecture, transactional outbox mechanism, provider abstraction, security model, and production deployment configuration for 10Signal's email notification system.

---

## 1. Architecture Overview

To ensure high availability, zero latency penalty on HTTP request threads, and strict transactional consistency, business services NEVER invoke SMTP or mail delivery networks directly.

```
┌──────────────────────────────┐
│       Business Service       │
│  (Auth, Friend, Payment...)  │
└──────────────┬───────────────┘
               │ 1. enqueue() within same DB transaction
               ▼
┌──────────────────────────────┐
│   EmailNotificationService   │
│ ┌──────────────────────────┐ │
│ │ User Preferences Check   │ │
│ │ AES-GCM OTP Encryptor    │ │
│ └──────────────────────────┘ │
└──────────────┬───────────────┘
               │ 2. PostgreSQL insert
               ▼
┌──────────────────────────────┐
│         email_outbox         │ (Transactional Table)
│  (FOR UPDATE SKIP LOCKED)    │
└──────────────┬───────────────┘
               │ 3. Batch Claim
               ▼
┌──────────────────────────────┐
│      EmailOutboxWorker       │ (@Scheduled batch daemon)
└──────────────┬───────────────┘
               │ 4. send(EmailMessage)
               ▼
┌──────────────────────────────┐
│         EmailSender          │ (Interface)
└───────┬──────────────┬───────┘
        │              │
        ▼              ▼
┌───────────────┐ ┌───────────────────────┐
│ DisabledEmail │ │   SmtpEmailProvider   │
│   Provider    │ │ (MIME Multipart HTML) │
│ (No Network)  │ └───────────────────────┘
└───────────────┘
```

---

## 2. Provider Switching & Configuration

The application supports Brevo as the primary transactional email provider:
```properties
# Production:
EMAIL_PROVIDER=brevo
BREVO_API_KEY=xkeysib-your_api_key_here
BREVO_SENDER_EMAIL=mail@10signal.me
BREVO_SENDER_NAME=10Signal
BREVO_REPLY_TO=10signal.me@gmail.com

# Development / CI default:
EMAIL_PROVIDER=disabled
```

### In Brevo Mode (Production Default):
- Activated by setting `EMAIL_PROVIDER=brevo` (or leaving default).
- Uses Brevo Transactional Email REST API (`POST https://api.brevo.com/v3/smtp/email`).
- Requires `BREVO_API_KEY` with Transactional Email permissions.
- Central sender: `10Signal <mail@10signal.me>`.
- Central reply-to: `10signal.me@gmail.com`.
- Passes email headers (`X-Entity-Ref-ID`, `X-Notification-Type`) and tags.
- Errors are classified into:
  - **Retryable** (transient network errors, rate limit `429`, server errors `5xx`): scheduled for retry with exponential backoff.
  - **Permanent / Terminal** (`4xx` client errors, e.g., invalid auth, bad payload): immediately marked as `FAILED` to prevent futile retries.
- Brevo API key, raw OTPs, and HTML bodies are strictly redacted and never logged.
- If `EMAIL_PROVIDER=brevo` is configured in production without a valid `BREVO_API_KEY`, startup fails fast.

### In Disabled Mode:
- Zero live network calls or socket connections are initiated.
- No live credentials or API keys are required.
- The application boots cleanly in dev, CI, and test environments.
- Outbox workers safely process items, transition records to `SENT`, and emit `email.provider.disabled` metrics and `EMAIL_PROVIDER_DISABLED` audit events without errors.

### In SMTP Mode:
- Activated by setting `EMAIL_PROVIDER=smtp`.
- Reads SMTP connection details from standard environment variables.
- Assembles standard MIME Multipart (`text/plain` + `text/html`) messages with UTF-8 character encoding.
- Protects against SMTP CRLF header injection on `to`, `subject`, and `replyTo`.

---

## 3. Transactional Outbox & Concurrency Control

The PostgreSQL table `email_outbox` manages delivery state across multiple distributed container/server instances.

### Table Schema Highlights
- `id`: Primary key (UUID).
- `notification_type`: One of the 14 supported notification types.
- `recipient`: E-mail address (purged upon account deletion delivery).
- `recipient_hash`: SHA-256 hash for idempotent queries and analytics without PII exposure.
- `locale`: Resolved locale code (`tr`, `en`).
- `payload_json`: Context data (AES-256-GCM encrypted for OTPs).
- `status`: `PENDING`, `PROCESSING`, `SENT`, `FAILED`, `SKIPPED`.
- `scheduled_at` / `next_attempt_at`: Timestamps for scheduled releases and retries.
- `attempts` / `max_attempts`: Bounded retry counter (default max 5).
- `expires_at`: Strict expiration deadline.
- `idempotency_key`: Unique constraint `uk_email_outbox_idempotency_key`.

### Multi-Instance Safe Job Claiming
Jobs are claimed using PostgreSQL's native locking mechanism:
```sql
SELECT * FROM email_outbox
WHERE status = 'PENDING'
  AND next_attempt_at <= :now
  AND scheduled_at <= :now
ORDER BY scheduled_at ASC
LIMIT :limit
FOR UPDATE SKIP LOCKED;
```
This guarantees that multiple worker threads and multi-instance containers process distinct rows simultaneously with zero collision and zero duplicate emails.

---

## 4. Exponential Backoff & Expiry

When a transient SMTP failure occurs, the worker increases `attempts` and applies exponential backoff:
- Attempt 1 failure: retry after **1 minute**
- Attempt 2 failure: retry after **5 minutes**
- Attempt 3 failure: retry after **15 minutes**
- Attempt 4 failure: retry after **1 hour**
- Attempt 5 (max): transitions status permanently to **`FAILED`** and records `EMAIL_DELIVERY_FAILED`

### Strict Expiry
If `expires_at` is set (mandatory for OTPs) and the current timestamp exceeds `expires_at`, the record is marked `SKIPPED` and NEVER delivered.

---

## 5. Security & OTP Protection

1. **PBKDF2 Password/OTP Hashing**:
   - The primary OTP challenge table stores only one-way PBKDF2 hashes.
2. **Encrypted Outbox Payload**:
   - Plaintext OTPs are NEVER stored unencrypted in `email_outbox.payload_json`.
   - The payload is encrypted with authenticated **AES-256-GCM** using a dedicated application secret (`EMAIL_OTP_PAYLOAD_SECRET`).
   - Only decrypted in volatile memory by the worker immediately before delivery.
3. **Zero PII in Logs & Metrics**:
   - Logs redact recipient email (e.g. `u***@example.com`).
   - OTP codes, tokens, session IDs, and payment secrets are NEVER logged.
   - `EmailMessage.toString()` outputs `to=<redacted>`.
4. **Header Injection Defense**:
   - Strict regex validation rejects any `\r` or `\n` characters in `to`, `subject`, and `replyTo`.

---

## 6. Internationalization (i18n)

Templates are defined in locale-specific JSON files:
- `src/main/resources/i18n/email/tr/notifications.json`
- `src/main/resources/i18n/email/en/notifications.json`

### Key Features:
- **Zero hardcoded user-facing email text in Java code.**
- **No `if (locale == ...)` branching in business logic.**
- **Hierarchical Fallback**: `requested locale -> language prefix (e.g. tr-TR -> tr) -> canonical English fallback (en)`.
- **HTML Escaping**: Context variables are automatically HTML-escaped to prevent XSS.
- **Responsive Layout**: Dark-themed, mobile-optimized editorial design with preheader, container card, logo, action CTA button, and footer.

---

## 7. Supported Notification Types & Lifecycles

| Type | Category | Idempotency Key Format | Lifecycle / Rule |
| :--- | :--- | :--- | :--- |
| `FIRST_SHARE_REMINDER` | Reminders | `first-share-reminder:{tenSignalId}` | Scheduled +24h after profile creation. Cancelled if `responseCount >= 3`. |
| `NEW_EVALUATION` | Evaluations | `new-evaluation:{tenSignalId}:{10mBucket}` | 10-minute debounce window. Multiple responses aggregate into a single email. |
| `REPORT_UNLOCKED` | Reminders | `report-unlocked:{tenSignalId}` | Triggered on exact `2 -> 3` response count transition. Exactly once. |
| `INACTIVITY_REMINDER` | Reminders | `inactivity-reminder:{tenSignalId}:{cycle}` | Triggered after 7 days without activity. Enforces minimum 30-day cooldown. |
| `CAPACITY_80_PERCENT` | Capacity Alerts | `capacity-80:{tenSignalId}:{capacityVersion}` | Triggered on threshold crossing `prev < 80% && next >= 80%`. |
| `CAPACITY_FULL` | Capacity Alerts | `capacity-full:{tenSignalId}:{capacityVersion}` | Triggered when capacity is reached. Never spammed on re-attempts. |
| `PLUS_WELCOME` | Transactional | `plus-welcome:{txId}` | Triggered upon verified PLUS grant. Strictly uses "one-time purchase" terminology (never "subscription"). |
| `PURCHASE_RECEIPT` | Transactional | `purchase-receipt:{txId}` | Official receipt containing product, amount, currency, reference. Zero card numbers or secrets. |
| `EMAIL_CHANGED` | Transactional | `email-changed:{tenSignalId}:{oldEmailHash}:{epoch}` | Sent to the **old** email address immediately after verified email change. |
| `ACCOUNT_DELETED` | Transactional | `account-deleted:{userId}:{epoch}` | Enqueued before user deletion. Recipient is purged after send. |
| `LOGIN_VERIFICATION` | Transactional | `otp-login:{hash}:{epoch}` | Short-lived encrypted OTP. |
| `REGISTRATION_VERIFICATION` | Transactional | `otp-register:{hash}:{epoch}` | Short-lived encrypted OTP. |
| `EMAIL_CHANGE_VERIFICATION` | Transactional | `otp-email-change:{hash}:{epoch}` | Short-lived encrypted OTP. |
| `SOCIAL_CARD_CHANGED` | Card Changes | `social-card-changed:{tenSignalId}:{outsideSig}` | Triggered on authoritative outside archetype state transition in `ScoringEngineService`. |

---

## 8. User Notification Preferences

Owners can control non-transactional notification categories via:
- `GET /api/v1/tensignal/owner/notification-preferences`
- `PUT /api/v1/tensignal/owner/notification-preferences`

Supported toggles:
- `evaluations`: Controls `NEW_EVALUATION`.
- `reminders`: Controls `FIRST_SHARE_REMINDER`, `INACTIVITY_REMINDER`, `REPORT_UNLOCKED`.
- `cardChanges`: Controls `SOCIAL_CARD_CHANGED`.
- `capacityAlerts`: Controls `CAPACITY_80_PERCENT`, `CAPACITY_FULL`.

**Security Guarantee**: Transactional notifications (`LOGIN_VERIFICATION`, `REGISTRATION_VERIFICATION`, `EMAIL_CHANGE_VERIFICATION`, `PLUS_WELCOME`, `PURCHASE_RECEIPT`, `EMAIL_CHANGED`, `ACCOUNT_DELETED`) CANNOT be opted out of.

---

## 9. Account Deletion & PII Retention

When an account is deleted:
1. An `ACCOUNT_DELETED` notification is enqueued with a short 24-hour expiration window.
2. Email delivery failure does not roll back account deletion.
3. Upon successful email delivery by the worker:
   - Plaintext `recipient` is replaced with `purged@deleted.tensignal.app`.
   - `payload_json` is cleared to `{}`.
   - `recipient_hash` is retained for idempotency and security deduplication without PII.

---

## 10. Production Configuration & Provider Setup

To run in production with Brevo as the official email provider:

```bash
# 1. Enable Brevo Provider
EMAIL_PROVIDER=brevo

# 2. Brevo API Key
BREVO_API_KEY=xkeysib-your_brevo_api_key

# 3. Sender & Reply-To Addresses
BREVO_SENDER_EMAIL=mail@10signal.me
BREVO_SENDER_NAME=10Signal
BREVO_REPLY_TO=10signal.me@gmail.com

# 4. Outbox Worker Tuning
EMAIL_OUTBOX_BATCH_SIZE=20
EMAIL_OUTBOX_INTERVAL_MS=5000
EMAIL_OTP_PAYLOAD_SECRET=your_256bit_production_secret_key
```

---

## 11. Safe Live Smoke Testing

To test real email delivery to a single designated recipient without touching the outbox database or broadcasting to real users:

```powershell
# Via Maven test runner:
mvn test -Dtest=BrevoSmokeTestRunner -Dsmoke.recipient=your-email@example.com
```
