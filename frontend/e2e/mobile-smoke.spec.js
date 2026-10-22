import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { width: 320, height: 740, name: '320px (Compact Mobile)' },
  { width: 375, height: 667, name: '375px (iPhone SE)' },
  { width: 390, height: 844, name: '390px (iPhone 13/14)' },
  { width: 430, height: 932, name: '430px (iPhone Pro Max)' },
  { width: 768, height: 1024, name: '768px (Tablet Portrait)' },
  { width: 1440, height: 900, name: '1440px (Desktop)' },
];

const mockOwnerSnapshot = {
  displayName: 'E2E Tester',
  email: 'tester@10signal.me',
  publicSlug: 'TESTSLUG01',
  avatar: 'kadin1',
  responseCount: 5,
  isPremium: false,
  confidenceBand: 'MEDIUM',
  selfAverages: {
    samimiyet: 4, cekicilik: 3.5, zeka: 4, vizyon: 4.5, enerji: 3.8,
    guvenilirlik: 4.2, ego: 2.5, basari: 4, comertlik: 4.5, olgunluk: 4
  },
  friendAverages: {
    samimiyet: 4.2, cekicilik: 3.8, zeka: 4.1, vizyon: 4.3, enerji: 3.9,
    guvenilirlik: 4.4, ego: 2.2, basari: 4.1, comertlik: 4.6, olgunluk: 4.2
  },
  responseSessions: [
    {
      id: 'session-1',
      seenlyId: 's1',
      responderName: 'Deniz',
      createdAt: '2026-10-18T12:00:00Z',
      answers: {}
    }
  ]
};

async function setupApiMocks(page) {
  await page.route('**/api/v1/rarity/**', route => route.fulfill({ json: [] }));
  await page.route('**/api/billing/products', route => route.fulfill({
    json: [
      { productCode: 'seenly_plus_v1', name: '10Signal Plus', formattedPrice: '$3.99' },
      { productCode: 'response_capacity_50_v2', name: 'Mini Pack (+50)', formattedPrice: '$0.99' },
      { productCode: 'response_capacity_150_v2', name: 'Standard Pack (+150)', formattedPrice: '$1.99' },
      { productCode: 'response_capacity_300_v2', name: 'Large Pack (+300)', formattedPrice: '$2.99' }
    ]
  }));
  await page.route('**/api/v1/tensignal/owner', route => route.fulfill({ json: mockOwnerSnapshot }));
  await page.route('**/api/v1/tensignal/owner/responses**', route => route.fulfill({
    json: { items: mockOwnerSnapshot.responseSessions, totalCount: 1, hasMore: false }
  }));
  await page.route('**/api/v1/tensignal/owner/notification-preferences', route => route.fulfill({
    json: {
      emailNotificationsEnabled: true,
      newEvaluationNotification: true,
      milestoneNotification: true,
      cardUpdateNotification: true,
      capacityWarningNotification: true
    }
  }));
}

for (const vp of VIEWPORTS) {
  test.describe(`Viewport Smoke Test: ${vp.name} [${vp.width}x${vp.height}]`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test(`Landing Page renders without horizontal overflow on ${vp.width}px`, async ({ page }) => {
      await setupApiMocks(page);
      await page.goto('/#/');
      await expect(page.locator('main').first()).toBeVisible();

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      });
      expect(overflow, `Horizontal overflow detected at ${vp.width}px`).toBe(false);
    });

    test(`Plans Page renders and has no overflow on ${vp.width}px`, async ({ page }) => {
      await setupApiMocks(page);
      await page.goto('/#/plans');
      await expect(page.locator('.plans-title, h1').first()).toBeVisible();

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      });
      expect(overflow, `Horizontal overflow detected on /#/plans at ${vp.width}px`).toBe(false);
    });

    test(`Dashboard Page renders tabs and metrics without overflow on ${vp.width}px`, async ({ page }) => {
      await setupApiMocks(page);
      await page.addInitScript(() => {
        localStorage.setItem('tensignal_owner_token', 'test-token');
      });
      await page.goto('/#/dashboard');
      await expect(page.locator('.tensignal-dashboard-container').first()).toBeVisible();

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      });
      expect(overflow, `Horizontal overflow on Dashboard at ${vp.width}px`).toBe(false);
    });

    test(`Settings & Subscription Tab renders checkout cards without overflow on ${vp.width}px`, async ({ page }) => {
      await setupApiMocks(page);
      await page.addInitScript(() => {
        localStorage.setItem('tensignal_owner_token', 'test-token');
      });
      await page.goto('/#/settings?tab=plans');
      await expect(page.locator('.tensignal-settings-page-container').first()).toBeVisible();

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      });
      expect(overflow, `Horizontal overflow on Settings/Plans at ${vp.width}px`).toBe(false);
    });
  });
}
