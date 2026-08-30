import React, { useState, useEffect } from 'react';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';
import { getPublicDashboard, incrementProfileClick, checkEligibility, getBrowserFingerprint } from '../services/api';
import { CARD_IMAGES } from '../images/cardImages';
import { getAvatarSrc } from '../images/avatars';
import { getCardRarityData } from '../utils/rarityEngine';
import { calibrateTraitScore } from '../utils/psychometrics';
import { SignalBadgeIcon } from '../components/SignalBadgeIcon';
import { useSeenlyShare, buildWhatsAppLink } from '../hooks/useSeenlyShare';

const SIGNATURE_IMAGES = CARD_IMAGES;

const CharacterBalanceBanner = ({ signals, langCode }) => {
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
          {/* Header Row */}
          <div className="flex items-center justify-center text-center w-full pb-2.5 sm:pb-3 mb-1 border-b border-[#EFE8DC]">
            <span
              className="text-[11.5px] sm:text-[12px] font-bold uppercase tracking-[0.08em] text-[#8C6D37]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {langCode === 'tr' ? 'En Güçlü 3 Yönü' : 'Top 3 Strengths'}
            </span>
          </div>

          {/* Strengths List */}
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
          {/* Header Row */}
          <div className="flex items-center justify-center text-center w-full pb-2.5 sm:pb-3 mb-1 border-b border-[#EFE8DC]">
            <span
              className="text-[11.5px] sm:text-[12px] font-bold uppercase tracking-[0.08em] text-[#4A5568]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {langCode === 'tr' ? 'En Zayıf 3 Yönü' : 'Top 3 Weakest Traits'}
            </span>
          </div>

          {/* Weaknesses List */}
          <div className="flex flex-col w-full">
            {bottom3Signals.map((sig, idx) => (
              <div
                key={sig.key}
                className="w-full flex items-center justify-between py-2 sm:py-2.5 border-b border-[#F4EFE6] last:border-b-0 transition-colors duration-150"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div
                    className="w-[22px] h-[22px] sm:w-[25px] sm:h-[25px] rounded-full flex items-center justify-center flex-shrink-0 text-[10.5px] sm:text-[11px] font-bold"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      backgroundColor: idx === 0 ? '#4A5568' : idx === 1 ? 'rgba(113, 128, 150, 0.18)' : 'rgba(113, 128, 150, 0.10)',
                      color: idx === 0 ? '#FFFFFF' : '#4A5568',
                      border: idx === 0 ? '1px solid #374151' : '1px solid rgba(113, 128, 150, 0.28)',
                      boxShadow: idx === 0 ? '0 2px 6px rgba(74, 85, 104, 0.25)' : 'none'
                    }}
                  >
                    {idx + 1}
                  </div>
                  <span className="font-serif text-[14px] sm:text-[15px] font-semibold text-[#2D3748] truncate">
                    {sig.label}
                  </span>
                </div>

                <span
                  className="px-2.5 py-0.5 sm:px-3 sm:py-0.8 rounded-full text-[11.5px] sm:text-[12.5px] font-bold tabular-nums text-center flex-shrink-0"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: '#4A5568',
                    backgroundColor: 'rgba(113, 128, 150, 0.10)',
                    border: '1px solid rgba(113, 128, 150, 0.22)'
                  }}
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
};

