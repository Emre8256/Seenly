# 10Signal production resilience and disaster recovery

## Runtime failure policy

Database work in account creation/change/deletion, participant submission, scoring, payment ledger processing,
and entitlement projection runs in Spring transactions. A database or lock failure is never converted into
success. The API returns a generic correlated 503 for database availability failures and a retryable 409 for
concurrency conflicts. PostgreSQL/Hikari reconnect automatically after a temporary outage; readiness includes
`db` and therefore changes to unhealthy until a connection succeeds again.

OTP challenges and transactional email notifications are managed via the Transactional Outbox pattern.
The OTP challenge record and its encrypted outbox entry (`email_outbox`) are persisted within the same database
transaction. The asynchronous `EmailOutboxWorker` daemon claims pending outbox entries using `FOR UPDATE SKIP LOCKED`
and delivers them via Brevo (or SMTP if selected) with exponential backoff and strict expiration deadlines.
If an outbox insertion fails, the entire database transaction rolls back. Live external mail network calls never
block the HTTP request thread, and transient delivery failures are safely retried without advertising an invalid state.

Checkout preparation commits a `CREATED` ledger row before calling the provider. Provider timeout, 5xx, or a
malformed response never grants entitlement and leaves that row available for reconciliation. Provider calls do
not run while a database transaction is held. Webhook ledger, event-id record, and entitlement projection remain
one transaction. A failed transaction stores no event-id, so the provider can safely retry. Transaction-row
pessimistic locking plus provider event uniqueness serializes concurrent and duplicate delivery. Timestamp and
final-state rules ignore stale/regressive events; refunds and chargebacks cannot be undone by replayed paid events.

Expired OTP, verification-grant, and rate-limit rows are deleted in independently committed batches (default 500,
hard maximum 5,000). A failed batch is logged and metered, later types still run, and the next schedule retries.
Deletes are idempotent and safe when multiple instances select the same expired identifiers.

## Shutdown and startup

Spring graceful shutdown stops accepting new traffic and allows up to 20 seconds for in-flight requests. Configure
the container/orchestrator termination grace period to at least 30 seconds so lifecycle signalling and the bounded
Spring shutdown phase can complete. The readiness endpoint is on the management port and includes Spring
readiness state plus DB connectivity. Flyway runs before Hibernate validation and readiness; a failed migration or
missing required production database/SMTP/CORS configuration prevents successful production startup. Disabled
payments and the optional error monitor remain valid and do not affect core readiness.

## PostgreSQL backup

Use provider-managed physical backups/PITR where available and schedule encrypted logical backups as an independent
restore path. Example (credentials must come from a protected `.pgpass`/secret manager, never command history):

```sh
pg_dump --format=custom --no-owner --no-acl --file=seenly.dump "$DATABASE_URL"
pg_restore --list seenly.dump
```

Record PostgreSQL version, backup timestamp, Flyway version from `flyway_schema_history`, checksum, encryption key
reference, and retention/expiry. Store backups in a separate account/region with restricted and audited access.

## Restore drill

Restore only into an isolated, empty database using a least-privileged drill account:

```sh
createdb seenly_restore_drill
pg_restore --exit-on-error --single-transaction --no-owner --no-acl --dbname=seenly_restore_drill seenly.dump
```

Then run the current application once with the restored DB and production-equivalent Flyway settings. Flyway must
apply only migrations newer than the restored `flyway_schema_history`; never run `clean`. Validate counts and
relationships without exporting private row contents:

```sql
select version, description, success from flyway_schema_history order by installed_rank;
select count(*) from users;
select count(*) from seenlys;
select count(*) from response_sessions;
select status, count(*) from payment_transactions group by status;
select entitlement_type, status, count(*) from payment_transactions group by entitlement_type, status;
select count(*) from otp_challenges where consumed_at is null and expires_at > now();
select count(*) from verification_grants where consumed_at is null and expires_at > now();
```

Also verify: every profile user reference resolves; response sessions and answers retain their parent; paid ledger
rows with granted entitlements match the user projection; reversed/refunded/chargeback rows retain their reversal
status; owner sessions are still hashed and expiry/revocation timestamps are intact. Exercise owner login, one
public read, a disposable participant submission, and a signed provider test only in an isolated non-production
environment. Destroy the drill database securely after recording results. A backup is not considered usable until
this drill completes on a regular schedule and its recovery time/data-loss objectives are recorded.

## Failure signals

Alert on DB readiness/Hikari acquisition failures, `tensignal.resilience.failures` by bounded `type`, cleanup failures,
SMTP delivery failures, provider failures, webhook retry accumulation, and concurrency conflicts. Correlate with
request IDs; none of these signals may contain email, IP, token, answers, signature, payload, or provider secret.
