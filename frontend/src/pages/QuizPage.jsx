import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocale } from '../context/LocaleContext';
import LandingPage from '../components/LandingPage';
import { createSeenly, sendVerificationCode, verifyCode, loginWithEmail, updateAvatar } from '../services/api';
import { AVATARS } from '../images/avatars';
import { CARD_IMAGES } from '../images/cardImages';
import { getCardRarityData } from '../utils/rarityEngine';

import QuizLanguageDropdown from './quiz/QuizLanguageDropdown';
import QuizOnboardingStep from './quiz/QuizOnboardingStep';
import QuizQuestionsRunner from './quiz/QuizQuestionsRunner';
import QuizSelfResultCard from './quiz/QuizSelfResultCard';
import QuizAuthClaimModal from './quiz/QuizAuthClaimModal';
import './quiz/QuizPage.css';

const SIGNATURE_IMAGES = CARD_IMAGES;

const SELF_QUESTION_IDS = [
  "classic_self_samimiyet_01",
  "classic_self_cekicilik_01",
  "classic_self_zeka_01",
  "classic_self_vizyon_01",
  "classic_self_enerji_01",
  "classic_self_guvenilirlik_01",
  "classic_self_ego_01",
  "classic_self_basari_01",
  "classic_self_comertlik_01",
  "classic_self_olgunluk_01"
];

