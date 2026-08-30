import React, { useState, useEffect, useCallback } from 'react';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';
import { getPublicDashboard, incrementProfileClick, checkEligibility, getBrowserFingerprint } from '../services/api';
import { CARD_IMAGES } from '../images/cardImages';
import { getCardRarityData } from '../utils/rarityEngine';
import { calibrateTraitScore } from '../utils/psychometrics';
import { useSeenlyShare, buildWhatsAppLink } from '../hooks/useSeenlyShare';

import FriendIntroStep from './friend-quiz/FriendIntroStep';
import './friend-quiz/FriendQuizPage.css';

const SIGNATURE_IMAGES = CARD_IMAGES;

export default function FriendIntroPage({ slug, onStart }) {
  const { locale: langCode, t, getObject } = useLocale();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const { handleInstagramStory, isGenerating } = useSeenlyShare();

  useEffect(() => {
    if (!slug) {
      setError('Slug is missing.');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      incrementProfileClick(slug);
      try {
        const data = await getPublicDashboard(slug);
        setSnapshot(data);

        // Check eligibility with backend (spam and self-evaluation)
        const fingerprint = getBrowserFingerprint();
        const eligibility = await checkEligibility(slug, fingerprint);
        if (eligibility && eligibility.eligible === false) {
          setHasEvaluated(true);
          try {
            const evaluatedStr = localStorage.getItem('seenly_evaluated_slugs');
            let evaluatedSlugs = [];
            if (evaluatedStr) evaluatedSlugs = JSON.parse(evaluatedStr);
            if (!evaluatedSlugs.includes(slug)) {
              evaluatedSlugs.push(slug);
              localStorage.setItem('seenly_evaluated_slugs', JSON.stringify(evaluatedSlugs));
            }
          } catch (e) { /* ignore */ }
        }
      } catch (err) {
        setError(err.message || 'Error loading dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  const handleStart = useCallback(() => {
    onStart('');
  }, [onStart]);

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

  const get10Signals = useCallback((lang) => {
    const serverAverages = snapshot?.friendAverages || {};

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
      let val = serverAverages[d.key];

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
  }, [snapshot?.friendAverages]);

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

  const responseCount = snapshot?.responseCount || 0;
  const isPremium = snapshot?.isPremium || snapshot?.premium || false;
  const maxResponseLimit = snapshot?.maxResponseLimit ?? 100;
  const isCapped = !isPremium && (responseCount >= maxResponseLimit);
  const isLoggedIn = !!localStorage.getItem('seenly_owner_token');

  const activeOutsideSignatureId = calculatePersonalityCard(snapshot?.friendAverages || {});
  const outsideSignature = getObject('signatures', activeOutsideSignatureId);
  const outsideSignatureName = outsideSignature ? outsideSignature.name : t('ui', 'missing_id_fallback');
  const outsideSignatureCardLine = outsideSignature ? outsideSignature.cardLine : "";
  const outsideRarity = getCardRarityData(activeOutsideSignatureId, langCode);

  const getDashboardWhatsAppLink = (cardName) =>
    buildWhatsAppLink(cardName, slug);

  const handleDashboardInstagramStory = (cardName, illustrationSrc) => {
    handleInstagramStory(cardName, illustrationSrc, slug, langCode);
  };

  return (
    <AppShell isDashboard={true} showLogout={false}>
      <FriendIntroStep
        slug={slug}
        snapshot={snapshot}
        hasEvaluated={hasEvaluated}
        isCapped={isCapped}
        handleStart={handleStart}
        langCode={langCode}
        t={t}
        outsideSignatureName={outsideSignatureName}
        outsideSignatureCardLine={outsideSignatureCardLine}
        outsideRarity={outsideRarity}
        activeOutsideSignatureId={activeOutsideSignatureId}
        SIGNATURE_IMAGES={SIGNATURE_IMAGES}
        getDashboardWhatsAppLink={getDashboardWhatsAppLink}
        handleDashboardInstagramStory={handleDashboardInstagramStory}
        isGenerating={isGenerating}
        get10Signals={get10Signals}
        isLoggedIn={isLoggedIn}
      />
    </AppShell>
  );
}
