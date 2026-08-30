import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';
import { getOwnerDashboard, updateDisplayName, updateEmail, updateAvatar, subscribePlus, buyCapacityPack } from '../services/api';
import { AVATARS, getAvatarSrc } from '../images/avatars';
import {
  User,
  Star,
  Bell,
  ArrowLeft,
  Users,
  Compass,
  Crown
} from 'lucide-react';
import ProfileSettingsTab from './settings/ProfileSettingsTab';
import SubscriptionTab from './settings/SubscriptionTab';
import SecuritySettingsTab from './settings/SecuritySettingsTab';
import './DashboardPlanMinimal.css';
import './settings/SettingsPage.css';

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
  const [avatarFilter, setAvatarFilter] = useState('all'); // 'all' | 'kadin' | 'erkek'
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

  const handleSaveDisplayName = useCallback(async (e) => {
    if (e) e.preventDefault();
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
    } catch (err) {
      console.error('Failed to update name', err);
      setNameErrorMessage(err.message || (langCode === 'tr' ? 'İsim güncellenirken bir hata oluştu.' : 'Failed to update name.'));
      setNameSaveStatus('idle');
    }
  }, [isNameChangeLocked, profileNameInput, langCode, capitalizeName]);

  const handleSaveEmail = useCallback(async (e) => {
    if (e) e.preventDefault();
    const trimmed = (emailInput ?? '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed || !emailRegex.test(trimmed)) {
      setEmailErrorMessage(langCode === 'tr' ? 'Lütfen geçerli bir e-posta adresi giriniz.' : 'Please enter a valid email address.');
      return;
    }

    setEmailErrorMessage('');
    setEmailSaveStatus('saving');

    try {
      const token = localStorage.getItem('seenly_owner_token');
      if (token) {
        await updateEmail(token, trimmed);
        setSnapshot(prev => ({ ...prev, email: trimmed }));
      }
      setEmailSaveStatus('saved');
      setTimeout(() => setEmailSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Failed to update email', err);
      setEmailErrorMessage(err.message || (langCode === 'tr' ? 'E-posta güncellenirken bir hata oluştu.' : 'Failed to update email.'));
      setEmailSaveStatus('idle');
    }
  }, [emailInput, langCode]);

  const handleUpgradeToPlus = useCallback(async () => {
    const token = localStorage.getItem('seenly_owner_token');
    try {
      setActionLoading(true);
      if (token) {
        try {
          await subscribePlus(token);
        } catch (apiErr) {
          console.warn('API error during upgrade:', apiErr);
        }
      }
      localStorage.setItem('seenly_is_premium', 'true');
      setSnapshot(prev => ({
        ...(prev || {}),
        isPremium: true,
        premium: true
      }));
    } catch (err) {
      console.error('Upgrade error', err);
    } finally {
      setActionLoading(false);
    }
  }, []);

  const handleBuyPack = useCallback(async (amount) => {
    const token = localStorage.getItem('seenly_owner_token');
    try {
      setActionLoading(true);
      if (token) {
        try {
          await buyCapacityPack(token, amount);
        } catch (apiErr) {
          console.warn('API error during pack purchase:', apiErr);
        }
      }
      const newLimit = (snapshot?.maxResponseLimit ?? (parseInt(localStorage.getItem('seenly_test_limit'), 10) || 100)) + amount;
      localStorage.setItem('seenly_test_limit', newLimit.toString());
      setSnapshot(prev => ({
        ...(prev || {}),
        maxResponseLimit: newLimit
      }));
    } catch (err) {
      console.error('Buy pack error', err);
    } finally {
      setActionLoading(false);
    }
  }, [snapshot?.maxResponseLimit]);

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

  const filteredAvatars = useMemo(() => {
    return AVATARS.filter(av => {
      if (avatarFilter === 'all') return true;
      return av.gender === avatarFilter;
    });
  }, [avatarFilter]);

  const capacityPackOptions = useMemo(() => [
    {
      amount: 100,
      label: langCode === 'tr' ? 'MİNİ PAKET' : 'MINI PACK',
      price: '$0.99',
      icon: Users,
      theme: 'tier1'
    },
    {
      amount: 300,
      label: langCode === 'tr' ? 'STANDART PAKET' : 'STANDARD PACK',
      price: '$1.99',
      icon: Compass,
      theme: 'tier2'
    },
    {
      amount: 500,
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
                ? 'Profilinizi ve üyelik tercihlerinizi yönetin.'
                : 'Manage your profile and membership preferences.'}
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
                <span>{langCode === 'tr' ? 'Üyelik' : 'Membership'}</span>
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
    </AppShell>
  );
}
