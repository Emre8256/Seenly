import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Lock,
  Sparkles,
  Timer,
  ShieldCheck,
  ArrowRight,
  Zap
} from 'lucide-react';
import anonimLogo from '../../images/Icons/AnonimLOGO.avif';
import { calibrateTraitScore } from '../../utils/psychometrics';
import { useLocale } from '../../context/LocaleContext';
import ButtonSpinner from '../../components/ButtonSpinner';

const ResponseDetailDrawer = memo(function ResponseDetailDrawer({
  selectedResponse,
  setSelectedResponse,
  isPremium,
  isCheckoutLoading,
  langCode: propLangCode,
  handleUpgradeToPlus,
  getObject,
  getSessionCalibratedAccuracy,
  getRelativeTime
}) {
  const { t, locale } = useLocale();
  const tr = (key, vars) => t(key, vars, propLangCode || locale);

  if (!selectedResponse) return null;

  // 1. FREE USER TEASER MODAL
  if (!isPremium) {
    return createPortal(
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center p-3.5 sm:p-4 bg-[#0A1118]/65 transition-all duration-300"
        onClick={() => setSelectedResponse(null)}
      >
        <div
          className="w-full max-w-[400px] rounded-[24px] sm:rounded-[32px] bg-[#FDFBF4] border border-[rgba(197,160,89,0.35)] overflow-hidden relative p-5 sm:p-7 text-center box-border"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Top Close Button */}
          <button
            type="button"
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] flex items-center justify-center text-[#786C5E] hover:text-[#1A3E72] transition-colors border border-[rgba(197,160,89,0.18)]"
            onClick={() => setSelectedResponse(null)}
            aria-label={tr('dashboard.responses.drawerClose')}
          >
            <X size={15} strokeWidth={2.4} />
          </button>

          {/* Respondent Avatar & Archetype Badge */}
          <div className="flex flex-col items-center gap-2 pt-1 pb-1">
            <div className="relative">
              <img
                src={anonimLogo}
                alt={tr('common.anonymous')}
                className="w-13 h-13 sm:w-15 sm:h-15 rounded-full object-contain shadow-sm border-[2px] border-[rgba(197,160,89,0.45)] ring-2 ring-[rgba(26,62,114,0.06)]"
              />
              <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full bg-[#16222F] border-2 border-[#FDFBF4] flex items-center justify-center text-[#C5A059] shadow-sm">
                <Lock size={10} strokeWidth={2.5} />
              </div>
            </div>

            <div className="flex flex-col items-center gap-0.5 sm:gap-1">
              <span className="font-sans text-[9.5px] uppercase tracking-[0.15em] font-bold text-[#8C6D37]">
                {tr('dashboard.responses.individualAnalysis')}
              </span>
              <h3 className="font-serif text-[1.25rem] sm:text-[1.45rem] font-bold text-[#1A3E72] m-0 tracking-tight leading-tight">
                {getObject('readerStyles', selectedResponse.readerType)?.name || selectedResponse.readerType.replace('_', ' ').toUpperCase()}
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 mt-0.5 rounded-full text-[10.5px] sm:text-[11px] font-sans font-bold bg-[#8C6D37]/[0.08] text-[#8C6D37] border border-[#8C6D37]/20">
                {tr('dashboard.responses.matchRate', { accuracy: getSessionCalibratedAccuracy(selectedResponse) })}
              </span>
            </div>
          </div>

          {/* Feature Teasers List */}
          <div className="my-3.5 sm:my-4 py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-[18px] sm:rounded-[20px] bg-[#F7F2E7]/85 border border-[rgba(197,160,89,0.22)] text-left flex flex-col gap-2 sm:gap-2.5 box-border">
            <div className="flex items-center gap-2 sm:gap-2.5 text-[11.5px] sm:text-[12px] text-[#334155] font-medium">
              <Sparkles size={13} className="text-[#C5A059] shrink-0" />
              <span>{tr('dashboard.responses.answersAcrossQuestions')}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5 text-[11.5px] sm:text-[12px] text-[#334155] font-medium">
              <Timer size={13} className="text-[#C5A059] shrink-0" />
              <span>{tr('dashboard.responses.decisionDurations')}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5 text-[11.5px] sm:text-[12px] text-[#334155] font-medium">
              <ShieldCheck size={13} className="text-[#C5A059] shrink-0" />
              <span>{tr('dashboard.responses.archetypeDeviations')}</span>
            </div>
          </div>

          {/* Unlock CTA Button */}
          <div className="relative pt-1.5">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-[#16222F] text-[8px] font-black tracking-[0.14em] uppercase shadow-sm">
                {tr('common.oneTime').toUpperCase()}
              </span>
            </div>

            <button
              type="button"
              disabled={isCheckoutLoading}
              onClick={() => {
                if (isCheckoutLoading) return;
                handleUpgradeToPlus();
              }}
              className="w-full py-2.5 sm:py-3.5 px-4 sm:px-5 rounded-full bg-[#16222F] hover:bg-[#0E1721] text-white font-sans text-[13px] sm:text-[14px] font-bold tracking-wide shadow-[0_8px_20px_rgba(22,34,47,0.22)] hover:shadow-[0_12px_28px_rgba(22,34,47,0.32)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 border border-[#C5A059]/30"
              style={isCheckoutLoading ? { opacity: 0.9, cursor: 'wait' } : {}}
            >
              {isCheckoutLoading ? (
                <span className="inline-flex items-center gap-2">
                  <ButtonSpinner size={15} />
                  <span>{tr('common.processing')}</span>
                </span>
              ) : (
                <>
                  <span>{tr('dashboard.responses.unlockDetailsWithPlus')}</span>
                  <ArrowRight size={14} strokeWidth={2.4} className="text-[#C5A059]" />
                </>
              )}
            </button>
          </div>

          {/* Privacy Guarantee Note */}
          <div className="mt-3 sm:mt-3.5 pt-2.5 sm:pt-3 border-t border-[#EFE8DC] flex items-center justify-center gap-1.5 text-[10.5px] sm:text-[11px] text-[#8C9AA8] font-medium">
            <ShieldCheck size={13} className="text-[#C5A059] shrink-0" />
            <span>{tr('dashboard.responses.privacyGuardTeaser')}</span>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // 2. PLUS USER FULL BREAKDOWN MODAL
  const detailSignals = [
    { key: 'samimiyet', label: tr('common.signals.samimiyet') },
    { key: 'cekicilik', label: tr('common.signals.cekicilik') },
    { key: 'zeka', label: tr('common.signals.zeka') },
    { key: 'vizyon', label: tr('common.signals.vizyon') },
    { key: 'enerji', label: tr('common.signals.enerji') },
    { key: 'guvenilirlik', label: tr('common.signals.guvenilirlik') },
    { key: 'ego', label: tr('common.signals.ego') },
    { key: 'basari', label: tr('common.signals.basari') },
    { key: 'comertlik', label: tr('common.signals.comertlik') },
    { key: 'olgunluk', label: tr('common.signals.olgunluk') }
  ];
  const responseSignals = selectedResponse.signals || {};
  const timeEntries = Object.entries(selectedResponse.friendTimeAnalytics || {})
    .filter(([, value]) => value && value > 0);
  const slowestEntry = timeEntries.reduce((winner, entry) => (!winner || entry[1] > winner[1] ? entry : winner), null);
  const fastestEntry = timeEntries.reduce((winner, entry) => (!winner || entry[1] < winner[1] ? entry : winner), null);
  const signalLabelByKey = Object.fromEntries(detailSignals.map((signal) => [signal.key, signal.label]));
  const readerName = getObject('readerStyles', selectedResponse.readerType)?.name || selectedResponse.readerType.replace('_', ' ').toUpperCase();
  const accuracyScore = getSessionCalibratedAccuracy(selectedResponse);
  const relativeTime = getRelativeTime(selectedResponse.completedAt);
  const isAnonymous = !selectedResponse.nickname || selectedResponse.nickname === 'unknown_person';
  const displayName = selectedResponse.nickname;
  const initialLetter = !isAnonymous && displayName && displayName !== '?' ? displayName.charAt(0).toUpperCase() : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-[#0A1118]/65 transition-all duration-300"
      onClick={() => setSelectedResponse(null)}
    >
      <div
        className="w-full max-w-[540px] max-h-[88vh] rounded-[24px] sm:rounded-[34px] bg-[#FDFBF4] border border-[rgba(197,160,89,0.35)] flex flex-col overflow-hidden relative box-border text-left"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header Profile Section */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-[#EFE8DC] bg-[#FDFBF4] flex items-center justify-between shrink-0 relative">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 pr-8">
            {initialLetter ? (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#F5EFE4] to-[#EAE1D2] border-[1.5px] border-[rgba(197,160,89,0.45)] flex items-center justify-center shrink-0 text-[#1A3E72] font-serif font-bold text-[14px] sm:text-[16px]">
                <span>{initialLetter}</span>
              </div>
            ) : (
              <img
                src={anonimLogo}
                alt={tr('common.anonymous')}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-contain shrink-0 shadow-sm border-[1.5px] border-[rgba(197,160,89,0.45)] ring-1 ring-[rgba(26,62,114,0.08)]"
              />
            )}

            <div className="min-w-0">
              <span className="font-sans text-[9px] sm:text-[9.5px] uppercase tracking-[0.14em] font-bold text-[#8C6D37] block">
                {tr('dashboard.responses.individualReflectionDetail')}
              </span>
              <h3 className="font-serif text-[1.15rem] sm:text-[1.4rem] font-bold text-[#1A3E72] m-0 truncate leading-tight">
                {!isAnonymous ? `${displayName} · ${readerName}` : readerName}
              </h3>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-sans font-bold bg-[#8C6D37]/[0.08] text-[#8C6D37] border border-[#8C6D37]/20">
                  {tr('dashboard.responses.matchRate', { accuracy: accuracyScore })}
                </span>
                <span className="font-sans text-[10.5px] sm:text-[11px] text-[#8C9AA8]">
                  • {relativeTime}
                </span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] flex items-center justify-center text-[#786C5E] hover:text-[#1A3E72] transition-colors border border-[rgba(197,160,89,0.18)]"
            onClick={() => setSelectedResponse(null)}
            aria-label={tr('dashboard.responses.drawerClose')}
          >
            <X size={15} strokeWidth={2.4} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 box-border">
          {/* Signal Distribution */}
          <div className="p-3.5 sm:p-5 rounded-[20px] sm:rounded-[22px] bg-white border border-[rgba(197,160,89,0.25)] shadow-[0_2px_12px_rgba(80,60,40,0.03)] flex flex-col gap-2.5 sm:gap-3">
            <div className="pb-1 border-b border-[#EFE8DC]">
              <h4 className="font-serif text-[1rem] sm:text-[1.05rem] font-bold text-[#1A3E72] m-0">
                {tr('dashboard.responses.signalsDistributionTitle')}
              </h4>
              <p className="font-sans text-[11px] sm:text-[11.5px] text-[#64748B] m-0 mt-0.5">
                {tr('dashboard.responses.signalsDistributionDesc')}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:gap-2.5 pt-1">
              {detailSignals.map((signal) => {
                const value = responseSignals[signal.key] !== undefined ? responseSignals[signal.key] : 3;
                const percent = calibrateTraitScore(signal.key, value);
                return (
                  <div key={signal.key} className="flex items-center justify-between gap-2.5 sm:gap-3 text-[11.5px] sm:text-[12px]">
                    <span className="font-sans font-semibold text-[#334155] w-22 sm:w-28 shrink-0 truncate">
                      {signal.label}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-[#EFE8DC] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#C5A059] to-[#1A3E72] transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] sm:text-[11.5px] font-bold text-[#1A3E72] w-9 sm:w-10 text-right shrink-0">
                      %{percent}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Decision & Cognitive Rhythm */}
          {timeEntries.length > 0 && (
            <div className="p-3.5 sm:p-5 rounded-[20px] sm:rounded-[22px] bg-white border border-[rgba(197,160,89,0.25)] shadow-[0_2px_12px_rgba(80,60,40,0.03)] flex flex-col gap-2.5 sm:gap-3">
              <div className="pb-1 border-b border-[#EFE8DC]">
                <h4 className="font-serif text-[1rem] sm:text-[1.05rem] font-bold text-[#1A3E72] m-0">
                  {tr('dashboard.responses.cognitiveRhythmTitle')}
                </h4>
                <p className="font-sans text-[11px] sm:text-[11.5px] text-[#64748B] m-0 mt-0.5">
                  {tr('dashboard.responses.cognitiveRhythmDesc')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                {slowestEntry && (
                  <div className="p-3 sm:p-3.5 rounded-[16px] sm:rounded-[18px] bg-[#FDFBF4] border border-[rgba(197,160,89,0.28)] shadow-[0_2px_8px_rgba(80,60,40,0.02)] flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-[#8C6D37] text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider">
                      <Timer size={12} className="text-[#C5A059]" />
                      <span>{tr('dashboard.responses.longestPause')}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-serif text-[1rem] sm:text-[1.05rem] font-bold text-[#1A3E72] truncate">
                        {signalLabelByKey[slowestEntry[0]] || slowestEntry[0]}
                      </span>
                      <span className="font-mono text-[12px] sm:text-[12.5px] font-bold text-[#8C6D37] shrink-0">
                        {(slowestEntry[1] / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                )}

                {fastestEntry && (
                  <div className="p-3 sm:p-3.5 rounded-[16px] sm:rounded-[18px] bg-[#FDFBF4] border border-[rgba(197,160,89,0.28)] shadow-[0_2px_8px_rgba(80,60,40,0.02)] flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-[#8C6D37] text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider">
                      <Zap size={12} className="text-[#C5A059]" />
                      <span>{tr('dashboard.responses.fastestAnswer')}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-serif text-[1rem] sm:text-[1.05rem] font-bold text-[#1A3E72] truncate">
                        {signalLabelByKey[fastestEntry[0]] || fastestEntry[0]}
                      </span>
                      <span className="font-mono text-[12px] sm:text-[12.5px] font-bold text-[#8C6D37] shrink-0">
                        {(fastestEntry[1] / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
});

export default ResponseDetailDrawer;
