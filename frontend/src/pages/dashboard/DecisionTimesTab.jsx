import React, { memo } from 'react';
import { Lock, ArrowRight, Timer, Zap } from 'lucide-react';
import { LockedMask } from './DashboardSharedComponents';
import premiumBg from '../../images/backgrounds/premium_bg.avif';

const DecisionTimesTab = memo(function DecisionTimesTab({
  langCode,
  t,
  responseCount,
  isPremium,
  handleUpgradeToPlus,
  totalProfileClicks,
  totalResponders,
  ratio,
  slowestSignal,
  slowestTimeSec,
  fastestSignal,
  fastestTimeSec
}) {
  return (
    <div className="seenly-dashboard-tab-content full-width-layout scrollable-gap-content seenly-gap-editorial-content" style={{ maxWidth: '860px', width: '100%', margin: '0 auto' }}>
      {responseCount < 3 ? (
        <div className="seenly-dashboard-locked-state w-full box-border" style={{ minHeight: '260px' }}>
          <LockedMask
            title={t('dashboard.decisionTimes.lockedTitle')}
            description={t('dashboard.decisionTimes.lockedDesc')}
            responseCount={responseCount}
            targetCount={3}
            langCode={langCode}
          />
        </div>
      ) : !isPremium ? (
        /* NON-PLUS USER: EDITORIAL PREVIEW */
        <div className="flex flex-col gap-4 w-full box-border">
          {/* Hero Intelligence Overview */}
          <div
            className="p-5 sm:p-7 rounded-[22px] sm:rounded-[26px] w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5 box-border text-left relative overflow-hidden"
            style={{
              border: '1.5px solid rgba(26, 62, 114, 0.45)',
              boxShadow: '0 16px 36px rgba(11, 27, 44, 0.16)'
            }}
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 pointer-events-none transform scale-105"
              style={{
                backgroundImage: `url(${premiumBg})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                filter: 'blur(0.2px)'
              }}
            />

            <div className="flex-1 max-w-xl relative z-10">
              <h3 className="font-serif text-[1.25rem] sm:text-[1.5rem] font-bold text-white tracking-tight leading-snug m-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                {t('dashboard.decisionTimes.rhythmicAnalysisTitle')}
              </h3>

              <p className="font-sans text-[0.82rem] sm:text-[0.85rem] text-[#F8FAFC] font-medium leading-relaxed max-w-lg m-0 mt-1 sm:mt-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] opacity-95">
                {t('dashboard.decisionTimes.lockedDesc')}
              </p>
            </div>

            <div className="shrink-0 w-full md:w-auto relative z-10 flex flex-col items-center md:items-end mt-1 md:mt-0">
              <div className="relative inline-block w-full md:w-auto">
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#DFBF6A] via-[#FFF8E7] to-[#DFBF6A] text-[#0B1B2C] text-[8px] font-black uppercase tracking-[0.14em] shadow-[0_2px_8px_rgba(0,0,0,0.35)] z-20 border border-white/75 pointer-events-none whitespace-nowrap">
                  {t('common.oneTime')}
                </span>

                <button
                  type="button"
                  onClick={handleUpgradeToPlus}
                  className="group w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B1B2C]/80 hover:bg-[#0B1B2C] text-[#F3DE9A] hover:text-white font-sans font-semibold text-[11.5px] sm:text-[12px] tracking-wider uppercase border border-[#F3DE9A]/35 hover:border-[#F3DE9A]/70 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>{t('dashboard.decisionTimes.unlockPlus')}</span>
                  <ArrowRight size={13} strokeWidth={2.2} className="text-[#F3DE9A] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </div>
          </div>

          {/* 3 Preview Cards */}
          <div className="flex flex-col gap-3.5 w-full box-border">
            {/* Top Horizontal: Social Conversion */}
            <div
              className="p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] text-left flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 sm:gap-5 box-border relative"
              style={{
                background: '#FDFBF4',
                border: '1px solid rgba(197, 160, 89, 0.22)',
                boxShadow: '0 4px 14px rgba(80, 60, 40, 0.03)'
              }}
            >
              <div className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 text-[#8C6D37]">
                <Lock size={13} strokeWidth={2.2} />
              </div>

              <div className="flex-1 max-w-lg pr-6 sm:pr-0">
                <h4 className="font-serif text-[1.18rem] sm:text-[1.35rem] font-bold text-[#1A3E72] m-0 mb-1">
                  {t('dashboard.decisionTimes.profileVisitsTitle')}
                </h4>

                <p className="font-sans text-[0.8rem] sm:text-[0.84rem] text-[#64748B] leading-relaxed m-0">
                  {t('dashboard.decisionTimes.profileVisitsDesc')}
                </p>
              </div>

              <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center shrink-0 min-w-[150px] sm:min-w-[170px] pt-2.5 sm:pt-0 sm:border-l sm:border-[#EFE8DC] border-t sm:border-t-0 border-[#EFE8DC] sm:px-6 sm:py-2">
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="font-serif text-2xl sm:text-4xl font-black text-[#1A3E72] leading-none opacity-40">
                    --
                  </span>
                  <span className="font-sans text-[11px] sm:text-[12px] font-bold text-[#1A3E72]">
                    {t('dashboard.decisionTimes.visits')}
                  </span>
                </div>
                <span className="font-sans text-[10.5px] sm:text-[11px] text-[#64748B] sm:mt-1 text-center">
                  %-- {t('dashboard.decisionTimes.conversion')}
                </span>
              </div>
            </div>

            {/* Bottom 2 Columns: Hesitation & Reflex */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full box-border">
              {/* Card 1: Hesitation */}
              <div
                className="p-4 sm:p-5 rounded-[20px] sm:rounded-[22px] text-left flex flex-col justify-between box-border"
                style={{
                  background: '#FDFBF4',
                  border: '1px solid rgba(197, 160, 89, 0.22)',
                  boxShadow: '0 4px 14px rgba(80, 60, 40, 0.03)'
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[9.5px] sm:text-[10px] uppercase font-bold tracking-[0.08em] text-[#8C6D37]">
                      {t('dashboard.decisionTimes.longestHesitation')}
                    </span>
                    <Lock size={12} strokeWidth={2.2} className="text-[#8C6D37]" />
                  </div>

                  <h4 className="font-serif text-[1.15rem] sm:text-[1.25rem] font-bold text-[#1A3E72] m-0 mb-1">
                    {t('dashboard.decisionTimes.lockedSignal')}
                  </h4>

                  <div className="flex items-baseline gap-1.5 my-1.5">
                    <span className="font-serif text-2xl font-black text-[#1A3E72] leading-none opacity-40">
                      --.-s
                    </span>
                    <span className="font-sans text-[10.5px] sm:text-[11px] text-[#64748B]">
                      {t('dashboard.decisionTimes.averagePause')}
                    </span>
                  </div>
                </div>

                <p className="font-sans text-[0.78rem] sm:text-[0.8rem] text-[#64748B] leading-relaxed m-0 mt-3 pt-2.5 border-t border-[#EFE8DC]">
                  {t('dashboard.decisionTimes.hesitationCardDesc')}
                </p>
              </div>

              {/* Card 2: Instant Intuition */}
              <div
                className="p-4 sm:p-5 rounded-[20px] sm:rounded-[22px] text-left flex flex-col justify-between box-border"
                style={{
                  background: '#FDFBF4',
                  border: '1px solid rgba(197, 160, 89, 0.22)',
                  boxShadow: '0 4px 14px rgba(80, 60, 40, 0.03)'
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[9.5px] sm:text-[10px] uppercase font-bold tracking-[0.08em] text-[#8C6D37]">
                      {t('dashboard.decisionTimes.instantConviction')}
                    </span>
                    <Lock size={12} strokeWidth={2.2} className="text-[#8C6D37]" />
                  </div>

                  <h4 className="font-serif text-[1.15rem] sm:text-[1.25rem] font-bold text-[#1A3E72] m-0 mb-1">
                    {t('dashboard.decisionTimes.lockedSignal')}
                  </h4>

                  <div className="flex items-baseline gap-1.5 my-1.5">
                    <span className="font-serif text-2xl font-black text-[#1A3E72] leading-none opacity-40">
                      --.-s
                    </span>
                    <span className="font-sans text-[10.5px] sm:text-[11px] text-[#64748B]">
                      {t('dashboard.decisionTimes.instantSpeed')}
                    </span>
                  </div>
                </div>

                <p className="font-sans text-[0.78rem] sm:text-[0.8rem] text-[#64748B] leading-relaxed m-0 mt-3 pt-2.5 border-t border-[#EFE8DC]">
                  {t('dashboard.decisionTimes.convictionCardDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PLUS USER: UNLOCKED VIEW */
        <div className="flex flex-col gap-3.5 w-full box-border">
          {/* Top: Profile Visits Card */}
          <div
            className="p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] text-left flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 sm:gap-5 box-border"
            style={{
              background: '#FDFBF4',
              border: '1px solid rgba(197, 160, 89, 0.25)',
              boxShadow: '0 4px 14px rgba(80, 60, 40, 0.03)'
            }}
          >
            <div className="flex-1 max-w-lg">
              <h4 className="font-serif text-[1.18rem] sm:text-[1.35rem] font-bold text-[#1A3E72] m-0 mb-1">
                {t('dashboard.decisionTimes.profileVisitsTitle')}
              </h4>

              <p className="font-sans text-[0.8rem] sm:text-[0.84rem] text-[#4A5568] leading-relaxed m-0 mb-2.5 sm:mb-3">
                {totalProfileClicks === 0
                  ? t('dashboard.decisionTimes.noVisitsYet')
                  : t('dashboard.decisionTimes.visitsBreakdown', {
                      total: totalProfileClicks,
                      silent: Math.max(0, totalProfileClicks - totalResponders),
                      responders: totalResponders
                    })
                }
              </p>

              {/* Micro Status Badges */}
              {totalProfileClicks > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#1A3E72]/[0.07] text-[#1A3E72] border border-[#1A3E72]/15">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1A3E72]" />
                    <span>{t('dashboard.decisionTimes.completedBadge', { count: totalResponders })}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#8C6D37]/[0.08] text-[#8C6D37] border border-[#8C6D37]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8C6D37]" />
                    <span>{t('dashboard.decisionTimes.silentViewersBadge', { count: Math.max(0, totalProfileClicks - totalResponders) })}</span>
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center shrink-0 min-w-[150px] sm:min-w-[170px] pt-2.5 sm:pt-0 sm:border-l sm:border-[#EFE8DC] border-t sm:border-t-0 border-[#EFE8DC] sm:px-6 sm:py-2">
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-2xl sm:text-4xl font-black text-[#1A3E72] leading-none">
                  {totalProfileClicks}
                </span>
                <span className="font-sans text-[11px] sm:text-[12px] font-bold text-[#1A3E72]">
                  {t('dashboard.decisionTimes.visits')}
                </span>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 sm:p-0 rounded-md sm:rounded-none bg-[#8C6D37]/[0.08] sm:bg-transparent text-[10.5px] sm:text-[11px] font-semibold text-[#8C6D37] sm:mt-1.5 text-center">
                %{ratio} {t('dashboard.decisionTimes.conversion')}
              </span>
            </div>
          </div>

          {/* Bottom 2 Columns: Hesitation & Reflex */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full box-border">
            {/* Card 1: Hesitation */}
            <div
              className="p-4 sm:p-5 rounded-[20px] sm:rounded-[22px] text-left flex flex-col justify-between box-border"
              style={{
                background: '#FDFBF4',
                border: '1px solid rgba(197, 160, 89, 0.25)',
                boxShadow: '0 4px 14px rgba(80, 60, 40, 0.03)'
              }}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[9.5px] sm:text-[10px] uppercase font-bold tracking-[0.08em] text-[#8C6D37]">
                    {t('dashboard.decisionTimes.longestHesitation')}
                  </span>
                  <Timer size={13} strokeWidth={2.2} className="text-[#8C6D37]" />
                </div>

                <h4 className="font-serif text-[1.18rem] sm:text-[1.3rem] font-bold text-[#1A3E72] m-0 mb-1 truncate" title={slowestSignal ? (t(`common.signals.${slowestSignal}`) || slowestSignal) : ''}>
                  {slowestSignal ? (t(`common.signals.${slowestSignal}`) || slowestSignal) : '-'}
                </h4>

                <div className="flex items-baseline gap-1.5 my-1.5">
                  <span className="font-serif text-2xl sm:text-3xl font-black text-[#1A3E72] leading-none">
                    {slowestTimeSec}s
                  </span>
                  <span className="font-sans text-[10.5px] sm:text-[11px] text-[#64748B]">
                    {t('dashboard.decisionTimes.averagePause')}
                  </span>
                </div>
              </div>

              <p className="font-sans text-[0.8rem] sm:text-[0.82rem] text-[#4A5568] leading-relaxed m-0 mt-3 pt-2.5 border-t border-[#EFE8DC]">
                {t('dashboard.decisionTimes.hesitationCardDesc')}
              </p>
            </div>

            {/* Card 2: Instant Conviction */}
            <div
              className="p-4 sm:p-5 rounded-[20px] sm:rounded-[22px] text-left flex flex-col justify-between box-border"
              style={{
                background: '#FDFBF4',
                border: '1px solid rgba(197, 160, 89, 0.25)',
                boxShadow: '0 4px 14px rgba(80, 60, 40, 0.03)'
              }}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[9.5px] sm:text-[10px] uppercase font-bold tracking-[0.08em] text-[#8C6D37]">
                    {t('dashboard.decisionTimes.instantConviction')}
                  </span>
                  <Zap size={13} strokeWidth={2.2} className="text-[#8C6D37]" />
                </div>

                <h4 className="font-serif text-[1.18rem] sm:text-[1.3rem] font-bold text-[#1A3E72] m-0 mb-1 truncate" title={fastestSignal ? (t(`common.signals.${fastestSignal}`) || fastestSignal) : ''}>
                  {fastestSignal ? (t(`common.signals.${fastestSignal}`) || fastestSignal) : '-'}
                </h4>

                <div className="flex items-baseline gap-1.5 my-1.5">
                  <span className="font-serif text-2xl sm:text-3xl font-black text-[#1A3E72] leading-none">
                    {fastestTimeSec}s
                  </span>
                  <span className="font-sans text-[10.5px] sm:text-[11px] text-[#64748B]">
                    {t('dashboard.decisionTimes.averageDecisionTime')}
                  </span>
                </div>
              </div>

              <p className="font-sans text-[0.8rem] sm:text-[0.82rem] text-[#4A5568] leading-relaxed m-0 mt-3 pt-2.5 border-t border-[#EFE8DC]">
                {t('dashboard.decisionTimes.convictionCardDesc')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default DecisionTimesTab;
