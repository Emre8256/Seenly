import { test, expect } from '@playwright/test';

const ownerSnapshot = {
  displayName: 'E2E Ada', email: 'e2e-ada@example.test', publicSlug: 'E2EADA01',
  avatar: 'kadin1', responseCount: 0, isPremium: false, confidenceBand: 'LOW',
  selfAverages: { samimiyet: 3, cekicilik: 3, zeka: 3, vizyon: 3, enerji: 3,
    guvenilirlik: 3, ego: 3, basari: 3, comertlik: 3, olgunluk: 3 },
  friendAverages: null, responseSessions: null
};

async function installTestMailboxApi(page) {
  const mailbox = new Map();
  const sessions = new Set();
  await page.route('**/api/v1/rarity/**', route => route.fulfill({ json: [] }));
  await page.route('**/api/v1/seenly/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const body = request.postDataJSON?.() || {};
    if (path.endsWith('/auth/send-code')) {
      mailbox.set(`${body.purpose}:${body.email}`, '7421');
      // A successful send may be returned without a response body by an API
      // gateway. The registration UI must still advance to OTP entry.
      return route.fulfill({ status: 204, body: '' });
    }
    if (path.endsWith('/auth/verify-code')) {
      const valid = mailbox.get(`${body.purpose}:${body.email}`) === body.code;
      return valid
        ? route.fulfill({ json: { verificationGrant: `test-grant-${body.purpose}` } })
        : route.fulfill({ status: 400, json: { message: 'Invalid or expired code' } });
    }
    if (path.endsWith('/auth/login-email')) {
      if (body.code !== mailbox.get(`LOGIN:${body.email}`)) {
        return route.fulfill({ status: 400, json: { message: 'Invalid or expired code' } });
      }
      sessions.add('test-owner-token');
      return route.fulfill({ json: { ownerToken: 'test-owner-token', publicSlug: 'E2EADA01' } });
    }
    if (path.endsWith('/create')) {
      if (body.registrationGrant !== 'test-grant-REGISTER') {
        return route.fulfill({ status: 403, json: { message: 'Registration verification is required' } });
      }
      sessions.add('test-owner-token');
      return route.fulfill({ json: { ownerToken: 'test-owner-token', publicSlug: 'E2EADA01', resultSnapshot: ownerSnapshot } });
    }
    if (path.endsWith('/owner/avatar')) return route.fulfill({ json: ownerSnapshot });
    if (path.endsWith('/auth/logout')) {
      sessions.delete(request.headers()['x-owner-token']);
      return route.fulfill({ status: 204, body: '' });
    }
    if (path.endsWith('/owner')) {
      return sessions.has(request.headers()['x-owner-token'])
        ? route.fulfill({ json: ownerSnapshot })
        : route.fulfill({ status: 401, json: { message: 'Owner session is invalid or revoked' } });
    }
    return route.fulfill({ status: 404, json: { message: 'Test route not configured' } });
  });
  return { mailbox, sessions };
}

async function enterFourDigitCode(page, code) {
  const inputs = page.locator('input[inputmode="text"]');
  const count = await inputs.count();
  for (let index = Math.max(0, count - 4); index < count; index++) {
    await inputs.nth(index).fill(code[index - (count - 4)]);
  }
}

test('full registration uses a test-only mailbox and reaches the owner dashboard', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'full mutation journey runs once; auth smoke runs cross-browser separately');
  await installTestMailboxApi(page);
  await page.goto('/#/');
  await page.getByRole('button', { name: /Seenly.*Başlat/i }).first().click();
  await page.locator('input[autocomplete="name"]').fill('E2E Ada');
  await page.locator('.seenly-wizard-primary-btn').click();
  await page.locator('.seenly-wizard-primary-btn').click();
  for (let question = 0; question < 10; question++) {
    await page.locator('.seenly-wizard-list-btn').nth(2).click();
    await page.locator('.seenly-wizard-primary-btn').click();
  }
  await page.locator('.seenly-wizard-primary-btn').click();
  await page.locator('input[inputmode="email"]').fill('e2e-ada@example.test');
  await page.locator('.seenly-wizard-primary-btn').click();
  await enterFourDigitCode(page, '7421');
  await page.locator('.seenly-wizard-primary-btn').click();
  await expect(page.getByRole('button', { name: /Profili Gör/i })).toBeVisible();
  await page.getByRole('button', { name: /Profili Gör/i }).click();
  await expect(page).toHaveURL(/#\/dashboard$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('seenly_owner_token'))).toBe('test-owner-token');
});

