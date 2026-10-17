# 10Signal frontend quality and release gate

Date: 2026-09-06

## Test architecture

- Vitest 3 + jsdom + React Testing Library for deterministic component/API-contract tests.
- Playwright 1.55.1 with request interception for browser tests that do not contact production, SMTP, payment providers, or other third parties.
- `@axe-core/playwright` checks serious/critical WCAG-oriented automated findings.
- Backend authorization/privacy remains covered by Spring MockMvc integration tests. No production OTP bypass or fake paid state was introduced.

Commands: `npm test`, `npm run test:e2e`, `npm run build:budget`, and `mvn verify` in the backend.

## Routes and journeys

Public routes are `#/`, `#/friend/:slug`, `#/friend/:slug/quiz`, `#/friend/:slug/result`, `#/identities`, `#/faq`, `#/plans`, `#/terms`, `#/refund`, and `#/privacy`. Owner routes are `#/dashboard` and `#/settings` including settings query-string deep links. Invalid routes now render a controlled 404; refund has its own route instead of resolving to Terms.

Browser checks cover direct shared-link navigation, invalid routes, protected route without a session, controlled participant 429/503 representation, automated accessibility, and horizontal overflow. Unit/integration checks cover API status preservation, failed-registration behavior, bounded history contract, and keyboard behavior of the settings verification dialog.

The backend suites remain the authoritative deterministic coverage for registration OTP grants, invalid/valid login, logout/revocation, assessment validation, duplicate participant submission, anonymity thresholds, account deletion, provider-disabled billing, payment entitlement, rate limiting, and owner authorization. A future staging smoke should additionally exercise these through the complete rendered UI with a test-only mail sink; production OTP is never bypassed.

## Accessibility and keyboard

The QR dialog now has native dialog semantics, an accessible title, Escape handling, focus trapping, initial focus, and focus restoration. The settings confirmation dialog now traps focus and restores it in addition to its existing Escape and labelled OTP controls. Critical flows use native buttons/inputs and mutation buttons are guarded while pending. Remaining manual screen-reader and contrast inspection is part of the smoke checklist below.

## Responsive/browser matrix

Configured projects: Chromium, Firefox, WebKit, 320px mobile, iPhone 390px, tablet 768px, laptop 1024px, and desktop 1440px. The participant entry path is the mobile overflow priority. Browser-specific results must be recorded from the actual Playwright run; an unavailable engine is not considered passing.

## Owner history API

`GET /api/v1/tensignal/owner` no longer embeds an unbounded premium `responseSessions` graph. Detailed history is available only from authenticated `GET /api/v1/tensignal/owner/responses?limit=5&cursor=...`:

- Plus authorization is enforced server-side.
- Limit is clamped to 1-25.
- The opaque cursor uses the last page timestamp; ordering is newest first.
- Response contains `items`, `nextCursor`, `hasMore`, and `totalCount`.
- The dashboard initially requests five records and explicitly loads subsequent cursor pages.
- Public DTOs and anonymity thresholds are unchanged.

## Frontend security and external calls

- The owner token remains in local storage under the existing security model. No additional secrets were moved into browser storage.
- The external `api.qrserver.com` dependency was removed. QR images and downloads are generated locally with `qrcode`, avoiding disclosure of shared profile URLs.
- Remaining intended browser-side external links are Instagram, TikTok, and user-triggered WhatsApp share URLs. They use navigation/link behavior rather than background data calls.
- Production Vite output does not enable source maps. No third-party analytics script was found.
- The audited npm dependency tree reports zero known vulnerabilities after upgrading Vite, Vitest, Playwright, and related transitive dependencies.
- `dangerouslySetInnerHTML` remains in the Plans heading, but its value comes from bundled locale JSON rather than user/API input. Avoid routing untrusted content into that translation key.

## Product-language decision required

Commercial copy is inconsistent and was not silently rewritten:

- `RefundPolicyPage.jsx` describes 10Signal Plus as a subscription with active cycles.
- `DashboardPage.jsx` reports a subscription process.
- `SubscriptionTab.jsx` says Plus is a permanent one-time purchase with no recurring fee.
- Pricing content also describes one-time reports/purchases while navigation uses membership/üyelik.

