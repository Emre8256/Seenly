import React, { memo } from 'react';
import { CARD_IMAGES } from '../../images/cardImages';
import { getCardRarityData } from '../../utils/rarityEngine';

const IdentityCardItem = memo(function IdentityCardItem({
  card,
  signature,
  img,
  rarity,
  onSelect
}) {
  return (
    <article
      onClick={() => onSelect(card)}
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
            loading="lazy"
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
});

const IdentitiesCardGrid = memo(function IdentitiesCardGrid({
  filteredCards,
  apiRarities,
  langCode,
  getObject,
  setSelectedCard,
  t
}) {
  if (filteredCards.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <p className="font-serif italic text-lg text-muted-foreground">
          {t('ui', 'identities_no_results') || 'Aradığınız kriterlere uygun sosyal kimlik bulunamadı.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:gap-6 md:gap-7 lg:grid-cols-4 animate-fade-in">
      {filteredCards.map((card) => {
        const signature = getObject('signatures', card.id) || {
          name: card.id,
          oneLine: 'Awaiting signature calculation...'
        };
        const img = CARD_IMAGES[card.id];
        const rarity = getCardRarityData(card.id, apiRarities[card.id], langCode);

        return (
          <IdentityCardItem
            key={card.id}
            card={card}
            signature={signature}
            img={img}
            rarity={rarity}
            onSelect={setSelectedCard}
          />
        );
      })}
    </div>
  );
});

export default IdentitiesCardGrid;