test('login rejects an invalid OTP, accepts mailbox OTP, persists, and logout revokes it', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'full mutation journey runs once; public smoke runs cross-browser');
  const api = await installTestMailboxApi(page);
  await page.goto('/#/');
  await page.getByRole('button', { name: /Giriş Yap/i }).first().click();
  await page.locator('input[inputmode="email"]').fill('e2e-ada@example.test');
  await page.locator('.seenly-wizard-primary-btn').click();
  await enterFourDigitCode(page, '0000');
  await page.locator('.seenly-wizard-primary-btn').click();
  await expect(page.getByText(/hatalı veya süresi dolmuş/i)).toBeVisible();
  await enterFourDigitCode(page, '7421');
  await page.locator('.seenly-wizard-primary-btn').click();
  await expect(page).toHaveURL(/#\/dashboard$/);
  await page.reload();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('seenly_owner_token'))).toBe('test-owner-token');
  await page.locator('button[aria-expanded]').first().click();
  await page.locator('.seenly-user-menu-panel button').last().click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('seenly_owner_token'))).toBeNull();
  expect(api.sessions.has('test-owner-token')).toBe(false);
  await page.goto('/#/dashboard');
  await page.reload();
  await expect(page.getByRole('heading', { name: /Oturumunuz sona erdi/i })).toBeVisible();
});

test('registration cannot create an account without a verification grant', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'mutation contract runs once');
  await installTestMailboxApi(page);
  await page.goto('/#/');
  const status = await page.evaluate(async () => (await fetch('/api/v1/seenly/create', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'No Grant', email: 'no-grant@example.test', selfAnswers: [], registrationGrant: null })
  })).status);
  expect(status).toBe(403);
});

test('participant completes all questions and a duplicate attempt is controlled', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'full participant mutation runs once; public smoke runs cross-browser');
  let submitted = false;
  await page.route('**/api/v1/rarity/**', route => route.fulfill({ json: [] }));
  await page.route('**/api/v1/seenly/profile/PUBLIC01/increment-click', route => route.fulfill({ json: {} }));
  await page.route('**/api/v1/seenly/public/PUBLIC01', route => route.fulfill({ json: {
    displayName: 'Ada', publicSlug: 'PUBLIC01', avatar: 'kadin1', responseCount: 0,
    acceptingResponses: true, confidenceBand: 'LOW', friendAverages: null
  } }));
  await page.route('**/api/v1/seenly/friend/PUBLIC01/check-eligibility', route =>
    route.fulfill(submitted ? { status: 409, json: { message: 'Already evaluated' } } : { json: { eligible: true } }));
  await page.route('**/api/v1/seenly/friend/PUBLIC01/respond', async route => {
    if (submitted) return route.fulfill({ status: 409, json: { message: 'Already evaluated' } });
    const body = route.request().postDataJSON();
    expect(body.friendResponses).toHaveLength(10);
    submitted = true;
    await route.fulfill({ json: { readerStyleId: 'clear_reader', xpGained: 10, level: 1, accuracy: 82 } });
  });

  await page.goto('/#/friend/PUBLIC01');
  await page.getByRole('button', { name: /Bu Kişiyi Sen De Değerlendir/i }).click();
  for (let question = 0; question < 10; question++) {
    await page.locator('.seenly-wizard-list-btn').nth(2).click();
    await page.locator('.seenly-wizard-primary-btn').click();
  }
  await expect(page).toHaveURL(/#\/friend\/PUBLIC01\/result$/);
  await expect(page.locator('main')).toBeVisible();
  await page.goto('/#/friend/PUBLIC01');
  await expect(page.getByRole('heading', { name: /Değerlendirme Tamamlandı/i })).toBeVisible();
  expect(submitted).toBe(true);
});

