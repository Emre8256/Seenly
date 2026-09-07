import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UsersRound, Copy, Check } from 'lucide-react';
import { useSeenlyShare, buildWhatsAppLink } from '../hooks/useSeenlyShare';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';
import { getOwnerDashboard, getOwnerResponseHistory, createPaymentCheckout, PAYMENT_PRODUCT_CODES } from '../services/api';
import { getCardRarityData } from '../utils/rarityEngine';
import { calibrateTraitScore, calculateCalibratedAlignment, calibrateAccuracyScore } from '../utils/psychometrics';
import { CARD_IMAGES } from '../images/cardImages';
import { getAvatarSrc } from '../images/avatars';

import SelfPerceptionTab from './dashboard/SelfPerceptionTab';
import OutsidePerceptionTab from './dashboard/OutsidePerceptionTab';
import DashboardGapTab from './dashboard/DashboardGapTab';
import DecisionTimesTab from './dashboard/DecisionTimesTab';
import DashboardResponsesTab from './dashboard/DashboardResponsesTab';
import ResponseDetailDrawer from './dashboard/ResponseDetailDrawer';
import DashboardQrModal from './dashboard/DashboardQrModal';

const SIGNATURE_IMAGES = CARD_IMAGES;
const RESPONSE_HISTORY_PAGE_SIZE = 5;

