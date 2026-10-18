import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';
import { getOwnerDashboard, updateDisplayName, updateEmail, updateAvatar, createPaymentCheckout, getPaymentProducts, PAYMENT_PRODUCT_CODES, sendVerificationCode, verifyCode, getOtpDeliveryStatus, getNotificationPreferences, updateNotificationPreferences } from '../services/api';
import { AVATARS, getAvatarSrc } from '../images/avatars';
import {
  User,
  Star,
  Bell,
  ArrowLeft,
  Users,
  Compass,
  Crown,
  ShieldCheck,
  TriangleAlert,
  X
} from 'lucide-react';
import ProfileSettingsTab from './settings/ProfileSettingsTab';
import SubscriptionTab from './settings/SubscriptionTab';
import SecuritySettingsTab from './settings/SecuritySettingsTab';
import './DashboardPlanMinimal.css';
import './settings/SettingsPage.css';

export function SettingsActionModal({ type, langCode: propLangCode, email, onClose, onConfirm }) {
  const { locale, t } = useLocale();
  const tr = (key, vars) => t(key, vars, propLangCode || locale);
  const isEmail = type === 'email';
  const [digits, setDigits] = useState(['', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const digitRefs = useRef([]);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    openerRef.current = document.activeElement;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) onClose();
      if (event.key === 'Tab' && dialogRef.current) {
        const controls = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')];
        if (!controls.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    if (isEmail) requestAnimationFrame(() => digitRefs.current[0]?.focus());
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus?.();
    };
  }, [isEmail, isSubmitting, onClose]);

  const setDigit = (index, value) => {
    const nextValue = value.replace(/\D/g, '').slice(-1);
    setDigits((current) => {
      const next = [...current];
      next[index] = nextValue;
      return next;
    });
    setErrorMessage('');
    if (nextValue && index < 3) digitRefs.current[index + 1]?.focus();
  };

  const handleDigitKeyDown = (event, index) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    const pastedDigits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4).split('');
    if (!pastedDigits.length) return;
    event.preventDefault();
    setDigits(Array.from({ length: 4 }, (_, index) => pastedDigits[index] || ''));
    setErrorMessage('');
    digitRefs.current[Math.min(pastedDigits.length, 4) - 1]?.focus();
  };

  const handleConfirm = async () => {
    const code = digits.join('');
    if (isEmail && code.length !== 4) {
      setErrorMessage(tr('settings.modal.incompleteOtpError'));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await onConfirm(code);
    } catch (error) {
      setErrorMessage(error.message || tr('settings.modal.verifyFailedError'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="tensignal-settings-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && !isSubmitting && onClose()}>
      <div ref={dialogRef} className="tensignal-settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-action-title">
        <button type="button" className="tensignal-settings-modal-close" onClick={onClose} disabled={isSubmitting} aria-label={tr('settings.modal.close')}>
          <X size={18} strokeWidth={2} />
        </button>

        <div className={`tensignal-settings-modal-icon ${isEmail ? 'is-email' : 'is-warning'}`}>
          {isEmail ? <ShieldCheck size={24} strokeWidth={1.8} /> : <TriangleAlert size={24} strokeWidth={1.8} />}
        </div>

        <h2 id="settings-action-title" className="tensignal-settings-modal-title">
          {isEmail ? tr('settings.modal.verifyEmailTitle') : tr('settings.modal.confirmNameTitle')}
        </h2>

        <p className="tensignal-settings-modal-description">
          {isEmail
            ? tr('settings.modal.verifyEmailDesc', { email })
            : tr('settings.modal.confirmNameDesc')}
        </p>

        {isEmail && (
          <>
            <div className="tensignal-settings-otp" onPaste={handlePaste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => { digitRefs.current[index] = element; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  value={digit}
                  onChange={(event) => setDigit(index, event.target.value)}
                  onKeyDown={(event) => handleDigitKeyDown(event, index)}
                  className={errorMessage ? 'has-error' : ''}
                  aria-label={tr('settings.modal.otpDigitAria', { index: index + 1 })}
                />
              ))}
            </div>
          </>
        )}

        {errorMessage && <p className="tensignal-settings-modal-error" role="alert">{errorMessage}</p>}

        <div className="tensignal-settings-modal-actions">
          <button type="button" className="tensignal-settings-modal-secondary" onClick={onClose} disabled={isSubmitting}>
            {tr('settings.modal.cancel')}
          </button>
          <button type="button" className="tensignal-settings-modal-primary" onClick={handleConfirm} disabled={isSubmitting || (isEmail && digits.some((digit) => !digit))}>
            {isSubmitting
              ? tr('settings.modal.processing')
              : isEmail
                ? tr('settings.modal.verifyAndUpdate')
                : tr('settings.modal.confirmAndUpdate')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { locale: langCode, t, syncAccountLocale } = useLocale();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab state: 'profile' | 'plans' | 'notifications'
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash || '';
    if (hash.includes('tab=plans') || hash.includes('tab=membership')) return 'plans';
    if (hash.includes('tab=notifications') || hash.includes('tab=notif')) return 'notifications';
    return 'profile';
  });

  // Avatar states
  const [selectedAvatar, setSelectedAvatar] = useState(() => (localStorage.getItem('tensignal_avatar') || localStorage.getItem('seenly_avatar')) || '');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarFilter, setAvatarFilter] = useState(() => {
    const saved = (localStorage.getItem('tensignal_avatar') || localStorage.getItem('seenly_avatar')) || '';
    if (saved.toLowerCase().startsWith('erkek')) return 'erkek';
    return 'kadin';
  });
  const filteredAvatars = useMemo(() => {
    return AVATARS.filter(av => av.gender === avatarFilter);
  }, [avatarFilter]);
  const [avatarSaveStatus, setAvatarSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [showPlusActivePerks, setShowPlusActivePerks] = useState(false);

  // Display Name States
  const [profileNameInput, setProfileNameInput] = useState('');
  const [nameSaveStatus, setNameSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [nameErrorMessage, setNameErrorMessage] = useState('');

  // Email States
  const [emailInput, setEmailInput] = useState('');
  const [emailSaveStatus, setEmailSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [settingsAction, setSettingsAction] = useState(null); // null | 'name' | 'email'
  const [pendingEmail, setPendingEmail] = useState('');

  // Notification Preferences (Backend Authoritative)
  const defaultNotifPrefs = useMemo(() => ({
    masterEmail: true,
    evaluations: true,
    reminders: true,
    cardChanges: true,
    capacityAlerts: true,
  }), []);

  const [notifPrefs, setNotifPrefs] = useState(defaultNotifPrefs);

  // Refs for debounced, sequence-safe backend synchronization
  const latestPrefsRef = useRef(defaultNotifPrefs);
  const lastSavedPrefsRef = useRef(defaultNotifPrefs);
  const debounceTimerRef = useRef(null);
  const requestIdRef = useRef(0);

  // Load preferences from backend on mount
  useEffect(() => {
    const token = (localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token'));
    if (!token) return;
    let isMounted = true;
    getNotificationPreferences(token)
      .then((prefs) => {
        if (isMounted && prefs) {
          const loaded = {
            masterEmail: prefs.masterEmail ?? true,
            evaluations: prefs.evaluations ?? true,
            reminders: prefs.reminders ?? true,
            cardChanges: prefs.cardChanges ?? true,
            capacityAlerts: prefs.capacityAlerts ?? true,
          };
          setNotifPrefs(loaded);
          latestPrefsRef.current = loaded;
          lastSavedPrefsRef.current = loaded;
        }
      })
      .catch((err) => {
        console.error('Failed to load notification preferences:', err);
      });

    return () => {
      isMounted = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Responsive optimistic toggle with debounced backend persistence (350ms)
  const handleToggleNotif = useCallback((key) => {
    // 1. Immediately update UI state for instant responsiveness
    setNotifPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      latestPrefsRef.current = next;
      return next;
    });

    // 2. Debounce backend persistence to coalesce rapid toggles and eliminate race conditions
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      const token = (localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token'));
      if (!token) return;

      const payload = { ...latestPrefsRef.current };
      const currentReqId = ++requestIdRef.current;

      try {
        await updateNotificationPreferences(token, payload);
        if (currentReqId === requestIdRef.current) {
          lastSavedPrefsRef.current = payload;
        }
      } catch (err) {
        console.error('Failed to update notification preferences:', err);
        // Only rollback if this is still the latest in-flight request
        if (currentReqId === requestIdRef.current) {
          const rollback = { ...lastSavedPrefsRef.current };
          latestPrefsRef.current = rollback;
          setNotifPrefs(rollback);
        }
      }
    }, 350);
  }, []);

  const [actionLoading, setActionLoading] = useState(false);
  const [checkoutLoadingCode, setCheckoutLoadingCode] = useState(null);
  const [catalogProducts, setCatalogProducts] = useState(null);

  useEffect(() => {
    let active = true;
    getPaymentProducts()
      .then(prods => {
        if (active && Array.isArray(prods)) {
          setCatalogProducts(prods);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Clear checkout / action loading states when returning to page (e.g. via browser back button / bfcache pageshow)
  useEffect(() => {
    const handlePageShow = () => {
      setCheckoutLoadingCode(null);
      setActionLoading(false);
    };
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handlePageShow);
    };
  }, []);

  // Sync activeTab with URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '';
      if (hash.includes('tab=plans') || hash.includes('tab=membership')) {
        setActiveTab('plans');
      } else if (hash.includes('tab=notifications') || hash.includes('tab=notif')) {
        setActiveTab('notifications');
      } else {
        setActiveTab('profile');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const loadData = useCallback(async () => {
    const token = (localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token'));
    if (!token) {
      setError('no_token');
      setLoading(false);
      return;
    }

    try {
      const data = await getOwnerDashboard(token);
      if (data?.displayName) {
        localStorage.setItem('tensignal_display_name', data.displayName); localStorage.setItem('seenly_display_name', data.displayName);
        setProfileNameInput(data.displayName);
      }
      if (data?.email) {
        setEmailInput(data.email);
      }
      if (data?.avatar) {
        setSelectedAvatar(data.avatar);
        localStorage.setItem('tensignal_avatar', data.avatar); localStorage.setItem('seenly_avatar', data.avatar);
      }
      if (data?.publicSlug) {
        localStorage.setItem('tensignal_owner_slug', data.publicSlug); localStorage.setItem('seenly_owner_slug', data.publicSlug);
      }
      if (typeof data?.isPremium === 'boolean') {
        if (data.isPremium) {
          localStorage.setItem('tensignal_is_premium', 'true'); localStorage.setItem('seenly_is_premium', 'true');
        } else {
          localStorage.removeItem('tensignal_is_premium'); localStorage.removeItem('seenly_is_premium');
        }
      }
      if (data?.preferredLocale && syncAccountLocale) {
        syncAccountLocale(data.preferredLocale);
      }
      setSnapshot(data);
    } catch (err) {
      setError('profile_not_found');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const capitalizeName = useCallback((name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => {
        if (!word) return '';
        return word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase();
      })
      .join(' ');
  }, []);

  const displayName = capitalizeName(snapshot?.displayName || (localStorage.getItem('tensignal_display_name') || localStorage.getItem('seenly_display_name')) || 'User');
  const userEmail = snapshot?.email || '';
  const currentAvatarSrc = getAvatarSrc(selectedAvatar || snapshot?.avatar || (localStorage.getItem('tensignal_avatar') || localStorage.getItem('seenly_avatar')));
  const isPremium = typeof snapshot?.isPremium === 'boolean'
    ? snapshot.isPremium
    : (typeof snapshot?.premium === 'boolean'
      ? snapshot.premium
      : ((localStorage.getItem('tensignal_is_premium') || localStorage.getItem('seenly_is_premium')) === 'true'));
  const responseCount = snapshot?.responseCount || 0;
  const rawLimit = typeof snapshot?.maxResponseLimit === 'number'
    ? snapshot.maxResponseLimit
    : (parseInt((localStorage.getItem('tensignal_test_limit') || localStorage.getItem('seenly_test_limit')), 10) || 20);
  const isUnlimited = Boolean(isPremium) || rawLimit === -1;
  const maxResponseLimit = isUnlimited ? -1 : rawLimit;
  const usagePercent = isUnlimited
    ? 0
    : Math.min(100, Math.round((responseCount / Math.max(maxResponseLimit, 1)) * 100));
  const isQuotaFull = !isUnlimited && responseCount >= maxResponseLimit;
  const isQuotaNearFull = !isUnlimited && !isQuotaFull && usagePercent >= 80;

  const nameChangeDaysRemaining = snapshot?.nameChangeDaysRemaining || 0;
  const isNameChangeLocked = nameChangeDaysRemaining > 0;

  const handleSelectAvatar = useCallback(async (avatarId) => {
    setSelectedAvatar(avatarId);
    setAvatarSaveStatus('saving');
    localStorage.setItem('tensignal_avatar', avatarId); localStorage.setItem('seenly_avatar', avatarId);

    try {
      const token = (localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token'));
      if (token) {
        await updateAvatar(token, avatarId);
      }
      setSnapshot(prev => ({ ...prev, avatar: avatarId }));
      setAvatarSaveStatus('saved');
      setTimeout(() => setAvatarSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to update avatar', err);
      setAvatarSaveStatus('idle');
    }
  }, []);

  const commitDisplayName = useCallback(async () => {
    const trimmed = (profileNameInput ?? '').trim();
    setNameErrorMessage('');
    setNameSaveStatus('saving');
    const capitalized = capitalizeName(trimmed);

    try {
      const token = (localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token'));
      if (token) {
        const updatedSnapshot = await updateDisplayName(token, capitalized);
        localStorage.setItem('tensignal_display_name', capitalized); localStorage.setItem('seenly_display_name', capitalized);
        sessionStorage.setItem('tensignal_displayName', capitalized); sessionStorage.setItem('seenly_displayName', capitalized);
        if (updatedSnapshot && typeof updatedSnapshot === 'object') {
          setSnapshot(updatedSnapshot);
        } else {
          setSnapshot(prev => ({
            ...prev,
            displayName: capitalized,
            nameChangeDaysRemaining: 14
          }));
        }
      }
      setNameSaveStatus('saved');
      setTimeout(() => setNameSaveStatus('idle'), 2500);
      return true;
    } catch (err) {
      console.error('Failed to update name', err);
      setNameErrorMessage(err.message || t('settings.profile.nameUpdateFailed'));
      setNameSaveStatus('idle');
      return false;
    }
  }, [profileNameInput, t, capitalizeName]);

  const handleSaveDisplayName = useCallback((event) => {
    event?.preventDefault();
    if (isNameChangeLocked) return;
    const trimmed = (profileNameInput ?? '').trim();
    if (trimmed.length < 2) {
      setNameErrorMessage(t('settings.profile.nameMinLength'));
      return;
    }
    if (trimmed.length > 15) {
      setNameErrorMessage(t('settings.profile.nameMaxLength'));
      return;
    }
    setNameErrorMessage('');
    setSettingsAction('name');
  }, [isNameChangeLocked, profileNameInput, t]);

  const commitEmail = useCallback(async (targetEmail, verificationGrant) => {
    setEmailErrorMessage('');
    setEmailSaveStatus('saving');

    try {
      const token = (localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token'));
      if (token) {
        await updateEmail(token, targetEmail, verificationGrant);
        setSnapshot(prev => ({ ...prev, email: targetEmail }));
      }
      setEmailSaveStatus('saved');
      setTimeout(() => setEmailSaveStatus('idle'), 2500);
      return true;
    } catch (err) {
      console.error('Failed to update email', err);
      if (err.status === 409) {
        setEmailErrorMessage(t('settings.profile.emailInUse'));
      } else {
        setEmailErrorMessage(err.message || t('settings.profile.emailUpdateFailed'));
      }
      setEmailSaveStatus('idle');
      return false;
    }
  }, [t]);

  const handleSaveEmail = useCallback(async (event) => {
    event?.preventDefault();
    const trimmed = (emailInput ?? '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+$/;
    if (!trimmed || !emailRegex.test(trimmed)) {
      setEmailErrorMessage(t('settings.profile.emailInvalid'));
      return;
    }

    setEmailErrorMessage('');
    setPendingEmail(trimmed);

    setEmailSaveStatus('saving');
    try {
      const token = (localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token'));
      await sendVerificationCode(trimmed, 'EMAIL_CHANGE', token, langCode);
    } catch (err) {
      setEmailSaveStatus('idle');
      setEmailErrorMessage(err.message || t('settings.profile.verificationSendFailed'));
      return;
    }
    setEmailSaveStatus('idle');

    setSettingsAction('email');
  }, [emailInput, t]);

  useEffect(() => {
    if (settingsAction !== 'email' || !pendingEmail) return;
    let isMounted = true;
    const token = localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token');

    const checkDelivery = async () => {
      try {
        const res = await getOtpDeliveryStatus(pendingEmail, 'EMAIL_CHANGE', token);
        if (!isMounted) return;
        if (res?.deliveryStatus === 'FAILED') {
          setEmailErrorMessage(res.message || t('settings.profile.verificationSendFailed'));
          setSettingsAction(null);
        }
      } catch {
        // Ignore network polling glitches
      }
    };

    const timer1 = setTimeout(checkDelivery, 1500);
    const timer2 = setTimeout(checkDelivery, 4000);

    return () => {
      isMounted = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [settingsAction, pendingEmail, t]);

  const handleConfirmSettingsAction = useCallback(async (code) => {
    if (settingsAction === 'name') {
      const saved = await commitDisplayName();
      if (saved) setSettingsAction(null);
      else throw new Error(t('settings.profile.nameUpdateRetry'));
      return;
    }

    if (settingsAction === 'email') {
      let verificationGrant;
      try {
        const token = (localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token'));
        const response = await verifyCode(pendingEmail, code, 'EMAIL_CHANGE', token);
        verificationGrant = response.verificationGrant;
      } catch (err) {
        throw new Error(err.message || t('settings.profile.otpInvalidOrExpired'));
      }

      const saved = await commitEmail(pendingEmail, verificationGrant);
      if (saved) setSettingsAction(null);
      else throw new Error(t('settings.profile.emailUpdateRetry'));
    }
  }, [settingsAction, commitDisplayName, pendingEmail, commitEmail, t]);

  const handleUpgradeToPlus = useCallback(async () => {
    if (checkoutLoadingCode) return;
    const token = (localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token'));
    setCheckoutLoadingCode(PAYMENT_PRODUCT_CODES.TEN_SIGNAL_PLUS);
    try {
      if (!token) throw new Error(t('errors.status_401'));
      const checkout = await createPaymentCheckout(token, PAYMENT_PRODUCT_CODES.TEN_SIGNAL_PLUS);
      if (!checkout?.checkoutUrl) throw new Error(t('settings.modal.paymentUnavailable'));
      window.location.assign(checkout.checkoutUrl);
    } catch (err) {
      setCheckoutLoadingCode(null);
      alert(err.message || t('settings.modal.paymentUnavailable'));
    }
  }, [checkoutLoadingCode, t]);

  const handleBuyPack = useCallback(async (productCode) => {
    if (checkoutLoadingCode) return;
    const token = (localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token'));
    setCheckoutLoadingCode(productCode);
    try {
      if (!token) throw new Error(t('errors.status_401'));
      const checkout = await createPaymentCheckout(token, productCode);
      if (!checkout?.checkoutUrl) throw new Error(t('settings.modal.paymentUnavailable'));
      window.location.assign(checkout.checkoutUrl);
    } catch (err) {
      setCheckoutLoadingCode(null);
      alert(err.message || t('settings.modal.paymentUnavailable'));
    }
  }, [checkoutLoadingCode, t]);

  const handleDeleteAccount = useCallback(async () => {
    const confirmDelete = window.confirm(t('settings.deleteAccount.confirmDialog'));
    if (!confirmDelete) return;

    const token = (localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token'));
    if (!token) return;

    try {
      const apiPrefix = (import.meta.env && import.meta.env.VITE_API_URL) || '';
      const response = await fetch(`${apiPrefix}/api/billing/delete-account`, {
        method: 'DELETE',
        headers: { 'X-Owner-Token': token }
      });

      if (!response.ok) throw new Error(t('settings.deleteAccount.errorDeleting'));

      alert(t('settings.deleteAccount.successAlert'));
      localStorage.removeItem('tensignal_owner_token'); localStorage.removeItem('seenly_owner_token');
      localStorage.removeItem('tensignal_display_name'); localStorage.removeItem('seenly_display_name');
      localStorage.removeItem('tensignal_avatar'); localStorage.removeItem('seenly_avatar');
      sessionStorage.clear();
      window.location.hash = '#/';
    } catch (err) {
      alert(t('settings.deleteAccount.errorDeleting') + ': ' + err.message);
    }
  }, [t]);

  const plusProduct = useMemo(() => {
    return catalogProducts?.find(p => p.productCode === PAYMENT_PRODUCT_CODES.TEN_SIGNAL_PLUS);
  }, [catalogProducts]);

  const plusPriceFormatted = useMemo(() => {
    return plusProduct?.formattedPrice || t('billing.premium.price');
  }, [plusProduct, t]);

  const capacityPackOptions = useMemo(() => {
    const findProduct = (code) => catalogProducts?.find(p => p.productCode === code);

    const p50 = findProduct(PAYMENT_PRODUCT_CODES.CAPACITY_50);
    const p150 = findProduct(PAYMENT_PRODUCT_CODES.CAPACITY_150);
    const p300 = findProduct(PAYMENT_PRODUCT_CODES.CAPACITY_300);

    return [
      {
        amount: 50,
        productCode: PAYMENT_PRODUCT_CODES.CAPACITY_50,
        label: t('settings.subscription.miniPack'),
        price: p50?.formattedPrice || t('settings.subscription.miniPrice'),
        icon: Users,
        theme: 'tier1'
      },
      {
        amount: 150,
        productCode: PAYMENT_PRODUCT_CODES.CAPACITY_150,
        label: t('settings.subscription.standardPack'),
        price: p150?.formattedPrice || t('settings.subscription.standardPrice'),
        icon: Compass,
        theme: 'tier2'
      },
      {
        amount: 300,
        productCode: PAYMENT_PRODUCT_CODES.CAPACITY_300,
        label: t('settings.subscription.maxiPack'),
        price: p300?.formattedPrice || t('settings.subscription.largePrice'),
        icon: Crown,
        theme: 'tier3'
      }
    ];
  }, [t, catalogProducts]);

  const switchTab = useCallback((tab) => {
    setActiveTab(tab);
    window.location.hash = `#/settings?tab=${tab}`;
  }, []);

  return (
    <AppShell isDashboard={true} userName={displayName}>
      <div className="tensignal-settings-page-container">
        <div className="tensignal-settings-inner">
          {/* Top Return to Dashboard Link */}
          <div className="tensignal-settings-top-nav">
            <button
              type="button"
              onClick={() => window.location.hash = '#/dashboard'}
              className="tensignal-settings-back-btn"
            >
              <ArrowLeft size={16} strokeWidth={2.2} />
              <span>{t('navigation.dashboard')}</span>
            </button>
          </div>

          {/* Page Header */}
          <div className="tensignal-settings-header">
            <h1 className="tensignal-settings-title">
              {t('settings.profile.pageTitle')}
            </h1>
            <p className="tensignal-settings-subtitle">
              {t('settings.profile.pageSubtitle')}
            </p>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="tensignal-settings-tabs-wrapper">
            <div className="tensignal-settings-tabs-capsule">
              <button
                type="button"
                onClick={() => switchTab('profile')}
                className={`tensignal-settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              >
                <User size={16} strokeWidth={2} />
                <span>{t('settings.tabs.profile')}</span>
              </button>

              <button
                type="button"
                onClick={() => switchTab('plans')}
                className={`tensignal-settings-tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
              >
                <Star size={16} strokeWidth={2} />
                <span>Plus</span>
              </button>

              <button
                type="button"
                onClick={() => switchTab('notifications')}
                className={`tensignal-settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              >
                <Bell size={16} strokeWidth={2} />
                <span>{t('settings.tabs.notifications')}</span>
              </button>
            </div>
          </div>

          {/* TAB 1: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <ProfileSettingsTab
              langCode={langCode}
              displayName={displayName}
              userEmail={userEmail}
              currentAvatarSrc={currentAvatarSrc}
              selectedAvatar={selectedAvatar}
              showAvatarPicker={showAvatarPicker}
              setShowAvatarPicker={setShowAvatarPicker}
              avatarFilter={avatarFilter}
              setAvatarFilter={setAvatarFilter}
              avatarSaveStatus={avatarSaveStatus}
              filteredAvatars={filteredAvatars}
              handleSelectAvatar={handleSelectAvatar}
              profileNameInput={profileNameInput}
              setProfileNameInput={setProfileNameInput}
              isNameChangeLocked={isNameChangeLocked}
              nameChangeDaysRemaining={nameChangeDaysRemaining}
              nameSaveStatus={nameSaveStatus}
              setNameSaveStatus={setNameSaveStatus}
              nameErrorMessage={nameErrorMessage}
              setNameErrorMessage={setNameErrorMessage}
              handleSaveDisplayName={handleSaveDisplayName}
              emailInput={emailInput}
              setEmailInput={setEmailInput}
              emailSaveStatus={emailSaveStatus}
              setEmailSaveStatus={setEmailSaveStatus}
              emailErrorMessage={emailErrorMessage}
              setEmailErrorMessage={setEmailErrorMessage}
              handleSaveEmail={handleSaveEmail}
              handleDeleteAccount={handleDeleteAccount}
            />
          )}

          {/* TAB 2: PACKAGES & MEMBERSHIP */}
          {activeTab === 'plans' && (
            <SubscriptionTab
              langCode={langCode}
              t={t}
              isPremium={isPremium}
              responseCount={responseCount}
              maxResponseLimit={maxResponseLimit}
              usagePercent={usagePercent}
              isQuotaFull={isQuotaFull}
              isQuotaNearFull={isQuotaNearFull}
              showPlusActivePerks={showPlusActivePerks}
              setShowPlusActivePerks={setShowPlusActivePerks}
              actionLoading={actionLoading}
              checkoutLoadingCode={checkoutLoadingCode}
              handleUpgradeToPlus={handleUpgradeToPlus}
              capacityPackOptions={capacityPackOptions}
              handleBuyPack={handleBuyPack}
              plusPriceFormatted={plusPriceFormatted}
            />
          )}

          {/* TAB 3: NOTIFICATION SETTINGS */}
          {activeTab === 'notifications' && (
            <SecuritySettingsTab
              langCode={langCode}
              notifPrefs={notifPrefs}
              handleToggleNotif={handleToggleNotif}
            />
          )}
        </div>
      </div>
      {settingsAction && (
        <SettingsActionModal
          key={`${settingsAction}-${pendingEmail}`}
          type={settingsAction}
          langCode={langCode}
          email={pendingEmail}
          onClose={() => setSettingsAction(null)}
          onConfirm={handleConfirmSettingsAction}
        />
      )}
    </AppShell>
  );
}
