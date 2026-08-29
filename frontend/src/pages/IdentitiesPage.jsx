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
      <div className="pt-28 pb-20 relative z-10 overflow-x-clip">




        <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8 relative z-10">

          {/* Header Intro */}
          <div className="text-center max-w-[760px] mx-auto mb-10 animate-fade-in relative z-10">
            <IntersectingCircles className="mx-auto h-8 w-12 text-gold mb-3" />
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
          <div className="relative max-w-[480px] mx-auto mb-8 w-full box-border animate-fade-in px-4">
            <input
              type="text"
              placeholder={t('ui', 'identities_search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1.25rem 0.75rem 2.85rem',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                fontSize: '0.88rem',
                fontFamily: 'var(--font-sans), sans-serif',
                color: 'var(--color-deep-ink)',
                backgroundColor: 'rgba(255, 255, 255, 0.42)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                outline: 'none',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 8px 24px rgba(11, 27, 44, 0.015), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--peach)';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
                e.target.style.boxShadow = '0 0 0 4px rgba(217, 106, 83, 0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.42)';
                e.target.style.boxShadow = '0 8px 24px rgba(11, 27, 44, 0.015), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
              }}
            />
            <div style={{
              position: 'absolute',
              left: '1.9rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '1.9rem',
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
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Mobile-Optimized Glassmorphic Filter Bar */}
          <div className="w-full max-w-4xl mx-auto mb-12 sm:mb-16 animate-fade-in relative">
            <div
              className="flex sm:justify-center overflow-x-auto snap-x px-5 sm:px-0 pb-4 sm:pb-0 -mx-5 sm:mx-0 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="flex items-center gap-2.5 sm:gap-3 sm:px-5 sm:py-2.5 sm:bg-white/35 sm:border sm:border-white/55 sm:shadow-contact-sm sm:backdrop-blur-md sm:rounded-full min-w-max">
                {families.map(fam => {
                  const isActive = filterFamily === fam;
                  return (
                    <button
                      key={fam}
                      onClick={() => setFilterFamily(fam)}
                      className={`group flex items-center gap-2 px-5 py-2.5 sm:py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-all duration-300 rounded-full snap-center whitespace-nowrap ${isActive
                        ? 'bg-[#132338] text-white shadow-md scale-[1.02] border-transparent'
                        : 'bg-white/70 sm:bg-transparent text-muted-foreground hover:text-foreground hover:bg-white/95 sm:hover:bg-white/25 border border-white/60 sm:border-transparent shadow-sm sm:shadow-none'
                        }`}
                      style={{ cursor: 'pointer' }}
                    >
                      {fam !== 'all' && (
                        <span
                          className="h-2 w-2 rounded-full transition-transform duration-300 group-hover:scale-125"
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
            <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-4 animate-fade-in">
              {filteredCards.map((card, idx) => {
                const signature = getObject('signatures', card.id) || {
                  name: card.id,
                  oneLine: 'Awaiting signature calculation...'
                };
                const img = CARD_IMAGES[card.id];
                const rarity = getCardRarityData(card.id, apiRarities[card.id], langCode);
                const m = Object.keys(CHARACTER_FAMILIES).find(
                  fam => CHARACTER_FAMILIES[fam].includes(card.id)
                ) || 'stratega';

                const dotColor =
                  m === 'stratega' ? '#8A70D6' :
                    m === 'imperia' ? '#E06553' :
                      m === 'aura' ? '#8F7BCC' :
                        m === 'porta' ? '#5aa882' : '#E5A260';

                return (
                  <article
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className="group flex flex-col items-center text-center cursor-pointer relative z-10"
                  >
                    <div className="relative w-full max-w-[17.5rem]">
                      {/* Stylish rounded rectangle frame */}
                      <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-card shadow-[0_12px_36px_rgba(80,60,40,0.12)] border border-[#e5a260]/12 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_20px_48px_rgba(80,60,40,0.22)]">
                        {/* Dynamic Rarity Pill Badge */}
                        <div 
                          className="absolute top-2.5 right-2.5 z-30 inline-flex items-center px-2 py-0.5 rounded-full shadow-sm transition-all duration-300"
                          style={{
                            backgroundColor: rarity.badgeBg,
                            color: rarity.badgeText,
                            border: `1px solid ${rarity.badgeBorder}`,
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '10px',
                            fontWeight: 600,
                            letterSpacing: '0.01em'
                          }}
                        >
                          <span>{rarity.badgeLabel}</span>
                        </div>

                        <img
                          src={img}
                          alt={`${signature.name} kimliğini temsil eden mistik suluboya illüstrasyon`}
                          className="w-full h-full object-cover relative z-10 transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Elegant dark gradient overlay limited only to the text area at the bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-t from-black/72 to-transparent z-20" />

                        {/* Title absolute overlay inside image at the bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 pb-5.5 z-30 flex flex-col items-center text-center">
                          <h3 className="font-heading text-lg sm:text-xl font-semibold text-white tracking-wide leading-tight m-0">
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
              padding: '4rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.45)',
              backdropFilter: 'blur(8px)',
              borderRadius: '24px',
              border: '1px dashed rgba(11, 27, 44, 0.1)',
              maxWidth: '480px',
              margin: '0 auto'
            }} className="animate-fade-in">
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.95rem',
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
            className="fixed inset-0 bg-navy/40 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in"
            onClick={() => setSelectedCard(null)}
          >
            <div
              className="bg-background/96 border border-white/70 shadow-contact-lg rounded-[32px] w-full max-w-[840px] relative max-h-[92vh] flex flex-col overflow-hidden animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 bg-white/95 shadow-md text-navy hover:bg-white w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300 hover:rotate-90 z-50 backdrop-blur-md"
                style={{ cursor: 'pointer', border: '1px solid rgba(11,27,44,0.1)' }}
              >
                ✕
              </button>

              <div className="overflow-y-auto p-6 sm:p-9 flex flex-col md:grid md:grid-cols-[1fr_1.2fr] gap-8 sm:gap-10 w-full h-full">

                {/* Left Column: Visual Artwork Frame */}
                <div className="flex flex-col items-center justify-center h-full w-full">
                  <div className="relative w-full aspect-[4/5] overflow-hidden rounded-[22px] bg-card shadow-[0_18px_48px_rgba(80,60,40,0.22)] border border-[#e5a260]/15">
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
                    {/* inner vignette to blend into backdrop background */}
                    <div className="pointer-events-none absolute inset-0 rounded-[22px] shadow-[inset_0_0_40px_12px_var(--background)] z-20" />
                  </div>
                </div>

                {/* Right Column: Narrative Content */}
                <div className="flex flex-col justify-center text-left">
                  {/* Family Header */}
                  <span className="font-mono text-xs uppercase tracking-[0.22em] text-clay/90 block mb-2">
                    {getFamilyLabel(cardFamily)} {langCode === 'tr' ? 'Ailesi' : 'Family'}
                  </span>

                  {/* Name & Dynamic Rarity Badge */}
                  {(() => {
                    const modalRarity = getCardRarityData(selectedCard.id, apiRarities[selectedCard.id], langCode);
                    return (
                      <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                        <h2 className="font-heading text-3xl sm:text-4xl lg:text-[2.6rem] font-medium leading-none text-foreground tracking-tight m-0">
                          {signatureName}
                        </h2>

                        {/* Modal Rarity Pill Badge */}
                        <div 
                          className="inline-flex items-center px-3 py-0.8 rounded-full whitespace-nowrap shadow-sm"
                          style={{
                            backgroundColor: modalRarity.badgeBg,
                            color: modalRarity.badgeText,
                            border: `1px solid ${modalRarity.badgeBorder}`,
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '12px',
                            fontWeight: 600,
                            letterSpacing: '0.01em'
                          }}
                        >
                          <span>{modalRarity.badgeLabel}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <ConnectorDots className="w-40 h-6 text-gold/50 mb-3" variant="flat" />

                  {/* Highlight Quote */}
                  <p className="font-serif italic text-lg sm:text-[1.2rem] text-primary/95 leading-relaxed mb-6">
                    "{signatureOneLine}"
                  </p>

                  {/* Detailed Analysis */}
                  <p className="font-sans text-sm leading-relaxed text-muted-foreground/90 mb-8">
                    {generateDetailedDescription(selectedCard.signals)}
                  </p>

                  {/* CTA Action */}
                  <button
                    type="button"
                    onClick={handleStartQuiz}
                    className="shadow-contact-sm w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all duration-300 hover:scale-[1.02]"
                    style={{ cursor: 'pointer', border: 'none' }}
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
