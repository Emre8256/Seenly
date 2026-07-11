import React, { useState, useEffect } from 'react';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';
import { getPublicDashboard, incrementProfileClick, checkEligibility, getBrowserFingerprint } from '../services/api';
import { CARD_IMAGES } from '../images/cardImages';
import { WatercolorStain, ConnectorDots } from '../components/marks';

import BasariIcon from '../images/Icons/Başarı.png';
import ComertlikIcon from '../images/Icons/Cömertlik.png';
import EgoIcon from '../images/Icons/Ego.png';
import EnerjiIcon from '../images/Icons/Enerji.png';
import GuvenilirlikIcon from '../images/Icons/Güvenilirlik.png';
import OlgunlukIcon from '../images/Icons/Olgunluk.png';
import SamimiyetIcon from '../images/Icons/Samimiyet.png';
import VizyonIcon from '../images/Icons/Vizyon.png';
import ZekaIcon from '../images/Icons/Zeka.png';
import CekicilikIcon from '../images/Icons/Çekicilik.png';

const SIGNAL_ICONS = {
  samimiyet: SamimiyetIcon,
  cekicilik: CekicilikIcon,
  zeka: ZekaIcon,
  vizyon: VizyonIcon,
  enerji: EnerjiIcon,
  guvenilirlik: GuvenilirlikIcon,
  ego: EgoIcon,
  basari: BasariIcon,
  comertlik: ComertlikIcon,
  olgunluk: OlgunlukIcon
};

