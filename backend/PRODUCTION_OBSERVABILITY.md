# 10Signal production observability

## Log format and request correlation

The `prod` profile writes one JSON object per line to standard output. Log records contain the timestamp, level,
logger, message, `service=tensignal-backend`, and the active MDC fields. The request-completion event is
`http_request_completed` and includes `requestId`, `httpMethod`, normalized `httpPath`, `httpStatus`, and
`durationMs`. Query strings and global request/response bodies are deliberately excluded.

Clients may send `X-Request-ID` using 1-64 ASCII letters, numbers, dots, underscores, or hyphens, beginning with
an alphanumeric character. Missing or invalid values are replaced with a cryptographically random 144-bit
base64url identifier. The effective value is returned in `X-Request-ID`, remains in MDC during request handling,
and is removed in a `finally` block. Operators should use this ID to join reverse-proxy, application, and error
monitoring events; it must never be replaced by an owner token or user identifier.

## Audit event catalog

Audit logs use logger `tensignal.audit`, message `security_audit_event`, `auditEvent`, `auditOutcome`, and a small
allowlist of categorical fields. Events cover OTP request/verification, authentication, invalid owner sessions,
expiry/revocation/logout, account creation/email change/deletion, rate limiting, participant acceptance/rejection,
duplicate responses, checkout creation, verified/rejected/duplicate payment events, entitlement grants, refunds,
and chargebacks. They intentionally contain no email, IP, slug, owner/transaction/session UUID, fingerprint,
answer, token, grant, signature, or payload.

## Metrics catalog

Prometheus is exposed in the production profile at `/actuator/prometheus`; `/actuator/health`, liveness, and
readiness remain available. These endpoints use the separate management port `MANAGEMENT_PORT` (default `8081`).
The deployment ingress, firewall, or service mesh must restrict that port to the monitoring network. Do not publish
it through the public frontend route.

Application counters:

| Metric | Bounded labels |
| --- | --- |
| `tensignal.auth.otp.requests` | `purpose` |
| `tensignal.auth.otp.verifications` | `purpose`, `outcome` |
| `tensignal.auth.logins` | `outcome` |
| `tensignal.participant.submissions` | `outcome` |
| `tensignal.security.rate_limits` | `policy` (allowlisted; otherwise `OTHER`) |
| `tensignal.payment.checkouts` | `outcome` |
| `tensignal.payment.webhooks` | `event_type`, `outcome` |
| `tensignal.payment.entitlements` | `type`, `outcome` |
| `tensignal.resilience.failures` | `type` (bounded failure category) |
| `tensignal.cleanup.runs` | `type`, `outcome` |

Spring Boot supplies `http.server.requests` (count, duration, normalized route, status/outcome), JVM memory,
CPU, thread, process, and Hikari connection-pool metrics. Derive HTTP request count, latency, 4xx, and 5xx rates
from `http.server.requests`. Never add email, slug, UUID, IP, fingerprint, token, or transaction reference labels.

Readiness includes application readiness state and database health. Liveness intentionally excludes external
providers. A disabled or unavailable optional payment provider does not make basic 10Signal traffic unhealthy.
SMTP failure affects account authentication but not existing public/participant traffic, so it is monitored with
OTP delivery failures and alerts rather than placed in the global readiness group. Health details remain hidden.

## Redaction and privacy policy

Never log request/response bodies, query strings, authorization headers, owner tokens, OTPs, verification grants,
SMTP/payment secrets, webhook signatures or payloads, raw IP/fingerprint signals, assessment answers, nickname,
or email. Sensitive DTO `toString()` output is empty/redacted. Keep framework request-body logging at INFO or
higher in production; do not enable Spring MVC or Hibernate bind-parameter TRACE logging during an incident.
Operational logs must not become a second assessment datastore.

Restrict application logs to production operators and security responders. A reasonable starting point is 14-30
days for request/application logs and 90 days for security audit logs, with encryption at rest and access auditing.
These are provisional: shorten or extend them only after legal/privacy review and incident-response requirements.
Do not retain either class indefinitely by default.

## Alert recommendations

Tune thresholds after establishing at least two weeks of normal traffic. Initial conditions are provisional:

- Page on sustained readiness failure or a nonzero 5xx ratio above the service's established error budget for
  5-10 minutes; ticket on shorter isolated spikes.
- Alert on p95/p99 latency exceeding the user-flow SLO for 10 minutes, separating public reads, submissions,
  authentication, and webhook routes.
- Page when Hikari active connections remain near the configured maximum and pending acquisition rises, or DB
  readiness fails. Correlate with database CPU and slow queries.
- Alert on a sharp deviation in OTP verification failure ratio, sustained rate-limit events per policy, participant
  rejected/capacity-exhausted ratio, or payment webhook rejected events. Use ratios and historical baselines rather
  than fixed global counts because traffic volume varies.
- Page on entitlement application failures or accumulating provider retries; alert immediately on chargeback
  anomalies according to finance risk policy.
- Alert when old-generation/heap usage remains above roughly 80-85% after GC, then tune to observed headroom.

## Optional central error monitoring

`ErrorMonitor` is the provider-neutral integration boundary. The default bean is a no-op and never blocks startup.
A future adapter can provide its own bean. It may receive the exception plus request ID, method, and normalized
path only. Configure any SDK to disable request bodies, cookies, query strings, headers, user identity, and local
variables by default; add server-side scrubbing for the sensitive values listed above. Monitoring delivery failure
must not alter the API response or readiness.

Unexpected exceptions return a stable generic 500 with the request ID, are emitted once by
`GlobalExceptionHandler`, and are offered once to `ErrorMonitor`. Expected validation, duplicate, rate-limit, and
authentication failures do not emit ERROR stack traces.

## Incident troubleshooting

1. Start from the client-visible `X-Request-ID` and locate `http_request_completed`.
2. Check normalized route, status, duration, readiness, DB/Hikari, JVM, and the relevant bounded application metric.
3. Review nearby `tensignal.audit` events without attempting to identify an anonymous participant.
4. For payment incidents, compare categorical event/outcome metrics with the provider console using provider-side
   references; never paste signatures or payloads into logs or tickets.
5. If extra diagnostics are required, add a narrow temporary safe metric or categorical audit field. Do not enable
   body/header/bind-value logging.
