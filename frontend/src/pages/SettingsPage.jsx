import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';
import { getOwnerDashboard, updateDisplayName, updateEmail, updateAvatar, createPaymentCheckout, PAYMENT_PRODUCT_CODES, sendVerificationCode, verifyCode } from '../services/api';
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

export function SettingsActionModal({ type, langCode, email, onClose, onConfirm }) {
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
      setErrorMessage(langCode === 'tr' ? 'Lütfen 4 haneli kodu eksiksiz girin.' : 'Please enter the complete 4-digit code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await onConfirm(code);
    } catch (error) {
      setErrorMessage(error.message || (langCode === 'tr' ? 'İşlem doğrulanamadı.' : 'Unable to verify the action.'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="seenly-settings-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && !isSubmitting && onClose()}>
      <div ref={dialogRef} className="seenly-settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-action-title">
        <button type="button" className="seenly-settings-modal-close" onClick={onClose} disabled={isSubmitting} aria-label={langCode === 'tr' ? 'Pencereyi kapat' : 'Close dialog'}>
          <X size={18} strokeWidth={2} />
        </button>

        <div className={`seenly-settings-modal-icon ${isEmail ? 'is-email' : 'is-warning'}`}>
          {isEmail ? <ShieldCheck size={24} strokeWidth={1.8} /> : <TriangleAlert size={24} strokeWidth={1.8} />}
        </div>

        <h2 id="settings-action-title" className="seenly-settings-modal-title">
          {isEmail
            ? (langCode === 'tr' ? 'E-posta adresini doğrula' : 'Verify your email address')
            : (langCode === 'tr' ? 'İsim değişikliğini onayla' : 'Confirm name change')}
        </h2>

        <p className="seenly-settings-modal-description">
          {isEmail
            ? (langCode === 'tr' ? `${email} adresine gönderilen 4 haneli kodu girin.` : `Enter the 4-digit code sent to ${email}.`)
            : (langCode === 'tr'
              ? 'Görünen isminizi değiştirdikten sonra 14 gün boyunca tekrar değiştiremezsiniz. Devam etmek istediğinizden emin misiniz?'
              : 'After changing your display name, you will not be able to change it again for 14 days. Are you sure you want to continue?')}
        </p>

        {isEmail && (
          <>
            <div className="seenly-settings-otp" onPaste={handlePaste}>
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
                  aria-label={langCode === 'tr' ? `Doğrulama kodu ${index + 1}. hane` : `Verification code digit ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {errorMessage && <p className="seenly-settings-modal-error" role="alert">{errorMessage}</p>}

        <div className="seenly-settings-modal-actions">
          <button type="button" className="seenly-settings-modal-secondary" onClick={onClose} disabled={isSubmitting}>
            {langCode === 'tr' ? 'Vazgeç' : 'Cancel'}
          </button>
          <button type="button" className="seenly-settings-modal-primary" onClick={handleConfirm} disabled={isSubmitting || (isEmail && digits.some((digit) => !digit))}>
            {isSubmitting
              ? (langCode === 'tr' ? 'İşleniyor...' : 'Processing...')
              : isEmail
                ? (langCode === 'tr' ? 'Doğrula ve Güncelle' : 'Verify and Update')
                : (langCode === 'tr' ? 'Onayla ve Güncelle' : 'Confirm and Update')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { locale: langCode, t } = useLocale();
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
  const [selectedAvatar, setSelectedAvatar] = useState(() => localStorage.getItem('seenly_avatar') || '');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarFilter, setAvatarFilter] = useState(() => {
    const saved = localStorage.getItem('seenly_avatar') || '';
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

  // Notification Preferences
  const defaultNotifPrefs = useMemo(() => ({
    masterEmail: true,
    newReflections: true,
    milestoneReports: true,
    weeklyDigest: true,
    marketingUpdates: true,
  }), []);

  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('seenly_notif_prefs');
      if (saved) return { ...defaultNotifPrefs, ...JSON.parse(saved) };
    } catch (e) {
      console.error(e);
    }
    return defaultNotifPrefs;
  });

  const handleToggleNotif = useCallback((key) => {
    setNotifPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('seenly_notif_prefs', JSON.stringify(next));
      return next;
    });
  }, []);

  const [actionLoading, setActionLoading] = useState(false);

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
    const token = localStorage.getItem('seenly_owner_token');
    if (!token) {
      setError('no_token');
      setLoading(false);
      return;
    }

    try {
      const data = await getOwnerDashboard(token);
      if (data?.displayName) {
        localStorage.setItem('seenly_display_name', data.displayName);
        setProfileNameInput(data.displayName);
      }
      if (data?.email) {
        setEmailInput(data.email);
      }
      if (data?.avatar) {
        setSelectedAvatar(data.avatar);
        localStorage.setItem('seenly_avatar', data.avatar);
      }
      if (data?.publicSlug) {
        localStorage.setItem('seenly_owner_slug', data.publicSlug);
      }
      if (typeof data?.isPremium === 'boolean') {
        if (data.isPremium) {
          localStorage.setItem('seenly_is_premium', 'true');
        } else {
          localStorage.removeItem('seenly_is_premium');
        }
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

  const displayName = capitalizeName(snapshot?.displayName || localStorage.getItem('seenly_display_name') || 'User');
  const userEmail = snapshot?.email || '';
  const currentAvatarSrc = getAvatarSrc(selectedAvatar || snapshot?.avatar || localStorage.getItem('seenly_avatar'));
  const isPremium = typeof snapshot?.isPremium === 'boolean'
    ? snapshot.isPremium
    : (typeof snapshot?.premium === 'boolean'
        ? snapshot.premium
        : (localStorage.getItem('seenly_is_premium') === 'true'));
  const responseCount = snapshot?.responseCount || 0;
  const maxResponseLimit = typeof snapshot?.maxResponseLimit === 'number'
    ? snapshot.maxResponseLimit
    : (parseInt(localStorage.getItem('seenly_test_limit'), 10) || 100);
  const usagePercent = Math.min(100, Math.round((responseCount / Math.max(maxResponseLimit, 1)) * 100));
  const isQuotaFull = responseCount >= maxResponseLimit;
  const isQuotaNearFull = !isQuotaFull && usagePercent >= 80;

  const nameChangeDaysRemaining = snapshot?.nameChangeDaysRemaining || 0;
  const isNameChangeLocked = nameChangeDaysRemaining > 0;

  const handleSelectAvatar = useCallback(async (avatarId) => {
    setSelectedAvatar(avatarId);
    setAvatarSaveStatus('saving');
    localStorage.setItem('seenly_avatar', avatarId);

    try {
      const token = localStorage.getItem('seenly_owner_token');
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
      const token = localStorage.getItem('seenly_owner_token');
      if (token) {
        const updatedSnapshot = await updateDisplayName(token, capitalized);
        localStorage.setItem('seenly_display_name', capitalized);
        sessionStorage.setItem('seenly_displayName', capitalized);
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
      setNameErrorMessage(err.message || (langCode === 'tr' ? 'İsim güncellenirken bir hata oluştu.' : 'Failed to update name.'));
      setNameSaveStatus('idle');
      return false;
    }
  }, [profileNameInput, langCode, capitalizeName]);

  const handleSaveDisplayName = useCallback((event) => {
    event?.preventDefault();
    if (isNameChangeLocked) return;
    const trimmed = (profileNameInput ?? '').trim();
    if (trimmed.length < 2) {
      setNameErrorMessage(langCode === 'tr' ? 'İsminiz en az 2 karakter olmalıdır.' : 'Your name must be at least 2 characters.');
      return;
    }
    if (trimmed.length > 15) {
      setNameErrorMessage(langCode === 'tr' ? 'İsminiz en fazla 15 karakter olabilir.' : 'Your name must be at most 15 characters.');
      return;
    }
    setNameErrorMessage('');
    setSettingsAction('name');
  }, [isNameChangeLocked, profileNameInput, langCode]);

  const commitEmail = useCallback(async (targetEmail, verificationGrant) => {
    setEmailErrorMessage('');
    setEmailSaveStatus('saving');

    try {
      const token = localStorage.getItem('seenly_owner_token');
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
        setEmailErrorMessage(langCode === 'tr' ? 'Bu e-posta başka bir hesap tarafından kullanılıyor.' : 'This email is already used by another account.');
      } else {
        setEmailErrorMessage(err.message || (langCode === 'tr' ? 'E-posta güncellenirken bir hata oluştu.' : 'Failed to update email.'));
      }
      setEmailSaveStatus('idle');
      return false;
    }
  }, [langCode]);

  const handleSaveEmail = useCallback(async (event) => {
    event?.preventDefault();
    const trimmed = (emailInput ?? '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed || !emailRegex.test(trimmed)) {
      setEmailErrorMessage(langCode === 'tr' ? 'Lütfen geçerli bir e-posta adresi giriniz.' : 'Please enter a valid email address.');
      return;
    }

    setEmailErrorMessage('');
    setPendingEmail(trimmed);

    setEmailSaveStatus('saving');
    try {
      const token = localStorage.getItem('seenly_owner_token');
      await sendVerificationCode(trimmed, 'EMAIL_CHANGE', token);
    } catch (err) {
      setEmailSaveStatus('idle');
      setEmailErrorMessage(err.message || (langCode === 'tr' ? 'Doğrulama kodu gönderilemedi.' : 'Unable to send the verification code.'));
      return;
    }
    setEmailSaveStatus('idle');

    setSettingsAction('email');
  }, [emailInput, langCode]);

  const handleConfirmSettingsAction = useCallback(async (code) => {
    if (settingsAction === 'name') {
      const saved = await commitDisplayName();
      if (saved) setSettingsAction(null);
      else throw new Error(langCode === 'tr' ? 'İsim güncellenemedi. Lütfen tekrar deneyin.' : 'The name could not be updated. Please try again.');
      return;
    }

    if (settingsAction === 'email') {
      let verificationGrant;
      try {
        const token = localStorage.getItem('seenly_owner_token');
        const response = await verifyCode(pendingEmail, code, 'EMAIL_CHANGE', token);
        verificationGrant = response.verificationGrant;
      } catch (err) {
        throw new Error(err.message || (langCode === 'tr' ? 'Doğrulama kodu hatalı veya süresi dolmuş.' : 'The verification code is incorrect or expired.'));
      }

      const saved = await commitEmail(pendingEmail, verificationGrant);
      if (saved) setSettingsAction(null);
      else throw new Error(langCode === 'tr' ? 'E-posta adresi güncellenemedi. Lütfen tekrar deneyin.' : 'The email address could not be updated. Please try again.');
    }
  }, [settingsAction, commitDisplayName, pendingEmail, commitEmail, langCode]);

  const handleUpgradeToPlus = useCallback(async () => {
    const token = localStorage.getItem('seenly_owner_token');
    try {
      setActionLoading(true);
      if (!token) throw new Error('Owner session is required.');
      const checkout = await createPaymentCheckout(token, PAYMENT_PRODUCT_CODES.SEENLY_PLUS);
      if (!checkout.checkoutUrl) throw new Error('Checkout is unavailable.');
      window.location.assign(checkout.checkoutUrl);
    } catch (err) {
      alert(err.message || (langCode === 'tr' ? 'Ödeme şu anda kullanılamıyor.' : 'Payment is currently unavailable.'));
    } finally {
      setActionLoading(false);
    }
  }, [langCode]);

  const handleBuyPack = useCallback(async (productCode) => {
    const token = localStorage.getItem('seenly_owner_token');
    try {
      setActionLoading(true);
      if (!token) throw new Error('Owner session is required.');
      const checkout = await createPaymentCheckout(token, productCode);
      if (!checkout.checkoutUrl) throw new Error('Checkout is unavailable.');
      window.location.assign(checkout.checkoutUrl);
    } catch (err) {
      alert(err.message || (langCode === 'tr' ? 'Ödeme şu anda kullanılamıyor.' : 'Payment is currently unavailable.'));
    } finally {
      setActionLoading(false);
    }
  }, [langCode]);

  const handleDeleteAccount = useCallback(async () => {
    const isTurkish = langCode === 'tr';
    const confirmDelete = window.confirm(
      isTurkish
        ? 'Hesabınızı ve hesabınıza bağlı tüm analiz verilerini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'
        : 'Are you sure you want to delete your account and all associated data? This action cannot be undone.'
    );
    if (!confirmDelete) return;

    const token = localStorage.getItem('seenly_owner_token');
    if (!token) return;

    try {
      const apiPrefix = (import.meta.env && import.meta.env.VITE_API_URL) || '';
      const response = await fetch(`${apiPrefix}/api/billing/delete-account`, {
        method: 'DELETE',
        headers: { 'X-Owner-Token': token }
      });

      if (!response.ok) throw new Error('Failed to delete account');

      alert(isTurkish ? 'Hesabınız başarıyla silindi.' : 'Your account has been successfully deleted.');
      localStorage.removeItem('seenly_owner_token');
      localStorage.removeItem('seenly_display_name');
      localStorage.removeItem('seenly_avatar');
      sessionStorage.clear();
      window.location.hash = '#/';
    } catch (err) {
      alert(isTurkish ? 'Hesap silinirken bir hata oluştu: ' + err.message : 'Error deleting account: ' + err.message);
    }
  }, [langCode]);

  const capacityPackOptions = useMemo(() => [
    {
      amount: 100,
      productCode: PAYMENT_PRODUCT_CODES.CAPACITY_100,
      label: langCode === 'tr' ? 'MİNİ PAKET' : 'MINI PACK',
      price: '$0.99',
      icon: Users,
      theme: 'tier1'
    },
    {
      amount: 250,
      productCode: PAYMENT_PRODUCT_CODES.CAPACITY_250,
      label: langCode === 'tr' ? 'STANDART PAKET' : 'STANDARD PACK',
      price: '$1.99',
      icon: Compass,
      theme: 'tier2'
    },
    {
      amount: 500,
      productCode: PAYMENT_PRODUCT_CODES.CAPACITY_500,
      label: langCode === 'tr' ? 'MAKSİ PAKET' : 'MAXI PACK',
      price: '$3.99',
      icon: Crown,
      theme: 'tier3'
    }
  ], [langCode]);

  const switchTab = useCallback((tab) => {
    setActiveTab(tab);
    window.location.hash = `#/settings?tab=${tab}`;
  }, []);

  return (
    <AppShell isDashboard={true} userName={displayName}>
      <div className="seenly-settings-page-container">
        <div className="seenly-settings-inner">
          {/* Top Return to Dashboard Link */}
          <div className="seenly-settings-top-nav">
            <button
              type="button"
              onClick={() => window.location.hash = '#/dashboard'}
              className="seenly-settings-back-btn"
            >
              <ArrowLeft size={16} strokeWidth={2.2} />
              <span>{langCode === 'tr' ? 'Panele Dön' : 'Back to Dashboard'}</span>
            </button>
          </div>

          {/* Page Header */}
          <div className="seenly-settings-header">
            <h1 className="seenly-settings-title">
              {langCode === 'tr' ? 'Ayarlar' : 'Settings'}
            </h1>
            <p className="seenly-settings-subtitle">
              {langCode === 'tr'
                ? 'Profilinizi ve Seenly Plus seçeneklerini yönetin.'
                : 'Manage your profile and Seenly Plus options.'}
            </p>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="seenly-settings-tabs-wrapper">
            <div className="seenly-settings-tabs-capsule">
              <button
                type="button"
                onClick={() => switchTab('profile')}
                className={`seenly-settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              >
                <User size={16} strokeWidth={2} />
                <span>{langCode === 'tr' ? 'Profil' : 'Profile'}</span>
              </button>

              <button
                type="button"
                onClick={() => switchTab('plans')}
                className={`seenly-settings-tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
              >
                <Star size={16} strokeWidth={2} />
                <span>Seenly Plus</span>
              </button>

              <button
                type="button"
                onClick={() => switchTab('notifications')}
                className={`seenly-settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              >
                <Bell size={16} strokeWidth={2} />
                <span>{langCode === 'tr' ? 'Bildirimler' : 'Notifications'}</span>
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
              handleUpgradeToPlus={handleUpgradeToPlus}
              capacityPackOptions={capacityPackOptions}
              handleBuyPack={handleBuyPack}
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
