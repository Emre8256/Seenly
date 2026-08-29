import React, { useState, useEffect } from 'react';
import { Activity, ArrowRight, ArrowUp, ArrowDown, ArrowUpRight, BarChart2, Check, CircleUserRound, Copy, Eye, EyeOff, Gauge, Info, Lock, Minus, Share2, ShieldCheck, Sparkles, Timer, TrendingDown, TrendingUp, User, UsersRound, X, Zap } from 'lucide-react';
import { useSeenlyShare, buildWhatsAppLink } from '../hooks/useSeenlyShare';
import { createPortal } from 'react-dom';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';
import { getOwnerDashboard, subscribePlus, buyCapacityPack, updateDisplayName } from '../services/api';
import { WatercolorStain, ConnectorDots } from '../components/marks';
import { getCardRarityData } from '../utils/rarityEngine';
import { calibrateTraitScore, calculateCalibratedAlignment, calibrateAccuracyScore, normalizeRawScore } from '../utils/psychometrics';
import { CARD_IMAGES } from '../images/cardImages';
import { getAvatarSrc } from '../images/avatars';

import { SignalBadgeIcon } from '../components/SignalBadgeIcon';
import premiumBg from '../images/premium_bg.png';
import premiumBg2 from '../images/premium_bg2.png';
import anonimLogo from '../images/Icons/AnonimLOGO.png';

const SIGNATURE_IMAGES = CARD_IMAGES;
const RESPONSE_HISTORY_PAGE_SIZE = 5;

const TabInfoNotice = ({ icon: Icon = Info, children }) => (
  <div className="flex items-center justify-center w-full my-1 px-2 box-border">
    <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[rgba(253,251,244,0.92)] border border-[rgba(197,160,89,0.28)] shadow-[0_2px_10px_rgba(80,60,40,0.03)] backdrop-blur-md max-w-full text-left">
      <Icon size={14} strokeWidth={2.3} className="text-[#c5a059] shrink-0 mt-[1px] sm:mt-0" />
      <span className="font-sans text-[12px] sm:text-[12.8px] text-[#4b5563] font-medium leading-snug sm:leading-none whitespace-normal sm:whitespace-nowrap tracking-[-0.01em] text-left">
        {children}
      </span>
    </div>
  </div>
);


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

const getSignalLevelLabel = (score, lang) => {
  if (score <= 35) return lang === 'tr' ? 'Düşük' : 'Low';
  if (score <= 60) return lang === 'tr' ? 'Orta' : 'Moderate';
  if (score <= 80) return lang === 'tr' ? 'Yüksek' : 'High';
  return lang === 'tr' ? 'Çok Yüksek' : 'Very High';
};