async function installOwnerSettingsApi(page) {
  let profile = { ...ownerSnapshot };
  let deleted = false;
  await page.route('**/api/v1/seenly/owner', route => deleted
    ? route.fulfill({ status: 401, json: { message: 'revoked' } })
    : route.fulfill({ json: profile }));
  await page.route('**/api/v1/seenly/owner/display-name', async route => {
    profile = { ...profile, displayName: route.request().postDataJSON().displayName, nameChangeDaysRemaining: 14 };
    await route.fulfill({ json: profile });
  });
  await page.route('**/api/v1/seenly/owner/avatar', async route => {
    profile = { ...profile, avatar: route.request().postDataJSON().avatar };
    await route.fulfill({ json: profile });
  });
  await page.route('**/api/v1/seenly/auth/send-code', route => route.fulfill({ json: { status: 'sent' } }));
  await page.route('**/api/v1/seenly/auth/verify-code', async route => route.request().postDataJSON().code === '7421'
    ? route.fulfill({ json: { verificationGrant: 'email-change-grant' } })
    : route.fulfill({ status: 400, json: { message: 'Invalid code' } }));
  await page.route('**/api/v1/seenly/owner/email', async route => {
    const body = route.request().postDataJSON();
    if (body.verificationGrant !== 'email-change-grant') return route.fulfill({ status: 403, json: { message: 'Verification required' } });
    profile = { ...profile, email: body.email };
    await route.fulfill({ json: profile });
  });
  await page.route('**/api/billing/delete-account', route => { deleted = true; return route.fulfill({ status: 200, json: {} }); });
  return { get profile() { return profile; }, get deleted() { return deleted; } };
}

test('settings updates name, avatar and verified email without showing false success', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'settings mutation journey runs once');
  const state = await installOwnerSettingsApi(page);
  await page.addInitScript(() => localStorage.setItem('seenly_owner_token', 'test-owner-token'));
  await page.goto('/#/settings');
  await page.locator('#seenly-display-name-input').fill('E2E Deniz');
  await page.locator('form').filter({ has: page.locator('#seenly-display-name-input') }).locator('button[type="submit"]').click();
  await page.locator('.seenly-settings-modal-primary').click();
  await expect.poll(() => state.profile.displayName).toBe('E2e Deniz');

  await page.locator('.seenly-avatar-toggle-btn').click();
  await page.locator('.seenly-avatar-item-btn').nth(1).click();
  await expect.poll(() => state.profile.avatar).not.toBe('kadin1');

  await page.locator('#seenly-email-input').fill('invalid-email');
  await page.locator('form').filter({ has: page.locator('#seenly-email-input') }).locator('button[type="submit"]').click();
  expect(await page.locator('#seenly-email-input').evaluate(input => input.validity.valid)).toBe(false);
  expect(state.profile.email).toBe('e2e-ada@example.test');

  await page.locator('#seenly-email-input').fill('changed@example.test');
  await page.locator('form').filter({ has: page.locator('#seenly-email-input') }).locator('button[type="submit"]').click();
  const digits = page.locator('.seenly-settings-otp input');
  for (let i = 0; i < 4; i++) await digits.nth(i).fill('7421'[i]);
  await page.locator('.seenly-settings-modal-primary').click();
  await expect.poll(() => state.profile.email).toBe('changed@example.test');
});

test('account deletion clears the session and the deleted dashboard cannot reopen', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'destructive journey runs once against isolated mock state');
  const state = await installOwnerSettingsApi(page);
  await page.addInitScript(() => localStorage.setItem('seenly_owner_token', 'delete-owner-token'));
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/#/settings');
  await page.locator('.seenly-danger-outline-btn').click();
  await expect.poll(() => state.deleted).toBe(true);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('seenly_owner_token'))).toBeNull();
  await page.goto('/#/dashboard');
  await page.reload();
  await expect(page.getByRole('heading', { name: /Oturumunuz sona erdi/i })).toBeVisible();
});

test('provider-disabled checkout communicates failure and never grants client entitlement', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'billing-disabled mutation runs once');
  await installOwnerSettingsApi(page);
  await page.route('**/api/billing/checkouts', route => route.fulfill({ status: 503, json: { message: 'Payments are temporarily unavailable' } }));
  await page.addInitScript(() => localStorage.setItem('seenly_owner_token', 'billing-owner-token'));
  let alertText = '';
  page.on('dialog', async dialog => { alertText = dialog.message(); await dialog.accept(); });
  await page.goto('/#/settings?tab=plans');
  await page.locator('.seenly-plus-cta-btn').click();
  await expect.poll(() => alertText).toContain('temporarily unavailable');
  expect(await page.evaluate(() => ({ plus: localStorage.getItem('seenly_is_premium'), limit: localStorage.getItem('seenly_test_limit') })))
    .toEqual({ plus: null, limit: null });
});
