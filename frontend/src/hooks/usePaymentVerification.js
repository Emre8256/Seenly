import { useState, useEffect, useCallback, useRef } from 'react';
import { getPaymentTransaction } from '../services/api';

const STORAGE_KEY = 'tensignal_pending_payment';
const MAX_PENDING_AGE_MS = 30 * 60 * 1000; // 30 minutes
const POLL_INTERVALS = [2000, 4000, 6000]; // Polling backoff intervals

/**
 * Checks if the current browser URL contains indicators of a completed
 * checkout redirect from the payment provider (e.g. checkout=success).
 */
export function hasCheckoutReturnParam() {
  if (typeof window === 'undefined') return false;

  const hash = window.location.hash || '';
  const search = window.location.search || '';

  const parseParams = (str) => {
    const qIndex = str.indexOf('?');
    const query = qIndex !== -1 ? str.slice(qIndex + 1) : (str.startsWith('?') ? str.slice(1) : '');
    return new URLSearchParams(query);
  };

  const hashParams = parseParams(hash);
  const searchParams = parseParams(search);

  const isSuccessParam = (val) => val === 'success' || val === 'completed' || val === 'true' || val === '1';

  return (
    isSuccessParam(hashParams.get('checkout')) ||
    isSuccessParam(searchParams.get('checkout')) ||
    isSuccessParam(hashParams.get('payment')) ||
    isSuccessParam(searchParams.get('payment')) ||
    isSuccessParam(hashParams.get('checkout_status')) ||
    isSuccessParam(searchParams.get('checkout_status')) ||
    hashParams.has('order_id') ||
    searchParams.has('order_id')
  );
}

/**
 * Hook to manage post-checkout payment verification, webhook delay handling,
 * and automatic entitlement synchronization.
 *
 * Distinguishes between:
 * - checkout_initiated: user clicked buy, checkout opened
 * - returned_unconfirmed: user returned without completing payment (e.g. browser Back button) -> NO misleading "processing" banner
 * - awaiting_confirmation: user completed checkout on provider and returned -> displays processing banner with refresh if webhook delayed
 * - success: payment confirmed and entitlements activated -> displays green success banner
 * - failed: payment failed or was cancelled
 */