export default function DashboardPage({ onNavigateToQuiz }) {
  const { locale: langCode, t, getObject } = useLocale();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Self, 1: Outside, 2: Gap, 3: DecisionTimes/Engagement, 4: Responses
  const { handleInstagramStory, isGenerating } = useSeenlyShare();
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [responseHistoryPage, setResponseHistoryPage] = useState(1);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [responseHistory, setResponseHistory] = useState({ items: [], nextCursor: null, hasMore: false, totalCount: 0 });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const getRelativeTime = useCallback((isoString) => {
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
  }, [langCode]);

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
        if (data?.avatar) {
          localStorage.setItem('seenly_avatar', data.avatar);
        }
        if (data?.publicSlug) {
          localStorage.setItem('seenly_owner_slug', data.publicSlug);
        }
        setSnapshot(data);
        if (data?.isPremium) {
          setHistoryLoading(true);
          try {
            setResponseHistory(await getOwnerResponseHistory(token));
          } catch (historyRequestError) {
            setHistoryError(historyRequestError.message || 'Response history could not be loaded.');
          } finally {
            setHistoryLoading(false);
          }
        }
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem('seenly_owner_token');
          localStorage.removeItem('seenly_display_name');
          localStorage.removeItem('seenly_owner_slug');
          sessionStorage.clear();
          setError('session_expired');
        } else {
          setError(`http_${err.status || 'network'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil((responseHistory.items.length || 0) / RESPONSE_HISTORY_PAGE_SIZE)
    );

    setResponseHistoryPage((currentPage) => Math.min(currentPage, totalPages));
  }, [responseHistory.items.length]);

  const loadMoreResponseHistory = useCallback(async () => {
    if (!responseHistory.hasMore || !responseHistory.nextCursor || historyLoading) return;
    const token = localStorage.getItem('seenly_owner_token');
    if (!token) return;
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const next = await getOwnerResponseHistory(token, responseHistory.nextCursor);
      setResponseHistory(current => ({
        items: [...current.items, ...next.items],
        nextCursor: next.nextCursor,
        hasMore: next.hasMore,
        totalCount: next.totalCount
      }));
    } catch (requestError) {
      setHistoryError(requestError.message || 'Response history could not be loaded.');
    } finally {
      setHistoryLoading(false);
    }
  }, [historyLoading, responseHistory.hasMore, responseHistory.nextCursor]);

  useEffect(() => {
    if (selectedResponse || qrModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedResponse, qrModalOpen]);

  const handleCopyLink = useCallback(() => {
    if (!snapshot || !snapshot.publicSlug) return;
    const inviteUrl = `${window.location.origin}/#/friend/${snapshot.publicSlug}`;
    navigator.clipboard.writeText(inviteUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => { });
  }, [snapshot]);

  const handleUpgradeToPlus = useCallback(async () => {
    if (snapshot?.isPremium || snapshot?.premium) {
      alert(langCode === 'tr' ? 'Zaten Seenly Plus planındasınız.' : 'You are already on the Seenly Plus plan.');
      return;
    }

    const token = localStorage.getItem('seenly_owner_token');
    if (!token) return;

    try {
      const checkout = await createPaymentCheckout(token, PAYMENT_PRODUCT_CODES.SEENLY_PLUS);
      if (!checkout.checkoutUrl) throw new Error('Checkout is unavailable.');
      window.location.assign(checkout.checkoutUrl);
    } catch (err) {
      alert(langCode === 'tr'
        ? `Seenly Plus satın alma işlemi başlatılamadı: ${err.message}`
        : `Seenly Plus purchase could not be started: ${err.message}`);
    }
  }, [snapshot?.isPremium, snapshot?.premium, langCode]);

  const getSelfAnswers = useCallback(() => {
    try {
      return JSON.parse(sessionStorage.getItem('seenly_answers')) || {};
    } catch (e) {
      return {};
    }
  }, []);

  const getSelfScoresMap = useCallback(() => {
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
  }, [snapshot?.selfAverages, getSelfAnswers]);

  const calculatePersonalityCard = useCallback((scores) => {
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
  }, []);

  const get10Signals = useCallback((lang, isOutside = false) => {
    const answers = getSelfAnswers();

    const outsideAverages = {};
    if (snapshot?.friendAverages && Object.keys(snapshot.friendAverages).length > 0) {
      Object.entries(snapshot.friendAverages).forEach(([k, v]) => {
        outsideAverages[k] = Number(v);
      });
    }
    if (snapshot?.responseSessions && snapshot.responseSessions.length > 0) {
      const lensTotals = {};
      const lensCounts = {};
      snapshot.responseSessions.forEach(sess => {
        if (sess.signals) {
          Object.entries(sess.signals).forEach(([k, v]) => {
            lensTotals[k] = (lensTotals[k] || 0) + Number(v);
            lensCounts[k] = (lensCounts[k] || 0) + 1;
          });
        }
      });
      Object.keys(lensTotals).forEach(k => {
        outsideAverages[k] = lensTotals[k] / lensCounts[k];
      });
    }

    const selfAverages = {};
    if (snapshot?.selfAverages && Object.keys(snapshot.selfAverages).length > 0) {
      Object.entries(snapshot.selfAverages).forEach(([k, v]) => {
        selfAverages[k] = Number(v);
      });
    }

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
      let val;
      if (isOutside) {
        val = outsideAverages[d.key];
      } else {
        val = selfAverages[d.key];
        if (val === undefined || val === null) {
          const selfKey = `classic_self_${d.key}_01`;
          if (answers[selfKey] !== undefined) {
            val = Number(answers[selfKey]);
          }
        }
      }

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
  }, [snapshot?.friendAverages, snapshot?.responseSessions, snapshot?.selfAverages, getSelfAnswers]);

  const normalizeScore = useCallback((value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 3;
    if (numericValue > 1.0001 || numericValue === 1) {
      return Math.max(1, Math.min(5, numericValue));
    }
    return Math.max(1, Math.min(5, 1 + numericValue * 4));
  }, []);

  const fillTemplate = useCallback((template, values) => {
    if (!template) return '';
    return Object.entries(values).reduce(
      (text, [key, value]) => text.replaceAll(`{${key}}`, value),
      template
    );
  }, []);

  const getSessionCalibratedAccuracy = useCallback((session) => {
    if (!session) return 75;
    return calibrateAccuracyScore(session.accuracy);
  }, []);

  const responseSessions = useMemo(() => {
    return [...responseHistory.items].sort((firstSession, secondSession) => {
      const firstDate = new Date(firstSession.completedAt || 0).getTime();
      const secondDate = new Date(secondSession.completedAt || 0).getTime();
      return secondDate - firstDate;
    });
  }, [responseHistory.items]);

  const getGapEditorialReport = useCallback(() => {
    const selfSignals = get10Signals(langCode, false);
    const friendSignals = get10Signals(langCode, true);
    const friendSignalMap = friendSignals.reduce((acc, signal) => {
      acc[signal.key] = signal;
      return acc;
    }, {});

    const selfScoresMap = {};
    const friendScoresMap = {};
    selfSignals.forEach(s => { selfScoresMap[s.key] = s.value; });
    friendSignals.forEach(s => { friendScoresMap[s.key] = s.value; });

    const rows = selfSignals.map((selfSignal) => {
      const friendSignal = friendSignalMap[selfSignal.key] || selfSignal;
      const selfScore = normalizeScore(selfSignal.value);
      const friendScore = normalizeScore(friendSignal.value);

      const selfCalibrated = selfSignal.percentage;
      const friendCalibrated = friendSignal.percentage;
      const gap = Math.abs(selfCalibrated - friendCalibrated);

      return {
        key: selfSignal.key,
        label: selfSignal.label,
        selfScore,
        friendScore,
        selfCalibrated,
        friendCalibrated,
        gap,
        selfPosition: selfCalibrated,
        friendPosition: friendCalibrated
      };
    });

    const sessionAccuracies = (responseSessions && responseSessions.length > 0)
      ? responseSessions.map(s => getSessionCalibratedAccuracy(s))
      : [];

    const alignmentRatio = sessionAccuracies.length > 0
      ? Math.round(sessionAccuracies.reduce((acc, curr) => acc + curr, 0) / sessionAccuracies.length)
      : calculateCalibratedAlignment(selfScoresMap, friendScoresMap);

    const sortedByAlignment = [...rows].sort((a, b) => {
      if (a.gap !== b.gap) return a.gap - b.gap;
      return a.label.localeCompare(b.label);
    });
    const deepAlignment = sortedByAlignment[0];

    const blindSpotCandidates = rows.filter(r => r.key !== deepAlignment.key);
    const sortedByLift = [...(blindSpotCandidates.length ? blindSpotCandidates : rows)].sort((a, b) => {
      const liftA = a.friendCalibrated - a.selfCalibrated;
      const liftB = b.friendCalibrated - b.selfCalibrated;
      if (liftA !== liftB) return liftB - liftA;
      return a.label.localeCompare(b.label);
    });
    const blindSpot = sortedByLift[0];

    const illusionCandidates = rows.filter(r => r.key !== deepAlignment.key && r.key !== blindSpot.key);
    const sortedByDrop = [...(illusionCandidates.length ? illusionCandidates : rows.filter(r => r.key !== deepAlignment.key))].sort((a, b) => {
      const dropA = a.selfCalibrated - a.friendCalibrated;
      const dropB = b.selfCalibrated - b.friendCalibrated;
      if (dropA !== dropB) return dropB - dropA;
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
  }, [get10Signals, langCode, normalizeScore, responseSessions, getSessionCalibratedAccuracy]);

  if (loading) {
    return (
      <AppShell isDashboard={true} watercolorBackground>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '8rem 1.5rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontStyle: 'italic', color: 'var(--color-text-muted)', margin: 0 }}>
            {t('ui', 'missing_id_fallback')}...
          </p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    const errorCopy = (() => {
      if (error === 'no_token' || error === 'session_expired' || error === 'http_401' || error === 'http_403') {
        return langCode === 'tr'
          ? ['Oturumunuz sona erdi', 'Güvenliğiniz için yeniden giriş yapmanız gerekiyor.']
          : ['Your session has ended', 'Please sign in again to continue securely.'];
      }
      if (error === 'http_404') return langCode === 'tr'
        ? ['Profil bulunamadı', 'İstenen Seenly profili mevcut değil veya silinmiş.']
        : ['Profile not found', 'The requested Seenly profile does not exist or was removed.'];
      if (error === 'http_409') return langCode === 'tr'
        ? ['İşlem tamamlanamadı', 'Bilgiler başka bir işlemle çakıştı. Sayfayı yenileyip tekrar deneyin.']
        : ['Action could not be completed', 'The data conflicted with another action. Refresh and try again.'];
      if (error === 'http_429') return langCode === 'tr'
        ? ['Çok fazla istek', 'Kısa bir süre bekleyip tekrar deneyin.']
        : ['Too many requests', 'Wait a moment and try again.'];
      if (error === 'http_503') return langCode === 'tr'
        ? ['Seenly geçici olarak kullanılamıyor', 'Hizmet kısa süre içinde yeniden kullanılabilir.']
        : ['Seenly is temporarily unavailable', 'The service should be available again shortly.'];
      if (error === 'http_network') return langCode === 'tr'
        ? ['Bağlantı kurulamadı', 'İnternet bağlantınızı kontrol edip tekrar deneyin.']
        : ['Connection problem', 'Check your internet connection and try again.'];
      return langCode === 'tr'
        ? ['Beklenmeyen bir sorun oluştu', 'Bilgileriniz yüklenemedi. Lütfen tekrar deneyin.']
        : ['Something went wrong', 'Your information could not be loaded. Please try again.'];
    })();
    return (
      <AppShell isDashboard={true} watercolorBackground>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '6rem 1.5rem', textAlign: 'center' }}>
          <div className="editorial-card" style={{ maxWidth: '500px', width: '100%', padding: '3rem 2rem' }}>
            <h2 className="editorial-title" style={{ color: 'red', fontSize: '1.75rem', marginBottom: '1.5rem' }}>
              {errorCopy[0]}
            </h2>
            <p className="editorial-body" style={{ color: 'var(--color-text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
              {errorCopy[1]}
            </p>
            <button
              type="button"
              className="btn-editorial"
              onClick={() => error === 'no_token' || error === 'session_expired'
                ? window.location.hash = '#/' : window.location.reload()}
              style={{ width: '100%' }}
            >
              {error === 'no_token' || error === 'session_expired'
                ? (langCode === 'tr' ? 'Girişe dön' : 'Back to sign in')
                : (langCode === 'tr' ? 'Tekrar dene' : 'Try again')}
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

  const displayName = capitalizeName(snapshot?.displayName || sessionStorage.getItem('seenly_displayName') || 'User');
  const avatarSrc = getAvatarSrc(snapshot?.avatar || localStorage.getItem('seenly_avatar'));
  const responseCount = snapshot?.responseCount || 0;
  const isPremium = snapshot?.isPremium || snapshot?.premium || false;

  // Signatures
  const activeSelfSignatureId = calculatePersonalityCard(getSelfScoresMap());
  const selfSignature = getObject('signatures', activeSelfSignatureId);
  const selfSignatureName = selfSignature ? selfSignature.name : t('ui', 'missing_id_fallback');
  const selfSignatureCardLine = selfSignature ? selfSignature.cardLine : "";

  const activeOutsideSignatureId = calculatePersonalityCard(snapshot?.friendAverages || {});
  const outsideSignature = getObject('signatures', activeOutsideSignatureId);
  const outsideSignatureName = outsideSignature ? outsideSignature.name : t('ui', 'missing_id_fallback');
  const outsideSignatureCardLine = outsideSignature ? outsideSignature.cardLine : "";

  // Rarities
  const selfRarity = getCardRarityData(activeSelfSignatureId, snapshot?.selfRarity, langCode);
  const outsideRarity = getCardRarityData(activeOutsideSignatureId, snapshot?.outsideRarity, langCode);

  const _shareSlug = snapshot?.publicSlug || '';
  const getDashboardWhatsAppLink = (cardName) => buildWhatsAppLink(cardName, _shareSlug);
  const handleDashboardInstagramStory = (cardName, illustrationSrc) => {
    handleInstagramStory(cardName, illustrationSrc, _shareSlug, langCode);
  };

  // Rhythm Timing Calculations
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

  const responseHistoryTrans = getObject('ui', 'response_history') || {};
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

  const rawClicks = snapshot?.totalProfileClicks ?? 0;
  const totalResponders = snapshot?.totalResponders ?? responseCount;
  const totalProfileClicks = rawClicks;
  const ratio = totalProfileClicks > 0 ? Math.round((totalResponders / totalProfileClicks) * 100) : 0;

  // Gap Descriptions
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
  const gapBlindSpotDesc = getBlindSpotDescription(gapEditorial.blindSpot);
  const gapIllusionDesc = getIllusionDescription(gapEditorial.illusionOfSelf);
  const gapAlignmentDesc = getAlignmentDescription(gapEditorial.deepAlignment);

  return (
    <AppShell isDashboard={true} userName={displayName} watercolorBackground>
      <div className="seenly-dashboard-page-wrapper">
        <div className="seenly-dashboard-container">

          {/* Dashboard Header: Seamless Profile Hero */}
          <header className="seenly-dashboard-header w-full flex justify-center items-center py-5 sm:py-6 px-3 sm:px-4 bg-transparent border-b-0">
            <div className="flex flex-col items-center justify-center gap-3 sm:gap-3.5 w-full max-w-[480px] mx-auto text-center">
              {/* Centered Large Avatar */}
              <div className="relative mx-auto">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={displayName}
                    className="rounded-full object-cover shadow-md"
                    style={{
                      width: 'clamp(86px, 14vw, 112px)',
                      height: 'clamp(86px, 14vw, 112px)',
                      border: '3.5px solid #C5A059',
                      boxShadow: '0 8px 24px rgba(197, 160, 89, 0.28)'
                    }}
                  />
                ) : (
                  <div
                    className="rounded-full flex items-center justify-center font-serif text-3xl sm:text-4xl font-black text-white shadow-md mx-auto"
                    style={{
                      width: 'clamp(86px, 14vw, 112px)',
                      height: 'clamp(86px, 14vw, 112px)',
                      backgroundColor: '#1A3E72',
                      border: '3.5px solid #C5A059',
                      boxShadow: '0 8px 24px rgba(197, 160, 89, 0.28)'
                    }}
                  >
                    {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>

              {/* Centered Name & Response Badge */}
              <div className="flex flex-col items-center text-center w-full px-2">
                <h2
                  className="font-serif text-[1.65rem] sm:text-[2.25rem] font-bold text-[#1A202C] tracking-tight leading-tight m-0 break-words max-w-full"
                  title={displayName}
                >
                  {displayName}
                </h2>

                <div className="flex items-center justify-center gap-2 mt-1.5 sm:mt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] sm:text-[12.5px] font-semibold bg-[rgba(26,62,114,0.06)] text-[#1A3E72] border border-[rgba(26,62,114,0.14)] shadow-xs">
                    <UsersRound size={12.5} strokeWidth={2.4} />
                    <span>
                      {responseCount} {langCode === 'tr' ? 'Yanıt' : (responseCount === 1 ? 'Response' : 'Responses')}
                    </span>
                  </span>
                </div>
              </div>

              {/* Minimalist Dual Action Share Bar */}
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 w-full max-w-[340px] px-2">
                <div
                  className="inline-flex items-center justify-center w-full sm:w-auto rounded-2xl bg-[#0B1B2C] border border-[#1E334A] p-1 shadow-md transition-all hover:border-[rgba(197,160,89,0.45)] box-border"
                  style={{ boxShadow: '0 4px 16px rgba(11, 27, 44, 0.18)' }}
                >
                  {/* Copy Link Button */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-[#FDFDF8] text-[12px] sm:text-[13px] font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {copied ? (
                      <>
                        <Check size={14} strokeWidth={2.8} className="text-emerald-400" />
                        <span className="text-emerald-300">{langCode === 'tr' ? 'Kopyalandı!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} strokeWidth={2.2} className="text-[#C5A059]" />
                        <span>{langCode === 'tr' ? 'Linki Kopyala' : 'Copy Link'}</span>
                      </>
                    )}
                  </button>

                  <div className="w-[1px] h-5 bg-white/15 mx-1 shrink-0" />

                  {/* QR Button */}
                  <button
                    type="button"
                    onClick={() => setQrModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2.5 rounded-xl text-[#FDFDF8]/90 hover:text-white hover:bg-white/10 active:scale-[0.98] text-[12px] sm:text-[13px] font-semibold transition-all cursor-pointer shrink-0"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    title={langCode === 'tr' ? 'Karekod' : 'QR Code'}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-[#C5A059]">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      <path d="M12 7v1M12 16v1M7 12h1M16 12h1" />
                    </svg>
                    <span>{langCode === 'tr' ? 'Karekod' : 'QR'}</span>
                  </button>
                </div>

                <p className="text-[11px] sm:text-[11.5px] text-[#718096] text-center m-0 font-sans max-w-[280px] sm:max-w-none">
                  {langCode === 'tr' ? 'Arkadaşlarının seni okuması için bu linki paylaş' : 'Share this link for friends to read your signals'}
                </p>
              </div>
            </div>
          </header>

          {/* Tab Navigation */}
          <div className="seenly-dashboard-tabs-wrapper">
            <div className="seenly-dashboard-tabs-capsule">
              {[
                { id: 0, tr: 'Kendi Algım', en: 'Self Seenly' },
                { id: 1, tr: 'Dış Algı', en: 'Outside Seenly' },
                { id: 2, tr: 'Aradaki Fark', en: 'The Gap' },
                { id: 3, tr: 'Etkileşim', en: 'Engagement' },
                { id: 4, tr: 'Gelen Analizler', en: 'Received Analytics' }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                const label = langCode === 'tr' ? tab.tr : tab.en;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`seenly-tab-pill ${isActive ? 'active' : ''}`}
                  >
                    {tab.id === 3 ? t('ui', 'engagement_feed_title') : (tab.id === 4 ? (responseHistoryTrans.menu_title || label) : label)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dashboard Body */}
          <div className="seenly-dashboard-body">
            {/* TAB 0: SELF PERCEPTION */}
            {activeTab === 0 && (
              <SelfPerceptionTab
                langCode={langCode}
                selfSignatureName={selfSignatureName}
                selfRarity={selfRarity}
                selfSignatureCardLine={selfSignatureCardLine}
                SIGNATURE_IMAGES={SIGNATURE_IMAGES}
                activeSelfSignatureId={activeSelfSignatureId}
                getDashboardWhatsAppLink={getDashboardWhatsAppLink}
                handleDashboardInstagramStory={handleDashboardInstagramStory}
                isGenerating={isGenerating}
                get10Signals={get10Signals}
              />
            )}

            {/* TAB 1: OUTSIDE PERCEPTION */}
            {activeTab === 1 && (
              <OutsidePerceptionTab
                langCode={langCode}
                t={t}
                responseCount={responseCount}
                outsideSignatureName={outsideSignatureName}
                outsideRarity={outsideRarity}
                outsideSignatureCardLine={outsideSignatureCardLine}
                SIGNATURE_IMAGES={SIGNATURE_IMAGES}
                activeOutsideSignatureId={activeOutsideSignatureId}
                getDashboardWhatsAppLink={getDashboardWhatsAppLink}
                handleDashboardInstagramStory={handleDashboardInstagramStory}
                isGenerating={isGenerating}
                get10Signals={get10Signals}
              />
            )}

            {/* TAB 2: GAP ANALYSIS */}
            {activeTab === 2 && (
              <DashboardGapTab
                langCode={langCode}
                t={t}
                responseCount={responseCount}
                gapEditorial={gapEditorial}
                gapBlindSpotDesc={gapBlindSpotDesc}
                gapIllusionDesc={gapIllusionDesc}
                gapAlignmentDesc={gapAlignmentDesc}
              />
            )}

            {/* TAB 3: ENGAGEMENT & DECISION TIMES */}
            {activeTab === 3 && (
              <DecisionTimesTab
                langCode={langCode}
                t={t}
                responseCount={responseCount}
                isPremium={isPremium}
                handleUpgradeToPlus={handleUpgradeToPlus}
                totalProfileClicks={totalProfileClicks}
                totalResponders={totalResponders}
                ratio={ratio}
                slowestSignal={slowestSignal}
                slowestTimeSec={slowestTimeSec}
                fastestSignal={fastestSignal}
                fastestTimeSec={fastestTimeSec}
              />
            )}

            {/* TAB 4: RECEIVED ANALYTICS */}
            {activeTab === 4 && (
              <DashboardResponsesTab
                langCode={langCode}
                isPremium={isPremium}
                handleUpgradeToPlus={handleUpgradeToPlus}
                responseSessions={responseSessions}
                visibleResponseSessions={visibleResponseSessions}
                setSelectedResponse={setSelectedResponse}
                safeResponseHistoryPage={safeResponseHistoryPage}
                responseHistoryTotalPages={responseHistoryTotalPages}
                responseHistoryPageItems={responseHistoryPageItems}
                setResponseHistoryPage={setResponseHistoryPage}
                getRelativeTime={getRelativeTime}
                getSessionCalibratedAccuracy={getSessionCalibratedAccuracy}
                getObject={getObject}
                historyLoading={historyLoading}
                historyError={historyError}
                historyHasMore={responseHistory.hasMore}
                loadMoreResponseHistory={loadMoreResponseHistory}
              />
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: RESPONSE DETAIL (Free & Plus) */}
      <ResponseDetailDrawer
        selectedResponse={selectedResponse}
        setSelectedResponse={setSelectedResponse}
        isPremium={isPremium}
        langCode={langCode}
        handleUpgradeToPlus={handleUpgradeToPlus}
        getObject={getObject}
        getSessionCalibratedAccuracy={getSessionCalibratedAccuracy}
        getRelativeTime={getRelativeTime}
      />

      {/* MODAL 2: QR CODE MODAL */}
      <DashboardQrModal
        qrModalOpen={qrModalOpen}
        setQrModalOpen={setQrModalOpen}
        snapshot={snapshot}
        displayName={displayName}
        langCode={langCode}
      />
    </AppShell>
  );
}
