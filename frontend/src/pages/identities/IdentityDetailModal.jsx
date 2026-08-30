import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import { CARD_IMAGES } from '../../images/cardImages';
import { WatercolorStain, ConnectorDots } from '../../components/marks';
import { getCardRarityData } from '../../utils/rarityEngine';
import { CHARACTER_FAMILIES } from './identitiesData';

const IdentityDetailModal = memo(function IdentityDetailModal({
  selectedCard,
  setSelectedCard,
  apiRarities,
  getFamilyLabel,
  generateDetailedDescription,
  handleStartQuiz,
  getObject,
  langCode,
  t
}) {
  if (!selectedCard) return null;

  const signature = getObject('signatures', selectedCard.id);
  const signatureName = signature ? signature.name : selectedCard.id;
  const signatureOneLine = signature ? signature.oneLine : "";
  const img = CARD_IMAGES[selectedCard.id];

  const cardFamily = Object.keys(CHARACTER_FAMILIES).find(
    fam => CHARACTER_FAMILIES[fam].includes(selectedCard.id)
  ) || 'stratega';

  const modalRarity = getCardRarityData(selectedCard.id, apiRarities[selectedCard.id], langCode);

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
});

export default IdentityDetailModal;
