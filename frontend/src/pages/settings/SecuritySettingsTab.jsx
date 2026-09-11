import React, { memo } from 'react';
import {
  Mail,
  Zap,
  Award,
  TrendingUp,
  Megaphone
} from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

const SecuritySettingsTab = memo(function SecuritySettingsTab({
  notifPrefs,
  handleToggleNotif
}) {
  const { t } = useLocale();

  return (
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
                  {t('settings.security.emailNotifsTitle')}
                </h3>
                <p className="seenly-notif-row-desc">
                  {t('settings.security.emailNotifsDesc')}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={notifPrefs.masterEmail}
              onClick={() => handleToggleNotif('masterEmail')}
              className={`seenly-toggle-switch ${notifPrefs.masterEmail ? 'is-active' : ''}`}
              title={notifPrefs.masterEmail ? t('settings.security.turnOff') : t('settings.security.turnOn')}
            >
              <span className="seenly-toggle-thumb" />
            </button>
          </div>

          <div className="seenly-profile-divider" style={{ margin: '0.25rem 0' }} />

          {/* 2. Subcategory Switches */}
          <div className="seenly-notif-embedded-list">
            {/* Item 1: Yeni Değerlendirmeler */}
            <div className={`seenly-notif-row-embedded ${!notifPrefs.masterEmail ? 'is-disabled' : ''}`}>
              <div className="seenly-notif-row-left">
                <div className="seenly-notif-sub-icon">
                  <Zap size={16} strokeWidth={2.2} />
                </div>
                <div className="seenly-notif-subcard-copy">
                  <h4 className="seenly-notif-row-title">
                    {t('settings.security.newEvaluationsTitle')}
                  </h4>
                  <p className="seenly-notif-row-desc">
                    {t('settings.security.newEvaluationsDesc')}
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
                    {t('settings.security.reportMilestonesTitle')}
                  </h4>
                  <p className="seenly-notif-row-desc">
                    {t('settings.security.reportMilestonesDesc')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                disabled={!notifPrefs.masterEmail}
                aria-checked={notifPrefs.masterEmail && notifPrefs.milestones}
                onClick={() => handleToggleNotif('milestones')}
                className={`seenly-toggle-switch ${notifPrefs.masterEmail && notifPrefs.milestones ? 'is-active' : ''}`}
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
                    {t('settings.security.weeklyDigestTitle')}
                  </h4>
                  <p className="seenly-notif-row-desc">
                    {t('settings.security.weeklyDigestDesc')}
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
                  <Megaphone size={16} strokeWidth={2} />
                </div>
                <div className="seenly-notif-subcard-copy">
                  <h4 className="seenly-notif-row-title">
                    {t('settings.security.productUpdatesTitle')}
                  </h4>
                  <p className="seenly-notif-row-desc">
                    {t('settings.security.productUpdatesDesc')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                disabled={!notifPrefs.masterEmail}
                aria-checked={notifPrefs.masterEmail && notifPrefs.productUpdates}
                onClick={() => handleToggleNotif('productUpdates')}
                className={`seenly-toggle-switch ${notifPrefs.masterEmail && notifPrefs.productUpdates ? 'is-active' : ''}`}
              >
                <span className="seenly-toggle-thumb" />
              </button>
            </div>
          </div>

        </section>
      </div>
    </div>
  );
});

export default SecuritySettingsTab;
