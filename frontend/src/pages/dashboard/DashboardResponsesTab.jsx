import React, { memo } from 'react';
import { ArrowRight, UsersRound } from 'lucide-react';
import premiumBg2 from '../../images/backgrounds/premium_bg2.avif';
import anonimLogo from '../../images/Icons/AnonimLOGO.avif';
import { useLocale } from '../../context/LocaleContext';
import ButtonSpinner from '../../components/ButtonSpinner';

const DashboardResponsesTab = memo(function DashboardResponsesTab({
  langCode: propLangCode,
  isPremium,
  isCheckoutLoading,
  handleUpgradeToPlus,
  responseSessions,
  visibleResponseSessions,
  setSelectedResponse,
  safeResponseHistoryPage,
  responseHistoryTotalPages,
  responseHistoryPageItems,
  setResponseHistoryPage,
  getRelativeTime,
  getSessionCalibratedAccuracy,
  getObject,
  historyLoading,
  historyError,
  historyHasMore,
  loadMoreResponseHistory
}) {
  const { t, locale } = useLocale();
  const tr = (key, vars) => t(key, vars, propLangCode || locale);

  return (
    <div className="tensignal-dashboard-tab-content full-width-layout scrollable-gap-content tensignal-gap-editorial-content" style={{ maxWidth: '840px', width: '100%' }}>
      <div className="flex flex-col gap-4 sm:gap-5 w-full box-border">
        {/* Non-Plus Hero Intelligence Banner for Gelen Analizler */}
        {!isPremium && (
          <div
            className="p-5 sm:p-7 rounded-[22px] sm:rounded-[26px] w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5 box-border text-left relative overflow-hidden"
            style={{
              border: '1.5px solid rgba(197, 160, 89, 0.45)',
              boxShadow: '0 16px 36px rgba(60, 44, 35, 0.08)'
            }}
          >
            {/* Subtle Blurred Background Image Layer */}
            <div
              className="absolute inset-0 pointer-events-none transform scale-105"
              style={{
                backgroundImage: `url(${premiumBg2})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                filter: 'blur(0.2px)'
              }}
            />

            <div className="flex-1 relative z-10 pr-2 sm:pr-4">
              <h3 className="font-serif text-[1.25rem] sm:text-[1.5rem] font-bold text-[#3C2C23] tracking-tight leading-snug m-0 drop-shadow-[0_1px_2px_rgba(255,255,255,0.7)]">
                {tr('dashboard.responses.anonymousReviewsTitle')}
              </h3>

              <p className="font-sans text-[0.82rem] sm:text-[0.88rem] text-[#3C2C23]/90 font-medium leading-relaxed m-0 mt-1 sm:mt-1.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
                {tr('dashboard.responses.anonymousReviewsDesc')}
              </p>
            </div>

            <div className="shrink-0 w-full md:w-auto relative z-10 flex flex-col items-center md:items-end mt-1 md:mt-0">
              <div className="relative inline-block w-full md:w-auto">
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#DFBF6A] via-[#FFF8E7] to-[#DFBF6A] text-[#0B1B2C] text-[8px] font-black uppercase tracking-[0.14em] shadow-[0_2px_8px_rgba(0,0,0,0.25)] z-20 border border-white/75 pointer-events-none whitespace-nowrap">
                  {tr('common.oneTime').toUpperCase()}
                </span>

                <button
                  type="button"
                  disabled={isCheckoutLoading}
                  onClick={handleUpgradeToPlus}
                  className="group w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#16222F] hover:bg-[#0E1721] text-white font-sans font-semibold text-[11.5px] sm:text-[12px] tracking-wider uppercase shadow-[0_4px_16px_rgba(22,34,47,0.2)] active:scale-[0.98] transition-all cursor-pointer border border-white/10"
                  style={isCheckoutLoading ? { opacity: 0.9, cursor: 'wait' } : {}}
                >
                  {isCheckoutLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <ButtonSpinner size={14} />
                      <span>{tr('common.processing')}</span>
                    </span>
                  ) : (
                    <>
                      <span>{tr('dashboard.responses.unlockWithPlus')}</span>
                      <ArrowRight size={13} strokeWidth={2.2} className="text-white group-hover:translate-x-0.5 transition-all" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vertical Timeline List of Cards */}
        {responseSessions.length === 0 ? (
          <div className="p-6 sm:p-8 rounded-[24px] sm:rounded-3xl border border-[rgba(197,160,89,0.25)] bg-[#FDFBF4] shadow-contact-sm text-center relative overflow-hidden box-border">
            <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <UsersRound size={22} strokeWidth={1.8} />
            </div>
            <h4 className="font-serif text-base sm:text-lg font-bold text-foreground mt-2 mb-2">
              {tr('dashboard.responses.noAnalysesYetTitle')}
            </h4>
            <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto m-0">
              {tr('dashboard.responses.noAnalysesYetDesc')}
            </p>
          </div>
        ) : (
          <div className="p-3 sm:p-5 rounded-[22px] sm:rounded-[28px] bg-[#EFE9DD]/60 border border-[rgba(197,160,89,0.28)] shadow-[inset_0_1px_6px_rgba(80,60,40,0.02)] flex flex-col gap-3 sm:gap-4 w-full box-border">
            {/* Independent List Cards */}
            <div className="flex flex-col gap-2 sm:gap-3 w-full box-border">
              {visibleResponseSessions.map((session) => {
                const relativeTime = getRelativeTime(session.completedAt);
                const isAccurate = session.readerType === 'telepathic_reader' || session.readerType === 'clear_reader';
                const isAnonymous = !session.nickname || session.nickname === 'unknown_person';
                const displayName = session.nickname;
                const initialLetter = !isAnonymous && displayName && displayName !== '?'
                  ? displayName.charAt(0).toUpperCase()
                  : null;
                const accuracyScore = getSessionCalibratedAccuracy(session);
                const archetypeName = getObject('readerStyles', session.readerType)?.name || session.readerType.replace('_', ' ').toUpperCase();

                return (
                  <div
                    key={session.id}
                    onClick={() => setSelectedResponse(session)}
                    className="group p-3 sm:p-4 px-3.5 sm:px-5 rounded-[16px] sm:rounded-[20px] bg-white hover:bg-[#FDFBF7] border border-[rgba(197,160,89,0.32)] hover:border-[rgba(197,160,89,0.7)] shadow-[0_4px_14px_rgba(80,60,40,0.04)] hover:shadow-[0_8px_24px_rgba(80,60,40,0.09)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3.5 box-border"
                  >
                    {/* Left Side: Avatar + Reader Style Title + Accuracy Score */}
                    <div className="flex items-center gap-3 sm:gap-3.5 flex-1 min-w-0">
                      {initialLetter ? (
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-[#F5EFE4] to-[#EAE1D2] border-[1.5px] border-[rgba(197,160,89,0.45)] flex items-center justify-center shrink-0 shadow-sm text-[#1A3E72] font-serif font-bold text-[13px] sm:text-[15px]">
                          <span>{initialLetter}</span>
                        </div>
                      ) : (
                        <img
                          src={anonimLogo}
                          alt={tr('common.anonymous')}
                          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-contain shrink-0 shadow-sm border-[1.5px] border-[rgba(197,160,89,0.45)] ring-1 ring-[rgba(26,62,114,0.08)]"
                        />
                      )}

                      <div className="flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-2.5 min-w-0">
                        <h4 className="font-serif text-[0.98rem] sm:text-[1.12rem] font-bold text-[#1A3E72] m-0 truncate group-hover:text-[#0E274A] transition-colors leading-tight">
                          {!isAnonymous ? `${displayName} · ${archetypeName}` : archetypeName}
                        </h4>

                        {/* Accuracy Tag */}
                        <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-sans font-bold tracking-tight border shrink-0 ${isAccurate
                            ? 'bg-[#1A3E72]/[0.06] text-[#1A3E72] border-[#1A3E72]/18'
                            : 'bg-[#8C6D37]/[0.08] text-[#8C6D37] border-[#8C6D37]/22'
                          }`}>
                          <span>{tr('dashboard.responses.matchRate', { accuracy: accuracyScore })}</span>
                        </span>
                      </div>
                    </div>

                    {/* Right Side: Timestamp + Hover Arrow */}
                    <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EFE8DC]">
                      <span className="font-sans text-[11px] sm:text-[12px] text-[#7A8B9E] font-medium whitespace-nowrap">
                        {relativeTime}
                      </span>

                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1A3E72]/[0.03] group-hover:bg-[#1A3E72]/[0.08] flex items-center justify-center text-[#8C9AA8] group-hover:text-[#1A3E72] transition-all duration-300 ease-out">
                        <ArrowRight size={13} strokeWidth={2.2} className="transform transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {historyError && <p role="alert" className="text-center text-sm text-red-700 m-0 py-1">{historyError}</p>}
            {historyHasMore && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={loadMoreResponseHistory}
                  disabled={historyLoading}
                  className="rounded-full border border-[#1A3E72]/20 px-4 py-2 text-xs font-semibold text-[#1A3E72] disabled:opacity-60 hover:bg-[#1A3E72]/5 transition-colors"
                >
                  {historyLoading ? tr('common.loading') : tr('common.loadMore')}
                </button>
              </div>
            )}

            {/* Always Visible Pagination Controls */}
            <div
              className="tensignal-response-pagination pt-1"
              aria-label={tr('accessibility.receivedAnalysisPages')}
            >
              <button
                type="button"
                className="tensignal-response-page-btn tensignal-response-page-nav"
                aria-label={tr('accessibility.previousPage')}
                disabled={safeResponseHistoryPage === 1}
                onClick={() => setResponseHistoryPage((currentPage) => Math.max(1, currentPage - 1))}
              >
                &lt;
              </button>

              {(responseHistoryTotalPages > 1 ? responseHistoryPageItems : [1]).map((pageItem) => {
                if (typeof pageItem === 'string') {
                  return (
                    <span key={pageItem} className="tensignal-response-page-ellipsis" aria-hidden="true">
                      ...
                    </span>
                  );
                }

                const pageNumber = pageItem;
                const isActivePage = pageNumber === safeResponseHistoryPage;

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    className={`tensignal-response-page-btn${isActivePage ? ' active' : ''}`}
                    aria-current={isActivePage ? 'page' : undefined}
                    onClick={() => setResponseHistoryPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                type="button"
                className="tensignal-response-page-btn tensignal-response-page-nav"
                aria-label={tr('accessibility.nextPage')}
                disabled={safeResponseHistoryPage === responseHistoryTotalPages || responseHistoryTotalPages <= 1}
                onClick={() => setResponseHistoryPage((currentPage) => Math.min(responseHistoryTotalPages, currentPage + 1))}
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default DashboardResponsesTab;
