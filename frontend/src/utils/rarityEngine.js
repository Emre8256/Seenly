/**
 * Dynamic Card Rarity Tier System for Seenly
 * 4 Tiers (Pure typography and curated color focused):
 * 1. Yaygın (Common): Bottom 0% - 60% of distribution (Most frequent / Baseline)
 * 2. Seçkin (Elite): Top 60% - 85% of distribution (Above average / Distinct)
 * 3. Nadir (Rare): Top 85% - 96% of distribution (High tier / Exceptional)
 * 4. Eşsiz (Unique): Top 96% - 100% of distribution (Top 4% / Peak tier)
 * 
 * Clean, minimalist, luxury editorial aesthetic with no icons or symbols.
 */

export const RARITY_TIERS = {
  YAYGIN: {
    id: 'YAYGIN',
    trLabel: 'Yaygın',
    enLabel: 'Common',
    symbol: null,
    minPercentile: 0,
    maxPercentile: 60,
    badgeBg: '#F3F4F6',
    badgeText: '#4B5563',
    badgeBorder: 'rgba(209, 213, 219, 0.85)'
  },
  SECKIN: {
    id: 'SECKIN',
    trLabel: 'Seçkin',
    enLabel: 'Elite',
    symbol: null,
    minPercentile: 60,
    maxPercentile: 85,
    badgeBg: '#E0F2FE',
    badgeText: '#0369A1',
    badgeBorder: 'rgba(186, 230, 253, 0.95)'
  },
  NADIR: {
    id: 'NADIR',
    trLabel: 'Nadir',
    enLabel: 'Rare',
    symbol: null,
    minPercentile: 85,
    maxPercentile: 96,
    badgeBg: '#F3E8FF',
    badgeText: '#7E22CE',
    badgeBorder: 'rgba(233, 213, 255, 0.95)'
  },
  ESSIZ: {
    id: 'ESSIZ',
    trLabel: 'Eşsiz',
    enLabel: 'Unique',
    symbol: null,
    minPercentile: 96,
    maxPercentile: 100,
    badgeBg: '#FEF3C7',
    badgeText: '#B45309',
    badgeBorder: 'rgba(253, 230, 138, 0.95)'
  }
};

/**
 * Baseline statistical priors for all 45 archetypes
 */
const ARCHETYPE_PERCENTILE_PRIORS = {
  // Peak Tier: Eşsiz (Top 1% - 4%)
  the_elite_mind: 3,
  the_stoic_king: 3,
  the_ice_queen_king: 4,
  the_silent_king: 4,
  stratejik_mimar: 3,

  // High Tier: Nadir (Top 5% - 15%)
  the_visionary: 7,
  the_idealist: 8,
  the_aesthetic: 8,
  the_seductive_mind: 9,
  the_mastermind: 9,
  the_philosopher: 10,
  the_leader: 11,
  the_innovator: 12,
  the_star_player: 12,
  the_playmaker: 13,
  the_alpha_achiever: 14,
  durust_idealist: 8,
  derin_gozlemci: 7,
  estetik_vizyon: 8,
  yaratici_kaos: 14,

  // Above Average: Seçkin (Top 16% - 40%)
  the_magnet: 18,
  the_strategist: 21,
  the_mature_charm: 22,
  the_noble_heart: 24,
  the_intellectual_giver: 25,
  the_consultant: 26,
  the_philanthropist: 27,
  the_benevolent_guide: 28,
  the_powerhouse: 29,
  the_sweetheart: 30,
  the_safe_haven: 32,
  the_charming_anchor: 34,
  the_social_star: 35,
  the_gatekeeper: 36,
  the_pillar: 38,
  sessiz_lider: 22,
  sosyal_katalizor: 35,
  ozgur_kesifci: 18,

  // Baseline: Yaygın (Top 41% - 100%)
  the_ambitious_sweetheart: 42,
  the_showman: 43,
  the_party_host: 44,
  the_proud_friend: 45,
  the_dreamer: 46,
  the_proud_patron: 46,
  the_know_it_all: 47,
  the_empath: 48,
  the_protector: 49,
  the_life_giver: 50,
  the_patron: 51,
  the_golden_retriever: 52,
  the_calm_harbor: 54,
  the_steady_vibe: 56,
  the_helper: 58,
  empati_ustasi: 48,
  dogal_arabulucu: 54
};

/**
 * Calculates rarity tier configuration based on top percentile (e.g. 8 for Top 8%)
 */
export function getRarityFromTopPercentile(topPercentile = 50) {
  const rarityScore = 100 - topPercentile;
  if (rarityScore >= 96) return RARITY_TIERS.ESSIZ;
  if (rarityScore >= 85) return RARITY_TIERS.NADIR;
  if (rarityScore >= 60) return RARITY_TIERS.SECKIN;
  return RARITY_TIERS.YAYGIN;
}

/**
 * Returns dynamic rarity data for a card signature purely based on text and curated color.
 */
export function getCardRarityData(signatureId, dynamicApiData = null, langCode = 'tr') {
  let topPercentile = 48;
  let tierConfig = RARITY_TIERS.YAYGIN;

  if (dynamicApiData?.topPercentile) {
    topPercentile = dynamicApiData.topPercentile;
    tierConfig = getRarityFromTopPercentile(topPercentile);
  } else if (dynamicApiData?.tier && RARITY_TIERS[dynamicApiData.tier]) {
    tierConfig = RARITY_TIERS[dynamicApiData.tier];
  } else if (signatureId && ARCHETYPE_PERCENTILE_PRIORS[signatureId]) {
    topPercentile = ARCHETYPE_PERCENTILE_PRIORS[signatureId];
    tierConfig = getRarityFromTopPercentile(topPercentile);
  } else if (signatureId) {
    const hash = Math.abs(signatureId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
    topPercentile = (hash % 55) + 5;
    tierConfig = getRarityFromTopPercentile(topPercentile);
  }

  const tierKey = `common.rarity.${tierConfig.id.toLowerCase()}`;
  const badgeLabel = typeof langCode === 'function' ? langCode(tierKey) : (langCode === 'en' ? tierConfig.enLabel : tierConfig.trLabel);

  return {
    ...tierConfig,
    tierKey,
    topPercentile,
    badgeLabel,
    hasSymbol: false,
    symbol: null
  };
}
