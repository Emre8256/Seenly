import React, { useState, useEffect } from 'react';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';
import GapPatternCard from '../components/GapPatternCard';
import { getOwnerDashboard } from '../services/api';

import { CARD_IMAGES } from '../images/cardImages';

const SIGNATURE_IMAGES = CARD_IMAGES;

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

export default function DashboardPage({ onNavigateToQuiz }) {
  const { locale: langCode, t, getObject } = useLocale();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Self, 1: Outside, 2: Gap
  const [selectedResponse, setSelectedResponse] = useState(null);

  const getRelativeTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.max(1, Math.floor(diffMs / 60000));

    if (diffMins < 60) {
      return langCode === 'tr'
        ? `${diffMins} dk önce`
        : `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return langCode === 'tr'
        ? `${diffHours} saat önce`
        : `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return langCode === 'tr' ? 'Dün' : 'Yesterday';
    }
    return langCode === 'tr'
      ? `${diffDays} gün önce`
      : `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  useEffect(() => {
    const token = localStorage.getItem('seenly_owner_token');

    if (!token) {
      setError('no_token');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const data = await getOwnerDashboard(token);
        setSnapshot(data);
      } catch (err) {
        setError(err.message || 'Error loading dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCopyLink = () => {
    if (!snapshot || !snapshot.publicSlug) return;
    const inviteUrl = `${window.location.origin}/#/friend/${snapshot.publicSlug}`;

    navigator.clipboard.writeText(inviteUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // clipboard copy failed
      });
  };

  const handleLogout = () => {
    localStorage.removeItem('seenly_owner_token');
    sessionStorage.clear();
    window.location.hash = '#/';
  };

  const getSelfAnswers = () => {
    try {
      return JSON.parse(sessionStorage.getItem('seenly_answers')) || {};
    } catch (e) {
      return {};
    }
  };

  const getSelfScoresMap = () => {
    if (snapshot?.selfAverages && Object.keys(snapshot.selfAverages).length > 0) {
      return snapshot.selfAverages;
    }
    const answers = getSelfAnswers();
    const map = {};
    const priorityOrder = [
      'samimiyet', 'cekicilik', 'zeka', 'vizyon', 'enerji',
      'guvenilirlik', 'ego', 'basari', 'comertlik', 'olgunluk'
    ];
    priorityOrder.forEach(key => {
      const qKey = `classic_self_${key}_01`;
      if (answers[qKey] !== undefined) {
        map[key] = Number(answers[qKey]);
      }
    });
    return map;
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
        const answers = JSON.parse(sessionStorage.getItem('seenly_answers') || '{}');
        const selfKey = `classic_self_${key}_01`;
        if (answers[selfKey] !== undefined) {
          const num = Number(answers[selfKey]);
          return ((num - 1) / 4) * 100;
        }
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

  const get10Signals = (lang, isOutside = false) => {
    const answers = getSelfAnswers();
    const serverAverages = isOutside ? (snapshot?.friendAverages || {}) : (snapshot?.selfAverages || {});

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
        // Fallback: check sessionStorage self answers if not outside quiz
        if (!isOutside) {
          const selfKey = `classic_self_${d.key}_01`;
          if (answers[selfKey] !== undefined) {
            val = Number(answers[selfKey]);
          }
        }
      }

      // If still undefined, fallback to a deterministic value or 3.0
      if (val === undefined || val === null) {
        val = 3.0 + (Math.sin(d.key.charCodeAt(0)) * 1.0);
      }

      // 1-5 scale normalized to 0-100%
      const percentage = ((val - 1) / 4) * 100;

      let visualPercentage;
      if (isOutside) {
        // Clamping to [4% - 95%]
        const clampedPercentage = Math.max(4, Math.min(95, percentage));
        // Deterministic shift based on character sum of key (range -4 to +4)
        const keySum = d.key.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const shift = (keySum % 9) - 4; // range -4 to +4
        visualPercentage = Math.round(Math.max(4, Math.min(95, clampedPercentage + shift)));
      } else {
        // Map 0-100% to a visually clean range 10-85% so it never overflows or looks empty
        const scaledPercentage = 10 + (percentage * 0.75);
        // Inject a slight deterministic shift based on the key name characters sum to avoid identical length blocks
        const keySum = d.key.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const shift = (keySum % 11) - 5; // range -5 to +5
        visualPercentage = Math.round(Math.max(8, Math.min(92, scaledPercentage + shift)));
      }

      return {
        ...d,
        value: val,
        percentage: visualPercentage
      };
    });
  };

  if (loading) {
    return (
      <AppShell>
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
      <AppShell>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '6rem 1.5rem', textAlign: 'center' }}>
          <div className="editorial-card" style={{ maxWidth: '500px', width: '100%', padding: '3rem 2rem' }}>
            <h2 className="editorial-title" style={{ color: 'red', fontSize: '1.75rem', marginBottom: '1.5rem' }}>
              {error === 'no_token' ? (langCode === 'tr' ? 'Profil Bulunamadı' : 'No Seenly Profile') : 'Error Loading Profile'}
            </h2>
            <p className="editorial-body" style={{ color: 'var(--color-text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
              {error === 'no_token'
                ? (langCode === 'tr' ? 'Bu tarayıcıda henüz bir Seenly profiliniz yok.' : 'You have not created a Seenly profile on this browser yet.')
                : error}
            </p>
            <button
              type="button"
              className="btn-editorial"
              onClick={onNavigateToQuiz}
              style={{ width: '100%' }}
            >
              {t('ui', 'start_quiz_btn')}
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
  const displayName = capitalizeName(snapshot.displayName || sessionStorage.getItem('seenly_displayName') || 'User');
  const responseCount = snapshot.responseCount || 0;

  // Extract signature information dynamically
  const activeSelfSignatureId = calculatePersonalityCard(getSelfScoresMap());
  const selfSignature = getObject('signatures', activeSelfSignatureId);
  const selfSignatureName = selfSignature ? selfSignature.name : t('ui', 'missing_id_fallback');
  const selfSignatureCardLine = selfSignature ? selfSignature.cardLine : "";

  const activeOutsideSignatureId = calculatePersonalityCard(snapshot?.friendAverages || {});
  const outsideSignature = getObject('signatures', activeOutsideSignatureId);
  const outsideSignatureName = outsideSignature ? outsideSignature.name : t('ui', 'missing_id_fallback');
  const outsideSignatureCardLine = outsideSignature ? outsideSignature.cardLine : "";

  // Calculate slowest and fastest signal for rhythmic analysis
  const timeMap = snapshot?.friendTimeAnalytics || {};
  const timeKeys = Object.keys(timeMap);
  let slowestSignal = 'samimiyet';
  let fastestSignal = 'samimiyet';
  let slowestTimeMs = 0;
  let fastestTimeMs = 0;

  if (timeKeys.length > 0) {
    let maxTime = -Infinity;
    let minTime = Infinity;

    timeKeys.forEach(k => {
      const val = timeMap[k];
      if (val > maxTime) {
        maxTime = val;
        slowestSignal = k;
        slowestTimeMs = val;
      }
      if (val < minTime) {
        minTime = val;
        fastestSignal = k;
        fastestTimeMs = val;
      }
    });
  }

  const slowestTimeSec = (slowestTimeMs / 1000).toFixed(1);
  const fastestTimeSec = (fastestTimeMs / 1000).toFixed(1);

  const rhythmicAnalysis = getObject('ui', 'rhythmic_analysis') || {};
  const profileFlow = getObject('ui', 'profile_flow') || {};
  const responseHistoryTrans = getObject('ui', 'response_history') || {};
  const rawClicks = snapshot.totalProfileClicks ?? 0;
  const totalResponders = snapshot.totalResponders ?? responseCount;
  const totalProfileClicks = Math.max(rawClicks, totalResponders);
  const ratio = totalProfileClicks > 0 ? Math.round((totalResponders / totalProfileClicks) * 100) : 0;
  const isMystery = ratio < 50;
  const rawReportText = isMystery ? profileFlow.high_mystery_desc : profileFlow.high_engagement_desc;
  const reportText = (rawReportText || '')
    .replace('{clickCount}', totalProfileClicks)
    .replace('{responderCount}', totalResponders)
    .replace('{ratio}', ratio);

  return (
    <AppShell isDashboard={true}>
      <div className="seenly-dashboard-page-wrapper">
        <div className="seenly-dashboard-container">

          {/* Dashboard Header */}
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
              {/* Centered Avatar/Person Icon */}
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

              {/* Centered User Info */}
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
                  {/* Status Indicator */}
                  <div className="seenly-dashboard-status" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    justifyContent: 'center'
                  }}>
                    <span className="status-dot" style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: responseCount >= 3 ? '#22c55e' : 'var(--color-burnt-coral)',
                      boxShadow: responseCount >= 3 ? '0 0 0 3px rgba(34, 197, 94, 0.2)' : '0 0 0 3px rgba(217, 106, 83, 0.2)'
                    }}></span>
                    <span className="status-text" style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {responseCount >= 3 ? (langCode === 'tr' ? 'Kilidi Açıldı' : 'Unlocked') : (langCode === 'tr' ? 'Sinyaller Toplanıyor' : 'Signals Forming')}
                    </span>
                  </div>

                  {/* Respondent Counter Badge */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, rgba(143, 123, 204, 0.06) 0%, rgba(217, 106, 83, 0.04) 100%)',
                    border: '1px solid rgba(11, 27, 44, 0.08)',
                    padding: '4px 12px',
                    borderRadius: '100px',
                    boxShadow: '0 2px 8px rgba(11, 27, 44, 0.01)',
                    animation: 'fadeInUp 0.4s ease'
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

              {/* Copy My Link System */}
              <div className="seenly-dashboard-copy-system" style={{
                width: '100%',
                marginTop: '0.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(253, 251, 247, 0.75)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(11, 27, 44, 0.1)',
                  borderRadius: '16px',
                  padding: '4px 4px 4px 14px',
                  boxShadow: '0 4px 16px rgba(11, 27, 44, 0.03)',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <span style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.82rem',
                    color: 'var(--color-text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textAlign: 'left',
                    flex: 1,
                    marginRight: '10px'
                  }}>
                    {snapshot.publicSlug ? `${window.location.host}/#/friend/${snapshot.publicSlug}` : 'seenly.me/friend/...'}
                  </span>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      background: copied ? 'var(--color-burnt-coral)' : 'var(--color-deep-ink)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      padding: '0.65rem 1.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      minWidth: copied ? '108px' : '96px',
                      justifyContent: 'center',
                      boxShadow: copied ? '0 4px 12px rgba(217, 106, 83, 0.25)' : 'none'
                    }}
                  >
                    {copied ? (
                      <>
                        <span style={{ fontSize: '0.9rem' }}>✓</span>
                        <span>{langCode === 'tr' ? 'Kopyalandı' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>{langCode === 'tr' ? 'Kopyala' : 'Copy'}</span>
                      </>
                    )}
                  </button>
                </div>

                <p style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--color-text-muted)',
                  marginTop: '0.5rem',
                  marginBottom: 0,
                  opacity: 0.8
                }}>
                  {langCode === 'tr' ? 'Arkadaşlarının seni okuması için bu linki paylaş' : 'Share this link for friends to read your signals'}
                </p>
              </div>

            </div>
          </header>


          {/* Tab Navigation */}
          <div className="seenly-dashboard-tabs">
            <button
              type="button"
              className={`tab-btn ${activeTab === 0 ? 'active' : ''}`}
              onClick={() => setActiveTab(0)}
            >
              {langCode === 'tr' ? 'Kendi Algım' : 'Self Seenly'}
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 1 ? 'active' : ''}`}
              onClick={() => setActiveTab(1)}
            >
              {langCode === 'tr' ? 'Dış Algı' : 'Outside Seenly'}
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 2 ? 'active' : ''}`}
              onClick={() => setActiveTab(2)}
            >
              {langCode === 'tr' ? 'Aradaki Fark' : 'The Gap'}
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 3 ? 'active' : ''}`}
              onClick={() => setActiveTab(3)}
            >
              {t('ui', 'engagement_feed_title')}
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 4 ? 'active' : ''}`}
              onClick={() => setActiveTab(4)}
            >
              {responseHistoryTrans.menu_title || (langCode === 'tr' ? 'Gelen Analizler' : 'Received Analytics')}
            </button>
          </div>

          {/* Dashboard Body */}
          <div className="seenly-dashboard-body">
            {activeTab === 0 && (
              <div className="seenly-dashboard-tab-content">
                {/* Left Column: Polaroid Card */}
                <div
                  className="seenly-dashboard-polaroid"
                  style={{ backgroundImage: SIGNATURE_IMAGES[activeSelfSignatureId] ? `url(${SIGNATURE_IMAGES[activeSelfSignatureId]})` : 'none' }}
                >
                  <div className="polaroid-overlay">
                    <span className="polaroid-badge">✦ {langCode === 'tr' ? 'Kendi Algın' : 'Self View'} ✦</span>
                    <h3 className="polaroid-title">{selfSignatureName}</h3>
                    {selfSignatureCardLine && <p className="polaroid-desc">"{selfSignatureCardLine}"</p>}
                    <div className="polaroid-dots">
                      <span className="dot active"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                  </div>
                </div>

                {/* Right Column: 10 Social Signals */}
                <div className="seenly-dashboard-signals-card">
                  <h4 className="signals-title">{langCode === 'tr' ? '10 Sosyal Sinyaliniz' : 'Your 10 Social Signals'}</h4>
                  <div className="signals-list">
                    {get10Signals(langCode, false).map((sig) => (
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
              </div>
            )}

            {activeTab === 1 && (
              <div className={`seenly-dashboard-tab-content ${responseCount < 3 ? 'full-width-layout' : ''}`}>
                {responseCount >= 3 ? (
                  <>
                    {/* Left Column: Polaroid Card */}
                    <div
                      className="seenly-dashboard-polaroid"
                      style={{ backgroundImage: SIGNATURE_IMAGES[activeOutsideSignatureId] ? `url(${SIGNATURE_IMAGES[activeOutsideSignatureId]})` : 'none' }}
                    >
                      <div className="polaroid-overlay">
                        <span className="polaroid-badge">✦ {langCode === 'tr' ? 'Dış Algın' : 'Outside View'} ✦</span>
                        <h3 className="polaroid-title">{outsideSignatureName}</h3>
                        {outsideSignatureCardLine && <p className="polaroid-desc">"{outsideSignatureCardLine}"</p>}
                        <div className="polaroid-dots">
                          <span className="dot"></span>
                          <span className="dot active"></span>
                          <span className="dot"></span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: 10 Social Signals */}
                    <div className="seenly-dashboard-signals-card">
                      <h4 className="signals-title">{langCode === 'tr' ? 'Ortam Sinyalleriniz' : 'Outside Social Signals'}</h4>
                      <div className="signals-list">
                        {get10Signals(langCode, true).map((sig) => {
                          return (
                            <div key={sig.key} className="signal-item">
                              <div className="signal-label-group">
                                <span className="signal-dot" style={{ backgroundColor: sig.color }}></span>
                                <span className="signal-label">{sig.label}</span>
                              </div>
                              <div className="signal-bar-track">
                                <div className="signal-bar-fill" style={{ width: `${sig.percentage}%`, backgroundColor: sig.color }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="seenly-dashboard-locked-state">
                    <LockedMask
                      title={t('ui', 'locked_section_title')}
                      description={t('ui', 'locked_section_outside_desc')}
                      responseCount={responseCount}
                      targetCount={3}
                      langCode={langCode}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 2 && (
              <div className="seenly-dashboard-tab-content full-width-layout scrollable-gap-content">
                {responseCount >= 3 ? (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                    <GapPatternCard
                      gapPatternId={snapshot.gapPatternId}
                      gapStrength={snapshot.gapStrength}
                      selfSignatureId={snapshot.selfSignatureId}
                      outsideSignatureId={snapshot.outsideSignatureId}
                    />
                    {snapshot.confidenceBand && (
                      <div style={{
                        marginTop: '1.5rem',
                        fontSize: '0.85rem',
                        color: 'var(--color-text-muted)',
                        textAlign: 'right',
                        fontWeight: '600'
                      }}>
                        {t('ui', 'confidence_band_label')}: <span style={{ fontWeight: 700, color: 'var(--color-burnt-coral)' }}>{t('ui', 'conf_' + snapshot.confidenceBand) || snapshot.confidenceBand}</span>
                      </div>
                    )}
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
            )}

            {activeTab === 3 && (
              <div className="seenly-dashboard-tab-content full-width-layout scrollable-gap-content" style={{ boxSizing: 'border-box' }}>
                <div className="profile-flow-container" style={{ width: '100%' }}>
                  {/* Header Section */}
                  <div className="profile-flow-header">
                    <h3 className="profile-flow-heading">
                      {profileFlow.conversion_report_title || (langCode === 'tr' ? 'Profiliniz dış dünyaya nasıl bir izlenim bırakıyor?' : 'What impression does your profile leave on visitors?')}
                    </h3>
                    <p className="profile-flow-description">
                      {profileFlow.conversion_report_desc || (langCode === 'tr'
                        ? 'Profilinizi ziyaret edenlerin etkileşim oranlarını analiz ederek, dış dünyaya yaydığınız gizemli auranın veya şeffaf çekim gücünün yansımasını keşfedin.'
                        : 'Analyze the engagement and interaction rates of your visitors to discover the social reflection of the enigmatic aura or warm magnetism you project.'
                      )}
                    </p>
                  </div>

                  {/* Editorial Layout with Fine Guidelines and Muted Colors */}
                  <div className="profile-flow-grid" style={{ marginBottom: '1rem' }}>
                    {/* Big Thin Counter Card */}
                    <div className="profile-flow-stat-card">
                      {/* Grid guidelines overlay */}
                      <div className="profile-flow-stat-grid-overlay"></div>

                      <div className="profile-flow-stat-card-content">
                        <span className="profile-flow-stat-label">
                          {profileFlow.visit_stat_title || 'Toplam Profil Ziyareti'}
                        </span>

                        <div className="profile-flow-stat-number">
                          {totalProfileClicks}
                        </div>

                        <div className="profile-flow-substats">
                          <div className="profile-flow-substat-col">
                            <div className="profile-flow-substat-label">
                              {langCode === 'tr' ? 'Katılımcı Sayısı' : 'Responders'}
                            </div>
                            <div className="profile-flow-substat-value">
                              {totalResponders}
                            </div>
                          </div>
                          <div className="profile-flow-substats-divider"></div>
                          <div className="profile-flow-substat-col">
                            <div className="profile-flow-substat-label">
                              {langCode === 'tr' ? 'Dönüşüm Oranı' : 'Conversion Rate'}
                            </div>
                            <div className="profile-flow-substat-value accent">
                              %{ratio}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Report Text Card */}
                    <div className="profile-flow-report-card">
                      <div className="profile-flow-corner-border profile-flow-corner-top-left"></div>
                      <div className="profile-flow-corner-border profile-flow-corner-top-right"></div>
                      <div className="profile-flow-corner-border profile-flow-corner-bottom-left"></div>
                      <div className="profile-flow-corner-border profile-flow-corner-bottom-right"></div>

                      <div style={{ zIndex: 1 }}>
                        <span className={`profile-flow-badge ${isMystery ? 'profile-flow-badge-mystery' : 'profile-flow-badge-engagement'}`}>
                          ✦ {isMystery ? (langCode === 'tr' ? 'GİZEMLİ AURA' : 'ENIGMATIC AURA') : (langCode === 'tr' ? 'YÜKSEK ETKİLEŞİM' : 'HIGH ENGAGEMENT')}
                        </span>

                        <p className="profile-flow-report-text">
                          {reportText}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Separator line */}
                  <hr style={{ border: 0, borderTop: '1px dashed rgba(11, 27, 44, 0.1)', margin: '1rem 0' }} />

                  {/* Part 2: Rhythmic Analysis */}
                  <div className="rhythmic-analysis-container" style={{ width: '100%', marginTop: '0px' }}>
                    <div className="rhythmic-analysis-header" style={{ marginBottom: '1rem' }}>
                      <h3 className="rhythmic-analysis-heading">
                        {langCode === 'tr' ? 'İnsanlar en çok nerede düşündüler?' : 'Where did people hesitate the most?'}
                      </h3>
                      <p className="rhythmic-analysis-description">
                        {langCode === 'tr'
                          ? 'Arkadaşlarınızın soruları yanıtlarken sergilediği bilişsel ritmi, duraksama sürelerini ve kararlılık anlarını analiz ederek karakterinizin dış dünyadaki en belirgin ve en merak uyandıran yönlerini keşfedin.'
                          : 'Explore the most prominent and intriguing aspects of your social perception by analyzing the cognitive rhythm, hesitation times, and moments of instant clarity your friends demonstrated while answering questions about you.'
                        }
                      </p>
                    </div>

                    {responseCount >= 1 && snapshot.friendTimeAnalytics && Object.keys(snapshot.friendTimeAnalytics).length > 0 ? (
                      <div className="rhythmic-grid">
                        {/* Slowest / Hesitating Card */}
                        <div className="rhythmic-card rhythmic-card-hesitating">
                          <div className="rhythmic-badge-container">
                            <span className="rhythmic-badge rhythmic-badge-hesitating">
                              ✦ {rhythmicAnalysis.hesitating_title}
                            </span>
                          </div>

                          <h4 className="rhythmic-card-title">
                            {t('ui', `signal_labels.${slowestSignal}`)}
                          </h4>

                          <div className="rhythmic-timer-box">
                            <div className="rhythmic-timer-icon-wrapper rhythmic-icon-hesitating">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 2h14" />
                                <path d="M5 22h14" />
                                <path d="M19 2v4c0 3.87-3.13 7-7 7s-7-3.13-7-7V2" />
                                <path d="M5 22v-4c0-3.87 3.13-7 7-7s7 3.13 7 7v4" />
                              </svg>
                            </div>
                            <div className="rhythmic-timer-text">
                              <span className="rhythmic-timer-val">
                                {slowestTimeSec}
                                <span className="rhythmic-timer-unit">s</span>
                              </span>
                              <span className="rhythmic-timer-desc">
                                {langCode === 'tr' ? 'ortalama duraklama' : 'average pause'}
                              </span>
                            </div>
                          </div>

                          <div className="rhythmic-divider"></div>

                          <p className="rhythmic-card-desc">
                            {rhythmicAnalysis.hesitating_desc ? rhythmicAnalysis.hesitating_desc.replace('{signal}', t('ui', `signal_labels.${slowestSignal}`)) : ''}
                          </p>
                        </div>

                        {/* Fastest / Confident Card */}
                        <div className="rhythmic-card rhythmic-card-confident">
                          <div className="rhythmic-badge-container">
                            <span className="rhythmic-badge rhythmic-badge-confident">
                              ✦ {rhythmicAnalysis.confident_title}
                            </span>
                          </div>

                          <h4 className="rhythmic-card-title">
                            {t('ui', `signal_labels.${fastestSignal}`)}
                          </h4>

                          <div className="rhythmic-timer-box">
                            <div className="rhythmic-timer-icon-wrapper rhythmic-icon-confident">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                              </svg>
                            </div>
                            <div className="rhythmic-timer-text">
                              <span className="rhythmic-timer-val">
                                {fastestTimeSec}
                                <span className="rhythmic-timer-unit">s</span>
                              </span>
                              <span className="rhythmic-timer-desc">
                                {langCode === 'tr' ? 'ortalama yanıt' : 'average response'}
                              </span>
                            </div>
                          </div>

                          <div className="rhythmic-divider"></div>

                          <p className="rhythmic-card-desc">
                            {rhythmicAnalysis.confident_desc ? rhythmicAnalysis.confident_desc.replace('{signal}', t('ui', `signal_labels.${fastestSignal}`)) : ''}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="seenly-dashboard-locked-state" style={{ minHeight: '260px' }}>
                        <LockedMask
                          title={langCode === 'tr' ? 'Düşünce Ritimleri Kilitli' : 'Pondering Rhythms Locked'}
                          description={langCode === 'tr'
                            ? 'Arkadaşlarınızın soruları cevaplarken ne kadar süre düşündüklerini analiz edebilmemiz için en az 1 yanıt gelmesi gerekmektedir.'
                            : 'At least 1 response is required to analyze how long your friends spent pondering the questions.'}
                          responseCount={responseCount}
                          targetCount={1}
                          langCode={langCode}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 4 && (
              <div className="seenly-dashboard-tab-content full-width-layout scrollable-gap-content" style={{ boxSizing: 'border-box' }}>
                <div className="profile-flow-container">
                  {/* Header Section */}
                  <div className="profile-flow-header">
                    <h3 className="profile-flow-heading">
                      {responseHistoryTrans.menu_title || (langCode === 'tr' ? 'Gelen Analizler' : 'Received Analytics')}
                    </h3>
                    <p className="profile-flow-description">
                      {langCode === 'tr'
                        ? 'Arkadaşlarınızın profilinizi ziyaret ettikten sonra bıraktığı bireysel analizlerin kronolojik akışını inceleyin.'
                        : 'Explore the chronological feed of individual analyses left by your friends after visiting your profile.'
                      }
                    </p>
                  </div>

                  {/* Vertical Timeline List of Cards */}
                  {(!snapshot.responseSessions || snapshot.responseSessions.length === 0) ? (
                    <div className="profile-flow-report-card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
                      <span style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'block' }}>✍️</span>
                      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--color-deep-ink)', margin: '0 0 1rem 0' }}>
                        {langCode === 'tr' ? 'Henüz Analiz Alınmadı' : 'No Analyses Received Yet'}
                      </p>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', color: 'var(--color-text-muted)', margin: 0 }}>
                        {langCode === 'tr'
                          ? 'Profilinizin linkini yukarıdan kopyalayıp arkadaşlarınıza göndererek ilk yansımalarınızı toplamaya başlayın!'
                          : 'Copy your profile link from above and send it to your friends to start gathering your first reflections!'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                      {snapshot.responseSessions.map((session) => {
                        const notificationText = (() => {
                          if (session.readerType === 'telepathic_reader') return responseHistoryTrans.card_notification_telepathic;
                          if (session.readerType === 'clear_reader') return responseHistoryTrans.card_notification_clear;
                          if (session.readerType === 'balanced_reader') return responseHistoryTrans.card_notification_balanced;
                          if (session.readerType === 'casual_explorer') return responseHistoryTrans.card_notification_casual;
                          if (session.readerType === 'social_stranger') return responseHistoryTrans.card_notification_social;
                          return responseHistoryTrans.card_notification_balanced;
                        })();

                        const relativeTime = getRelativeTime(session.completedAt);

                        return (
                          <div
                            key={session.id}
                            onClick={() => setSelectedResponse(session)}
                            style={{
                              background: 'var(--color-paper-cream)',
                              border: '1px solid rgba(11, 27, 44, 0.08)',
                              borderRadius: '20px',
                              padding: '1.75rem 2rem',
                              boxShadow: '0 4px 20px rgba(11, 27, 44, 0.01)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px',
                              position: 'relative',
                              textAlign: 'left',
                              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                              boxSizing: 'border-box'
                            }}
                            className="rhythmic-card"
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                              <span style={{
                                fontFamily: 'var(--font-serif)',
                                fontSize: '1.25rem',
                                fontWeight: 900,
                                color: 'var(--color-deep-ink)'
                              }}>
                                 {session.nickname === 'unknown_person' ? t('ui', 'unknown_person') : session.nickname}
                              </span>

                              <span style={{
                                fontFamily: 'var(--font-sans)',
                                fontSize: '0.8rem',
                                color: 'var(--color-text-muted)',
                                fontWeight: 500
                              }}>
                                {relativeTime}
                              </span>
                            </div>

                            <p style={{
                              fontFamily: 'var(--font-sans)',
                              fontSize: '0.92rem',
                              lineHeight: '1.5',
                              color: 'var(--color-deep-ink)',
                              margin: 0,
                              opacity: 0.85
                            }}>
                              {notificationText}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                              <span className={`profile-flow-badge ${session.readerType === 'telepathic_reader' || session.readerType === 'clear_reader'
                                  ? 'profile-flow-badge-engagement'
                                  : 'profile-flow-badge-mystery'
                                }`} style={{ margin: 0, padding: '4px 12px', fontSize: '0.72rem' }}>
                                 ✦ {getObject('readerStyles', session.readerType)?.name || session.readerType.replace('_', ' ').toUpperCase()} ({langCode === 'tr' ? `%${Math.round(session.accuracy)}` : `${Math.round(session.accuracy)}%`})
                              </span>

                              <span style={{
                                fontFamily: 'var(--font-sans)',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                color: 'var(--color-smoky-lavender)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                {langCode === 'tr' ? 'Detayları Gör' : 'View Details'} ➔
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedResponse && (
        <div className="seenly-modal-overlay" onClick={() => setSelectedResponse(null)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(11, 27, 44, 0.45)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          boxSizing: 'border-box'
        }}>
          <div className="seenly-modal-container" onClick={(e) => e.stopPropagation()} style={{
            background: 'var(--color-paper-cream)',
            border: '1px solid rgba(11, 27, 44, 0.08)',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxSizing: 'border-box',
            position: 'relative',
            boxShadow: '0 24px 64px rgba(11, 27, 44, 0.08)',
            animation: 'fadeInUp 0.3s ease'
          }}>


            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedResponse(null)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Modal Content */}
            <div style={{ textAlign: 'center' }}>
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.78rem',
                fontWeight: 800,
                color: 'var(--color-smoky-lavender)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.5rem',
                display: 'block'
              }}>
                {responseHistoryTrans.detail_title || 'ARKADAŞININ GÖZÜNDEN SİZ'}
              </span>

              <h4 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.8rem',
                fontWeight: 900,
                color: 'var(--color-deep-ink)',
                margin: '0.25rem 0 1rem 0'
              }}>
                 {selectedResponse.nickname === 'unknown_person' ? t('ui', 'unknown_person') : selectedResponse.nickname}
              </h4>

              {/* Reader style badge */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                <span className={`profile-flow-badge ${selectedResponse.readerType === 'telepathic_reader' || selectedResponse.readerType === 'clear_reader'
                    ? 'profile-flow-badge-engagement'
                    : 'profile-flow-badge-mystery'
                  }`} style={{ margin: 0 }}>
                  ✦ {getObject('readerStyles', selectedResponse.readerType)?.name || selectedResponse.readerType.replace('_', ' ').toUpperCase()} ({langCode === 'tr' ? `%${Math.round(selectedResponse.accuracy)}` : `${Math.round(selectedResponse.accuracy)}%`})
                </span>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.8rem',
                  lineHeight: '1.45',
                  color: 'var(--color-text-muted)',
                  maxWidth: '380px',
                  margin: '0 auto',
                  textAlign: 'center',
                  opacity: 0.85
                }}>
                  {t('ui', 'reader_accuracy_explanation')}
                </p>
              </div>

              {/* Minimalist Hairline Slider Bars */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                marginBottom: '2.5rem',
                textAlign: 'left'
              }}>
                {[
                  { key: 'samimiyet', label: langCode === 'tr' ? 'Samimiyet' : 'Sincerity', color: '#8F7BCC' },
                  { key: 'cekicilik', label: langCode === 'tr' ? 'Çekicilik' : 'Charm', color: '#E06553' },
                  { key: 'zeka', label: langCode === 'tr' ? 'Zeka' : 'Intellect', color: '#6A53D9' },
                  { key: 'vizyon', label: langCode === 'tr' ? 'Vizyon' : 'Vision', color: '#7B9FCC' },
                  { key: 'enerji', label: langCode === 'tr' ? 'Enerji' : 'Energy', color: '#D98A53' },
                  { key: 'guvenilirlik', label: langCode === 'tr' ? 'Güvenilirlik' : 'Trustworthiness', color: '#7BCCAA' },
                  { key: 'ego', label: langCode === 'tr' ? 'Ego' : 'Ego', color: '#CC7BBA' },
                  { key: 'basari', label: langCode === 'tr' ? 'Başarı' : 'Success', color: '#53A6D9' },
                  { key: 'comertlik', label: langCode === 'tr' ? 'Cömertlik' : 'Generosity', color: '#E5A260' },
                  { key: 'olgunluk', label: langCode === 'tr' ? 'Olgunluk' : 'Maturity', color: '#8C9D86' }
                ].map((sig) => {
                  const val = selectedResponse.signals[sig.key] || 3;
                  const pct = ((val - 1) / 4) * 100;
                  return (
                    <div key={sig.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: 'var(--color-deep-ink)'
                        }}>
                          {sig.label}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          color: 'var(--color-text-muted)'
                        }}>
                          {langCode === 'tr' ? `%${val * 20}` : `${val * 20}%`}
                        </span>
                      </div>

                      {/* Hairline Slider Bar */}
                      <div style={{
                        position: 'relative',
                        height: '2px',
                        backgroundColor: 'rgba(11, 27, 44, 0.06)',
                        width: '100%',
                        borderRadius: '2px'
                      }}>
                        {/* Active fill */}
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${pct}%`,
                          backgroundColor: sig.color,
                          borderRadius: '2px'
                        }}></div>
                        {/* Circle slider handle */}
                        <div style={{
                          position: 'absolute',
                          left: `${pct}%`,
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: sig.color,
                          border: '2px solid var(--color-paper-cream)',
                          boxShadow: '0 2px 4px rgba(11, 27, 44, 0.15)'
                        }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Highest & Lowest Highlights */}
              {(() => {
                const signals = selectedResponse.signals || {};

                const labelMap = {
                  samimiyet: langCode === 'tr' ? 'Samimiyet' : 'Sincerity',
                  cekicilik: langCode === 'tr' ? 'Çekicilik' : 'Charm',
                  zeka: langCode === 'tr' ? 'Zeka' : 'Intellect',
                  vizyon: langCode === 'tr' ? 'Vizyon' : 'Vision',
                  enerji: langCode === 'tr' ? 'Enerji' : 'Energy',
                  guvenilirlik: langCode === 'tr' ? 'Güvenilirlik' : 'Trustworthiness',
                  ego: langCode === 'tr' ? 'Ego' : 'Ego',
                  basari: langCode === 'tr' ? 'Başarı' : 'Success',
                  comertlik: langCode === 'tr' ? 'Cömertlik' : 'Generosity',
                  olgunluk: langCode === 'tr' ? 'Olgunluk' : 'Maturity'
                };

                const signalKeys = Object.keys(labelMap);
                const signalValues = signalKeys.map(k => signals[k] !== undefined ? signals[k] : 3);

                const highestVal = Math.max(...signalValues);
                const lowestVal = Math.min(...signalValues);

                const highestKeys = signalKeys.filter(k => (signals[k] !== undefined ? signals[k] : 3) === highestVal);
                const lowestKeys = signalKeys.filter(k => (signals[k] !== undefined ? signals[k] : 3) === lowestVal);

                const highestNames = highestKeys.map(k => labelMap[k]).join(', ');
                const lowestNames = lowestKeys.map(k => labelMap[k]).join(', ');

                // Calculate response time analytics (slowest and fastest)
                const timeAnalytics = selectedResponse.friendTimeAnalytics || {};
                const timeKeys = Object.keys(timeAnalytics);
                const validTimes = timeKeys.filter(k => timeAnalytics[k] && timeAnalytics[k] > 0);

                let slowestSignal = null;
                let fastestSignal = null;
                let slowestTimeMs = 0;
                let fastestTimeMs = Infinity;

                validTimes.forEach(k => {
                  const duration = timeAnalytics[k];
                  if (duration > slowestTimeMs) {
                    slowestTimeMs = duration;
                    slowestSignal = k;
                  }
                  if (duration < fastestTimeMs) {
                    fastestTimeMs = duration;
                    fastestSignal = k;
                  }
                });

                const hasTimeData = validTimes.length > 0 && slowestSignal && fastestSignal;
                const slowestTimeSec = (slowestTimeMs / 1000).toFixed(1);
                const fastestTimeSec = (fastestTimeMs / 1000).toFixed(1);

                const isAllEqual = highestVal === lowestVal;

                if (isAllEqual) {
                  return (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      marginBottom: '2rem'
                    }}>
                      {/* Balanced / Equal Vurgu Kutusu */}
                      <div style={{
                        background: 'rgba(143, 123, 204, 0.03)',
                        border: '1px solid rgba(143, 123, 204, 0.15)',
                        borderRadius: '16px',
                        padding: '1.25rem 1.5rem',
                        textAlign: 'left'
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: 'var(--color-smoky-lavender)',
                          letterSpacing: '0.05em',
                          display: 'block',
                          marginBottom: '4px'
                        }}>
                          {langCode === 'tr' ? 'Algı Dengesi' : 'Perception Balance'}
                        </span>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}>
                          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-deep-ink)', flex: '1', minWidth: '150px' }}>
                            {langCode === 'tr' ? 'Tüm Özellikler Eşit Seviyede' : 'All Traits Equally Balanced'}
                          </span>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-smoky-lavender)', whiteSpace: 'nowrap' }}>
                            {langCode === 'tr' ? `%${highestVal * 20}` : `${highestVal * 20}%`}
                          </span>
                        </div>
                      </div>

                      {/* Time Analytics Callout Box */}
                      {hasTimeData && (
                        <div style={{
                          background: 'rgba(11, 27, 44, 0.02)',
                          border: '1px dashed rgba(11, 27, 44, 0.1)',
                          borderRadius: '16px',
                          padding: '1.25rem 1.5rem',
                          textAlign: 'left',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}>
                          <span style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            color: 'var(--color-text-muted)',
                            letterSpacing: '0.05em',
                            display: 'block'
                          }}>
                            {langCode === 'tr' ? 'Bilişsel Ritim (Cevap Süreleri)' : 'Cognitive Rhythm (Response Times)'}
                          </span>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                              <span style={{
                                fontFamily: 'var(--font-sans)',
                                fontSize: '0.7rem',
                                color: 'var(--color-burnt-coral)',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                display: 'block',
                                marginBottom: '2px'
                              }}>
                                {langCode === 'tr' ? '✦ En Çok Düşündüğü' : '✦ Pondered Most'}
                              </span>
                              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 900, color: 'var(--color-deep-ink)', display: 'block' }}>
                                {labelMap[slowestSignal]}
                              </span>
                              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                {slowestTimeSec}s {langCode === 'tr' ? 'duraksama' : 'pause'}
                              </span>
                            </div>

                            <div style={{ borderLeft: '1px solid rgba(11, 27, 44, 0.08)', paddingLeft: '16px' }}>
                              <span style={{
                                fontFamily: 'var(--font-sans)',
                                fontSize: '0.7rem',
                                color: '#22c55e',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                display: 'block',
                                marginBottom: '2px'
                              }}>
                                {langCode === 'tr' ? '✦ En Hızlı Geçtiği' : '✦ Answered Fastest'}
                              </span>
                              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 900, color: 'var(--color-deep-ink)', display: 'block' }}>
                                {labelMap[fastestSignal]}
                              </span>
                              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                {fastestTimeSec}s {langCode === 'tr' ? 'yanıt' : 'response'}
                              </span>
                            </div>
                          </div>

                          <p style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.75rem',
                            lineHeight: '1.45',
                            color: 'var(--color-text-muted)',
                            margin: '4px 0 0 0',
                            fontStyle: 'italic',
                            borderTop: '1px solid rgba(11, 27, 44, 0.04)',
                            paddingTop: '8px'
                          }}>
                            {langCode === 'tr'
                              ? `Arkadaşınız sizin hakkınızda karar verirken en çok "${labelMap[slowestSignal]}" yönünüz üzerine düşündü. Buna karşılık, "${labelMap[fastestSignal]}" özelliğinizi hiç tereddüt etmeden anında işaretledi.`
                              : `While reading you, your friend spent the most time contemplating your "${labelMap[slowestSignal]}". In contrast, they validated your "${labelMap[fastestSignal]}" instantly without any hesitation.`
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    marginBottom: '2rem'
                  }}>
                    {/* Highest Vurgu Kutusu */}
                    <div style={{
                      background: 'rgba(34, 197, 94, 0.03)',
                      border: '1px solid rgba(34, 197, 94, 0.15)',
                      borderRadius: '16px',
                      padding: '1.25rem 1.5rem',
                      textAlign: 'left'
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: '#22c55e',
                        letterSpacing: '0.05em',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        {responseHistoryTrans.highest_signal_label || 'En Belirgin Bulduğu Yönünüz'}
                      </span>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-deep-ink)', flex: '1', minWidth: '150px' }}>
                          {highestNames}
                        </span>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: 800, color: '#22c55e', whiteSpace: 'nowrap' }}>
                          {langCode === 'tr' ? `%${highestVal * 20}` : `${highestVal * 20}%`}
                        </span>
                      </div>
                    </div>

                    {/* Lowest Vurgu Kutusu */}
                    <div style={{
                      background: 'rgba(217, 106, 83, 0.03)',
                      border: '1px solid rgba(217, 106, 83, 0.12)',
                      borderRadius: '16px',
                      padding: '1.25rem 1.5rem',
                      textAlign: 'left'
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: 'var(--color-burnt-coral)',
                        letterSpacing: '0.05em',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        {responseHistoryTrans.lowest_signal_label || 'Sizde En Sakin Gördüğü Yönünüz'}
                      </span>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-deep-ink)', flex: '1', minWidth: '150px' }}>
                          {lowestNames}
                        </span>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-burnt-coral)', whiteSpace: 'nowrap' }}>
                          {langCode === 'tr' ? `%${lowestVal * 20}` : `${lowestVal * 20}%`}
                        </span>
                      </div>
                    </div>

                    {/* Time Analytics Callout Box */}
                    {hasTimeData && (
                      <div style={{
                        background: 'rgba(11, 27, 44, 0.02)',
                        border: '1px dashed rgba(11, 27, 44, 0.1)',
                        borderRadius: '16px',
                        padding: '1.25rem 1.5rem',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: 'var(--color-text-muted)',
                          letterSpacing: '0.05em',
                          display: 'block'
                        }}>
                          {langCode === 'tr' ? 'Bilişsel Ritim (Cevap Süreleri)' : 'Cognitive Rhythm (Response Times)'}
                        </span>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <span style={{
                              fontFamily: 'var(--font-sans)',
                              fontSize: '0.7rem',
                              color: 'var(--color-burnt-coral)',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              display: 'block',
                              marginBottom: '2px'
                            }}>
                              {langCode === 'tr' ? '✦ En Çok Düşündüğü' : '✦ Pondered Most'}
                            </span>
                            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 900, color: 'var(--color-deep-ink)', display: 'block' }}>
                              {labelMap[slowestSignal]}
                            </span>
                            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              {slowestTimeSec}s {langCode === 'tr' ? 'duraksama' : 'pause'}
                            </span>
                          </div>

                          <div style={{ borderLeft: '1px solid rgba(11, 27, 44, 0.08)', paddingLeft: '16px' }}>
                            <span style={{
                              fontFamily: 'var(--font-sans)',
                              fontSize: '0.7rem',
                              color: '#22c55e',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              display: 'block',
                              marginBottom: '2px'
                            }}>
                              {langCode === 'tr' ? '✦ En Hızlı Geçtiği' : '✦ Answered Fastest'}
                            </span>
                            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 900, color: 'var(--color-deep-ink)', display: 'block' }}>
                              {labelMap[fastestSignal]}
                            </span>
                            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              {fastestTimeSec}s {langCode === 'tr' ? 'yanıt' : 'response'}
                            </span>
                          </div>
                        </div>

                        <p style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.75rem',
                          lineHeight: '1.45',
                          color: 'var(--color-text-muted)',
                          margin: '4px 0 0 0',
                          fontStyle: 'italic',
                          borderTop: '1px solid rgba(11, 27, 44, 0.04)',
                          paddingTop: '8px'
                        }}>
                          {langCode === 'tr'
                            ? `Arkadaşınız sizin hakkınızda karar verirken en çok "${labelMap[slowestSignal]}" yönünüz üzerine düşündü. Buna karşılık, "${labelMap[fastestSignal]}" özelliğinizi hiç tereddüt etmeden anında işaretledi.`
                            : `While reading you, your friend spent the most time contemplating your "${labelMap[slowestSignal]}". In contrast, they validated your "${labelMap[fastestSignal]}" instantly without any hesitation.`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Editorial Advice Note */}
              <div style={{
                borderTop: '1px dashed rgba(11, 27, 44, 0.1)',
                paddingTop: '1.5rem',
                marginTop: '1.5rem',
                textAlign: 'center'
              }}>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.85rem',
                  lineHeight: '1.6',
                  color: 'var(--color-text-muted)',
                  fontStyle: 'italic',
                  margin: 0
                }}>
                  {responseHistoryTrans.editorial_note || 'Unutmayın, her farklı gözlem karakterinizin zenginliğine açılan yeni bir penceredir.'}
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