Product/legal owners must decide whether Plus is recurring, one-time, or lifetime and update Terms, Refund Policy, pricing, dashboard, and settings together.

## Lighthouse and manual release smoke

Gate 9 before/after production-build Lighthouse results:

| Metric | Before | After |
| --- | ---: | ---: |
| Performance | 63 | 88 |
| Accessibility | 100 | 100 |
| Best Practices | 96 | 96 |
| SEO | 83 | 92 |
| LCP | 5.38s | 3.70s |
| CLS | 0.104 | 0 |
| TBT | 106ms | 84ms |

The measured initial critical path contained a broad Google Fonts request (multiple unused families and roughly 259KB of observed font transfers), followed by the app entry and lazy initial route. External fonts were removed in favor of a stable system stack, the existing initial route chunk now starts downloading immediately, the true hero image has intrinsic dimensions and high fetch priority, and below-fold images are lazy-decoded with reserved dimensions. The final Lighthouse LCP node was the small `10Signal` header wordmark, not a large image; TTFB was about 6ms and the reported element render-delay subpart about 521ms. The remaining 3.70s lab LCP is therefore dominated by throttled first-render/JavaScript/CSS work rather than image download. It remains above the 2.5s gate and must not be treated as passing. Raw after data is `lighthouse-report.json`; the original result is `lighthouse-report-before.json`.

SEO now includes a title, description, viewport, robots directive and theme color. Hash routing still limits crawlable per-route URLs and metadata; a router/SSR migration was intentionally not performed in this gate.

Final Playwright matrix result: 56 passed and 64 intentionally skipped project-inapplicable assertions across Chromium, Firefox, WebKit, 320, 390, 768, 1024, and 1440 projects. Stateful mutation journeys run once in the dedicated Chromium project with isolated in-memory network fixtures; public routing, protected-route smoke and accessibility checks run across browser engines, while both mobile projects pass horizontal-overflow assertions. No serious/critical axe violation remained on the representative public participant page.

Before release, manually verify in each supported engine:

1. Register using a captured test-mail OTP, complete all assessment questions, refresh/back once, and reach dashboard.
2. Attempt registration without a grant; verify rejection. Login with invalid then valid OTP, refresh, logout, and revisit dashboard.
3. Complete a shared participant link on a 320px viewport; retry duplicate, 429, offline, and 503 states.
4. Verify new-profile empty dashboard, anonymity-threshold transition, Plus/non-Plus views, share/copy/local QR, and cursor history.
5. Update name/avatar/email, validate email errors, keyboard-cycle each dialog, and verify Escape/focus restoration.
6. Cancel account deletion once, then delete and confirm the revoked session cannot reopen owner routes.
7. With provider disabled, attempt checkout and confirm no Plus/capacity change appears locally.
8. Navigate every route directly, refresh, back/forward, test an invalid route, and inspect for horizontal overflow/layout shift at 320/390/768/1024/1440.

## Manual accessibility and physical-device release checks

These checks are operationally required and have **not** been claimed as completed by automation:

- VoiceOver on macOS/iOS or NVDA on Windows: registration, OTP, participant quiz, settings dialogs and deletion confirmation.
- Physical iOS Safari: safe-area, keyboard/OTP input, 320/390px-equivalent layout and share controls.
- Physical Android Chrome: keyboard/OTP input, back navigation, scrolling and share controls.
- Keyboard-only: visible focus, logical order, modal focus trap/restoration and Escape behavior.
- Browser zoom at 200% and OS text scaling: no clipped controls, lost content or unintended horizontal scrolling.

## Commercial terminology and legal review

Product UI uses “10Signal Plus” and “one-time purchase”; recurring subscription/membership wording was removed from application navigation and checkout errors. Legal copy still conflicts and was not silently rewritten: `src/pages/RefundPolicyPage.jsx` describes a “10Signal Plus subscription” at line 46 and “active ... subscription cycles” at line 80. Product/legal review must correct that policy consistently with the intended one-time-purchase model.
