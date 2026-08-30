import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';
import { CARD_IMAGES } from '../images/cardImages';
import { IntersectingCircles, WatercolorStain, HairLine, ConnectorDots } from '../components/marks';
import { getCardRarityData } from '../utils/rarityEngine';
import { fetchAllCardRarities } from '../services/api';

const SIGNATURES_DATA = [
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

const CHARACTER_FAMILIES = {
  stratega: ["the_visionary", "the_elite_mind", "the_mastermind", "the_playmaker", "the_strategist", "the_philosopher", "the_innovator", "the_know_it_all", "the_silent_king", "the_consultant"],
  imperia: ["the_leader", "the_alpha_achiever", "the_ice_queen_king", "the_star_player", "the_showman", "the_powerhouse", "the_stoic_king", "the_pillar", "the_gatekeeper"],
  aura: ["the_magnet", "the_social_star", "the_sweetheart", "the_seductive_mind", "the_aesthetic", "the_party_host", "the_mature_charm", "the_charming_anchor"],
  porta: ["the_safe_haven", "the_empath", "the_dreamer", "the_calm_harbor", "the_golden_retriever", "the_steady_vibe", "the_proud_friend", "the_ambitious_sweetheart"],
  gratia: ["the_noble_heart", "the_benevolent_guide", "the_intellectual_giver", "the_philanthropist", "the_idealist", "the_helper", "the_protector", "the_proud_patron", "the_patron", "the_life_giver"]
};


export default function IdentitiesPage() {
  const { locale: langCode, t, getObject } = useLocale();
  const [selectedCard, setSelectedCard] = useState(null);
  const [filterFamily, setFilterFamily] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiRarities, setApiRarities] = useState({});

  // Fetch live dynamic card rarities from backend
  useEffect(() => {
    let isMounted = true;
    fetchAllCardRarities(langCode).then(data => {
      if (isMounted && data) {
        setApiRarities(data);
      }
    });
    return () => { isMounted = false; };
  }, [langCode]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (selectedCard) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedCard]);

  // Handle auto-open of selected identity from dashboard
  useEffect(() => {
    const selectedId = localStorage.getItem('seenly_selected_identity');
    if (selectedId) {
      const card = SIGNATURES_DATA.find(c => c.id === selectedId);
      if (card) {
        setSelectedCard(card);
        const family = Object.keys(CHARACTER_FAMILIES).find(
          fam => CHARACTER_FAMILIES[fam].includes(selectedId)
        );
        if (family) {
          setFilterFamily(family);
        }
      }
      localStorage.removeItem('seenly_selected_identity');
    }
  }, []);

  const families = ['all', 'stratega', 'imperia', 'aura', 'porta', 'gratia'];

  const handleStartQuiz = () => {
    sessionStorage.setItem('seenly_currentIndex', '-2');
    sessionStorage.setItem('seenly_isQuickLogin', 'false');
    window.location.hash = '#/';
  };

  const handleLoginClick = () => {
    sessionStorage.setItem('seenly_currentIndex', '-5');
    sessionStorage.setItem('seenly_isQuickLogin', 'true');
    window.location.hash = '#/';
  };

  const filteredCards = SIGNATURES_DATA.filter(card => {
    // 1. Family filter
    if (filterFamily !== 'all') {
      const members = CHARACTER_FAMILIES[filterFamily] || [];
      if (!members.includes(card.id)) return false;
    }

    // 2. Search query filter
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const signature = getObject('signatures', card.id) || { name: card.id };
    const name = (signature.name || '').toLowerCase();
    const oneLine = (signature.oneLine || '').toLowerCase();

    return name.includes(query) || oneLine.includes(query) || card.id.toLowerCase().includes(query);
  });

  const getFamilyLabel = (famKey) => {
    if (famKey === 'all') return t('ui', 'identities_filter_all') || 'Hepsi';
    return t('ui', 'family_' + famKey) || famKey;
  };

  const generateDetailedDescription = (signals) => {
    const s1 = signals[0];
    const s2 = signals[1];
    const d1 = t('ui', 'desc_' + s1) || '';
    const d2 = t('ui', 'desc_' + s2) || '';
    const template = t('ui', 'identities_desc_template') || '';
    return template.replace('{d1}', d1).replace('{d2}', d2);
  };

  const isLoggedIn = Boolean(localStorage.getItem('seenly_owner_token'));

  return (
    <AppShell isDashboard={true}>
      <div className="pt-20 sm:pt-26 pb-16 sm:pb-20 relative z-10 overflow-x-clip">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 relative z-10">

          {/* Header Intro */}
          <div className="text-center max-w-[760px] mx-auto mb-8 sm:mb-10 animate-fade-in relative z-10 px-2">
            <IntersectingCircles className="mx-auto h-7 sm:h-8 w-10 sm:w-12 text-gold mb-2.5 sm:mb-3" />
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.1] font-medium tracking-tight text-foreground m-0">
              {t('ui', 'nav_social_identities') || 'Sosyal Kimlikler'}
            </h1>
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className="h-0.5 w-12 bg-gold/50" />
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              <span className="h-0.5 w-12 bg-gold/50" />
            </div>
          </div>

          {/* Sleek Search Bar */}
          <div className="relative max-w-[440px] mx-auto mb-6 sm:mb-8 w-full box-border animate-fade-in px-2 sm:px-0">
            <input
              type="text"
              placeholder={t('ui', 'identities_search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem 2.5rem 0.7rem 2.6rem',
                borderRadius: '9999px',
                border: '1px solid rgba(197, 160, 89, 0.35)',
                fontSize: '0.86rem',
                fontFamily: 'var(--font-sans), sans-serif',
                color: 'var(--color-deep-ink)',
                backgroundColor: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                outline: 'none',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 4px 16px rgba(80, 60, 40, 0.04)',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--peach)';
                e.target.style.backgroundColor = '#ffffff';
                e.target.style.boxShadow = '0 0 0 3px rgba(217, 106, 83, 0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(197, 160, 89, 0.35)';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.75)';
                e.target.style.boxShadow = '0 4px 16px rgba(80, 60, 40, 0.04)';
              }}
            />
            <div style={{
              position: 'absolute',
              left: '1.25rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#8C6D37',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none'
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '1.25rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
                aria-label="Aramayı temizle"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Mobile-Optimized Glassmorphic Filter Bar */}
          <div className="w-full max-w-4xl mx-auto mb-8 sm:mb-12 animate-fade-in relative">
            <div
              className="flex sm:justify-center overflow-x-auto snap-x px-3 sm:px-0 pb-3 sm:pb-0 -mx-3 sm:mx-0 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="flex items-center gap-2 sm:gap-2.5 sm:px-4 sm:py-2 sm:bg-white/45 sm:border sm:border-[rgba(197,160,89,0.28)] sm:shadow-sm sm:backdrop-blur-md sm:rounded-full min-w-max">
                {families.map(fam => {
                  const isActive = filterFamily === fam;
                  return (
                    <button
                      key={fam}
                      onClick={() => setFilterFamily(fam)}
                      className={`group flex items-center gap-1.5 sm:gap-2 px-4 sm:px-4.5 py-2 sm:py-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-all duration-300 rounded-full snap-center whitespace-nowrap cursor-pointer ${isActive
                        ? 'bg-[#132338] text-white shadow-md scale-[1.02] border-transparent'
                        : 'bg-white/80 sm:bg-transparent text-[#64748B] hover:text-[#132338] hover:bg-white/95 sm:hover:bg-white/35 border border-[rgba(197,160,89,0.22)] sm:border-transparent shadow-xs sm:shadow-none'
                        }`}
                    >
                      {fam !== 'all' && (
                        <span
                          className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full transition-transform duration-300 group-hover:scale-125"
                          style={{
                            backgroundColor:
                              fam === 'stratega' ? '#8A70D6' :
                                fam === 'imperia' ? '#E06553' :
                                  fam === 'aura' ? '#8F7BCC' :
                                    fam === 'porta' ? '#5aa882' : '#E5A260'
                          }}
                        />
                      )}
                      <span>{getFamilyLabel(fam)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredCards.length > 0 ? (
            <div className="grid grid-cols-2 gap-3.5 sm:gap-6 md:gap-7 lg:grid-cols-4 animate-fade-in">
              {filteredCards.map((card) => {
                const signature = getObject('signatures', card.id) || {
                  name: card.id,
                  oneLine: 'Awaiting signature calculation...'
                };
                const img = CARD_IMAGES[card.id];
                const rarity = getCardRarityData(card.id, apiRarities[card.id], langCode);

                return (
                  <article
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className="group flex flex-col items-center text-center cursor-pointer relative z-10 w-full"
                  >
                    <div className="relative w-full max-w-[18rem]">
                      {/* Stylish rounded rectangle frame */}
                      <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] sm:rounded-[24px] bg-[#FDFBF4] shadow-[0_8px_24px_rgba(80,60,40,0.08)] border border-[rgba(197,160,89,0.25)] transition-all duration-400 group-hover:-translate-y-1.5 group-hover:shadow-[0_16px_36px_rgba(80,60,40,0.16)]">
                        {/* Dynamic Rarity Pill Badge */}
                        <div 
                          className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-30 inline-flex items-center px-2 py-0.5 rounded-full shadow-xs transition-all duration-300 pointer-events-none"
                          style={{
                            backgroundColor: rarity.badgeBg,
                            color: rarity.badgeText,
                            border: `1px solid ${rarity.badgeBorder}`,
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '9.5px',
                            fontWeight: 700,
                            letterSpacing: '0.01em'
                          }}
                        >
                          <span>{rarity.badgeLabel}</span>
                        </div>

                        <img
                          src={img}
                          alt={signature.name}
                          className="w-full h-full object-cover relative z-10 transition-transform duration-600 group-hover:scale-104"
                        />
                        {/* Dark gradient overlay for text legibility */}
                        <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-black/85 via-black/40 to-transparent z-20" />

                        {/* Title overlay inside image at the bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-4 pb-3.5 sm:pb-4.5 z-30 flex flex-col items-center text-center">
                          <h3 className="font-serif text-[0.98rem] sm:text-[1.2rem] font-bold text-white tracking-wide leading-tight m-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                            {signature.name}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.55)',
              backdropFilter: 'blur(8px)',
              borderRadius: '24px',
              border: '1px dashed rgba(197, 160, 89, 0.3)',
              maxWidth: '440px',
              margin: '0 auto'
            }} className="animate-fade-in">
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem',
                color: 'var(--color-text-muted)',
                margin: 0
              }}>
                {t('ui', 'faq_no_results') || 'Aramanızla eşleşen bir kimlik bulunamadı.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Luxury Editorial Detail Modal Overlay */}
      {selectedCard && (() => {
        const signature = getObject('signatures', selectedCard.id);
        const signatureName = signature ? signature.name : selectedCard.id;
        const signatureOneLine = signature ? signature.oneLine : "";
        const img = CARD_IMAGES[selectedCard.id];

        // Find which family this card belongs to
        const cardFamily = Object.keys(CHARACTER_FAMILIES).find(
          fam => CHARACTER_FAMILIES[fam].includes(selectedCard.id)
        ) || 'stratega';

        return createPortal(
          <div
            className="fixed inset-0 bg-[#0A1118]/65 backdrop-blur-md z-[9999] flex items-center justify-center p-3.5 sm:p-6 md:p-8 animate-fade-in"
            onClick={() => setSelectedCard(null)}
          >
            <div
              className="bg-[#FDFBF4] border border-[rgba(197,160,89,0.35)] shadow-[0_28px_80px_rgba(20,15,10,0.25)] rounded-[26px] sm:rounded-[34px] w-full max-w-[800px] relative max-h-[90vh] flex flex-col overflow-hidden animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 bg-white/90 hover:bg-white shadow-sm text-[#786C5E] hover:text-[#1A3E72] w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors z-50 border border-[rgba(197,160,89,0.25)] cursor-pointer"
                aria-label={langCode === 'tr' ? 'Kapat' : 'Close'}
              >
                <span className="text-sm sm:text-base font-bold">✕</span>
              </button>

              <div className="overflow-y-auto p-5 sm:p-8 md:p-9 flex flex-col md:grid md:grid-cols-[1fr_1.2fr] gap-6 sm:gap-8 w-full h-full box-border">

                {/* Left Column: Visual Artwork Frame */}
                <div className="flex flex-col items-center justify-center w-full">
                  <div className="relative w-full max-w-[240px] sm:max-w-[280px] md:max-w-none aspect-[4/5] overflow-hidden rounded-[20px] sm:rounded-[24px] bg-[#FDFBF4] shadow-[0_12px_36px_rgba(80,60,40,0.14)] border border-[rgba(197,160,89,0.25)]">
                    <WatercolorStain
                      name={`modal-stain-${selectedCard.id}`}
                      hue={cardFamily === 'stratega' ? 'lilac' : (cardFamily === 'imperia' ? 'clay' : (cardFamily === 'aura' ? 'peach' : (cardFamily === 'porta' ? 'gold' : 'peach')))}
                      seed={42}
                      intensity={0.32}
                      className="absolute inset-0 h-full w-full scale-110 pointer-events-none z-0"
                    />
                    <img
                      src={img}
                      alt={signatureName}
                      className="w-full h-full object-cover relative z-10"
                    />
                  </div>
                </div>

                {/* Right Column: Narrative Content */}
                <div className="flex flex-col justify-center text-left">
                  {/* Family Header */}
                  <span className="font-sans text-[10px] sm:text-[10.5px] uppercase tracking-[0.16em] font-bold text-[#8C6D37] block mb-1">
                    {getFamilyLabel(cardFamily)} {langCode === 'tr' ? 'Ailesi' : 'Family'}
                  </span>

                  {/* Name & Dynamic Rarity Badge */}
                  {(() => {
                    const modalRarity = getCardRarityData(selectedCard.id, apiRarities[selectedCard.id], langCode);
                    return (
                      <div className="flex items-center justify-between gap-2.5 flex-wrap mb-1.5">
                        <h2 className="font-serif text-2xl sm:text-3xl lg:text-[2.2rem] font-bold leading-tight text-[#1A3E72] tracking-tight m-0">
                          {signatureName}
                        </h2>

                        {/* Modal Rarity Pill Badge */}
                        <div 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-xs"
                          style={{
                            backgroundColor: modalRarity.badgeBg,
                            color: modalRarity.badgeText,
                            border: `1px solid ${modalRarity.badgeBorder}`,
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.01em'
                          }}
                        >
                          <span>{modalRarity.badgeLabel}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <ConnectorDots className="w-36 h-5 text-gold/50 mb-2" variant="flat" />

                  {/* Highlight Quote */}
                  <p className="font-serif italic text-[0.95rem] sm:text-[1.1rem] text-[#1A3E72]/90 leading-relaxed mb-3 sm:mb-4">
                    "{signatureOneLine}"
                  </p>

                  {/* Detailed Analysis */}
                  <p className="font-sans text-[12.5px] sm:text-[13.5px] leading-relaxed text-[#4A5568] mb-5 sm:mb-6">
                    {generateDetailedDescription(selectedCard.signals)}
                  </p>

                  {/* CTA Action */}
                  <button
                    type="button"
                    onClick={handleStartQuiz}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#16222F] hover:bg-[#0E1721] text-white py-3 sm:py-3.5 px-6 text-[13px] sm:text-[13.5px] font-bold tracking-wide shadow-[0_4px_16px_rgba(22,34,47,0.2)] hover:shadow-[0_8px_24px_rgba(22,34,47,0.3)] transition-all cursor-pointer border border-white/10 active:scale-[0.98]"
                  >
                    <span>{t('ui', 'identities_cta_discover') || 'Bu Rolü Kendinde Keşfet'}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-scale-in {
          animation: scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.55s ease forwards;
        }
      `}</style>
    </AppShell>
  );
}
