import React, { memo } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Trash2
} from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

const ProfileSettingsTab = memo(function ProfileSettingsTab({
  displayName,
  userEmail,
  currentAvatarSrc,
  selectedAvatar,
  showAvatarPicker,
  setShowAvatarPicker,
  avatarFilter,
  setAvatarFilter,
  avatarSaveStatus,
  filteredAvatars,
  handleSelectAvatar,
  profileNameInput,
  setProfileNameInput,
  isNameChangeLocked,
  nameChangeDaysRemaining,
  nameSaveStatus,
  setNameSaveStatus,
  nameErrorMessage,
  setNameErrorMessage,
  handleSaveDisplayName,
  emailInput,
  setEmailInput,
  emailSaveStatus,
  setEmailSaveStatus,
  emailErrorMessage,
  setEmailErrorMessage,
  handleSaveEmail,
  handleDeleteAccount
}) {
  const { t } = useLocale();

  return (
    <div className="tensignal-settings-content tensignal-settings-fade-in">
      <div className="tensignal-plan-pro tensignal-plan-clean">

        {/* Single Unified Profile Card */}
        <section className="tensignal-profile-card tensignal-form-card">

          {/* 1. Avatar Picker Header Row */}
          <div className="tensignal-avatar-row">
            <div
              className="tensignal-profile-avatar-preview-wrap cursor-pointer"
              onClick={() => setShowAvatarPicker(prev => !prev)}
              title={t('settings.profile.changeAvatar')}
            >
              {currentAvatarSrc ? (
                <img
                  src={currentAvatarSrc}
                  alt={displayName}
                  className="tensignal-profile-avatar-preview-img"
                />
              ) : (
                <div className="tensignal-profile-identity-avatar">
                  {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>

            <div className="tensignal-avatar-details">
              <div className="tensignal-avatar-details-title-row">
                <h3 className="tensignal-avatar-details-title">
                  {t('settings.profile.avatarTitle')}
                </h3>
                {avatarSaveStatus === 'saved' && (
                  <span className="tensignal-profile-status-badge">
                    <Check size={12} strokeWidth={2.5} />
                    {t('settings.profile.avatarSaved')}
                  </span>
                )}
                {avatarSaveStatus === 'saving' && (
                  <span className="tensignal-profile-status-badge is-saving">
                    {t('settings.profile.avatarSaving')}
                  </span>
                )}
              </div>
              <p className="tensignal-avatar-details-subtext">
                {t('settings.profile.avatarSubtitle')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAvatarPicker(prev => !prev)}
              className={`tensignal-avatar-toggle-btn ${showAvatarPicker ? 'active' : ''}`}
            >
              <span>{showAvatarPicker ? t('settings.profile.closeAvatar') : t('settings.profile.changeAvatar')}</span>
              {showAvatarPicker ? <ChevronUp size={16} strokeWidth={2.2} /> : <ChevronDown size={16} strokeWidth={2.2} />}
            </button>
          </div>

          {/* Expandable Avatar Picker Drawer */}
          {showAvatarPicker && (
            <div className="tensignal-avatar-drawer tensignal-settings-fade-in">
              <div className="tensignal-avatar-filter-row">
                <button
                  type="button"
                  onClick={() => setAvatarFilter('kadin')}
                  className={`tensignal-avatar-filter-btn ${avatarFilter === 'kadin' ? 'active' : ''}`}
                >
                  {t('settings.profile.womenCategory')}
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarFilter('erkek')}
                  className={`tensignal-avatar-filter-btn ${avatarFilter === 'erkek' ? 'active' : ''}`}
                >
                  {t('settings.profile.menCategory')}
                </button>
              </div>

              <div className="tensignal-avatar-grid">
                {filteredAvatars.map((av) => {
                  const isSelected = selectedAvatar === av.id;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => handleSelectAvatar(av.id)}
                      className={`tensignal-avatar-item-btn ${isSelected ? 'is-selected' : ''}`}
                      aria-label={av.label}
                      title={av.label}
                    >
                      <div className="tensignal-avatar-circle-frame">
                        <img
                          src={av.src}
                          alt={av.label}
                          className="tensignal-avatar-thumb"
                        />
                        {isSelected && (
                          <span className="tensignal-avatar-check-indicator">
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
          <div className="tensignal-profile-divider" />

          {/* 2. Display Name Row with Dedicated Update Button */}
          <form onSubmit={handleSaveDisplayName} className="tensignal-profile-item-form">
            <div className="tensignal-form-field">
              <div className="tensignal-form-label-row">
                <label htmlFor="tensignal-display-name-input" className="tensignal-form-label">
                  {t('settings.profile.displayNameTitle')}
                </label>
                <span className="tensignal-field-counter">
                  {profileNameInput.length}/15
                </span>
              </div>
              <div className="tensignal-inline-input-group">
                <input
                  id="tensignal-display-name-input"
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
                  placeholder={t('settings.profile.displayNamePlaceholder')}
                  className="tensignal-form-input"
                  style={isNameChangeLocked ? {
                    opacity: 0.75,
                    cursor: 'not-allowed',
                    backgroundColor: 'rgba(11, 27, 44, 0.03)'
                  } : undefined}
                />
                <button
                  type="submit"
                  disabled={isNameChangeLocked || nameSaveStatus === 'saving' || !profileNameInput.trim() || profileNameInput.trim() === displayName}
                  className={`tensignal-inline-save-btn ${nameSaveStatus === 'saved' ? 'is-saved' : ''}`}
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
                      <span>{t('settings.profile.lockedDays', { days: nameChangeDaysRemaining })}</span>
                    </span>
                  ) : nameSaveStatus === 'saving' ? (
                    <span>{t('common.processing')}</span>
                  ) : nameSaveStatus === 'saved' ? (
                    <>
                      <Check size={14} strokeWidth={2.5} />
                      <span>{t('settings.profile.updated')}</span>
                    </>
                  ) : (
                    <span>{t('settings.profile.updateName')}</span>
                  )}
                </button>
              </div>
            </div>
            {nameErrorMessage && (
              <div className="tensignal-profile-feedback is-error">
                {nameErrorMessage}
              </div>
            )}
            {nameSaveStatus === 'saved' && !nameErrorMessage && (
              <div className="tensignal-profile-feedback is-success">
                {t('settings.profile.nameSuccess')}
              </div>
            )}
          </form>

          {/* Subtle Divider */}
          <div className="tensignal-profile-divider" />

          {/* 3. Email Address Row with Dedicated Update Button */}
          <form onSubmit={handleSaveEmail} className="tensignal-profile-item-form">
            <div className="tensignal-form-field">
              <div className="tensignal-form-label-row">
                <label htmlFor="tensignal-email-input" className="tensignal-form-label">
                  {t('settings.profile.emailTitle')}
                </label>
              </div>
              <div className="tensignal-inline-input-group">
                <input
                  id="tensignal-email-input"
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (emailErrorMessage) setEmailErrorMessage('');
                    if (emailSaveStatus !== 'idle') setEmailSaveStatus('idle');
                  }}
                  placeholder={t('settings.profile.emailPlaceholder')}
                  className="tensignal-form-input"
                />
                <button
                  type="submit"
                  disabled={emailSaveStatus === 'saving' || !emailInput.trim() || emailInput.trim().toLowerCase() === (userEmail || '').toLowerCase()}
                  className={`tensignal-inline-save-btn ${emailSaveStatus === 'saved' ? 'is-saved' : ''}`}
                >
                  {emailSaveStatus === 'saving' ? (
                    <span>{t('common.processing')}</span>
                  ) : emailSaveStatus === 'saved' ? (
                    <>
                      <Check size={14} strokeWidth={2.5} />
                      <span>{t('settings.profile.updated')}</span>
                    </>
                  ) : (
                    <span>{t('settings.profile.updateEmail')}</span>
                  )}
                </button>
              </div>
            </div>
            {emailErrorMessage && (
              <div className="tensignal-profile-feedback is-error">
                {emailErrorMessage}
              </div>
            )}
            {emailSaveStatus === 'saved' && !emailErrorMessage && (
              <div className="tensignal-profile-feedback is-success">
                {t('settings.profile.emailSuccess')}
              </div>
            )}
          </form>

          {/* Subtle Divider */}
          <div className="tensignal-profile-divider" />

          {/* 4. Delete Account Row */}
          <div className="tensignal-danger-content">
            <div className="tensignal-danger-info">
              <h4 className="tensignal-danger-title">
                {t('settings.deleteAccount.deleteAccountBtn')}
              </h4>
              <p className="tensignal-danger-subtext">
                {t('settings.deleteAccount.confirmDialog')}
              </p>
            </div>

            <button
              type="button"
              onClick={handleDeleteAccount}
              className="tensignal-danger-outline-btn"
            >
              <Trash2 size={14} strokeWidth={2} />
              <span>{t('settings.deleteAccount.deleteAccountBtn')}</span>
            </button>
          </div>

        </section>
      </div>
    </div>
  );
});

export default ProfileSettingsTab;
