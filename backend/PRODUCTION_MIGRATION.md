# Seenly production database migration

## Required preparation

Take and verify a restorable PostgreSQL backup before the first Flyway-enabled
deployment. Stop application writes during the initial upgrade. The migrations
are forward-only and are not claimed to be reversible.

For an empty database, Flyway runs `V1__initial_schema.sql` followed by
`V2__harden_legacy_security_state.sql`. Hibernate then validates the migrated
schema and never creates or updates production objects.

For an existing Hibernate-managed database, Flyway's `baseline-on-migrate`
records baseline version 1 and runs V2. This path assumes the original core
tables (`users`, `seenlys`, `response_sessions`, response and snapshot tables)
exist with the column names produced by the current Spring naming strategy.
Confirm this against a restored copy of the production database first.

## Legacy security data

V2 adds the owner-session columns and creates OTP challenge, verification grant,
and database rate-limit tables when absent. Existing response fingerprint and IP
values that are not already 43-character Seenly SHA-256 base64url values are
pseudonymized in place with the same domain-separated algorithm used by the
application. Raw values are not retained by the migration.

The 43-character format check is the only schema evidence available to
distinguish already-hashed values from legacy values. Review a restored data
sample before rollout if historical deployments wrote a different 43-character
raw format.

After normalization, V2 checks `(seenly_id, fingerprint_hash)` duplicates before
adding the unique constraint. It deliberately raises a diagnostic exception and
rolls the transaction back if duplicates or missing fingerprints exist. It does
not delete or merge responses. To remediate:

1. Export the affected target, session IDs, timestamps, and response ownership
   context from a restored backup.
2. Decide through an audited product/data review which records are legitimate.
3. Apply an approved data correction separately.
4. Re-run Flyway, then confirm Hibernate schema validation and readiness.

Rollback requires restoring the pre-deployment backup. Removing the Flyway
history row or manually reversing DDL is not a safe rollback procedure because
pseudonymization is intentionally one-way.

## Proxy trust

Set `TRUSTED_PROXY_CIDRS` only to the literal IP/CIDR ranges of proxies that
directly connect to the application. With an empty value all forwarded headers
are ignored. The resolver consumes `X-Forwarded-For` only when the immediate
peer is trusted and walks the chain from the closest hop outward. Do not expose
the application port directly around the trusted proxy.

## Payment provider activation

Payment processing defaults to `PAYMENT_PROVIDER=disabled`. Checkout and
webhook processing therefore cannot grant an entitlement until a real, signed
provider adapter is implemented and selected. The `test-hmac` adapter is
test-profile-only and is explicitly forbidden by production startup checks.