const calculatePersonalityCard = (answersOrScores) => {
  let data = answersOrScores;
  if (!data || Object.keys(data).length === 0) {
    try {
      data = JSON.parse(sessionStorage.getItem('seenly_answers') || '{}');
    } catch (e) {
      data = {};
    }
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
    const val = data[key];
    if (val === undefined || val === null) {
      const qKey = `classic_self_${key}_01`;
      if (data[qKey] !== undefined) {
        const num = Number(data[qKey]);
        return ((num - 1) / 4) * 100;
      }
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
};

export default function QuizPage({ onComplete }) {
  const { locale, setLocale, t, getObject } = useLocale();
  const langCode = locale;
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

  // Session Storage State Restoration
  const [displayName, setDisplayName] = useState(() => {
    return sessionStorage.getItem('seenly_displayName') || '';
  });

  const [email, setEmail] = useState(() => {
    return sessionStorage.getItem('seenly_email') || '';
  });

  const isValidEmail = useCallback((emailStr) => {
    if (!emailStr || typeof emailStr !== 'string') return false;
    const trimmed = emailStr.trim();
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(trimmed);
  }, []);

  const [emailValidationError, setEmailValidationError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const formatTimer = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const [verificationCode, setVerificationCode] = useState(Array(4).fill(''));
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef([]);

  // Post-quiz verification flow state
  const [postQuizOtp, setPostQuizOtp] = useState(Array(4).fill(''));
  const postQuizOtpRefs = useRef([]);
  const [authFlowNotification, setAuthFlowNotification] = useState({ message: '', status: '' });

  const [answers, setAnswers] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('seenly_answers')) || {};
    } catch (e) {
      return {};
    }
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    return Number(sessionStorage.getItem('seenly_currentIndex') || -1);
  });

  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    return sessionStorage.getItem('seenly_avatar') || localStorage.getItem('seenly_avatar') || 'kadin1';
  });
  const [avatarFilter, setAvatarFilter] = useState('all');
  const filteredAvatars = useMemo(() => {
    return AVATARS.filter(av => (avatarFilter === 'all' ? true : av.gender === avatarFilter));
  }, [avatarFilter]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [quizResult, setQuizResult] = useState(null);

  const [isQuickLogin, setIsQuickLogin] = useState(() => {
    return sessionStorage.getItem('seenly_isQuickLogin') === 'true';
  });

  const resetOnboardingState = useCallback(() => {
    setDisplayName('');
    setEmail('');
    setAnswers({});
    setSelectedAvatar('kadin1');
    setAvatarFilter('all');
    setVerificationCode(Array(4).fill(''));
    setPostQuizOtp(Array(4).fill(''));
    setAuthFlowNotification({ message: '', status: '' });
    setEmailValidationError('');
    setErrorMessage('');
    setResendTimer(0);
    setIsQuickLogin(false);

    sessionStorage.removeItem('seenly_displayName');
    sessionStorage.removeItem('seenly_email');
    sessionStorage.removeItem('seenly_answers');
    sessionStorage.removeItem('seenly_avatar');
    sessionStorage.removeItem('seenly_currentIndex');
    sessionStorage.removeItem('seenly_isQuickLogin');
    localStorage.removeItem('seenly_is_premium');
    localStorage.removeItem('seenly_test_limit');
  }, []);

  useEffect(() => {
    sessionStorage.setItem('seenly_isQuickLogin', isQuickLogin ? 'true' : 'false');
  }, [isQuickLogin]);

  useEffect(() => {
    const handleTriggerLogin = () => {
      resetOnboardingState();
      setIsQuickLogin(true);
      setCurrentIndex(-5);
    };
    const handleTriggerStartQuiz = () => {
      resetOnboardingState();
      setIsQuickLogin(false);
      setCurrentIndex(-2);
    };
    window.addEventListener('seenly_trigger_login', handleTriggerLogin);
    window.addEventListener('seenly_trigger_start_quiz', handleTriggerStartQuiz);
    return () => {
      window.removeEventListener('seenly_trigger_login', handleTriggerLogin);
      window.removeEventListener('seenly_trigger_start_quiz', handleTriggerStartQuiz);
    };
  }, [resetOnboardingState]);

  useEffect(() => {
    const handleScrollToHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const targetId = hash.replace(/^#/, '').replace(/^\//, '');
        if (targetId && targetId !== 'plans' && targetId !== 'faq' && targetId !== 'identities' && targetId !== 'dashboard') {
          const element = document.getElementById(targetId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    };

    const timer = setTimeout(handleScrollToHash, 200);
    window.addEventListener('hashchange', handleScrollToHash);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('hashchange', handleScrollToHash);
    };
  }, []);

  useEffect(() => {
    sessionStorage.setItem('seenly_displayName', displayName);
  }, [displayName]);

  useEffect(() => {
    sessionStorage.setItem('seenly_email', email);
  }, [email]);

  useEffect(() => {
    sessionStorage.setItem('seenly_answers', JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    sessionStorage.setItem('seenly_currentIndex', currentIndex.toString());
  }, [currentIndex]);

  useEffect(() => {
    if (currentIndex === -1) {
      resetOnboardingState();
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [currentIndex, resetOnboardingState]);

  useEffect(() => {
    setErrorMessage('');
  }, [currentIndex]);

  const handleGoBack = useCallback(() => {
    if (quizResult) {
      if (onComplete) onComplete(quizResult.ownerToken);
      return;
    }
    if (currentIndex === 0) {
      setCurrentIndex(-4);
    } else if (currentIndex === -4) {
      setCurrentIndex(-2);
    } else if (currentIndex === -2) {
      resetOnboardingState();
      setCurrentIndex(-1);
    } else if (currentIndex === -6) {
      setCurrentIndex(-5);
    } else if (currentIndex === -5) {
      resetOnboardingState();
      setCurrentIndex(-1);
    } else if (currentIndex === -9) {
      setCurrentIndex(SELF_QUESTION_IDS.length - 1);
    } else if (currentIndex === -10) {
      setCurrentIndex(-9);
    } else if (currentIndex === -11) {
      setCurrentIndex(-10);
    } else if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [quizResult, onComplete, currentIndex, resetOnboardingState]);

  const handleSubmitQuiz = useCallback(async (bypassFullscreen = false) => {
    if (!bypassFullscreen) {
      setIsSubmitting(true);
    }
    setErrorMessage('');

    const selfAnswersPayload = SELF_QUESTION_IDS.map(qId => ({
      questionId: qId,
      answerValue: answers[qId] || 3
    }));

    try {
      const response = await createSeenly(displayName, email.trim(), selfAnswersPayload);

      localStorage.setItem('seenly_owner_token', response.ownerToken);
      if (response.publicSlug) {
        localStorage.setItem('seenly_owner_slug', response.publicSlug);
      }

      localStorage.removeItem('seenly_is_premium');
      localStorage.removeItem('seenly_test_limit');

      const avatarToSave = selectedAvatar || sessionStorage.getItem('seenly_avatar') || 'kadin1';
      localStorage.setItem('seenly_avatar', avatarToSave);
      if (response.ownerToken) {
        try {
          await updateAvatar(response.ownerToken, avatarToSave);
        } catch (avatarErr) {
          console.warn('Avatar save on quiz submit failed', avatarErr);
        }
      }

      sessionStorage.removeItem('seenly_displayName');
      sessionStorage.removeItem('seenly_email');
      sessionStorage.removeItem('seenly_answers');
      sessionStorage.removeItem('seenly_avatar');
      sessionStorage.removeItem('seenly_currentIndex');
      sessionStorage.removeItem('seenly_selectedLang');

      setQuizResult(response);
      if (!bypassFullscreen) {
        setIsSubmitting(false);
      }
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred during submission.');
      if (!bypassFullscreen) {
        setIsSubmitting(false);
      }
      throw err;
    }
  }, [answers, displayName, email, selectedAvatar]);

  const handleSendCode = useCallback(async () => {
    if (resendTimer > 0) return;
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setEmailValidationError(t('ui', 'email_invalid_error') || 'Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }
    setEmailValidationError('');
    setIsEmailSending(true);
    setErrorMessage('');
    try {
      await sendVerificationCode(trimmedEmail, isQuickLogin);
      setVerificationCode(Array(4).fill(''));
      setResendTimer(60);
      setCurrentIndex(-6);
    } catch (err) {
      setErrorMessage(err.message || 'Error sending verification code.');
    } finally {
      setIsEmailSending(false);
    }
  }, [resendTimer, email, isValidEmail, t, isQuickLogin]);

  const handleCodeDigitChange = useCallback((element, index) => {
    const val = element.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const newCode = [...verificationCode];
    newCode[index] = val ? val.substring(val.length - 1) : '';
    setVerificationCode(newCode);

    if (val && index < 3 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  }, [verificationCode]);

  const handleCodeKeyDown = useCallback((e, index) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  }, [verificationCode]);

  const handleCodePaste = useCallback((e) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData('text').replace(/[^A-Za-z0-9]/g, '').toUpperCase().substring(0, 4);
    if (pasteText.length === 4) {
      const digits = pasteText.split('');
      setVerificationCode(digits);
      if (inputRefs.current[3]) {
        inputRefs.current[3].focus();
      }
    }
  }, []);

  const handleVerifyCode = useCallback(async () => {
    setIsVerifying(true);
    setErrorMessage('');
    const fullCode = verificationCode.join('');
    try {
      if (isQuickLogin) {
        const response = await loginWithEmail(email, fullCode);
        localStorage.setItem('seenly_owner_token', response.ownerToken);
        if (response.publicSlug) {
          localStorage.setItem('seenly_owner_slug', response.publicSlug);
        }

        sessionStorage.removeItem('seenly_displayName');
        sessionStorage.removeItem('seenly_email');
        sessionStorage.removeItem('seenly_answers');
        sessionStorage.removeItem('seenly_currentIndex');
        sessionStorage.removeItem('seenly_selectedLang');

        if (onComplete) {
          onComplete(response.ownerToken);
        }
      } else {
        await verifyCode(email, fullCode);
        setCurrentIndex(-2);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error verifying code.');
    } finally {
      setIsVerifying(false);
    }
  }, [verificationCode, isQuickLogin, email, onComplete]);

  const handlePostQuizOtpDigitChange = useCallback((element, index) => {
    const val = element.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const newCode = [...postQuizOtp];
    newCode[index] = val ? val.substring(val.length - 1) : '';
    setPostQuizOtp(newCode);

    if (val && index < 3 && postQuizOtpRefs.current[index + 1]) {
      postQuizOtpRefs.current[index + 1].focus();
    }
  }, [postQuizOtp]);

  const handlePostQuizOtpKeyDown = useCallback((e, index) => {
    if (e.key === 'Backspace' && !postQuizOtp[index] && index > 0 && postQuizOtpRefs.current[index - 1]) {
      postQuizOtpRefs.current[index - 1].focus();
    }
  }, [postQuizOtp]);

  const handlePostQuizOtpPaste = useCallback((e) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData('text').replace(/[^A-Za-z0-9]/g, '').toUpperCase().substring(0, 4);
    if (pasteText.length === 4) {
      const digits = pasteText.split('');
      setPostQuizOtp(digits);
      if (postQuizOtpRefs.current[3]) {
        postQuizOtpRefs.current[3].focus();
      }
    }
  }, []);

  const handlePostQuizSendCode = useCallback(async () => {
    if (resendTimer > 0) return;
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setEmailValidationError(t('ui', 'email_invalid_error') || 'Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }
    setEmailValidationError('');
    setIsEmailSending(true);
    setErrorMessage('');
    setAuthFlowNotification({ message: '', status: '' });
    try {
      await sendVerificationCode(trimmedEmail, false);
      setPostQuizOtp(Array(4).fill(''));
      setResendTimer(60);
      setAuthFlowNotification({
        message: t('ui', 'auth_notification_sent'),
        status: 'success'
      });
      setCurrentIndex(-11);
    } catch (err) {
      setErrorMessage(err.message || 'Error sending verification code.');
    } finally {
      setIsEmailSending(false);
    }
  }, [resendTimer, email, isValidEmail, t]);

  const handlePostQuizVerifyCode = useCallback(async () => {
    setIsVerifying(true);
    setErrorMessage('');
    setAuthFlowNotification({ message: '', status: '' });
    const fullCode = postQuizOtp.join('');
    try {
      await verifyCode(email, fullCode);
      setAuthFlowNotification({
        message: t('ui', 'auth_notification_success'),
        status: 'success'
      });
      await handleSubmitQuiz(true);
    } catch (err) {
      setAuthFlowNotification({
        message: err.message || t('ui', 'auth_notification_error'),
        status: 'error'
      });
    } finally {
      setIsVerifying(false);
    }
  }, [postQuizOtp, email, t, handleSubmitQuiz]);

  useEffect(() => {
    if (currentIndex === -6 && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [currentIndex]);

  useEffect(() => {
    if (currentIndex === -11 && postQuizOtpRefs.current[0]) {
      postQuizOtpRefs.current[0].focus();
    }
  }, [currentIndex]);

  let progressPercentage = 0;
  if (quizResult) {
    progressPercentage = 100;
  } else if (currentIndex === -5) {
    progressPercentage = 4;
  } else if (currentIndex === -6) {
    progressPercentage = 8;
  } else if (currentIndex === -2) {
    progressPercentage = 15;
  } else if (currentIndex === -3) {
    progressPercentage = 26;
  } else if (currentIndex === -4) {
    progressPercentage = 38;
  } else if (currentIndex >= 0) {
    progressPercentage = 38 + ((currentIndex + 1) / SELF_QUESTION_IDS.length) * 44;
  } else if (currentIndex === -9) {
    progressPercentage = 86;
  } else if (currentIndex === -10) {
    progressPercentage = 92;
  } else if (currentIndex === -11) {
    progressPercentage = 97;
  }

  const languageDropdown = (
    <QuizLanguageDropdown
      locale={locale}
      isOpen={langOpen}
      onToggle={() => setLangOpen(prev => !prev)}
      onSelect={handleLangToggle}
      dropdownRef={langRef}
    />
  );

  if (isSubmitting) {
    return (
      <div className="seenly-wizard-wrapper">
        <div className="seenly-wizard-container">
          <div className="seenly-wizard-body" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: '400', marginBottom: '1.5rem', color: 'var(--color-deep-ink)' }}>
              {t('ui', 'missing_id_fallback')}
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

  const isPostQuizFlow = (currentIndex === -10 || currentIndex === -11) && !quizResult;

  if (quizResult || isPostQuizFlow) {
    const signatureId = quizResult?.resultSnapshot?.selfSignatureId || calculatePersonalityCard(answers && Object.keys(answers).length > 0 ? answers : (quizResult?.resultSnapshot?.selfAverages || {})) || 'the_safe_haven';
    const signature = getObject('signatures', signatureId);
    const signatureName = signature ? signature.name : t('ui', 'missing_id_fallback');
    const signatureCardLine = signature ? signature.cardLine : "";
    const signatureImage = SIGNATURE_IMAGES[signatureId];
    const publicSlug = quizResult?.publicSlug || localStorage.getItem('seenly_owner_slug') || '';
    const cardRarity = getCardRarityData(signatureId, quizResult?.resultSnapshot?.selfRarity, locale);

    return (
      <div className="seenly-wizard-wrapper" style={{ padding: 0 }}>
        <div className={`seenly-wizard-container ${!isPostQuizFlow ? 'seenly-result-wizard-container' : ''}`}>
          {/* Wizard Header */}
          <header
            className="seenly-wizard-header"
            style={!isPostQuizFlow ? {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              padding: 'max(0.8rem, env(safe-area-inset-top)) 1.4rem 0.2rem 1.4rem',
              boxSizing: 'border-box',
              flexShrink: 0
            } : undefined}
          >
            {isPostQuizFlow ? (
              <>
                <button
                  type="button"
                  className="seenly-wizard-back-btn"
                  onClick={() => {
                    if (currentIndex === -10) {
                      setCurrentIndex(-9);
                    } else if (currentIndex === -11) {
                      setCurrentIndex(-10);
                    } else {
                      setResendTimer(0);
                      setIsQuickLogin(false);
                      setCurrentIndex(-1);
                    }
                  }}
                  aria-label={locale === 'tr' ? 'Geri' : 'Back'}
                  title={locale === 'tr' ? 'Geri' : 'Back'}
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
              </>
            ) : (
              <span style={{
                color: 'rgba(11, 27, 44, 0.65)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.72rem',
                fontWeight: 750,
                letterSpacing: '0.12em',
                lineHeight: 1,
                textTransform: 'uppercase',
                userSelect: 'none'
              }}>
                {t('ui', 'self_view_title')}
              </span>
            )}
            {languageDropdown}
          </header>

          {/* Self Result Card Screen */}
          {!isPostQuizFlow && (
            <QuizSelfResultCard
              quizResult={quizResult}
              signatureName={signatureName}
              signatureCardLine={signatureCardLine}
              signatureImage={signatureImage}
              cardRarity={cardRarity}
              publicSlug={publicSlug}
              onComplete={onComplete}
              locale={locale}
              t={t}
            />
          )}

          {/* Post-quiz claim modal screen */}
          {isPostQuizFlow && (
            <QuizAuthClaimModal
              currentIndex={currentIndex}
              email={email}
              setEmail={setEmail}
              emailValidationError={emailValidationError}
              setEmailValidationError={setEmailValidationError}
              postQuizOtp={postQuizOtp}
              postQuizOtpRefs={postQuizOtpRefs}
              handlePostQuizOtpDigitChange={handlePostQuizOtpDigitChange}
              handlePostQuizOtpKeyDown={handlePostQuizOtpKeyDown}
              handlePostQuizOtpPaste={handlePostQuizOtpPaste}
              handlePostQuizSendCode={handlePostQuizSendCode}
              handlePostQuizVerifyCode={handlePostQuizVerifyCode}
              isEmailSending={isEmailSending}
              isVerifying={isVerifying}
              resendTimer={resendTimer}
              formatTimer={formatTimer}
              errorMessage={errorMessage}
              authFlowNotification={authFlowNotification}
              isValidEmail={isValidEmail}
              langCode={langCode}
              locale={locale}
              t={t}
            />
          )}
        </div>
      </div>
    );
  }

  if (currentIndex === -1) {
    return (
      <LandingPage
        onStartClick={() => {
          setIsQuickLogin(false);
          setCurrentIndex(-2);
        }}
        onLoginClick={() => {
          setIsQuickLogin(true);
          setCurrentIndex(-5);
        }}
      />
    );
  }

  return (
    <div className="seenly-wizard-wrapper">
      <div className="seenly-wizard-container">
        {/* Wizard Header */}
        <header
          className="seenly-wizard-header"
          style={currentIndex === -5 || currentIndex === -6 ? { display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.5rem', padding: '1.5rem 1.25rem 0.5rem 1.25rem' } : {}}
        >
          <button
            type="button"
            className="seenly-wizard-back-btn"
            onClick={handleGoBack}
            aria-label={locale === 'tr' ? 'Geri' : 'Back'}
            title={locale === 'tr' ? 'Geri' : 'Back'}
            style={currentIndex === -5 || currentIndex === -6 ? {
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(11, 27, 44, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-deep-ink)',
              transition: 'all 0.2s',
              flexShrink: 0
            } : {}}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          {(currentIndex === -5 || currentIndex === -6) && (
            <div style={{ flex: 1 }} />
          )}
          {!(currentIndex === -5 || currentIndex === -6) && (
            <div className="seenly-wizard-progress-track">
              <div
                className="seenly-wizard-progress-bar"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          )}
          {languageDropdown}
        </header>

        {/* Wizard Body */}
        <div className="seenly-wizard-body">
          {/* Onboarding Steps (-5, -6, -2, -4) */}
          {(currentIndex === -5 || currentIndex === -6 || currentIndex === -2 || currentIndex === -4) && (
            <QuizOnboardingStep
              currentIndex={currentIndex}
              displayName={displayName}
              setDisplayName={setDisplayName}
              email={email}
              setEmail={setEmail}
              emailValidationError={emailValidationError}
              setEmailValidationError={setEmailValidationError}
              verificationCode={verificationCode}
              inputRefs={inputRefs}
              handleCodeDigitChange={handleCodeDigitChange}
              handleCodeKeyDown={handleCodeKeyDown}
              handleCodePaste={handleCodePaste}
              handleSendCode={handleSendCode}
              handleVerifyCode={handleVerifyCode}
              isEmailSending={isEmailSending}
              isVerifying={isVerifying}
              resendTimer={resendTimer}
              formatTimer={formatTimer}
              errorMessage={errorMessage}
              isQuickLogin={isQuickLogin}
              setCurrentIndex={setCurrentIndex}
              isValidEmail={isValidEmail}
              langCode={langCode}
              locale={locale}
              t={t}
            />
          )}

          {/* Question Flow (0 to 9) and Avatar Choice (-9) */}
          {(currentIndex >= 0 || currentIndex === -9) && (
            <QuizQuestionsRunner
              currentIndex={currentIndex}
              selfQuestionIds={SELF_QUESTION_IDS}
              answers={answers}
              setAnswers={setAnswers}
              selectedAvatar={selectedAvatar}
              setSelectedAvatar={setSelectedAvatar}
              avatarFilter={avatarFilter}
              setAvatarFilter={setAvatarFilter}
              filteredAvatars={filteredAvatars}
              setCurrentIndex={setCurrentIndex}
              langCode={langCode}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  );
}
