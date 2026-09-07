import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const publicProfile = {
  publicSlug: 'PUBLIC01', displayName: 'Ada', avatar: 'kadin1', responseCount: 0,
  acceptingResponses: true, confidenceBand: 'LOW'
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/rarity/**', route => route.fulfill({ json: [] }));
  await page.route('**/api/v1/seenly/public/PUBLIC01', route => route.fulfill({ json: publicProfile }));
  await page.route('**/api/v1/seenly/profile/PUBLIC01/increment-click', route => route.fulfill({ json: { status: 'success' } }));
  await page.route('**/api/v1/seenly/friend/PUBLIC01/check-eligibility', route => route.fulfill({ json: { eligible: true } }));
});

test('invalid and direct public routes render without a blank screen', async ({ page }) => {
  await page.goto('/#/does-not-exist');
  await expect(page.getByRole('heading', { name: 'Sayfa bulunamadı' })).toBeVisible();
  await page.goto('/#/friend/PUBLIC01');
  await expect(page.locator('main, [role="main"]')).toBeVisible();
});

test('public participant entry has no serious accessibility violations', async ({ page }) => {
  await page.goto('/#/friend/PUBLIC01');
  await expect(page.locator('body')).not.toBeEmpty();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(v => ['serious', 'critical'].includes(v.impact))).toEqual([]);
});

test('small mobile public flow has no horizontal overflow', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile-'), 'mobile viewport assertion');
  await page.goto('/#/friend/PUBLIC01');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
});

test('429 participant errors remain controlled', async ({ page }) => {
  await page.route('**/api/v1/seenly/friend/PUBLIC01/check-eligibility', route =>
    route.fulfill({ status: 429, json: { message: 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.' } }));
  await page.goto('/#/friend/PUBLIC01');
  await expect(page.locator('body')).not.toContainText('[object Object]');
  await expect(page.locator('body')).not.toContainText('Exception');
});

for (const scenario of [
  { name: 'HTTP 503', action: route => route.fulfill({ status: 503, json: { message: 'internal detail must not render' } }), heading: /geçici olarak kullanılamıyor/i },
  { name: 'network failure', action: route => route.abort('internetdisconnected'), heading: /bağlantı kurulamadı/i }
]) {
  test(`dashboard ${scenario.name} has a controlled retry state`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'infrastructure matrix runs once');
    await page.addInitScript(() => localStorage.setItem('seenly_owner_token', 'test-owner-token'));
    await page.route('**/api/v1/seenly/owner', scenario.action);
    await page.goto('/#/dashboard');
    await expect(page.getByRole('heading', { name: scenario.heading })).toBeVisible();
    await expect(page.getByRole('button', { name: /tekrar dene/i })).toBeVisible();
    await expect(page.locator('body')).not.toContainText('internal detail');
  });
}

test('delayed dashboard request keeps a bounded loading state', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'timing behavior runs once');
  await page.addInitScript(() => localStorage.setItem('seenly_owner_token', 'test-owner-token'));
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/api/v1/seenly/owner', async route => {
    await gate;
    await route.fulfill({ status: 503, json: { message: 'unavailable' } });
  });
  await page.goto('/#/dashboard');
  await expect(page.locator('body')).not.toBeEmpty();
  release();
  await expect(page.getByRole('heading', { name: /geçici olarak kullanılamıyor/i })).toBeVisible();
});

test('protected dashboard without a session has a controlled state', async ({ page }) => {
  await page.goto('/#/dashboard');
  await expect(page.locator('body')).not.toBeEmpty();
  await expect(page.locator('body')).not.toContainText('[object Object]');
});
