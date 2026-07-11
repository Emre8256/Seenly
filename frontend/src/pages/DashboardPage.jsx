import React, { useState, useEffect } from 'react';
import { useSeenlyShare, buildWhatsAppLink } from '../hooks/useSeenlyShare';
import { createPortal } from 'react-dom';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';
import { getOwnerDashboard, subscribePlus, buyCapacityPack } from '../services/api';
import { WatercolorStain, ConnectorDots } from '../components/marks';

import { CARD_IMAGES } from '../images/cardImages';

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

const SIGNATURE_IMAGES = CARD_IMAGES;
const RESPONSE_HISTORY_PAGE_SIZE = 5;


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
  const { handleInstagramStory, isGenerating } = useSeenlyShare();
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [responseHistoryPage, setResponseHistoryPage] = useState(1);

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
        if (data?.displayName) {
          localStorage.setItem('seenly_display_name', data.displayName);
        }
        if (data?.publicSlug) {
          localStorage.setItem('seenly_owner_slug', data.publicSlug);
        }
        setSnapshot(data);
      } catch (err) {
        localStorage.removeItem('seenly_owner_token');
        localStorage.removeItem('seenly_display_name');
        localStorage.removeItem('seenly_owner_slug');
        sessionStorage.clear();
        setError('profile_not_found');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil((snapshot?.responseSessions?.length || 0) / RESPONSE_HISTORY_PAGE_SIZE)
    );

    setResponseHistoryPage((currentPage) => Math.min(currentPage, totalPages));
  }, [snapshot?.responseSessions?.length]);

  useEffect(() => {
    if (selectedResponse) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedResponse]);

  const handleCopyLink = () => {
    if (!snapshot || !snapshot.publicSlug) return;
    const inviteUrl = `${window.location.origin}/#/friend/${snapshot.publicSlug}`;
    navigator.clipboard.writeText(inviteUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  const getConfidenceLevel = (count, lang) => {
    if (count <= 2) {
      return {
        label: lang === 'tr' ? 'Şekilleniyor' : 'Forming',
        desc: lang === 'tr'
          ? `Profiliniz henüz yeni şekilleniyor. Karakter yansımalarınızın tam olarak oturması için ${count} anket yanıtı alındı. Daha net analizler için paylaşmaya devam edin.`
          : `Your profile is still forming. Only ${count} response(s) received. Share your link with more friends to get a more stable reflection.`,
        variant: 'forming'
      };
    }
    if (count <= 5) {
      return {
        label: lang === 'tr' ? 'Netleşiyor' : 'Clarifying',
        desc: lang === 'tr'
          ? `Profil yansımanız netleşiyor. ${count} anket yanıtıyla sosyal sinyalleriniz belirginleşmeye başladı.`
          : `Your profile reflection is clarifying. Social signals are shaping up with ${count} survey responses.`,
        variant: 'clarifying'
      };
    }
    if (count <= 10) {
      return {
        label: lang === 'tr' ? 'Belirgin' : 'Clear',
        desc: lang === 'tr'
          ? `Profil kararlılığı belirgin düzeyde. ${count} anket yanıtı ile karakter yansımalarınız son derece kararlı ve güçlü bir temele oturuyor.`
          : `Profile stability is clear. Your character reflections rest on a highly stable and consistent foundation with ${count} responses.`,
        variant: 'clear'
      };
    }
    return {
      label: lang === 'tr' ? 'Kristalize' : 'Crystallized',
      desc: lang === 'tr'
        ? `Profiliniz kristalize oldu. ${count} katılımcıdan gelen yoğun sosyal sinyaller sayesinde en üst düzeyde doğruluk ve kesinliğe sahip.`
        : `Your profile is crystallized. Thanks to rich social signals from ${count} participants, the analysis holds the highest level of accuracy.`,
      variant: 'crystallized'
    };
  };

  const handleLogout = () => {
    localStorage.removeItem('seenly_owner_token');
    localStorage.removeItem('seenly_display_name');
    sessionStorage.clear();
    window.location.hash = '#/';
  };

  const handleUpgradeToPlus = async () => {
    if (isPremium) {
      alert(langCode === 'tr' ? 'Zaten Seenly Plus planındasınız.' : 'You are already on the Seenly Plus plan.');
      return;
    }

    const token = localStorage.getItem('seenly_owner_token');
    if (!token) return;

    try {
      const updatedSnapshot = await subscribePlus(token);
      setSnapshot(updatedSnapshot);
      alert(langCode === 'tr'
        ? 'Tebrikler! Başarıyla Seenly Plus planına geçtiniz. Sınırsız katılımcı limiti ve gelişmiş analizler aktif edildi!'
        : 'Congratulations! You have successfully upgraded to Seenly Plus. Unlimited participant capacity and advanced analytics are now active!');
    } catch (err) {
      alert(langCode === 'tr'
        ? `Abonelik işlemi sırasında hata oluştu: ${err.message}`
        : `Error during subscription process: ${err.message}`);
    }
  };

  const handleBuyPack = async (amount) => {
    if (isPremium) {
      alert(langCode === 'tr'
        ? 'Seenly Plus planındayken ek katılımcı paketleri satın alınamaz, sınırınız zaten sınırsızdır.'
        : 'Extra capacity packs cannot be purchased while on Seenly Plus because your limit is already unlimited.');
      return;
    }

    const token = localStorage.getItem('seenly_owner_token');
    if (!token) return;

    try {
      const updatedSnapshot = await buyCapacityPack(token, amount);
      setSnapshot(updatedSnapshot);
      alert(langCode === 'tr'
        ? `Başarılı! Ek +${amount} katılımcı kapasitesi profilinize tanımlandı.`
        : `Success! Extra +${amount} participant capacity has been added to your profile.`);
    } catch (err) {
      alert(langCode === 'tr'
        ? `Paket satın alımı sırasında hata oluştu: ${err.message}`
        : `Error during package purchase: ${err.message}`);
    }
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

  const normalizeScore = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 3;
    if (numericValue > 1.0001 || numericValue === 1) {
      return Math.max(1, Math.min(5, numericValue));
    }
    return Math.max(1, Math.min(5, 1 + numericValue * 4));
  };

  const formatScore = (value) => {
    const score = normalizeScore(value);
    return Number.isInteger(score) ? `${score}` : score.toFixed(1);
  };

  const fillTemplate = (template, values) => {
    if (!template) return '';
    return Object.entries(values).reduce(
      (text, [key, value]) => text.replaceAll(`{${key}}`, value),
      template
    );
  };

  const getGapEditorialReport = () => {
    const selfSignals = get10Signals(langCode, false);
    const friendSignalMap = get10Signals(langCode, true).reduce((acc, signal) => {
      acc[signal.key] = signal;
      return acc;
    }, {});

    const rows = selfSignals.map((selfSignal) => {
      const friendSignal = friendSignalMap[selfSignal.key] || selfSignal;
      const selfScore = normalizeScore(selfSignal.value);
      const friendScore = normalizeScore(friendSignal.value);
      const gap = Math.abs(selfScore - friendScore);

      return {
        key: selfSignal.key,
        label: selfSignal.label,
        selfScore,
        friendScore,
        gap,
        selfPosition: ((selfScore - 1) / 4) * 100,
        friendPosition: ((friendScore - 1) / 4) * 100
      };
    });

    const averageGap = rows.length
      ? rows.reduce((sum, row) => sum + row.gap, 0) / rows.length
      : 0;
    const alignmentRatio = Math.max(0, Math.min(100, Math.round(100 - ((averageGap / 4) * 100))));
    // 1. Find deepAlignment (closest match)
    const sortedByAlignment = [...rows].sort((a, b) => {
      if (a.gap !== b.gap) return a.gap - b.gap;
      return a.label.localeCompare(b.label);
    });
    const deepAlignment = sortedByAlignment[0];

    // 2. Find blindSpot (friends > self, maximize lift)
    const blindSpotCandidates = rows.filter(r => r.key !== deepAlignment.key);
    const sortedByLift = [...(blindSpotCandidates.length ? blindSpotCandidates : rows)].sort((a, b) => {
      const liftA = a.friendScore - a.selfScore;
      const liftB = b.friendScore - b.selfScore;
      if (liftA !== liftB) return liftB - liftA; // Descending
      return a.label.localeCompare(b.label);
    });
    const blindSpot = sortedByLift[0];

    // 3. Find illusionOfSelf (self > friends, maximize drop)
    const illusionCandidates = rows.filter(r => r.key !== deepAlignment.key && r.key !== blindSpot.key);
    const sortedByDrop = [...(illusionCandidates.length ? illusionCandidates : rows.filter(r => r.key !== deepAlignment.key))].sort((a, b) => {
      const dropA = a.selfScore - a.friendScore;
      const dropB = b.selfScore - b.friendScore;
      if (dropA !== dropB) return dropB - dropA; // Descending
      return a.label.localeCompare(b.label);
    });
    const illusionOfSelf = sortedByDrop[0] || rows[0];

    return {
      rows,
      alignmentRatio,
      blindSpot,
      illusionOfSelf,
      deepAlignment
    };
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
  const displayName = capitalizeName(snapshot.displayName || sessionStorage.getItem('seenly_displayName') || 'User');
  const responseCount = snapshot.responseCount || 0;
  const isPremium = snapshot.isPremium || snapshot.premium || false;
  const maxResponseLimit = snapshot.maxResponseLimit ?? 100;

  // Extract signature information dynamically
  const activeSelfSignatureId = calculatePersonalityCard(getSelfScoresMap());
  const selfSignature = getObject('signatures', activeSelfSignatureId);
  const selfSignatureName = selfSignature ? selfSignature.name : t('ui', 'missing_id_fallback');
  const selfSignatureCardLine = selfSignature ? selfSignature.cardLine : "";

  const activeOutsideSignatureId = calculatePersonalityCard(snapshot?.friendAverages || {});
  const outsideSignature = getObject('signatures', activeOutsideSignatureId);
  const outsideSignatureName = outsideSignature ? outsideSignature.name : t('ui', 'missing_id_fallback');
  const outsideSignatureCardLine = outsideSignature ? outsideSignature.cardLine : "";

  // ── Share helpers (snapshot guaranteed non-null here) ─────────────────────
  const _shareSlug = snapshot?.publicSlug || '';

  const getDashboardWhatsAppLink = (cardName) =>
    buildWhatsAppLink(cardName, _shareSlug);

  const handleDashboardInstagramStory = (cardName, illustrationSrc) => {
    handleInstagramStory(cardName, illustrationSrc, _shareSlug, langCode);
  };
  // ─────────────────────────────────────────────────────────────────────────

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
  const responseSessions = [...(snapshot.responseSessions || [])].sort((firstSession, secondSession) => {
    const firstDate = new Date(firstSession.completedAt || 0).getTime();
    const secondDate = new Date(secondSession.completedAt || 0).getTime();
    return secondDate - firstDate;
  });
  const responseHistoryTotalPages = Math.max(1, Math.ceil(responseSessions.length / RESPONSE_HISTORY_PAGE_SIZE));
  const safeResponseHistoryPage = Math.min(responseHistoryPage, responseHistoryTotalPages);
  const responseHistoryStartIndex = (safeResponseHistoryPage - 1) * RESPONSE_HISTORY_PAGE_SIZE;
  const visibleResponseSessions = responseSessions.slice(
    responseHistoryStartIndex,
    responseHistoryStartIndex + RESPONSE_HISTORY_PAGE_SIZE
  );
  const responseHistoryPageItems = (() => {
    if (responseHistoryTotalPages <= 7) {
      return Array.from({ length: responseHistoryTotalPages }, (_, pageIndex) => pageIndex + 1);
    }

    const pages = new Set([1, responseHistoryTotalPages, safeResponseHistoryPage]);

    if (safeResponseHistoryPage <= 4) {
      [2, 3, 4, 5].forEach((pageNumber) => pages.add(pageNumber));
    } else if (safeResponseHistoryPage >= responseHistoryTotalPages - 3) {
      [
        responseHistoryTotalPages - 4,
        responseHistoryTotalPages - 3,
        responseHistoryTotalPages - 2,
        responseHistoryTotalPages - 1
      ].forEach((pageNumber) => pages.add(pageNumber));
    } else {
      [safeResponseHistoryPage - 1, safeResponseHistoryPage + 1].forEach((pageNumber) => pages.add(pageNumber));
    }

    return Array.from(pages)
      .filter((pageNumber) => pageNumber >= 1 && pageNumber <= responseHistoryTotalPages)
      .sort((firstPage, secondPage) => firstPage - secondPage)
      .reduce((items, pageNumber, index, sortedPages) => {
        if (index > 0 && pageNumber - sortedPages[index - 1] > 1) {
          items.push(`ellipsis-${sortedPages[index - 1]}-${pageNumber}`);
        }
        items.push(pageNumber);
        return items;
      }, []);
  })();
  const freePlanFeatures = langCode === 'tr'
    ? [
      'Self Değerlendirmesi & Self Kartı',
      'Temel Sonuçlar ve Güvenli Paylaşım',
      'Maksimum 100 Katılımcı Kapasitesi',
      'Temel Gap Analizi'
    ]
    : [
      'Self Assessment & Self Card',
      'Core Results and Secure Sharing',
      'Maximum 100 Respondent Capacity',
      'Basic Gap Analysis'
    ];
  const plusPlanFeatures = langCode === 'tr'
    ? [
      'Sınırsız Katılımcı Kapasitesi',
      'Detaylı Profil Ziyareti Ölçümü',
      'Soruda Geçirilen Zaman Analizi',
      'Gelen Analizleri Tek Tek Detaylı İnceleme'
    ]
    : [
      'Unlimited Respondent Capacity',
      'Detailed Profile Visit Measurement',
      'Time Spent Per Question Analysis',
      'Detailed Review of Each Received Analysis'
    ];
  const capacityPackOptions = [
    {
      amount: 100,
      price: '$0.99',
      label: langCode === 'tr' ? 'Başlangıç paketi' : 'Starter pack'
    },
    {
      amount: 250,
      price: '$1.99',
      label: langCode === 'tr' ? 'En dengeli paket' : 'Best value'
    },
    {
      amount: 500,
      price: '$3.99',
      label: langCode === 'tr' ? 'Geniş kitle paketi' : 'Large circle'
    }
  ];
  const rawClicks = snapshot.totalProfileClicks ?? 0;
  const totalResponders = snapshot.totalResponders ?? responseCount;
  const totalProfileClicks = rawClicks;
  const ratio = totalProfileClicks > 0 ? Math.round((totalResponders / totalProfileClicks) * 100) : 0;
  const isMystery = ratio < 50;
  const rawReportText = isMystery ? profileFlow.high_mystery_desc : profileFlow.high_engagement_desc;
  const hasNoProfileClicks = totalProfileClicks === 0;
  const reportText = hasNoProfileClicks
    ? (langCode === 'tr'
      ? 'Profil linkin henuz ziyaret almamis. Linkini paylastiginda burada profilinin ne kadar merak uyandirdigini, kac kisinin yanit verdigini ve etkileşim oranini okuyabileceksin.'
      : 'Your profile link has not received any visits yet. Once you share it, this card will explain how much curiosity your profile creates, how many people respond, and your conversion rate.')
    : (rawReportText || '')
      .replace('{clickCount}', totalProfileClicks)
      .replace('{responderCount}', totalResponders)
      .replace('{ratio}', ratio);
  const getBlindSpotDescription = (row) => {
    if (!row) return '';
    const selfScore = row.selfScore;
    const friendScore = row.friendScore;
    const gap = row.gap;

    const selfKey = selfScore <= 2 ? 'gap_editorial_self_low' : selfScore <= 4 ? 'gap_editorial_self_medium' : 'gap_editorial_self_high';
    const friendKey = friendScore <= 2 ? 'gap_editorial_friend_low' : friendScore <= 4 ? 'gap_editorial_friend_medium' : 'gap_editorial_friend_high';
    const contrastKey = gap >= 1.5 ? 'gap_contrast_blind_spot_high' : 'gap_contrast_blind_spot_low';

    const selfWord = t('ui', selfKey);
    const friendWord = t('ui', friendKey);
    const contrastWord = t('ui', contrastKey);

    return fillTemplate(t('ui', 'gap_blind_spot_desc'), {
      selfWord,
      friendWord,
      contrastWord,
      category: row.label
    });
  };

  const getIllusionDescription = (row) => {
    if (!row) return '';
    const selfScore = row.selfScore;
    const friendScore = row.friendScore;
    const gap = row.gap;

    const selfKey = selfScore <= 2 ? 'gap_illusion_self_low' : selfScore <= 4 ? 'gap_illusion_self_medium' : 'gap_illusion_self_high';
    const friendKey = friendScore <= 2 ? 'gap_illusion_friend_low' : friendScore <= 4 ? 'gap_illusion_friend_medium' : 'gap_illusion_friend_high';
    const contrastKey = gap >= 1.5 ? 'gap_contrast_illusion_high' : 'gap_contrast_illusion_low';

    const selfWord = t('ui', selfKey);
    const friendWord = t('ui', friendKey);
    const contrastWord = t('ui', contrastKey);

    return fillTemplate(t('ui', 'gap_illusion_desc'), {
      selfWord,
      friendWord,
      contrastWord,
      category: row.label
    });
  };

  const getAlignmentDescription = (row) => {
    if (!row) return '';
    const selfScore = row.selfScore;

    const levelKey = selfScore <= 2 ? 'gap_align_level_low' : selfScore <= 4 ? 'gap_align_level_medium' : 'gap_align_level_high';
    const matchKey = 'gap_match_alignment';

    const levelWord = t('ui', levelKey);
    const matchWord = t('ui', matchKey);

    return fillTemplate(t('ui', 'gap_alignment_desc'), {
      levelWord,
      matchWord,
      category: row.label
    });
  };

  const gapEditorial = getGapEditorialReport();
  const gapBlindSpotTitle = t('ui', 'gap_blind_spot_title');
  const gapBlindSpotDesc = getBlindSpotDescription(gapEditorial.blindSpot);
  const gapIllusionTitle = t('ui', 'gap_illusion_title');
  const gapIllusionDesc = getIllusionDescription(gapEditorial.illusionOfSelf);
  const gapAlignmentTitle = t('ui', 'gap_alignment_title');
  const gapAlignmentDesc = getAlignmentDescription(gapEditorial.deepAlignment);

  return (
    <AppShell isDashboard={true} userName={displayName}>
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
              gap: '10px',
              width: '100%',
              maxWidth: '380px',
              margin: '0 auto'
            }}>
              {/* Centered User Info */}
              <div className="seenly-dashboard-user-info" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '4px',
                width: '100%'
              }}>
                <h2 className="seenly-dashboard-username" style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(2.5rem, 6vw, 3.75rem)',
                  fontWeight: 900,
                  color: 'var(--color-deep-ink)',
                  margin: '0.5rem 0 0 0',
                  lineHeight: 1.1,
                  letterSpacing: '-0.03em'
                }}>
                  {displayName}
                </h2>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9rem',
                  color: 'var(--color-text-muted)',
                  marginTop: '10px',
                  marginBottom: '16px'
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#c5a059' }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span style={{ fontWeight: 800, color: 'var(--color-deep-ink)' }}>{responseCount}</span>
                  <span style={{ opacity: 0.4 }}>/</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>{isPremium ? '∞' : maxResponseLimit}</span>
                  <span style={{ fontStyle: 'italic', marginLeft: '2px' }}>
                    {langCode === 'tr' ? 'katılımcı' : (responseCount === 1 ? 'respondent' : 'respondents')}
                  </span>
                </div>
              </div>

              {/* Copy My Link System (Larger) */}
              <div className="seenly-dashboard-copy-system" style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: '4px'
              }}>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    background: copied ? 'var(--color-burnt-coral)' : 'var(--color-deep-ink)',
                    color: 'var(--color-paper-cream)',
                    border: 'none',
                    borderRadius: '100px',
                    padding: '14px 32px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: copied ? '0 8px 24px rgba(217, 106, 83, 0.25)' : '0 8px 24px rgba(11, 27, 44, 0.12)',
                    boxSizing: 'border-box',
                    textAlign: 'center'
                  }}
                  className="hover:scale-[1.02] active:scale-[0.98]"
                >
                  {copied ? (
                    <>
                      <span style={{ fontSize: '1rem' }}>✓</span>
                      <span>{langCode === 'tr' ? 'KOPYALANDI!' : 'COPIED!'}</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>{langCode === 'tr' ? 'PROFİL LİNKİNİ KOPYALA' : 'COPY PROFILE LINK'}</span>
                    </>
                  )}
                </button>
                <p style={{
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--color-text-muted)',
                  margin: '10px 0 0 0',
                  opacity: 0.85,
                  textAlign: 'center'
                }}>
                  {langCode === 'tr' ? 'Arkadaşlarının seni okuması için bu linki paylaş' : 'Share this link for friends to read your signals'}
                </p>
              </div>
            </div>
          </header>


          {/* Tab Navigation Capsule styled like the mockup screenshot */}
          <div className="seenly-dashboard-tabs-wrapper" style={{
            width: '100%',
            maxWidth: '800px',
            margin: '2rem auto 2.5rem auto',
            padding: '0 1.25rem',
            boxSizing: 'border-box'
          }}>
            <div className="seenly-dashboard-tabs-capsule" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(246, 241, 231, 0.65)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(116, 89, 58, 0.12)',
              borderRadius: '100px',
              padding: '6px',
              boxShadow: '0 8px 32px rgba(80, 60, 40, 0.04)',
              width: '100%',
              boxSizing: 'border-box',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              gap: '4px'
            }}>
              {[
                { id: 0, tr: 'Kendi Algım', en: 'Self Seenly' },
                { id: 1, tr: 'Dış Algı', en: 'Outside Seenly' },
                { id: 2, tr: 'Aradaki Fark', en: 'The Gap' },
                { id: 3, tr: 'Etkileşim', en: 'Engagement' },
                { id: 4, tr: 'Gelen Analizler', en: 'Received Analytics' },
                { id: 5, tr: 'Planım', en: 'My Plan' }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                const label = langCode === 'tr' ? tab.tr : tab.en;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    data-active={isActive ? 'true' : 'false'}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: '1',
                      minWidth: 'max-content',
                      border: 'none',
                      background: isActive ? 'var(--color-deep-ink, #0b1b2c)' : 'transparent',
                      color: isActive ? 'var(--color-paper-cream, #fdfdf8)' : 'var(--color-deep-ink, #0b1b2c)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.88rem',
                      fontWeight: isActive ? 800 : 600,
                      padding: '10px 20px',
                      borderRadius: '100px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      whiteSpace: 'nowrap',
                      opacity: isActive ? 1 : 0.75
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.opacity = '0.75';
                    }}
                  >
                    {tab.id === 3 ? t('ui', 'engagement_feed_title') : (tab.id === 4 ? (responseHistoryTrans.menu_title || label) : label)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dashboard Body */}
          <div className="seenly-dashboard-body">

            {activeTab === 0 && (
              <div className="seenly-dashboard-tab-content seenly-signal-flow flex flex-col md:flex-row items-stretch justify-center w-full gap-5" style={{ maxWidth: '980px', margin: '0 auto' }}>
                {/* Left Column: Glass Card */}
                <div className="seenly-signal-summary-wrap flex flex-col items-center z-10 w-full md:w-[340px] flex-shrink-0">
                  <div className="seenly-dashboard-premium-card seenly-signal-summary-card p-5 flex flex-col items-center justify-between text-center relative rounded-[32px] w-full h-full box-border" style={{ minHeight: '430px' }}>
                    {/* Top content wrapper - vertically centered to balance stretched heights */}
                    <div className="seenly-signal-summary-main flex flex-col items-center justify-center flex-1 w-full py-2">
                      {/* Stylish rounded rectangle frame with gold border */}
                      <div className="seenly-dashboard-portrait-frame relative w-full max-w-[290px] aspect-[3/4] mb-3 overflow-hidden rounded-[24px] bg-card" style={{ border: '2px solid rgba(197, 160, 89, 0.4)', boxShadow: '0 12px 32px rgba(80, 60, 40, 0.15)' }}>
                        <img
                          src={SIGNATURE_IMAGES[activeSelfSignatureId]}
                          alt={selfSignatureName}
                          className="w-full h-full object-cover relative z-10"
                        />
                      </div>

                      <div className="seenly-summary-copy">
                        <h3 className="font-serif text-3xl font-black text-foreground mb-2" style={{ letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                          {selfSignatureName}
                        </h3>

                        {/* Thin line divider */}
                        <div className="flex items-center justify-center gap-2.5 my-3 w-full">
                          <div className="h-px w-16 bg-black/[0.06]" />
                          <span className="text-[10px] text-[#c5a059] opacity-70">✦</span>
                          <div className="h-px w-16 bg-black/[0.06]" />
                        </div>

                        {selfSignatureCardLine && (
                          <p className="font-sans text-[0.88rem] leading-relaxed text-muted-foreground italic px-3">
                            "{selfSignatureCardLine}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom content wrapper: Integrated inspecting and inline sharing icons */}
                    <div className="seenly-dashboard-card-actions flex items-center justify-between w-full mt-6 border-t border-black/5 pt-4 box-border">
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem('seenly_selected_identity', activeSelfSignatureId);
                          window.location.hash = '#/identities';
                        }}
                        className="text-[0.78rem] font-black uppercase tracking-wider text-primary hover:text-gold flex items-center gap-1.5 transition-all duration-300 hover:translate-x-0.5"
                        style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                      >
                        <span>{langCode === 'tr' ? 'DETAYLI İNCELE' : 'INSPECT'}</span>
                        <span className="text-[11px]">➔</span>
                      </button>

                      {/* Share icons: WhatsApp + Instagram only */}
                      <div className="flex items-center gap-3.5">
                        <a
                          href={getDashboardWhatsAppLink(selfSignatureName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-emerald-600 transition-colors"
                          title={langCode === 'tr' ? "WhatsApp'ta Paylaş" : "Share on WhatsApp"}
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9z" />
                            <path d="M9 10a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                          </svg>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDashboardInstagramStory(selfSignatureName, SIGNATURE_IMAGES[activeSelfSignatureId])}
                          disabled={isGenerating}
                          className="text-muted-foreground hover:text-rose-600 transition-colors bg-transparent border-0 p-0 cursor-pointer"
                          title={langCode === 'tr' ? "Instagram Story Oluştur" : "Create Instagram Story"}
                          style={{ opacity: isGenerating ? 0.5 : 1 }}
                        >
                          {isGenerating ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: 10 Social Signals in Grid */}
                <div className="seenly-dashboard-premium-card seenly-dashboard-signal-card seenly-wide-signal-card p-8 flex flex-col rounded-[32px] flex-1">
                  <h3 className="font-serif text-[1.4rem] font-black text-foreground tracking-tight text-center mb-2" style={{ letterSpacing: '-0.02em' }}>
                    {langCode === 'tr' ? '10 Sosyal Sinyaliniz' : 'Your 10 Social Signals'}
                  </h3>

                  {/* Thin line divider */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="h-px w-12 bg-black/[0.06]" />
                    <span className="text-[10px] text-[#c5a059] opacity-70">✦</span>
                    <div className="h-px w-12 bg-black/[0.06]" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full flex-1 justify-center py-1">
                    {get10Signals(langCode, false).map((sig) => (
                      <div
                        key={sig.key}
                        className="signal-card-item flex items-center gap-3.5 p-3 rounded-[18px]"
                        style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(200,188,170,0.5)', boxShadow: '0 1px 4px rgba(80,60,40,0.06), inset 0 1px 0 rgba(255,255,255,0.86)', transition: 'border-color 0.25s, transform 0.25s, box-shadow 0.25s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,188,170,0.75)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(80,60,40,0.1), inset 0 1px 0 rgba(255,255,255,0.86)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(200,188,170,0.5)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(80,60,40,0.06), inset 0 1px 0 rgba(255,255,255,0.86)'; }}
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
              </div>
            )}

            {activeTab === 1 && (
              <div className={`seenly-dashboard-tab-content ${responseCount < 3 ? 'full-width-layout' : 'seenly-outside-flow flex flex-col md:flex-row items-stretch justify-center w-full gap-5'}`} style={{ maxWidth: '980px', margin: '0 auto' }}>
                {responseCount >= 3 ? (
                  <>
                    {/* Left Column: Glass Card */}
                    <div className="seenly-outside-summary-wrap flex flex-col items-center z-10 w-full md:w-[340px] flex-shrink-0">
                      <div className="seenly-dashboard-premium-card seenly-outside-summary-card p-5 flex flex-col items-center justify-between text-center relative rounded-[32px] w-full h-full box-border" style={{ minHeight: '430px' }}>
                        {/* Top content wrapper - vertically centered to balance stretched heights */}
                        <div className="seenly-outside-summary-main flex flex-col items-center justify-center flex-1 w-full py-2">
                          {/* Stylish rounded rectangle frame with gold border */}
                          <div className="seenly-dashboard-portrait-frame relative w-full max-w-[290px] aspect-[3/4] mb-3 overflow-hidden rounded-[24px] bg-card" style={{ border: '2px solid rgba(197, 160, 89, 0.4)', boxShadow: '0 12px 32px rgba(80, 60, 40, 0.15)' }}>
                            <img
                              src={SIGNATURE_IMAGES[activeOutsideSignatureId]}
                              alt={outsideSignatureName}
                              className="w-full h-full object-cover relative z-10"
                            />
                          </div>

                          <div className="seenly-summary-copy">
                            <h3 className="font-serif text-3xl font-black text-foreground mb-2" style={{ letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                              {outsideSignatureName}
                            </h3>

                            {/* Thin line divider */}
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
                            <span>{langCode === 'tr' ? 'DETAYLI İNCELE' : 'INSPECT'}</span>
                            <span className="text-[11px]">➔</span>
                          </button>

                          {/* Share icons: WhatsApp + Instagram only */}
                          <div className="flex items-center gap-3.5">
                            <a
                              href={getDashboardWhatsAppLink(outsideSignatureName)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-emerald-600 transition-colors"
                              title={langCode === 'tr' ? "WhatsApp'ta Paylaş" : "Share on WhatsApp"}
                            >
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9z" />
                                <path d="M9 10a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                              </svg>
                            </a>

                            <button
                              type="button"
                              onClick={() => handleDashboardInstagramStory(outsideSignatureName, SIGNATURE_IMAGES[activeOutsideSignatureId])}
                              disabled={isGenerating}
                              className="text-muted-foreground hover:text-rose-600 transition-colors bg-transparent border-0 p-0 cursor-pointer"
                              title={langCode === 'tr' ? "Instagram Story Oluştur" : "Create Instagram Story"}
                              style={{ opacity: isGenerating ? 0.5 : 1 }}
                            >
                              {isGenerating ? (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                              ) : (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: 10 Social Signals in Grid */}
                    <div className="seenly-dashboard-premium-card seenly-dashboard-signal-card seenly-outside-signal-card p-8 flex flex-col rounded-[32px] flex-1">
                      <h3 className="font-serif text-[1.4rem] font-black text-foreground tracking-tight text-center mb-2" style={{ letterSpacing: '-0.02em' }}>
                        {langCode === 'tr' ? 'Ortam Sinyalleriniz' : 'Outside Social Signals'}
                      </h3>

                      {/* Thin line divider */}
                      <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="h-px w-12 bg-black/[0.06]" />
                        <span className="text-[10px] text-[#c5a059] opacity-70">✦</span>
                        <div className="h-px w-12 bg-black/[0.06]" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full flex-1 justify-center py-1">
                        {get10Signals(langCode, true).map((sig) => (
                          <div
                            key={sig.key}
                            className="signal-card-item flex items-center gap-3.5 p-3 rounded-[18px]"
                            style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(200,188,170,0.5)', boxShadow: '0 1px 4px rgba(80,60,40,0.06), inset 0 1px 0 rgba(255,255,255,0.86)', transition: 'border-color 0.25s, transform 0.25s, box-shadow 0.25s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,188,170,0.75)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(80,60,40,0.1), inset 0 1px 0 rgba(255,255,255,0.86)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(200,188,170,0.5)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(80,60,40,0.06), inset 0 1px 0 rgba(255,255,255,0.86)'; }}
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
              <div className="seenly-dashboard-tab-content full-width-layout scrollable-gap-content seenly-gap-editorial-content" style={{ maxWidth: '840px', width: '100%' }}>
                {responseCount >= 3 ? (
                  <div className="flex flex-col gap-6 w-full">
                    {/* Header Magazine Hero Banner */}
                    <div className="seenly-dashboard-premium-card flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-3xl w-full box-border">
                      <div className="text-left flex-1">
                        <span className="font-mono text-[0.75rem] uppercase tracking-widest text-gold block mb-1.5 font-bold">
                          {langCode === 'tr' ? 'Bilişsel Uyum Raporu' : 'Cognitive Alignment Report'}
                        </span>
                        <h3 className="font-serif text-3xl sm:text-4xl font-black text-foreground leading-tight m-0" style={{ letterSpacing: '-0.02em' }}>
                          {langCode === 'tr' ? 'ALGI BOŞLUĞU' : 'THE COGNITIVE GAP'}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mt-2.5 leading-relaxed m-0">
                          {langCode === 'tr'
                            ? 'Kendi algınız ile arkadaşlarınızın sizde gözlemlediği sosyal sinyaller arasındaki mesafe ve uyumu analiz eder.'
                            : 'Analyzes the distance and alignment between your self-perception and the social signals observed by friends.'
                          }
                        </p>
                      </div>

                      <div className="seenly-dashboard-gap-meter flex items-center gap-4 rounded-2xl p-4 min-w-[220px] box-border">
                        <div className="relative w-18 h-18 flex items-center justify-center flex-shrink-0">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-white/40"
                              strokeWidth="3.2"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-primary"
                              strokeWidth="3.2"
                              strokeDasharray={`${gapEditorial.alignmentRatio}, 100`}
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <span className="absolute font-heading text-lg font-black text-foreground">
                            {gapEditorial.alignmentRatio}%
                          </span>
                        </div>
                        <div className="text-left">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-0.5">
                            {langCode === 'tr' ? 'Genel Uyum' : 'Overall Match'}
                          </span>
                          <span className="font-sans text-sm font-bold text-foreground">
                            {gapEditorial.alignmentRatio >= 70
                              ? (langCode === 'tr' ? 'Son Derece Paralel' : 'Highly Parallel')
                              : gapEditorial.alignmentRatio >= 50
                                ? (langCode === 'tr' ? 'Uyumlu / Dengeli' : 'Aligned / Balanced')
                                : (langCode === 'tr' ? 'Belirgin Farklılıklar' : 'Distinct Divergence')
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Gradient Gap Comparison Range Bars */}
                    <div className="seenly-dashboard-premium-card p-6 rounded-3xl w-full box-border">
                      <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/20">
                        <h4 className="font-heading text-base font-semibold text-foreground tracking-tight m-0">
                          {langCode === 'tr' ? 'Sinyal Boyut Karşılaştırması' : 'Signal Dimension Comparison'}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <div
                              className="rounded-full flex items-center justify-center box-border"
                              style={{
                                width: '14px',
                                height: '14px',
                                backgroundColor: 'var(--gold)'
                              }}
                            >
                              <div
                                className="rounded-full bg-white flex items-center justify-center"
                                style={{
                                  width: '10px',
                                  height: '10px'
                                }}
                              >
                                <div
                                  className="rounded-full"
                                  style={{
                                    width: '5px',
                                    height: '5px',
                                    backgroundColor: 'var(--gold)'
                                  }}
                                />
                              </div>
                            </div>
                            <span>{t('ui', 'gap_legend_self')}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-primary" /> {t('ui', 'gap_legend_friend')}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        {gapEditorial.rows.map((row) => (
                          <div key={row.key} className="seenly-dashboard-gap-row grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-3 sm:gap-6">
                            <div className="flex items-center justify-between sm:justify-start sm:flex-col sm:items-start gap-1">
                              <span className="font-heading text-[0.95rem] font-bold text-foreground text-left">{row.label}</span>
                            </div>

                            <div className="relative h-6 flex items-center w-full">
                              {/* Horizontal Track Line */}
                              <div className="absolute left-0 right-0 h-2 rounded-full seenly-dashboard-signal-track" />

                              {/* Connected range highlighting path */}
                              <div
                                className="absolute h-1.5 bg-gradient-to-r from-gold/50 to-primary/50 rounded-full"
                                style={{
                                  left: `${Math.min(row.selfPosition, row.friendPosition)}%`,
                                  width: `${Math.abs(row.friendPosition - row.selfPosition)}%`
                                }}
                              />

                              {/* Self Position indicator */}
                              <div
                                className="absolute -translate-x-1/2 transition-all hover:scale-110 cursor-help flex items-center justify-center rounded-full"
                                style={{
                                  left: `${row.selfPosition}%`,
                                  width: '18px',
                                  height: '18px',
                                  backgroundColor: 'var(--gold)',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                                }}
                                title={fillTemplate(t('ui', 'gap_tooltip_self'), { value: row.selfPosition })}
                              >
                                <div
                                  className="rounded-full bg-white flex items-center justify-center"
                                  style={{
                                    width: '13px',
                                    height: '13px'
                                  }}
                                >
                                  <div
                                    className="rounded-full"
                                    style={{
                                      width: '7px',
                                      height: '7px',
                                      backgroundColor: 'var(--gold)'
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Friend Position indicator */}
                              <div
                                className="absolute w-5 h-5 rounded-full border border-white bg-primary shadow-sm -translate-x-1/2 transition-all hover:scale-110 cursor-help"
                                style={{ left: `${row.friendPosition}%` }}
                                title={fillTemplate(t('ui', 'gap_tooltip_friend'), { value: row.friendPosition })}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Editorial Analysis Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                      {/* Blind Spot Card */}
                      <div className="seenly-dashboard-premium-card p-6 rounded-3xl text-left flex flex-col box-border">
                        <span className="font-mono text-[10.5px] uppercase tracking-widest text-gold font-bold">
                          {langCode === 'tr' ? '01 / Kör Nokta' : '01 / Blind Spot'}
                        </span>
                        <h4 className="font-serif text-lg font-bold text-foreground mt-3 mb-2">
                          {gapBlindSpotTitle}
                        </h4>
                        <p className="font-sans text-[0.88rem] text-foreground/80 leading-relaxed m-0">
                          {gapBlindSpotDesc}
                        </p>
                      </div>

                      {/* Illusion of Self (Social Mask) Card */}
                      <div className="seenly-dashboard-premium-card p-6 rounded-3xl text-left flex flex-col box-border">
                        <span className="font-mono text-[10.5px] uppercase tracking-widest font-bold" style={{ color: 'var(--color-burnt-coral)' }}>
                          {langCode === 'tr' ? '02 / Sosyal Maske' : '02 / Social Mask'}
                        </span>
                        <h4 className="font-serif text-lg font-bold text-foreground mt-3 mb-2">
                          {gapIllusionTitle}
                        </h4>
                        <p className="font-sans text-[0.88rem] text-foreground/80 leading-relaxed m-0">
                          {gapIllusionDesc}
                        </p>
                      </div>

                      {/* Synchronization Card */}
                      <div className="seenly-dashboard-premium-card p-6 rounded-3xl text-left flex flex-col box-border">
                        <span className="font-mono text-[10.5px] uppercase tracking-widest text-primary font-bold">
                          {langCode === 'tr' ? '03 / Senkronizasyon' : '03 / Sync'}
                        </span>
                        <h4 className="font-serif text-lg font-bold text-foreground mt-3 mb-2">
                          {gapAlignmentTitle}
                        </h4>
                        <p className="font-sans text-[0.88rem] text-foreground/80 leading-relaxed m-0">
                          {gapAlignmentDesc}
                        </p>
                      </div>
                    </div>

                    {/* Confidence Stability Card */}
                    {snapshot.confidenceBand && (() => {
                      const conf = getConfidenceLevel(responseCount, langCode);
                      return (
                        <div className="seenly-dashboard-premium-card p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left w-full box-border">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
                                {langCode === 'tr' ? 'Profil Kararlılığı' : 'Profile Stability'}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[11.5px] font-bold uppercase tracking-wider ${conf.variant === 'crystallized'
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                : conf.variant === 'clear'
                                  ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                                  : 'bg-gold/10 text-gold border border-gold/20'
                                }`}>
                                {conf.label}
                              </span>
                            </div>
                            <p className="text-[0.88rem] text-foreground/80 leading-relaxed font-sans m-0">
                              {conf.desc}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground/45 hidden sm:flex">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 16v-4" />
                              <path d="M12 8h.01" />
                            </svg>
                          </div>
                        </div>
                      );
                    })()}
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
              <div className="seenly-dashboard-tab-content full-width-layout scrollable-gap-content seenly-gap-editorial-content" style={{ maxWidth: '840px', width: '100%' }}>
                <div className="flex flex-col gap-6 w-full box-border">
                  {/* Header Section */}
                  <div className="flex flex-col items-center text-center w-full box-border pb-2 pt-2">
                    <span className="font-mono text-[0.75rem] uppercase tracking-widest text-gold block mb-1.5 font-bold">
                      {langCode === 'tr' ? 'ETKİLEŞİM ANALİZİ' : 'ENGAGEMENT ANALYSIS'}
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl font-black text-foreground leading-tight m-0" style={{ letterSpacing: '-0.02em' }}>
                      {profileFlow.conversion_report_title || (langCode === 'tr' ? 'Profiliniz dış dünyaya nasıl bir izlenim bırakıyor?' : 'What impression does your profile leave on visitors?')}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed max-w-2xl m-0">
                      {profileFlow.conversion_report_desc || (langCode === 'tr'
                        ? 'Profilinizi ziyaret edenlerin etkileşim oranlarını analiz ederek, dış dünyaya yaydığınız gizemli auranın veya şeffaf çekim gücünün yansımasını keşfedin.'
                        : 'Analyze the engagement and interaction rates of your visitors to discover the social reflection of the enigmatic aura or warm magnetism you project.'
                      )}
                    </p>
                  </div>

                  {/* Part 1: Grid for Total Visits and Report Text */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full box-border">
                    {/* Visits Counter Card */}
                    <div className="p-6 rounded-3xl border border-white/40 bg-white/25 backdrop-blur-md shadow-contact-sm flex flex-col justify-between text-center relative overflow-hidden box-border">
                      <div className="relative z-10 w-full flex flex-col items-center">
                        <span className="font-mono text-[10.5px] uppercase tracking-widest text-primary font-bold">
                          {profileFlow.visit_stat_title || (langCode === 'tr' ? 'Toplam Profil Ziyareti' : 'Total Profile Visits')}
                        </span>

                        <div
                          className="font-serif text-6xl font-black text-foreground my-4 leading-none select-none relative"
                          style={{ filter: !isPremium ? 'blur(12px)' : 'none', transition: 'filter 0.3s ease' }}
                        >
                          {totalProfileClicks}
                        </div>

                        <div className="w-full flex items-center justify-around mt-4 pt-4 border-t border-white/20">
                          <div className="text-left">
                            <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                              {langCode === 'tr' ? 'Katılımcı' : 'Responders'}
                            </span>
                            <span className="font-serif text-lg font-bold text-foreground">
                              {totalResponders}
                            </span>
                          </div>

                          <div className="w-px h-8 bg-white/25" />

                          <div className="text-left">
                            <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                              {langCode === 'tr' ? 'Dönüşüm' : 'Conversion'}
                            </span>
                            <span
                              className="font-serif text-lg font-bold text-primary"
                              style={{ filter: !isPremium ? 'blur(6px)' : 'none', transition: 'filter 0.3s ease' }}
                            >
                              %{ratio}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Report Text Card */}
                    <div className="p-6 rounded-3xl border border-white/45 bg-white/25 backdrop-blur-md shadow-contact-sm text-left flex flex-col justify-center relative box-border">
                      <div className="relative z-10 w-full">
                        {!hasNoProfileClicks && (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider mb-4 border ${isMystery
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            }`}>
                            {isMystery ? (langCode === 'tr' ? 'GİZEMLİ AURA' : 'ENIGMATIC AURA') : (langCode === 'tr' ? 'YÜKSEK ETKİLEŞİM' : 'HIGH ENGAGEMENT')}
                          </span>
                        )}

                        <p
                          className="font-serif text-[1rem] leading-relaxed text-foreground/90 italic m-0 select-none"
                          style={{ filter: !isPremium ? 'blur(8px)' : 'none', transition: 'filter 0.3s ease' }}
                        >
                          {reportText}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Part 2: Rhythmic Analysis */}
                  <div className="flex flex-col gap-4 w-full box-border mt-2">
                    <div className="flex flex-col items-center text-center w-full box-border pb-2 pt-4">
                      <span className="font-mono text-[0.75rem] uppercase tracking-widest text-gold block mb-1.5 font-bold">
                        {langCode === 'tr' ? 'BİLİŞSEL RİTM' : 'COGNITIVE RHYTHM'}
                      </span>
                      <h3 className="font-serif text-2xl sm:text-3xl font-black text-foreground leading-tight m-0" style={{ letterSpacing: '-0.02em' }}>
                        {langCode === 'tr' ? 'İnsanlar en çok nerede düşündüler?' : 'Where did people hesitate the most?'}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed max-w-2xl mx-auto m-0">
                        {langCode === 'tr'
                          ? 'Arkadaşlarınızın soruları yanıtlarken sergilediği bilişsel ritmi, duraksama sürelerini ve kararlılık anlarını analiz ederek karakterinizin dış dünyadaki en belirgin ve en merak uyandıran yönlerini keşfedin.'
                          : 'Explore the most prominent and intriguing aspects of your social perception by analyzing the cognitive rhythm, hesitation times, and moments of instant clarity your friends demonstrated while answering questions about you.'
                        }
                      </p>
                    </div>

                    {responseCount >= 1 && snapshot.friendTimeAnalytics && Object.keys(snapshot.friendTimeAnalytics).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full box-border">
                        {/* Slowest / Hesitating Card */}
                        <div className="p-6 rounded-3xl border border-white/45 bg-white/25 backdrop-blur-md shadow-contact-sm text-left flex flex-col justify-between box-border hover:scale-[1.01] transition-transform duration-300">
                          <div>
                            <div className="mb-4">
                              <span className="font-mono text-[10.5px] uppercase tracking-widest text-gold font-bold bg-white/50 px-3 py-1 rounded-full border border-white/60">
                                {rhythmicAnalysis.hesitating_title}
                              </span>
                            </div>

                            <h4
                              className="font-serif text-xl font-bold text-foreground mt-3 mb-3"
                              style={{ filter: !isPremium ? 'blur(8px)' : 'none', transition: 'filter 0.3s ease' }}
                            >
                              {t('ui', `signal_labels.${slowestSignal}`)}
                            </h4>

                            <div className="flex items-center gap-3 bg-white/20 border border-white/30 rounded-2xl p-3 shadow-sm mb-4 box-border">
                              <div className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M5 2h14" />
                                  <path d="M5 22h14" />
                                  <path d="M19 2v4c0 3.87-3.13 7-7 7s-7-3.13-7-7V2" />
                                  <path d="M5 22v-4c0-3.87 3.13-7 7-7s7 3.13 7 7v4" />
                                </svg>
                              </div>
                              <div className="text-left flex flex-col">
                                <span
                                  className="font-serif text-2xl font-black text-foreground leading-none"
                                  style={{ filter: !isPremium ? 'blur(8px)' : 'none', transition: 'filter 0.3s ease' }}
                                >
                                  {slowestTimeSec}<span className="text-sm font-normal ml-0.5">s</span>
                                </span>
                                <span className="font-sans text-[10px] uppercase font-bold text-muted-foreground mt-1">
                                  {langCode === 'tr' ? 'ortalama duraklama' : 'average pause'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="w-10 h-px bg-white/30 my-2" />

                          <p
                            className="font-sans text-[0.88rem] text-foreground/80 leading-relaxed m-0 italic"
                            style={{ filter: !isPremium ? 'blur(7px)' : 'none', transition: 'filter 0.3s ease' }}
                          >
                            {rhythmicAnalysis.hesitating_desc ? rhythmicAnalysis.hesitating_desc.replace('{signal}', t('ui', `signal_labels.${slowestSignal}`)) : ''}
                          </p>
                        </div>

                        {/* Fastest / Confident Card */}
                        <div className="p-6 rounded-3xl border border-white/45 bg-white/25 backdrop-blur-md shadow-contact-sm text-left flex flex-col justify-between box-border hover:scale-[1.01] transition-transform duration-300">
                          <div>
                            <div className="mb-4">
                              <span className="font-mono text-[10.5px] uppercase tracking-widest text-primary font-bold bg-white/50 px-3 py-1 rounded-full border border-white/60">
                                {rhythmicAnalysis.confident_title}
                              </span>
                            </div>

                            <h4
                              className="font-serif text-xl font-bold text-foreground mt-3 mb-3"
                              style={{ filter: !isPremium ? 'blur(8px)' : 'none', transition: 'filter 0.3s ease' }}
                            >
                              {t('ui', `signal_labels.${fastestSignal}`)}
                            </h4>

                            <div className="flex items-center gap-3 bg-white/20 border border-white/30 rounded-2xl p-3 shadow-sm mb-4 box-border">
                              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                </svg>
                              </div>
                              <div className="text-left flex flex-col">
                                <span
                                  className="font-serif text-2xl font-black text-foreground leading-none"
                                  style={{ filter: !isPremium ? 'blur(8px)' : 'none', transition: 'filter 0.3s ease' }}
                                >
                                  {fastestTimeSec}<span className="text-sm font-normal ml-0.5">s</span>
                                </span>
                                <span className="font-sans text-[10px] uppercase font-bold text-muted-foreground mt-1">
                                  {langCode === 'tr' ? 'ortalama yanıt' : 'average response'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="w-10 h-px bg-white/30 my-2" />

                          <p
                            className="font-sans text-[0.88rem] text-foreground/80 leading-relaxed m-0 italic"
                            style={{ filter: !isPremium ? 'blur(7px)' : 'none', transition: 'filter 0.3s ease' }}
                          >
                            {rhythmicAnalysis.confident_desc ? rhythmicAnalysis.confident_desc.replace('{signal}', t('ui', `signal_labels.${fastestSignal}`)) : ''}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="seenly-dashboard-locked-state w-full box-border" style={{ minHeight: '260px' }}>
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
                    {/* CTA Banner to unlock */}
                    {!isPremium && (
                      <div className="p-6 rounded-3xl border border-primary/30 bg-[#fbf9f4]/95 backdrop-blur-md shadow-contact-sm text-center flex flex-col items-center justify-between gap-4 mt-6 box-border w-full">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold mb-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          </div>
                          <h4 className="font-serif text-lg font-bold text-foreground m-0">
                            {langCode === 'tr' ? 'Bilişsel Ritim ve Ziyaret Verilerinin Kilidini Aç' : 'Unlock Cognitive Rhythm & Visit Analytics'}
                          </h4>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed max-w-xl m-0">
                            {langCode === 'tr'
                              ? 'Profilinin detaylı etkileşim oranlarını, arkadaşlarının soruları yanıtlarken ne kadar duraksadığını ve en hızlı verdikleri kararları öğrenmek için Seenly Plus planına geçin.'
                              : 'Upgrade to Seenly Plus to reveal your conversion details and discover which traits your friends hesitated on when answering.'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleUpgradeToPlus}
                          className="px-8 py-3.5 rounded-2xl font-sans font-bold text-sm tracking-wider bg-primary text-white hover:scale-[1.01] hover:shadow-lg transition-all duration-300 cursor-pointer"
                        >
                          {langCode === 'tr' ? 'PLUS’A GEÇ & KİLİTLERİ AÇ' : 'UPGRADE TO PLUS & UNLOCK'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 4 && (
              <div className="seenly-dashboard-tab-content full-width-layout scrollable-gap-content seenly-gap-editorial-content" style={{ maxWidth: '840px', width: '100%' }}>
                <div className="flex flex-col gap-6 w-full box-border">
                  {/* Header Section */}
                  <div className="flex flex-col items-center text-center w-full box-border pb-2 pt-2">
                    <span className="font-mono text-[0.75rem] uppercase tracking-widest text-gold block mb-1.5 font-bold">
                      {langCode === 'tr' ? 'GELEN ANALİZLER' : 'INCOMING ANALYSES'}
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl font-black text-foreground leading-tight m-0" style={{ letterSpacing: '-0.02em' }}>
                      {langCode === 'tr' ? 'BİREYSEL YANSIMALAR' : 'INDIVIDUAL REFLECTIONS'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed max-w-2xl m-0">
                      {responseHistoryTrans.tab_desc || (langCode === 'tr'
                        ? 'Arkadaşlarınızın profilinizi ziyaret ettikten sonra bıraktığı bireysel analizlerin kronolojik akışını inceleyin.'
                        : 'Explore the chronological feed of individual analyses left by your friends after visiting your profile.')}
                    </p>
                  </div>

                  {/* Vertical Timeline List of Cards */}
                  {responseSessions.length === 0 ? (
                    <div className="p-8 rounded-3xl border border-white/40 bg-white/25 backdrop-blur-md shadow-contact-sm text-center relative overflow-hidden box-border">
                      <span style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'block' }}>✍️</span>
                      <h4 className="font-serif text-lg font-bold text-foreground mt-2 mb-2">
                        {langCode === 'tr' ? 'Henüz Analiz Alınmadı' : 'No Analyses Received Yet'}
                      </h4>
                      <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto m-0">
                        {langCode === 'tr'
                          ? 'Profilinizin linkini yukarıdan kopyalayıp arkadaşlarınıza göndererek ilk yansımalarınızı toplamaya başlayın!'
                          : 'Copy your profile link from above and send it to your friends to start gathering your first reflections!'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 w-full box-border">
                      {visibleResponseSessions.map((session) => {
                        const notificationText = (() => {
                          if (session.readerType === 'telepathic_reader') return responseHistoryTrans.card_notification_telepathic;
                          if (session.readerType === 'clear_reader') return responseHistoryTrans.card_notification_clear;
                          if (session.readerType === 'balanced_reader') return responseHistoryTrans.card_notification_balanced;
                          if (session.readerType === 'casual_explorer') return responseHistoryTrans.card_notification_casual;
                          if (session.readerType === 'social_stranger') return responseHistoryTrans.card_notification_social;
                          return responseHistoryTrans.card_notification_balanced;
                        })();

                        const relativeTime = getRelativeTime(session.completedAt);
                        const isAccurate = session.readerType === 'telepathic_reader' || session.readerType === 'clear_reader';

                        return (
                          <div
                            key={session.id}
                            onClick={() => setSelectedResponse(session)}
                            className="p-6 rounded-3xl border border-white/45 bg-white/25 backdrop-blur-md shadow-contact-sm text-left flex flex-col gap-4 relative box-border hover:scale-[1.01] hover:bg-white/30 transition-all duration-300 cursor-pointer"
                          >
                            <div className="flex justify-between items-center gap-2">
                              <span className="font-serif text-lg font-bold text-foreground">
                                {session.nickname === 'unknown_person' ? t('ui', 'unknown_person') : session.nickname}
                              </span>

                              <span className="font-mono text-xs text-muted-foreground font-semibold">
                                {relativeTime}
                              </span>
                            </div>

                            <p className="font-sans text-[0.88rem] leading-relaxed text-foreground/80 m-0 italic">
                              {notificationText}
                            </p>

                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-2 border-t border-white/15">
                              <div>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border ${isAccurate
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                  }`}>
                                  {getObject('readerStyles', session.readerType)?.name || session.readerType.replace('_', ' ').toUpperCase()} ({langCode === 'tr' ? `%${Math.round(session.accuracy)}` : `${Math.round(session.accuracy)}%`})
                                </span>
                              </div>

                              <span className="font-sans text-xs font-bold text-primary tracking-widest uppercase flex items-center gap-1.5 self-end sm:self-center">
                                {langCode === 'tr' ? 'Detayları Gör' : 'View Details'} ➔
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {responseHistoryTotalPages > 1 && (
                        <div
                          className="seenly-response-pagination"
                          aria-label={langCode === 'tr' ? 'Gelen analiz sayfalari' : 'Received analysis pages'}
                        >
                          <button
                            type="button"
                            className="seenly-response-page-btn seenly-response-page-nav"
                            aria-label={langCode === 'tr' ? 'Onceki sayfa' : 'Previous page'}
                            disabled={safeResponseHistoryPage === 1}
                            onClick={() => setResponseHistoryPage((currentPage) => Math.max(1, currentPage - 1))}
                          >
                            &lt;
                          </button>

                          {responseHistoryPageItems.map((pageItem) => {
                            if (typeof pageItem === 'string') {
                              return (
                                <span key={pageItem} className="seenly-response-page-ellipsis" aria-hidden="true">
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
                                className={`seenly-response-page-btn${isActivePage ? ' active' : ''}`}
                                aria-current={isActivePage ? 'page' : undefined}
                                onClick={() => setResponseHistoryPage(pageNumber)}
                              >
                                {pageNumber}
                              </button>
                            );
                          })}

                          <button
                            type="button"
                            className="seenly-response-page-btn seenly-response-page-nav"
                            aria-label={langCode === 'tr' ? 'Sonraki sayfa' : 'Next page'}
                            disabled={safeResponseHistoryPage === responseHistoryTotalPages}
                            onClick={() => setResponseHistoryPage((currentPage) => Math.min(responseHistoryTotalPages, currentPage + 1))}
                          >
                            &gt;
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 5 && (
              <div className="seenly-dashboard-tab-content full-width-layout scrollable-gap-content seenly-gap-editorial-content" style={{ maxWidth: '940px', width: '100%' }}>
                <div className="seenly-plan-page">
                  <div className="seenly-plan-main-grid">

                    {/* Free/Starter Plan Card */}
                    <article className={`seenly-plan-card ${!isPremium ? 'is-active' : ''}`}>
                      {!isPremium && (
                        <div className="seenly-plan-ribbon">
                          {langCode === 'tr' ? 'AKTİF' : 'ACTIVE'}
                        </div>
                      )}

                      {/* Leaf branch background decoration */}
                      <svg className="seenly-plan-leaf-decoration" viewBox="0 0 120 120" fill="none" stroke="currentColor">
                        <path d="M10,110 Q50,70 110,10" strokeDasharray="1 1" />
                        <path d="M110,10 Q98,16 93,26 Q98,32 110,10 Z" fill="currentColor" opacity="0.6" />
                        <path d="M90,30 Q78,36 73,46 Q78,52 90,30 Z" fill="currentColor" opacity="0.6" />
                        <path d="M70,50 Q58,56 53,66 Q58,72 70,50 Z" fill="currentColor" opacity="0.6" />
                        <path d="M50,70 Q38,76 33,86 Q38,92 50,70 Z" fill="currentColor" opacity="0.6" />
                        <path d="M98,20 Q108,30 115,25 Q105,15 98,20 Z" fill="currentColor" opacity="0.6" />
                        <path d="M78,40 Q88,50 95,45 Q85,35 78,40 Z" fill="currentColor" opacity="0.6" />
                        <path d="M58,60 Q68,70 75,65 Q65,55 58,60 Z" fill="currentColor" opacity="0.6" />
                      </svg>

                      <div className="seenly-plan-card-head">
                        <span className="seenly-plan-kicker">{langCode === 'tr' ? 'BAŞLANGIÇ PLANI' : 'STARTER PLAN'}</span>
                      </div>

                      <h4 className="seenly-plan-title">Close Circle</h4>

                      <div className="seenly-plan-price">
                        <strong className="seenly-plan-free-text">{langCode === 'tr' ? 'Ücretsiz' : 'Free'}</strong>
                        <small>{langCode === 'tr' ? 'Başlamak için' : 'To get started'}</small>
                      </div>

                      {/* Diamond divider */}
                      <div className="seenly-plan-diamond-divider">
                        <div className="line" />
                        <span className="diamond">✦</span>
                        <div className="line" />
                      </div>

                      <ul className="seenly-plan-features-list">
                        {freePlanFeatures.map((feature) => (
                          <li key={feature}>
                            <span className="seenly-plan-check-circle-outline">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <button type="button" disabled className="seenly-plan-secondary-btn">
                        {!isPremium
                          ? (langCode === 'tr' ? 'PLAN KULLANILIYOR' : 'PLAN IN USE')
                          : (langCode === 'tr' ? 'DAHİL' : 'INCLUDED')}{' '}
                        <span className="arrow">→</span>
                      </button>
                    </article>

                    {/* Premium / Plus Plan Card */}
                    <article className={`seenly-plan-card seenly-plan-card-plus ${isPremium ? 'is-active' : ''}`}>
                      {isPremium && (
                        <div className="seenly-plan-ribbon">
                          {langCode === 'tr' ? 'AKTİF' : 'ACTIVE'}
                        </div>
                      )}

                      {/* Curvy background abstract lines */}
                      <svg className="seenly-plan-waves-decoration" viewBox="0 0 300 200" fill="none" stroke="currentColor">
                        <path d="M0,150 Q100,50 300,180" />
                        <path d="M0,130 Q120,60 300,150" />
                        <path d="M0,170 Q80,40 300,200" />
                      </svg>

                      <div className="seenly-plan-card-head">
                        <span className="seenly-plan-kicker">{langCode === 'tr' ? 'FULL SEENLY' : 'FULL SEENLY'}</span>
                      </div>

                      <h4 className="seenly-plan-title">Seenly Plus</h4>

                      <div className="seenly-plan-price">
                        <strong className="seenly-plan-plus-price">{t('ui', 'pricing_plan_premium_price')}</strong>
                        <small>{langCode === 'tr' ? 'Tek seferlik yükseltme' : 'One-time upgrade'}</small>
                      </div>

                      {/* Diamond divider */}
                      <div className="seenly-plan-diamond-divider">
                        <div className="line" />
                        <span className="diamond">✦</span>
                        <div className="line" />
                      </div>

                      <ul className="seenly-plan-features-list">
                        {plusPlanFeatures.map((feature) => (
                          <li key={feature}>
                            <span className="seenly-plan-check-circle-solid">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        disabled={isPremium}
                        onClick={handleUpgradeToPlus}
                        className="seenly-plan-primary-btn"
                      >
                        {isPremium
                          ? (langCode === 'tr' ? 'PLAN KULLANILIYOR' : 'PLAN IN USE')
                          : (langCode === 'tr' ? 'Plus’a geç' : 'Upgrade to Plus')}{' '}
                        <span className="arrow">→</span>
                      </button>
                    </article>
                  </div>

                  {/* Extra Respondent Packs Banner */}
                  <section className="seenly-plan-pack-section">

                    {/* Watercolor background leaf branches decoration */}
                    <svg className="seenly-plan-pack-leaf-decoration" viewBox="0 0 120 120" fill="none" stroke="currentColor">
                      <path d="M10,110 Q50,70 110,10" strokeDasharray="1 1" />
                      <path d="M110,10 Q98,16 93,26 Q98,32 110,10 Z" fill="currentColor" opacity="0.6" />
                      <path d="M90,30 Q78,36 73,46 Q78,52 90,30 Z" fill="currentColor" opacity="0.6" />
                      <path d="M70,50 Q58,56 53,66 Q58,72 70,50 Z" fill="currentColor" opacity="0.6" />
                      <path d="M98,20 Q108,30 115,25 Q105,15 98,20 Z" fill="currentColor" opacity="0.6" />
                      <path d="M78,40 Q88,50 95,45 Q85,35 78,40 Z" fill="currentColor" opacity="0.6" />
                    </svg>

                    <div className="seenly-plan-section-head">
                      <span className="seenly-plan-kicker">{langCode === 'tr' ? 'ESNEK KAPASİTE' : 'FLEXIBLE CAPACITY'}</span>
                      <h4>{langCode === 'tr' ? 'Ek katılımcı paketleri' : 'Extra respondent packs'}</h4>
                      <p>
                        {isPremium
                          ? (langCode === 'tr'
                            ? 'Plus planında kapasiten sınırsız olduğu için ek paket satın almana gerek yok.'
                            : 'Plus already includes unlimited capacity, so extra packs are not needed.')
                          : (langCode === 'tr'
                            ? 'Plus’a geçmeden daha fazla yanıt toplamak istersen tek seferlik kapasite ekleyebilirsin.'
                            : 'Add one-off capacity if you want more responses without upgrading to Plus.')}
                      </p>
                    </div>

                    <div className="seenly-plan-pack-grid">
                      {capacityPackOptions.map((pack, idx) => {
                        // Pack theme classes for color coding: 0 -> gold/starter, 1 -> purple, 2 -> green/sage
                        const packTheme = idx === 0 ? 'theme-gold' : idx === 1 ? 'theme-purple' : 'theme-green';
                        return (
                          <article key={pack.amount} className={`seenly-plan-pack ${packTheme} ${isPremium ? 'is-muted' : ''}`}>

                            {/* Inner user icons backdrop */}
                            <div className="seenly-plan-pack-icon-wrap">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                              </svg>
                            </div>

                            <span className="seenly-plan-pack-label">{pack.label}</span>
                            <strong className="seenly-plan-pack-amount">+{pack.amount}</strong>
                            <h5 className="seenly-plan-pack-kicker-h5">{langCode === 'tr' ? 'katılımcı' : 'respondents'}</h5>
                            <div className="seenly-plan-pack-price">{pack.price}</div>

                            <button
                              type="button"
                              disabled={isPremium}
                              onClick={() => handleBuyPack(pack.amount)}
                              className="seenly-plan-pack-btn"
                            >
                              {isPremium
                                ? (langCode === 'tr' ? 'GEREK YOK' : 'NOT NEEDED')
                                : (langCode === 'tr' ? 'PAKETİ EKLE' : 'ADD PACK')}{' '}
                              <span className="arrow">→</span>
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedResponse && !isPremium && createPortal(
        <div
          className="seenly-response-sheet-overlay seenly-locked-overlay"
          onClick={() => setSelectedResponse(null)}
          style={{ zIndex: 99999, alignItems: 'center', justifyContent: 'center' }}
        >
          <section
            className="seenly-response-sheet seenly-locked-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="seenly-response-sheet-close"
              onClick={() => setSelectedResponse(null)}
              aria-label={langCode === 'tr' ? 'Pencereyi kapat' : 'Close dialog'}
            >
              ×
            </button>
            <div className="seenly-response-sheet-locked">
              <span className="seenly-response-sheet-kicker">
                {langCode === 'tr' ? 'Bireysel analiz' : 'Individual analysis'}
              </span>
              <h3>{selectedResponse.nickname === 'unknown_person' ? t('ui', 'unknown_person') : selectedResponse.nickname}</h3>
              <p>
                {responseHistoryTrans.lock_desc || (langCode === 'tr'
                  ? 'Bu yanıtın detaylarını, sinyal puanlarını ve zaman analizini görmek için Plus planına geçebilirsin.'
                  : 'Upgrade to Plus to view this response detail, signal scores, and timing analysis.')}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedResponse(null);
                  handleUpgradeToPlus();
                }}
              >
                {langCode === 'tr' ? 'Plus ile aç' : 'Unlock with Plus'}
              </button>
              <div style={{
                marginTop: '1.75rem',
                padding: '12px 18px',
                borderRadius: '16px',
                background: 'rgba(197, 160, 89, 0.06)',
                border: '1px solid rgba(197, 160, 89, 0.18)',
                fontSize: '0.82rem',
                color: 'var(--color-text-muted, #74593a)',
                lineHeight: '1.45',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                maxWidth: '380px',
                margin: '1.75rem auto 0 auto',
                boxSizing: 'border-box'
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c5a059" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span style={{ textAlign: 'center', fontWeight: '500' }}>
                  {responseHistoryTrans.lock_warning || (langCode === 'tr'
                    ? 'Gizlilik Güvencesi: Bu analizi açsanız dahi oylayan kişinin kimliği gizli kalır. Tüm yansımalar tamamen anonimdir.'
                    : 'Privacy Guard: Even if you unlock this analysis, the identity of the voter remains hidden. All reflections are completely anonymous.')}
                </span>
              </div>
            </div>
          </section>
        </div>,
        document.body
      )}
      {selectedResponse && isPremium && createPortal(
        <div className="seenly-response-sheet-overlay" onClick={() => setSelectedResponse(null)} style={{ zIndex: 99999 }}>
          <section className="seenly-response-sheet" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="seenly-response-sheet-close"
              onClick={() => setSelectedResponse(null)}
              aria-label={langCode === 'tr' ? 'Pencereyi kapat' : 'Close dialog'}
            >

              ×
            </button>

            {!isPremium ? (
              <div className="seenly-response-sheet-locked">
                <span className="seenly-response-sheet-kicker">
                  {langCode === 'tr' ? 'Bireysel analiz' : 'Individual analysis'}
                </span>
                <h3>{selectedResponse.nickname === 'unknown_person' ? t('ui', 'unknown_person') : selectedResponse.nickname}</h3>
                <p>
                  {responseHistoryTrans.lock_desc || (langCode === 'tr'
                    ? 'Bu yanıtın detaylarını, sinyal puanlarını ve zaman analizini görmek için Plus planına geçebilirsin.'
                    : 'Upgrade to Plus to view this response detail, signal scores, and timing analysis.')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedResponse(null);
                    handleUpgradeToPlus();
                  }}
                >
                  {langCode === 'tr' ? 'Plus ile aç' : 'Unlock with Plus'}
                </button>
                <div style={{
                  marginTop: '1.75rem',
                  padding: '12px 18px',
                  borderRadius: '16px',
                  background: 'rgba(197, 160, 89, 0.06)',
                  border: '1px solid rgba(197, 160, 89, 0.18)',
                  fontSize: '0.82rem',
                  color: 'var(--color-text-muted, #74593a)',
                  lineHeight: '1.45',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  maxWidth: '380px',
                  margin: '1.75rem auto 0 auto',
                  boxSizing: 'border-box'
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c5a059" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span style={{ textAlign: 'center', fontWeight: '500' }}>
                    {responseHistoryTrans.lock_warning || (langCode === 'tr'
                      ? 'Gizlilik Güvencesi: Bu analizi açsanız dahi oylayan kişinin kimliği gizli kalır. Tüm yansımalar tamamen anonimdir.'
                      : 'Privacy Guard: Even if you unlock this analysis, the identity of the voter remains hidden. All reflections are completely anonymous.')}
                  </span>
                </div>
              </div>
            ) : (
              (() => {
                const detailSignals = [
                  { key: 'samimiyet', label: langCode === 'tr' ? 'Samimiyet' : 'Sincerity' },
                  { key: 'cekicilik', label: langCode === 'tr' ? 'Çekicilik' : 'Charm' },
                  { key: 'zeka', label: langCode === 'tr' ? 'Zeka' : 'Intellect' },
                  { key: 'vizyon', label: langCode === 'tr' ? 'Vizyon' : 'Vision' },
                  { key: 'enerji', label: langCode === 'tr' ? 'Enerji' : 'Energy' },
                  { key: 'guvenilirlik', label: langCode === 'tr' ? 'Güvenilirlik' : 'Trustworthiness' },
                  { key: 'ego', label: langCode === 'tr' ? 'Ego' : 'Ego' },
                  { key: 'basari', label: langCode === 'tr' ? 'Başarı' : 'Success' },
                  { key: 'comertlik', label: langCode === 'tr' ? 'Cömertlik' : 'Generosity' },
                  { key: 'olgunluk', label: langCode === 'tr' ? 'Olgunluk' : 'Maturity' }
                ];
                const responseSignals = selectedResponse.signals || {};
                const rankedSignals = detailSignals
                  .map((signal) => ({
                    ...signal,
                    value: responseSignals[signal.key] !== undefined ? responseSignals[signal.key] : 3
                  }))
                  .sort((first, second) => second.value - first.value);
                const strongestValue = rankedSignals[0].value;
                const calmestValue = rankedSignals[rankedSignals.length - 1].value;
                const strongestSignals = rankedSignals.filter((signal) => signal.value === strongestValue);
                const calmestSignals = rankedSignals.filter((signal) => signal.value === calmestValue);
                const timeEntries = Object.entries(selectedResponse.friendTimeAnalytics || {})
                  .filter(([, value]) => value && value > 0);
                const slowestEntry = timeEntries.reduce((winner, entry) => (!winner || entry[1] > winner[1] ? entry : winner), null);
                const fastestEntry = timeEntries.reduce((winner, entry) => (!winner || entry[1] < winner[1] ? entry : winner), null);
                const signalLabelByKey = Object.fromEntries(detailSignals.map((signal) => [signal.key, signal.label]));
                const readerName = getObject('readerStyles', selectedResponse.readerType)?.name || selectedResponse.readerType.replace('_', ' ').toUpperCase();

                return (
                  <div className="seenly-response-sheet-content">
                    <header className="seenly-response-sheet-header">
                      <h3>{selectedResponse.nickname === 'unknown_person' ? t('ui', 'unknown_person') : selectedResponse.nickname}</h3>
                      <div className="seenly-response-sheet-meta">
                        <span>{readerName}</span>
                        <span>{langCode === 'tr' ? `%${Math.round(selectedResponse.accuracy)}` : `${Math.round(selectedResponse.accuracy)}%`}</span>
                      </div>
                      <p className="seenly-response-sheet-accuracy-note">
                        {langCode === 'tr'
                          ? 'Bu yüzde, arkadaşının okumasının self algınla ne kadar örtüştüğünü gösterir.'
                          : 'This percentage shows how closely your friend’s reading matches your self-perception.'}
                      </p>
                    </header>

                    <div className="seenly-response-sheet-summary">
                      <article className="is-strongest">
                        <span>{responseHistoryTrans.highest_signal_label || (langCode === 'tr' ? 'En belirgin yönünüz' : 'Strongest signal')}</span>
                        <div className="seenly-response-chip-list">
                          {strongestSignals.map((signal) => (
                            <em key={signal.key}>{signal.label}</em>
                          ))}
                        </div>
                        <small>{langCode === 'tr' ? `%${strongestValue * 20}` : `${strongestValue * 20}%`}</small>
                      </article>
                      <article className="is-calmest">
                        <span>{responseHistoryTrans.lowest_signal_label || (langCode === 'tr' ? 'En sakin yönünüz' : 'Calmest signal')}</span>
                        <div className="seenly-response-chip-list">
                          {calmestSignals.map((signal) => (
                            <em key={signal.key}>{signal.label}</em>
                          ))}
                        </div>
                        <small>{langCode === 'tr' ? `%${calmestValue * 20}` : `${calmestValue * 20}%`}</small>
                      </article>
                    </div>

                    <div className="seenly-response-sheet-section">
                      <div className="seenly-response-sheet-section-head">
                        <h4>{langCode === 'tr' ? 'Sinyal dağılımı' : 'Signal distribution'}</h4>
                        <p>{langCode === 'tr' ? 'Bu kişi sizi hangi sosyal sinyallerde daha güçlü gördü?' : 'How strongly did this person read each social signal?'}</p>
                      </div>
                      <div className="seenly-response-signal-list">
                        {detailSignals.map((signal) => {
                          const value = responseSignals[signal.key] !== undefined ? responseSignals[signal.key] : 3;
                          const percent = value * 20;
                          return (
                            <div className="seenly-response-signal-row" key={signal.key}>
                              <span>{signal.label}</span>
                              <div>
                                <i style={{ width: `${percent}%` }} />
                              </div>
                              <strong>{langCode === 'tr' ? `%${percent}` : `${percent}%`}</strong>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {timeEntries.length > 0 && (
                      <div className="seenly-response-sheet-section">
                        <div className="seenly-response-sheet-section-head">
                          <h4>{langCode === 'tr' ? 'Yanıt ritmi' : 'Response rhythm'}</h4>
                          <p>{langCode === 'tr' ? 'Sorularda nerede duraksadı, nerede hızlı karar verdi?' : 'Where did they pause, and where did they decide quickly?'}</p>
                        </div>
                        <div className="seenly-response-rhythm-grid">
                          {slowestEntry && (
                            <article>
                              <span>{langCode === 'tr' ? 'En çok düşündüğü' : 'Longest pause'}</span>
                              <strong>{signalLabelByKey[slowestEntry[0]] || slowestEntry[0]}</strong>
                              <small>{(slowestEntry[1] / 1000).toFixed(1)}s</small>
                            </article>
                          )}
                          {fastestEntry && (
                            <article>
                              <span>{langCode === 'tr' ? 'En hızlı geçtiği' : 'Fastest answer'}</span>
                              <strong>{signalLabelByKey[fastestEntry[0]] || fastestEntry[0]}</strong>
                              <small>{(fastestEntry[1] / 1000).toFixed(1)}s</small>
                            </article>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="seenly-response-sheet-note">
                      {responseHistoryTrans.editorial_note || (langCode === 'tr'
                        ? 'Her farklı gözlem, sosyal algınızın başka bir yüzünü görünür kılar.'
                        : 'Every response reveals another side of your social perception.')}
                    </p>
                  </div>
                );
              })()
            )}
          </section>
        </div>,
        document.body
      )}

      {selectedResponse && false && (
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
          <div className="seenly-modal-container animate-scale-in" onClick={(e) => e.stopPropagation()} style={{
            background: 'rgba(253, 251, 247, 0.98)',
            border: '1px solid rgba(229, 162, 96, 0.22)',
            borderRadius: '28px',
            padding: '3rem 2.25rem 2.5rem 2.25rem',
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxSizing: 'border-box',
            position: 'relative',
            boxShadow: '0 24px 64px rgba(11, 27, 44, 0.08)'
          }}>


            {/* Close Button */}
            <button
              type="button"
              className="seenly-response-modal-close"
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
                zIndex: 10,
                transition: 'background-color 0.2s ease, color 0.2s ease'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Modal Content */}
            {!isPremium ? (
              <div className="seenly-response-detail seenly-response-detail-locked" style={{ textAlign: 'center' }}>
                <span className="font-mono" style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--color-smoky-lavender)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  marginBottom: '0.5rem',
                  display: 'none'
                }}>
                  {responseHistoryTrans.detail_title || 'ARKADAŞININ GÖZÜNDEN SİZ'}
                </span>

                <h4 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '2.1rem',
                  fontWeight: 900,
                  color: 'var(--color-deep-ink)',
                  margin: '0.25rem 0 0.5rem 0',
                  lineHeight: 1.1
                }}>
                  {selectedResponse.nickname === 'unknown_person' ? t('ui', 'unknown_person') : selectedResponse.nickname}
                </h4>

                <ConnectorDots className="w-28 h-6 text-gold/45 my-3 mx-auto" variant="flat" />

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '1rem 0 0 0',
                  boxSizing: 'border-box'
                }}>
                  {/* Glowing Premium Lock Icon */}
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(217, 106, 83, 0.12) 0%, rgba(143, 123, 204, 0.08) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-burnt-coral)',
                    border: '1px solid rgba(217, 106, 83, 0.22)',
                    marginBottom: '1.25rem',
                    boxShadow: '0 8px 24px rgba(217, 106, 83, 0.06)'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>

                  <span className="hidden font-mono text-[9px] uppercase tracking-[0.24em] text-gold font-bold mb-2">
                    PLUS BİREYSEL DETAY
                  </span>

                  <h3 className="font-serif text-lg font-bold text-foreground mb-3 leading-tight" style={{ maxWidth: '340px', margin: '0 auto 10px auto' }}>
                    {langCode === 'tr'
                      ? 'Bu Analizin Detayları Kilitli'
                      : 'Details of This Analysis are Locked'}
                  </h3>

                  <p style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.86rem',
                    lineHeight: '1.6',
                    color: 'var(--color-text-muted)',
                    maxWidth: '360px',
                    margin: '0 auto 2rem auto',
                    opacity: 0.9,
                    textAlign: 'center'
                  }}>
                    {langCode === 'tr'
                      ? `${selectedResponse.nickname === 'unknown_person' ? 'Bir arkadaşınız' : selectedResponse.nickname} sizin hakkınızda yansımasını bıraktı! Hangi özelliklerinize kaç puan verdiğini ve varsa yazdığı özel notları okumak için Seenly Plus'a geç.`
                      : `${selectedResponse.nickname === 'unknown_person' ? 'A friend' : selectedResponse.nickname} left their reflection about you! Upgrade to Seenly Plus to see what scores they gave to each of your signals.`}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedResponse(null);
                      handleUpgradeToPlus();
                    }}
                    style={{
                      width: '100%',
                      padding: '0.9rem 1.5rem',
                      borderRadius: '100px',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      letterSpacing: '0.04em',
                      backgroundColor: 'var(--color-deep-ink)',
                      color: 'var(--color-paper-cream)',
                      border: 'none',
                      boxShadow: '0 8px 24px rgba(11, 27, 44, 0.08)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                  >
                    {langCode === 'tr' ? 'PLUS’A GEÇ & KİLİDİ AÇ' : 'UPGRADE TO PLUS & UNLOCK'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="seenly-response-detail seenly-response-detail-premium" style={{ textAlign: 'center' }}>
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
                    {getObject('readerStyles', selectedResponse.readerType)?.name || selectedResponse.readerType.replace('_', ' ').toUpperCase()} ({langCode === 'tr' ? `%${Math.round(selectedResponse.accuracy)}` : `${Math.round(selectedResponse.accuracy)}%`})
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
                                  {langCode === 'tr' ? 'En Çok Düşündüğü' : 'Pondered Most'}
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
                                  {langCode === 'tr' ? 'En Hızlı Geçtiği' : 'Answered Fastest'}
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
                                {langCode === 'tr' ? 'En Çok Düşündüğü' : 'Pondered Most'}
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
                                {langCode === 'tr' ? 'En Hızlı Geçtiği' : 'Answered Fastest'}
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
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
