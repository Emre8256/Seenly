import React, { memo } from 'react';
import {
  Mail,
  Zap,
  Award,
  TrendingUp,
  Megaphone
} from 'lucide-react';

const SecuritySettingsTab = memo(function SecuritySettingsTab({
  langCode,
  notifPrefs,
  handleToggleNotif
}) {
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
  );
});

export default SecuritySettingsTab;
