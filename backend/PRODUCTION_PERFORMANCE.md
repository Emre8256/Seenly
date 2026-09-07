# Seenly production performance gate

Date: 2026-09-06

## Test environment

- Local Windows 10 Pro 22H2 workstation, AMD Ryzen 7 4800H (8 cores/16 logical processors), 15.4 GB RAM.
- Temurin Java 21.0.12.1, Node 24.12.0, PostgreSQL 16.11.
- Backend ran with the `prod` profile against an isolated PostgreSQL cluster on localhost.
- PostgreSQL: `max_connections=100`, `shared_buffers=128MB`. Hikari: maximum 10, minimum idle 2, connection timeout 20 seconds.
- Local loopback, process co-location, warm JVM, and no TLS mean these numbers are comparative capacity evidence, not an internet-scale SLA.

## Dataset and scenarios

The large profile contained 500 responses/5,000 participant answers at baseline and approximately 850 responses/8,500 answers after write tests. It also contained ten self answers, a result snapshot, premium owner history, and 5,000 expired rate-limit rows. One hundred independent profiles were used to distinguish a viral-profile lock from general write capacity.

`performance/node-load.mjs` covers public reads, eligibility, submissions, owner reads, invalid OTP verification, payment product reads, and intentional rate limiting. `performance/k6-seenly.js` provides the portable k6 public-read scenario. Distinct forwarded client addresses were accepted only because the test process was configured as a trusted proxy; the rate-limit scenario intentionally kept one address. Expected 409/429 responses are counted separately from failures.

The assumed launch peak is 25-100 concurrent clients. This is an assumption because production traffic history is unavailable.

## Backend results

All values are local measurements in milliseconds. Error rate means unexpected transport/5xx errors; it was 0% in every row below.

| Scenario | Concurrency / requests | Before RPS | Before p50/p95/p99 | After RPS | After p50/p95/p99 |
|---|---:|---:|---:|---:|---:|
| Public large profile | 1 / 100 | 18.99 | 40.98 / 83.13 / 154.52 | 43.35 | 18.95 / 28.59 / 34.21 |
| Public large profile | 25 / 500 | 78.63 | 271.78 / 674.15 / 925.52 | 185.18 | 103.65 / 293.42 / 458.79 |
| Public large profile | 50 / 1,000 | 129.68 | 309.96 / 826.60 / 1,203.03 | 347.41 | 140.58 / 256.22 / 366.00 |
| Public large profile | 100 / 1,500 | 123.94 | 605.06 / 2,190.64 / 3,596.89 | 272.46 | 341.82 / 665.56 / 733.40 |
| Eligibility | 25 / 250 | 331.81 | 65.26 / 132.71 / 152.67 | 217.40 | 115.92 / 162.08 / 172.90 |
| Eligibility | 50 / 500 | 359.97 | 131.08 / 185.77 / 226.23 | 279.96 | 167.29 / 297.15 / 346.04 |
| Viral submission | 1 / 5 | 7.87 | 93.48 / 261.52 / 261.52 | 13.82 | 38.07 / 208.33 / 208.33 |
| Viral submission | 10 / 20 | 19.52 | 248.06 / 915.52 / 955.58 | 37.40 | 227.33 / 276.93 / 300.32 |
| Viral submission | 25 / 25 | 23.53 | 588.13 / 985.68 / 1,029.17 | 47.73 | 287.12 / 472.43 / 487.33 |

Additional optimized measurements:

| Scenario | Concurrency / requests | RPS | p50/p95/p99 ms | Result |
|---|---:|---:|---:|---|
| Public stress | 150 / 2,000 | 502.08 | 264.38 / 503.28 / 666.82 | 0% errors |
| Public stress | 200 / 2,500 | 578.96 | 307.00 / 592.45 / 716.15 | 0% errors |
| Public stress | 400 / 4,000 | 907.52 | 406.84 / 794.94 / 1,000.08 | 0% errors; latency breakpoint |
| Viral submission | 50 / 50 | 70.62 | 413.55 / 653.73 / 669.94 | 0% errors |
| Viral submission | 100 / 100 | 92.02 | 606.28 / 1,002.68 / 1,034.92 | 0% errors; per-profile lock breakpoint |
| Independent submissions | 100 / 100 | 261.43 | 338.44 / 344.02 / 344.59 | all accepted |
| Owner, ~850 responses | 25 / 200 | 68.42 | 292.07 / 606.04 / 778.68 | 0% errors |
| Invalid OTP verification | 25 / 250 | 276.47 | 77.20 / 250.41 / 263.83 | controlled 400 responses |
| Payment product list | 25 / 500 | 797.79 | 27.27 / 40.17 / 87.56 | HTTP 200 |
| Intentional rate limit | 25 / 250 | 303.88 | 63.72 / 172.50 / 227.15 | 120 accepted, 130 expected 429 |
| Short stability run, public | 50 / 10,000 | 472.91 | 79.88 / 242.98 / 358.31 | 0% errors |

OTP delivery was not load-tested end-to-end because the production SMTP dependency was intentionally not replaced by a fake provider. The invalid verification path exercises auth validation, database rate-limit storage, and challenge lookup. Payment testing is provider-neutral only; no real checkout provider was invented.

## Query analysis and changes

Public and scoring paths previously materialized all historical sessions and answers, causing work and allocation to grow linearly with history. `FriendResponseRepository.findAnswerAveragesBySeenlyId` now performs one grouped database aggregate. Public lookup also uses a public-specific entity graph and no longer fetches self answers. The structural regression test seeds 100 participants/1,000 answers and asserts a constant query budget (at most three prepared statements).

