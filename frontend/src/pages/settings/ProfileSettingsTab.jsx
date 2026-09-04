import React, { memo } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Trash2
} from 'lucide-react';

const ProfileSettingsTab = memo(function ProfileSettingsTab({
  langCode,
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

          {/* Expandable Avatar Picker Drawer */}
          {showAvatarPicker && (
            <div className="seenly-avatar-drawer seenly-settings-fade-in">
              <div className="seenly-avatar-filter-row">
                <button
                  type="button"
                  onClick={() => setAvatarFilter('kadin')}
                  className={`seenly-avatar-filter-btn ${avatarFilter === 'kadin' ? 'active' : ''}`}
                >
                  {langCode === 'tr' ? 'Kız (6)' : 'Women (6)'}
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

          {/* 4. Delete Account Row */}
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
  );
});

export default ProfileSettingsTab;
