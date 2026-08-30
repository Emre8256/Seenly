import React, { memo } from 'react';
import {
  Gauge,
  AlertTriangle,
  Clock,
  Users,
  BarChart3,
  Eye,
  ShieldCheck,
  ArrowRight,
  UserPlus,
  ChevronDown
} from 'lucide-react';

const SubscriptionTab = memo(function SubscriptionTab({
  langCode,
  t,
  isPremium,
  responseCount,
  maxResponseLimit,
  usagePercent,
  isQuotaFull,
  isQuotaNearFull,
  showPlusActivePerks,
  setShowPlusActivePerks,
  actionLoading,
  handleUpgradeToPlus,
  capacityPackOptions,
  handleBuyPack
}) {
  return (
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

            {/* Contextual Warning / Full Alert Banner */}
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

        {/* 2. If Plus: Active VIP Benefits Card */}
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

            {/* Expandable Benefits Container */}
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
          /* If Free: Showcase Seenly Plus + Extra Packs */
          <>
            {/* Main Showcase Card for Plus */}
            <section className="seenly-plus-showcase-card relative overflow-hidden">
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

              {/* 4 Core Features Grid */}
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

            {/* 3. Extra Capacity Packs */}
            <section className="seenly-packs-painterly-container relative overflow-hidden">
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

                      {/* 1. Kapasite Miktarı */}
                      <div className="relative z-10 seenly-pack-quota-pill">
                        <span className="seenly-pack-quota-num">+{pack.amount}</span>
                        <span className="seenly-pack-quota-txt">{langCode === 'tr' ? 'Yanıt' : 'Quota'}</span>
                      </div>

                      {/* 2. Başlık */}
                      <h5 className="relative z-10 seenly-pack-title">
                        {pack.label}
                      </h5>

                      {/* 3. Fiyat */}
                      <div className="relative z-10 seenly-pack-price">
                        <span className="seenly-pack-price-symbol">$</span>
                        <span>{pack.price.replace('$', '')}</span>
                      </div>

                      {/* 4. Buton */}
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
  );
});

export default SubscriptionTab;
