import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { LocaleProvider } from '../context/LocaleContext';
import SettingsPage from '../pages/SettingsPage';
import DashboardPage from '../pages/DashboardPage';
import SubscriptionTab from '../pages/settings/SubscriptionTab';
import * as api from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    getOwnerDashboard: vi.fn(),
    createPaymentCheckout: vi.fn(),
    getOwnerResponseHistory: vi.fn(),
    getNotificationPreferences: vi.fn().mockResolvedValue({})
  };
});

describe('Checkout loading state & bfcache pageshow handling', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    localStorage.setItem('seenly_owner_token', 'mock-owner-token');
    window.location.hash = '#/settings?tab=plans';
    delete window.location;
    window.location = {
      ...originalLocation,
      hash: '#/settings?tab=plans',
      assign: vi.fn(),
      origin: 'http://localhost:3000'
    };
    vi.stubGlobal('alert', vi.fn());
  });

  afterEach(() => {
    window.location = originalLocation;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders loading spinner and disabled state during checkout in SettingsPage, and resets on pageshow (bfcache back)', async () => {
    let resolveCheckout;
    const checkoutPromise = new Promise((resolve) => {
      resolveCheckout = resolve;
    });

    api.getOwnerDashboard.mockResolvedValue({
      isPremium: false,
      tenSignalCount: 1,
      purchasedExtraCapacity: 0,
      remainingExtraCapacity: 0,
      email: 'test@example.com',
      displayName: 'Test User'
    });

    api.createPaymentCheckout.mockImplementation(() => checkoutPromise);

    const { container } = render(
      <LocaleProvider>
        <SettingsPage />
      </LocaleProvider>
    );

    // Wait for settings page to load and find the Plus CTA button
    await waitFor(() => {
      const plusBtn = container.querySelector('.tensignal-plus-cta-btn');
      expect(plusBtn).toBeInTheDocument();
      expect(plusBtn).not.toBeDisabled();
    });

    const plusBtn = container.querySelector('.tensignal-plus-cta-btn');

    // Click to upgrade to Plus
    fireEvent.click(plusBtn);

    // Button should immediately be disabled and show spinner
    await waitFor(() => {
      expect(plusBtn).toBeDisabled();
      expect(plusBtn.querySelector('.tensignal-inline-spinner')).toBeInTheDocument();
    });

    // Double-click guard: clicking while loading does not trigger a second API call
    fireEvent.click(plusBtn);
    expect(api.createPaymentCheckout).toHaveBeenCalledTimes(1);

    // Capacity pack buttons must also be disabled during checkout loading
    const packButtons = container.querySelectorAll('.tensignal-pack-btn');
    expect(packButtons.length).toBeGreaterThan(0);
    packButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });

    // Resolve checkout
    await act(async () => {
      resolveCheckout({ checkoutUrl: 'https://seenly.lemonsqueezy.com/checkout/buy/123' });
    });

    // window.location.assign was called with checkout URL
    expect(window.location.assign).toHaveBeenCalledWith('https://seenly.lemonsqueezy.com/checkout/buy/123');

    // Spinner should remain visible until navigation occurs (finally does not clear it)
    expect(plusBtn).toBeDisabled();
    expect(plusBtn.querySelector('.tensignal-inline-spinner')).toBeInTheDocument();

    // Simulate browser Back button return from Lemon Squeezy (bfcache pageshow event)
    await act(async () => {
      window.dispatchEvent(new Event('pageshow'));
    });

    // State must be completely cleared: button re-enabled and spinner removed
    expect(plusBtn).not.toBeDisabled();
    expect(plusBtn.querySelector('.tensignal-inline-spinner')).not.toBeInTheDocument();
  });

  it('resets loading state immediately if checkout API fails in SettingsPage', async () => {
    api.getOwnerDashboard.mockResolvedValue({
      isPremium: false,
      tenSignalCount: 1,
      purchasedExtraCapacity: 0,
      remainingExtraCapacity: 0,
      email: 'test@example.com',
      displayName: 'Test User'
    });

    api.createPaymentCheckout.mockRejectedValue(new Error('Network payment error'));

    const { container } = render(
      <LocaleProvider>
        <SettingsPage />
      </LocaleProvider>
    );

    await waitFor(() => {
      const plusBtn = container.querySelector('.tensignal-plus-cta-btn');
      expect(plusBtn).toBeInTheDocument();
    });

    const plusBtn = container.querySelector('.tensignal-plus-cta-btn');
    fireEvent.click(plusBtn);

    // Button should revert to enabled state after catch block handles the error
    await waitFor(() => {
      expect(plusBtn).not.toBeDisabled();
      expect(plusBtn.querySelector('.tensignal-inline-spinner')).not.toBeInTheDocument();
    });

    expect(window.alert).toHaveBeenCalledWith('Network payment error');
  });

  it('handles Capacity Pack checkout loading, mutual exclusion, and pageshow reset', async () => {
    let resolveCheckout;
    const checkoutPromise = new Promise((resolve) => {
      resolveCheckout = resolve;
    });

    api.getOwnerDashboard.mockResolvedValue({
      isPremium: false,
      tenSignalCount: 1,
      purchasedExtraCapacity: 0,
      remainingExtraCapacity: 0,
      email: 'test@example.com',
      displayName: 'Test User'
    });

    api.createPaymentCheckout.mockImplementation(() => checkoutPromise);

    const { container } = render(
      <LocaleProvider>
        <SettingsPage />
      </LocaleProvider>
    );

    await waitFor(() => {
      const packButtons = container.querySelectorAll('.tensignal-pack-btn');
      expect(packButtons.length).toBe(3);
    });

    const packButtons = container.querySelectorAll('.tensignal-pack-btn');
    const firstPackBtn = packButtons[0];
    const plusBtn = container.querySelector('.tensignal-plus-cta-btn');

    // Click first pack
    fireEvent.click(firstPackBtn);

    await waitFor(() => {
      expect(firstPackBtn).toBeDisabled();
      expect(firstPackBtn.querySelector('.tensignal-inline-spinner')).toBeInTheDocument();
      // Plus button and other pack buttons must be disabled too
      expect(plusBtn).toBeDisabled();
      expect(packButtons[1]).toBeDisabled();
      expect(packButtons[2]).toBeDisabled();
    });

    // Double-click guard
    fireEvent.click(firstPackBtn);
    expect(api.createPaymentCheckout).toHaveBeenCalledTimes(1);

    // Simulate returning back via pageshow
    await act(async () => {
      window.dispatchEvent(new Event('pageshow'));
    });

    // All buttons must be re-enabled and spinner gone
    expect(firstPackBtn).not.toBeDisabled();
    expect(firstPackBtn.querySelector('.tensignal-inline-spinner')).not.toBeInTheDocument();
    expect(plusBtn).not.toBeDisabled();
    expect(packButtons[1]).not.toBeDisabled();
  });

  it('resets isCheckoutLoading in DashboardPage on pageshow event', async () => {
    let resolveCheckout;
    const checkoutPromise = new Promise((resolve) => {
      resolveCheckout = resolve;
    });

    api.getOwnerDashboard.mockResolvedValue({
      isPremium: false,
      tenSignalCount: 5,
      responseCount: 5,
      purchasedExtraCapacity: 0,
      remainingExtraCapacity: 0,
      publicSlug: 'test-slug',
      seenlies: [
        { id: 's1', recipientName: 'Rec 1', responses: [{}, {}, {}] }
      ]
    });
    api.getOwnerResponseHistory.mockResolvedValue([
      { id: 'resp-1', seenlyId: 's1', responderName: 'Alice', createdAt: '2026-09-01T12:00:00Z', answers: {} },
      { id: 'resp-2', seenlyId: 's1', responderName: 'Bob', createdAt: '2026-09-02T12:00:00Z', answers: {} },
      { id: 'resp-3', seenlyId: 's1', responderName: 'Charlie', createdAt: '2026-09-03T12:00:00Z', answers: {} }
    ]);
    api.createPaymentCheckout.mockImplementation(() => checkoutPromise);

    render(
      <LocaleProvider>
        <DashboardPage onNavigateToQuiz={vi.fn()} />
      </LocaleProvider>
    );

    // Switch to tab 3 (Engagement & Decision Times)
    const tabButtons = await screen.findAllByRole('button', { name: /Zaman Analizi|Engagement/i });
    expect(tabButtons.length).toBeGreaterThan(0);
    fireEvent.click(tabButtons[0]);

    // Find unlock plus button inside DecisionTimesTab
    const unlockBtn = await screen.findByRole('button', { name: /10Signal Plus ile Kilidi Aç|unlockPlus/i });
    expect(unlockBtn).not.toBeDisabled();

    // Click unlock
    fireEvent.click(unlockBtn);

    await waitFor(() => {
      expect(unlockBtn).toBeDisabled();
      expect(unlockBtn.querySelector('.tensignal-inline-spinner')).toBeInTheDocument();
    });

    // Double-click guard
    fireEvent.click(unlockBtn);
    expect(api.createPaymentCheckout).toHaveBeenCalledTimes(1);

    // Resolve checkout
    await act(async () => {
      resolveCheckout({ checkoutUrl: 'https://seenly.lemonsqueezy.com/checkout/buy/456' });
    });

    expect(window.location.assign).toHaveBeenCalledWith('https://seenly.lemonsqueezy.com/checkout/buy/456');
    expect(unlockBtn).toBeDisabled();

    // Simulate browser Back button return from Lemon Squeezy (pageshow)
    await act(async () => {
      window.dispatchEvent(new Event('pageshow'));
    });

    expect(unlockBtn).not.toBeDisabled();
    expect(unlockBtn.querySelector('.tensignal-inline-spinner')).not.toBeInTheDocument();
  });

  it('SubscriptionTab directly verifies disabled state and ButtonSpinner rendering during loading', () => {
    const handleUpgradeToPlus = vi.fn();
    const handleBuyPack = vi.fn();

    const { rerender, container } = render(
      <LocaleProvider>
        <SubscriptionTab
          isPremium={false}
          unlimitedSeenlies={false}
          purchasedExtraCapacity={0}
          remainingExtraCapacity={0}
          capacityPackOptions={[
            { productCode: 'response_capacity_50_v2', amount: '+50', quotaAmount: 50, price: '$0.99', theme: 'tier1' },
            { productCode: 'response_capacity_150_v2', amount: '+150', quotaAmount: 150, price: '$1.99', theme: 'tier2' },
            { productCode: 'response_capacity_300_v2', amount: '+300', quotaAmount: 300, price: '$2.99', theme: 'tier3' }
          ]}
          showPlusActivePerks={false}
          setShowPlusActivePerks={vi.fn()}
          actionLoading={false}
          checkoutLoadingCode="seenly_plus_v1"
          handleUpgradeToPlus={handleUpgradeToPlus}
          handleBuyPack={handleBuyPack}
        />
      </LocaleProvider>
    );

    const plusBtn = container.querySelector('.tensignal-plus-cta-btn');
    expect(plusBtn).toBeDisabled();
    expect(plusBtn.querySelector('.tensignal-inline-spinner')).toBeInTheDocument();

    // When checkoutLoadingCode is reset to null
    rerender(
      <LocaleProvider>
        <SubscriptionTab
          isPremium={false}
          unlimitedSeenlies={false}
          purchasedExtraCapacity={0}
          remainingExtraCapacity={0}
          capacityPackOptions={[
            { productCode: 'response_capacity_50_v2', amount: '+50', quotaAmount: 50, price: '$0.99', theme: 'tier1' },
            { productCode: 'response_capacity_150_v2', amount: '+150', quotaAmount: 150, price: '$1.99', theme: 'tier2' },
            { productCode: 'response_capacity_300_v2', amount: '+300', quotaAmount: 300, price: '$2.99', theme: 'tier3' }
          ]}
          showPlusActivePerks={false}
          setShowPlusActivePerks={vi.fn()}
          actionLoading={false}
          checkoutLoadingCode={null}
          handleUpgradeToPlus={handleUpgradeToPlus}
          handleBuyPack={handleBuyPack}
        />
      </LocaleProvider>
    );

    expect(plusBtn).not.toBeDisabled();
    expect(plusBtn.querySelector('.tensignal-inline-spinner')).not.toBeInTheDocument();
  });
});
