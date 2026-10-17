import React, { memo } from 'react';
import {
  Mail,
  Zap,
  Bell,
  Sparkles,
  Gauge
} from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

const SecuritySettingsTab = memo(function SecuritySettingsTab({
  notifPrefs,
  handleToggleNotif
}) {
  const { t } = useLocale();

  return (
    <div className="tensignal-settings-content tensignal-settings-fade-in">
      <div className="tensignal-plan-pro tensignal-plan-clean">

        <section className="tensignal-profile-card tensignal-form-card">
          {/* 1. Master Email Switch Row */}
          <div className="tensignal-notif-row-embedded">
            <div className="tensignal-notif-row-left">
              <div className="tensignal-card-head-icon tensignal-notif-master-icon">
                <Mail size={20} strokeWidth={2} />
              </div>
              <div className="tensignal-notif-subcard-copy">
                <h3 className="tensignal-notif-master-title">
                  {t('settings.security.emailNotifsTitle')}
                </h3>
                <p className="tensignal-notif-row-desc">
                  {t('settings.security.emailNotifsDesc')}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              id="notif-switch-master"
              aria-checked={notifPrefs.masterEmail}
              onClick={() => handleToggleNotif('masterEmail')}
              className={`tensignal-toggle-switch ${notifPrefs.masterEmail ? 'is-active' : ''}`}
              title={notifPrefs.masterEmail ? t('settings.security.turnOff') : t('settings.security.turnOn')}
            >
              <span className="tensignal-toggle-thumb" />
            </button>
          </div>

          <div className="tensignal-profile-divider" style={{ margin: '0.25rem 0' }} />

          {/* 2. Subcategory Switches */}
          <div className="tensignal-notif-embedded-list">
            {/* Item 1: Yeni Değerlendirmeler (NEW_EVALUATION) */}
            <div className={`tensignal-notif-row-embedded ${!notifPrefs.masterEmail ? 'is-disabled' : ''}`}>
              <div className="tensignal-notif-row-left">
                <div className="tensignal-notif-sub-icon">
                  <Zap size={16} strokeWidth={2.2} />
                </div>
                <div className="tensignal-notif-subcard-copy">
                  <h4 className="tensignal-notif-row-title">
                    {t('settings.security.newEvaluationsTitle')}
                  </h4>
                  <p className="tensignal-notif-row-desc">
                    {t('settings.security.newEvaluationsDesc')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                id="notif-switch-evaluations"
                disabled={!notifPrefs.masterEmail}
                aria-checked={notifPrefs.evaluations}
                onClick={() => handleToggleNotif('evaluations')}
                className={`tensignal-toggle-switch ${notifPrefs.evaluations ? 'is-active' : ''}`}
              >
                <span className="tensignal-toggle-thumb" />
              </button>
            </div>

            <div className="tensignal-profile-divider" style={{ margin: '0.25rem 0' }} />

            {/* Item 2: Kilometre Taşları ve Hatırlatmalar (REPORT_UNLOCKED, FIRST_SHARE_REMINDER, INACTIVITY_REMINDER) */}
            <div className={`tensignal-notif-row-embedded ${!notifPrefs.masterEmail ? 'is-disabled' : ''}`}>
              <div className="tensignal-notif-row-left">
                <div className="tensignal-notif-sub-icon">
                  <Bell size={16} strokeWidth={2.2} />
                </div>
                <div className="tensignal-notif-subcard-copy">
                  <h4 className="tensignal-notif-row-title">
                    {t('settings.security.remindersTitle')}
                  </h4>
                  <p className="tensignal-notif-row-desc">
                    {t('settings.security.remindersDesc')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                id="notif-switch-reminders"
                disabled={!notifPrefs.masterEmail}
                aria-checked={notifPrefs.reminders}
                onClick={() => handleToggleNotif('reminders')}
                className={`tensignal-toggle-switch ${notifPrefs.reminders ? 'is-active' : ''}`}
              >
                <span className="tensignal-toggle-thumb" />
              </button>
            </div>

            <div className="tensignal-profile-divider" style={{ margin: '0.25rem 0' }} />

            {/* Item 3: Kimlik ve Kart Güncellemeleri (SOCIAL_CARD_CHANGED) */}
            <div className={`tensignal-notif-row-embedded ${!notifPrefs.masterEmail ? 'is-disabled' : ''}`}>
              <div className="tensignal-notif-row-left">
                <div className="tensignal-notif-sub-icon">
                  <Sparkles size={16} strokeWidth={2.2} />
                </div>
                <div className="tensignal-notif-subcard-copy">
                  <h4 className="tensignal-notif-row-title">
                    {t('settings.security.cardChangesTitle')}
                  </h4>
                  <p className="tensignal-notif-row-desc">
                    {t('settings.security.cardChangesDesc')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                id="notif-switch-card-changes"
                disabled={!notifPrefs.masterEmail}
                aria-checked={notifPrefs.cardChanges}
                onClick={() => handleToggleNotif('cardChanges')}
                className={`tensignal-toggle-switch ${notifPrefs.cardChanges ? 'is-active' : ''}`}
              >
                <span className="tensignal-toggle-thumb" />
              </button>
            </div>

            <div className="tensignal-profile-divider" style={{ margin: '0.25rem 0' }} />

            {/* Item 4: Kapasite ve Kota Uyarıları (CAPACITY_80_PERCENT, CAPACITY_FULL) */}
            <div className={`tensignal-notif-row-embedded ${!notifPrefs.masterEmail ? 'is-disabled' : ''}`}>
              <div className="tensignal-notif-row-left">
                <div className="tensignal-notif-sub-icon">
                  <Gauge size={16} strokeWidth={2.2} />
                </div>
                <div className="tensignal-notif-subcard-copy">
                  <h4 className="tensignal-notif-row-title">
                    {t('settings.security.capacityAlertsTitle')}
                  </h4>
                  <p className="tensignal-notif-row-desc">
                    {t('settings.security.capacityAlertsDesc')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                id="notif-switch-capacity-alerts"
                disabled={!notifPrefs.masterEmail}
                aria-checked={notifPrefs.capacityAlerts}
                onClick={() => handleToggleNotif('capacityAlerts')}
                className={`tensignal-toggle-switch ${notifPrefs.capacityAlerts ? 'is-active' : ''}`}
              >
                <span className="tensignal-toggle-thumb" />
              </button>
            </div>
          </div>

        </section>
      </div>
    </div>
  );
});

export default SecuritySettingsTab;