const SocialSignalsPanel = ({ signals, archetypeName, langCode }) => {
  return (
    <div className="seenly-dashboard-premium-card seenly-dashboard-signal-card seenly-wide-signal-card p-4 sm:p-6 flex flex-col rounded-[24px] sm:rounded-[32px] flex-1 box-border" style={{
      background: '#FDFBF4',
      border: '1px solid rgba(197, 160, 89, 0.28)',
      boxShadow: '0 8px 28px rgba(80, 60, 40, 0.04)'
    }}>
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
};

const LockedMask = ({ title, description, responseCount, targetCount, langCode }) => {
  return (
    <div className="seenly-dashboard-locked-mask p-6 sm:p-12 md:p-14 text-center w-full min-h-[320px] sm:min-h-[360px] flex flex-col items-center justify-center relative overflow-hidden box-border rounded-[24px] sm:rounded-[32px]" style={{
      background: 'linear-gradient(135deg, rgba(253, 251, 247, 0.88) 0%, rgba(245, 237, 230, 0.65) 100%)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(197, 160, 89, 0.25)',
      boxShadow: '0 12px 36px rgba(80, 60, 40, 0.04)'
    }}>
      {/* Decorative background dashed ring */}
      <div style={{
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
      }}></div>

      <div className="relative z-10 flex flex-col items-center max-w-[420px] mx-auto">
        {/* Glowing Padlock Icon Wrapper */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 sm:mb-5 text-[#8C6D37]" style={{
          background: 'linear-gradient(135deg, rgba(228, 196, 136, 0.25) 0%, rgba(26, 62, 114, 0.08) 100%)',
          border: '1.5px solid rgba(197, 160, 89, 0.35)',
          boxShadow: '0 6px 20px rgba(197, 160, 89, 0.15)'
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[28px] sm:h-[28px]">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {/* Lock Title */}
        <h4 className="font-serif text-[1.35rem] sm:text-[1.65rem] font-bold text-[#1A3E72] m-0 mb-2 tracking-tight leading-snug">
          {title}
        </h4>

        {/* Description */}
        <p className="font-sans text-[0.85rem] sm:text-[0.92rem] text-[#4A5568] leading-relaxed m-0 mb-5 max-w-[340px] opacity-90">
          {description}
        </p>

        {/* Progress pill indicator */}
        <div className="inline-flex items-center gap-2 sm:gap-2.5 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full font-sans text-xs sm:text-[13px] font-bold text-[#1A3E72] bg-white/80 border border-[rgba(197,160,89,0.3)] shadow-[0_2px_10px_rgba(80,60,40,0.04)]">
          <span className="text-[12px] sm:text-[13px]">🔒</span>
          <span>{responseCount} / {targetCount}</span>
          <span className="text-[#8C6D37] font-medium border-l border-[rgba(197,160,89,0.3)] pl-2">
            {langCode === 'tr' ? 'Yanıt Toplandı' : 'Responses Received'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function FriendIntroPage({ slug, onStart }) {
  const { locale: langCode, t, getObject } = useLocale();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const { handleInstagramStory, isGenerating } = useSeenlyShare();

  useEffect(() => {
    if (!slug) {
      setError('Slug is missing.');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      incrementProfileClick(slug);
      try {
        const data = await getPublicDashboard(slug);
        setSnapshot(data);
        
        // Also check eligibility with the backend (spam and self-evaluation)
        const fingerprint = getBrowserFingerprint();
        const eligibility = await checkEligibility(slug, fingerprint);
        if (eligibility && eligibility.eligible === false) {
           setHasEvaluated(true);
           // We also append to local storage to keep it in sync
           try {
             const evaluatedStr = localStorage.getItem('seenly_evaluated_slugs');
             let evaluatedSlugs = [];
             if (evaluatedStr) evaluatedSlugs = JSON.parse(evaluatedStr);
             if (!evaluatedSlugs.includes(slug)) {
               evaluatedSlugs.push(slug);
               localStorage.setItem('seenly_evaluated_slugs', JSON.stringify(evaluatedSlugs));
             }
           } catch(e) { /* ignore */ }
        }

      } catch (err) {
        setError(err.message || 'Error loading dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  const handleStart = () => {
    onStart('');
  };

  const calculatePersonalityCard = (scores) => {
    if (!scores || Object.keys(scores).length === 0) {
      return 'the_safe_haven';
    }

    const cardSignalsList = [
      { id: "the_leader", signals: ["basari", "olgunluk"] },
      { id: "the_visionary", signals: ["vizyon", "zeka"] },
      { id: "the_magnet", signals: ["cekicilik", "enerji"] },
      { id: "the_safe_haven", signals: ["guvenilirlik", "samimiyet"] },
      { id: "the_social_star", signals: ["samimiyet", "enerji"] },
      { id: "the_elite_mind", signals: ["vizyon", "ego"] },
      { id: "the_noble_heart", signals: ["comertlik", "samimiyet"] },
      { id: "the_silent_king", signals: ["olgunluk", "zeka"] },
      { id: "the_alpha_achiever", signals: ["basari", "ego"] },
      { id: "the_benevolent_guide", signals: ["comertlik", "olgunluk"] },
      { id: "the_ice_queen_king", signals: ["cekicilik", "ego"] },
      { id: "the_mastermind", signals: ["zeka", "enerji"] },
      { id: "the_playmaker", signals: ["vizyon", "basari"] },
      { id: "the_sweetheart", signals: ["samimiyet", "cekicilik"] },
      { id: "the_empath", signals: ["samimiyet", "zeka"] },
      { id: "the_dreamer", signals: ["samimiyet", "vizyon"] },
      { id: "the_proud_friend", signals: ["samimiyet", "ego"] },
      { id: "the_ambitious_sweetheart", signals: ["samimiyet", "basari"] },
      { id: "the_calm_harbor", signals: ["samimiyet", "olgunluk"] },
      { id: "the_seductive_mind", signals: ["cekicilik", "zeka"] },
      { id: "the_aesthetic", signals: ["cekicilik", "vizyon"] },
      { id: "the_charming_anchor", signals: ["cekicilik", "guvenilirlik"] },
      { id: "the_star_player", signals: ["cekicilik", "basari"] },
      { id: "the_party_host", signals: ["cekicilik", "comertlik"] },
      { id: "the_mature_charm", signals: ["cekicilik", "olgunluk"] },
      { id: "the_consultant", signals: ["zeka", "guvenilirlik"] },
      { id: "the_know_it_all", signals: ["zeka", "ego"] },
      { id: "the_strategist", signals: ["zeka", "basari"] },
      { id: "the_intellectual_giver", signals: ["zeka", "comertlik"] },
      { id: "the_innovator", signals: ["vizyon", "enerji"] },
      { id: "the_idealist", signals: ["vizyon", "guvenilirlik"] },
      { id: "the_philanthropist", signals: ["vizyon", "comertlik"] },
      { id: "the_philosopher", signals: ["vizyon", "olgunluk"] },
      { id: "the_golden_retriever", signals: ["enerji", "guvenilirlik"] },
      { id: "the_showman", signals: ["enerji", "ego"] },
      { id: "the_powerhouse", signals: ["enerji", "basari"] },
      { id: "the_life_giver", signals: ["enerji", "comertlik"] },
      { id: "the_steady_vibe", signals: ["enerji", "olgunluk"] },
      { id: "the_gatekeeper", signals: ["guvenilirlik", "ego"] },
      { id: "the_pillar", signals: ["guvenilirlik", "basari"] },
      { id: "the_helper", signals: ["guvenilirlik", "comertlik"] },
      { id: "the_protector", signals: ["guvenilirlik", "olgunluk"] },
      { id: "the_proud_patron", signals: ["ego", "comertlik"] },
      { id: "the_stoic_king", signals: ["ego", "olgunluk"] },
      { id: "the_patron", signals: ["basari", "comertlik"] }
    ];

    const getPercentage = (key) => {
      const val = scores[key];
      if (val === undefined || val === null) {
        return 50;
      }
      if (val > 1.0001 || val === 1.0) {
        return ((val - 1) / 4) * 100;
      }
      return val * 100;
    };

    let bestCard = null;
    let maxScore = -1;

    cardSignalsList.forEach(card => {
      const p1 = getPercentage(card.signals[0]);
      const p2 = getPercentage(card.signals[1]);
      const score = p1 * p2;

      if (score > maxScore) {
        maxScore = score;
        bestCard = card.id;
      }
    });

    return bestCard || 'the_safe_haven';
  };

  const get10Signals = (lang) => {
    const serverAverages = snapshot?.friendAverages || {};

    const dimensions = [
      { key: 'samimiyet', label: lang === 'tr' ? 'Samimiyet' : 'Sincerity', color: '#8F7BCC' },
      { key: 'cekicilik', label: lang === 'tr' ? 'Çekicilik' : 'Charm', color: '#E06553' },
      { key: 'zeka', label: lang === 'tr' ? 'Zeka' : 'Intellect', color: '#6A53D9' },
      { key: 'vizyon', label: lang === 'tr' ? 'Vizyon' : 'Vision', color: '#7B9FCC' },
      { key: 'enerji', label: lang === 'tr' ? 'Enerji' : 'Energy', color: '#D98A53' },
      { key: 'guvenilirlik', label: lang === 'tr' ? 'Güvenilirlik' : 'Reliability', color: '#7BCCAA' },
      { key: 'ego', label: lang === 'tr' ? 'Ego' : 'Ego', color: '#CC7BBA' },
      { key: 'basari', label: lang === 'tr' ? 'Başarı' : 'Success', color: '#53A6D9' },
      { key: 'comertlik', label: lang === 'tr' ? 'Cömertlik' : 'Generosity', color: '#E5A260' },
      { key: 'olgunluk', label: lang === 'tr' ? 'Olgunluk' : 'Maturity', color: '#8C9D86' }
    ];

    return dimensions.map(d => {
      let val = serverAverages[d.key];

      if (val === undefined || val === null) {
        val = 3.0;
      }

      const visualPercentage = calibrateTraitScore(d.key, val);

      return {
        ...d,
        value: val,
        percentage: visualPercentage
      };
    });
  };

  if (loading) {
    return (
      <AppShell isDashboard={true}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '8rem 1.5rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontStyle: 'italic', color: 'var(--color-text-muted)', margin: 0 }}>
            {t('ui', 'missing_id_fallback')}...
          </p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell isDashboard={true}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '6rem 1.5rem', textAlign: 'center' }}>
          <div className="editorial-card" style={{ maxWidth: '500px', width: '100%', padding: '3rem 2rem' }}>
            <h2 className="editorial-title" style={{ color: 'red', fontSize: '1.75rem', marginBottom: '1.5rem' }}>
              {langCode === 'tr' ? 'Profil Bulunamadı' : 'Seenly Profile Not Found'}
            </h2>
            <p className="editorial-body" style={{ color: 'var(--color-text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
              {langCode === 'tr' ? 'Aradığınız Seenly profili mevcut değil veya silinmiş.' : 'The requested Seenly profile does not exist.'}
            </p>
            <button
              type="button"
              className="btn-editorial"
              onClick={() => window.location.hash = '#/'}
              style={{ width: '100%' }}
            >
              {langCode === 'tr' ? 'Ana Sayfaya Dön' : 'Back to Home'}
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const capitalizeName = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => {
        if (!word) return '';
        return word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase();
      })
      .join(' ');
  };
  const displayName = capitalizeName(snapshot?.displayName || 'User');
  const avatarSrc = getAvatarSrc(snapshot?.avatar);
  const responseCount = snapshot?.responseCount || 0;
  const isPremium = snapshot?.isPremium || snapshot?.premium || false;
  const maxResponseLimit = snapshot?.maxResponseLimit ?? 100;
  const isCapped = !isPremium && (responseCount >= maxResponseLimit);
  const isLoggedIn = !!localStorage.getItem('seenly_owner_token');

  const activeOutsideSignatureId = calculatePersonalityCard(snapshot?.friendAverages || {});
  const outsideSignature = getObject('signatures', activeOutsideSignatureId);
  const outsideSignatureName = outsideSignature ? outsideSignature.name : t('ui', 'missing_id_fallback');
  const outsideSignatureCardLine = outsideSignature ? outsideSignature.cardLine : "";
  const outsideRarity = getCardRarityData(activeOutsideSignatureId, langCode);

  const getDashboardWhatsAppLink = (cardName) =>
    buildWhatsAppLink(cardName, slug);

  const handleDashboardInstagramStory = (cardName, illustrationSrc) => {
    handleInstagramStory(cardName, illustrationSrc, slug, langCode);
  };

  return (
    <AppShell isDashboard={true} showLogout={false}>
      <div className="seenly-dashboard-page-wrapper">
        <div className="seenly-dashboard-container" style={{ maxWidth: '980px', width: '100%', margin: '0 auto' }}>

          {/* Beautiful Custom Friend Profile Header */}
          <div className="flex flex-col items-center text-center w-full box-border pb-8 pt-8 sm:pt-10 md:pt-14 px-4 sm:px-6">

            {/* Profile Avatar with luxury gold border */}
            {avatarSrc ? (
              <div className="mb-4 relative">
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="seenly-friend-intro-avatar"
                  style={{
                    width: 'clamp(88px, 14vw, 114px)',
                    height: 'clamp(88px, 14vw, 114px)',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3.5px solid rgba(197, 160, 89, 0.45)',
                    boxShadow: '0 10px 32px rgba(80, 60, 40, 0.12)',
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>
            ) : (
              <div
                className="mb-4"
                style={{
                  width: 'clamp(88px, 14vw, 114px)',
                  height: 'clamp(88px, 14vw, 114px)',
                  borderRadius: '50%',
                  backgroundColor: '#1A3E72',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(2.25rem, 5vw, 2.75rem)',
                  fontWeight: 700,
                  boxShadow: '0 10px 32px rgba(80, 60, 40, 0.12)'
                }}
              >
                {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            {/* Display Name */}
            <h2 className="font-serif text-3xl sm:text-[2.75rem] font-black text-[#0b1b2c] m-0" style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {displayName}
            </h2>

            {/* Premium Gold Divider */}
            <div className="flex items-center justify-center gap-3 my-3 sm:my-4 w-full">
              <div className="h-px w-16 bg-black/[0.06]" />
              <span className="text-[10px] text-[#c5a059] opacity-70">✦</span>
              <div className="h-px w-16 bg-black/[0.06]" />
            </div>

            {/* Perception Question */}
            <h3 className="font-serif italic text-lg sm:text-xl font-normal text-[#4A5568] leading-normal m-0" style={{ maxWidth: '640px' }}>
              {langCode === 'tr'
                ? `İnsanların gözünde nasıl biri?`
                : `How are they perceived in the eyes of others?`}
            </h3>

            {/* Top evaluation button / capped warning / evaluated feedback */}
            {hasEvaluated ? (
              <div className="flex flex-col items-center justify-center w-full max-w-[420px] mt-6 sm:mt-7 px-6 sm:px-8 py-6 sm:py-7 box-border" style={{
                background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.55))',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '24px',
                border: '1px solid rgba(197, 160, 89, 0.28)',
                boxShadow: '0 12px 40px rgba(80, 60, 40, 0.05)'
              }}>
                <div className="flex items-center justify-center w-[46px] h-[46px] rounded-full mb-3.5" style={{ background: 'rgba(197, 160, 89, 0.12)', border: '1px solid rgba(197, 160, 89, 0.25)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h4 className="font-serif text-[1.2rem] sm:text-[1.25rem] text-[#1A3E72] m-0 mb-2 font-bold tracking-tight">
                  {langCode === 'tr' ? 'Değerlendirme Tamamlandı' : 'Evaluation Completed'}
                </h4>
                <p className="font-sans text-[0.85rem] sm:text-[0.88rem] text-[#4A5568] leading-relaxed m-0 text-center px-1">
                  {langCode === 'tr' 
                    ? 'Bu kişi için perspektifinizi başarıyla paylaştınız. Katkınız için teşekkür ederiz.' 
                    : 'You have successfully shared your perspective for this person. Thank you for your contribution.'}
                </p>
              </div>
            ) : isCapped ? (
              <div style={{
                width: '100%',
                maxWidth: '460px',
                background: 'linear-gradient(135deg, rgba(11, 27, 44, 0.02) 0%, rgba(11, 27, 44, 0.005) 100%)',
                border: '1px solid rgba(11, 27, 44, 0.1)',
                borderRadius: '20px',
                padding: '1.5rem',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.02)',
                boxSizing: 'border-box',
                marginTop: '1.5rem'
              }}>
                <h4 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  color: 'var(--color-deep-ink)',
                  margin: '0 0 0.5rem 0'
                }}>
                  {langCode === 'tr' ? 'Katılımcı Kotası Dolu' : 'Respondent Capacity Full'}
                </h4>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.82rem',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.5,
                  margin: 0
                }}>
                  {langCode === 'tr'
                    ? `${displayName} adlı kullanıcının profili maksimum katılımcı limitine ulaşmıştır.`
                    : `${displayName}'s profile has reached its maximum participant limit.`}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStart}
                className="w-full max-w-[340px] h-[48px] sm:h-[52px] rounded-full font-sans font-bold text-xs sm:text-[13px] tracking-[0.06em] text-white flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer border-none text-center uppercase hover:-translate-y-0.5"
                style={{
                  background: '#1A3E72',
                  boxShadow: '0 10px 24px rgba(26, 62, 114, 0.22)',
                  marginTop: '1.75rem'
                }}
              >
                <span>{t('ui', 'friend_evaluate_cta')}</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Dashboard Body (Outside Perception) */}
          <div className="seenly-dashboard-body" style={{ padding: '0 1rem sm:0 1.25rem' }}>
            <div className={`seenly-dashboard-tab-content ${responseCount < 3 ? 'full-width-layout' : 'seenly-gap-editorial-content'}`} style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
              {responseCount >= 3 ? (
                <div className="flex flex-col gap-5 w-full box-border">
                  {/* Horizontal General Statistics Banner (Top 3 Strengths & Weaknesses) */}
                  <CharacterBalanceBanner
                    signals={get10Signals(langCode)}
                    langCode={langCode}
                  />

                  {/* Main Flow: Left Archetype Card + Right 10 Social Signals */}
                  <div className="seenly-outside-flow flex flex-col md:flex-row items-stretch justify-center w-full gap-5">
                    {/* Left Column: Archetype Glass Card */}
                    <div className="seenly-outside-summary-wrap flex flex-col items-center z-10 w-full md:w-[340px] lg:w-[350px] flex-shrink-0">
                      <div className="seenly-dashboard-premium-card seenly-outside-summary-card p-4 sm:p-6 flex flex-col items-center justify-between text-center relative rounded-[24px] sm:rounded-[32px] w-full h-full box-border" style={{
                        background: '#FDFBF4',
                        backgroundColor: '#FDFBF4',
                        border: '1px solid rgba(197, 160, 89, 0.25)',
                        boxShadow: '0 8px 30px rgba(80, 60, 40, 0.04)',
                        backdropFilter: 'none',
                        WebkitBackdropFilter: 'none',
                        opacity: 1
                      }}>
                        {/* Top Section: Title + Rarity Pill Badge + Description */}
                        <div className="flex flex-col items-start text-left w-full px-0.5 sm:px-1 mb-2">
                          <div className="flex items-center justify-between gap-2 w-full mb-1.5 flex-nowrap">
                            <h3
                              className="font-serif m-0 whitespace-nowrap"
                              style={{
                                fontSize: 'clamp(1.15rem, 1.8vw, 1.35rem)',
                                fontWeight: 700,
                                color: '#1A3E72',
                                lineHeight: 1.18,
                                letterSpacing: '-0.02em'
                              }}
                            >
                              {outsideSignatureName}
                            </h3>

                            {/* Rarity Pill Badge */}
                            <div
                              className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap transition-all duration-200"
                              style={{
                                backgroundColor: outsideRarity.badgeBg,
                                color: outsideRarity.badgeText,
                                border: `1px solid ${outsideRarity.badgeBorder}`,
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '11px',
                                fontWeight: 600,
                                letterSpacing: '0.01em'
                              }}
                            >
                              <span>{outsideRarity.badgeLabel}</span>
                            </div>
                          </div>

                          {outsideSignatureCardLine && (
                            <p
                              className="m-0 max-w-[295px] mt-1"
                              style={{
                                fontFamily: "'Newsreader', Georgia, serif",
                                fontSize: '14px',
                                lineHeight: '1.5',
                                color: '#4B5568',
                                fontWeight: 400,
                                letterSpacing: '0.01em'
                              }}
                            >
                              {outsideSignatureCardLine}
                            </p>
                          )}
                        </div>

                        {/* Middle Artwork - Seamless Organic Watercolor Vignette (Multiply & Soft Feather) */}
                        <div
                          className="relative w-full max-w-[280px] sm:max-w-[315px] flex items-center justify-center my-1 sm:my-2"
                          style={{
                            WebkitMaskImage: 'radial-gradient(circle at center, black 48%, rgba(0, 0, 0, 0.8) 66%, transparent 90%)',
                            maskImage: 'radial-gradient(circle at center, black 48%, rgba(0, 0, 0, 0.8) 66%, transparent 90%)',
                          }}
                        >
                          <img
                            src={SIGNATURE_IMAGES[activeOutsideSignatureId]}
                            alt={outsideSignatureName}
                            className="w-full h-auto object-contain pointer-events-none select-none scale-[1.03] sm:scale-[1.04]"
                            style={{
                              mixBlendMode: 'multiply',
                              WebkitMaskImage: 'radial-gradient(circle at center, black 48%, rgba(0, 0, 0, 0.8) 66%, transparent 90%)',
                              maskImage: 'radial-gradient(circle at center, black 48%, rgba(0, 0, 0, 0.8) 66%, transparent 90%)',
                            }}
                          />
                        </div>

                        {/* Bottom Action Bar: Harmonized Navy & Porcelain Action Bar */}
                        <div className="flex items-center justify-between gap-2 sm:gap-2.5 w-full mt-auto pt-2 box-border">
                          <button
                            type="button"
                            onClick={() => {
                              localStorage.setItem('seenly_selected_identity', activeOutsideSignatureId);
                              window.location.hash = '#/identities';
                            }}
                            className="flex-1 h-[42px] sm:h-[46px] px-3 sm:px-4 rounded-full text-white flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                            style={{
                              background: '#1A3E72',
                              boxShadow: '0 4px 14px rgba(26, 62, 114, 0.22)',
                              fontFamily: "'Inter', sans-serif",
                              fontSize: '12px',
                              fontWeight: 500,
                              letterSpacing: '0.02em'
                            }}
                          >
                            <span>{langCode === 'tr' ? 'Detaylı Analizi Gör' : 'View Detailed Analysis'}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="ml-1 flex-shrink-0 opacity-95">
                              <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          </button>

                          {/* Share Button */}
                          <a
                            href={getDashboardWhatsAppLink(outsideSignatureName)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-[42px] sm:w-[46px] h-[42px] sm:h-[46px] rounded-[14px] sm:rounded-[16px] flex items-center justify-center text-[#1A3E72] transition-all duration-200 flex-shrink-0 hover:bg-[#F4F7FC] hover:border-[rgba(26,62,114,0.35)] hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid rgba(26, 62, 114, 0.16)',
                              boxShadow: '0 4px 14px rgba(26, 62, 114, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)'
                            }}
                            title={langCode === 'tr' ? "Paylaş" : "Share"}
                          >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
                              <polyline points="16 6 12 2 8 6" />
                              <line x1="12" y1="2" x2="12" y2="15" />
                            </svg>
                          </a>

                          {/* Bookmark / Save Button */}
                          <button
                            type="button"
                            onClick={() => handleDashboardInstagramStory(outsideSignatureName, SIGNATURE_IMAGES[activeOutsideSignatureId])}
                            disabled={isGenerating}
                            className="w-[42px] sm:w-[46px] h-[42px] sm:h-[46px] rounded-[14px] sm:rounded-[16px] flex items-center justify-center text-[#1A3E72] transition-all duration-200 flex-shrink-0 hover:bg-[#F4F7FC] hover:border-[rgba(26,62,114,0.35)] hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid rgba(26, 62, 114, 0.16)',
                              boxShadow: '0 4px 14px rgba(26, 62, 114, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
                              opacity: isGenerating ? 0.5 : 1
                            }}
                            title={langCode === 'tr' ? "Kaydet / Hikaye Oluştur" : "Save / Create Story"}
                          >
                            {isGenerating ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                              </svg>
                            ) : (
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: 10 Social Signals in Grid */}
                    <SocialSignalsPanel
                      signals={get10Signals(langCode)}
                      archetypeName={outsideSignatureName}
                      langCode={langCode}
                    />
                  </div>
                </div>
              ) : (
                <div className="seenly-dashboard-locked-state" style={{ width: '100%' }}>
                  <LockedMask
                    title={t('ui', 'locked_section_title')}
                    description={langCode === 'tr'
                      ? `Bu kişinin profilinin açılması için en az 3 arkadaşının anketi tamamlaması gerekir.`
                      : `At least 3 friends must complete the quiz to unlock this profile.`}
                    responseCount={responseCount}
                    targetCount={3}
                    langCode={langCode}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action CTA Button Section: Create your own link */}
          {!isLoggedIn && (
            <div style={{
              marginTop: '3rem',
              marginBottom: '2rem',
              padding: '0 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <button
                type="button"
                onClick={() => window.location.hash = '#/'}
                className="font-sans font-bold text-xs sm:text-[13px] tracking-[0.06em] text-[#1A3E72] transition-all duration-200 cursor-pointer text-center uppercase hover:text-[#C5A059]"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '8px 16px',
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px'
                }}
              >
                {t('ui', 'friend_create_own_link')}
              </button>
            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
}
