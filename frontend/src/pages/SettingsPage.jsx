import React, { useState, useEffect } from 'react';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';
import { getOwnerDashboard, updateDisplayName, updateEmail, updateAvatar, subscribePlus, buyCapacityPack } from '../services/api';
import { AVATARS, getAvatarSrc } from '../images/avatars';
import {
  User,
  Sparkles,
  Star,
  Bell,
  Check,
  ArrowUpRight,
  ArrowLeft,
  Gauge,
  CircleUserRound,
  UsersRound,
  Trash2,
  Mail,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  Award,
  TrendingUp,
  Megaphone,
  CheckCircle2,
  ShieldCheck,
  Flame,
  Crown,
  ArrowRight,
  UserPlus,
  Infinity,
  Brain,
  Target,
  BarChart3,
  Compass,
  Eye,
  Clock,
  Users
} from 'lucide-react';
import './DashboardPlanMinimal.css';

export default function SettingsPage() {
  const { locale: langCode, setLocale, t } = useLocale();
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
  const defaultNotifPrefs = {
    masterEmail: true,
    newReflections: true,
    milestoneReports: true,
    weeklyDigest: true,
    marketingUpdates: true,
  };

  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('seenly_notif_prefs');
      if (saved) return { ...defaultNotifPrefs, ...JSON.parse(saved) };
    } catch (e) {
      console.error(e);
    }
    return defaultNotifPrefs;
  });

  const handleToggleNotif = (key) => {
    setNotifPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('seenly_notif_prefs', JSON.stringify(next));
      return next;
    });
  };

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

  const loadData = async () => {
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
  };

  useEffect(() => {
    loadData();
  }, []);

  const capitalizeName = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => {
        if (!word) return '';
        return word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase();
      })
      .join(' ');
  };

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
  const remainingQuota = Math.max(0, maxResponseLimit - responseCount);
  const usagePercent = Math.min(100, Math.round((responseCount / Math.max(maxResponseLimit, 1)) * 100));
  const isQuotaFull = responseCount >= maxResponseLimit;
  const isQuotaNearFull = !isQuotaFull && usagePercent >= 80;

  const nameChangeDaysRemaining = snapshot?.nameChangeDaysRemaining || 0;
  const isNameChangeLocked = nameChangeDaysRemaining > 0;

  const handleSelectAvatar = async (avatarId) => {
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
  };

  const handleSaveDisplayName = async (e) => {
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
  };

  const handleSaveEmail = async (e) => {
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
  };

  const handleUpgradeToPlus = async () => {
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
  };

  const handleResetToFreeTest = () => {
    localStorage.removeItem('seenly_is_premium');
    localStorage.removeItem('seenly_test_limit');
    setSnapshot(prev => ({
      ...(prev || {}),
      isPremium: false,
      premium: false,
      maxResponseLimit: 100
    }));
  };

  const handleBuyPack = async (amount) => {
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
  };

  const handleDeleteAccount = async () => {
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
  };

  const filteredAvatars = AVATARS.filter(av => {
    if (avatarFilter === 'all') return true;
    return av.gender === avatarFilter;
  });

  const freePlanFeatures = [
    t('ui', 'pricing_plan_free_f1'),
    t('ui', 'pricing_plan_free_f2'),
    t('ui', 'pricing_plan_free_f3'),
    t('ui', 'pricing_plan_free_f4'),
    t('ui', 'pricing_plan_free_f5'),
    t('ui', 'pricing_plan_free_f6')
  ].filter(Boolean);

  const plusPlanFeatures = [
    t('ui', 'pricing_plan_premium_f1'),
    t('ui', 'pricing_plan_premium_f2'),
    t('ui', 'pricing_plan_premium_f3'),
    t('ui', 'pricing_plan_premium_f4'),
    t('ui', 'pricing_plan_premium_f5'),
    t('ui', 'pricing_plan_premium_f6'),
    t('ui', 'pricing_plan_premium_f7')
  ].filter(Boolean);

  const capacityPackOptions = [
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
  ];

  const switchTab = (tab) => {
    setActiveTab(tab);
    window.location.hash = `#/settings?tab=${tab}`;
  };

  const isFormDirty = profileNameInput.trim() !== displayName || emailInput.trim().toLowerCase() !== (userEmail || '').toLowerCase();

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

          {/* TAB 1: PROFILE SETTINGS (Clean, Single Card, Zero Duplication) */}
          {activeTab === 'profile' && (
            <div className="seenly-settings-content seenly-settings-fade-in">
              <div className="seenly-plan-pro seenly-plan-clean">

                {/* Single Unified Profile Card */}
                <section className="seenly-profile-card seenly-form-card">

                  {/* 1. Avatar Picker Header Row */}
                  <div className="seenly-avatar-row">
                    <div
                      className="seenly-profile-avatar-preview-wrap cursor-pointer"
                      onClick={() => setShowAvatarPicker(prev => !prev)}
                      title={langCode === 'tr' ? 'Avatarı Değiştir' : 'Change Avatar'}
                    >
                      {currentAvatarSrc ? (
                        <img
                          src={currentAvatarSrc}
                          alt={displayName}
                          className="seenly-profile-avatar-preview-img"
                        />
                      ) : (
                        <div className="seenly-profile-identity-avatar">
                          {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>

                    <div className="seenly-avatar-details">
                      <div className="seenly-avatar-details-title-row">
                        <h3 className="seenly-avatar-details-title">
                          {langCode === 'tr' ? 'Profil Avatarı' : 'Profile Avatar'}
                        </h3>
                        {avatarSaveStatus === 'saved' && (
                          <span className="seenly-profile-status-badge">
                            <Check size={12} strokeWidth={2.5} />
                            {langCode === 'tr' ? 'Kaydedildi' : 'Saved'}
                          </span>
                        )}
                        {avatarSaveStatus === 'saving' && (
                          <span className="seenly-profile-status-badge is-saving">
                            {langCode === 'tr' ? 'Kaydediliyor...' : 'Saving...'}
                          </span>
                        )}
                      </div>
                      <p className="seenly-avatar-details-subtext">
                        {langCode === 'tr'
                          ? 'Panelinizde ve test bağlantınızda görünen temsilciniz.'
                          : 'Your avatar shown across your dashboard and test link.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAvatarPicker(prev => !prev)}
                      className={`seenly-avatar-toggle-btn ${showAvatarPicker ? 'active' : ''}`}
                    >
                      <span>{showAvatarPicker ? (langCode === 'tr' ? 'Kapat' : 'Close') : (langCode === 'tr' ? 'Avatarı Değiştir' : 'Change Avatar')}</span>
                      {showAvatarPicker ? <ChevronUp size={16} strokeWidth={2.2} /> : <ChevronDown size={16} strokeWidth={2.2} />}
                    </button>
                  </div>

                  {/* Expandable Avatar Picker Drawer (No 'Tamam' button) */}
                  {showAvatarPicker && (
                    <div className="seenly-avatar-drawer seenly-settings-fade-in">
                      <div className="seenly-avatar-filter-row">
                        <button
                          type="button"
                          onClick={() => setAvatarFilter('all')}
                          className={`seenly-avatar-filter-btn ${avatarFilter === 'all' ? 'active' : ''}`}
                        >
                          {langCode === 'tr' ? 'Tümü (12)' : 'All (12)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAvatarFilter('kadin')}
                          className={`seenly-avatar-filter-btn ${avatarFilter === 'kadin' ? 'active' : ''}`}
                        >
                          {langCode === 'tr' ? 'Kadın (6)' : 'Women (6)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAvatarFilter('erkek')}
                          className={`seenly-avatar-filter-btn ${avatarFilter === 'erkek' ? 'active' : ''}`}
                        >
                          {langCode === 'tr' ? 'Erkek (6)' : 'Men (6)'}
                        </button>
                      </div>

                      <div className="seenly-avatar-grid">
                        {filteredAvatars.map((av) => {
                          const isSelected = selectedAvatar === av.id;
                          return (
                            <button
                              key={av.id}
                              type="button"
                              onClick={() => handleSelectAvatar(av.id)}
                              className={`seenly-avatar-item-btn ${isSelected ? 'is-selected' : ''}`}
                              aria-label={av.label}
                              title={av.label}
                            >
                              <div className="seenly-avatar-circle-frame">
                                <img
                                  src={av.src}
                                  alt={av.label}
                                  className="seenly-avatar-thumb"
                                />
                                {isSelected && (
                                  <span className="seenly-avatar-check-indicator">
                                    <Check size={12} strokeWidth={3} />
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Subtle Divider */}
                  <div className="seenly-profile-divider" />

                  {/* 2. Display Name Row with Dedicated Update Button */}
                  <form onSubmit={handleSaveDisplayName} className="seenly-profile-item-form">
                    <div className="seenly-form-field">
                      <div className="seenly-form-label-row">
                        <label htmlFor="seenly-display-name-input" className="seenly-form-label">
                          {langCode === 'tr' ? 'Görünen İsim' : 'Display Name'}
                        </label>
                        <span className="seenly-field-counter">
                          {profileNameInput.length}/15
                        </span>
                      </div>
                      <div className="seenly-inline-input-group">
                        <input
                          id="seenly-display-name-input"
                          type="text"
                          value={profileNameInput}
                          disabled={isNameChangeLocked}
                          onChange={(e) => {
                            if (isNameChangeLocked) return;
                            setProfileNameInput(e.target.value);
                            if (nameErrorMessage) setNameErrorMessage('');
                            if (nameSaveStatus !== 'idle') setNameSaveStatus('idle');
                          }}
                          maxLength={15}
                          placeholder={langCode === 'tr' ? 'İsminizi girin...' : 'Enter your name...'}
                          className="seenly-form-input"
                          style={isNameChangeLocked ? {
                            opacity: 0.75,
                            cursor: 'not-allowed',
                            backgroundColor: 'rgba(11, 27, 44, 0.03)'
                          } : undefined}
                        />
                        <button
                          type="submit"
                          disabled={isNameChangeLocked || nameSaveStatus === 'saving' || !profileNameInput.trim() || profileNameInput.trim() === displayName}
                          className={`seenly-inline-save-btn ${nameSaveStatus === 'saved' ? 'is-saved' : ''}`}
                          style={isNameChangeLocked ? {
                            cursor: 'not-allowed',
                            opacity: 0.7,
                            background: 'rgba(11, 27, 44, 0.06)',
                            color: '#64748b',
                            borderColor: 'rgba(11, 27, 44, 0.1)'
                          } : undefined}
                        >
                          {isNameChangeLocked ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Clock size={13} strokeWidth={2.2} />
                              <span>{langCode === 'tr' ? `Kilitli (${nameChangeDaysRemaining} gün)` : `Locked (${nameChangeDaysRemaining}d)`}</span>
                            </span>
                          ) : nameSaveStatus === 'saving' ? (
                            <span>{langCode === 'tr' ? 'Kaydediliyor...' : 'Saving...'}</span>
                          ) : nameSaveStatus === 'saved' ? (
                            <>
                              <Check size={14} strokeWidth={2.5} />
                              <span>{langCode === 'tr' ? 'Güncellendi' : 'Updated'}</span>
                            </>
                          ) : (
                            <span>{langCode === 'tr' ? 'İsmi Güncelle' : 'Update Name'}</span>
                          )}
                        </button>
                      </div>
                    </div>
                    {nameErrorMessage && (
                      <div className="seenly-profile-feedback is-error">
                        {nameErrorMessage}
                      </div>
                    )}
                    {nameSaveStatus === 'saved' && !nameErrorMessage && (
                      <div className="seenly-profile-feedback is-success">
                        {langCode === 'tr' ? 'İsminiz başarıyla güncellendi.' : 'Your name has been updated successfully.'}
                      </div>
                    )}
                  </form>

                  {/* Subtle Divider */}
                  <div className="seenly-profile-divider" />

                  {/* 3. Email Address Row with Dedicated Update Button */}
                  <form onSubmit={handleSaveEmail} className="seenly-profile-item-form">
                    <div className="seenly-form-field">
                      <div className="seenly-form-label-row">
                        <label htmlFor="seenly-email-input" className="seenly-form-label">
                          {langCode === 'tr' ? 'E-posta Adresi' : 'Email Address'}
                        </label>
                      </div>
                      <div className="seenly-inline-input-group">
                        <input
                          id="seenly-email-input"
                          type="email"
                          value={emailInput}
                          onChange={(e) => {
                            setEmailInput(e.target.value);
                            if (emailErrorMessage) setEmailErrorMessage('');
                            if (emailSaveStatus !== 'idle') setEmailSaveStatus('idle');
                          }}
                          placeholder={langCode === 'tr' ? 'eposta@adresiniz.com' : 'your@email.com'}
                          className="seenly-form-input"
                        />
                        <button
                          type="submit"
                          disabled={emailSaveStatus === 'saving' || !emailInput.trim() || emailInput.trim().toLowerCase() === (userEmail || '').toLowerCase()}
                          className={`seenly-inline-save-btn ${emailSaveStatus === 'saved' ? 'is-saved' : ''}`}
                        >
                          {emailSaveStatus === 'saving' ? (
                            <span>{langCode === 'tr' ? 'Kaydediliyor...' : 'Saving...'}</span>
                          ) : emailSaveStatus === 'saved' ? (
                            <>
                              <Check size={14} strokeWidth={2.5} />
                              <span>{langCode === 'tr' ? 'Güncellendi' : 'Updated'}</span>
                            </>
                          ) : (
                            <span>{langCode === 'tr' ? 'E-postayı Güncelle' : 'Update Email'}</span>
                          )}
                        </button>
                      </div>
                    </div>
                    {emailErrorMessage && (
                      <div className="seenly-profile-feedback is-error">
                        {emailErrorMessage}
                      </div>
                    )}
                    {emailSaveStatus === 'saved' && !emailErrorMessage && (
                      <div className="seenly-profile-feedback is-success">
                        {langCode === 'tr' ? 'E-posta adresiniz başarıyla güncellendi.' : 'Your email address has been updated successfully.'}
                      </div>
                    )}
                  </form>

                  {/* Subtle Divider */}
                  <div className="seenly-profile-divider" />

                  {/* 4. Delete Account Row (At the bottom of this same box) */}
                  <div className="seenly-danger-content">
                    <div className="seenly-danger-info">
                      <h4 className="seenly-danger-title">
                        {langCode === 'tr' ? 'Hesabı Sil' : 'Delete Account'}
                      </h4>
                      <p className="seenly-danger-subtext">
                        {langCode === 'tr'
                          ? 'Hesabınızı ve hesabınıza ait tüm analiz verilerini kalıcı olarak kaldırın. Bu işlem geri alınamaz.'
                          : 'Permanently remove your account and all associated test data. This action cannot be undone.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="seenly-danger-outline-btn"
                    >
                      <Trash2 size={14} strokeWidth={2} />
                      <span>{langCode === 'tr' ? 'Hesabımı Sil' : 'Delete Account'}</span>
                    </button>
                  </div>

                </section>
              </div>
            </div>
          )}

          {/* TAB 2: PACKAGES & MEMBERSHIP (Temiz, Profesyonel & Tek Seferlik Vurgusu) */}
          {activeTab === 'plans' && (
            <div className="seenly-settings-content seenly-settings-fade-in">
              <div className="seenly-plan-pro seenly-plan-clean">

                {/* 1. Limit Tracker Card (Only visible when Free / !isPremium) */}
                {!isPremium && (
                  <section className="seenly-quota-tracker-card relative overflow-hidden">
                    {/* Celestial Sacred Geometry & Vector Motif Layer */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                      <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-[radial-gradient(circle,rgba(228,196,136,0.22)_0%,transparent_70%)] blur-xl pointer-events-none" />
                      <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full bg-[radial-gradient(circle,rgba(26,62,114,0.05)_0%,transparent_70%)] blur-xl pointer-events-none" />

                      {/* Astrolabe Arc Watermark */}
                      <svg className="absolute -right-8 -top-8 w-44 h-44 text-[#C5A059] opacity-[0.14]" viewBox="0 0 120 120" fill="none" stroke="currentColor">
                        <circle cx="60" cy="60" r="54" strokeWidth="0.75" strokeDasharray="3 3" />
                        <circle cx="60" cy="60" r="42" strokeWidth="0.75" />
                        <circle cx="60" cy="60" r="28" strokeWidth="0.5" strokeDasharray="2 2" />
                        <line x1="6" y1="60" x2="114" y2="60" strokeWidth="0.5" strokeDasharray="3 3" />
                        <line x1="60" y1="6" x2="60" y2="114" strokeWidth="0.5" strokeDasharray="3 3" />
                      </svg>
                    </div>

                    {/* Header Block: Title, Subtext & Metric Counter */}
                    <div className="relative z-10 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="seenly-quota-head-icon">
                          <Gauge size={19} strokeWidth={2} />
                        </div>
                        <div>
                          <h3 className="seenly-quota-title">
                            {langCode === 'tr' ? 'Katılımcı Kotanız' : 'Participant Quota'}
                          </h3>
                          <p className="seenly-quota-subtext">
                            {langCode === 'tr'
                              ? 'Testinize katılan arkadaşlarınızın yanıt sayısı ve kalan kotanız.'
                              : 'The number of friend responses collected and your remaining capacity.'}
                          </p>
                        </div>
                      </div>

                      {/* Metric Badge */}
                      <div className="seenly-quota-metric-badge">
                        <div className="seenly-quota-metric-val">
                          <span className="seenly-quota-metric-current">{responseCount}</span>
                          <span className="seenly-quota-metric-sep">/</span>
                          <span className="seenly-quota-metric-max">{maxResponseLimit}</span>
                        </div>
                        <span className="seenly-quota-metric-label">
                          {langCode === 'tr' ? 'Yanıt Toplandı' : 'Responses'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="relative z-10 seenly-quota-track-wrap">
                      <div className="seenly-quota-track-bar">
                        <div
                          className={`seenly-quota-track-fill ${isQuotaFull ? 'is-full' : isQuotaNearFull ? 'is-warning' : 'is-normal'}`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Contextual Warning / Full Alert Banner (Only when needed, zero redundant numbers) */}
                    {(isQuotaFull || isQuotaNearFull) && (
                      <div className={`relative z-10 seenly-quota-status-banner ${isQuotaFull ? 'status-full' : 'status-warning'}`}>
                        <div className="seenly-quota-status-icon">
                          {isQuotaFull ? (
                            <AlertTriangle size={14} strokeWidth={2.2} />
                          ) : (
                            <Clock size={14} strokeWidth={2.2} />
                          )}
                        </div>
                        <span className="seenly-quota-status-text">
                          {isQuotaFull
                            ? (langCode === 'tr'
                                ? 'Kotanız doldu. Yeni arkadaş yanıtlarını kaçırmamak için kotanızı yükseltin.'
                                : 'Quota reached. Upgrade to keep collecting new responses.')
                            : (langCode === 'tr'
                                ? 'Kotanız dolmak üzere. Yanıt toplamaya kesintisiz devam etmek için kotanızı yükseltin.'
                                : 'Quota almost full. Upgrade to keep collecting responses seamlessly.')}
                        </span>
                      </div>
                    )}
                  </section>
                )}

                {/* 2. If Plus: Active VIP Benefits Card (Celestial Luxury Showcase) */}
                {isPremium ? (
                  <section className="seenly-plus-active-card relative overflow-hidden">
                    {/* Celestial Sacred Geometry & Vector Motif Layer */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(228,196,136,0.28)_0%,transparent_70%)] blur-2xl pointer-events-none" />
                      <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(26,62,114,0.06)_0%,transparent_70%)] blur-2xl pointer-events-none" />

                      {/* Top-Right Sacred Astrolabe & Celestial Compass Motif */}
                      <svg className="absolute -right-10 -top-10 w-64 h-64 text-[#C5A059] opacity-[0.18]" viewBox="0 0 200 200" fill="none" stroke="currentColor">
                        <circle cx="100" cy="100" r="92" strokeWidth="0.75" strokeDasharray="3 3" />
                        <circle cx="100" cy="100" r="74" strokeWidth="0.75" />
                        <circle cx="100" cy="100" r="56" strokeWidth="0.5" strokeDasharray="2 3" />
                        <circle cx="100" cy="100" r="38" strokeWidth="0.75" />
                        <circle cx="100" cy="100" r="18" strokeWidth="0.5" />
                        <line x1="8" y1="100" x2="192" y2="100" strokeWidth="0.5" strokeDasharray="4 4" />
                        <line x1="100" y1="8" x2="100" y2="192" strokeWidth="0.5" strokeDasharray="4 4" />
                      </svg>
                    </div>

                    {/* Main Title & Action Toggle Row */}
                    <div className="relative z-10 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                      <div>
                        <h3 className="seenly-plus-active-title">
                          {langCode === 'tr' ? 'Seenly Plus Üyeliğiniz Aktif' : 'Seenly Plus is Active'}
                        </h3>
                        <p className="seenly-plus-active-desc">
                          {langCode === 'tr'
                            ? 'Tek seferlik ödemenizle tüm kilitler sınırsız olarak açıldı. Aylık veya yıllık yenileme ücreti bulunmaz.'
                            : 'All features are permanently unlocked with your one-time purchase. No recurring subscription fees.'}
                        </p>
                      </div>

                      {/* "Avantajları Gör" Expand / Collapse Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setShowPlusActivePerks(prev => !prev)}
                        className="seenly-plus-perks-toggle-btn"
                        aria-expanded={showPlusActivePerks}
                      >
                        <span>{showPlusActivePerks ? (langCode === 'tr' ? 'Avantajları Gizle' : 'Hide Benefits') : (langCode === 'tr' ? 'Avantajları Gör' : 'View Benefits')}</span>
                        <ChevronDown
                          size={15}
                          strokeWidth={2.4}
                          className={`seenly-plus-perks-chevron ${showPlusActivePerks ? 'is-open' : ''}`}
                        />
                      </button>
                    </div>

                    {/* Expandable Benefits Container (Exact 4 Core Features from Showcase) */}
                    {showPlusActivePerks && (
                      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-5 mt-5 border-t border-[rgba(197,160,89,0.22)] seenly-settings-fade-in">
                        {/* 1. Sınırsız Katılımcı Kotası */}
                        <div className="seenly-plus-feature-item">
                          <div className="seenly-plus-feature-icon-badge">
                            <Users size={16} strokeWidth={2.2} />
                          </div>
                          <div>
                            <h5 className="seenly-plus-feature-title">
                              {langCode === 'tr' ? 'Sınırsız Katılımcı Kotası' : 'Unlimited Respondent Capacity'}
                            </h5>
                            <p className="seenly-plus-feature-desc">
                              {langCode === 'tr' ? '100 yanıt limitine takılmadan sınırsız yanıt toplayın' : 'Collect unlimited feedback without any response limits'}
                            </p>
                          </div>
                        </div>

                        {/* 2. Bireysel Analiz & Yanıt Dökümü */}
                        <div className="seenly-plus-feature-item">
                          <div className="seenly-plus-feature-icon-badge">
                            <BarChart3 size={16} strokeWidth={2} />
                          </div>
                          <div>
                            <h5 className="seenly-plus-feature-title">
                              {langCode === 'tr' ? 'Gelen Analiz Detayları' : 'Individual Analysis Breakdowns'}
                            </h5>
                            <p className="seenly-plus-feature-desc">
                              {langCode === 'tr' ? 'Arkadaşlarınızın 10 karakter sinyalini ve puan dökümünü görün' : 'View 10-signal scores and detailed answer breakdowns'}
                            </p>
                          </div>
                        </div>

                        {/* 3. Soruda Geçirilen Zaman / Karar Ritmi */}
                        <div className="seenly-plus-feature-item">
                          <div className="seenly-plus-feature-icon-badge">
                            <Clock size={16} strokeWidth={2.2} />
                          </div>
                          <div>
                            <h5 className="seenly-plus-feature-title">
                              {langCode === 'tr' ? 'Soruda Geçirilen Zaman' : 'Question Decision Times'}
                            </h5>
                            <p className="seenly-plus-feature-desc">
                              {langCode === 'tr' ? 'Hangi sorularda kaçar saniye düşünüldüğünü inceleyin' : 'See exact seconds spent on each question'}
                            </p>
                          </div>
                        </div>

                        {/* 4. Profil Ziyaretleri */}
                        <div className="seenly-plus-feature-item">
                          <div className="seenly-plus-feature-icon-badge">
                            <Eye size={16} strokeWidth={2.2} />
                          </div>
                          <div>
                            <h5 className="seenly-plus-feature-title">
                              {langCode === 'tr' ? 'Profil Ziyaretleri' : 'Profile Visit Analytics'}
                            </h5>
                            <p className="seenly-plus-feature-desc">
                              {langCode === 'tr' ? 'Ziyaretçi sayısını ve yanıta dönüşüm oranlarını anlık takip edin' : 'Track visitor volume and response conversion rates'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                ) : (
                  /* If Free: Showcase Seenly Plus (Clear One-Time Payment, No Subscription) + Extra Packs */
                  <>
                    {/* Main Showcase Card for Plus (Clean, Refined & Celestial Motif Styling) */}
                    <section className="seenly-plus-showcase-card relative overflow-hidden">
                      {/* Celestial Sacred Geometry & Vector Motif Layer */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                        {/* Ambient Golden & Sapphire Atmospheric Glows */}
                        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(228,196,136,0.28)_0%,transparent_70%)] blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(26,62,114,0.06)_0%,transparent_70%)] blur-2xl pointer-events-none" />

                        {/* Top-Right Sacred Astrolabe & Celestial Compass Motif */}
                        <svg className="absolute -right-12 -top-12 w-72 h-72 text-[#C5A059] opacity-[0.18]" viewBox="0 0 200 200" fill="none" stroke="currentColor">
                          <circle cx="100" cy="100" r="92" strokeWidth="0.75" strokeDasharray="3 3" />
                          <circle cx="100" cy="100" r="74" strokeWidth="0.75" />
                          <circle cx="100" cy="100" r="56" strokeWidth="0.5" strokeDasharray="2 3" />
                          <circle cx="100" cy="100" r="38" strokeWidth="0.75" />
                          <circle cx="100" cy="100" r="18" strokeWidth="0.5" />
                          {/* 8-Point Radial Axis */}
                          <line x1="8" y1="100" x2="192" y2="100" strokeWidth="0.5" strokeDasharray="4 4" />
                          <line x1="100" y1="8" x2="100" y2="192" strokeWidth="0.5" strokeDasharray="4 4" />
                          <line x1="35" y1="35" x2="165" y2="165" strokeWidth="0.5" strokeDasharray="2 4" />
                          <line x1="35" y1="165" x2="165" y2="35" strokeWidth="0.5" strokeDasharray="2 4" />
                          {/* Astrological Geometric Diamonds */}
                          <polygon points="100,26 174,100 100,174 26,100" strokeWidth="0.6" strokeDasharray="3 3" />
                          <polygon points="100,44 156,100 100,156 44,100" strokeWidth="0.6" />
                        </svg>

                        {/* Bottom-Left Star Compass Motif */}
                        <svg className="absolute -left-10 -bottom-10 w-56 h-56 text-[#C5A059] opacity-[0.14]" viewBox="0 0 160 160" fill="none" stroke="currentColor">
                          <circle cx="80" cy="80" r="72" strokeWidth="0.6" strokeDasharray="2 3" />
                          <circle cx="80" cy="80" r="50" strokeWidth="0.6" />
                          <polygon points="80,12 94,66 148,80 94,94 80,148 66,94 12,80 66,66" strokeWidth="0.5" fill="rgba(197, 160, 89, 0.04)" />
                        </svg>
                      </div>

                      {/* Hanging Price Curtain Banner (Top-Right) */}
                      <div className="seenly-plus-price-curtain">
                        <div className="seenly-plus-price-curtain-pin" aria-hidden="true" />
                        <div className="seenly-plus-price-val">
                          <span className="seenly-plus-price-symbol">
                            {t('ui', 'pricing_plan_premium_price').startsWith('₺') ? '₺' : '$'}
                          </span>
                          <span>
                            {t('ui', 'pricing_plan_premium_price').replace(/^[^0-9.]+/, '') || '2.99'}
                          </span>
                        </div>
                        <span className="seenly-plus-price-label">
                          {langCode === 'tr' ? 'Tek Seferlik' : 'One-Time'}
                        </span>
                      </div>

                      {/* Title & Subtext Block */}
                      <div className="relative z-10 pt-1 max-w-lg">
                        <h3 className="seenly-plus-title">
                          Seenly Plus
                        </h3>
                        <div className="w-10 h-[1.5px] bg-[#C5A059] opacity-60 my-2" />
                        <p className="seenly-plus-subtext">
                          {langCode === 'tr'
                            ? 'Tüm analizlerin kilidini ve sınırsız katılımcı kotasını tek seferde açın.'
                            : 'Unlock all deep analytics and unlimited respondent capacity in one single step.'}
                        </p>
                      </div>

                      {/* 4 Core Features Grid (Integrated Directly in the Card) */}
                      <div className="relative z-10 my-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 sm:gap-y-5 gap-x-8">
                          {/* 1. Sınırsız Katılımcı Kotası */}
                          <div className="seenly-plus-feature-item">
                            <div className="seenly-plus-feature-icon-badge">
                              <Users size={16} strokeWidth={2.2} />
                            </div>
                            <div>
                              <h5 className="seenly-plus-feature-title">
                                {langCode === 'tr' ? 'Sınırsız Katılımcı Kotası' : 'Unlimited Respondent Capacity'}
                              </h5>
                              <p className="seenly-plus-feature-desc">
                                {langCode === 'tr' ? '100 yanıt limitine takılmadan sınırsız yanıt toplayın' : 'Collect unlimited feedback without any response limits'}
                              </p>
                            </div>
                          </div>

                          {/* 2. Bireysel Analiz & Yanıt Dökümü */}
                          <div className="seenly-plus-feature-item">
                            <div className="seenly-plus-feature-icon-badge">
                              <BarChart3 size={16} strokeWidth={2} />
                            </div>
                            <div>
                              <h5 className="seenly-plus-feature-title">
                                {langCode === 'tr' ? 'Gelen Analiz Detayları' : 'Individual Analysis Breakdowns'}
                              </h5>
                              <p className="seenly-plus-feature-desc">
                                {langCode === 'tr' ? 'Arkadaşlarınızın 10 karakter sinyalini ve puan dökümünü görün' : 'View 10-signal scores and detailed answer breakdowns'}
                              </p>
                            </div>
                          </div>

                          {/* 3. Soruda Geçirilen Zaman / Karar Ritmi */}
                          <div className="seenly-plus-feature-item">
                            <div className="seenly-plus-feature-icon-badge">
                              <Clock size={16} strokeWidth={2.2} />
                            </div>
                            <div>
                              <h5 className="seenly-plus-feature-title">
                                {langCode === 'tr' ? 'Soruda Geçirilen Zaman' : 'Question Decision Times'}
                              </h5>
                              <p className="seenly-plus-feature-desc">
                                {langCode === 'tr' ? 'Hangi sorularda kaçar saniye düşünüldüğünü inceleyin' : 'See exact seconds spent on each question'}
                              </p>
                            </div>
                          </div>

                          {/* 4. Profil Ziyaretleri */}
                          <div className="seenly-plus-feature-item">
                            <div className="seenly-plus-feature-icon-badge">
                              <Eye size={16} strokeWidth={2.2} />
                            </div>
                            <div>
                              <h5 className="seenly-plus-feature-title">
                                {langCode === 'tr' ? 'Profil Ziyaretleri' : 'Profile Visit Analytics'}
                              </h5>
                              <p className="seenly-plus-feature-desc">
                                {langCode === 'tr' ? 'Ziyaretçi sayısını ve yanıta dönüşüm oranlarını anlık takip edin' : 'Track visitor volume and response conversion rates'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Subtle Separator */}
                      <div className="relative z-10 w-full h-[1px] bg-[rgba(197,160,89,0.22)] my-4" />

                      {/* Footer Bar */}
                      <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-[#554030] text-[12.5px] font-sans">
                          <div className="w-6 h-6 rounded-full bg-[#FAF5EA] border border-[rgba(197,160,89,0.3)] flex items-center justify-center text-[#8C6D37] flex-shrink-0">
                            <ShieldCheck size={14} strokeWidth={2} />
                          </div>
                          <span>{langCode === 'tr' ? '256-Bit SSL Güvenli Ödeme' : '256-Bit SSL Secure Payment'}</span>
                        </div>

                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={handleUpgradeToPlus}
                          className="seenly-plus-cta-btn"
                        >
                          <span>{actionLoading ? (langCode === 'tr' ? 'İşleniyor...' : 'Processing...') : (langCode === 'tr' ? `Plus’a Yükselt (${t('ui', 'pricing_plan_premium_price')})` : `Upgrade to Plus (${t('ui', 'pricing_plan_premium_price')})`)}</span>
                          <ArrowRight size={14} strokeWidth={2} className="seenly-plus-cta-arrow" />
                        </button>
                      </div>
                    </section>

                    {/* 3. Extra Capacity Packs with Painterly Watercolor Nebula Texture */}
                    <section className="seenly-packs-painterly-container relative overflow-hidden">
                      {/* Celestial Sacred Geometry & Vector Motif Layer */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                        {/* Ambient Golden Atmospheric Glows */}
                        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(228,196,136,0.22)_0%,transparent_70%)] blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(212,163,76,0.16)_0%,transparent_70%)] blur-2xl pointer-events-none" />

                        {/* Top-Left Sacred Concentric Dial Motif */}
                        <svg className="absolute -left-12 -top-12 w-64 h-64 text-[#C5A059] opacity-[0.14]" viewBox="0 0 160 160" fill="none" stroke="currentColor">
                          <circle cx="80" cy="80" r="74" strokeWidth="0.6" strokeDasharray="3 3" />
                          <circle cx="80" cy="80" r="56" strokeWidth="0.6" />
                          <circle cx="80" cy="80" r="38" strokeWidth="0.5" strokeDasharray="2 3" />
                          <line x1="6" y1="80" x2="154" y2="80" strokeWidth="0.5" strokeDasharray="3 3" />
                          <line x1="80" y1="6" x2="80" y2="154" strokeWidth="0.5" strokeDasharray="3 3" />
                          <polygon points="80,24 136,80 80,136 24,80" strokeWidth="0.5" strokeDasharray="2 2" />
                        </svg>

                        {/* Bottom-Right Sacred Astrolabe Motif */}
                        <svg className="absolute -right-16 -bottom-16 w-72 h-72 text-[#C5A059] opacity-[0.15]" viewBox="0 0 200 200" fill="none" stroke="currentColor">
                          <circle cx="100" cy="100" r="90" strokeWidth="0.75" strokeDasharray="3 3" />
                          <circle cx="100" cy="100" r="70" strokeWidth="0.75" />
                          <circle cx="100" cy="100" r="48" strokeWidth="0.5" strokeDasharray="2 3" />
                          <polygon points="100,30 170,100 100,170 30,100" strokeWidth="0.6" />
                        </svg>
                      </div>

                      <div className="relative z-10 flex items-start gap-3.5 pb-2">
                        <div className="w-12 h-12 rounded-full bg-[#FAF5EA]/90 backdrop-blur-sm border border-[rgba(197,160,89,0.4)] shadow-sm flex items-center justify-center text-[#8C6D37] flex-shrink-0">
                          <UserPlus size={20} strokeWidth={1.7} />
                        </div>
                        <div>
                          <h4 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.25rem', fontWeight: 650, color: '#1A3E72', margin: 0, lineHeight: 1.25 }}>
                            {langCode === 'tr' ? 'Yalnızca Yanıt Kotasını Artır' : 'Expand Response Capacity Only'}
                          </h4>
                          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12.5px', color: '#554030', margin: '4px 0 0', lineHeight: 1.4 }}>
                            {langCode === 'tr'
                              ? 'Plus’a geçmeden sadece yanıt limitini genişletmek isterseniz tek seferlik ek paketler:'
                              : 'If you only want to expand response limits without full Plus features:'}
                          </p>
                        </div>
                      </div>

                      <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-4 pt-3 seenly-packs-grid">
                        {capacityPackOptions.map((pack) => {
                          return (
                            <div key={pack.amount} className={`seenly-pack-card seenly-pack-${pack.theme}`}>
                              {/* Unique Celestial Sacred Geometry Motif per Pack */}
                              <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                                <div className="seenly-pack-card-ambient-glow" />
                                {pack.theme === 'tier1' && (
                                  <svg className="absolute -right-6 -top-6 w-28 h-28 text-[#C5A059] opacity-[0.15]" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                                    <circle cx="50" cy="50" r="44" strokeWidth="0.75" strokeDasharray="2 2" />
                                    <circle cx="50" cy="50" r="32" strokeWidth="0.75" />
                                    <line x1="6" y1="50" x2="94" y2="50" strokeWidth="0.5" strokeDasharray="2 2" />
                                    <line x1="50" y1="6" x2="50" y2="94" strokeWidth="0.5" strokeDasharray="2 2" />
                                  </svg>
                                )}
                                {pack.theme === 'tier2' && (
                                  <svg className="absolute -left-6 -bottom-6 w-28 h-28 text-[#C5A059] opacity-[0.16]" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                                    <circle cx="50" cy="50" r="44" strokeWidth="0.75" strokeDasharray="3 3" />
                                    <polygon points="50,12 60,38 88,50 60,62 50,88 40,62 12,50 40,38" strokeWidth="0.6" fill="rgba(197, 160, 89, 0.04)" />
                                  </svg>
                                )}
                                {pack.theme === 'tier3' && (
                                  <svg className="absolute -right-6 -bottom-6 w-32 h-32 text-[#C5A059] opacity-[0.18]" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                                    <circle cx="50" cy="50" r="45" strokeWidth="0.75" strokeDasharray="2 2" />
                                    <polygon points="50,16 84,50 50,84 16,50" strokeWidth="0.6" strokeDasharray="2 2" />
                                    <circle cx="50" cy="50" r="26" strokeWidth="0.75" />
                                  </svg>
                                )}
                              </div>

                              {/* 1. Kapasite Miktarı (Top Capsule Pill Badge) */}
                              <div className="relative z-10 seenly-pack-quota-pill">
                                <span className="seenly-pack-quota-num">+{pack.amount}</span>
                                <span className="seenly-pack-quota-txt">{langCode === 'tr' ? 'Yanıt' : 'Quota'}</span>
                              </div>

                              {/* 2. Başlık (Pack Title) */}
                              <h5 className="relative z-10 seenly-pack-title">
                                {pack.label}
                              </h5>

                              {/* 3. Fiyat (Price) */}
                              <div className="relative z-10 seenly-pack-price">
                                <span className="seenly-pack-price-symbol">$</span>
                                <span>{pack.price.replace('$', '')}</span>
                              </div>

                              {/* 4. Buton (Action Button) */}
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleBuyPack(pack.amount)}
                                className="relative z-10 seenly-pack-btn"
                              >
                                <span>{actionLoading ? (langCode === 'tr' ? 'Ekleniyor...' : 'Adding...') : (langCode === 'tr' ? 'Paketi Ekle' : 'Add Pack')}</span>
                                <ArrowRight size={14} strokeWidth={2} className="seenly-pack-btn-arrow" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATION SETTINGS (Doğrudan Ana Karta Gömülü, Kutusuz Profesyonel Yapı) */}
          {activeTab === 'notifications' && (
            <div className="seenly-settings-content seenly-settings-fade-in">
              <div className="seenly-plan-pro seenly-plan-clean">

                <section className="seenly-profile-card seenly-form-card">
                  {/* 1. Master Email Switch Row */}
                  <div className="seenly-notif-row-embedded">
                    <div className="seenly-notif-row-left">
                      <div className="seenly-card-head-icon seenly-notif-master-icon">
                        <Mail size={20} strokeWidth={2} />
                      </div>
                      <div className="seenly-notif-subcard-copy">
                        <h3 className="seenly-notif-master-title">
                          {langCode === 'tr' ? 'E-posta Bildirimleri' : 'Email Notifications'}
                        </h3>
                        <p className="seenly-notif-row-desc">
                          {langCode === 'tr'
                            ? 'Hesabınız ve gelen analizlerle ilgili tüm e-posta bildirim akışını yönetin.'
                            : 'Manage all email notifications related to your account and incoming analyses.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifPrefs.masterEmail}
                      onClick={() => handleToggleNotif('masterEmail')}
                      className={`seenly-toggle-switch ${notifPrefs.masterEmail ? 'is-active' : ''}`}
                      title={notifPrefs.masterEmail ? (langCode === 'tr' ? 'Bildirimleri Kapat' : 'Turn Off') : (langCode === 'tr' ? 'Bildirimleri Aç' : 'Turn On')}
                    >
                      <span className="seenly-toggle-thumb" />
                    </button>
                  </div>

                  <div className="seenly-profile-divider" style={{ margin: '0.25rem 0' }} />

                  {/* 2. Subcategory Switches (Direct Rows, No Inner Boxes) */}
                  <div className="seenly-notif-embedded-list">
                    {/* Item 1: Yeni Değerlendirmeler */}
                    <div className={`seenly-notif-row-embedded ${!notifPrefs.masterEmail ? 'is-disabled' : ''}`}>
                      <div className="seenly-notif-row-left">
                        <div className="seenly-notif-sub-icon">
                          <Zap size={16} strokeWidth={2.2} />
                        </div>
                        <div className="seenly-notif-subcard-copy">
                          <h4 className="seenly-notif-row-title">
                            {langCode === 'tr' ? 'Yeni Değerlendirmeler' : 'New Evaluations'}
                          </h4>
                          <p className="seenly-notif-row-desc">
                            {langCode === 'tr'
                              ? 'Biri profilinizi değerlendirdiğinde veya yeni bir yansıma geldiğinde anlık e-posta alın.'
                              : 'Get an instant email when someone evaluates your profile or adds a reflection.'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        disabled={!notifPrefs.masterEmail}
                        aria-checked={notifPrefs.masterEmail && notifPrefs.newReflections}
                        onClick={() => handleToggleNotif('newReflections')}
                        className={`seenly-toggle-switch ${notifPrefs.masterEmail && notifPrefs.newReflections ? 'is-active' : ''}`}
                      >
                        <span className="seenly-toggle-thumb" />
                      </button>
                    </div>

                    <div className="seenly-profile-divider" style={{ margin: '0.25rem 0' }} />

                    {/* Item 2: Rapor & Kilit Bildirimleri */}
                    <div className={`seenly-notif-row-embedded ${!notifPrefs.masterEmail ? 'is-disabled' : ''}`}>
                      <div className="seenly-notif-row-left">
                        <div className="seenly-notif-sub-icon">
                          <Award size={16} strokeWidth={2.2} />
                        </div>
                        <div className="seenly-notif-subcard-copy">
                          <h4 className="seenly-notif-row-title">
                            {langCode === 'tr' ? 'Rapor & Kilit Bildirimleri' : 'Report & Milestone Alerts'}
                          </h4>
                          <p className="seenly-notif-row-desc">
                            {langCode === 'tr'
                              ? 'Analizleriniz açıldığında veya yeni bir karakter metriği oturduğunda haber verin.'
                              : 'Get notified when your reports unlock or new trait insights are finalized.'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        disabled={!notifPrefs.masterEmail}
                        aria-checked={notifPrefs.masterEmail && notifPrefs.milestoneReports}
                        onClick={() => handleToggleNotif('milestoneReports')}
                        className={`seenly-toggle-switch ${notifPrefs.masterEmail && notifPrefs.milestoneReports ? 'is-active' : ''}`}
                      >
                        <span className="seenly-toggle-thumb" />
                      </button>
                    </div>

                    <div className="seenly-profile-divider" style={{ margin: '0.25rem 0' }} />

                    {/* Item 3: Haftalık Özet */}
                    <div className={`seenly-notif-row-embedded ${!notifPrefs.masterEmail ? 'is-disabled' : ''}`}>
                      <div className="seenly-notif-row-left">
                        <div className="seenly-notif-sub-icon">
                          <TrendingUp size={16} strokeWidth={2.2} />
                        </div>
                        <div className="seenly-notif-subcard-copy">
                          <h4 className="seenly-notif-row-title">
                            {langCode === 'tr' ? 'Haftalık Özet' : 'Weekly Digest'}
                          </h4>
                          <p className="seenly-notif-row-desc">
                            {langCode === 'tr'
                              ? 'Profil etkileşimleri, ziyaret trendleri ve özet analiz grafikleri.'
                              : 'Weekly summary of profile interactions, visit trends, and chart digests.'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        disabled={!notifPrefs.masterEmail}
                        aria-checked={notifPrefs.masterEmail && notifPrefs.weeklyDigest}
                        onClick={() => handleToggleNotif('weeklyDigest')}
                        className={`seenly-toggle-switch ${notifPrefs.masterEmail && notifPrefs.weeklyDigest ? 'is-active' : ''}`}
                      >
                        <span className="seenly-toggle-thumb" />
                      </button>
                    </div>

                    <div className="seenly-profile-divider" style={{ margin: '0.25rem 0' }} />

                    {/* Item 4: Pazarlama & Güncellemeler */}
                    <div className={`seenly-notif-row-embedded ${!notifPrefs.masterEmail ? 'is-disabled' : ''}`}>
                      <div className="seenly-notif-row-left">
                        <div className="seenly-notif-sub-icon">
                          <Megaphone size={16} strokeWidth={2.2} />
                        </div>
                        <div className="seenly-notif-subcard-copy">
                          <h4 className="seenly-notif-row-title">
                            {langCode === 'tr' ? 'Pazarlama & Güncellemeler' : 'Product Updates & News'}
                          </h4>
                          <p className="seenly-notif-row-desc">
                            {langCode === 'tr'
                              ? 'Yeni özellikler, kampanyalar ve Seenly Plus avantajlarıyla ilgili duyurular.'
                              : 'Product updates, new features, and Seenly Plus privileges.'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        disabled={!notifPrefs.masterEmail}
                        aria-checked={notifPrefs.masterEmail && notifPrefs.marketingUpdates}
                        onClick={() => handleToggleNotif('marketingUpdates')}
                        className={`seenly-toggle-switch ${notifPrefs.masterEmail && notifPrefs.marketingUpdates ? 'is-active' : ''}`}
                      >
                        <span className="seenly-toggle-thumb" />
                      </button>
                    </div>
                  </div>
                </section>

              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .seenly-settings-page-container {
          min-height: calc(100vh - 72px);
          background-color: var(--background);
          padding: 2rem 1.25rem 4.5rem;
        }

        .seenly-settings-inner {
          max-width: 740px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .seenly-settings-top-nav {
          display: flex;
          align-items: center;
        }

        .seenly-settings-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(253, 251, 244, 0.85);
          border: 1px solid rgba(197, 160, 89, 0.28);
          border-radius: 9999px;
          padding: 0.45rem 0.95rem;
          color: var(--color-deep-ink);
          font-family: var(--font-sans);
          font-size: 0.82rem;
          font-weight: 650;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(8px);
        }

        .seenly-settings-back-btn:hover {
          background: #FDFBF4;
          border-color: rgba(197, 160, 89, 0.55);
          color: var(--color-deep-ink);
          transform: translateX(-2px);
        }

        .seenly-settings-header {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .seenly-settings-title {
          margin: 0;
          font-family: var(--font-heading);
          font-size: clamp(1.65rem, 3.5vw, 2.15rem);
          font-weight: 700;
          color: var(--color-deep-ink);
          letter-spacing: -0.025em;
        }

        .seenly-settings-subtitle {
          margin: 0;
          font-family: var(--font-sans);
          font-size: 0.88rem;
          color: var(--color-text-muted);
          line-height: 1.4;
        }

        .seenly-settings-tabs-wrapper {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 0.25rem;
        }

        .seenly-settings-tabs-capsule {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.3rem;
          background: rgba(253, 251, 244, 0.9);
          border: 1px solid rgba(197, 160, 89, 0.28);
          border-radius: 14px;
          box-shadow: 0 4px 14px rgba(80, 60, 40, 0.03);
          backdrop-filter: blur(12px);
        }

        .seenly-settings-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.5rem 1.1rem;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: var(--color-text-muted);
          font-family: var(--font-sans);
          font-size: 0.84rem;
          font-weight: 650;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .seenly-settings-tab-btn:hover {
          color: var(--color-deep-ink);
          background: rgba(197, 160, 89, 0.1);
        }

        .seenly-settings-tab-btn.active {
          background: var(--color-deep-ink);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(11, 27, 44, 0.12);
        }

        .seenly-settings-fade-in {
          animation: seenlyFadeIn 0.3s ease-out;
        }

        @keyframes seenlyFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Unified Card Base - Warm Eye-Friendly Palette */
        .seenly-profile-card {
          background: #FDFBF4;
          border: 1px solid rgba(197, 160, 89, 0.28);
          border-radius: 20px;
          padding: 1.6rem;
          box-shadow: 0 4px 18px rgba(80, 60, 40, 0.03);
        }

        /* Avatar Picker Row */
        .seenly-avatar-row {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        .seenly-profile-avatar-preview-wrap {
          position: relative;
          width: 80px;
          height: 80px;
          flex: 0 0 80px;
          transition: transform 0.2s ease;
        }

        .seenly-profile-avatar-preview-wrap:hover {
          transform: scale(1.03);
        }

        .seenly-profile-avatar-preview-img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid rgba(197, 160, 89, 0.5);
          box-shadow: 0 6px 20px rgba(80, 60, 40, 0.12);
          background-color: #FDFBF4;
        }

        .seenly-profile-avatar-badge {
          position: absolute;
          bottom: 0px;
          right: 0px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--color-deep-ink);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #FDFBF4;
          box-shadow: 0 2px 6px rgba(0,0,0,0.18);
        }

        .seenly-avatar-details {
          flex: 1;
          min-width: 180px;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .seenly-avatar-details-title-row {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          flex-wrap: wrap;
        }

        .seenly-avatar-details-title {
          margin: 0;
          font-family: var(--font-heading);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--color-deep-ink);
        }

        .seenly-avatar-details-subtext {
          margin: 0;
          font-family: var(--font-sans);
          font-size: 0.83rem;
          color: var(--color-text-muted);
          line-height: 1.4;
        }

        .seenly-profile-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.15rem 0.5rem;
          background: rgba(197, 160, 89, 0.15);
          color: #8C6D37;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .seenly-profile-status-badge.is-saving {
          background: rgba(11, 27, 44, 0.08);
          color: var(--color-deep-ink);
        }

        .seenly-avatar-toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.55rem 1.05rem;
          border: 1px solid rgba(197, 160, 89, 0.28);
          border-radius: 10px;
          background: #FDFBF4;
          color: var(--color-deep-ink);
          font-family: var(--font-sans);
          font-size: 0.82rem;
          font-weight: 650;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .seenly-avatar-toggle-btn:hover,
        .seenly-avatar-toggle-btn.active {
          background: var(--color-deep-ink);
          color: #ffffff;
          border-color: var(--color-deep-ink);
        }

        .seenly-profile-divider {
          width: 100%;
          height: 1px;
          background: rgba(197, 160, 89, 0.18);
          margin: 1.35rem 0 1.25rem;
        }

        /* Avatar Drawer */
        .seenly-avatar-drawer {
          margin-top: 1.25rem;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(197, 160, 89, 0.18);
        }

        .seenly-avatar-filter-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.75rem;
        }

        .seenly-avatar-filter-btn {
          padding: 0.35rem 0.8rem;
          border-radius: 9999px;
          border: 1px solid rgba(197, 160, 89, 0.24);
          background: transparent;
          color: var(--color-text-muted);
          font-family: var(--font-sans);
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .seenly-avatar-filter-btn:hover {
          color: var(--color-deep-ink);
          border-color: rgba(197, 160, 89, 0.45);
          background: rgba(197, 160, 89, 0.08);
        }

        .seenly-avatar-filter-btn.active {
          background: var(--color-deep-ink);
          color: #ffffff;
          border-color: var(--color-deep-ink);
        }

        .seenly-avatar-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
          gap: 0.9rem;
          padding-top: 0.15rem;
        }

        .seenly-avatar-item-btn {
          padding: 0;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          outline: none;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .seenly-avatar-item-btn:hover {
          transform: translateY(-2px) scale(1.05);
        }

        .seenly-avatar-item-btn.is-selected {
          transform: scale(1.04);
        }

        .seenly-avatar-circle-frame {
          position: relative;
          width: 82px;
          height: 82px;
          border-radius: 50%;
          padding: 2px;
          border: 2px solid rgba(197, 160, 89, 0.25);
          box-sizing: border-box;
          transition: all 0.2s ease;
          background: #FDFBF4;
        }

        .seenly-avatar-item-btn:hover .seenly-avatar-circle-frame {
          border-color: rgba(197, 160, 89, 0.6);
          box-shadow: 0 4px 16px rgba(197, 160, 89, 0.2);
        }

        .seenly-avatar-item-btn.is-selected .seenly-avatar-circle-frame {
          border-color: #8C6D37;
          border-width: 3px;
          box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.2), 0 6px 20px rgba(80, 60, 40, 0.15);
        }

        .seenly-avatar-thumb {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }

        .seenly-avatar-check-indicator {
          position: absolute;
          bottom: 0px;
          right: 0px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #8C6D37;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #FDFBF4;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }

        /* 2. Unified Form Card */
        .seenly-form-card {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .seenly-card-head {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .seenly-card-head-icon {
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: rgba(197, 160, 89, 0.12);
          color: #8C6D37;
          border: 1px solid rgba(197, 160, 89, 0.22);
        }

        .seenly-card-head-title {
          margin: 0;
          font-family: var(--font-heading);
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--color-deep-ink);
        }

        .seenly-card-head-desc {
          margin: 0.15rem 0 0;
          font-family: var(--font-sans);
          font-size: 0.8rem;
          color: var(--color-text-muted);
        }

        .seenly-profile-item-form {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .seenly-form-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .seenly-form-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .seenly-form-label {
          font-family: var(--font-sans);
          font-size: 0.82rem;
          font-weight: 650;
          color: var(--color-deep-ink);
        }

        .seenly-field-counter {
          font-family: var(--font-sans);
          font-size: 0.75rem;
          color: var(--color-text-muted);
          font-weight: 600;
        }

        .seenly-inline-input-group {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .seenly-form-input {
          flex: 1;
          width: 100%;
          box-sizing: border-box;
          padding: 0.72rem 1rem;
          border: 1px solid rgba(197, 160, 89, 0.28);
          border-radius: 12px;
          background: #FDFBF4;
          color: var(--color-deep-ink);
          font-family: var(--font-sans);
          font-size: 0.88rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .seenly-form-input:focus {
          border-color: #c5a059;
          box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.15);
          background: #ffffff;
        }

        .seenly-inline-save-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          padding: 0.72rem 1.15rem;
          border: none;
          border-radius: 12px;
          background: var(--color-deep-ink);
          color: #ffffff;
          font-family: var(--font-sans);
          font-size: 0.82rem;
          font-weight: 650;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .seenly-inline-save-btn:hover:not(:disabled) {
          background: #14283f;
          box-shadow: 0 4px 12px rgba(11, 27, 44, 0.15);
          transform: translateY(-1px);
        }

        .seenly-inline-save-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .seenly-inline-save-btn.is-saved {
          background: #059669;
          color: #ffffff;
        }

        .seenly-profile-feedback {
          padding: 0.55rem 0.85rem;
          border-radius: 10px;
          font-family: var(--font-sans);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .seenly-profile-feedback.is-error {
          background: rgba(239, 68, 68, 0.08);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .seenly-profile-feedback.is-success {
          background: rgba(16, 185, 129, 0.08);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        /* 3. Professional Account Danger Card */
        .seenly-account-danger-card {
          border: 1px solid rgba(197, 160, 89, 0.28);
          background: #FDFBF4;
          border-radius: 20px;
          box-shadow: 0 4px 18px rgba(80, 60, 40, 0.03);
        }

        .seenly-danger-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .seenly-danger-info {
          flex: 1;
          min-width: 240px;
        }

        .seenly-danger-title {
          margin: 0;
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-deep-ink);
        }

        .seenly-danger-subtext {
          margin: 0.15rem 0 0;
          font-family: var(--font-sans);
          font-size: 0.78rem;
          color: var(--color-text-muted);
          line-height: 1.35;
        }

        .seenly-danger-outline-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.55rem 0.95rem;
          border: 1px solid rgba(220, 38, 38, 0.25);
          border-radius: 10px;
          background: transparent;
          color: #dc2626;
          font-family: var(--font-sans);
          font-size: 0.78rem;
          font-weight: 650;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .seenly-danger-outline-btn:hover {
          background: #dc2626;
          color: #ffffff;
          border-color: #dc2626;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.18);
        }

        /* Notifications & Switch Styles */
        .seenly-notif-master-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        .seenly-notif-master-info {
          display: flex;
          align-items: flex-start;
          gap: 0.9rem;
          flex: 1;
          min-width: 240px;
        }

        .seenly-notif-master-icon {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
        }

        .seenly-notif-master-text {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .seenly-notif-switch-wrap {
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .seenly-toggle-switch {
          position: relative;
          width: 48px;
          height: 28px;
          border-radius: 9999px;
          background: #E2D9C8;
          border: 1px solid rgba(197, 160, 89, 0.35);
          cursor: pointer;
          transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
          padding: 0;
          outline: none;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
        }

        .seenly-toggle-switch.is-active {
          background: #1A3E72;
          border-color: #1A3E72;
          box-shadow: 0 2px 10px rgba(26, 62, 114, 0.25);
        }

        .seenly-toggle-switch:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          background: #E5E0D8;
          border-color: rgba(11, 27, 44, 0.08);
          box-shadow: none;
        }

        .seenly-toggle-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
          transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .seenly-toggle-switch.is-active .seenly-toggle-thumb {
          transform: translateX(20px);
        }

        .seenly-notif-embedded-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .seenly-notif-row-embedded {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.25rem;
          padding: 0.85rem 0;
          transition: all 0.2s ease;
        }

        .seenly-notif-row-embedded.is-disabled {
          opacity: 0.4;
          pointer-events: none;
        }

        .seenly-notif-row-left {
          display: flex;
          align-items: flex-start;
          gap: 0.95rem;
          flex: 1;
          min-width: 200px;
        }

        .seenly-notif-master-icon {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          margin-top: 2px;
        }

        .seenly-notif-sub-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: rgba(197, 160, 89, 0.12);
          color: #8C6D37;
          border: 1px solid rgba(197, 160, 89, 0.22);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .seenly-notif-subcard-copy {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .seenly-notif-master-title {
          margin: 0;
          font-family: var(--font-heading);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-deep-ink);
        }

        .seenly-notif-row-title {
          margin: 0;
          font-family: var(--font-heading);
          font-size: 0.98rem;
          font-weight: 700;
          color: var(--color-deep-ink);
        }

        .seenly-notif-row-desc {
          margin: 0;
          font-family: var(--font-sans);
          font-size: 0.82rem;
          color: var(--color-text-muted);
          line-height: 1.4;
        }

        /* Quota Tracker Card (Celestial Luxury Theme) */
        .seenly-quota-tracker-card {
          position: relative;
          background: radial-gradient(ellipse at 88% 0%, rgba(228, 196, 136, 0.22) 0%, rgba(253, 251, 246, 0) 55%), radial-gradient(ellipse at 12% 100%, rgba(26, 62, 114, 0.05) 0%, rgba(253, 251, 246, 0) 50%), linear-gradient(180deg, #FCF9F3 0%, #F8F3E7 100%);
          border: 1px solid rgba(197, 160, 89, 0.35);
          border-radius: 24px;
          padding: 22px 26px;
          box-shadow: 0 8px 28px rgba(80, 60, 40, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.85);
          margin-bottom: 0.85rem;
        }

        .seenly-quota-head-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #FAF5EA;
          border: 1px solid rgba(197, 160, 89, 0.4);
          color: #8C6D37;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(197, 160, 89, 0.12);
        }

        .seenly-quota-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1A3E72;
          margin: 0;
          line-height: 1.2;
        }

        .seenly-quota-subtext {
          font-family: var(--font-sans);
          font-size: 12.5px;
          color: #554030;
          margin: 4px 0 0;
          line-height: 1.4;
        }

        .seenly-quota-metric-badge {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          flex-shrink: 0;
        }

        .seenly-quota-metric-val {
          display: flex;
          align-items: baseline;
          gap: 3px;
          font-family: var(--font-sans), 'DM Sans', sans-serif;
          line-height: 1;
        }

        .seenly-quota-metric-current {
          font-size: 1.55rem;
          font-weight: 850;
          color: #1A3E72;
          letter-spacing: -0.02em;
        }

        .seenly-quota-metric-sep {
          font-size: 1.15rem;
          font-weight: 500;
          color: #C5A059;
          margin: 0 1px;
        }

        .seenly-quota-metric-max {
          font-size: 1.25rem;
          font-weight: 700;
          color: #7A5C28;
        }

        .seenly-quota-metric-label {
          font-family: var(--font-sans);
          font-size: 10.5px;
          font-weight: 750;
          color: #8C6D37;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 4px;
        }

        .seenly-quota-track-wrap {
          margin: 16px 0 0;
        }

        .seenly-quota-track-bar {
          width: 100%;
          height: 9px;
          border-radius: 9999px;
          background: rgba(197, 160, 89, 0.18);
          box-shadow: inset 0 1px 3px rgba(80, 60, 40, 0.1);
          overflow: hidden;
          position: relative;
        }

        .seenly-quota-track-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .seenly-quota-track-fill.is-normal {
          background: linear-gradient(90deg, #C5A059 0%, #1A3E72 100%);
          box-shadow: 0 1px 4px rgba(26, 62, 114, 0.3);
        }

        .seenly-quota-track-fill.is-warning {
          background: linear-gradient(90deg, #C5A059 0%, #D97706 100%);
          box-shadow: 0 1px 4px rgba(217, 119, 6, 0.35);
        }

        .seenly-quota-track-fill.is-full {
          background: linear-gradient(90deg, #D97706 0%, #DC2626 100%);
          box-shadow: 0 1px 6px rgba(220, 38, 38, 0.4);
        }

        .seenly-quota-status-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          margin-top: 12px;
          border-radius: 12px;
          font-family: var(--font-sans);
          font-size: 12px;
          line-height: 1.35;
          transition: all 0.2s ease;
        }

        .seenly-quota-status-banner.status-warning {
          background: rgba(254, 243, 199, 0.85);
          border: 1px solid rgba(245, 158, 11, 0.4);
          color: #92400E;
        }

        .seenly-quota-status-banner.status-warning .seenly-quota-status-icon {
          color: #D97706;
        }

        .seenly-quota-status-banner.status-full {
          background: rgba(254, 226, 226, 0.85);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #991B1B;
        }

        .seenly-quota-status-banner.status-full .seenly-quota-status-icon {
          color: #DC2626;
        }

        .seenly-quota-status-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .seenly-quota-status-text {
          font-weight: 550;
        }

        /* Seenly Plus Active Card (When User is Premium) */
        .seenly-plus-active-card {
          position: relative;
          background: radial-gradient(ellipse at 92% 0%, rgba(228, 196, 136, 0.25) 0%, rgba(253, 251, 246, 0) 55%), radial-gradient(ellipse at 8% 100%, rgba(26, 62, 114, 0.05) 0%, rgba(253, 251, 246, 0) 50%), linear-gradient(180deg, #FCF9F3 0%, #F8F3E7 100%);
          border: 1px solid rgba(197, 160, 89, 0.38);
          border-radius: 28px;
          padding: 28px 32px;
          box-shadow: 0 10px 32px rgba(80, 60, 40, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.85);
          margin-top: 0.25rem;
        }

        .seenly-plus-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.28);
          color: #059669;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 750;
          letter-spacing: 0.04em;
        }

        .seenly-plus-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
        }

        .seenly-plus-active-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.65rem;
          font-weight: 700;
          color: #1A3E72;
          margin: 0;
          line-height: 1.25;
        }

        .seenly-plus-active-desc {
          font-family: var(--font-sans);
          font-size: 13px;
          color: #554030;
          line-height: 1.45;
          margin: 4px 0 0;
        }

        .seenly-plus-perks-toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          border-radius: 9999px;
          background: #FAF5EA;
          border: 1px solid rgba(197, 160, 89, 0.45);
          color: #1A3E72;
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(197, 160, 89, 0.12);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .seenly-plus-perks-toggle-btn:hover {
          background: #F4EEDF;
          border-color: rgba(197, 160, 89, 0.65);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(197, 160, 89, 0.2);
        }

        .seenly-plus-perks-chevron {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          color: #8C6D37;
        }

        .seenly-plus-perks-chevron.is-open {
          transform: rotate(180deg);
        }

        /* Seenly Plus Exact Showcase Card (Matching User Mockup) */
        .seenly-plus-showcase-card {
          position: relative;
          background: radial-gradient(ellipse at 92% 0%, rgba(228, 196, 136, 0.22) 0%, rgba(253, 251, 246, 0) 55%), radial-gradient(ellipse at 8% 100%, rgba(26, 62, 114, 0.05) 0%, rgba(253, 251, 246, 0) 50%), linear-gradient(180deg, #FCF9F3 0%, #F8F3E7 100%);
          border: 1px solid rgba(197, 160, 89, 0.35);
          border-radius: 28px;
          padding: 28px 32px;
          box-shadow: 0 10px 32px rgba(80, 60, 40, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.85);
          margin-top: 0.5rem;
        }

        .seenly-plus-badge-left {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: 9999px;
          background: #1A3E72;
          color: #FFFFFF;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .seenly-plus-badge-right {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #8C6D37;
          text-transform: uppercase;
        }

        .seenly-plus-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 2.5rem;
          font-weight: 650;
          color: #1A3E72;
          margin: 0;
          line-height: 1.15;
        }

        .seenly-plus-subtext {
          font-family: var(--font-sans);
          font-size: 13.5px;
          color: #554030;
          line-height: 1.55;
          margin: 10px 0 0;
          max-width: 440px;
        }

        /* Hanging Price Curtain Banner (Top-Right Suspended) */
        .seenly-plus-price-curtain {
          position: absolute;
          top: 0;
          right: 28px;
          z-index: 15;
          background: linear-gradient(180deg, #FFFFFF 0%, #FAF6EE 100%);
          border: 1px solid rgba(197, 160, 89, 0.38);
          border-top: none;
          border-bottom-left-radius: 16px;
          border-bottom-right-radius: 16px;
          padding: 12px 22px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-shadow: 0 8px 24px rgba(80, 60, 40, 0.09);
        }

        .seenly-plus-price-curtain-pin {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 32px;
          height: 3.5px;
          background: linear-gradient(90deg, #B89047, #E4C882, #B89047);
          border-bottom-left-radius: 3px;
          border-bottom-right-radius: 3px;
          box-shadow: 0 1px 3px rgba(184, 144, 71, 0.4);
        }

        .seenly-plus-price-val {
          font-family: var(--font-sans), 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 2.15rem;
          font-weight: 750;
          color: #1A3E72;
          line-height: 1;
          margin: 3px 0 0;
          display: flex;
          align-items: baseline;
          justify-content: center;
          letter-spacing: -0.02em;
        }

        .seenly-plus-price-symbol {
          font-family: var(--font-sans), 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          margin-right: 2px;
          color: #1A3E72;
          vertical-align: baseline;
          line-height: 1;
        }

        .seenly-plus-price-label {
          font-family: var(--font-sans);
          font-size: 9.5px;
          font-weight: 750;
          letter-spacing: 0.14em;
          color: #8C6D37;
          text-transform: uppercase;
          margin-top: 6px;
          display: block;
        }

        .seenly-plus-feature-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .seenly-plus-feature-icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #1A3E72;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(26, 62, 114, 0.18);
          margin-top: 1px;
        }

        .seenly-plus-feature-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 14.5px;
          font-weight: 650;
          color: #1A3E72;
          margin: 0;
          line-height: 1.25;
        }

        .seenly-plus-feature-desc {
          font-family: var(--font-sans);
          font-size: 12px;
          color: #64748B;
          margin: 2px 0 0;
          line-height: 1.35;
        }

        .seenly-plus-cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 22px;
          border-radius: 9999px;
          background: linear-gradient(180deg, #1C3C68 0%, #102544 100%);
          color: #FAF6EE;
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.02em;
          border: 1px solid rgba(255, 255, 255, 0.14);
          cursor: pointer;
          transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 14px rgba(16, 37, 68, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.22);
        }

        .seenly-plus-cta-arrow {
          color: #FAF6EE;
          transition: transform 0.2s ease;
        }

        .seenly-plus-cta-btn:hover {
          background: linear-gradient(180deg, #24497C 0%, #152E52 100%);
          box-shadow: 0 6px 20px rgba(16, 37, 68, 0.38), inset 0 1px 1px rgba(255, 255, 255, 0.3);
          transform: translateY(-1.5px);
          color: #FFFFFF;
        }

        .seenly-plus-cta-btn:hover .seenly-plus-cta-arrow {
          transform: translateX(3px);
          color: #FFFFFF;
        }

        .seenly-plus-cta-btn:active {
          transform: translateY(0.5px);
          box-shadow: 0 2px 8px rgba(16, 37, 68, 0.25);
        }

        .seenly-plus-cta-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Refined Capacity Pack Styles (Exact Mockup Match with Celestial Motifs) */
        .seenly-packs-painterly-container {
          position: relative;
          background: radial-gradient(ellipse at 12% 0%, rgba(228, 196, 136, 0.18) 0%, rgba(253, 251, 246, 0) 50%), radial-gradient(ellipse at 88% 100%, rgba(212, 163, 76, 0.15) 0%, rgba(253, 251, 246, 0) 55%), linear-gradient(180deg, #FBF8F0 0%, #F6F0E2 100%);
          border: 1px solid rgba(197, 160, 89, 0.32);
          border-radius: 28px;
          padding: 26px 28px;
          box-shadow: 0 8px 28px rgba(80, 60, 40, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.85);
          margin-top: 0.75rem;
        }

        .seenly-pack-card {
          position: relative;
          border-radius: 22px;
          padding: 22px 14px 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        .seenly-pack-tier1 {
          background: radial-gradient(circle at 85% 0%, rgba(228, 196, 136, 0.24) 0%, transparent 60%), linear-gradient(180deg, #FDFCFA 0%, #F8F3E8 100%);
          border: 1px solid rgba(197, 160, 89, 0.36);
          box-shadow: 0 6px 20px rgba(80, 60, 40, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .seenly-pack-tier2 {
          background: radial-gradient(circle at 50% 0%, rgba(218, 175, 95, 0.28) 0%, transparent 65%), linear-gradient(180deg, #FDFBFA 0%, #F6EEDD 100%);
          border: 1px solid rgba(197, 160, 89, 0.44);
          box-shadow: 0 8px 24px rgba(197, 160, 89, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .seenly-pack-tier3 {
          background: radial-gradient(circle at 15% 0%, rgba(212, 163, 76, 0.3) 0%, transparent 65%), linear-gradient(180deg, #FDFCFA 0%, #F5EADB 100%);
          border: 1px solid rgba(197, 160, 89, 0.48);
          box-shadow: 0 8px 26px rgba(197, 160, 89, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .seenly-pack-tier1:hover,
        .seenly-pack-tier2:hover,
        .seenly-pack-tier3:hover {
          transform: translateY(-2.5px);
          border-color: rgba(197, 160, 89, 0.65);
          box-shadow: 0 12px 30px rgba(197, 160, 89, 0.2);
        }

        .seenly-pack-quota-pill {
          display: inline-flex;
          align-items: baseline;
          justify-content: center;
          gap: 4px;
          background: #F4EEDF;
          border: 1px solid rgba(197, 160, 89, 0.45);
          border-radius: 9999px;
          padding: 4px 12px;
          margin-bottom: 8px;
          box-shadow: 0 1px 4px rgba(197, 160, 89, 0.1);
        }

        .seenly-pack-quota-num {
          font-family: var(--font-sans), 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 13.5px;
          font-weight: 800;
          color: #1A3E72;
          line-height: 1;
        }

        .seenly-pack-quota-txt {
          font-family: var(--font-sans), 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #7A5C28;
          line-height: 1;
        }

        .seenly-pack-title {
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 700;
          color: #554030;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin: 0 0 12px;
          opacity: 0.85;
        }

        .seenly-pack-price {
          font-family: var(--font-sans), 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 1.85rem;
          font-weight: 750;
          color: #1A3E72;
          line-height: 1;
          margin: 0 0 14px;
          display: flex;
          align-items: baseline;
          justify-content: center;
          letter-spacing: -0.02em;
        }

        .seenly-pack-price-symbol {
          font-family: var(--font-sans), 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 1.45rem;
          font-weight: 700;
          margin-right: 1px;
          color: #1A3E72;
          vertical-align: baseline;
          line-height: 1;
        }

        /* Authentic Tactile Midnight Button matching Mockup */
        .seenly-pack-btn {
          width: 100%;
          padding: 10px 18px;
          border-radius: 9999px;
          background: linear-gradient(180deg, #1C3C68 0%, #102544 100%);
          color: #FAF6EE;
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.02em;
          border: 1px solid rgba(255, 255, 255, 0.14);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 14px rgba(16, 37, 68, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.22);
        }

        .seenly-pack-btn-arrow {
          color: #FAF6EE;
          transition: transform 0.2s ease;
        }

        .seenly-pack-btn:hover {
          background: linear-gradient(180deg, #24497C 0%, #152E52 100%);
          box-shadow: 0 6px 20px rgba(16, 37, 68, 0.38), inset 0 1px 1px rgba(255, 255, 255, 0.3);
          transform: translateY(-1.5px);
          color: #FFFFFF;
        }

        .seenly-pack-btn:hover .seenly-pack-btn-arrow {
          transform: translateX(3px);
          color: #FFFFFF;
        }

        .seenly-pack-btn:active {
          transform: translateY(0.5px);
          box-shadow: 0 2px 8px rgba(16, 37, 68, 0.25);
        }

        .seenly-pack-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }



        @media (max-width: 640px) {
          /* Quota Tracker Mobile */
          .seenly-quota-tracker-card {
            padding: 16px 14px 16px !important;
            border-radius: 20px !important;
            margin-bottom: 0.65rem !important;
          }

          .seenly-quota-head-icon {
            width: 32px !important;
            height: 32px !important;
          }

          .seenly-quota-title {
            font-size: 1.1rem !important;
          }

          .seenly-quota-subtext {
            font-size: 11px !important;
            line-height: 1.35 !important;
          }

          .seenly-quota-metric-current {
            font-size: 1.35rem !important;
          }

          .seenly-quota-metric-max {
            font-size: 1.1rem !important;
          }

          .seenly-quota-metric-label {
            font-size: 9.5px !important;
          }

          .seenly-quota-track-wrap {
            margin: 12px 0 0 !important;
          }

          .seenly-quota-status-banner {
            padding: 6px 10px !important;
            font-size: 10.5px !important;
            margin-top: 8px !important;
            border-radius: 10px !important;
          }

          /* Seenly Plus Active Card Mobile */
          .seenly-plus-active-card {
            padding: 20px 14px 18px !important;
            border-radius: 20px !important;
          }

          .seenly-plus-active-title {
            font-size: 1.35rem !important;
          }

          .seenly-plus-active-desc {
            font-size: 11.5px !important;
            line-height: 1.4 !important;
          }

          .seenly-plus-perks-toggle-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 8px 14px !important;
            font-size: 11.5px !important;
            margin-top: 6px !important;
          }

          /* Seenly Plus Showcase Card Mobile */
          .seenly-plus-showcase-card {
            padding: 20px 14px 18px !important;
            border-radius: 20px !important;
          }

          .seenly-plus-price-curtain {
            right: 14px !important;
            padding: 8px 12px 10px !important;
            border-bottom-left-radius: 12px !important;
            border-bottom-right-radius: 12px !important;
            box-shadow: 0 4px 14px rgba(80, 60, 40, 0.08) !important;
          }

          .seenly-plus-price-curtain-pin {
            width: 20px !important;
            height: 2.5px !important;
          }

          .seenly-plus-price-val {
            font-size: 1.6rem !important;
            margin: 2px 0 0 !important;
          }

          .seenly-plus-price-symbol {
            font-size: 1.3rem !important;
          }

          .seenly-plus-price-label {
            font-size: 8px !important;
            letter-spacing: 0.1em !important;
            margin-top: 3px !important;
          }

          .seenly-plus-badge-left {
            font-size: 9.5px !important;
            padding: 4px 10px !important;
          }

          .seenly-plus-title {
            font-size: 1.65rem !important;
          }

          .seenly-plus-subtext {
            font-size: 11.5px !important;
            line-height: 1.45 !important;
            margin-top: 6px !important;
            padding-right: 70px !important;
          }

          .seenly-plus-feature-item {
            gap: 10px !important;
          }

          .seenly-plus-feature-icon-badge {
            width: 32px !important;
            height: 32px !important;
          }

          .seenly-plus-feature-title {
            font-size: 13px !important;
          }

          .seenly-plus-feature-desc {
            font-size: 11px !important;
            line-height: 1.3 !important;
          }

          .seenly-plus-cta-btn {
            width: 100% !important;
            padding: 12px 18px !important;
            font-size: 13px !important;
            justify-content: center !important;
          }

          /* Extra Capacity Packs Mobile (Compact 3-Column Grid) */
          .seenly-packs-painterly-container {
            padding: 16px 10px 18px !important;
            border-radius: 20px !important;
            margin-top: 0.65rem !important;
          }

          .seenly-packs-grid {
            gap: 6px !important;
          }

          .seenly-pack-card {
            padding: 14px 5px 12px !important;
            border-radius: 16px !important;
            box-shadow: 0 4px 12px rgba(80, 60, 40, 0.04) !important;
          }

          .seenly-pack-quota-pill {
            padding: 2.5px 6px !important;
            gap: 2px !important;
            margin-bottom: 4px !important;
            border-radius: 9999px !important;
          }

          .seenly-pack-quota-num {
            font-size: 10.5px !important;
            font-weight: 800 !important;
          }

          .seenly-pack-quota-txt {
            font-size: 8.5px !important;
            font-weight: 600 !important;
          }

          .seenly-pack-title {
            font-size: 8.5px !important;
            letter-spacing: 0.05em !important;
            margin: 0 0 8px !important;
          }

          .seenly-pack-price {
            font-size: 1.25rem !important;
            margin: 0 0 8px !important;
          }

          .seenly-pack-price-symbol {
            font-size: 0.95rem !important;
            margin-right: 1px !important;
          }

          .seenly-pack-btn {
            width: 100% !important;
            padding: 7px 2px !important;
            font-size: 10px !important;
            font-weight: 600 !important;
            justify-content: center !important;
            white-space: nowrap !important;
            min-height: 32px !important;
          }

          .seenly-pack-btn-arrow {
            display: none !important;
          }
        }

        @media (max-width: 380px) {
          .seenly-packs-painterly-container {
            padding: 14px 6px 16px !important;
          }

          .seenly-packs-grid {
            gap: 4px !important;
          }

          .seenly-pack-card {
            padding: 10px 2px 8px !important;
            border-radius: 12px !important;
          }

          .seenly-pack-quota-pill {
            padding: 2px 4px !important;
            margin-bottom: 3px !important;
          }

          .seenly-pack-quota-num {
            font-size: 9.5px !important;
          }

          .seenly-pack-quota-txt {
            font-size: 7.5px !important;
          }

          .seenly-pack-title {
            font-size: 7.5px !important;
            letter-spacing: 0.02em !important;
            margin-bottom: 6px !important;
          }

          .seenly-pack-price {
            font-size: 1.1rem !important;
            margin-bottom: 6px !important;
          }

          .seenly-pack-price-symbol {
            font-size: 0.85rem !important;
          }

          .seenly-pack-btn {
            font-size: 8.5px !important;
            padding: 6px 1px !important;
            min-height: 28px !important;
          }
        }

        @media (max-width: 640px) {

          .seenly-avatar-summary-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .seenly-avatar-toggle-btn {
            width: 100%;
            justify-content: center;
          }
          .seenly-avatar-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 0.65rem;
          }
          .seenly-avatar-circle-frame {
            width: 76px;
            height: 76px;
          }
          .seenly-danger-content {
            flex-direction: column;
            align-items: stretch;
          }
          .seenly-danger-outline-btn {
            width: 100%;
            justify-content: center;
          }
          .seenly-settings-tabs-capsule {
            width: 100%;
          }
          .seenly-settings-tab-btn {
            flex: 1;
            justify-content: center;
            padding: 0.5rem 0.4rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </AppShell>
  );
}