export function usePaymentVerification({ ownerToken, onPaymentVerified, t }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'checking' | 'processing' | 'success' | 'failed'
  const [message, setMessage] = useState('');
  const [pendingInfo, setPendingInfo] = useState(null);

  const pollCountRef = useRef(0);
  const timerRef = useRef(null);
  const onPaymentVerifiedRef = useRef(onPaymentVerified);
  onPaymentVerifiedRef.current = onPaymentVerified;
  const tRef = useRef(t);
  tRef.current = t;

  // Clear any active timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Helper to store pending transaction before redirecting to provider
  const recordPendingCheckout = useCallback((transactionId, productCode) => {
    if (!transactionId) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pollCountRef.current = 0;
    const payload = {
      transactionId,
      productCode: productCode || 'seenly_plus_v1',
      timestamp: Date.now(),
      stage: 'checkout_initiated'
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setPendingInfo(payload);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const clearPending = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    setPendingInfo(null);
  }, []);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    clearPending();
    setStatus('idle');
    setMessage('');
  }, [clearPending]);

  const verifyTransaction = useCallback(async (transactionId, options = {}) => {
    if (!ownerToken || !transactionId) return;

    const { isManualRetry = false, silent = false } = options;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const tr = tRef.current;
    if (isManualRetry) {
      setStatus('checking');
      setMessage(tr ? tr('billing.verifyingPayment') : 'Verifying your payment...');
    } else if (!silent) {
      setStatus('checking');
    }

    try {
      const tx = await getPaymentTransaction(ownerToken, transactionId);

      if (tx?.status === 'PAID' || Boolean(tx?.entitlementGrantedAt)) {
        clearPending();
        setStatus('success');
        setMessage(tr ? tr('billing.paymentSuccess') : 'Payment successful! Your entitlements are now active.');
        if (typeof onPaymentVerifiedRef.current === 'function') {
          onPaymentVerifiedRef.current(tx);
        }
      } else if (tx?.status === 'PENDING') {
        if (silent) {
          // Do not display misleading "payment is processing" banner when user returned without paying
          setStatus('idle');
          setMessage('');
        } else {
          setStatus('processing');
          setMessage(tr ? tr('billing.paymentProcessing') : 'Your payment is processing. Entitlements will activate once confirmed.');
        }

        // Schedule next poll if within retry budget (continues in silent or active mode)
        if (pollCountRef.current < POLL_INTERVALS.length) {
          const delay = POLL_INTERVALS[pollCountRef.current];
          pollCountRef.current += 1;
          timerRef.current = setTimeout(() => {
            verifyTransaction(transactionId, { silent, isManualRetry: false });
          }, delay);
        }
      } else if (tx?.status === 'FAILED' || tx?.status === 'CANCELLED' || tx?.status === 'EXPIRED') {
        clearPending();
        if (!silent) {
          setStatus('failed');
          setMessage(tr ? tr('billing.paymentFailedOrCancelled') : 'Payment was cancelled or could not be completed.');
        } else {
          setStatus('idle');
          setMessage('');
        }
      } else {
        if (silent) {
          setStatus('idle');
          setMessage('');
        } else {
          setStatus('processing');
          setMessage(tr ? tr('billing.paymentProcessing') : 'Your payment is processing.');
        }
      }
    } catch {
      if (silent) {
        setStatus('idle');
        setMessage('');
      } else {
        setStatus('processing');
        setMessage(tr ? tr('billing.paymentProcessing') : 'Your payment is processing. Entitlements will activate once confirmed.');
      }
    }
  }, [ownerToken, clearPending]);

  // Check pending payment status on mount, token change, or pageshow (bfcache navigation)
  const checkPendingPayment = useCallback(() => {
    if (!ownerToken) return;

    let stored = null;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) stored = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }

    if (!stored?.transactionId) return;

    // Discard if older than 30 minutes
    if (Date.now() - (stored.timestamp || 0) > MAX_PENDING_AGE_MS) {
      clearPending();
      return;
    }

    setPendingInfo(stored);

    // Determine return context:
    // 1. Explicit return from checkout (e.g. checkout=success in URL or stage marked awaiting_confirmation)
    // 2. Returned unconfirmed (e.g. browser Back button pressed without completing payment)
    const isExplicitCheckoutReturn = Boolean(
      hasCheckoutReturnParam() ||
      stored.stage === 'awaiting_confirmation'
    );

    if (isExplicitCheckoutReturn) {
      if (stored.stage !== 'awaiting_confirmation') {
        const updated = { ...stored, stage: 'awaiting_confirmation' };
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        setPendingInfo(updated);
      }
      pollCountRef.current = 0;
      verifyTransaction(stored.transactionId, { silent: false });
    } else {
      if (stored.stage !== 'returned_unconfirmed') {
        const updated = { ...stored, stage: 'returned_unconfirmed' };
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        setPendingInfo(updated);
      }
      pollCountRef.current = 0;
      verifyTransaction(stored.transactionId, { silent: true });
    }
  }, [ownerToken, clearPending, verifyTransaction]);

  useEffect(() => {
    checkPendingPayment();

    const handlePageShow = () => {
      checkPendingPayment();
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [checkPendingPayment]);

  const retryCheck = useCallback(() => {
    if (pendingInfo?.transactionId) {
      pollCountRef.current = 0;
      // Manual retry is always explicit/active
      verifyTransaction(pendingInfo.transactionId, { isManualRetry: true, silent: false });
    }
  }, [pendingInfo, verifyTransaction]);

  return {
    status,
    message,
    stage: pendingInfo?.stage || 'idle',
    isPending: status === 'checking' || status === 'processing',
    recordPendingCheckout,
    retryCheck,
    dismiss
  };
}
