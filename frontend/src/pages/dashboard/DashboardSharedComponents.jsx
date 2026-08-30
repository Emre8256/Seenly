import React, { memo } from 'react';
import { Info, Lock } from 'lucide-react';
import SignalBadgeIcon from '../../components/SignalBadgeIcon';

export const TabInfoNotice = memo(function TabInfoNotice({ icon: Icon = Info, children }) {
  return (
    <div className="flex items-center justify-center w-full my-1 px-2 box-border">
      <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#FDFBF4] border border-[rgba(197,160,89,0.28)] shadow-[0_2px_10px_rgba(80,60,40,0.03)] max-w-full text-left">
        <Icon size={14} strokeWidth={2.3} className="text-[#c5a059] shrink-0 mt-[1px] sm:mt-0" />
        <span className="font-sans text-[12px] sm:text-[12.8px] text-[#4b5563] font-medium leading-snug sm:leading-none whitespace-normal sm:whitespace-nowrap tracking-[-0.01em] text-left">
          {children}
        </span>
      </div>
    </div>
  );
});

export const LockedMask = memo(function LockedMask({ title, description, responseCount, targetCount, langCode }) {
  return (
    <div
      className="seenly-dashboard-locked-mask p-6 sm:p-12 md:p-14 text-center w-full min-h-[320px] sm:min-h-[360px] flex flex-col items-center justify-center relative overflow-hidden box-border rounded-[24px] sm:rounded-[32px]"
      style={{
        background: '#FDFBF7',
        border: '1px solid rgba(197, 160, 89, 0.25)',
        boxShadow: '0 12px 36px rgba(80, 60, 40, 0.04)'
      }}
    >
      {/* Decorative background dashed ring */}
      <div
        style={{
          position: 'absolute',
          width: 'min(320px, 80vw)',
          height: 'min(320px, 80vw)',
          borderRadius: '50%',
          border: '1px dashed rgba(197, 160, 89, 0.2)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-[420px] mx-auto">
        {/* Glowing Padlock Icon Wrapper */}
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 sm:mb-5 text-[#8C6D37]"
          style={{
            background: 'linear-gradient(135deg, rgba(228, 196, 136, 0.25) 0%, rgba(26, 62, 114, 0.08) 100%)',
            border: '1.5px solid rgba(197, 160, 89, 0.35)',
            boxShadow: '0 8px 24px rgba(197, 160, 89, 0.15)'
          }}
        >
          <Lock size={24} strokeWidth={1.9} />
        </div>

        {/* Lock Title */}
        <h4 className="font-serif text-[1.35rem] sm:text-[1.65rem] font-bold text-[#1A3E72] mb-2 leading-tight tracking-tight">
          {title}
        </h4>

        {/* Description */}
        <p className="font-sans text-[0.88rem] sm:text-[0.94rem] text-[#4A5568] leading-relaxed mb-5 max-w-[340px] sm:max-w-[380px]">
          {description}
        </p>

        {/* Progress pill indicator */}
        <div className="inline-flex items-center gap-2 bg-[#F4EFE6] border border-[rgba(197,160,89,0.28)] px-4 py-2 rounded-full font-sans text-[0.82rem] sm:text-[0.86rem] font-bold text-[#1A3E72] shadow-xs">
          <span>🔒</span>
          <span>{responseCount} / {targetCount}</span>
          <span className="opacity-70 font-normal">
            {langCode === 'tr' ? 'Yanıt Toplandı' : 'Responses Received'}
          </span>
        </div>
      </div>
    </div>
  );
});

export const CharacterBalanceBanner = memo(function CharacterBalanceBanner({ signals, langCode }) {
  const sortedSignals = [...signals].sort((a, b) => b.percentage - a.percentage);
  const top3Signals = sortedSignals.slice(0, 3);
  const bottom3Signals = [...sortedSignals].reverse().slice(0, 3);

  return (
    <div
      className="seenly-dashboard-premium-card w-full p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] box-border mb-1"
      style={{
        background: '#FDFBF4',
        border: '1px solid rgba(197, 160, 89, 0.22)',
        boxShadow: '0 8px 30px rgba(80, 60, 40, 0.04)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none'
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 relative">
        {/* Perfectly Centered Vertical Divider */}
        <div className="hidden md:block absolute top-2 bottom-2 left-1/2 w-[1px] bg-[#EFE8DC] -translate-x-1/2 pointer-events-none" />

        {/* Left Column: Top 3 Strengths */}
        <div className="flex flex-col w-full md:pr-4">
          <div className="flex items-center justify-center text-center w-full pb-2.5 sm:pb-3 mb-1 border-b border-[#EFE8DC]">
            <span
              className="text-[11.5px] sm:text-[12px] font-bold uppercase tracking-[0.08em] text-[#8C6D37]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {langCode === 'tr' ? 'En Güçlü 3 Yönünüz' : 'Top 3 Strengths'}
            </span>
          </div>

          <div className="flex flex-col w-full">
            {top3Signals.map((sig, idx) => (
              <div
                key={sig.key}
                className="w-full flex items-center justify-between py-2 sm:py-2.5 border-b border-[#F4EFE6] last:border-b-0 transition-colors duration-150"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div
                    className="w-[22px] h-[22px] sm:w-[25px] sm:h-[25px] rounded-full flex items-center justify-center flex-shrink-0 text-[10.5px] sm:text-[11px] font-bold transition-transform"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      backgroundColor: idx === 0 ? '#C5A059' : idx === 1 ? 'rgba(197, 160, 89, 0.22)' : 'rgba(197, 160, 89, 0.12)',
                      color: idx === 0 ? '#FFFFFF' : '#8C6D37',
                      border: idx === 0 ? '1px solid #B89243' : '1px solid rgba(197, 160, 89, 0.35)',
                      boxShadow: idx === 0 ? '0 2px 8px rgba(197, 160, 89, 0.25)' : 'none'
                    }}
                  >
                    {idx + 1}
                  </div>
                  <span className="font-serif text-[14px] sm:text-[15px] font-semibold text-[#1A202C] truncate">
                    {sig.label}
                  </span>
                </div>

                <span
                  className="px-2.5 py-0.5 sm:px-3 sm:py-0.8 rounded-full text-[11.5px] sm:text-[12.5px] font-bold tabular-nums text-center flex-shrink-0"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: '#8C6D37',
                    backgroundColor: 'rgba(200, 155, 60, 0.12)',
                    border: '1px solid rgba(200, 155, 60, 0.25)'
                  }}
                >
                  {sig.percentage}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Top 3 Weakest Traits */}
        <div className="flex flex-col w-full md:pl-4">
          <div className="flex items-center justify-center text-center w-full pb-2.5 sm:pb-3 mb-1 border-b border-[#EFE8DC]">
            <span
              className="text-[11.5px] sm:text-[12px] font-bold uppercase tracking-[0.08em] text-[#4A5568]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {langCode === 'tr' ? 'En Zayıf 3 Yönünüz' : 'Top 3 Weakest Traits'}
            </span>
          </div>

          <div className="flex flex-col w-full">
            {bottom3Signals.map((sig, idx) => (
              <div
                key={sig.key}
                className="w-full flex items-center justify-between py-2 sm:py-2.5 border-b border-[#F4EFE6] last:border-b-0 transition-colors duration-150"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div
                    className="w-[22px] h-[22px] sm:w-[25px] sm:h-[25px] rounded-full flex items-center justify-center flex-shrink-0 text-[10.5px] sm:text-[11px] font-bold text-[#718096] bg-[#F4EFE6] border border-[#E2D9CC]"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {idx + 1}
                  </div>
                  <span className="font-serif text-[14px] sm:text-[15px] font-medium text-[#4A5568] truncate">
                    {sig.label}
                  </span>
                </div>

                <span
                  className="px-2.5 py-0.5 sm:px-3 sm:py-0.8 rounded-full text-[11.5px] sm:text-[12.5px] font-semibold tabular-nums text-center text-[#718096] bg-[#F4EFE6] border border-[#E2D9CC] flex-shrink-0"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {sig.percentage}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export const SocialSignalsPanel = memo(function SocialSignalsPanel({ signals, archetypeName, langCode }) {
  return (
    <div
      className="seenly-dashboard-premium-card seenly-dashboard-signal-card seenly-wide-signal-card p-4 sm:p-6 flex flex-col rounded-[24px] sm:rounded-[32px] flex-1 box-border"
      style={{
        background: '#FDFBF4',
        border: '1px solid rgba(197, 160, 89, 0.28)',
        boxShadow: '0 8px 28px rgba(80, 60, 40, 0.04)'
      }}
    >
      {/* Header bar for 10 signals */}
      <div className="flex items-center justify-between w-full pb-2.5 sm:pb-3 mb-2 border-b border-[#EFE8DC]">
        <span
          className="text-[11px] sm:text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#1A3E72]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {langCode === 'tr' ? '10 Sosyal Sinyal Dağılımı' : '10 Social Signal Distribution'}
        </span>
        <span
          className="text-[10px] sm:text-[10.5px] font-semibold text-[#A0988A] uppercase tracking-wider"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {langCode === 'tr' ? 'Puan' : 'Score'}
        </span>
      </div>

      {/* 10 Signals Single Vertical List */}
      <div className="flex flex-col justify-between flex-1 w-full gap-0.5">
        {signals.map((sig) => (
          <div
            key={sig.key}
            className="w-full flex items-center justify-between py-1.5 sm:py-2 border-b border-[#F4EFE6] last:border-b-0 transition-colors duration-150"
          >
            {/* Left: Icon + Label */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <SignalBadgeIcon signalKey={sig.key} size={15} boxSize={32} />
              <span
                className="font-serif text-[13.5px] sm:text-[14.5px] font-semibold text-[#1A202C] whitespace-nowrap"
                style={{ letterSpacing: '-0.01em' }}
              >
                {sig.label}
              </span>
            </div>

            {/* Right: Progress Bar + Score Badge */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-1 justify-end ml-2 sm:ml-3 max-w-[125px] sm:max-w-[155px]">
              <div className="w-full h-[5px] sm:h-[6px] rounded-full bg-[#ECE5D8] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min(100, Math.max(6, sig.percentage))}%`,
                    backgroundColor: sig.color || '#1A3E72'
                  }}
                />
              </div>
              <span
                className="px-1.5 sm:px-2 py-0.5 rounded-md text-[11px] sm:text-[11.5px] font-bold text-[#1A3E72] bg-[rgba(26,62,114,0.08)] tabular-nums min-w-[28px] sm:min-w-[30px] text-center flex-shrink-0"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {sig.percentage}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