const LockedMask = ({ title, description, responseCount, targetCount, langCode }) => {
  return (
    <div className="seenly-dashboard-locked-mask" style={{
      background: 'linear-gradient(135deg, rgba(253, 251, 247, 0.75) 0%, rgba(245, 237, 230, 0.55) 100%)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(11, 27, 44, 0.08)',
      borderRadius: '24px',
      padding: '4.5rem 2rem',
      textAlign: 'center',
      width: '100%',
      minHeight: '340px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      boxShadow: '0 16px 48px rgba(11, 27, 44, 0.03)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background dashed ring */}
      <div style={{
        position: 'absolute',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        border: '1px dashed rgba(143, 123, 204, 0.15)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Glowing Padlock Icon Wrapper */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(217, 106, 83, 0.15) 0%, rgba(143, 123, 204, 0.1) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          border: '1px solid rgba(217, 106, 83, 0.25)',
          boxShadow: '0 8px 24px rgba(217, 106, 83, 0.08)',
          color: 'var(--color-burnt-coral)',
          animation: 'scaleIn 0.3s ease'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {/* Lock Title */}
        <h4 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.6rem',
          color: 'var(--color-deep-ink)',
          marginBottom: '0.75rem',
          fontWeight: 900,
          lineHeight: 1.25
        }}>
          {title}
        </h4>

        {/* Description */}
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.95rem',
          color: 'var(--color-text-muted)',
          lineHeight: 1.55,
          margin: '0 auto 1.5rem auto',
          maxWidth: '380px',
          opacity: 0.95
        }}>
          {description}
        </p>

        {/* Progress pill indicator */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(11, 27, 44, 0.04)',
          border: '1px solid rgba(11, 27, 44, 0.06)',
          padding: '6px 16px',
          borderRadius: '100px',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: 'var(--color-deep-ink)'
        }}>
          <span>🔒</span>
          <span>{responseCount} / {targetCount}</span>
          <span style={{ opacity: 0.6, fontWeight: 500 }}>
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

    // Check if evaluated locally
    try {
      const evaluatedStr = localStorage.getItem('seenly_evaluated_slugs');
      if (evaluatedStr) {
        const evaluatedSlugs = JSON.parse(evaluatedStr);
        if (evaluatedSlugs.includes(slug)) {
          setHasEvaluated(true);
        }
      }
    } catch (e) { /* ignore parse error */ }

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
      { key: 'guvenilirlik', label: lang === 'tr' ? 'Güvenilirlik' : 'Trustworthiness', color: '#7BCCAA' },
      { key: 'ego', label: lang === 'tr' ? 'Ego' : 'Ego', color: '#CC7BBA' },
      { key: 'basari', label: lang === 'tr' ? 'Başarı' : 'Success', color: '#53A6D9' },
      { key: 'comertlik', label: lang === 'tr' ? 'Cömertlik' : 'Generosity', color: '#E5A260' },
      { key: 'olgunluk', label: lang === 'tr' ? 'Olgunluk' : 'Maturity', color: '#8C9D86' }
    ];

    return dimensions.map(d => {
      let val = serverAverages[d.key];

      if (val === undefined || val === null) {
        val = 3.0 + (Math.sin(d.key.charCodeAt(0)) * 1.0);
      }

      const percentage = ((val - 1) / 4) * 100;

      // Clamping to [4% - 95%]
      const clampedPercentage = Math.max(4, Math.min(95, percentage));
      // Deterministic shift based on character sum of key (range -4 to +4)
      const keySum = d.key.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const shift = (keySum % 9) - 4; // range -4 to +4
      const visualPercentage = Math.round(Math.max(4, Math.min(95, clampedPercentage + shift)));

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
  const responseCount = snapshot?.responseCount || 0;
  const isPremium = snapshot?.isPremium || snapshot?.premium || false;
  const maxResponseLimit = snapshot?.maxResponseLimit ?? 100;
  const isCapped = !isPremium && (responseCount >= maxResponseLimit);
  const isLoggedIn = !!localStorage.getItem('seenly_owner_token');

  const activeOutsideSignatureId = calculatePersonalityCard(snapshot?.friendAverages || {});
  const outsideSignature = getObject('signatures', activeOutsideSignatureId);
  const outsideSignatureName = outsideSignature ? outsideSignature.name : t('ui', 'missing_id_fallback');
  const outsideSignatureCardLine = outsideSignature ? outsideSignature.cardLine : "";

  return (
    <AppShell isDashboard={true} showLogout={false}>
      <div className="seenly-dashboard-page-wrapper">
        <div className="seenly-dashboard-container" style={{ maxWidth: '980px', width: '100%', margin: '0 auto' }}>

          {/* Beautiful Custom Friend Profile Header */}
          <div className="flex flex-col items-center text-center w-full box-border pb-8 pt-10 md:pt-14 px-4">

            {/* Display Name */}
            <h2 className="font-serif text-3xl sm:text-[2.75rem] font-black text-[#0b1b2c] m-0" style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {displayName}
            </h2>

            {/* Premium Divider */}
            <div className="flex items-center justify-center gap-3 my-4 w-full">
              <div className="h-px w-16 bg-black/[0.06]" />
              <span className="text-[10px] text-[#c5a059] opacity-70">✦</span>
              <div className="h-px w-16 bg-black/[0.06]" />
            </div>

            {/* Perception Question */}
            <h3 className="font-serif italic text-lg sm:text-xl font-normal text-muted-foreground leading-normal m-0" style={{ maxWidth: '640px' }}>
              {langCode === 'tr'
                ? `İnsanların gözünde nasıl biri?`
                : `How are they perceived in the eyes of others?`}
            </h3>

            {/* Detail Description */}
            <p className="text-xs sm:text-sm text-muted-foreground/80 mt-3.5 leading-relaxed max-w-xl m-0">
              {langCode === 'tr'
                ? 'Dış dünyaya yaydığı sosyal sinyaller ve arkadaş yansımaları doğrultusunda şekillenen güncel algı durumunu inceleyin.'
                : 'Examine the current state of perception shaped in accordance with the social signals and friend reflections projected.'}
            </p>

            {/* Top evaluation button / capped warning / evaluated feedback */}
            {hasEvaluated ? (
              <div className="flex flex-col items-center justify-center w-full max-w-[420px] mt-7 px-8 py-7" style={{
                background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.45))',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '24px',
                border: '1px solid rgba(197, 160, 89, 0.25)',
                boxShadow: '0 12px 40px rgba(80, 60, 40, 0.05)'
              }}>
                <div className="flex items-center justify-center w-[46px] h-[46px] rounded-full mb-4" style={{ background: 'rgba(197, 160, 89, 0.08)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c5a059" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h4 className="font-serif text-[1.25rem] text-[#0b1b2c] m-0 mb-2.5 font-semibold tracking-tight">
                  {langCode === 'tr' ? 'Değerlendirme Tamamlandı' : 'Evaluation Completed'}
                </h4>
                <p className="font-sans text-[0.88rem] text-muted-foreground leading-relaxed m-0 text-center px-2">
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
                className="w-full max-w-[340px] py-3.5 rounded-2xl font-sans font-bold text-xs tracking-[0.06em] text-white hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 cursor-pointer border-none text-center uppercase"
                style={{
                  background: 'var(--primary)',
                  boxShadow: '0 8px 20px rgba(11, 27, 44, 0.12)',
                  marginTop: '1.75rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'oklch(0.42 0.07 258)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(11, 27, 44, 0.18)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(11, 27, 44, 0.12)';
                }}
              >
                {t('ui', 'friend_evaluate_cta')}
              </button>
            )}
          </div>

          {/* Dashboard Body (Only Outside Perception) */}
          <div className="seenly-dashboard-body" style={{ padding: '0 1.25rem' }}>
            <div className={`seenly-dashboard-tab-content ${responseCount < 3 ? 'full-width-layout' : 'flex flex-col md:flex-row items-stretch justify-center w-full gap-5'}`} style={{ maxWidth: '980px', margin: '0 auto' }}>
              {responseCount >= 3 ? (
                <>
                  {/* Left Column: Glass Card */}
                  <div className="flex flex-col items-center z-10 w-full md:w-[340px] flex-shrink-0">
                    <div className="seenly-dashboard-premium-card p-5 flex flex-col items-center justify-between text-center relative rounded-[32px] w-full h-full box-border" style={{ minHeight: '430px' }}>
                      {/* Top content wrapper - vertically centered to balance stretched heights */}
                      <div className="flex flex-col items-center justify-center flex-1 w-full py-2">
                        {/* Stylish rounded rectangle frame with gold border */}
                        <div className="seenly-dashboard-portrait-frame relative w-full max-w-[290px] aspect-[3/4] mb-3 overflow-hidden rounded-[24px] bg-card" style={{ border: '2px solid rgba(197, 160, 89, 0.4)', boxShadow: '0 12px 32px rgba(80, 60, 40, 0.15)' }}>
                          <img
                            src={CARD_IMAGES[activeOutsideSignatureId]}
                            alt={outsideSignatureName}
                            className="w-full h-full object-cover relative z-10"
                          />
                        </div>

                        <h3 className="font-serif text-3xl font-black text-foreground mb-2" style={{ letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                          {outsideSignatureName}
                        </h3>

                        {/* Gold Diamond/Star line divider */}
                        <div className="flex items-center justify-center gap-2.5 my-3 w-full">
                          <div className="h-px w-16 bg-black/[0.06]" />
                          <span className="text-[10px] text-[#c5a059] opacity-70">✦</span>
                          <div className="h-px w-16 bg-black/[0.06]" />
                        </div>

                        {outsideSignatureCardLine && (
                          <p className="font-sans text-[0.88rem] leading-relaxed text-muted-foreground italic px-3">
                            "{outsideSignatureCardLine}"
                          </p>
                        )}
                      </div>

                      {/* Bottom content wrapper: Integrated inspecting and inline sharing icons */}
                      <div className="seenly-dashboard-card-actions flex items-center justify-between w-full mt-6 border-t border-black/5 pt-4 box-border">
                        <button
                          type="button"
                          onClick={() => {
                            localStorage.setItem('seenly_selected_identity', activeOutsideSignatureId);
                            window.location.hash = '#/identities';
                          }}
                          className="text-[0.78rem] font-black uppercase tracking-wider text-primary hover:text-gold flex items-center gap-1.5 transition-all duration-300 hover:translate-x-0.5"
                          style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                        >
                          <span>{langCode === 'tr' ? 'Detay Gör' : 'View Detail'}</span>
                          <span className="text-[11px]">➔</span>
                        </button>
                        <span className="text-[10px] text-muted-foreground/40">✦</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: 10 Social Signals in Grid */}
                  <div className="seenly-dashboard-premium-card seenly-dashboard-signal-card p-8 flex flex-col rounded-[32px] flex-1">
                    <h3 className="font-serif text-[1.4rem] font-black text-foreground tracking-tight text-center mb-2" style={{ letterSpacing: '-0.02em' }}>
                      {langCode === 'tr' ? 'Ortam Sinyalleri' : 'Outside Social Signals'}
                    </h3>

                    {/* Gold Star line divider */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <div className="h-px w-12 bg-black/[0.06]" />
                      <span className="text-[10px] text-[#c5a059] opacity-70">✦</span>
                      <div className="h-px w-12 bg-black/[0.06]" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full flex-1 justify-center py-1">
                      {get10Signals(langCode).map((sig) => (
                        <div
                          key={sig.key}
                          className="signal-card-item flex items-center gap-3.5 p-3 bg-[#fdfbf7] rounded-[20px]"
                          style={{ border: '1.5px solid rgba(11,27,44,0.25)', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', transition: 'border-color 0.25s, transform 0.25s, box-shadow 0.25s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(11,27,44,0.5)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(11,27,44,0.07)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(11,27,44,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)'; }}
                        >
                          <img
                            src={SIGNAL_ICONS[sig.key]}
                            alt={sig.label}
                            className="w-12 h-12 object-contain flex-shrink-0"
                          />

                          {/* Right Content Area */}
                          <div className="flex flex-col flex-1 min-w-0 pr-1">
                            <span className="font-serif text-[1.05rem] font-bold text-[#0b1b2c] tracking-tight text-left mb-1 truncate">
                              {sig.label}
                            </span>

                            {/* Sleek Thin Progress Bar Track */}
                            <div className="h-1.5 w-full bg-black/[0.03] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{
                                  width: `${sig.percentage}%`,
                                  backgroundColor: sig.color
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
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

          {/* Action CTA Button Section */}
          {!isLoggedIn && (
            <div style={{
              marginTop: '3.5rem',
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
                className="font-sans font-bold text-xs tracking-[0.06em] text-primary transition-all duration-200 cursor-pointer text-center uppercase"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'oklch(0.58 0.07 48)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--primary)';
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
