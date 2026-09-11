import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocale } from '../context/LocaleContext';
import { submitFriendResponse, getBrowserFingerprint } from '../services/api';
import FriendQuestionsRunner from './friend-quiz/FriendQuestionsRunner';
import './friend-quiz/FriendQuizPage.css';

const FRIEND_QUESTION_IDS = [
  "classic_friend_samimiyet_01",
  "classic_friend_cekicilik_01",
  "classic_friend_zeka_01",
  "classic_friend_vizyon_01",
  "classic_friend_enerji_01",
  "classic_friend_guvenilirlik_01",
  "classic_friend_ego_01",
  "classic_friend_basari_01",
  "classic_friend_comertlik_01",
  "classic_friend_olgunluk_01"
];

export default function FriendQuizPage({ slug, nickname: initialNickname, onComplete }) {
  const { locale, setLocale, t } = useLocale();

  const SUPPORTED_LANGS = [
    { code: 'tr', label: 'Türkçe' },
    { code: 'en', label: 'English' },
  ];

  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  useEffect(() => {
    if (!langOpen) return;
    const handleOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [langOpen]);

  const handleLangToggle = useCallback((code) => {
    setLocale(code);
    setLangOpen(false);
  }, [setLocale]);

  // Load or initialize state from sessionStorage
  const [state, setState] = useState(() => {
    try {
      const saved = sessionStorage.getItem('seenly_friend_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          return {
            nickname: parsed.nickname !== undefined ? parsed.nickname : (initialNickname || ''),
            currentIndex: typeof parsed.currentIndex === 'number' ? parsed.currentIndex : 0,
            answers: parsed.answers || {},
            timeAnalytics: parsed.timeAnalytics || {}
          };
        }
      }
    } catch (e) {
      // Ignore
    }
    return {
      nickname: initialNickname || '',
      currentIndex: 0,
      answers: {},
      timeAnalytics: {}
    };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Ref to track entry time for the current question
  const entryTimeRef = useRef(Date.now());

  useEffect(() => {
    entryTimeRef.current = Date.now();
  }, [state.currentIndex]);

  useEffect(() => {
    sessionStorage.setItem('seenly_friend_state', JSON.stringify(state));
  }, [state]);

  const handleSelectOption = useCallback((value) => {
    const questionId = FRIEND_QUESTION_IDS[state.currentIndex];
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value }
    }));
  }, [state.currentIndex]);

  const handleSubmit = useCallback(async (finalAnswers, finalTimeAnalytics) => {
    setIsSubmitting(true);
    setErrorMessage('');

    const responsesPayload = FRIEND_QUESTION_IDS.map(qId => ({
      questionId: qId,
      answerValue: finalAnswers[qId] || 3
    }));

    try {
      const fingerprint = getBrowserFingerprint();
      const result = await submitFriendResponse(
        slug,
        state.nickname || '',
        fingerprint,
        responsesPayload,
        finalTimeAnalytics
      );

      try {
        const evaluatedStr = localStorage.getItem('seenly_evaluated_slugs');
        let evaluatedSlugs = [];
        if (evaluatedStr) evaluatedSlugs = JSON.parse(evaluatedStr);
        if (!evaluatedSlugs.includes(slug)) {
          evaluatedSlugs.push(slug);
          localStorage.setItem('seenly_evaluated_slugs', JSON.stringify(evaluatedSlugs));
        }
      } catch (e) { /* ignore */ }

      sessionStorage.setItem('seenly_friend_result', JSON.stringify(result));
      sessionStorage.removeItem('seenly_friend_state');

      if (onComplete) {
        onComplete(result);
      }
    } catch (err) {
      setErrorMessage(err.message || t('errors.generic'));
      setIsSubmitting(false);
    }
  }, [slug, state.nickname, onComplete, t]);

  const handleNext = useCallback(() => {
    const questionId = FRIEND_QUESTION_IDS[state.currentIndex];
    if (state.answers[questionId] === undefined) return;

    const signal = questionId.split('_')[2];
    const elapsed = Date.now() - entryTimeRef.current;
    const updatedTimeAnalytics = {
      ...(state.timeAnalytics || {}),
      [signal]: (state.timeAnalytics?.[signal] || 0) + elapsed
    };

    if (state.currentIndex < FRIEND_QUESTION_IDS.length - 1) {
      setState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        timeAnalytics: updatedTimeAnalytics
      }));
      entryTimeRef.current = Date.now();
    } else {
      handleSubmit(state.answers, updatedTimeAnalytics);
    }
  }, [state.currentIndex, state.answers, state.timeAnalytics, handleSubmit]);

  const handleGoBack = useCallback(() => {
    const questionId = FRIEND_QUESTION_IDS[state.currentIndex];
    const signal = questionId.split('_')[2];
    const elapsed = Date.now() - entryTimeRef.current;
    const updatedTimeAnalytics = {
      ...(state.timeAnalytics || {}),
      [signal]: (state.timeAnalytics?.[signal] || 0) + elapsed
    };

    if (state.currentIndex > 0) {
      setState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex - 1,
        timeAnalytics: updatedTimeAnalytics
      }));
      entryTimeRef.current = Date.now();
    } else {
      window.location.hash = `#/friend/${slug}`;
    }
  }, [state.currentIndex, state.timeAnalytics, slug]);

  const progressPercentage = ((state.currentIndex + 1) / FRIEND_QUESTION_IDS.length) * 100;

  if (isSubmitting) {
    return (
      <div className="seenly-wizard-wrapper">
        <div className="seenly-wizard-container">
          <div className="seenly-wizard-body" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: '400', marginBottom: '1.5rem', color: 'var(--color-deep-ink)' }}>
              {t('participant.quiz.submittingTitle')}
            </h2>
            <div style={{
              width: '100%',
              maxWidth: '200px',
              height: '3px',
              backgroundColor: 'rgba(11, 27, 44, 0.06)',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '1.5px'
            }}>
              <div style={{
                position: 'absolute',
                width: '50%',
                height: '100%',
                backgroundColor: 'var(--color-smoky-lavender)',
                animation: 'loadingProgress 1.5s infinite ease-in-out',
                borderRadius: '1.5px'
              }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="seenly-wizard-wrapper">
      <div className="seenly-wizard-container">
        {/* Wizard Header */}
        <header className="seenly-wizard-header">
          <button
            type="button"
            className="seenly-wizard-back-btn"
            onClick={handleGoBack}
            aria-label={t('accessibility.goBack')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div className="seenly-wizard-progress-track">
            <div
              className="seenly-wizard-progress-bar"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="seenly-wizard-step-lang" ref={langRef}>
            <button
              type="button"
              className="lang-dropdown-trigger"
              onClick={() => setLangOpen(prev => !prev)}
              aria-label={t('accessibility.selectLanguage')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>{locale.toUpperCase()}</span>
              <svg className={`lang-dropdown-chevron ${langOpen ? 'open' : ''}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {langOpen && (
              <div className="lang-dropdown-menu">
                {SUPPORTED_LANGS.map(lang => (
                  <button
                    key={lang.code}
                    type="button"
                    className={`lang-dropdown-item ${locale === lang.code ? 'active' : ''}`}
                    onClick={() => handleLangToggle(lang.code)}
                  >
                    <span className="lang-dropdown-code">{lang.code.toUpperCase()}</span>
                    <span>{lang.label}</span>
                    {locale === lang.code && (
                      <svg className="lang-dropdown-check" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {errorMessage && (
          <div style={{ padding: '0 2rem' }}>
            <div className="editorial-card" style={{ borderColor: 'red', color: 'red', padding: '1rem', margin: 0 }}>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Wizard Body */}
        <div className="seenly-wizard-body">
          <FriendQuestionsRunner
            currentIndex={state.currentIndex}
            friendQuestionIds={FRIEND_QUESTION_IDS}
            answers={state.answers}
            handleSelectOption={handleSelectOption}
            handleNext={handleNext}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}
