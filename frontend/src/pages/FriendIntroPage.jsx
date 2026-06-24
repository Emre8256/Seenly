import React, { useState, useEffect } from 'react';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';
import { getPublicDashboard, incrementProfileClick } from '../services/api';
import { CARD_IMAGES } from '../images/cardImages';

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

  const activeOutsideSignatureId = calculatePersonalityCard(snapshot?.friendAverages || {});
  const outsideSignature = getObject('signatures', activeOutsideSignatureId);
  const outsideSignatureName = outsideSignature ? outsideSignature.name : t('ui', 'missing_id_fallback');
  const outsideSignatureCardLine = outsideSignature ? outsideSignature.cardLine : "";

  return (
    <AppShell isDashboard={true} showLogout={false}>
      <div className="seenly-dashboard-page-wrapper">
        <div className="seenly-dashboard-container">

          {/* Centered Dashboard Header */}
          <header className="seenly-dashboard-header" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2.5rem 1.5rem 1.5rem 1.5rem',
            width: '100%',
            textAlign: 'center',
            borderBottom: 'none',
            backgroundColor: 'transparent'
          }}>
            <div className="seenly-dashboard-profile" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              width: '100%',
              maxWidth: '380px',
              margin: '0 auto'
            }}>
              {/* Centered Avatar Icon */}
              <div className="seenly-dashboard-avatar" style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: 'rgba(143, 123, 204, 0.12)',
                color: 'var(--color-ink-violet)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(143, 123, 204, 0.22)',
                boxShadow: '0 8px 20px rgba(143, 123, 204, 0.06)',
                flexShrink: 0
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>

              {/* User Info */}
              <div className="seenly-dashboard-user-info" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '6px'
              }}>
                <h2 className="seenly-dashboard-username" style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  color: 'var(--color-deep-ink)',
                  margin: 0,
                  lineHeight: 1.2
                }}>
                  {displayName}
                </h2>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '2px'
                }}>

                  {/* Counter Badge */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, rgba(143, 123, 204, 0.06) 0%, rgba(217, 106, 83, 0.04) 100%)',
                    border: '1px solid rgba(11, 27, 44, 0.08)',
                    padding: '4px 12px',
                    borderRadius: '100px',
                    boxShadow: '0 2px 8px rgba(11, 27, 44, 0.01)'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-burnt-coral)' }}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      color: 'var(--color-deep-ink)'
                    }}>
                      {responseCount}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--color-text-muted)'
                    }}>
                      {langCode === 'tr' ? 'Katılımcı' : (responseCount === 1 ? 'Respondent' : 'Respondents')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Section title header */}
          <h3 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.8rem',
            fontWeight: '400',
            color: 'var(--color-deep-ink)',
            textAlign: 'center',
            marginBottom: '2rem',
            marginTop: '1.5rem',
            lineHeight: '1.25'
          }}>
            {langCode === 'tr'
              ? `İnsanların gözünde ${displayName} nasıl biri?`
              : `How is ${displayName} perceived in the eyes of others?`}
          </h3>

          {/* Dashboard Body (Only Outside Perception) */}
          <div className="seenly-dashboard-body" style={{ padding: '0 1.25rem' }}>
            <div className={`seenly-dashboard-tab-content ${responseCount < 3 ? 'full-width-layout' : ''}`}>
              {responseCount >= 3 ? (
                <>
                  {/* Left Column: Polaroid Card */}
                  <div
                    className="seenly-dashboard-polaroid"
                    style={{ backgroundImage: CARD_IMAGES[activeOutsideSignatureId] ? `url(${CARD_IMAGES[activeOutsideSignatureId]})` : 'none' }}
                  >
                    <div className="polaroid-overlay">
                      <span className="polaroid-badge">✦ {langCode === 'tr' ? 'Dış Algısı' : 'Outside View'} ✦</span>
                      <h3 className="polaroid-title">{outsideSignatureName}</h3>
                      {outsideSignatureCardLine && <p className="polaroid-desc">"{outsideSignatureCardLine}"</p>}
                    </div>
                  </div>

                  {/* Right Column: 10 Social Signals */}
                  <div className="seenly-dashboard-signals-card">
                    <h4 className="signals-title">{langCode === 'tr' ? 'Ortam Sinyalleri' : 'Outside Social Signals'}</h4>
                    <div className="signals-list">
                      {get10Signals(langCode).map((sig) => (
                        <div key={sig.key} className="signal-item">
                          <div className="signal-label-group">
                            <span className="signal-dot" style={{ backgroundColor: sig.color }}></span>
                            <span className="signal-label">{sig.label}</span>
                          </div>
                          <div className="signal-bar-track">
                            <div className="signal-bar-fill" style={{ width: `${sig.percentage}%`, backgroundColor: sig.color }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="seenly-dashboard-locked-state">
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
          <div style={{
            marginTop: '3rem',
            padding: '0 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            gap: '14px',
            boxSizing: 'border-box'
          }}>
            <button
              type="button"
              onClick={handleStart}
              className="seenly-wizard-primary-btn"
              style={{
                width: '100%',
                maxWidth: '420px',
                borderRadius: '18px',
                fontSize: '1.1rem',
                fontWeight: '800',
                padding: '1.2rem',
                boxShadow: '0 10px 24px rgba(217, 106, 83, 0.25)',
                backgroundColor: 'var(--color-burnt-coral)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.backgroundColor = '#e07b66';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(217, 106, 83, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.backgroundColor = 'var(--color-burnt-coral)';
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(217, 106, 83, 0.25)';
              }}
            >
              {t('ui', 'friend_evaluate_cta')}
            </button>

            <button
              type="button"
              onClick={() => window.location.hash = '#/'}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.88rem',
                cursor: 'pointer',
                fontWeight: 700,
                textDecoration: 'underline',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-deep-ink)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
            >
              {t('ui', 'friend_create_own_link')}
            </button>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
