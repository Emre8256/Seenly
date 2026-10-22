import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { usePaymentVerification } from '../hooks/usePaymentVerification';
import PaymentStatusBanner from '../components/PaymentStatusBanner';
import PlansPage from '../pages/PlansPage';
import SettingsPage from '../pages/SettingsPage';
import { LocaleProvider } from '../context/LocaleContext';
import * as api from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    getPaymentTransaction: vi.fn(),
    createPaymentCheckout: vi.fn(),
    getOwnerDashboard: vi.fn(),
    getNotificationPreferences: vi.fn(),
    getPaymentProducts: vi.fn(),
  };
});

describe('10Signal Payment Verification & Return UX', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.hash = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.location.hash = '';
    vi.useRealTimers();
  });

  describe('usePaymentVerification Hook', () => {
    it('does nothing on mount if no pending transaction is in storage', () => {
      const onPaymentVerified = vi.fn();
      const { result } = renderHook(() =>
        usePaymentVerification({
          ownerToken: 'test-token',
          onPaymentVerified,
          t: (k) => k
        })
      );

      expect(result.current.status).toBe('idle');
      expect(result.current.isPending).toBe(false);
      expect(api.getPaymentTransaction).not.toHaveBeenCalled();
    });

    it('successfully reconciles PAID transaction and invokes callback', async () => {
      sessionStorage.setItem('tensignal_pending_payment', JSON.stringify({
        transactionId: 'tx-12345',
        productCode: 'seenly_plus_v1',
        timestamp: Date.now()
      }));

      api.getPaymentTransaction.mockResolvedValueOnce({
        transactionId: 'tx-12345',
        productCode: 'seenly_plus_v1',
        status: 'PAID',
        entitlementGrantedAt: '2026-10-19T10:00:00Z'
      });

      const onPaymentVerified = vi.fn();
      const { result } = renderHook(() =>
        usePaymentVerification({
          ownerToken: 'test-token',
          onPaymentVerified,
          t: (k) => k
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      expect(onPaymentVerified).toHaveBeenCalledTimes(1);
      expect(sessionStorage.getItem('tensignal_pending_payment')).toBeNull();
    });

    it('sets processing status when transaction is still PENDING upon checkout return and allows retry', async () => {
      window.location.hash = '#/settings?tab=subscription&checkout=success';
      sessionStorage.setItem('tensignal_pending_payment', JSON.stringify({
        transactionId: 'tx-pending-99',
        productCode: 'response_capacity_50_v2',
        timestamp: Date.now(),
        stage: 'checkout_initiated'
      }));

      api.getPaymentTransaction.mockResolvedValueOnce({
        transactionId: 'tx-pending-99',
        productCode: 'response_capacity_50_v2',
        status: 'PENDING'
      });

      const onPaymentVerified = vi.fn();
      const { result } = renderHook(() =>
        usePaymentVerification({
          ownerToken: 'test-token',
          onPaymentVerified,
          t: (k) => k === 'billing.paymentProcessing' ? 'Your payment is processing.' : k
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('processing');
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.message).toBe('Your payment is processing.');
      expect(onPaymentVerified).not.toHaveBeenCalled();

      // Retry when backend status updates to PAID
      api.getPaymentTransaction.mockResolvedValueOnce({
        transactionId: 'tx-pending-99',
        productCode: 'response_capacity_50_v2',
        status: 'PAID',
        entitlementGrantedAt: '2026-10-19T10:05:00Z'
      });

      act(() => {
        result.current.retryCheck();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });
      expect(onPaymentVerified).toHaveBeenCalledTimes(1);
      act(() => {
        result.current.dismiss();
      });
    });

    it('does NOT show processing status or misleading banner when user returns via Back button without paying', async () => {
      window.location.hash = '#/settings?tab=plans'; // standard back button return URL without checkout=success
      sessionStorage.setItem('tensignal_pending_payment', JSON.stringify({
        transactionId: 'tx-unpaid-back-01',
        productCode: 'seenly_plus_v1',
        timestamp: Date.now(),
        stage: 'checkout_initiated'
      }));

      api.getPaymentTransaction.mockResolvedValueOnce({
        transactionId: 'tx-unpaid-back-01',
        productCode: 'seenly_plus_v1',
        status: 'PENDING'
      });

      const onPaymentVerified = vi.fn();
      const { result } = renderHook(() =>
        usePaymentVerification({
          ownerToken: 'test-token',
          onPaymentVerified,
          t: (k) => k
        })
      );

      await waitFor(() => {
        expect(api.getPaymentTransaction).toHaveBeenCalledWith('test-token', 'tx-unpaid-back-01');
      });

      // Status must remain idle with empty message: NO misleading yellow banner shown
      expect(result.current.status).toBe('idle');
      expect(result.current.message).toBe('');
      expect(result.current.isPending).toBe(false);
      expect(onPaymentVerified).not.toHaveBeenCalled();

      // Pending record is preserved in storage as returned_unconfirmed (not deleted)
      const stored = JSON.parse(sessionStorage.getItem('tensignal_pending_payment'));
      expect(stored.stage).toBe('returned_unconfirmed');
      expect(stored.transactionId).toBe('tx-unpaid-back-01');
    });

    it('silently verifies and grants entitlements when transaction later becomes PAID after returning via Back button', async () => {
      window.location.hash = '#/settings?tab=plans';
      sessionStorage.setItem('tensignal_pending_payment', JSON.stringify({
        transactionId: 'tx-later-paid-02',
        productCode: 'seenly_plus_v1',
        timestamp: Date.now(),
        stage: 'checkout_initiated'
      }));

      // Initial check returns PENDING (silent mode)
      api.getPaymentTransaction.mockResolvedValueOnce({
        transactionId: 'tx-later-paid-02',
        productCode: 'seenly_plus_v1',
        status: 'PENDING'
      });

      const onPaymentVerified = vi.fn();
      const { result } = renderHook(() =>
        usePaymentVerification({
          ownerToken: 'test-token',
          onPaymentVerified,
          t: (k) => k === 'billing.paymentSuccess' ? 'Payment successful!' : k
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('idle');
      });
      expect(result.current.message).toBe('');

      // Webhook arrives in backend, retry/delayed check returns PAID
      api.getPaymentTransaction.mockResolvedValueOnce({
        transactionId: 'tx-later-paid-02',
        productCode: 'seenly_plus_v1',
        status: 'PAID',
        entitlementGrantedAt: '2026-10-19T10:10:00Z'
      });

      act(() => {
        result.current.retryCheck();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      expect(result.current.message).toBe('Payment successful!');
      expect(onPaymentVerified).toHaveBeenCalledTimes(1);
      expect(sessionStorage.getItem('tensignal_pending_payment')).toBeNull();
    });

    it('re-verifies cleanly on page reload without showing false payment status', async () => {
      window.location.hash = '#/settings?tab=plans';
      sessionStorage.setItem('tensignal_pending_payment', JSON.stringify({
        transactionId: 'tx-reload-03',
        productCode: 'response_capacity_50_v2',
        timestamp: Date.now(),
        stage: 'returned_unconfirmed'
      }));

      api.getPaymentTransaction.mockResolvedValueOnce({
        transactionId: 'tx-reload-03',
        productCode: 'response_capacity_50_v2',
        status: 'PENDING'
      });

      const { result } = renderHook(() =>
        usePaymentVerification({
          ownerToken: 'test-token',
          onPaymentVerified: vi.fn(),
          t: (k) => k
        })
      );

      await waitFor(() => {
        expect(api.getPaymentTransaction).toHaveBeenCalledWith('test-token', 'tx-reload-03');
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.message).toBe('');
      expect(result.current.isPending).toBe(false);
    });

    it('second checkout cleanly overwrites previous pending checkout record', () => {
      sessionStorage.setItem('tensignal_pending_payment', JSON.stringify({
        transactionId: 'tx-old-01',
        productCode: 'seenly_plus_v1',
        timestamp: Date.now() - 5000,
        stage: 'returned_unconfirmed'
      }));

      const { result } = renderHook(() =>
        usePaymentVerification({
          ownerToken: 'test-token',
          onPaymentVerified: vi.fn(),
          t: (k) => k
        })
      );

      act(() => {
        result.current.recordPendingCheckout('tx-new-02', 'response_capacity_150_v2');
      });

      const stored = JSON.parse(sessionStorage.getItem('tensignal_pending_payment'));
      expect(stored.transactionId).toBe('tx-new-02');
      expect(stored.productCode).toBe('response_capacity_150_v2');
      expect(stored.stage).toBe('checkout_initiated');
    });

    it('handles bfcache pageshow event and triggers silent check when returning via back button', async () => {
      window.location.hash = '#/settings?tab=plans';
      const { result } = renderHook(() =>
        usePaymentVerification({
          ownerToken: 'test-token',
          onPaymentVerified: vi.fn(),
          t: (k) => k
        })
      );

      // User clicked buy
      act(() => {
        result.current.recordPendingCheckout('tx-pageshow-04', 'seenly_plus_v1');
      });

      api.getPaymentTransaction.mockResolvedValueOnce({
        transactionId: 'tx-pageshow-04',
        productCode: 'seenly_plus_v1',
        status: 'PENDING'
      });

      // Browser back button triggers pageshow
      act(() => {
        window.dispatchEvent(new Event('pageshow'));
      });

      await waitFor(() => {
        expect(api.getPaymentTransaction).toHaveBeenCalledWith('test-token', 'tx-pageshow-04');
      });

      // Status remains idle, no misleading banner
      expect(result.current.status).toBe('idle');
      expect(result.current.message).toBe('');
    });

    it('handles CANCELLED or FAILED checkout gracefully upon return and clears pending key', async () => {
      window.location.hash = '#/settings?tab=subscription&checkout=success';
      sessionStorage.setItem('tensignal_pending_payment', JSON.stringify({
        transactionId: 'tx-cancelled-01',
        productCode: 'seenly_plus_v1',
        timestamp: Date.now(),
        stage: 'checkout_initiated'
      }));

      api.getPaymentTransaction.mockResolvedValueOnce({
        transactionId: 'tx-cancelled-01',
        productCode: 'seenly_plus_v1',
        status: 'CANCELLED'
      });

      const onPaymentVerified = vi.fn();
      const { result } = renderHook(() =>
        usePaymentVerification({
          ownerToken: 'test-token',
          onPaymentVerified,
          t: (k) => k
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('failed');
      });

      expect(sessionStorage.getItem('tensignal_pending_payment')).toBeNull();
      expect(onPaymentVerified).not.toHaveBeenCalled();
    });

    it('ignores and removes stale pending transactions older than 30 minutes', () => {
      const staleTime = Date.now() - 40 * 60 * 1000; // 40 minutes old
      sessionStorage.setItem('tensignal_pending_payment', JSON.stringify({
        transactionId: 'tx-stale-01',
        productCode: 'seenly_plus_v1',
        timestamp: staleTime
      }));

      const onPaymentVerified = vi.fn();
      const { result } = renderHook(() =>
        usePaymentVerification({
          ownerToken: 'test-token',
          onPaymentVerified,
          t: (k) => k
        })
      );

      expect(result.current.status).toBe('idle');
      expect(api.getPaymentTransaction).not.toHaveBeenCalled();
      expect(sessionStorage.getItem('tensignal_pending_payment')).toBeNull();
    });
  });

  describe('PaymentStatusBanner Component', () => {
    it('renders null when status is idle or message is empty', () => {
      const { container } = render(
        <PaymentStatusBanner status="idle" message="" />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders success banner with message and dismiss action', () => {
      const onDismiss = vi.fn();
      render(
        <PaymentStatusBanner
          status="success"
          message="Payment verified successfully!"
          onDismiss={onDismiss}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Payment verified successfully!')).toBeInTheDocument();

      const dismissBtn = screen.getByRole('button');
      fireEvent.click(dismissBtn);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('renders processing banner with refresh/retry button', () => {
      const onRetry = vi.fn();
      render(
        <PaymentStatusBanner
          status="processing"
          message="Your payment is processing..."
          onRetry={onRetry}
          t={(k) => k === 'billing.refreshStatus' ? 'Refresh' : k}
        />
      );

      expect(screen.getByText('Your payment is processing...')).toBeInTheDocument();
      const retryBtn = screen.getByText('Refresh');
      fireEvent.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('PlansPage Navigation & Product Alignment', () => {
    it('redirects guest user to self-quiz upon selecting any plan', () => {
      const { container } = render(
        <LocaleProvider>
          <PlansPage />
        </LocaleProvider>
      );

      const pricingButtons = container.querySelectorAll('.btn-pricing');
      expect(pricingButtons.length).toBe(3);
      // Click first plan (Free)
      fireEvent.click(pricingButtons[0]);
      expect(sessionStorage.getItem('tensignal_currentIndex')).toBe('-2');
      expect(window.location.hash).toBe('#/');
    });

    it('redirects logged-in user to settings subscription tab for Plus or Capacity', () => {
      localStorage.setItem('tensignal_owner_token', 'mock-owner-token');

      const { container } = render(
        <LocaleProvider>
          <PlansPage />
        </LocaleProvider>
      );

      const pricingButtons = container.querySelectorAll('.btn-pricing');
      expect(pricingButtons.length).toBe(3);

      // Second button is Plus plan
      fireEvent.click(pricingButtons[1]);
      expect(window.location.hash).toBe('#/settings?tab=subscription');

      // Third button is Capacity plan
      fireEvent.click(pricingButtons[2]);
      expect(window.location.hash).toBe('#/settings?tab=subscription');
    });
  });

  describe('SettingsPage Tab Routing & Checkout Return', () => {
    it('activates subscription plans tab when hash is #/settings?tab=subscription', async () => {
      window.location.hash = '#/settings?tab=subscription';
      localStorage.setItem('tensignal_owner_token', 'mock-owner-token');
      api.getOwnerDashboard.mockResolvedValueOnce({
        isPremium: false,
        tenSignalCount: 1,
        purchasedExtraCapacity: 0,
        remainingExtraCapacity: 0,
        email: 'user@example.com',
        displayName: 'Test User'
      });
      api.getNotificationPreferences.mockResolvedValueOnce({});
      api.getPaymentProducts.mockResolvedValueOnce([]);

      const { container } = render(
        <LocaleProvider>
          <SettingsPage />
        </LocaleProvider>
      );

      await waitFor(() => {
        const tabButtons = container.querySelectorAll('.tensignal-settings-tab-btn');
        expect(tabButtons.length).toBeGreaterThan(1);
        expect(tabButtons[1]).toHaveClass('active');
      });
    });

    it('handles checkout return with compound query params (#/settings?tab=subscription&checkout=success)', async () => {
      window.location.hash = '#/settings?tab=subscription&checkout=success';
      localStorage.setItem('tensignal_owner_token', 'mock-owner-token');
      api.getOwnerDashboard.mockResolvedValueOnce({
        isPremium: true,
        tenSignalCount: 1,
        purchasedExtraCapacity: 0,
        remainingExtraCapacity: 0,
        email: 'user@example.com',
        displayName: 'Test User'
      });
      api.getNotificationPreferences.mockResolvedValueOnce({});
      api.getPaymentProducts.mockResolvedValueOnce([]);

      const { container } = render(
        <LocaleProvider>
          <SettingsPage />
        </LocaleProvider>
      );

      await waitFor(() => {
        const tabButtons = container.querySelectorAll('.tensignal-settings-tab-btn');
        expect(tabButtons[1]).toHaveClass('active');
      });
    });

    it('switches tabs smoothly via tab buttons and synchronizes with hash', async () => {
      window.location.hash = '#/settings?tab=profile';
      localStorage.setItem('tensignal_owner_token', 'mock-owner-token');
      api.getOwnerDashboard.mockResolvedValueOnce({
        isPremium: false,
        tenSignalCount: 1,
        purchasedExtraCapacity: 0,
        remainingExtraCapacity: 0,
        email: 'user@example.com',
        displayName: 'Test User'
      });
      api.getNotificationPreferences.mockResolvedValueOnce({});
      api.getPaymentProducts.mockResolvedValueOnce([]);

      const { container } = render(
        <LocaleProvider>
          <SettingsPage />
        </LocaleProvider>
      );

      await waitFor(() => {
        const tabButtons = container.querySelectorAll('.tensignal-settings-tab-btn');
        expect(tabButtons[0]).toHaveClass('active');
      });

      const tabButtons = container.querySelectorAll('.tensignal-settings-tab-btn');
      fireEvent.click(tabButtons[1]);

      await waitFor(() => {
        expect(tabButtons[1]).toHaveClass('active');
        expect(window.location.hash).toBe('#/settings?tab=plans');
      });
    });
  });
});
