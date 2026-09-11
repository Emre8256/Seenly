import React, { useEffect, useState, useCallback } from 'react';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';
import { useSeenlyShare, buildWhatsAppLink } from '../hooks/useSeenlyShare';
import { calibrateAccuracyScore } from '../utils/psychometrics';

import dengeliGozlemci from '../images/readers/Dengeli Gözlemci.avif';
import netOkuyucu from '../images/readers/Net Okuyucu.avif';
import sosyalYabanci from '../images/readers/Sosyal Yabancı.avif';
import telepatikOkuyucu from '../images/readers/Telepatik Okuyucu.avif';
import yuzeyselKasif from '../images/readers/Yüzeysel Kaşif.avif';

import FriendResultPreview from './friend-quiz/FriendResultPreview';
import './friend-quiz/FriendQuizPage.css';

const READER_CARD_IMAGES = {
  balanced_reader: dengeliGozlemci,
  clear_reader: netOkuyucu,
  social_stranger: sosyalYabanci,
  telepathic_reader: telepatikOkuyucu,
  casual_explorer: yuzeyselKasif
};

export default function FriendResultPage({ slug, onNavigateToQuiz }) {
  const { locale: langCode, t, getObject } = useLocale();
  const [result, setResult] = useState(null);
  const { handleInstagramStory, isGenerating } = useSeenlyShare();

  const _slug = slug || result?.publicSlug || '';

  const getWhatsAppShareLink = useCallback((cardName) =>
    buildWhatsAppLink(cardName, _slug, t), [_slug, t]);

  const handleInstagramShare = useCallback((cardName, illustrationSrc) => {
    handleInstagramStory(cardName, illustrationSrc, _slug, langCode);
  }, [_slug, langCode, handleInstagramStory]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('seenly_friend_result');
      if (saved) {
        setResult(JSON.parse(saved));
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  const isLoggedIn = !!(localStorage.getItem('seenly_owner_token'));

  const handleStartOwn = useCallback(() => {
    sessionStorage.removeItem('seenly_friend_result');
    if (onNavigateToQuiz) {
      onNavigateToQuiz();
    }
  }, [onNavigateToQuiz]);

  const handleGoToDashboard = useCallback(() => {
    window.location.hash = '#/';
  }, []);

  const styleId = result?.readerStyleId || 'clear_reader';
  const rawAccuracy = typeof result?.accuracy === 'number' ? result.accuracy : 75.0;
  const accuracy = calibrateAccuracyScore(rawAccuracy);
  const [accuracyOffset, setAccuracyOffset] = useState(2 * Math.PI * 48);

  useEffect(() => {
    const timer = setTimeout(() => {
      const circumference = 2 * Math.PI * 48;
      const targetOffset = circumference * (1 - Math.max(0, Math.min(100, accuracy)) / 100);
      setAccuracyOffset(targetOffset);
    }, 150);
    return () => clearTimeout(timer);
  }, [accuracy]);

  const styleObj = getObject('readerStyles', styleId) || {
    name: styleId,
    oneLine: ''
  };

  return (
    <AppShell isDashboard={true} watercolorBackground footerMode="simple">
      <div className="seenly-dashboard-page-wrapper py-6 sm:py-10">
        <FriendResultPreview
          styleId={styleId}
          styleObj={styleObj}
          accuracy={accuracy}
          accuracyOffset={accuracyOffset}
          READER_CARD_IMAGES={READER_CARD_IMAGES}
          getWhatsAppShareLink={getWhatsAppShareLink}
          handleInstagramShare={handleInstagramShare}
          isGenerating={isGenerating}
          handleStartOwn={handleStartOwn}
          handleGoToDashboard={handleGoToDashboard}
          isLoggedIn={isLoggedIn}
          langCode={langCode}
          t={t}
        />
      </div>
    </AppShell>
  );
}