On the large, deliberately skewed profile, `EXPLAIN (ANALYZE, BUFFERS)` for the aggregate used a hash aggregate over the relevant answers: 10 result rows, 3.359 ms, 88 buffers. PostgreSQL correctly preferred a sequential scan because most test rows belonged to one profile; selective profiles use the existing response-session and foreign-key indexes. No speculative answer index was added.

Cleanup previously scanned and sorted the rate-limit table (1.790 ms, 128 buffers for 500 rows). `idx_rate_limit_expires_at` changed this to an index scan (0.194 ms, 11 buffers), about 89% lower elapsed time in this dataset. Equivalent expiry indexes were added for OTP challenges and verification grants because their bounded cleanup queries have the same access pattern. Cost: one small B-tree per table and extra write/update maintenance; these tables are short-lived operational data, making that trade-off appropriate.

Payment ledger idempotency/provider reference paths already have unique indexes. Duplicate-response lookup and owner-token hash lookup already have selective indexes. No waiting PostgreSQL locks remained after tests.

## Participant transaction and contention

The transaction still locks the target profile with `PESSIMISTIC_WRITE`; security and exact capacity behavior were not weakened. Duplicate/capacity checks, session/answer persistence, aggregate scoring, snapshot update, and commit remain inside the protected flow. The comparison between one viral profile (92 submissions/s, p95 about 1.0 s at concurrency 100) and 100 independent profiles (261 submissions/s, p95 344 ms) demonstrates target-row serialization as the viral breakpoint. Removing the lock is not justified without a separate correctness design. Scale-out improves independent-profile traffic but cannot parallelize writes to one profile row.

## Pool and runtime observations

With the optimized mixed workload, Hikari acquisition averaged about 5.04 ms (8,285 acquisitions, 41.73 aggregate seconds), versus about 161 ms before the aggregate change. At rest, active and pending connections returned to zero. The final history-heavy owner-only run produced approximately 77.8 ms average acquisition time (333 acquisitions, 25.90 seconds), showing pool pressure rather than a leak. A larger pool was not adopted: ten connections already match this local PostgreSQL/CPU balance, while multiplying pools across instances can exhaust PostgreSQL.

After load, the JVM reported 56 live threads, about 78 MB used heap (old + survivor after collection), 27 young-GC pauses, no observed full-GC degradation, approximately 6.6% point-in-time process CPU, zero active/pending pool connections, and zero waiting database locks. The short stability run found no errors or latency collapse. A meaningful 15-30 minute soak was not practical in the shared local IDE environment; staging must execute the checked-in scenario for that duration before release.

## Frontend

Before route splitting, Vite produced one 648.73 kB JS entry (173.49 kB gzip), 270.32 kB CSS (46.52 kB gzip), and a large-chunk warning. Routes are now loaded with `React.lazy`/dynamic imports.

Afterward, initial JS is 238.13 kB (80.00 kB gzip), a 54% gzip reduction. There are 23 JS chunks; examples include Quiz 97.65/22.07 kB raw/gzip, Dashboard 80.95/18.61, Settings 52.63/13.15, and participant intro 18.30/6.02. `html2canvas` is isolated in an async 201.42/48.03 kB chunk. Global CSS is 208.70/36.53 kB.

Automated bundle budgets are initial JS <= 85 KiB gzip and largest JS chunk <= 350 KiB. Both pass. These are initial measured safeguards, not Web Vitals evidence. Lighthouse was unavailable in the local toolchain, so Performance, Accessibility, Best Practices, SEO, LCP, CLS, and TBT were not fabricated; run Lighthouse against the deployed production build in staging. Initial staging goals: LCP <= 2.5 s at p75, CLS <= 0.1, INP <= 200 ms.

## Capacity recommendation and budgets

Initial deployment assumption per application instance:

- Hikari maximum 10/minimum idle 2/20-second acquisition timeout; reserve PostgreSQL connections for migrations, administration, and monitoring. With PostgreSQL `max_connections=100`, do not exceed seven such instances without a deliberate connection budget or pooler review.
- Route normal traffic at up to roughly 100 concurrent local-equivalent clients per instance, then validate with staging network/TLS and production-sized hardware. Do not use the 400-client stress result as capacity.
- Budget public/eligibility p95 below 500 ms and p99 below 1 second; submission p95 below 750 ms at expected peak; unexpected 5xx below 1%.
- Alert/scale on sustained p95 breach, Hikari pending > 0, acquisition p95 growth, active pool > 80%, PostgreSQL lock waits, CPU > 70%, heap after-GC trend, 5xx > 1%, and rate-bucket cleanup lag/table growth.
- A highly viral single profile is lock-bound, so scaling signals must distinguish target-specific submission contention from general saturation.

## Remaining limitations

- Premium owner dashboard intentionally returns raw participant history and therefore remains linear in response count. At several hundred responses it passes the p99 budget but exceeds the preferred p95 budget under 25 concurrent owner reads. Cursor pagination or a separate history endpoint is recommended in a later contract-change gate.
- Full SMTP delivery and real payment-provider latency are external-system concerns and were not represented by fake capacity claims.
- The local short stability test is not a substitute for a 15-30 minute staging soak.
- Lighthouse/Web Vitals require a served staging build and browser tooling.
