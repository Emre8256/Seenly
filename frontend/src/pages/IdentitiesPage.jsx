import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';
import { IntersectingCircles } from '../components/marks';
import { fetchAllCardRarities } from '../services/api';

import { SIGNATURES_DATA, CHARACTER_FAMILIES } from './identities/identitiesData';
import IdentitiesFilterBar from './identities/IdentitiesFilterBar';
import IdentitiesCardGrid from './identities/IdentitiesCardGrid';
import IdentityDetailModal from './identities/IdentityDetailModal';
import './identities/IdentitiesPage.css';

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

  const handleStartQuiz = useCallback(() => {
    sessionStorage.setItem('seenly_currentIndex', '-2');
    sessionStorage.setItem('seenly_isQuickLogin', 'false');
    window.dispatchEvent(new CustomEvent('seenly_trigger_start_quiz'));
    window.location.hash = '#/';
  }, []);

  const filteredCards = useMemo(() => {
    return SIGNATURES_DATA.filter(card => {
      if (filterFamily !== 'all') {
        const members = CHARACTER_FAMILIES[filterFamily] || [];
        if (!members.includes(card.id)) return false;
      }

      const query = searchQuery.toLocaleLowerCase(langCode).trim();
      if (!query) return true;

      const signature = getObject('signatures', card.id) || { name: card.id };
      const name = (signature.name || '').toLocaleLowerCase(langCode);
      const oneLine = (signature.oneLine || '').toLocaleLowerCase(langCode);

      return name.includes(query) || oneLine.includes(query) || card.id.toLowerCase().includes(query);
    });
  }, [filterFamily, searchQuery, getObject, langCode]);

  const getFamilyLabel = useCallback((famKey) => {
    if (famKey === 'all') return t('ui', 'identities_filter_all') || 'Hepsi';
    return t('ui', 'family_' + famKey) || famKey;
  }, [t]);

  const generateDetailedDescription = useCallback((signals) => {
    const s1 = signals[0];
    const s2 = signals[1];
    const d1 = t('ui', 'desc_' + s1) || '';
    const d2 = t('ui', 'desc_' + s2) || '';
    const template = t('ui', 'identities_desc_template') || '';
    return template.replace('{d1}', d1).replace('{d2}', d2);
  }, [t]);

  return (
    <AppShell isDashboard={false} fullWidth={true} watercolorBackground>
      <div className="identities-gallery relative z-10">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 relative z-10">

          {/* Header Intro */}
          <div className="identities-intro">
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

          {/* Search & Filter Bar */}
          <IdentitiesFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterFamily={filterFamily}
            setFilterFamily={setFilterFamily}
            getFamilyLabel={getFamilyLabel}
            langCode={langCode}
            t={t}
          />

          {/* Cards Grid */}
          <IdentitiesCardGrid
            filteredCards={filteredCards}
            filterFamily={filterFamily}
            getFamilyLabel={getFamilyLabel}
            onReset={() => { setSearchQuery(''); setFilterFamily('all'); }}
            apiRarities={apiRarities}
            langCode={langCode}
            getObject={getObject}
            setSelectedCard={setSelectedCard}
            t={t}
          />
        </div>
      </div>

      {/* Detail Modal */}
      <IdentityDetailModal
        selectedCard={selectedCard}
        setSelectedCard={setSelectedCard}
        apiRarities={apiRarities}
        getFamilyLabel={getFamilyLabel}
        generateDetailedDescription={generateDetailedDescription}
        handleStartQuiz={handleStartQuiz}
        getObject={getObject}
        langCode={langCode}
        t={t}
      />
    </AppShell>
  );
}
