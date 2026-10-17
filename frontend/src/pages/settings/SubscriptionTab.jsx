import React, { memo } from 'react';
import {
  AlertTriangle,
  Clock,
  Users,
  CheckCircle2,
  BarChart3,
  Eye,
  RepeatOff,
  ArrowRight,
  UserPlus,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import ButtonSpinner from '../../components/ButtonSpinner';

/**
 * Returns grammatically correct Turkish suffix for percentages:
 * 17 -> "'si", 25 -> "'i", 30 -> "'u", 100 -> "'ü", etc.
 */
function getTurkishPercentSuffix(n) {
  const num = Math.round(Number(n)) || 0;
  const last = num % 10;
  if (num !== 0 && last !== 0) {
    if (last === 1 || last === 5 || last === 8) return "'i";
    if (last === 2 || last === 7) return "'si";
    if (last === 3 || last === 4) return "'ü";
    if (last === 6) return "'sı";
    if (last === 9) return "'u";
  }
  if (num === 100) return "'ü";
  const tens = num % 100;
  if (tens === 10 || tens === 30) return "'u";
  if (tens === 20 || tens === 50) return "'si";
  if (tens === 70 || tens === 80) return "'i";
  return "'ı"; // 0, 40, 60, 90
}

const SubscriptionTab = memo(function SubscriptionTab({
  isPremium,
  responseCount,
  maxResponseLimit,
  usagePercent,
  isQuotaFull,
  isQuotaNearFull,
  showPlusActivePerks,
  setShowPlusActivePerks,
  actionLoading,
  checkoutLoadingCode,
  handleUpgradeToPlus,
  capacityPackOptions,
  handleBuyPack,
  plusPriceFormatted
}) {
  const { t } = useLocale();
  const effectivePrice = plusPriceFormatted || t('billing.premium.price');

  const effectiveUsagePercent = typeof usagePercent === 'number'
    ? usagePercent
    : (maxResponseLimit > 0 ? Math.min(100, Math.round((responseCount / maxResponseLimit) * 100)) : 0);
  const remainingCount = maxResponseLimit > 0 ? Math.max(0, maxResponseLimit - responseCount) : 0;

  return (
    <div className="tensignal-settings-content tensignal-settings-fade-in">
      <div className="tensignal-plan-pro tensignal-plan-clean">

        {/* 1. Limit Tracker Card (Only visible when Free / !isPremium) */}
        {!isPremium && (
          <section className="tensignal-profile-card tensignal-form-card tensignal-quota-card">
            {/* Header: Title, Description & Metric Counter */}
            <div className="tensignal-quota-header">
              <div className="tensignal-quota-header-info">
                <div className="tensignal-card-head-icon tensignal-quota-head-icon">
                  <Users size={18} strokeWidth={2.2} />
                </div>
                <div className="tensignal-quota-header-text">
                  <h3 className="tensignal-card-head-title">
                    {t('settings.subscription.quotaTitle')}
                  </h3>
                  <p className="tensignal-card-head-desc">
                    {t('settings.subscription.quotaDesc')}
                  </p>
                </div>
              </div>

              {/* Metric Counter: Natural, Unframed Typography */}
              <div className="tensignal-quota-metric-wrap">
                <div className="tensignal-quota-metric-numbers">
                  <span className="tensignal-quota-metric-current">{responseCount}</span>
                  <span className="tensignal-quota-metric-sep">/</span>
                  <span className="tensignal-quota-metric-max">{maxResponseLimit}</span>
                </div>
                <span className="tensignal-quota-metric-label">
                  {t('settings.subscription.usedLabel')}
                </span>
              </div>
            </div>

            {/* Progress Bar & Sub-Metrics */}
            <div className="tensignal-quota-progress-section">
              <div className="tensignal-quota-bar-track">
                <div
                  className={`tensignal-quota-bar-fill ${isQuotaFull ? 'is-full' : isQuotaNearFull ? 'is-warning' : 'is-normal'}`}
                  style={{ width: `${Math.min(100, Math.max(0, effectiveUsagePercent))}%` }}
                />
              </div>

              <div className="tensignal-quota-bar-footer">
                <span className="tensignal-quota-footer-used">
                  {t('settings.subscription.capacityUsedText', {
                    percent: effectiveUsagePercent,
                    suffix: getTurkishPercentSuffix(effectiveUsagePercent)
                  })}
                </span>
                <div className="tensignal-quota-footer-remaining">
                  <CheckCircle2 size={14} strokeWidth={2.2} className="tensignal-quota-check-icon" />
                  <span>
                    {t('settings.subscription.remainingCapacityText', { count: remainingCount })}
                  </span>
                </div>
              </div>
            </div>

            {/* Contextual Warning / Full Alert Banner */}
            {(isQuotaFull || isQuotaNearFull) && (
              <div className={`tensignal-quota-alert-banner ${isQuotaFull ? 'status-full' : 'status-warning'}`}>
                <div className="tensignal-quota-alert-icon">
                  {isQuotaFull ? (
                    <AlertTriangle size={15} strokeWidth={2.2} />
                  ) : (
                    <Clock size={15} strokeWidth={2.2} />
                  )}
                </div>
                <p className="tensignal-quota-alert-msg">
                  {isQuotaFull
                    ? t('settings.subscription.quotaFullAlert')
                    : t('settings.subscription.quotaNearFullAlert')}
                </p>
              </div>
            )}
          </section>
        )}

        {/* 2. If Plus: Active VIP Benefits Card */}
        {isPremium ? (
          <section className="tensignal-plus-active-card relative overflow-hidden">
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
                <h3 className="tensignal-plus-active-title">
                  {t('settings.subscription.plusActiveTitle')}
                </h3>
                <p className="tensignal-plus-active-desc">
                  {t('settings.subscription.plusActiveDesc')}
                </p>
              </div>

              {/* Expand / Collapse Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPlusActivePerks(prev => !prev)}
                className="tensignal-plus-perks-toggle-btn"
                aria-expanded={showPlusActivePerks}
              >
                <span>{showPlusActivePerks ? t('settings.subscription.hideBenefits') : t('settings.subscription.viewBenefits')}</span>
                <ChevronDown
                  size={15}
                  strokeWidth={2.4}
                  className={`tensignal-plus-perks-chevron ${showPlusActivePerks ? 'is-open' : ''}`}
                />
              </button>
            </div>

            {/* Expandable Benefits Container */}
            {showPlusActivePerks && (
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-5 mt-5 border-t border-[rgba(197,160,89,0.22)] tensignal-settings-fade-in">
                {/* 1. Sınırsız Katılımcı Kotası */}
                <div className="tensignal-plus-feature-item">
                  <div className="tensignal-plus-feature-icon-badge">
                    <Users size={16} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h5 className="tensignal-plus-feature-title">
                      {t('settings.subscription.unlimitedCapacity')}
                    </h5>
                    <p className="tensignal-plus-feature-desc">
                      {t('settings.subscription.unlimitedCapacityDesc')}
                    </p>
                  </div>
                </div>

                {/* 2. Bireysel Analiz & Yanıt Dökümü */}
                <div className="tensignal-plus-feature-item">
                  <div className="tensignal-plus-feature-icon-badge">
                    <BarChart3 size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <h5 className="tensignal-plus-feature-title">
                      {t('settings.subscription.individualBreakdowns')}
                    </h5>
                    <p className="tensignal-plus-feature-desc">
                      {t('settings.subscription.individualBreakdownsDesc')}
                    </p>
                  </div>
                </div>

                {/* 3. Soruda Geçirilen Zaman / Karar Ritmi */}
                <div className="tensignal-plus-feature-item">
                  <div className="tensignal-plus-feature-icon-badge">
                    <Clock size={16} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h5 className="tensignal-plus-feature-title">
                      {t('settings.subscription.decisionTimes')}
                    </h5>
                    <p className="tensignal-plus-feature-desc">
                      {t('settings.subscription.decisionTimesDesc')}
                    </p>
                  </div>
                </div>

                {/* 4. Profil Ziyaretleri */}
                <div className="tensignal-plus-feature-item">
                  <div className="tensignal-plus-feature-icon-badge">
                    <Eye size={16} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h5 className="tensignal-plus-feature-title">
                      {t('settings.subscription.profileVisits')}
                    </h5>
                    <p className="tensignal-plus-feature-desc">
                      {t('settings.subscription.profileVisitsDesc')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        ) : (
          /* If Free: Showcase 10Signal Plus + Extra Packs */
          <>
            {/* Main Showcase Card for Plus */}
            <section className="tensignal-plus-showcase-card relative overflow-hidden">
              {/* Celestial Sacred Geometry & Vector Motif Layer */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(228,196,136,0.28)_0%,transparent_70%)] blur-2xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(26,62,114,0.06)_0%,transparent_70%)] blur-2xl pointer-events-none" />

                {/* Top-Right Sacred Astrolabe & Celestial Compass Motif */}
                <svg className="absolute -right-12 -top-12 w-72 h-72 text-[#C5A059] opacity-[0.18]" viewBox="0 0 200 200" fill="none" stroke="currentColor">
                  <circle cx="100" cy="100" r="92" strokeWidth="0.75" strokeDasharray="3 3" />
                  <circle cx="100" cy="100" r="74" strokeWidth="0.75" />
                  <circle cx="100" cy="100" r="56" strokeWidth="0.5" strokeDasharray="2 3" />
                  <circle cx="100" cy="100" r="38" strokeWidth="0.75" />
                  <circle cx="100" cy="100" r="18" strokeWidth="0.5" />
                  <line x1="8" y1="100" x2="192" y2="100" strokeWidth="0.5" strokeDasharray="4 4" />
                  <line x1="100" y1="8" x2="100" y2="192" strokeWidth="0.5" strokeDasharray="4 4" />
                  <line x1="35" y1="35" x2="165" y2="165" strokeWidth="0.5" strokeDasharray="2 4" />
                  <line x1="35" y1="165" x2="165" y2="35" strokeWidth="0.5" strokeDasharray="2 4" />
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

              {/* Hanging Price Curtain Banner */}
              <div className="tensignal-plus-price-curtain">
                <div className="tensignal-plus-price-curtain-pin" aria-hidden="true" />
                <div className="tensignal-plus-price-val">
                  <span>
                    {effectivePrice}
                  </span>
                </div>
                <span className="tensignal-plus-price-label">
                  {t('common.oneTime')}
                </span>
              </div>

              {/* Title & Subtext Block */}
              <div className="relative z-10 pt-1 max-w-lg">
                <h3 className="tensignal-plus-title">
                  <span className="tensignal-plus-title-num">10</span>Signal Plus
                </h3>
                <div className="w-10 h-[1.5px] bg-[#C5A059] opacity-60 my-2" />
                <p className="tensignal-plus-subtext">
                  {t('settings.subscription.upgradePlusDesc')}
                </p>
              </div>

              {/* 4 Core Features Grid */}
              <div className="relative z-10 my-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 sm:gap-y-5 gap-x-8">
                  {/* 1. Sınırsız Katılımcı Kotası */}
                  <div className="tensignal-plus-feature-item">
                    <div className="tensignal-plus-feature-icon-badge">
                      <Users size={16} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h5 className="tensignal-plus-feature-title">
                        {t('settings.subscription.unlimitedCapacity')}
                      </h5>
                      <p className="tensignal-plus-feature-desc">
                        {t('settings.subscription.unlimitedCapacityDesc')}
                      </p>
                    </div>
                  </div>

                  {/* 2. Bireysel Analiz & Yanıt Dökümü */}
                  <div className="tensignal-plus-feature-item">
                    <div className="tensignal-plus-feature-icon-badge">
                      <BarChart3 size={16} strokeWidth={2} />
                    </div>
                    <div>
                      <h5 className="tensignal-plus-feature-title">
                        {t('settings.subscription.individualBreakdowns')}
                      </h5>
                      <p className="tensignal-plus-feature-desc">
                        {t('settings.subscription.individualBreakdownsDesc')}
                      </p>
                    </div>
                  </div>

                  {/* 3. Soruda Geçirilen Zaman / Karar Ritmi */}
                  <div className="tensignal-plus-feature-item">
                    <div className="tensignal-plus-feature-icon-badge">
                      <Clock size={16} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h5 className="tensignal-plus-feature-title">
                        {t('settings.subscription.decisionTimes')}
                      </h5>
                      <p className="tensignal-plus-feature-desc">
                        {t('settings.subscription.decisionTimesDesc')}
                      </p>
                    </div>
                  </div>

                  {/* 4. Profil Ziyaretleri */}
                  <div className="tensignal-plus-feature-item">
                    <div className="tensignal-plus-feature-icon-badge">
                      <Eye size={16} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h5 className="tensignal-plus-feature-title">
                        {t('settings.subscription.profileVisits')}
                      </h5>
                      <p className="tensignal-plus-feature-desc">
                        {t('settings.subscription.profileVisitsDesc')}
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
                    <RepeatOff size={13} strokeWidth={2.2} />
                  </div>
                  <span>{t('settings.subscription.securePayment')}</span>
                </div>

                <button
                  type="button"
                  disabled={Boolean(checkoutLoadingCode) || actionLoading}
                  onClick={handleUpgradeToPlus}
                  className="tensignal-plus-cta-btn"
                  style={checkoutLoadingCode === 'seenly_plus_v1' ? { opacity: 0.9, cursor: 'wait' } : {}}
                >
                  {checkoutLoadingCode === 'seenly_plus_v1' ? (
                    <span className="flex items-center justify-center gap-2">
                      <ButtonSpinner size={15} />
                      <span>{t('common.processing')}</span>
                    </span>
                  ) : (
                    <>
                      <span>
                        {t('settings.subscription.upgradeBtn', { price: effectivePrice })}
                      </span>
                      <ArrowRight size={14} strokeWidth={2} className="tensignal-plus-cta-arrow" />
                    </>
                  )}
                </button>
              </div>

              {/* Pre-Payment Notice & Legal Links */}
              <div className="relative z-10 pt-3 mt-3 border-t border-[rgba(197,160,89,0.18)] flex items-start gap-2 text-[11.5px] leading-relaxed text-[#735A47]">
                <ShieldCheck size={14} className="mt-0.5 text-[#8C6D37] flex-shrink-0" />
                <p className="m-0">
                  <span>{t('settings.subscription.refundNoticeText')}</span>{' '}
                  <a
                    href="#/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-[#1A3E72] font-medium transition-colors"
                  >
                    {t('settings.subscription.termsOfService')}
                  </a>
                  {' · '}
                  <a
                    href="#/refund"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-[#1A3E72] font-medium transition-colors"
                  >
                    {t('settings.subscription.refundPolicy')}
                  </a>
                </p>
              </div>
            </section>

            {/* 3. Extra Capacity Packs */}
            <section className="tensignal-packs-painterly-container relative overflow-hidden">
              {/* Celestial Sacred Geometry & Vector Motif Layer */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
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
                <div className="w-12 h-12 rounded-full bg-[#FAF5EA] border border-[rgba(197,160,89,0.4)] shadow-sm flex items-center justify-center text-[#8C6D37] flex-shrink-0">
                  <UserPlus size={20} strokeWidth={1.7} />
                </div>
                <div>
                  <h4 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.25rem', fontWeight: 650, color: '#1A3E72', margin: 0, lineHeight: 1.25 }}>
                    {t('settings.subscription.expandCapacityTitle')}
                  </h4>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12.5px', color: '#554030', margin: '4px 0 0', lineHeight: 1.4 }}>
                    {t('settings.subscription.expandCapacityDesc')}
                  </p>
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-4 pt-3 tensignal-packs-grid">
                {capacityPackOptions.map((pack) => {
                  return (
                    <div key={pack.amount} className={`tensignal-pack-card tensignal-pack-${pack.theme}`}>
                      {/* Unique Celestial Sacred Geometry Motif per Pack */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                        <div className="tensignal-pack-card-ambient-glow" />
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

                      {/* 1. Kapasite Miktarı */}
                      <div className="relative z-10 tensignal-pack-quota-pill">
                        <span className="tensignal-pack-quota-num">+{pack.amount}</span>
                        <span className="tensignal-pack-quota-txt">{t('settings.subscription.quotaText')}</span>
                      </div>

                      {/* 2. Başlık */}
                      <h5 className="relative z-10 tensignal-pack-title">
                        {pack.label}
                      </h5>

                      {/* 3. Fiyat */}
                      <div className="relative z-10 tensignal-pack-price">
                        <span className="tensignal-pack-price-symbol">$</span>
                        <span>{pack.price.replace('$', '')}</span>
                      </div>

                      {/* 4. Buton */}
                      <button
                        type="button"
                        disabled={Boolean(checkoutLoadingCode) || actionLoading}
                        onClick={() => handleBuyPack(pack.productCode)}
                        className="relative z-10 tensignal-pack-btn"
                        style={checkoutLoadingCode === pack.productCode ? { opacity: 0.9, cursor: 'wait' } : {}}
                      >
                        {checkoutLoadingCode === pack.productCode ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <ButtonSpinner size={14} />
                            <span>{t('settings.subscription.addingPack')}</span>
                          </span>
                        ) : (
                          <>
                            <span>{t('settings.subscription.addPackBtn')}</span>
                            <ArrowRight size={14} strokeWidth={2} className="tensignal-pack-btn-arrow" />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Pre-Payment Notice & Legal Links */}
              <div className="relative z-10 pt-3 mt-4 border-t border-[rgba(197,160,89,0.18)] flex items-start gap-2 text-[11.5px] leading-relaxed text-[#735A47]">
                <ShieldCheck size={14} className="mt-0.5 text-[#8C6D37] flex-shrink-0" />
                <p className="m-0">
                  <span>{t('settings.subscription.refundNoticeText')}</span>{' '}
                  <a
                    href="#/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-[#1A3E72] font-medium transition-colors"
                  >
                    {t('settings.subscription.termsOfService')}
                  </a>
                  {' · '}
                  <a
                    href="#/refund"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-[#1A3E72] font-medium transition-colors"
                  >
                    {t('settings.subscription.refundPolicy')}
                  </a>
                </p>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
});

export default SubscriptionTab;
