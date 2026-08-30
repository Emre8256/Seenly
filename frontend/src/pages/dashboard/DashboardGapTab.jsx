import React, { memo } from 'react';
import { Minus, TrendingUp, TrendingDown } from 'lucide-react';
import SignalBadgeIcon from '../../components/SignalBadgeIcon';
import { LockedMask } from './DashboardSharedComponents';

const DashboardGapTab = memo(function DashboardGapTab({
  langCode,
  t,
  responseCount,
  gapEditorial,
  gapBlindSpotDesc,
  gapIllusionDesc,
  gapAlignmentDesc
}) {
  return (
    <div className="seenly-dashboard-tab-content full-width-layout scrollable-gap-content seenly-gap-editorial-content" style={{ maxWidth: '880px', width: '100%' }}>
      {responseCount >= 1 ? (
        <div className="flex flex-col gap-4 sm:gap-5 w-full">
          {/* 1. Seamless Embedded Overview Banner */}
          <div
            className="seenly-dashboard-premium-card p-4 sm:p-6 sm:px-8 rounded-[24px] sm:rounded-[28px] w-full flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 box-border"
            style={{
              background: '#FDFBF4',
              border: '1px solid rgba(197, 160, 89, 0.25)',
              boxShadow: '0 6px 24px rgba(80, 60, 40, 0.03)'
            }}
          >
            {/* Left: Title & Subtitle */}
            <div className="text-left flex-1 md:max-w-[530px] shrink-0">
              <h3 className="font-serif text-[1.25rem] sm:text-[1.5rem] font-bold text-[#1A3E72] m-0 tracking-tight leading-tight">
                {langCode === 'tr' ? 'Algı Boşluğu ve Paralellik' : 'Perception Gap & Alignment'}
              </h3>
              <p className="font-sans text-[0.84rem] sm:text-[0.92rem] text-[#4A5568] mt-1 sm:mt-1.5 leading-[1.55] m-0">
                {langCode === 'tr'
                  ? 'Kendi algınız ile arkadaşlarınızın sizde gözlemlediği sosyal sinyaller arasındaki mesafe ve uyumu analiz eder.'
                  : 'Analyzes the distance and alignment between your self-perception and the social signals observed by friends.'
                }
              </p>
            </div>

            {/* Right: Circular Gauge Metric */}
            <div className="flex items-center justify-center shrink-0 self-center sm:self-auto">
              <div className="relative w-[58px] h-[58px] sm:w-[72px] sm:h-[72px] flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#EFE8DC]"
                    strokeWidth="2.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#1A3E72]"
                    strokeWidth="2.5"
                    strokeDasharray={`${gapEditorial.alignmentRatio}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-serif text-[15px] sm:text-[19px] font-bold text-[#1A3E72] tracking-tight">
                  {gapEditorial.alignmentRatio}%
                </span>
              </div>
            </div>
          </div>

          {/* 2. Sinyal Boyut Karşılaştırması */}
          <div
            className="seenly-dashboard-premium-card p-4 sm:p-6 sm:p-7 rounded-[24px] sm:rounded-[32px] w-full flex flex-col box-border"
            style={{
              background: '#FDFBF4',
              border: '1px solid rgba(197, 160, 89, 0.28)',
              boxShadow: '0 8px 28px rgba(80, 60, 40, 0.04)'
            }}
          >
            {/* Header & Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 pb-3 mb-2.5 border-b border-[#EFE8DC]">
              <span
                className="text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.08em] text-[#1A3E72]"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {langCode === 'tr' ? '10 Sinyal Boyut Karşılaştırması' : '10 Signal Dimension Comparison'}
              </span>

              {/* Elegant Legend */}
              <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-[12px] font-semibold text-[#4A5568]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059] shadow-xs" />
                  <span>{langCode === 'tr' ? 'Kendi Algın' : 'Self Perception'}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1A3E72] shadow-xs" />
                  <span>{langCode === 'tr' ? 'Dış Algı' : 'Outside Perception'}</span>
                </span>
              </div>
            </div>

            {/* 10 Clean Comparison Rows */}
            <div className="flex flex-col gap-0.5 sm:gap-1 w-full">
              {gapEditorial.rows.map((row) => {
                const gapDiff = row.friendPosition - row.selfPosition;
                const absGap = Math.abs(gapDiff);
                const isExactMatch = absGap <= 1;
                const isBalanced = absGap <= 2;
                return (
                  <div
                    key={row.key}
                    className="w-full flex items-center justify-between py-1.5 sm:py-2.5 border-b border-[#F4EFE6] last:border-b-0 transition-colors"
                  >
                    {/* Left: Icon + Label */}
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-[88px] sm:min-w-[150px] max-w-[110px] sm:max-w-none">
                      <SignalBadgeIcon signalKey={row.key} size={13} boxSize={26} className="sm:w-[28px] sm:h-[28px]" />
                      <span className="font-serif text-[13px] sm:text-[14.5px] font-semibold text-[#1A202C] truncate">
                        {row.label}
                      </span>
                    </div>

                    {/* Center: Dual-pin Range Track */}
                    <div className="relative flex-1 mx-2 sm:mx-6 h-6 flex items-center">
                      {/* Base track */}
                      <div className="absolute left-0 right-0 h-[4px] sm:h-[5px] rounded-full bg-[#ECE5D8]" />

                      {isExactMatch ? (
                        /* Only for exact collision: Single delicate merged pin */
                        <div
                          className="absolute -translate-x-1/2 flex items-center justify-center w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white shadow-md z-10 transition-transform hover:scale-125 cursor-help"
                          style={{
                            left: `${(row.selfPosition + row.friendPosition) / 2}%`,
                            background: 'linear-gradient(135deg, #C5A059 0%, #1A3E72 100%)'
                          }}
                          title={`${langCode === 'tr' ? 'Birebir Eşleşme' : 'Exact Match'}: %${Math.round((row.selfPosition + row.friendPosition) / 2)}`}
                        />
                      ) : (
                        <>
                          {/* Gap range span */}
                          <div
                            className="absolute h-[4px] sm:h-[5px] rounded-full opacity-70"
                            style={{
                              left: `${Math.min(row.selfPosition, row.friendPosition)}%`,
                              width: `${absGap}%`,
                              background: 'linear-gradient(90deg, #C5A059 0%, #1A3E72 100%)'
                            }}
                          />

                          {/* Self Dot (Gold) */}
                          <div
                            className="absolute -translate-x-1/2 flex items-center justify-center w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#C5A059] border-2 border-white shadow-md z-10 transition-transform hover:scale-125 cursor-help"
                            style={{ left: `${row.selfPosition}%` }}
                            title={`${langCode === 'tr' ? 'Kendi Algın' : 'Self'}: %${row.selfPosition}`}
                          />

                          {/* Outside Dot (Navy) */}
                          <div
                            className="absolute -translate-x-1/2 flex items-center justify-center w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#1A3E72] border-2 border-white shadow-md z-10 transition-transform hover:scale-125 cursor-help"
                            style={{ left: `${row.friendPosition}%` }}
                            title={`${langCode === 'tr' ? 'Dış Algı' : 'Outside'}: %${row.friendPosition}`}
                          />
                        </>
                      )}
                    </div>

                    {/* Right: Modern Dynamic Perspective Capsule */}
                    <div className="min-w-[34px] sm:min-w-[46px] text-right flex-shrink-0 flex items-center justify-end">
                      <span
                        className="h-5 sm:h-6 px-1.5 sm:px-2.5 rounded-full flex items-center justify-center gap-1 inline-flex transition-transform hover:scale-105 cursor-help"
                        style={{
                          backgroundColor: isBalanced
                            ? 'rgba(100, 116, 139, 0.10)'
                            : gapDiff > 0
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'rgba(224, 101, 83, 0.12)',
                          color: isBalanced
                            ? '#64748B'
                            : gapDiff > 0
                              ? '#059669'
                              : '#E05344',
                          border: isBalanced
                            ? '1px solid rgba(100, 116, 139, 0.22)'
                            : gapDiff > 0
                              ? '1px solid rgba(16, 185, 129, 0.30)'
                              : '1px solid rgba(224, 101, 83, 0.30)',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
                        }}
                        title={isBalanced
                          ? (langCode === 'tr' ? 'Uyumlu / Dengeli' : 'Balanced Match')
                          : gapDiff > 0
                            ? (langCode === 'tr' ? 'Dış Algı Daha Yüksek (Yükseliş)' : 'Outside Perceived Higher (Elevated)')
                            : (langCode === 'tr' ? 'Kendi Algın Daha Yüksek (Düşüş)' : 'Self Perceived Higher (Lower Outside)')
                        }
                      >
                        {isBalanced ? (
                          <Minus size={11} strokeWidth={2.8} className="sm:w-[13px] sm:h-[13px]" />
                        ) : gapDiff > 0 ? (
                          <TrendingUp size={11} strokeWidth={2.4} className="sm:w-[13px] sm:h-[13px]" />
                        ) : (
                          <TrendingDown size={11} strokeWidth={2.4} className="sm:w-[13px] sm:h-[13px]" />
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Editorial Analysis 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 w-full">
            {/* 1. Kör Nokta */}
            <div
              className="seenly-dashboard-premium-card p-4 sm:p-5 sm:p-6 rounded-[22px] sm:rounded-[26px] text-left flex flex-col justify-between box-border transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: '#FDFBF4',
                border: '1px solid rgba(197, 160, 89, 0.35)',
                boxShadow: '0 4px 18px rgba(80, 60, 40, 0.04)'
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider bg-[rgba(197,160,89,0.15)] text-[#8C6D37] border border-[rgba(197,160,89,0.3)]">
                    {langCode === 'tr' ? 'KÖR NOKTA' : 'BLIND SPOT'}
                  </span>
                  {gapEditorial.blindSpot?.key && (
                    <SignalBadgeIcon signalKey={gapEditorial.blindSpot.key} size={14} boxSize={26} className="sm:w-[28px] sm:h-[28px]" />
                  )}
                </div>

                <h4 className="font-serif text-[1.18rem] sm:text-[1.3rem] font-bold text-[#1A3E72] tracking-tight mb-1.5 sm:mb-2 m-0">
                  {gapEditorial.blindSpot?.label}
                </h4>

                <p className="font-sans text-[0.82rem] sm:text-[0.85rem] text-[#4A5568] leading-relaxed m-0">
                  {gapBlindSpotDesc}
                </p>
              </div>
            </div>

            {/* 2. Sosyal Maske */}
            <div
              className="seenly-dashboard-premium-card p-4 sm:p-5 sm:p-6 rounded-[22px] sm:rounded-[26px] text-left flex flex-col justify-between box-border transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: '#FDFBF4',
                border: '1px solid rgba(224, 101, 83, 0.3)',
                boxShadow: '0 4px 18px rgba(80, 60, 40, 0.04)'
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider bg-[rgba(224,101,83,0.12)] text-[#D96552] border border-[rgba(224,101,83,0.25)]">
                    {langCode === 'tr' ? 'SOSYAL MASKE' : 'SOCIAL MASK'}
                  </span>
                  {gapEditorial.illusionOfSelf?.key && (
                    <SignalBadgeIcon signalKey={gapEditorial.illusionOfSelf.key} size={14} boxSize={26} className="sm:w-[28px] sm:h-[28px]" />
                  )}
                </div>

                <h4 className="font-serif text-[1.18rem] sm:text-[1.3rem] font-bold text-[#1A3E72] tracking-tight mb-1.5 sm:mb-2 m-0">
                  {gapEditorial.illusionOfSelf?.label}
                </h4>

                <p className="font-sans text-[0.82rem] sm:text-[0.85rem] text-[#4A5568] leading-relaxed m-0">
                  {gapIllusionDesc}
                </p>
              </div>
            </div>

            {/* 3. Senkronizasyon */}
            <div
              className="seenly-dashboard-premium-card p-4 sm:p-5 sm:p-6 rounded-[22px] sm:rounded-[26px] text-left flex flex-col justify-between box-border transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: '#FDFBF4',
                border: '1px solid rgba(26, 62, 114, 0.25)',
                boxShadow: '0 4px 18px rgba(80, 60, 40, 0.04)'
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider bg-[rgba(26,62,114,0.08)] text-[#1A3E72] border border-[rgba(26,62,114,0.2)]">
                    {langCode === 'tr' ? 'TAM UYUM' : 'DEEP SYNC'}
                  </span>
                  {gapEditorial.deepAlignment?.key && (
                    <SignalBadgeIcon signalKey={gapEditorial.deepAlignment.key} size={14} boxSize={26} className="sm:w-[28px] sm:h-[28px]" />
                  )}
                </div>

                <h4 className="font-serif text-[1.18rem] sm:text-[1.3rem] font-bold text-[#1A3E72] tracking-tight mb-1.5 sm:mb-2 m-0">
                  {gapEditorial.deepAlignment?.label}
                </h4>

                <p className="font-sans text-[0.82rem] sm:text-[0.85rem] text-[#4A5568] leading-relaxed m-0">
                  {gapAlignmentDesc}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="seenly-dashboard-locked-state">
          <LockedMask
            title={t('ui', 'locked_section_title')}
            description={t('ui', 'locked_section_gap_desc')}
            responseCount={responseCount}
            targetCount={3}
            langCode={langCode}
          />
        </div>
      )}
    </div>
  );
});

export default DashboardGapTab;
