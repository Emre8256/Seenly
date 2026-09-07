import React, { memo } from 'react';
import { CARD_IMAGES } from '../../images/cardImages';
import { getCardRarityData } from '../../utils/rarityEngine';
import { CHARACTER_FAMILIES } from './identitiesData';

export default memo(function IdentitiesCardGrid({
  filteredCards, apiRarities, langCode, getObject, setSelectedCard,
  filterFamily, getFamilyLabel, onReset
}) {
  const tr = langCode === 'tr';
  const browsing = filterFamily === 'all';
  const groups = browsing
    ? Object.entries(CHARACTER_FAMILIES).map(([family, ids]) => ({
        family, cards: filteredCards.filter(card => ids.includes(card.id))
      })).filter(group => group.cards.length > 0)
    : [{ family: filterFamily, cards: filteredCards }];
  return (
    <div className="identities-collections">
      {filteredCards.length === 0 ? <div className="identities-empty">
        <h2>{tr ? 'Henüz bir eşleşme yok' : 'No matches yet'}</h2>
        <p>{tr ? 'Başka bir isim deneyebilir veya filtreleri temizleyebilirsin.' : 'Try another name or clear your filters.'}</p>
        <button type="button" onClick={onReset}>{tr ? 'Filtreleri temizle' : 'Clear filters'}</button>
      </div> : groups.map(({ family, cards }) => (
        <section className="identities-collection" key={family} aria-labelledby={browsing ? 'collection-' + family : undefined} aria-label={browsing ? undefined : getFamilyLabel(family)}>
          {browsing && <header className="identities-collection-heading">
            <div>
              <h2 id={'collection-' + family}>{getFamilyLabel(family)}</h2>
            </div>
          </header>}
          <div className="identities-card-grid">
            {cards.map(card => {
              const signature = getObject('signatures', card.id) || { name: card.id };
              const rarity = getCardRarityData(card.id, apiRarities[card.id], langCode);
              return <button type="button" className="identity-gallery-card" key={card.id} onClick={() => setSelectedCard(card)} aria-label={signature.name}>
                <span className="identity-gallery-art">
                  <img src={CARD_IMAGES[card.id]} alt="" loading="lazy" decoding="async" width="400" height="500" />
                  <span className="identity-gallery-rarity" style={{ background: rarity.badgeBg, color: rarity.badgeText, borderColor: rarity.badgeBorder }}>{rarity.badgeLabel}</span>
                </span>
                <span className="identity-gallery-caption">
                  <span className="identity-gallery-name">{signature.name}</span>
                  <span className="identity-gallery-description">{signature.oneLine || signature.cardLine}</span>
                </span>
              </button>;
            })}
          </div>
        </section>
      ))}
    </div>
  );
});