const CharacterBalanceBanner = ({ signals, langCode }) => {
  const sortedSignals = [...signals].sort((a, b) => b.percentage - a.percentage);
  const top3Signals = sortedSignals.slice(0, 3);
  const bottom3Signals = [...sortedSignals].reverse().slice(0, 3);

  return (
    <div
      className="seenly-dashboard-premium-card w-full p-5 sm:p-6 rounded-[28px] box-border mb-1"
      style={{
        background: '#FDFBF4',
        border: '1px solid rgba(197, 160, 89, 0.22)',
        boxShadow: '0 8px 30px rgba(80, 60, 40, 0.04)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none'
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 relative">
        {/* Perfectly Centered Vertical Divider */}
        <div className="hidden md:block absolute top-2 bottom-2 left-1/2 w-[1px] bg-[#EFE8DC] -translate-x-1/2 pointer-events-none" />

        {/* Left Column: Top 3 Strengths */}
        <div className="flex flex-col w-full md:pr-4">
          {/* Header Row */}
          <div className="flex items-center justify-center text-center w-full pb-3 mb-1 border-b border-[#EFE8DC]">
            <span
              className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8C6D37]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {langCode === 'tr' ? 'En Güçlü 3 Yönünüz' : 'Top 3 Strengths'}
            </span>
          </div>

          {/* Strengths List */}
          <div className="flex flex-col w-full">
            {top3Signals.map((sig, idx) => (
              <div
                key={sig.key}
                className="w-full flex items-center justify-between py-2.5 sm:py-3 border-b border-[#F4EFE6] last:border-b-0 transition-colors duration-150"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 text-[11.5px] font-bold transition-transform"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      backgroundColor: idx === 0 ? '#C5A059' : idx === 1 ? 'rgba(197, 160, 89, 0.22)' : 'rgba(197, 160, 89, 0.12)',
                      color: idx === 0 ? '#FFFFFF' : '#8C6D37',
                      border: idx === 0 ? '1px solid #B89243' : '1px solid rgba(197, 160, 89, 0.35)',
                      boxShadow: idx === 0 ? '0 2px 8px rgba(197, 160, 89, 0.3)' : 'none'
                    }}
                  >
                    {idx + 1}
                  </div>
                  <span className="font-serif text-[15px] font-semibold text-[#1A202C] truncate">
                    {sig.label}
                  </span>
                </div>

                <span
                  className="px-3 py-0.8 rounded-full text-[12.5px] font-bold tabular-nums text-center flex-shrink-0"
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
          <div className="flex items-center justify-center text-center w-full pb-3 mb-1 border-b border-[#EFE8DC]">
            <span
              className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4A5568]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {langCode === 'tr' ? 'En Zayıf 3 Yönünüz' : 'Top 3 Weakest Traits'}
            </span>
          </div>

          {/* Weaknesses List */}
          <div className="flex flex-col w-full">
            {bottom3Signals.map((sig, idx) => (
              <div
                key={sig.key}
                className="w-full flex items-center justify-between py-2.5 sm:py-3 border-b border-[#F4EFE6] last:border-b-0 transition-colors duration-150"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 text-[11.5px] font-bold"
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
                  <span className="font-serif text-[15px] font-semibold text-[#2D3748] truncate">
                    {sig.label}
                  </span>
                </div>

                <span
                  className="px-3 py-0.8 rounded-full text-[12.5px] font-bold tabular-nums text-center flex-shrink-0"
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
    <div className="seenly-dashboard-premium-card seenly-dashboard-signal-card seenly-wide-signal-card p-5 sm:p-6 flex flex-col rounded-[32px] flex-1 box-border" style={{
      background: '#FDFBF4',
      border: '1px solid rgba(197, 160, 89, 0.28)',
      boxShadow: '0 8px 28px rgba(80, 60, 40, 0.04)'
    }}>
      {/* Header bar for 10 signals */}
      <div className="flex items-center justify-between w-full pb-3 mb-2.5 border-b border-[#EFE8DC]">
        <span
          className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#1A3E72]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {langCode === 'tr' ? '10 Sosyal Sinyal Dağılımı' : '10 Social Signal Distribution'}
        </span>
        <span
          className="text-[10.5px] font-semibold text-[#A0988A] uppercase tracking-wider"
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
            <div className="flex items-center gap-3 min-w-0">
              <SignalBadgeIcon signalKey={sig.key} size={16} boxSize={34} />
              <span
                className="font-serif text-[14px] sm:text-[14.5px] font-semibold text-[#1A202C] whitespace-nowrap"
                style={{ letterSpacing: '-0.01em' }}
              >
                {sig.label}
              </span>
            </div>

            {/* Right: Progress Bar + Score Badge */}
            <div className="flex items-center gap-2.5 flex-1 justify-end ml-3 max-w-[155px]">
              <div className="w-full h-[5px] rounded-full bg-[#ECE5D8] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min(100, Math.max(6, sig.percentage))}%`,
                    backgroundColor: sig.color || '#1A3E72'
                  }}
                />
              </div>
              <span
                className="px-2 py-0.5 rounded-md text-[11.5px] font-bold text-[#1A3E72] bg-[rgba(26,62,114,0.08)] tabular-nums min-w-[30px] text-center flex-shrink-0"
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
  const [qrModalOpen, setQrModalOpen] = useState(false);

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
        if (data?.avatar) {
          localStorage.setItem('seenly_avatar', data.avatar);
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

  useEffect(() => {
    if (qrModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [qrModalOpen]);

  const handleCopyLink = () => {
    if (!snapshot || !snapshot.publicSlug) return;
    const inviteUrl = `${window.location.origin}/#/friend/${snapshot.publicSlug}`;
    navigator.clipboard.writeText(inviteUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => { });
  };

  const handleShareInvite = () => {
    if (!snapshot || !snapshot.publicSlug) return;
    const inviteUrl = `${window.location.origin}/#/friend/${snapshot.publicSlug}`;
    if (navigator.share) {
      navigator.share({
        title: 'Seenly - Algı Boşluğu ve Karakter Analizi',
        text: langCode === 'tr'
          ? 'Benim hakkımdaki dış algını öğrenmek istiyorum. 2 dakikada beni değerlendir:'
          : 'I would like to see how you perceive me. Evaluate me in 2 minutes:',
        url: inviteUrl
      }).catch(() => {
        handleCopyLink();
      });
    } else {
      handleCopyLink();
    }
  };

  const getConfidenceLevel = (count, lang) => {
    if (count <= 2) {
      return {
        stageIndex: 0,
        stageNumber: 1,
        label: lang === 'tr' ? 'Şekilleniyor' : 'Forming',
        badgeBg: 'rgba(197, 160, 89, 0.12)',
        badgeColor: '#8C6D37',
        badgeBorder: 'rgba(197, 160, 89, 0.30)',
        reliabilityScore: '%65',
        desc: lang === 'tr'
          ? `Profiliniz henüz ilk aşamada (${count} anket yanıtı). Karakter yansımalarınızın tam olarak oturması ve sosyal maskelerin filtrelenmesi için linkinizi arkadaşlarınızla paylaşmaya devam edin.`
          : `Your profile is in the initial stage (${count} response(s)). Keep sharing your link to filter social masks and solidify your reflection.`,
        variant: 'forming'
      };
    }
    if (count <= 5) {
      return {
        stageIndex: 1,
        stageNumber: 2,
        label: lang === 'tr' ? 'Netleşiyor' : 'Clarifying',
        badgeBg: 'rgba(59, 130, 246, 0.12)',
        badgeColor: '#2563EB',
        badgeBorder: 'rgba(59, 130, 246, 0.28)',
        reliabilityScore: '%82',
        desc: lang === 'tr'
          ? `Profil yansımanız netleşiyor. ${count} katılımcının ortak değerlendirmesiyle sosyal sinyalleriniz belirgin ve dengeli bir kalıba oturmaya başladı.`
          : `Your profile reflection is clarifying. Social signals are shaping up into a strong pattern with ${count} survey responses.`,
        variant: 'clarifying'
      };
    }
    if (count <= 10) {
      return {
        stageIndex: 2,
        stageNumber: 3,
        label: lang === 'tr' ? 'Kararlı & Güçlü' : 'Stable & Robust',
        badgeBg: 'rgba(16, 185, 129, 0.12)',
        badgeColor: '#059669',
        badgeBorder: 'rgba(16, 185, 129, 0.28)',
        reliabilityScore: '%94',
        desc: lang === 'tr'
          ? `Profil kararlılığı yüksek düzeyde. ${count} yanıt ile karakter yansımalarınız ve algı boşluklarınız istatistiksel olarak son derece güvenilir bir temele sahip.`
          : `Profile stability is high. With ${count} responses, your personality reflections and gaps rest on statistically robust ground.`,
        variant: 'clear'
      };
    }
    return {
      stageIndex: 3,
      stageNumber: 4,
      label: lang === 'tr' ? 'Kristalize' : 'Crystallized',
      badgeBg: 'rgba(124, 58, 237, 0.12)',
      badgeColor: '#7C3AED',
      badgeBorder: 'rgba(124, 58, 237, 0.28)',
      reliabilityScore: '%99',
      desc: lang === 'tr'
        ? `Profiliniz kristalize oldu. ${count} katılımcıdan gelen zengin sosyal sinyaller sayesinde en üst düzeyde analitik kesinlik ve doğruluk oranına sahipsiniz.`
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

    // Compute true outside averages dynamically from responseSessions or snapshot.friendAverages
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
      { key: 'guvenilirlik', label: lang === 'tr' ? 'Güvenilirlik' : 'Trustworthiness', color: '#7BCCAA' },
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

      // Default fallback if no data yet
      if (val === undefined || val === null) {
        val = 3.0;
      }

      // Psychometric calibrated percentage (organic scores like 94, 91, 89, 78, 76, 52, 34, 18)
      const visualPercentage = calibrateTraitScore(d.key, val);

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

    // 1. Find deepAlignment (closest match)
    const sortedByAlignment = [...rows].sort((a, b) => {
      if (a.gap !== b.gap) return a.gap - b.gap;
      return a.label.localeCompare(b.label);
    });
    const deepAlignment = sortedByAlignment[0];

    // 2. Find blindSpot (friends > self, maximize lift)
    const blindSpotCandidates = rows.filter(r => r.key !== deepAlignment.key);
    const sortedByLift = [...(blindSpotCandidates.length ? blindSpotCandidates : rows)].sort((a, b) => {
      const liftA = a.friendCalibrated - a.selfCalibrated;
      const liftB = b.friendCalibrated - b.selfCalibrated;
      if (liftA !== liftB) return liftB - liftA; // Descending
      return a.label.localeCompare(b.label);
    });
    const blindSpot = sortedByLift[0];

    // 3. Find illusionOfSelf (self > friends, maximize drop)
    const illusionCandidates = rows.filter(r => r.key !== deepAlignment.key && r.key !== blindSpot.key);
    const sortedByDrop = [...(illusionCandidates.length ? illusionCandidates : rows.filter(r => r.key !== deepAlignment.key))].sort((a, b) => {
      const dropA = a.selfCalibrated - a.friendCalibrated;
      const dropB = b.selfCalibrated - b.friendCalibrated;
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
  const avatarSrc = getAvatarSrc(snapshot?.avatar || localStorage.getItem('seenly_avatar'));
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

  // Dynamic Rarity calculations (Yaygın, Seçkin, Nadir, Eşsiz)
  const selfRarity = getCardRarityData(activeSelfSignatureId, snapshot?.selfRarity, langCode);
  const outsideRarity = getCardRarityData(activeOutsideSignatureId, snapshot?.outsideRarity, langCode);

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
  const getSessionCalibratedAccuracy = (session) => {
    if (!session) return 75;
    return calibrateAccuracyScore(session.accuracy);
  };
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
      ? 'Profil linkiniz henüz ziyaret almadı. Linkinizi paylaştığınızda ziyaretçi sayısı ve katılım oranı burada analiz edilecektir.'
      : 'Your profile link has not received visits yet. Once shared, your visitor count and response rate will appear here.')
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

          {/* Dashboard Header: Seamless Profile Hero (Vertical Centered Option 1) */}
          <header className="seenly-dashboard-header w-full flex justify-center items-center py-6 px-4 bg-transparent border-b-0">
            <div className="flex flex-col items-center justify-center gap-3.5 w-full max-w-[480px] mx-auto text-center">
              {/* Centered Large Avatar with Gold Bezel */}
              <div className="relative mx-auto">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={displayName}
                    className="rounded-full object-cover shadow-md"
                    style={{
                      width: 'clamp(94px, 15vw, 112px)',
                      height: 'clamp(94px, 15vw, 112px)',
                      border: '3.5px solid #C5A059',
                      boxShadow: '0 8px 24px rgba(197, 160, 89, 0.28)'
                    }}
                  />
                ) : (
                  <div
                    className="rounded-full flex items-center justify-center font-serif text-3xl sm:text-4xl font-black text-white shadow-md mx-auto"
                    style={{
                      width: 'clamp(94px, 15vw, 112px)',
                      height: 'clamp(94px, 15vw, 112px)',
                      backgroundColor: '#1A3E72',
                      border: '3.5px solid #C5A059',
                      boxShadow: '0 8px 24px rgba(197, 160, 89, 0.28)'
                    }}
                  >
                    {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>

              {/* Centered Name & Response Badge Block */}
              <div className="flex flex-col items-center text-center w-full px-2">
                <h2
                  className="font-serif text-[1.85rem] sm:text-[2.25rem] font-bold text-[#1A202C] tracking-tight leading-tight m-0 break-words max-w-full"
                  title={displayName}
                >
                  {displayName}
                </h2>

                {/* Meta Row: Count Capsule Badge */}
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] sm:text-[12.5px] font-semibold bg-[rgba(26,62,114,0.06)] text-[#1A3E72] border border-[rgba(26,62,114,0.14)] shadow-xs">
                    <UsersRound size={13} strokeWidth={2.4} />
                    <span>
                      {responseCount} {langCode === 'tr' ? 'Yanıt' : (responseCount === 1 ? 'Response' : 'Responses')}
                    </span>
                  </span>
                </div>
              </div>

              {/* Minimalist Dual Action Share Bar (Deep Ink Dark Theme, Non-pill, Copy Icon) */}
              <div className="flex flex-col items-center gap-2 mt-1">
                <div
                  className="inline-flex items-center rounded-2xl bg-[#0B1B2C] border border-[#1E334A] p-1 shadow-md transition-all hover:border-[rgba(197,160,89,0.45)]"
                  style={{ boxShadow: '0 4px 16px rgba(11, 27, 44, 0.18)' }}
                >
                  {/* Copy Link Button */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-[#FDFDF8] text-[13px] font-semibold tracking-wide transition-all cursor-pointer"
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

                  <div className="w-[1px] h-5 bg-white/15 mx-1" />

                  {/* QR Button */}
                  <button
                    type="button"
                    onClick={() => setQrModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[#FDFDF8]/90 hover:text-white hover:bg-white/10 active:scale-[0.98] text-[13px] font-semibold transition-all cursor-pointer"
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

                <p className="text-[11.5px] text-[#718096] text-center m-0 font-sans">
                  {langCode === 'tr' ? 'Arkadaşlarının seni okuması için bu linki paylaş' : 'Share this link for friends to read your signals'}
                </p>
              </div>
            </div>
          </header>


          {/* Tab Navigation - Independent Luxury Pills */}
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

            {activeTab === 0 && (
              <div className="seenly-dashboard-tab-content full-width-layout scrollable-gap-content seenly-gap-editorial-content" style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
                <div className="flex flex-col gap-5 w-full box-border">
                  {/* Horizontal General Statistics Banner (Above both Personality Card & 10 Signals) */}
                  <CharacterBalanceBanner
                    signals={get10Signals(langCode, false)}
                    langCode={langCode}
                  />

                  {/* Main Flow: Left Archetype Card + Right 10 Social Signals */}
                  <div className="seenly-signal-flow flex flex-col md:flex-row items-stretch justify-center w-full gap-5">
                    {/* Left Column: Glass Card (New Seamless Organic Layout) */}
                    <div className="seenly-signal-summary-wrap flex flex-col items-center z-10 w-full md:w-[350px] flex-shrink-0">
                      <div className="seenly-dashboard-premium-card seenly-signal-summary-card p-5 sm:p-6 flex flex-col items-center justify-between text-center relative rounded-[32px] w-full h-full box-border" style={{
                        background: '#FDFBF4',
                        backgroundColor: '#FDFBF4',
                        border: '1px solid rgba(197, 160, 89, 0.25)',
                        boxShadow: '0 8px 30px rgba(80, 60, 40, 0.04)',
                        backdropFilter: 'none',
                        WebkitBackdropFilter: 'none',
                        opacity: 1
                      }}>
                        {/* Top Section: Title (Left) + Rarity Pill Badge (Right) + Description */}
                        <div className="flex flex-col items-start text-left w-full px-1 mb-2">
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
                              {selfSignatureName}
                            </h3>

                            {/* Rarity Pill Badge */}
                            <div
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap transition-all duration-200"
                              style={{
                                backgroundColor: selfRarity.badgeBg,
                                color: selfRarity.badgeText,
                                border: `1px solid ${selfRarity.badgeBorder}`,
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '11.5px',
                                fontWeight: 600,
                                letterSpacing: '0.01em'
                              }}
                            >
                              <span>{selfRarity.badgeLabel}</span>
                            </div>
                          </div>

                          {selfSignatureCardLine && (
                            <p
                              className="m-0 max-w-[295px] mt-1"
                              style={{
                                fontFamily: "'Newsreader', Georgia, serif",
                                fontSize: '14.5px',
                                lineHeight: '1.55',
                                color: '#4B5568',
                                fontWeight: 400,
                                letterSpacing: '0.01em'
                              }}
                            >
                              {selfSignatureCardLine}
                            </p>
                          )}
                        </div>

                        {/* Middle Artwork - Seamless Organic Watercolor Vignette (Multiply & Soft Feather) */}
                        <div
                          className="relative w-full max-w-[315px] flex items-center justify-center my-1"
                          style={{
                            WebkitMaskImage: 'radial-gradient(circle at center, black 48%, rgba(0, 0, 0, 0.8) 66%, transparent 90%)',
                            maskImage: 'radial-gradient(circle at center, black 48%, rgba(0, 0, 0, 0.8) 66%, transparent 90%)',
                          }}
                        >
                          <img
                            src={SIGNATURE_IMAGES[activeSelfSignatureId]}
                            alt={selfSignatureName}
                            className="w-full h-auto object-contain pointer-events-none select-none scale-[1.04]"
                            style={{
                              mixBlendMode: 'multiply',
                              WebkitMaskImage: 'radial-gradient(circle at center, black 48%, rgba(0, 0, 0, 0.8) 66%, transparent 90%)',
                              maskImage: 'radial-gradient(circle at center, black 48%, rgba(0, 0, 0, 0.8) 66%, transparent 90%)',
                            }}
                          />
                        </div>

                        {/* Bottom Action Bar: Harmonized Navy & Porcelain Action Bar */}
                        <div className="flex items-center justify-between gap-2.5 w-full mt-auto pt-2 box-border">
                          <button
                            type="button"
                            onClick={() => {
                              localStorage.setItem('seenly_selected_identity', activeSelfSignatureId);
                              window.location.hash = '#/identities';
                            }}
                            className="flex-1 h-[46px] px-4 rounded-full text-white flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                            style={{
                              background: '#1A3E72',
                              boxShadow: '0 4px 14px rgba(26, 62, 114, 0.22)',
                              fontFamily: "'Inter', sans-serif",
                              fontSize: '12.5px',
                              fontWeight: 500,
                              letterSpacing: '0.02em'
                            }}
                          >
                            <span>{langCode === 'tr' ? 'Detaylı Analizi Gör' : 'View Detailed Analysis'}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="ml-1.5 flex-shrink-0 opacity-95">
                              <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          </button>

                          {/* Share Button */}
                          <a
                            href={getDashboardWhatsAppLink(selfSignatureName)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-[46px] h-[46px] rounded-[16px] flex items-center justify-center text-[#1A3E72] transition-all duration-200 flex-shrink-0 hover:bg-[#F4F7FC] hover:border-[rgba(26,62,114,0.35)] hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid rgba(26, 62, 114, 0.16)',
                              boxShadow: '0 4px 14px rgba(26, 62, 114, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)'
                            }}
                            title={langCode === 'tr' ? "Paylaş" : "Share"}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
                              <polyline points="16 6 12 2 8 6" />
                              <line x1="12" y1="2" x2="12" y2="15" />
                            </svg>
                          </a>

                          {/* Bookmark / Save Button */}
                          <button
                            type="button"
                            onClick={() => handleDashboardInstagramStory(selfSignatureName, SIGNATURE_IMAGES[activeSelfSignatureId])}
                            disabled={isGenerating}
                            className="w-[46px] h-[46px] rounded-[16px] flex items-center justify-center text-[#1A3E72] transition-all duration-200 flex-shrink-0 hover:bg-[#F4F7FC] hover:border-[rgba(26,62,114,0.35)] hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
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
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: 10 Social Signals in Grid */}
                    <SocialSignalsPanel
                      signals={get10Signals(langCode, false)}
                      archetypeName={selfSignatureName}
                      langCode={langCode}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className={`seenly-dashboard-tab-content ${responseCount < 1 ? 'full-width-layout' : 'seenly-gap-editorial-content'}`} style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
                {responseCount >= 1 ? (
                  <div className="flex flex-col gap-5 w-full box-border">
                    {/* Horizontal General Statistics Banner (Above both Personality Card & 10 Signals) */}
                    <CharacterBalanceBanner
                      signals={get10Signals(langCode, true)}
                      langCode={langCode}
                    />

                    {/* Main Flow: Left Archetype Card + Right 10 Social Signals */}
                    <div className="seenly-outside-flow flex flex-col md:flex-row items-stretch justify-center w-full gap-5">
                      {/* Left Column: Glass Card (New Aesthetic Layout) */}
                      <div className="seenly-outside-summary-wrap flex flex-col items-center z-10 w-full md:w-[350px] flex-shrink-0">
                        <div className="seenly-dashboard-premium-card seenly-outside-summary-card p-5 sm:p-6 flex flex-col items-center justify-between text-center relative rounded-[32px] w-full h-full box-border" style={{
                          background: '#FDFBF4',
                          backgroundColor: '#FDFBF4',
                          border: '1px solid rgba(197, 160, 89, 0.25)',
                          boxShadow: '0 8px 30px rgba(80, 60, 40, 0.04)',
                          backdropFilter: 'none',
                          WebkitBackdropFilter: 'none',
                          opacity: 1
                        }}>
                          {/* Top Section: Title (Left) + Rarity Pill Badge (Right) + Description */}
                          <div className="flex flex-col items-start text-left w-full px-1 mb-2">
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
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap transition-all duration-200"
                                style={{
                                  backgroundColor: outsideRarity.badgeBg,
                                  color: outsideRarity.badgeText,
                                  border: `1px solid ${outsideRarity.badgeBorder}`,
                                  fontFamily: "'Inter', sans-serif",
                                  fontSize: '11.5px',
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
                                  fontSize: '14.5px',
                                  lineHeight: '1.55',
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
                            className="relative w-full max-w-[315px] flex items-center justify-center my-1"
                            style={{
                              WebkitMaskImage: 'radial-gradient(circle at center, black 48%, rgba(0, 0, 0, 0.8) 66%, transparent 90%)',
                              maskImage: 'radial-gradient(circle at center, black 48%, rgba(0, 0, 0, 0.8) 66%, transparent 90%)',
                            }}
                          >
                            <img
                              src={SIGNATURE_IMAGES[activeOutsideSignatureId]}
                              alt={outsideSignatureName}
                              className="w-full h-auto object-contain pointer-events-none select-none scale-[1.04]"
                              style={{
                                mixBlendMode: 'multiply',
                                WebkitMaskImage: 'radial-gradient(circle at center, black 48%, rgba(0, 0, 0, 0.8) 66%, transparent 90%)',
                                maskImage: 'radial-gradient(circle at center, black 48%, rgba(0, 0, 0, 0.8) 66%, transparent 90%)',
                              }}
                            />
                          </div>

                          {/* Bottom Action Bar: Harmonized Navy & Porcelain Action Bar */}
                          <div className="flex items-center justify-between gap-2.5 w-full mt-auto pt-2 box-border">
                            <button
                              type="button"
                              onClick={() => {
                                localStorage.setItem('seenly_selected_identity', activeOutsideSignatureId);
                                window.location.hash = '#/identities';
                              }}
                              className="flex-1 h-[46px] px-4 rounded-full text-white flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                              style={{
                                background: '#1A3E72',
                                boxShadow: '0 4px 14px rgba(26, 62, 114, 0.22)',
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '12.5px',
                                fontWeight: 500,
                                letterSpacing: '0.02em'
                              }}
                            >
                              <span>{langCode === 'tr' ? 'Detaylı Analizi Gör' : 'View Detailed Analysis'}</span>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="ml-1.5 flex-shrink-0 opacity-95">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                              </svg>
                            </button>

                            {/* Share Button */}
                            <a
                              href={getDashboardWhatsAppLink(outsideSignatureName)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-[46px] h-[46px] rounded-[16px] flex items-center justify-center text-[#1A3E72] transition-all duration-200 flex-shrink-0 hover:bg-[#F4F7FC] hover:border-[rgba(26,62,114,0.35)] hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid rgba(26, 62, 114, 0.16)',
                                boxShadow: '0 4px 14px rgba(26, 62, 114, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)'
                              }}
                              title={langCode === 'tr' ? "Paylaş" : "Share"}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
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
                              className="w-[46px] h-[46px] rounded-[16px] flex items-center justify-center text-[#1A3E72] transition-all duration-200 flex-shrink-0 hover:bg-[#F4F7FC] hover:border-[rgba(26,62,114,0.35)] hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
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
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: 10 Social Signals in Grid */}
                      <SocialSignalsPanel
                        signals={get10Signals(langCode, true)}
                        archetypeName={outsideSignatureName}
                        langCode={langCode}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="seenly-dashboard-locked-state" style={{ width: '100%' }}>
                    <LockedMask
                      title={t('ui', 'locked_section_title')}
                      description={t('ui', 'locked_section_outside_desc')}
                      responseCount={responseCount}
                      targetCount={1}
                      langCode={langCode}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 2 && (
              <div className="seenly-dashboard-tab-content full-width-layout scrollable-gap-content seenly-gap-editorial-content" style={{ maxWidth: '880px', width: '100%' }}>
                {responseCount >= 1 ? (
                  <div className="flex flex-col gap-5 w-full">
                    {/* 1. Seamless Embedded Overview Banner */}
                    <div
                      className="seenly-dashboard-premium-card p-5 sm:p-6 sm:px-8 rounded-[28px] w-full flex flex-col md:flex-row items-start md:items-center gap-6 box-border"
                      style={{
                        background: '#FDFBF4',
                        border: '1px solid rgba(197, 160, 89, 0.25)',
                        boxShadow: '0 6px 24px rgba(80, 60, 40, 0.03)'
                      }}
                    >
                      {/* Left: Title & Subtitle */}
                      <div className="text-left md:max-w-[530px] shrink-0">
                        <h3 className="font-serif text-[1.35rem] sm:text-[1.5rem] font-bold text-[#1A3E72] m-0 tracking-tight leading-tight">
                          {langCode === 'tr' ? 'Algı Boşluğu ve Paralellik' : 'Perception Gap & Alignment'}
                        </h3>
                        <p className="font-sans text-[0.88rem] sm:text-[0.92rem] text-[#4A5568] mt-1.5 leading-[1.55] m-0">
                          {langCode === 'tr'
                            ? 'Kendi algınız ile arkadaşlarınızın sizde gözlemlediği sosyal sinyaller arasındaki mesafe ve uyumu analiz eder.'
                            : 'Analyzes the distance and alignment between your self-perception and the social signals observed by friends.'
                          }
                        </p>
                      </div>

                      {/* Right: Circular Gauge Metric centered perfectly between text end and right border */}
                      <div className="flex-1 flex items-center justify-center w-full md:w-auto self-center">
                        <div className="relative w-[64px] h-[64px] sm:w-[72px] sm:h-[72px] flex items-center justify-center flex-shrink-0">
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
                          <span className="absolute font-serif text-[17px] sm:text-[19px] font-bold text-[#1A3E72] tracking-tight">
                            {gapEditorial.alignmentRatio}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Sinyal Boyut Karşılaştırması */}
                    <div className="seenly-dashboard-premium-card p-6 sm:p-7 rounded-[32px] w-full flex flex-col box-border" style={{
                      background: '#FDFBF4',
                      border: '1px solid rgba(197, 160, 89, 0.28)',
                      boxShadow: '0 8px 28px rgba(80, 60, 40, 0.04)'
                    }}>
                      {/* Header & Legend */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-3 border-b border-[#EFE8DC]">
                        <span
                          className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#1A3E72]"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          {langCode === 'tr' ? '10 Sinyal Boyut Karşılaştırması' : '10 Signal Dimension Comparison'}
                        </span>

                        {/* Elegant Legend */}
                        <div className="flex items-center gap-4 text-[12px] font-semibold text-[#4A5568]">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059] shadow-sm" />
                            <span>{langCode === 'tr' ? 'Kendi Algın' : 'Self Perception'}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#1A3E72] shadow-sm" />
                            <span>{langCode === 'tr' ? 'Dış Algı' : 'Outside Perception'}</span>
                          </span>
                        </div>
                      </div>

                      {/* 10 Clean Comparison Rows */}
                      <div className="flex flex-col gap-1 w-full">
                        {gapEditorial.rows.map((row) => {
                          const gapDiff = row.friendPosition - row.selfPosition;
                          const absGap = Math.abs(gapDiff);
                          const isExactMatch = absGap <= 1;
                          const isBalanced = absGap <= 2;
                          return (
                            <div
                              key={row.key}
                              className="w-full flex items-center justify-between py-2 sm:py-2.5 border-b border-[#F4EFE6] last:border-b-0 transition-colors"
                            >
                              {/* Left: Icon + Label */}
                              <div className="flex items-center gap-2.5 min-w-[130px] sm:min-w-[160px]">
                                <SignalBadgeIcon signalKey={row.key} size={14} boxSize={28} />
                                <span className="font-serif text-[14.5px] font-semibold text-[#1A202C]">
                                  {row.label}
                                </span>
                              </div>

                              {/* Center: Dual-pin Range Track */}
                              <div className="relative flex-1 mx-3 sm:mx-6 h-6 flex items-center">
                                {/* Base track */}
                                <div className="absolute left-0 right-0 h-[5px] rounded-full bg-[#ECE5D8]" />

                                {isExactMatch ? (
                                  /* Only for exact collision: Single delicate merged pin */
                                  <div
                                    className="absolute -translate-x-1/2 flex items-center justify-center w-3.5 h-3.5 rounded-full border-2 border-white shadow-md z-10 transition-transform hover:scale-125 cursor-help"
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
                                      className="absolute h-[5px] rounded-full opacity-70"
                                      style={{
                                        left: `${Math.min(row.selfPosition, row.friendPosition)}%`,
                                        width: `${absGap}%`,
                                        background: 'linear-gradient(90deg, #C5A059 0%, #1A3E72 100%)'
                                      }}
                                    />

                                    {/* Self Dot (Gold) */}
                                    <div
                                      className="absolute -translate-x-1/2 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#C5A059] border-2 border-white shadow-md z-10 transition-transform hover:scale-125 cursor-help"
                                      style={{ left: `${row.selfPosition}%` }}
                                      title={`${langCode === 'tr' ? 'Kendi Algın' : 'Self'}: %${row.selfPosition}`}
                                    />

                                    {/* Outside Dot (Navy) */}
                                    <div
                                      className="absolute -translate-x-1/2 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#1A3E72] border-2 border-white shadow-md z-10 transition-transform hover:scale-125 cursor-help"
                                      style={{ left: `${row.friendPosition}%` }}
                                      title={`${langCode === 'tr' ? 'Dış Algı' : 'Outside'}: %${row.friendPosition}`}
                                    />
                                  </>
                                )}
                              </div>

                              {/* Right: Modern Dynamic Perspective Capsule */}
                              <div className="min-w-[46px] text-right flex-shrink-0 flex items-center justify-end">
                                <span
                                  className="h-6 px-2.5 rounded-full flex items-center justify-center gap-1 inline-flex transition-transform hover:scale-105 cursor-help"
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
                                    <Minus size={13} strokeWidth={2.8} />
                                  ) : gapDiff > 0 ? (
                                    <TrendingUp size={13} strokeWidth={2.4} />
                                  ) : (
                                    <TrendingDown size={13} strokeWidth={2.4} />
                                  )}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Editorial Analysis 3 Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                      {/* 1. Kör Nokta */}
                      <div className="seenly-dashboard-premium-card p-5 sm:p-6 rounded-[26px] text-left flex flex-col justify-between box-border transition-all duration-200 hover:-translate-y-0.5" style={{
                        background: '#FDFBF4',
                        border: '1px solid rgba(197, 160, 89, 0.35)',
                        boxShadow: '0 4px 18px rgba(80, 60, 40, 0.04)'
                      }}>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-[rgba(197,160,89,0.15)] text-[#8C6D37] border border-[rgba(197,160,89,0.3)]">
                              {langCode === 'tr' ? 'KÖR NOKTA' : 'BLIND SPOT'}
                            </span>
                            {gapEditorial.blindSpot?.key && (
                              <SignalBadgeIcon signalKey={gapEditorial.blindSpot.key} size={15} boxSize={28} />
                            )}
                          </div>

                          <h4 className="font-serif text-[1.3rem] font-bold text-[#1A3E72] tracking-tight mb-2 m-0">
                            {gapEditorial.blindSpot?.label}
                          </h4>

                          <p className="font-sans text-[0.85rem] text-[#4A5568] leading-relaxed m-0">
                            {gapBlindSpotDesc}
                          </p>
                        </div>
                      </div>

                      {/* 2. Sosyal Maske */}
                      <div className="seenly-dashboard-premium-card p-5 sm:p-6 rounded-[26px] text-left flex flex-col justify-between box-border transition-all duration-200 hover:-translate-y-0.5" style={{
                        background: '#FDFBF4',
                        border: '1px solid rgba(224, 101, 83, 0.3)',
                        boxShadow: '0 4px 18px rgba(80, 60, 40, 0.04)'
                      }}>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-[rgba(224,101,83,0.12)] text-[#D96552] border border-[rgba(224,101,83,0.25)]">
                              {langCode === 'tr' ? 'SOSYAL MASKE' : 'SOCIAL MASK'}
                            </span>
                            {gapEditorial.illusionOfSelf?.key && (
                              <SignalBadgeIcon signalKey={gapEditorial.illusionOfSelf.key} size={15} boxSize={28} />
                            )}
                          </div>

                          <h4 className="font-serif text-[1.3rem] font-bold text-[#1A3E72] tracking-tight mb-2 m-0">
                            {gapEditorial.illusionOfSelf?.label}
                          </h4>

                          <p className="font-sans text-[0.85rem] text-[#4A5568] leading-relaxed m-0">
                            {gapIllusionDesc}
                          </p>
                        </div>
                      </div>

                      {/* 3. Senkronizasyon */}
                      <div className="seenly-dashboard-premium-card p-5 sm:p-6 rounded-[26px] text-left flex flex-col justify-between box-border transition-all duration-200 hover:-translate-y-0.5" style={{
                        background: '#FDFBF4',
                        border: '1px solid rgba(26, 62, 114, 0.25)',
                        boxShadow: '0 4px 18px rgba(80, 60, 40, 0.04)'
                      }}>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-[rgba(26,62,114,0.08)] text-[#1A3E72] border border-[rgba(26,62,114,0.2)]">
                              {langCode === 'tr' ? 'TAM UYUM' : 'DEEP SYNC'}
                            </span>
                            {gapEditorial.deepAlignment?.key && (
                              <SignalBadgeIcon signalKey={gapEditorial.deepAlignment.key} size={15} boxSize={28} />
                            )}
                          </div>

                          <h4 className="font-serif text-[1.3rem] font-bold text-[#1A3E72] tracking-tight mb-2 m-0">
                            {gapEditorial.deepAlignment?.label}
                          </h4>

                          <p className="font-sans text-[0.85rem] text-[#4A5568] leading-relaxed m-0">
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
                      targetCount={1}
                      langCode={langCode}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 3 && (
              <div className="seenly-dashboard-tab-content full-width-layout scrollable-gap-content seenly-gap-editorial-content" style={{ maxWidth: '860px', width: '100%', margin: '0 auto' }}>
                {responseCount < 1 ? (
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
                ) : !isPremium ? (
                  /* ========================================================= */
                  /* NON-PLUS USER: COMPACT, BALANCED EDITORIAL PREVIEW        */
                  /* ========================================================= */
                  <div className="flex flex-col gap-4 w-full box-border">
                    {/* Hero Intelligence Overview: Luxury premium_bg.png Card */}
                    <div
                      className="p-6 sm:p-7 rounded-[26px] w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-5 box-border text-left relative overflow-hidden"
                      style={{
                        border: '1.5px solid rgba(26, 62, 114, 0.45)',
                        boxShadow: '0 16px 36px rgba(11, 27, 44, 0.16)'
                      }}
                    >
                      {/* Subtle Blurred Background Image Layer */}
                      <div
                        className="absolute inset-0 pointer-events-none transform scale-105"
                        style={{
                          backgroundImage: `url(${premiumBg})`,
                          backgroundPosition: 'center',
                          backgroundSize: 'cover',
                          backgroundRepeat: 'no-repeat',
                          filter: 'blur(0.2px)'
                        }}
                      />

                      <div className="flex-1 max-w-xl relative z-10">
                        <h3 className="font-serif text-[1.35rem] sm:text-[1.5rem] font-bold text-white tracking-tight leading-snug m-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                          {langCode === 'tr'
                            ? 'Düşünce Süreleri'
                            : 'Decision Times'}
                        </h3>

                        <p className="font-sans text-[0.84rem] sm:text-[0.85rem] text-[#F8FAFC] font-medium leading-relaxed max-w-lg m-0 mt-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] opacity-95">
                          {langCode === 'tr'
                            ? 'Arkadaşlarınızın karar sürelerini, en çok duraksadıkları soruları ve sessiz ziyaretçileri keşfedin.'
                            : 'Discover decision times, hesitation points, and silent profile visits.'}
                        </p>
                      </div>

                      <div className="shrink-0 w-full md:w-auto relative z-10 flex flex-col items-center md:items-end">
                        <div className="relative inline-block w-full md:w-auto">
                          {/* Floating Micro Seal: Tek Seferlik */}
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#DFBF6A] via-[#FFF8E7] to-[#DFBF6A] text-[#0B1B2C] text-[8px] font-black uppercase tracking-[0.14em] shadow-[0_2px_8px_rgba(0,0,0,0.35)] z-20 border border-white/75 pointer-events-none whitespace-nowrap">
                            {langCode === 'tr' ? 'TEK SEFERLİK' : 'ONE-TIME'}
                          </span>

                          <button
                            type="button"
                            onClick={handleUpgradeToPlus}
                            className="group w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B1B2C]/80 hover:bg-[#0B1B2C] text-[#F3DE9A] hover:text-white font-sans font-semibold text-[12px] tracking-wider uppercase backdrop-blur-md border border-[#F3DE9A]/35 hover:border-[#F3DE9A]/70 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                          >
                            <span>{langCode === 'tr' ? 'Plus ile Kilidi Aç' : 'Unlock with Plus'}</span>
                            <ArrowRight size={13} strokeWidth={2.2} className="text-[#F3DE9A] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 3 Preview Cards: Top Horizontal + 2 Bottom Side-by-Side */}
                    <div className="flex flex-col gap-3.5 w-full box-border">
                      {/* Top Horizontal: Social Conversion */}
                      <div
                        className="p-4 sm:p-6 rounded-[20px] sm:rounded-[22px] text-left flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-5 box-border relative"
                        style={{
                          background: '#FDFBF4',
                          border: '1px solid rgba(197, 160, 89, 0.22)',
                          boxShadow: '0 4px 14px rgba(80, 60, 40, 0.03)'
                        }}
                      >
                        {/* Lock Icon in Top-Right Corner */}
                        <div className="absolute top-4 right-4 sm:top-5 sm:right-5 text-[#8C6D37]">
                          <Lock size={13} strokeWidth={2.2} />
                        </div>

                        <div className="flex-1 max-w-lg pr-6 sm:pr-0">
                          <h4 className="font-serif text-[1.2rem] sm:text-[1.35rem] font-bold text-[#1A3E72] m-0 mb-1">
                            {langCode === 'tr' ? 'Gizli İncelemeler & Ziyaretçi Dağılımı' : 'Profile Visits & Silent Viewers'}
                          </h4>

                          <p className="font-sans text-[0.82rem] sm:text-[0.84rem] text-[#64748B] leading-relaxed m-0">
                            {langCode === 'tr'
                              ? 'Profilinizi kaç kişinin açıp incelediğini, kaçının sadece bakıp geçtiğini ve kaçının testi tamamladığını öğrenin.'
                              : 'Discover how many people opened and viewed your profile, who silently browsed, and how many completed the quiz.'}
                          </p>
                        </div>

                        <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center shrink-0 min-w-[170px] pt-3 sm:pt-0 sm:border-l sm:border-[#EFE8DC] border-t sm:border-t-0 border-[#EFE8DC] sm:px-6 sm:py-2">
                          <div className="flex items-baseline justify-center gap-1.5">
                            <span className="font-serif text-2xl sm:text-4xl font-black text-[#1A3E72] leading-none opacity-40">
                              --
                            </span>
                            <span className="font-sans text-[11px] sm:text-[12px] font-bold text-[#1A3E72]">
                              {langCode === 'tr' ? 'Ziyaret' : 'Visits'}
                            </span>
                          </div>
                          <span className="font-sans text-[11px] text-[#64748B] sm:mt-1 text-center">
                            %-- {langCode === 'tr' ? 'Tamamlama Oranı' : 'Conversion'}
                          </span>
                        </div>
                      </div>

                      {/* Bottom 2 Columns: Hesitation & Reflex */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full box-border">
                        {/* Card 1: Hesitation */}
                        <div
                          className="p-4 sm:p-5 rounded-[20px] sm:rounded-[22px] text-left flex flex-col justify-between box-border"
                          style={{
                            background: '#FDFBF4',
                            border: '1px solid rgba(197, 160, 89, 0.22)',
                            boxShadow: '0 4px 14px rgba(80, 60, 40, 0.03)'
                          }}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[10px] uppercase font-bold tracking-[0.08em] text-[#8C6D37]">
                                {langCode === 'tr' ? 'BİLİŞSEL DURAKSAMA' : 'LONGEST HESITATION'}
                              </span>
                              <Lock size={12} strokeWidth={2.2} className="text-[#8C6D37]" />
                            </div>

                            <h4 className="font-serif text-[1.2rem] sm:text-[1.25rem] font-bold text-[#1A3E72] m-0 mb-1">
                              {langCode === 'tr' ? 'Kilitli Sinyal' : 'Locked Signal'}
                            </h4>

                            <div className="flex items-baseline gap-1.5 my-1.5">
                              <span className="font-serif text-2xl font-black text-[#1A3E72] leading-none opacity-40">
                                --.-s
                              </span>
                              <span className="font-sans text-[11px] text-[#64748B]">
                                {langCode === 'tr' ? 'ortalama düşünme süresi' : 'average pause'}
                              </span>
                            </div>
                          </div>

                          <p className="font-sans text-[0.8rem] text-[#64748B] leading-relaxed m-0 mt-3 pt-2.5 border-t border-[#EFE8DC]">
                            {langCode === 'tr'
                              ? 'Arkadaşlarınızın sizi değerlendirirken en çok duraksadığı soru.'
                              : 'The trait where your circle paused the longest before answering.'}
                          </p>
                        </div>

                        {/* Card 2: Instant Intuition */}
                        <div
                          className="p-4 sm:p-5 rounded-[20px] sm:rounded-[22px] text-left flex flex-col justify-between box-border"
                          style={{
                            background: '#FDFBF4',
                            border: '1px solid rgba(197, 160, 89, 0.22)',
                            boxShadow: '0 4px 14px rgba(80, 60, 40, 0.03)'
                          }}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[10px] uppercase font-bold tracking-[0.08em] text-[#8C6D37]">
                                {langCode === 'tr' ? 'REFLEKS KARAR' : 'INSTANT CONVICTION'}
                              </span>
                              <Lock size={12} strokeWidth={2.2} className="text-[#8C6D37]" />
                            </div>

                            <h4 className="font-serif text-[1.2rem] sm:text-[1.25rem] font-bold text-[#1A3E72] m-0 mb-1">
                              {langCode === 'tr' ? 'Kilitli Sinyal' : 'Locked Signal'}
                            </h4>

                            <div className="flex items-baseline gap-1.5 my-1.5">
                              <span className="font-serif text-2xl font-black text-[#1A3E72] leading-none opacity-40">
                                --.-s
                              </span>
                              <span className="font-sans text-[11px] text-[#64748B]">
                                {langCode === 'tr' ? 'ortalama karar hızı' : 'instant speed'}
                              </span>
                            </div>
                          </div>

                          <p className="font-sans text-[0.8rem] text-[#64748B] leading-relaxed m-0 mt-3 pt-2.5 border-t border-[#EFE8DC]">
                            {langCode === 'tr'
                              ? 'Arkadaşlarınızın sizi değerlendirirken üzerine en az düşündüğü ve doğrudan işaretlediği soru.'
                              : 'The question your friends spent the least time reflecting on.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ========================================================= */
                  /* PLUS USER: TOP HORIZONTAL + 2 BOTTOM SIDE-BY-SIDE         */
                  /* ========================================================= */
                  <div className="flex flex-col gap-3.5 w-full box-border">
                    {/* Top: Horizontal PROFIL ZIYARETI & STALK Card */}
                    <div
                      className="p-4 sm:p-6 rounded-[20px] sm:rounded-[22px] text-left flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-5 box-border"
                      style={{
                        background: '#FDFBF4',
                        border: '1px solid rgba(197, 160, 89, 0.25)',
                        boxShadow: '0 4px 14px rgba(80, 60, 40, 0.03)'
                      }}
                    >
                      <div className="flex-1 max-w-lg">
                        <h4 className="font-serif text-[1.2rem] sm:text-[1.35rem] font-bold text-[#1A3E72] m-0 mb-1">
                          {langCode === 'tr' ? 'Gizli İncelemeler & Ziyaretçi Dağılımı' : 'Profile Visits & Silent Viewers'}
                        </h4>

                        <p className="font-sans text-[0.82rem] sm:text-[0.84rem] text-[#4A5568] leading-relaxed m-0 mb-3">
                          {totalProfileClicks === 0 ? (
                            langCode === 'tr'
                              ? 'Profil linkiniz henüz ziyaret almadı. Linkinizi paylaştığınızda sizi inceleyenlerin ve analizi çözenlerin oranı burada gösterilecektir.'
                              : 'Your profile has not received visits yet. Visitor breakdown will be analyzed once shared.'
                          ) : (
                            langCode === 'tr'
                              ? `Profil linkinizi toplam ${totalProfileClicks} kişi açtı. Bunların ${Math.max(0, totalProfileClicks - totalResponders)} tanesi sadece profilinize bakıp geçerken, ${totalResponders} kişi analizi tamamladı.`
                              : `${totalProfileClicks} people opened your profile. ${Math.max(0, totalProfileClicks - totalResponders)} silently browsed without answering, and ${totalResponders} completed the quiz.`
                          )}
                        </p>

                        {/* Micro Status Badges */}
                        {totalProfileClicks > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] sm:text-[11px] font-bold bg-[#1A3E72]/[0.07] text-[#1A3E72] border border-[#1A3E72]/15">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1A3E72]"></span>
                              <span>{totalResponders} {langCode === 'tr' ? 'Testi Tamamlayan' : 'Completed'}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] sm:text-[11px] font-bold bg-[#8C6D37]/[0.08] text-[#8C6D37] border border-[#8C6D37]/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#8C6D37]"></span>
                              <span>{Math.max(0, totalProfileClicks - totalResponders)} {langCode === 'tr' ? 'Sessiz İzleyici' : 'Silent Viewers'}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center shrink-0 min-w-[170px] pt-3 sm:pt-0 sm:border-l sm:border-[#EFE8DC] border-t sm:border-t-0 border-[#EFE8DC] sm:px-6 sm:py-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-serif text-2xl sm:text-4xl font-black text-[#1A3E72] leading-none">
                            {totalProfileClicks}
                          </span>
                          <span className="font-sans text-[11px] sm:text-[12px] font-bold text-[#1A3E72]">
                            {langCode === 'tr' ? 'Ziyaret' : 'Visits'}
                          </span>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 sm:p-0 rounded-md sm:rounded-none bg-[#8C6D37]/[0.08] sm:bg-transparent text-[11px] font-semibold text-[#8C6D37] sm:mt-1.5 text-center">
                          %{ratio} {langCode === 'tr' ? 'Tamamlama' : 'Conversion'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom 2 Columns: Hesitation & Reflex */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full box-border">
                      {/* Card 1: Hesitation (Unlocked) */}
                      <div
                        className="p-4 sm:p-5 rounded-[20px] sm:rounded-[22px] text-left flex flex-col justify-between box-border"
                        style={{
                          background: '#FDFBF4',
                          border: '1px solid rgba(197, 160, 89, 0.25)',
                          boxShadow: '0 4px 14px rgba(80, 60, 40, 0.03)'
                        }}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] uppercase font-bold tracking-[0.08em] text-[#8C6D37]">
                              {langCode === 'tr' ? 'BİLİŞSEL DURAKSAMA' : 'LONGEST HESITATION'}
                            </span>
                            <Timer size={13} strokeWidth={2.2} className="text-[#8C6D37]" />
                          </div>

                          <h4 className="font-serif text-[1.2rem] sm:text-[1.3rem] font-bold text-[#1A3E72] m-0 mb-1 truncate" title={slowestSignal ? t('ui', `signal_labels.${slowestSignal}`) : ''}>
                            {slowestSignal ? t('ui', `signal_labels.${slowestSignal}`) : '-'}
                          </h4>

                          <div className="flex items-baseline gap-1.5 my-1.5">
                            <span className="font-serif text-2xl font-black text-[#1A3E72] leading-none">
                              {slowestTimeSec}s
                            </span>
                            <span className="font-sans text-[11px] text-[#64748B]">
                              {langCode === 'tr' ? 'ortalama düşünme süresi' : 'average pause'}
                            </span>
                          </div>
                        </div>

                        <p className="font-sans text-[0.82rem] text-[#4A5568] leading-relaxed m-0 mt-3 pt-2.5 border-t border-[#EFE8DC]">
                          {langCode === 'tr'
                            ? 'Arkadaşlarınız bu soruyu yanıtlarken en çok duraksadı. Karakterinizin üzerine en çok düşünülen boyutu.'
                            : 'Your circle spent the most time reflecting on this question before answering.'}
                        </p>
                      </div>

                      {/* Card 2: Instant Conviction (Unlocked) */}
                      <div
                        className="p-4 sm:p-5 rounded-[20px] sm:rounded-[22px] text-left flex flex-col justify-between box-border"
                        style={{
                          background: '#FDFBF4',
                          border: '1px solid rgba(197, 160, 89, 0.25)',
                          boxShadow: '0 4px 14px rgba(80, 60, 40, 0.03)'
                        }}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] uppercase font-bold tracking-[0.08em] text-[#8C6D37]">
                              {langCode === 'tr' ? 'REFLEKS KARAR' : 'INSTANT CONVICTION'}
                            </span>
                            <Zap size={13} strokeWidth={2.2} className="text-[#8C6D37]" />
                          </div>

                          <h4 className="font-serif text-[1.2rem] sm:text-[1.3rem] font-bold text-[#1A3E72] m-0 mb-1 truncate" title={fastestSignal ? t('ui', `signal_labels.${fastestSignal}`) : ''}>
                            {fastestSignal ? t('ui', `signal_labels.${fastestSignal}`) : '-'}
                          </h4>

                          <div className="flex items-baseline gap-1.5 my-1.5">
                            <span className="font-serif text-2xl font-black text-[#1A3E72] leading-none">
                              {fastestTimeSec}s
                            </span>
                            <span className="font-sans text-[11px] text-[#64748B]">
                              {langCode === 'tr' ? 'ortalama karar süresi' : 'average decision time'}
                            </span>
                          </div>
                        </div>

                        <p className="font-sans text-[0.82rem] text-[#4A5568] leading-relaxed m-0 mt-3 pt-2.5 border-t border-[#EFE8DC]">
                          {langCode === 'tr'
                            ? 'Arkadaşlarınız değerlendirme yaparken bu soru üzerine en az düşündü. Dışarıdan en net ve belirgin algılanan yönünüz.'
                            : 'Your friends spent the least time reflecting on this question. Your most clearly recognized trait.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 4 && (
              <div className="seenly-dashboard-tab-content full-width-layout scrollable-gap-content seenly-gap-editorial-content" style={{ maxWidth: '840px', width: '100%' }}>
                <div className="flex flex-col gap-5 w-full box-border">
                  {/* Non-Plus Hero Intelligence Banner for Gelen Analizler (using premium_bg2.png) */}
                  {!isPremium && (
                    <div
                      className="p-6 sm:p-7 rounded-[26px] w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-5 box-border text-left relative overflow-hidden"
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

                      <div className="flex-1 max-w-xl relative z-10">
                        <h3 className="font-serif text-[1.35rem] sm:text-[1.5rem] font-bold text-[#3C2C23] tracking-tight leading-snug m-0 drop-shadow-[0_1px_2px_rgba(255,255,255,0.7)]">
                          {langCode === 'tr'
                            ? 'Anonim İncelemeler'
                            : 'Anonymous Reviews'}
                        </h3>

                        <p className="font-sans text-[0.84rem] sm:text-[0.85rem] text-[#3C2C23]/90 font-medium leading-relaxed max-w-lg m-0 mt-1.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
                          {langCode === 'tr'
                            ? 'Arkadaşlarınızın sorulara verdiği tüm bireysel yanıtları ve soru bazlı detayları tamamen anonim olarak inceleyin.'
                            : 'Review all individual friend answers and question-by-question breakdowns completely anonymously.'}
                        </p>
                      </div>

                      <div className="shrink-0 w-full md:w-auto relative z-10 flex flex-col items-center md:items-end">
                        <div className="relative inline-block w-full md:w-auto">
                          {/* Floating Micro Seal: Tek Seferlik */}
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#DFBF6A] via-[#FFF8E7] to-[#DFBF6A] text-[#0B1B2C] text-[8px] font-black uppercase tracking-[0.14em] shadow-[0_2px_8px_rgba(0,0,0,0.25)] z-20 border border-white/75 pointer-events-none whitespace-nowrap">
                            {langCode === 'tr' ? 'TEK SEFERLİK' : 'ONE-TIME'}
                          </span>

                          <button
                            type="button"
                            onClick={handleUpgradeToPlus}
                            className="group w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#16222F] hover:bg-[#0E1721] text-white font-sans font-semibold text-[12px] tracking-wider uppercase shadow-[0_4px_16px_rgba(22,34,47,0.2)] active:scale-[0.98] transition-all cursor-pointer border border-white/10"
                          >
                            <span>{langCode === 'tr' ? 'Plus ile Kilidi Aç' : 'Unlock with Plus'}</span>
                            <ArrowRight size={13} strokeWidth={2.2} className="text-white group-hover:translate-x-0.5 transition-all" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vertical Timeline List of Cards */}
                  {responseSessions.length === 0 ? (
                    <div className="p-8 rounded-3xl border border-white/40 bg-white/25 backdrop-blur-md shadow-contact-sm text-center relative overflow-hidden box-border">
                      <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                        <UsersRound size={22} strokeWidth={1.8} />
                      </div>
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
                    <div className="p-3.5 sm:p-5 rounded-[26px] sm:rounded-[28px] bg-[#EFE9DD]/60 border border-[rgba(197,160,89,0.28)] shadow-[inset_0_1px_6px_rgba(80,60,40,0.02)] flex flex-col gap-3.5 sm:gap-4 w-full box-border">
                      {/* Independent List Cards */}
                      <div className="flex flex-col gap-2.5 sm:gap-3 w-full box-border">
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
                              className="group p-3.5 sm:p-4 px-4 sm:px-5 rounded-[18px] sm:rounded-[20px] bg-white hover:bg-[#FDFBF7] border border-[rgba(197,160,89,0.32)] hover:border-[rgba(197,160,89,0.7)] shadow-[0_4px_14px_rgba(80,60,40,0.04)] hover:shadow-[0_8px_24px_rgba(80,60,40,0.09)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 box-border"
                            >
                              {/* Left Side: Avatar + Reader Style Title + Accuracy Score */}
                              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                {initialLetter ? (
                                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-[#F5EFE4] to-[#EAE1D2] border-[1.5px] border-[rgba(197,160,89,0.45)] flex items-center justify-center shrink-0 shadow-sm text-[#1A3E72] font-serif font-bold text-[14px] sm:text-[15px]">
                                    <span>{initialLetter}</span>
                                  </div>
                                ) : (
                                  <img
                                    src={anonimLogo}
                                    alt="Anonim"
                                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-contain shrink-0 shadow-sm border-[1.5px] border-[rgba(197,160,89,0.45)] ring-1 ring-[rgba(26,62,114,0.08)]"
                                  />
                                )}

                                <div className="flex flex-col items-start sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 min-w-0">
                                  <h4 className="font-serif text-[1.05rem] sm:text-[1.12rem] font-bold text-[#1A3E72] m-0 truncate group-hover:text-[#0E274A] transition-colors leading-tight">
                                    {!isAnonymous ? `${displayName} · ${archetypeName}` : archetypeName}
                                  </h4>

                                  {/* Accuracy Tag */}
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-sans font-bold tracking-tight border shrink-0 ${isAccurate
                                      ? 'bg-[#1A3E72]/[0.06] text-[#1A3E72] border-[#1A3E72]/18'
                                      : 'bg-[#8C6D37]/[0.08] text-[#8C6D37] border-[#8C6D37]/22'
                                    }`}>
                                    <span>{langCode === 'tr' ? `%${accuracyScore} Uyum` : `${accuracyScore}% Match`}</span>
                                  </span>
                                </div>
                              </div>

                              {/* Right Side: Timestamp + Hover Arrow */}
                              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EFE8DC]">
                                <span className="font-sans text-[11.5px] sm:text-[12px] text-[#8C9AA8] font-normal">
                                  {relativeTime}
                                </span>

                                <div className="w-8 h-8 rounded-full bg-[#1A3E72]/[0.03] group-hover:bg-[#1A3E72]/[0.08] flex items-center justify-center text-[#8C9AA8] group-hover:text-[#1A3E72] transition-all duration-300 ease-out">
                                  <ArrowRight size={14} strokeWidth={2.2} className="transform transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Always Visible Pagination Controls */}
                      <div
                        className="seenly-response-pagination pt-1"
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

                        {(responseHistoryTotalPages > 1 ? responseHistoryPageItems : [1]).map((pageItem) => {
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
            )}
          </div>
        </div>
      </div>

      {selectedResponse && !isPremium && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#0A1118]/65 backdrop-blur-md transition-all duration-300"
          onClick={() => setSelectedResponse(null)}
        >
          <div
            className="w-full max-w-[420px] rounded-[30px] sm:rounded-[32px] bg-[#FDFBF4] border border-[rgba(197,160,89,0.35)] shadow-[0_24px_70px_rgba(20,15,10,0.22)] overflow-hidden relative p-6 sm:p-7 text-center box-border"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              type="button"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] flex items-center justify-center text-[#786C5E] hover:text-[#1A3E72] transition-colors border border-[rgba(197,160,89,0.18)]"
              onClick={() => setSelectedResponse(null)}
              aria-label={langCode === 'tr' ? 'Pencereyi kapat' : 'Close dialog'}
            >
              <X size={16} strokeWidth={2.4} />
            </button>

            {/* Respondent Avatar & Archetype Badge */}
            <div className="flex flex-col items-center gap-2.5 pt-1 pb-1">
              <div className="relative">
                <img
                  src={anonimLogo}
                  alt="Anonim"
                  className="w-15 h-15 rounded-full object-contain shadow-sm border-[2px] border-[rgba(197,160,89,0.45)] ring-2 ring-[rgba(26,62,114,0.06)]"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#16222F] border-2 border-[#FDFBF4] flex items-center justify-center text-[#C5A059] shadow-sm">
                  <Lock size={11} strokeWidth={2.5} />
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <span className="font-sans text-[10px] uppercase tracking-[0.15em] font-bold text-[#8C6D37]">
                  {langCode === 'tr' ? 'BİREYSEL ANALİZ' : 'INDIVIDUAL ANALYSIS'}
                </span>
                <h3 className="font-serif text-[1.35rem] sm:text-[1.45rem] font-bold text-[#1A3E72] m-0 tracking-tight leading-tight">
                  {getObject('readerStyles', selectedResponse.readerType)?.name || selectedResponse.readerType.replace('_', ' ').toUpperCase()}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 mt-0.5 rounded-full text-[11px] font-sans font-bold bg-[#8C6D37]/[0.08] text-[#8C6D37] border border-[#8C6D37]/20">
                  {langCode === 'tr' ? `%${getSessionCalibratedAccuracy(selectedResponse)} Uyum` : `${getSessionCalibratedAccuracy(selectedResponse)}% Match`}
                </span>
              </div>
            </div>

            {/* Feature Teasers List */}
            <div className="my-4 py-3 px-4 rounded-[20px] bg-[#F7F2E7]/85 border border-[rgba(197,160,89,0.22)] text-left flex flex-col gap-2.5 box-border">
              <div className="flex items-center gap-2.5 text-[12px] text-[#334155] font-medium">
                <Sparkles size={13} className="text-[#C5A059] shrink-0" />
                <span>{langCode === 'tr' ? '10 sorunun tamamında verdiği bireysel yanıtlar' : 'Individual answers across all 10 questions'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[12px] text-[#334155] font-medium">
                <Timer size={13} className="text-[#C5A059] shrink-0" />
                <span>{langCode === 'tr' ? 'Sorulardaki düşünme ve karar süreleri' : 'Exact thought and decision durations'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[12px] text-[#334155] font-medium">
                <ShieldCheck size={13} className="text-[#C5A059] shrink-0" />
                <span>{langCode === 'tr' ? 'Sosyal sinyal ve karakter algı sapmaları' : 'Social signal and archetype deviations'}</span>
              </div>
            </div>

            {/* Unlock CTA Button */}
            <div className="relative pt-1.5">
              {/* Tek Seferlik Seal */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-[#16222F] text-[8px] font-black tracking-[0.14em] uppercase shadow-sm">
                  {langCode === 'tr' ? 'TEK SEFERLİK' : 'ONE-TIME'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedResponse(null);
                  handleUpgradeToPlus();
                }}
                className="w-full py-3 sm:py-3.5 px-5 rounded-full bg-[#16222F] hover:bg-[#0E1721] text-white font-sans text-[13.5px] sm:text-[14px] font-bold tracking-wide shadow-[0_8px_20px_rgba(22,34,47,0.22)] hover:shadow-[0_12px_28px_rgba(22,34,47,0.32)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 border border-[#C5A059]/30"
              >
                <span>{langCode === 'tr' ? 'Plus ile Detayları Aç' : 'Unlock Details with Plus'}</span>
                <ArrowRight size={15} strokeWidth={2.4} className="text-[#C5A059]" />
              </button>
            </div>

            {/* Privacy Guarantee Note */}
            <div className="mt-3.5 pt-3 border-t border-[#EFE8DC] flex items-center justify-center gap-1.5 text-[11px] text-[#8C9AA8] font-medium">
              <ShieldCheck size={13} className="text-[#C5A059] shrink-0" />
              <span>
                {langCode === 'tr'
                  ? 'Gizlilik Güvencesi: Tüm yansımalar %100 anonimdir.'
                  : 'Privacy Guard: All reflections remain 100% anonymous.'}
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}
      {selectedResponse && isPremium && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3.5 sm:p-5 bg-[#0A1118]/65 backdrop-blur-md transition-all duration-300"
          onClick={() => setSelectedResponse(null)}
        >
          {(() => {
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

            return (
              <div
                className="w-full max-w-[540px] max-h-[88vh] rounded-[30px] sm:rounded-[34px] bg-[#FDFBF4] border border-[rgba(197,160,89,0.35)] shadow-[0_28px_80px_rgba(20,15,10,0.25)] flex flex-col overflow-hidden relative box-border text-left"
                onClick={(event) => event.stopPropagation()}
              >
                {/* Header Profile Section */}
                <div className="p-5 sm:p-6 pb-4 border-b border-[#EFE8DC] bg-[#FDFBF4] flex items-center justify-between shrink-0 relative">
                  <div className="flex items-center gap-3.5 min-w-0 pr-8">
                    {initialLetter ? (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F5EFE4] to-[#EAE1D2] border-[1.5px] border-[rgba(197,160,89,0.45)] flex items-center justify-center shrink-0 shadow-sm text-[#1A3E72] font-serif font-bold text-[16px]">
                        <span>{initialLetter}</span>
                      </div>
                    ) : (
                      <img
                        src={anonimLogo}
                        alt="Anonim"
                        className="w-12 h-12 rounded-full object-contain shrink-0 shadow-sm border-[1.5px] border-[rgba(197,160,89,0.45)] ring-1 ring-[rgba(26,62,114,0.08)]"
                      />
                    )}

                    <div className="min-w-0">
                      <span className="font-sans text-[9.5px] uppercase tracking-[0.14em] font-bold text-[#8C6D37] block">
                        {langCode === 'tr' ? 'BİREYSEL YANSIMA DETAYI' : 'INDIVIDUAL REFLECTION DETAIL'}
                      </span>
                      <h3 className="font-serif text-[1.25rem] sm:text-[1.4rem] font-bold text-[#1A3E72] m-0 truncate leading-tight">
                        {!isAnonymous ? `${displayName} · ${readerName}` : readerName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-sans font-bold bg-[#8C6D37]/[0.08] text-[#8C6D37] border border-[#8C6D37]/20">
                          {langCode === 'tr' ? `%${accuracyScore} Uyum` : `${accuracyScore}% Match`}
                        </span>
                        <span className="font-sans text-[11px] text-[#8C9AA8]">
                          • {relativeTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    type="button"
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] flex items-center justify-center text-[#786C5E] hover:text-[#1A3E72] transition-colors border border-[rgba(197,160,89,0.18)]"
                    onClick={() => setSelectedResponse(null)}
                    aria-label={langCode === 'tr' ? 'Pencereyi kapat' : 'Close dialog'}
                  >
                    <X size={16} strokeWidth={2.4} />
                  </button>
                </div>

                {/* Scrollable Content Body */}
                <div className="overflow-y-auto p-5 sm:p-6 flex flex-col gap-5 box-border">
                  {/* Signal Distribution (10 Signals Breakdown) */}
                  <div className="p-4 sm:p-5 rounded-[22px] bg-white border border-[rgba(197,160,89,0.25)] shadow-[0_2px_12px_rgba(80,60,40,0.03)] flex flex-col gap-3">
                    <div className="pb-1 border-b border-[#EFE8DC]">
                      <h4 className="font-serif text-[1.05rem] font-bold text-[#1A3E72] m-0">
                        {langCode === 'tr' ? '10 Sosyal Sinyal Dağılımı' : '10 Social Signal Distribution'}
                      </h4>
                      <p className="font-sans text-[11.5px] text-[#64748B] m-0 mt-0.5">
                        {langCode === 'tr' ? 'Bu kişinin verdiği yanıtlara göre profilinizdeki sinyal skorları:' : 'Signals read by this respondent across questions:'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5 pt-1">
                      {detailSignals.map((signal) => {
                        const value = responseSignals[signal.key] !== undefined ? responseSignals[signal.key] : 3;
                        const percent = calibrateTraitScore(signal.key, value);
                        return (
                          <div key={signal.key} className="flex items-center justify-between gap-3 text-[12px]">
                            <span className="font-sans font-semibold text-[#334155] w-24 sm:w-28 shrink-0 truncate">
                              {signal.label}
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-[#EFE8DC] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#C5A059] to-[#1A3E72] transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11.5px] font-bold text-[#1A3E72] w-10 text-right shrink-0">
                              %{percent}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Decision & Cognitive Rhythm (Cevap Süreleri) */}
                  {timeEntries.length > 0 && (
                    <div className="p-4 sm:p-5 rounded-[22px] bg-white border border-[rgba(197,160,89,0.25)] shadow-[0_2px_12px_rgba(80,60,40,0.03)] flex flex-col gap-3">
                      <div className="pb-1 border-b border-[#EFE8DC]">
                        <h4 className="font-serif text-[1.05rem] font-bold text-[#1A3E72] m-0">
                          {langCode === 'tr' ? 'Bilişsel Karar Ritmi' : 'Cognitive Decision Rhythm'}
                        </h4>
                        <p className="font-sans text-[11.5px] text-[#64748B] m-0 mt-0.5">
                          {langCode === 'tr' ? 'Sorularda nerede en çok, nerede en az düşündü?' : 'Where did they spend the most and least time?'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {slowestEntry && (
                          <div className="p-3.5 rounded-[18px] bg-[#FDFBF4] border border-[rgba(197,160,89,0.28)] shadow-[0_2px_8px_rgba(80,60,40,0.02)] flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 text-[#8C6D37] text-[10.5px] font-bold uppercase tracking-wider">
                              <Timer size={13} className="text-[#C5A059]" />
                              <span>{langCode === 'tr' ? 'En Çok Düşündüğü' : 'Longest Pause'}</span>
                            </div>
                            <div className="flex items-baseline justify-between gap-1">
                              <span className="font-serif text-[1.05rem] font-bold text-[#1A3E72]">
                                {signalLabelByKey[slowestEntry[0]] || slowestEntry[0]}
                              </span>
                              <span className="font-mono text-[12.5px] font-bold text-[#8C6D37]">
                                {(slowestEntry[1] / 1000).toFixed(1)}s
                              </span>
                            </div>
                          </div>
                        )}

                        {fastestEntry && (
                          <div className="p-3.5 rounded-[18px] bg-[#FDFBF4] border border-[rgba(197,160,89,0.28)] shadow-[0_2px_8px_rgba(80,60,40,0.02)] flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 text-[#8C6D37] text-[10.5px] font-bold uppercase tracking-wider">
                              <Zap size={13} className="text-[#C5A059]" />
                              <span>{langCode === 'tr' ? 'En Az Düşündüğü' : 'Fastest Answer'}</span>
                            </div>
                            <div className="flex items-baseline justify-between gap-1">
                              <span className="font-serif text-[1.05rem] font-bold text-[#1A3E72]">
                                {signalLabelByKey[fastestEntry[0]] || fastestEntry[0]}
                              </span>
                              <span className="font-mono text-[12.5px] font-bold text-[#8C6D37]">
                                {(fastestEntry[1] / 1000).toFixed(1)}s
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {slowestEntry && fastestEntry && (
                        <p className="font-sans text-[11.5px] text-[#64748B] italic m-0 pt-1 leading-relaxed">
                          {langCode === 'tr'
                            ? `Arkadaşınız sizin hakkınızda değerlendirme yaparken en çok "${signalLabelByKey[slowestEntry[0]] || slowestEntry[0]}" sorusu üzerinde düşündü; en az ise "${signalLabelByKey[fastestEntry[0]] || fastestEntry[0]}" sorusu üzerine düşündü.`
                            : `While evaluating you, your friend spent the most time contemplating your "${signalLabelByKey[slowestEntry[0]] || slowestEntry[0]}", and the least time on "${signalLabelByKey[fastestEntry[0]] || fastestEntry[0]}".`
                          }
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>,
        document.body
      )}

      {qrModalOpen && (
        (() => {
          const inviteUrl = snapshot?.publicSlug ? `${window.location.origin}/#/friend/${snapshot.publicSlug}` : '';
          return createPortal(
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(11, 27, 44, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }} onClick={() => setQrModalOpen(false)}>
              <div style={{
                background: 'var(--color-paper-cream)',
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '320px',
                width: '100%',
                boxShadow: '0 24px 60px rgba(11, 27, 44, 0.15)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid rgba(11, 27, 44, 0.05)'
              }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setQrModalOpen(false)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(11, 27, 44, 0.05)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--color-deep-ink)',
                    transition: 'all 0.2s ease'
                  }}
                  className="hover:bg-black/10"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>

                <h3 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: 'var(--color-deep-ink)',
                  margin: '0 0 8px 0',
                  textAlign: 'center'
                }}>
                  {langCode === 'tr' ? 'Profil Karekodu' : 'Profile QR Code'}
                </h3>

                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.85rem',
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                  margin: '0 0 24px 0',
                  lineHeight: 1.4
                }}>
                  {langCode === 'tr' ? 'Arkadaşlarının seni okuması için bu karekodu okutmasını sağla.' : 'Let your friends scan this QR code to read your signals.'}
                </p>

                <div style={{
                  background: '#ffffff',
                  padding: '16px',
                  borderRadius: '16px',
                  boxShadow: '0 8px 24px rgba(11, 27, 44, 0.06)',
                  marginBottom: '24px'
                }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteUrl)}`}
                    alt="Profile QR Code"
                    style={{ width: '200px', height: '200px', display: 'block' }}
                  />
                </div>

                <button
                  onClick={() => {
                    fetch(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(inviteUrl)}`)
                      .then(res => res.blob())
                      .then(blob => {
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = `Seenly_QR_${displayName}.png`;
                        link.click();
                      });
                  }}
                  style={{
                    width: '100%',
                    background: 'var(--color-deep-ink)',
                    color: 'var(--color-paper-cream)',
                    border: 'none',
                    borderRadius: '100px',
                    padding: '14px 24px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  className="hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>{langCode === 'tr' ? 'KAREKODU İNDİR' : 'DOWNLOAD QR'}</span>
                </button>
              </div>
            </div>,
            document.body
          );
        })()
      )}
    </AppShell>
  );
}
