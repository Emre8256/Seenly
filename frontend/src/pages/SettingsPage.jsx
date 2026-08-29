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
  CheckCircle2
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
  const isPremium = snapshot?.isPremium || snapshot?.premium || false;
  const responseCount = snapshot?.responseCount || 0;
  const maxResponseLimit = snapshot?.maxResponseLimit ?? 100;

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
        await updateDisplayName(token, capitalized);
        localStorage.setItem('seenly_display_name', capitalized);
        sessionStorage.setItem('seenly_displayName', capitalized);
        setSnapshot(prev => ({ ...prev, displayName: capitalized }));
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
    if (!token) return;
    try {
      setActionLoading(true);
      await subscribePlus(token);
      await loadData();
    } catch (err) {
      alert(langCode === 'tr' ? 'Yükseltme işlemi gerçekleştirilemedi.' : 'Failed to upgrade.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuyPack = async (amount) => {
    const token = localStorage.getItem('seenly_owner_token');
    if (!token) return;
    try {
      setActionLoading(true);
      await buyCapacityPack(token, amount);
      await loadData();
    } catch (err) {
      alert(langCode === 'tr' ? 'Paket eklenemedi.' : 'Failed to add pack.');
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
    { amount: 10, label: langCode === 'tr' ? 'Küçük Paket' : 'Small Pack', price: '₺49' },
    { amount: 25, label: langCode === 'tr' ? 'Popüler Paket' : 'Popular Pack', price: '₺99' },
    { amount: 50, label: langCode === 'tr' ? 'Geniş Paket' : 'Large Pack', price: '₺169' }
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
                          onChange={(e) => {
                            setProfileNameInput(e.target.value);
                            if (nameErrorMessage) setNameErrorMessage('');
                            if (nameSaveStatus !== 'idle') setNameSaveStatus('idle');
                          }}
                          maxLength={15}
                          placeholder={langCode === 'tr' ? 'İsminizi girin...' : 'Enter your name...'}
                          className="seenly-form-input"
                        />
                        <button
                          type="submit"
                          disabled={nameSaveStatus === 'saving' || !profileNameInput.trim() || profileNameInput.trim() === displayName}
                          className={`seenly-inline-save-btn ${nameSaveStatus === 'saved' ? 'is-saved' : ''}`}
                        >
                          {nameSaveStatus === 'saving' ? (
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

          {/* TAB 2: PACKAGES & MEMBERSHIP (Membership, Capacity & Plans) */}
          {activeTab === 'plans' && (
            <div className="seenly-settings-content seenly-settings-fade-in">
              <div className="seenly-plan-pro seenly-plan-clean">
                {/* 1. Üyelik & Kapasite Durumu Kartı */}
                <section className="seenly-plan-pro-current" aria-label={langCode === 'tr' ? 'Kapasite durumu' : 'Capacity status'}>
                  <div className="seenly-plan-pro-current-identity">
                    <div className="seenly-plan-pro-current-icon" aria-hidden="true">
                      <Gauge size={18} strokeWidth={1.8} />
                    </div>
                    <div className="seenly-plan-pro-current-copy">
                      <span>{langCode === 'tr' ? 'KATILIMCI KAPASİTESİ' : 'RESPONDENT CAPACITY'}</span>
                      <strong>{isPremium ? (langCode === 'tr' ? 'Sınırsız Kapasite' : 'Unlimited Capacity') : `${responseCount} / ${maxResponseLimit} ${langCode === 'tr' ? 'Katılımcı' : 'Responders'}`}</strong>
                    </div>
                  </div>

                  <div className="seenly-plan-pro-usage">
                    <div
                      className={`seenly-plan-pro-usage-track ${isPremium ? 'is-unlimited' : ''}`}
                      role="progressbar"
                      aria-label={langCode === 'tr' ? 'Katılımcı kapasitesi' : 'Respondent capacity'}
                      aria-valuemin="0"
                      aria-valuemax={isPremium ? undefined : maxResponseLimit}
                      aria-valuenow={isPremium ? undefined : Math.min(responseCount, maxResponseLimit)}
                    >
                      <span style={{ width: isPremium ? '100%' : `${Math.min(100, Math.round((responseCount / Math.max(maxResponseLimit, 1)) * 100))}%` }} />
                    </div>
                  </div>

                  <span className="seenly-plan-pro-status">
                    <span aria-hidden="true" />
                    {isPremium ? 'Seenly Plus' : (langCode === 'tr' ? 'Close Circle' : 'Close Circle')}
                  </span>
                </section>

                {/* 2. If Premium: Show Unlocked Benefits Card */}
                {isPremium ? (
                  <section className="seenly-profile-plus-active-card" style={{ marginTop: '0.5rem' }}>
                    <div className="seenly-profile-plus-active-header">
                      <div className="seenly-profile-plus-active-icon">
                        <Sparkles size={20} strokeWidth={2} />
                      </div>
                      <div>
                        <h4 className="seenly-profile-plus-active-title">
                          {langCode === 'tr' ? 'Seenly Plus Üyeliğiniz Aktif' : 'Seenly Plus is Active'}
                        </h4>
                        <p className="seenly-profile-plus-active-desc">
                          {langCode === 'tr'
                            ? 'Tüm kilitler açık ve sınırsız katılımcı kapasitesine sahipsiniz.'
                            : 'All features are unlocked with unlimited respondent capacity.'}
                        </p>
                      </div>
                    </div>

                    <ul className="seenly-plan-pro-features seenly-profile-plus-feature-grid">
                      {plusPlanFeatures.map((feature) => (
                        <li key={feature}>
                          <span className="seenly-plan-pro-check" aria-hidden="true">
                            <Check size={10} strokeWidth={3} />
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : (
                  /* If Free: Show Upgrade Plans & Extra Packs */
                  <>
                    <section className="seenly-plan-pro-plans" aria-labelledby="seenly-plan-pro-plans-title" style={{ marginTop: '0.5rem' }}>
                      <div className="seenly-plan-pro-section-head">
                        <div>
                          <span className="seenly-plan-pro-eyebrow">{langCode === 'tr' ? 'ÜYELİK SEÇENEKLERİ' : 'MEMBERSHIP OPTIONS'}</span>
                          <h4 id="seenly-plan-pro-plans-title">{langCode === 'tr' ? 'Sana uygun alanı seç' : 'Choose your space'}</h4>
                        </div>
                        <p>{langCode === 'tr' ? 'Daha fazla analiz ve tüm kilitli özellikler için Plus’a geçin.' : 'Upgrade to Plus for in-depth analyses and unlocked features.'}</p>
                      </div>

                      <div className="seenly-plan-pro-grid">
                        <article className="seenly-plan-pro-card seenly-plan-pro-card-base is-current">
                          <div className="seenly-plan-pro-card-topline">
                            <span className="seenly-plan-pro-kicker">
                              <CircleUserRound size={13} strokeWidth={1.8} aria-hidden="true" />
                              {langCode === 'tr' ? 'BAŞLANGIÇ' : 'STARTER'}
                            </span>
                            <span className="seenly-plan-pro-badge">
                              {langCode === 'tr' ? 'MEVCUT PLAN' : 'CURRENT PLAN'}
                            </span>
                          </div>

                          <h4 className="seenly-plan-pro-title">Close Circle</h4>
                          <div className="seenly-plan-pro-price">
                            <strong>{langCode === 'tr' ? 'Ücretsiz' : 'Free'}</strong>
                            <small>{langCode === 'tr' ? 'Başlangıç için' : 'To get started'}</small>
                          </div>

                          <div className="seenly-plan-pro-rule" aria-hidden="true" />

                          <ul className="seenly-plan-pro-features">
                            {freePlanFeatures.map((feature) => (
                              <li key={feature}>
                                <span className="seenly-plan-pro-check" aria-hidden="true">
                                  <Check size={10} strokeWidth={3} />
                                </span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>

                          <button type="button" disabled className="seenly-plan-pro-button seenly-plan-pro-button-secondary">
                            <span>{langCode === 'tr' ? 'PLAN KULLANILIYOR' : 'PLAN IN USE'}</span>
                            <span className="arrow" aria-hidden="true"><Check size={14} strokeWidth={2.4} /></span>
                          </button>
                        </article>

                        <article className="seenly-plan-pro-card seenly-plan-pro-card-plus is-featured">
                          <div className="seenly-plan-pro-card-topline">
                            <span className="seenly-plan-pro-kicker">
                              <Sparkles size={13} strokeWidth={1.8} aria-hidden="true" />
                              {langCode === 'tr' ? 'FULL SEENLY' : 'FULL SEENLY'}
                            </span>
                            <span className="seenly-plan-pro-badge">
                              {langCode === 'tr' ? 'ÖNERİLEN' : 'RECOMMENDED'}
                            </span>
                          </div>

                          <h4 className="seenly-plan-pro-title">Seenly Plus</h4>
                          <div className="seenly-plan-pro-price">
                            <strong>{t('ui', 'pricing_plan_premium_price')}</strong>
                            <small>{langCode === 'tr' ? 'Tek seferlik yükseltme' : 'One-time upgrade'}</small>
                          </div>

                          <div className="seenly-plan-pro-rule" aria-hidden="true" />

                          <ul className="seenly-plan-pro-features">
                            {plusPlanFeatures.map((feature) => (
                              <li key={feature}>
                                <span className="seenly-plan-pro-check" aria-hidden="true">
                                  <Check size={10} strokeWidth={3} />
                                </span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>

                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={handleUpgradeToPlus}
                            className="seenly-plan-pro-button seenly-plan-pro-button-primary"
                          >
                            <span>{actionLoading ? (langCode === 'tr' ? 'İşleniyor...' : 'Processing...') : (langCode === 'tr' ? 'Plus’a geç' : 'Upgrade to Plus')}</span>
                            <span className="arrow" aria-hidden="true">
                              <ArrowUpRight size={14} strokeWidth={2.2} />
                            </span>
                          </button>
                        </article>
                      </div>
                    </section>

                    <section className="seenly-plan-pro-packs" aria-labelledby="seenly-plan-pro-packs-title">
                      <div className="seenly-plan-pro-packs-head">
                        <div>
                          <span className="seenly-plan-pro-eyebrow">{langCode === 'tr' ? 'ESNEK KAPASİTE' : 'FLEXIBLE CAPACITY'}</span>
                          <h4 id="seenly-plan-pro-packs-title">{langCode === 'tr' ? 'Ek katılımcı paketleri' : 'Extra respondent packs'}</h4>
                        </div>
                        <p>
                          {langCode === 'tr'
                            ? 'Plus’a geçmeden yalnızca yanıt limitini arttırmak istersen tek seferlik kapasite ekleyebilirsin.'
                            : 'Add one-off capacity if you want more responses without upgrading to Plus.'}
                        </p>
                      </div>

                      <div className="seenly-plan-pro-pack-grid">
                        {capacityPackOptions.map((pack, idx) => (
                          <article
                            key={pack.amount}
                            className={`seenly-plan-pro-pack ${idx === 1 ? 'is-featured' : ''}`}
                          >
                            <div className="seenly-plan-pro-pack-topline">
                              <div className="seenly-plan-pro-pack-icon" aria-hidden="true">
                                <UsersRound size={17} strokeWidth={1.8} />
                              </div>
                              <span className="seenly-plan-pro-pack-label">{pack.label}</span>
                            </div>

                            <div className="seenly-plan-pro-pack-capacity">
                              <strong>+{pack.amount}</strong>
                              <h5>{langCode === 'tr' ? 'katılımcı' : 'respondents'}</h5>
                            </div>
                            <div className="seenly-plan-pro-pack-price">{pack.price}</div>

                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleBuyPack(pack.amount)}
                              className="seenly-plan-pro-pack-button"
                            >
                              <span>{actionLoading ? (langCode === 'tr' ? 'Ekleniyor...' : 'Adding...') : (langCode === 'tr' ? 'PAKETİ EKLE' : 'ADD PACK')}</span>
                              <span className="arrow" aria-hidden="true">
                                <ArrowUpRight size={13} strokeWidth={2.2} />
                              </span>
                            </button>
                          </article>
                        ))}
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
