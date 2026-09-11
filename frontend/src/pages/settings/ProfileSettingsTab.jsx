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
    <div className="seenly-settings-content seenly-settings-fade-in">
      <div className="seenly-plan-pro seenly-plan-clean">

        {/* Single Unified Profile Card */}
        <section className="seenly-profile-card seenly-form-card">

          {/* 1. Avatar Picker Header Row */}
          <div className="seenly-avatar-row">
            <div
              className="seenly-profile-avatar-preview-wrap cursor-pointer"
              onClick={() => setShowAvatarPicker(prev => !prev)}
              title={t('settings.profile.changeAvatar')}
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
                  {t('settings.profile.avatarTitle')}
                </h3>
                {avatarSaveStatus === 'saved' && (
                  <span className="seenly-profile-status-badge">
                    <Check size={12} strokeWidth={2.5} />
                    {t('settings.profile.avatarSaved')}
                  </span>
                )}
                {avatarSaveStatus === 'saving' && (
                  <span className="seenly-profile-status-badge is-saving">
                    {t('settings.profile.avatarSaving')}
                  </span>
                )}
              </div>
              <p className="seenly-avatar-details-subtext">
                {t('settings.profile.avatarSubtitle')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAvatarPicker(prev => !prev)}
              className={`seenly-avatar-toggle-btn ${showAvatarPicker ? 'active' : ''}`}
            >
              <span>{showAvatarPicker ? t('settings.profile.closeAvatar') : t('settings.profile.changeAvatar')}</span>
              {showAvatarPicker ? <ChevronUp size={16} strokeWidth={2.2} /> : <ChevronDown size={16} strokeWidth={2.2} />}
            </button>
          </div>

          {/* Expandable Avatar Picker Drawer */}
          {showAvatarPicker && (
            <div className="seenly-avatar-drawer seenly-settings-fade-in">
              <div className="seenly-avatar-filter-row">
                <button
                  type="button"
                  onClick={() => setAvatarFilter('kadin')}
                  className={`seenly-avatar-filter-btn ${avatarFilter === 'kadin' ? 'active' : ''}`}
                >
                  {t('settings.profile.womenCategory')}
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarFilter('erkek')}
                  className={`seenly-avatar-filter-btn ${avatarFilter === 'erkek' ? 'active' : ''}`}
                >
                  {t('settings.profile.menCategory')}
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
                  {t('settings.profile.displayNameTitle')}
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
                  placeholder={t('settings.profile.displayNamePlaceholder')}
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
              <div className="seenly-profile-feedback is-error">
                {nameErrorMessage}
              </div>
            )}
            {nameSaveStatus === 'saved' && !nameErrorMessage && (
              <div className="seenly-profile-feedback is-success">
                {t('settings.profile.nameSuccess')}
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
                  {t('settings.profile.emailTitle')}
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
                  placeholder={t('settings.profile.emailPlaceholder')}
                  className="seenly-form-input"
                />
                <button
                  type="submit"
                  disabled={emailSaveStatus === 'saving' || !emailInput.trim() || emailInput.trim().toLowerCase() === (userEmail || '').toLowerCase()}
                  className={`seenly-inline-save-btn ${emailSaveStatus === 'saved' ? 'is-saved' : ''}`}
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
              <div className="seenly-profile-feedback is-error">
                {emailErrorMessage}
              </div>
            )}
            {emailSaveStatus === 'saved' && !emailErrorMessage && (
              <div className="seenly-profile-feedback is-success">
                {t('settings.profile.emailSuccess')}
              </div>
            )}
          </form>

          {/* Subtle Divider */}
          <div className="seenly-profile-divider" />

          {/* 4. Delete Account Row */}
          <div className="seenly-danger-content">
            <div className="seenly-danger-info">
              <h4 className="seenly-danger-title">
                {t('settings.deleteAccount.deleteAccountBtn')}
              </h4>
              <p className="seenly-danger-subtext">
                {t('settings.deleteAccount.confirmDialog')}
              </p>
            </div>

            <button
              type="button"
              onClick={handleDeleteAccount}
              className="seenly-danger-outline-btn"
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
