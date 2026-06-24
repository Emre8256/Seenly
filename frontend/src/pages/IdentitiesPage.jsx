import React, { useState, useEffect } from 'react';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';
import { CARD_IMAGES } from '../images/cardImages';

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
  const { t, getObject } = useLocale();
  const [selectedCard, setSelectedCard] = useState(null);
  const [filterFamily, setFilterFamily] = useState('all');

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

  const families = ['all', 'stratega', 'imperia', 'aura', 'porta', 'gratia'];

  const filteredCards = SIGNATURES_DATA.filter(card => {
    if (filterFamily === 'all') return true;
    const members = CHARACTER_FAMILIES[filterFamily] || [];
    return members.includes(card.id);
  });

  const getSignalLabel = (sigKey) => {
    return t('ui', 'label_' + sigKey) || sigKey;
  };

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

  return (
    <AppShell isLanding={true}>
      <div style={{
        backgroundColor: '#F8E6D9',
        minHeight: '100vh',
        padding: '7.5rem 1.5rem 3rem 1.5rem',
        animation: 'fadeIn 0.5s ease'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center'
        }}>

          {/* Filter Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            width: 'fit-content',
            maxWidth: '100%',
            margin: '0 auto 3rem auto',
            padding: '10px 20px',
            background: 'rgba(11, 27, 44, 0.03)',
            borderRadius: '16px',
            border: '1px solid rgba(11, 27, 44, 0.05)'
          }}>
            {families.map(fam => {
              const isActive = filterFamily === fam;
              return (
                <button
                  key={fam}
                  onClick={() => setFilterFamily(fam)}
                  style={{
                    background: isActive ? 'var(--color-deep-ink)' : 'transparent',
                    border: 'none',
                    borderRadius: '10px',
                    color: isActive ? '#fff' : 'var(--color-text-muted)',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease'
                  }}
                >
                  {getFamilyLabel(fam)}
                </button>
              );
            })}
          </div>

          {/* Cards Grid */}
          <div className="identities-grid">
            {filteredCards.map(card => {
              const signature = getObject('signatures', card.id) || {
                name: card.id,
                oneLine: 'Awaiting signature calculation...'
              };
              const img = CARD_IMAGES[card.id];

              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className="editorial-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    transform: 'translateY(0)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(11, 27, 44, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  {/* Polaroid Image */}
                  <div style={{
                    width: '100%',
                    aspectRatio: '3 / 4',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundImage: img ? `url(${img})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    marginBottom: '1.25rem',
                    border: '1px solid rgba(11, 27, 44, 0.06)'
                  }}></div>


                  {/* Archetype Name */}
                  <h3 style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.35rem',
                    color: 'var(--color-deep-ink)',
                    margin: '0 0 0.5rem 0',
                    fontWeight: 700
                  }}>
                    {signature.name}
                  </h3>

                  {/* One Line Summary */}
                  <p style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.85rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: '1.5',
                    margin: 0,
                    textAlign: 'center',
                    opacity: 0.9
                  }}>
                    {signature.oneLine}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Luxury Detail Modal Overlay */}
      {selectedCard && (() => {
        const signature = getObject('signatures', selectedCard.id);
        const signatureName = signature ? signature.name : selectedCard.id;
        const signatureOneLine = signature ? signature.oneLine : "";
        const signatureCardLine = signature ? signature.cardLine : "";
        const img = CARD_IMAGES[selectedCard.id];

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(11, 27, 44, 0.4)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{
              backgroundColor: 'rgba(253, 251, 247, 0.98)',
              border: '1px solid rgba(11, 27, 44, 0.1)',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '800px',
              padding: '2.5rem',
              position: 'relative',
              boxShadow: '0 24px 64px rgba(11, 27, 44, 0.15)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2.5rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              animation: 'scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              boxSizing: 'border-box'
            }}>
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: 'rgba(11, 27, 44, 0.05)',
                  border: 'none',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  color: 'var(--color-deep-ink)',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  zIndex: 10
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(11, 27, 44, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(11, 27, 44, 0.05)'}
              >
                ✕
              </button>

              {/* Left Column: Polaroid Card Representation */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}>
                <div style={{
                  backgroundColor: '#fff',
                  border: '1px solid rgba(11, 27, 44, 0.08)',
                  padding: '12px',
                  boxShadow: '0 8px 30px rgba(11, 27, 44, 0.06)',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '320px',
                  boxSizing: 'border-box'
                }}>
                  <div style={{
                    width: '100%',
                    aspectRatio: '3 / 4',
                    backgroundImage: img ? `url(${img})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '8px',
                    border: '1px solid rgba(11, 27, 44, 0.04)'
                  }}></div>
                </div>
              </div>

              {/* Right Column: Descriptions & Detailed Content */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                textAlign: 'left'
              }}>
                {/* Section Subtitle */}
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: 'var(--color-burnt-coral)',
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  {t('ui', 'identities_analysis_title')}
                </span>

                {/* Main Title */}
                <h2 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '2.4rem',
                  color: 'var(--color-deep-ink)',
                  margin: '0 0 1rem 0',
                  fontWeight: '800',
                  letterSpacing: '-0.01em'
                }}>
                  {signatureName}
                </h2>

                {/* Subtitle intro line */}
                <h5 style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--color-deep-ink)',
                  margin: '0 0 1rem 0',
                  lineHeight: '1.4'
                }}>
                  {signatureOneLine}
                </h5>

                {/* Main Body detailed paragraph */}
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.95rem',
                  lineHeight: '1.65',
                  color: 'var(--color-text-muted)',
                  margin: 0
                }}>
                  {generateDetailedDescription(selectedCard.signals)}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .app-shell.landing-layout {
          background-image: none !important;
          background-color: #F8E6D9 !important;
        }
        .identities-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1.5rem;
          margin-bottom: 4rem;
        }
        @media (min-width: 480px) {
          .identities-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 768px) {
          .identities-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .identities-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </AppShell>
  );
}
