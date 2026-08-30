import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocale } from '../context/LocaleContext';
import QuestionCard from '../components/QuestionCard';
import AppShell from '../components/AppShell';
import LandingPage from '../components/LandingPage';
import { createSeenly, sendVerificationCode, verifyCode, loginWithEmail, updateAvatar } from '../services/api';
import { createPortal } from 'react-dom';
import { useSeenlyShare, buildWhatsAppLink } from '../hooks/useSeenlyShare';
import { AVATARS, getAvatarSrc } from '../images/avatars';
import { CARD_IMAGES } from '../images/cardImages';
import { getCardRarityData } from '../utils/rarityEngine';

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

function QuizLanguageDropdown({ locale, isOpen, onToggle, onSelect, dropdownRef }) {
  const supportedLangs = [
    { code: 'tr', label: 'Turkce' },
    { code: 'en', label: 'English' },
  ];

  return (
    <div className="seenly-wizard-step-lang" ref={dropdownRef}>
      <button
        type="button"
        className="lang-dropdown-trigger"
        onClick={onToggle}
        aria-label="Dil sec"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>{locale.toUpperCase()}</span>
        <svg className={`lang-dropdown-chevron ${isOpen ? 'open' : ''}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div
          className="lang-dropdown-menu"
          role="menu"
          onMouseDown={(event) => event.stopPropagation()}
        >
          {supportedLangs.map(lang => (
            <button
              key={lang.code}
              type="button"
              className={`lang-dropdown-item ${locale === lang.code ? 'active' : ''}`}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onSelect(lang.code);
              }}
              onClick={(event) => event.stopPropagation()}
              role="menuitemradio"
              aria-checked={locale === lang.code}
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
  );
}

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
    // 1. Direct key (e.g. data['samimiyet'])
    if (data && data[key] !== undefined && data[key] !== null) {
      const val = Number(data[key]);
      if (val > 1.0001 || val === 1.0) {
        return ((val - 1) / 4) * 100;
      }
      return val * 100;
    }
    // 2. Full question key (e.g. data['classic_self_samimiyet_01'])
    const selfKey = `classic_self_${key}_01`;
    if (data && data[selfKey] !== undefined && data[selfKey] !== null) {
      const num = Number(data[selfKey]);
      return ((num - 1) / 4) * 100;
    }
    // 3. Fallback to session storage if not found in data
    try {
      const savedAnswers = JSON.parse(sessionStorage.getItem('seenly_answers') || '{}');
      if (savedAnswers[selfKey] !== undefined && savedAnswers[selfKey] !== null) {
        const num = Number(savedAnswers[selfKey]);
        return ((num - 1) / 4) * 100;
      }
    } catch (e) { }

    return 50;
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

  // Close dropdown when clicking outside
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

  const handleLangToggle = (code) => {
    setLocale(code);
    setLangOpen(false);
  };

  const languageDropdown = (
    <QuizLanguageDropdown
      locale={locale}
      isOpen={langOpen}
      onToggle={() => setLangOpen(prev => !prev)}
      onSelect={handleLangToggle}
      dropdownRef={langRef}
    />
  );

  // 1. Session Storage State Restoration
  const [displayName, setDisplayName] = useState(() => {
    return sessionStorage.getItem('seenly_displayName') || '';
  });

  const [email, setEmail] = useState(() => {
    return sessionStorage.getItem('seenly_email') || '';
  });

  const isValidEmail = (emailStr) => {
    if (!emailStr || typeof emailStr !== 'string') return false;
    const trimmed = emailStr.trim();
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(trimmed);
  };

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

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const [verificationCode, setVerificationCode] = useState(Array(4).fill(''));
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = React.useRef([]);

  // Post-quiz verification flow state
  const [postQuizOtp, setPostQuizOtp] = useState(Array(4).fill(''));
  const postQuizOtpRefs = React.useRef([]);
  const [authFlowNotification, setAuthFlowNotification] = useState({ message: '', status: '' });

  const [answers, setAnswers] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('seenly_answers')) || {};
    } catch (e) {
      return {};
    }
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    return Number(sessionStorage.getItem('seenly_currentIndex') || -1); // -1 is landing, -2 is Nickname, -4 is Info, 0-9 is Questions, -9 is Avatar, -10 is Email, -11 is OTP
  });

  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    return sessionStorage.getItem('seenly_avatar') || localStorage.getItem('seenly_avatar') || 'kadin1';
  });
  const [avatarFilter, setAvatarFilter] = useState('all'); // 'all' | 'kadin' | 'erkek'
  const filteredAvatars = AVATARS.filter(av => (avatarFilter === 'all' ? true : av.gender === avatarFilter));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');


  const [quizResult, setQuizResult] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { handleInstagramStory, isGenerating: isStoryGenerating } = useSeenlyShare();
  const [isQuickLogin, setIsQuickLogin] = useState(() => {
    return sessionStorage.getItem('seenly_isQuickLogin') === 'true';
  });

  // Helper to completely purge all onboarding transient states & session storage
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

  // Handle scrolling to sections from other pages or direct URLs (e.g. #how-it-works)
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

    // Run on mount with a small delay for DOM loading
    const timer = setTimeout(handleScrollToHash, 200);

    window.addEventListener('hashchange', handleScrollToHash);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('hashchange', handleScrollToHash);
    };
  }, []);

  // 2. Synchronize states with sessionStorage
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

  // Clear all transient notifications and reset states when landing page (-1) is active
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

  const handleGoBack = () => {
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
      // Go back from Avatar Selection to last question (question 9)
      setCurrentIndex(SELF_QUESTION_IDS.length - 1);
    } else if (currentIndex === -10) {
      // Go back from Email input to Avatar Selection
      setCurrentIndex(-9);
    } else if (currentIndex === -11) {
      // Go back from OTP to Email input
      setCurrentIndex(-10);
    } else if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async (bypassFullscreen = false) => {
    if (!bypassFullscreen) {
      setIsSubmitting(true);
    }
    setErrorMessage('');

    // Map answer key-pairs to backend validation DTO shape
    const selfAnswersPayload = SELF_QUESTION_IDS.map(qId => ({
      questionId: qId,
      answerValue: answers[qId] || 3 // default fallback to neutral 3 if missing
    }));

    try {
      const response = await createSeenly(displayName, email.trim(), selfAnswersPayload);

      // Save owner token and public slug locally
      localStorage.setItem('seenly_owner_token', response.ownerToken);
      if (response.publicSlug) {
        localStorage.setItem('seenly_owner_slug', response.publicSlug);
      }

      // Ensure fresh default free status for newly registered account
      localStorage.removeItem('seenly_is_premium');
      localStorage.removeItem('seenly_test_limit');

      // Save selected avatar
      const avatarToSave = selectedAvatar || sessionStorage.getItem('seenly_avatar') || 'kadin1';
      localStorage.setItem('seenly_avatar', avatarToSave);
      if (response.ownerToken) {
        try {
          await updateAvatar(response.ownerToken, avatarToSave);
        } catch (avatarErr) {
          console.warn('Avatar save on quiz submit failed', avatarErr);
        }
      }

      // Clear session values
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
  };

  const handleSendCode = async () => {
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
      setVerificationCode(Array(4).fill('')); // reset verification code
      setResendTimer(60); // 60s banking-style countdown
      setCurrentIndex(-6);
    } catch (err) {
      setErrorMessage(err.message || 'Error sending verification code.');
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleCodeDigitChange = (element, index) => {
    const val = element.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const newCode = [...verificationCode];
    newCode[index] = val ? val.substring(val.length - 1) : '';
    setVerificationCode(newCode);

    // Auto focus next input
    if (val && index < 3 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleCodeKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData('text').replace(/[^A-Za-z0-9]/g, '').toUpperCase().substring(0, 4);
    if (pasteText.length === 4) {
      const digits = pasteText.split('');
      setVerificationCode(digits);
      if (inputRefs.current[3]) {
        inputRefs.current[3].focus();
      }
    }
  };

  const handleVerifyCode = async () => {
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

        // Clear session values
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
  };

  // Post-quiz verification OTP handlers
  const handlePostQuizOtpDigitChange = (element, index) => {
    const val = element.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const newCode = [...postQuizOtp];
    newCode[index] = val ? val.substring(val.length - 1) : '';
    setPostQuizOtp(newCode);

    // Auto focus next input
    if (val && index < 3 && postQuizOtpRefs.current[index + 1]) {
      postQuizOtpRefs.current[index + 1].focus();
    }
  };

  const handlePostQuizOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !postQuizOtp[index] && index > 0 && postQuizOtpRefs.current[index - 1]) {
      postQuizOtpRefs.current[index - 1].focus();
    }
  };

  const handlePostQuizOtpPaste = (e) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData('text').replace(/[^A-Za-z0-9]/g, '').toUpperCase().substring(0, 4);
    if (pasteText.length === 4) {
      const digits = pasteText.split('');
      setPostQuizOtp(digits);
      if (postQuizOtpRefs.current[3]) {
        postQuizOtpRefs.current[3].focus();
      }
    }
  };

  const handlePostQuizSendCode = async () => {
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
      setPostQuizOtp(Array(4).fill('')); // reset 4-digit code
      setResendTimer(60); // 60s banking-style countdown
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
  };

  const handlePostQuizVerifyCode = async () => {
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
      // Submit the quiz bypassing fullscreen spinner
      await handleSubmitQuiz(true);
    } catch (err) {
      setAuthFlowNotification({
        message: err.message || t('ui', 'auth_notification_error'),
        status: 'error'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Auto-focus first digit of verification code when entering verification view
  useEffect(() => {
    if (currentIndex === -6 && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [currentIndex]);

  // Auto-focus first digit of post-quiz OTP code when entering verification view
  useEffect(() => {
    if (currentIndex === -11 && postQuizOtpRefs.current[0]) {
      postQuizOtpRefs.current[0].focus();
    }
  }, [currentIndex]);

  // 3. Renders the progress bar at the top of the quiz
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
            <style>{`
              @keyframes loadingProgress {
                0% { left: -50%; }
                100% { left: 100%; }
              }
            `}</style>
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
    const signatureOneLine = signature ? signature.oneLine : "";
    const signatureCardLine = signature ? signature.cardLine : "";
    const signatureImage = SIGNATURE_IMAGES[signatureId];
    const publicSlug = quizResult?.publicSlug || localStorage.getItem('seenly_owner_slug') || '';
    const cardRarity = getCardRarityData(signatureId, quizResult?.resultSnapshot?.selfRarity, locale);

    return (
      <div className="seenly-wizard-wrapper" style={{ padding: 0 }}>
        <div
          className={`seenly-wizard-container ${!isPostQuizFlow ? 'seenly-result-wizard-container' : ''}`}
        >
          <style>{`
            .seenly-result-wizard-container {
              width: 100vw !important;
              height: 100dvh !important;
              max-width: 100vw !important;
              border-radius: 0 !important;
              border: none !important;
              box-shadow: none !important;
              margin: 0 !important;
              display: flex !important;
              flex-direction: column !important;
              overflow: hidden !important;
              background-color: var(--color-paper-cream) !important;
            }

            @media (min-width: 768px) {
              .seenly-result-wizard-container {
                width: 100% !important;
                max-width: 440px !important;
                height: min(720px, calc(100dvh - 36px)) !important;
                border-radius: 28px !important;
                border: 1px solid rgba(11, 27, 44, 0.08) !important;
                box-shadow: 0 24px 60px rgba(11, 27, 44, 0.12) !important;
                margin: auto !important;
              }
            }

            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(16px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .spinner-mini {
              width: 20px;
              height: 20px;
              border: 2px solid rgba(255, 255, 255, 0.3);
              border-radius: 50%;
              border-top-color: #fff;
              animation: spin 0.8s linear infinite;
              display: inline-block;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>

          {/* Wizard Header - always shown in this block */}
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

          {/* Wizard Body */}
          <div
            className="seenly-wizard-body seenly-wizard-result-body"
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: isPostQuizFlow ? 'center' : 'space-between',
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              height: '100%',
              maxHeight: '100%',
              padding: isPostQuizFlow
                ? '0.8rem 1.5rem 1.4rem 1.5rem'
                : '0.4rem 1.2rem max(0.8rem, env(safe-area-inset-bottom)) 1.2rem',
              boxSizing: 'border-box'
            }}
          >
            <div
              className="seenly-wizard-content"
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                maxWidth: 'clamp(260px, min(80vw, 40vh), 340px)',
                margin: isPostQuizFlow ? 'auto 0' : 'auto 0',
                boxSizing: 'border-box'
              }}
            >

              {!isPostQuizFlow && (
                <>
                  {/* 1. Header Section: Pure Signature Name in High-Fashion Cormorant Garamond */}
                  <div style={{
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    marginBottom: 'clamp(10px, 1.8vh, 18px)'
                  }}>
                    <h2 style={{
                      fontFamily: "'Fraunces', 'Playfair Display', Georgia, serif",
                      fontSize: 'clamp(2rem, min(6.8vw, 4.2vh), 2.75rem)',
                      fontWeight: 600,
                      color: '#0B1B2C',
                      margin: 0,
                      lineHeight: 1.08,
                      letterSpacing: '-0.02em',
                      textAlign: 'center',
                      wordBreak: 'break-word'
                    }}>
                      {signatureName}
                    </h2>
                  </div>

                  {/* 2. Artwork Chic 3:4 Luxury Portrait Card Frame (Prominent & Centered) */}
                  {signatureImage && (
                    <div style={{
                      position: 'relative',
                      width: 'clamp(220px, min(72vw, 36vh), 275px)',
                      height: 'clamp(293px, min(96vw, 48vh), 366px)',
                      borderRadius: '22px',
                      overflow: 'hidden',
                      border: '1px solid rgba(197, 160, 89, 0.32)',
                      boxShadow: '0 18px 42px -6px rgba(11, 27, 44, 0.15), 0 3px 10px rgba(11, 27, 44, 0.04)',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                      flexShrink: 0
                    }}>
                      {/* Classic Rarity Pill Badge (matching Dashboard Kendi Algım) */}
                      {cardRarity && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            zIndex: 3,
                            backgroundColor: cardRarity.badgeBg,
                            color: cardRarity.badgeText,
                            border: `1px solid ${cardRarity.badgeBorder}`,
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '11.5px',
                            fontWeight: 600,
                            letterSpacing: '0.01em',
                            padding: '3px 9px',
                            borderRadius: '999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            whiteSpace: 'nowrap',
                            userSelect: 'none',
                            boxShadow: '0 2px 8px rgba(11, 27, 44, 0.08)'
                          }}
                        >
                          <span>{cardRarity.badgeLabel}</span>
                        </div>
                      )}

                      <img
                        src={signatureImage}
                        alt={signatureName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    </div>
                  )}

                  {/* 3. Description Paragraph: Poetic Essence */}
                  {signatureCardLine && (
                    <p style={{
                      fontFamily: "'Newsreader', 'Cormorant Garamond', Georgia, serif",
                      fontSize: 'clamp(0.92rem, 1.55vh, 1.06rem)',
                      fontStyle: 'italic',
                      fontWeight: 500,
                      lineHeight: '1.45',
                      color: '#1E293B',
                      marginTop: 'clamp(10px, 1.8vh, 18px)',
                      marginBottom: 0,
                      textAlign: 'center',
                      maxWidth: 'clamp(260px, 80vw, 320px)',
                      width: '100%'
                    }}>
                      {signatureCardLine}
                    </p>
                  )}
                </>
              )}

              {/* POST-QUIZ AUTH OVERLAYS (Email & OTP steps) */}
              {isPostQuizFlow && (
                <div style={{
                  position: 'relative',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                  animation: 'fadeInUp 0.4s ease'
                }}>
                  {currentIndex === -10 ? (
                    /* Step 1: Mail Input */
                    <div style={{
                      position: 'relative',
                      zIndex: 2,
                      width: '100%',
                      maxWidth: '340px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 'clamp(0.65rem, 1.6vh, 1rem)',
                      boxSizing: 'border-box',
                      padding: '0.2rem 0'
                    }}>
                      {/* Icon */}
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(217, 106, 83, 0.12) 0%, rgba(143, 123, 204, 0.08) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        border: '1.5px solid rgba(217, 106, 83, 0.25)',
                        boxShadow: '0 8px 24px rgba(217, 106, 83, 0.08)',
                        color: 'var(--color-burnt-coral)',
                        flexShrink: 0
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>

                      {/* Title */}
                      <h3 style={{
                        fontFamily: "'Fraunces', 'Playfair Display', Georgia, serif",
                        fontSize: 'clamp(1.65rem, 3.8vh, 2.1rem)',
                        fontWeight: 600,
                        color: '#0B1B2C',
                        margin: 0,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                        whiteSpace: 'nowrap'
                      }}>
                        {t('ui', 'auth_mail_title')}
                      </h3>

                      {/* Description */}
                      <p style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'clamp(0.84rem, 1.45vh, 0.92rem)',
                        lineHeight: '1.5',
                        color: '#475569',
                        margin: 0,
                        maxWidth: '300px',
                        textAlign: 'center'
                      }}>
                        {t('ui', 'auth_mail_desc')}
                      </p>

                      {/* Input container */}
                      <div className="seenly-wizard-input-container" style={{ width: '100%', margin: '0.2rem 0 0 0' }}>
                        <input
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          placeholder={t('ui', 'auth_mail_placeholder')}
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (emailValidationError) setEmailValidationError('');
                          }}
                          required
                          autoFocus
                          className="seenly-wizard-input"
                          style={{
                            width: '100%',
                            height: '48px',
                            minHeight: '48px',
                            borderRadius: '16px',
                            border: emailValidationError ? '1.5px solid var(--color-error, #ef4444)' : '1.5px solid rgba(11, 27, 44, 0.12)',
                            background: '#ffffff',
                            textAlign: 'center',
                            fontSize: '1rem',
                            fontWeight: '500',
                            boxSizing: 'border-box',
                            boxShadow: 'inset 0 2px 4px rgba(11, 27, 44, 0.02)'
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && isValidEmail(email) && !isEmailSending && resendTimer === 0) {
                              handlePostQuizSendCode();
                            }
                          }}
                        />
                        {emailValidationError && (
                          <p style={{ color: 'var(--color-error, #ef4444)', fontSize: '0.82rem', marginTop: '0.35rem', textAlign: 'center', fontWeight: '600' }}>
                            {emailValidationError}
                          </p>
                        )}
                      </div>

                      {/* Submit Button */}
                      <button
                        type="button"
                        className="seenly-wizard-primary-btn"
                        style={{
                          width: '100%',
                          height: '48px',
                          minHeight: '48px',
                          borderRadius: '16px',
                          fontSize: '0.94rem',
                          fontWeight: '700',
                          backgroundColor: (isValidEmail(email) && resendTimer === 0) ? '#0B1B2C' : 'rgba(11, 27, 44, 0.08)',
                          color: (isValidEmail(email) && resendTimer === 0) ? '#ffffff' : 'rgba(11, 27, 44, 0.45)',
                          border: (isValidEmail(email) && resendTimer === 0) ? 'none' : '1px solid rgba(11, 27, 44, 0.12)',
                          cursor: (isValidEmail(email) && resendTimer === 0) ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: (isValidEmail(email) && resendTimer === 0) ? '0 10px 24px rgba(11, 27, 44, 0.14)' : 'none',
                          transition: 'all 0.25s ease',
                          marginTop: '0.1rem'
                        }}
                        disabled={isEmailSending || !isValidEmail(email) || resendTimer > 0}
                        onClick={handlePostQuizSendCode}
                      >
                        {isEmailSending ? (
                          <span className="spinner-mini"></span>
                        ) : resendTimer > 0 ? (
                          `${langCode === 'tr' ? 'Tekrar Kod Gönder' : 'Resend Code'} (${formatTimer(resendTimer)})`
                        ) : (
                          t('ui', 'auth_mail_btn')
                        )}
                      </button>
                    </div>
                  ) : (
                    /* Step 2: 4-Digit OTP Input */
                    <div style={{
                      position: 'relative',
                      zIndex: 2,
                      width: '100%',
                      maxWidth: '340px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 'clamp(0.55rem, 1.4vh, 0.9rem)',
                      boxSizing: 'border-box',
                      padding: '0.1rem 0'
                    }}>
                      {/* Icon */}
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(217, 106, 83, 0.12) 0%, rgba(143, 123, 204, 0.08) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        border: '1.5px solid rgba(217, 106, 83, 0.25)',
                        boxShadow: '0 8px 24px rgba(217, 106, 83, 0.08)',
                        color: 'var(--color-burnt-coral)',
                        flexShrink: 0
                      }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>

                      {/* Title */}
                      <h3 style={{
                        fontFamily: "'Fraunces', 'Playfair Display', Georgia, serif",
                        fontSize: 'clamp(1.6rem, 3.6vh, 2rem)',
                        fontWeight: 600,
                        color: '#0B1B2C',
                        margin: 0,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                        whiteSpace: 'nowrap'
                      }}>
                        {t('ui', 'auth_otp_title')}
                      </h3>

                      {/* Description with email */}
                      <p style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'clamp(0.82rem, 1.35vh, 0.88rem)',
                        lineHeight: '1.45',
                        color: '#475569',
                        margin: 0,
                        maxWidth: '290px',
                        textAlign: 'center'
                      }}>
                        {t('ui', 'auth_otp_desc').replace('{email}', email)}
                      </p>

                      {/* Compact 4-Digit Container Card */}
                      <div style={{
                        width: '100%',
                        background: 'rgba(255, 253, 250, 0.82)',
                        border: '1px solid rgba(197, 160, 89, 0.28)',
                        borderRadius: '18px',
                        padding: '0.85rem 0.75rem 0.65rem 0.75rem',
                        boxShadow: '0 8px 24px rgba(11, 27, 44, 0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxSizing: 'border-box'
                      }}>
                        <div style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: '#64748B',
                          textAlign: 'center'
                        }}>
                          {locale === 'tr' ? 'DOĞRULAMA KODUNUZ' : 'VERIFICATION CODE'}
                        </div>

                        {/* 4 Input Boxes */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          gap: '8px',
                          width: '100%',
                          maxWidth: '260px',
                          margin: '0.1rem auto'
                        }}>
                          {Array(4).fill('').map((_, i) => (
                            <input
                              key={i}
                              ref={(el) => (postQuizOtpRefs.current[i] = el)}
                              type="text"
                              inputMode="text"
                              autoComplete={i === 0 ? "one-time-code" : "off"}
                              autoCapitalize="characters"
                              autoCorrect="off"
                              spellCheck={false}
                              aria-label={locale === 'tr' ? `Doğrulama hanesi ${i + 1}` : `Verification digit ${i + 1}`}
                              maxLength={1}
                              value={postQuizOtp[i] || ''}
                              onChange={(e) => handlePostQuizOtpDigitChange(e.target, i)}
                              onKeyDown={(e) => handlePostQuizOtpKeyDown(e, i)}
                              onPaste={handlePostQuizOtpPaste}
                              style={{
                                width: '46px',
                                height: '52px',
                                borderRadius: '12px',
                                border: '1.5px solid rgba(11, 27, 44, 0.14)',
                                textAlign: 'center',
                                fontSize: '1.45rem',
                                fontFamily: "'Fraunces', Georgia, serif",
                                fontWeight: '700',
                                color: '#0B1B2C',
                                backgroundColor: '#ffffff',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                boxShadow: 'inset 0 2px 4px rgba(11, 27, 44, 0.02)'
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor = 'var(--color-burnt-coral)';
                                e.target.style.boxShadow = '0 0 0 3px rgba(217, 106, 83, 0.15)';
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(11, 27, 44, 0.14)';
                                e.target.style.boxShadow = 'inset 0 2px 4px rgba(11, 27, 44, 0.02)';
                              }}
                            />
                          ))}
                        </div>

                        {/* Resend button / countdown */}
                        <div style={{ minHeight: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {resendTimer > 0 ? (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: 'var(--color-text-muted)',
                              backgroundColor: 'rgba(11, 27, 44, 0.04)',
                              padding: '4px 12px',
                              borderRadius: '16px'
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              <span>{t('ui', 'auth_resend_countdown').replace('{time}', formatTimer(resendTimer))}</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isEmailSending}
                              onClick={handlePostQuizSendCode}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                border: 'none',
                                background: 'none',
                                color: 'var(--color-burnt-coral)',
                                fontWeight: 700,
                                cursor: isEmailSending ? 'not-allowed' : 'pointer',
                                fontSize: '0.82rem',
                                textDecoration: 'underline',
                                padding: '2px 8px'
                              }}
                            >
                              {isEmailSending ? (
                                <span className="spinner-mini"></span>
                              ) : (
                                <>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="23 4 23 10 17 10" />
                                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                  </svg>
                                  <span>{t('ui', 'auth_resend_btn')}</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Error Alert if any */}
                        {(errorMessage || authFlowNotification.status === 'error') && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '0.45rem 0.75rem',
                            borderRadius: '10px',
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}>
                            <p style={{
                              margin: 0,
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: '#dc2626',
                              lineHeight: 1.3
                            }}>{authFlowNotification.message || errorMessage}</p>
                          </div>
                        )}
                      </div>

                      {/* Verify Button */}
                      <button
                        type="button"
                        className="seenly-wizard-primary-btn"
                        style={{
                          width: '100%',
                          height: '48px',
                          minHeight: '48px',
                          borderRadius: '16px',
                          fontSize: '0.94rem',
                          fontWeight: '700',
                          backgroundColor: (!isVerifying && !postQuizOtp.some(c => !c)) ? '#0B1B2C' : 'rgba(11, 27, 44, 0.06)',
                          color: (!isVerifying && !postQuizOtp.some(c => !c)) ? '#ffffff' : 'rgba(11, 27, 44, 0.35)',
                          border: (!isVerifying && !postQuizOtp.some(c => !c)) ? 'none' : '1px solid rgba(11, 27, 44, 0.08)',
                          cursor: (!isVerifying && !postQuizOtp.some(c => !c)) ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: (!isVerifying && !postQuizOtp.some(c => !c)) ? '0 10px 24px rgba(11, 27, 44, 0.14)' : 'none',
                          transition: 'all 0.25s ease',
                          marginTop: '0.1rem'
                        }}
                        disabled={isVerifying || postQuizOtp.some(c => !c)}
                        onClick={handlePostQuizVerifyCode}
                      >
                        {isVerifying ? (
                          <span className="spinner-mini"></span>
                        ) : (
                          t('ui', 'auth_otp_btn')
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Bottom Actions Area */}
            {!isPostQuizFlow && (
              <div className="seenly-wizard-footer-action" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(0.2rem, 0.5vh, 0.35rem)',
                width: '100%',
                maxWidth: 'clamp(220px, min(72vw, 36vh), 275px)',
                marginTop: 'auto',
                paddingTop: 'clamp(6px, 1vh, 12px)',
                paddingBottom: '0.1rem',
                flexShrink: 0,
                boxSizing: 'border-box'
              }}>
                {/* Primary Button: Profilimi Gör */}
                <button
                  type="button"
                  className="seenly-wizard-primary-btn"
                  style={{
                    width: '100%',
                    height: '48px',
                    minHeight: '48px',
                    borderRadius: '16px',
                    background: '#0b1b2c',
                    color: '#ffffff',
                    fontSize: 'clamp(0.92rem, 1.5vh, 0.98rem)',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    margin: 0,
                    boxShadow: '0 8px 24px rgba(11, 27, 44, 0.16)',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                  onClick={() => {
                    const token = quizResult?.ownerToken || localStorage.getItem('seenly_owner_token');
                    if (onComplete) onComplete(token);
                  }}
                >
                  <span>{t('ui', 'view_profile_btn') || 'Profilimi Gör'}</span>
                  <span style={{ fontSize: '0.94rem' }}>➔</span>
                </button>

                {/* Secondary Button / Link: Sonucumu Paylaş */}
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '0.84rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    minHeight: '30px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>{t('ui', 'share_result_btn') || 'Sonucumu paylaş'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Share Suite Modal Portal */}
        {showShareModal && createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(11, 27, 44, 0.72)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.2rem',
              boxSizing: 'border-box',
              animation: 'fadeInUp 0.3s ease'
            }}
            onClick={() => setShowShareModal(false)}
          >
            <div
              style={{
                background: '#FDFBF7',
                borderRadius: '26px',
                border: '1px solid rgba(197, 160, 89, 0.35)',
                boxShadow: '0 24px 64px rgba(11, 27, 44, 0.35)',
                maxWidth: '420px',
                width: '100%',
                padding: '1.8rem 1.6rem 1.5rem 1.6rem',
                boxSizing: 'border-box',
                position: 'relative',
                textAlign: 'center'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(11, 27, 44, 0.06)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#0b1b2c',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                ×
              </button>

              {/* Header */}
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#c5a059',
                display: 'block',
                marginBottom: '4px'
              }}>
                {locale === 'tr' ? 'PAYLAŞIM MERKEZİ' : 'SHARE SUITE'}
              </span>

              <h3 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#0b1b2c',
                margin: '0 0 6px 0'
              }}>
                {locale === 'tr' ? 'Sonucunu Paylaş' : 'Share Your Result'}
              </h3>

              <p style={{
                fontSize: '0.86rem',
                color: 'rgba(11, 27, 44, 0.68)',
                lineHeight: 1.45,
                margin: '0 0 1.3rem 0',
                fontFamily: 'var(--font-serif)'
              }}>
                {locale === 'tr'
                  ? 'Arkadaşlarının seni nasıl gördüğünü keşfetmek için kartını ve linkini paylaş.'
                  : 'Share your card and link to discover how your circle perceives you.'}
              </p>

              {/* Share Options List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {/* 1. Instagram Story */}
                <button
                  type="button"
                  disabled={isStoryGenerating}
                  onClick={() => {
                    handleInstagramStory(signatureName, signatureImage, publicSlug, locale);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(240, 148, 51, 0.08) 0%, rgba(220, 39, 67, 0.08) 50%, rgba(188, 24, 136, 0.08) 100%)',
                    border: '1px solid rgba(220, 39, 67, 0.25)',
                    color: '#0b1b2c',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      flexShrink: 0
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ display: 'block', fontSize: '0.92rem', color: '#0b1b2c' }}>Instagram Story</strong>
                      <small style={{ fontSize: '0.74rem', color: 'rgba(11, 27, 44, 0.6)' }}>
                        {locale === 'tr' ? 'Hikaye görseli indir ve paylaş' : 'Download story card & share'}
                      </small>
                    </div>
                  </div>
                  {isStoryGenerating ? (
                    <span className="spinner-mini" style={{ width: '16px', height: '16px', borderTopColor: '#dc2743' }} />
                  ) : (
                    <span style={{ fontSize: '1.1rem', color: 'rgba(11, 27, 44, 0.4)' }}>➔</span>
                  )}
                </button>

                {/* 2. WhatsApp */}
                <button
                  type="button"
                  onClick={() => {
                    const waUrl = buildWhatsAppLink(signatureName, publicSlug);
                    window.open(waUrl, '_blank');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    borderRadius: '16px',
                    background: 'rgba(37, 211, 102, 0.08)',
                    border: '1px solid rgba(37, 211, 102, 0.28)',
                    color: '#0b1b2c',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: '#25D366',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      flexShrink: 0
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ display: 'block', fontSize: '0.92rem', color: '#0b1b2c' }}>WhatsApp</strong>
                      <small style={{ fontSize: '0.74rem', color: 'rgba(11, 27, 44, 0.6)' }}>
                        {locale === 'tr' ? 'Arkadaşlarına doğrudan mesaj gönder' : 'Send direct invite to friends'}
                      </small>
                    </div>
                  </div>
                  <span style={{ fontSize: '1.1rem', color: 'rgba(11, 27, 44, 0.4)' }}>➔</span>
                </button>

                {/* 3. Copy Link */}
                <button
                  type="button"
                  onClick={() => {
                    const origin = window.location.origin.startsWith('http') ? window.location.origin : `https://${window.location.host}`;
                    const link = `${origin}/#/friend/${publicSlug}`;
                    navigator.clipboard.writeText(link).then(() => {
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2400);
                    });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    borderRadius: '16px',
                    background: copiedLink ? 'rgba(42, 90, 58, 0.1)' : 'rgba(11, 27, 44, 0.04)',
                    border: copiedLink ? '1px solid rgba(42, 90, 58, 0.4)' : '1px solid rgba(11, 27, 44, 0.12)',
                    color: '#0b1b2c',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: copiedLink ? '#2a5a3a' : '#0b1b2c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      flexShrink: 0
                    }}>
                      {copiedLink ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                      )}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ display: 'block', fontSize: '0.92rem', color: copiedLink ? '#2a5a3a' : '#0b1b2c' }}>
                        {copiedLink ? (locale === 'tr' ? 'Bağlantı Kopyalandı!' : 'Link Copied!') : (locale === 'tr' ? 'Bağlantıyı Kopyala' : 'Copy Link')}
                      </strong>
                      <small style={{ fontSize: '0.74rem', color: 'rgba(11, 27, 44, 0.6)' }}>
                        {locale === 'tr' ? 'Profil linkini panoya kopyala' : 'Copy profile link to clipboard'}
                      </small>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: copiedLink ? '#2a5a3a' : '#c5a059' }}>
                    {copiedLink ? '✓' : (locale === 'tr' ? 'Kopyala' : 'Copy')}
                  </span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
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
        <header className="seenly-wizard-header" style={currentIndex === -5 || currentIndex === -6 ? { display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.5rem', padding: '1.5rem 1.25rem 0.5rem 1.25rem' } : {}}>
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
          {/* Step counter + Language dropdown - always shown */}
          {languageDropdown}
        </header>

        {/* Wizard Body */}
        <div className="seenly-wizard-body">
          {currentIndex === -5 && (
            /* Step A: Email Entry */
            <>
              <div className="seenly-wizard-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', flex: 1 }}>
                {/* Elegant Watercolor Envelope Icon Wrapper */}
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(217, 106, 83, 0.12) 0%, rgba(143, 123, 204, 0.08) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  border: '1px solid rgba(217, 106, 83, 0.22)',
                  boxShadow: '0 8px 24px rgba(217, 106, 83, 0.06)',
                  color: 'var(--color-burnt-coral)'
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>

                <h2 className="seenly-wizard-title" style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-deep-ink)', marginBottom: '0.5rem', fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', textAlign: 'center', width: '100%' }}>
                  {isQuickLogin
                    ? t('ui', 'email_entry_quick_login_title')
                    : t('ui', 'email_entry_new_profile_title')}
                </h2>

                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9rem',
                  color: 'var(--color-text-muted)',
                  marginTop: '0',
                  marginBottom: '1.5rem',
                  textAlign: 'center',
                  lineHeight: '1.55',
                  maxWidth: '360px',
                  padding: '0 0.5rem'
                }}>
                  {isQuickLogin
                    ? t('ui', 'email_entry_quick_login_desc')
                    : t('ui', 'email_entry_new_profile_desc')}
                </p>

                {/* Styled Sub-Card for Input */}
                <div className="seenly-auth-card" style={{
                  width: '100%',
                  maxWidth: '400px',
                  background: 'rgba(255, 253, 250, 0.55)',
                  border: '1px solid rgba(11, 27, 44, 0.06)',
                  borderRadius: '20px',
                  padding: '1.75rem 1.5rem',
                  boxShadow: '0 10px 30px rgba(11, 27, 44, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  boxSizing: 'border-box'
                }}>
                  <div style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--color-deep-ink)',
                    opacity: 0.6,
                    textAlign: 'center'
                  }}>
                    {locale === 'tr' ? 'İLETİŞİM KANALINIZ' : 'YOUR CONTACT CHANNEL'}
                  </div>

                  <div className="seenly-wizard-input-container" style={{ width: '100%' }}>
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder={locale === 'tr' ? 'adiniz@ornek.com' : 'you@example.com'}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailValidationError) setEmailValidationError('');
                      }}
                      required
                      autoFocus
                      className="seenly-wizard-input"
                      style={{
                        borderColor: emailValidationError ? 'var(--color-error, #ef4444)' : undefined,
                        fontSize: '1rem'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && isValidEmail(email) && !isEmailSending && resendTimer === 0) {
                          handleSendCode();
                        }
                      }}
                    />
                    {emailValidationError && (
                      <p style={{ color: 'var(--color-error, #ef4444)', fontSize: '0.85rem', marginTop: '0.4rem', textAlign: 'center', fontWeight: '500' }}>
                        {emailValidationError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="seenly-wizard-footer-action">
                <button
                  type="button"
                  className="seenly-wizard-primary-btn"
                  disabled={isEmailSending || !isValidEmail(email) || resendTimer > 0}
                  onClick={handleSendCode}
                >
                  {isEmailSending ? (
                    <span className="spinner-mini"></span>
                  ) : resendTimer > 0 ? (
                    <span>{`${langCode === 'tr' ? 'Tekrar Kod Gönder' : 'Resend Code'} (${formatTimer(resendTimer)})`}</span>
                  ) : (
                    <>
                      <span>{t('ui', 'wizard_continue_btn')}</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="seenly-wizard-arrow-icon">
                        <line x1="4" y1="12" x2="20" y2="12" />
                        <polyline points="13 5 20 12 13 19" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {currentIndex === -6 && (
            /* Step B: 4-Digit Code Verification */
            <>
              <div className="seenly-wizard-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', flex: 1 }}>
                {/* Elegant Watercolor Lock Icon Wrapper matching Step -5 */}
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(217, 106, 83, 0.12) 0%, rgba(143, 123, 204, 0.08) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  border: '1px solid rgba(217, 106, 83, 0.22)',
                  boxShadow: '0 8px 24px rgba(217, 106, 83, 0.06)',
                  color: 'var(--color-burnt-coral)'
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>

                <h2 className="seenly-wizard-title" style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-deep-ink)', marginBottom: '0.5rem', fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', textAlign: 'center', width: '100%' }}>
                  {t('ui', 'otp_entry_title')}
                </h2>

                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9rem',
                  color: 'var(--color-text-muted)',
                  marginTop: '0',
                  marginBottom: '1.5rem',
                  textAlign: 'center',
                  lineHeight: '1.55',
                  maxWidth: '360px',
                  padding: '0 0.5rem'
                }}>
                  {t('ui', 'otp_entry_desc').replace('{email}', email)}
                </p>

                {/* Styled Sub-Card for OTP Input matching Step -5 */}
                <div className="seenly-auth-card" style={{
                  width: '100%',
                  maxWidth: '400px',
                  background: 'rgba(255, 253, 250, 0.55)',
                  border: '1px solid rgba(11, 27, 44, 0.06)',
                  borderRadius: '20px',
                  padding: '1.75rem 1.5rem',
                  boxShadow: '0 10px 30px rgba(11, 27, 44, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxSizing: 'border-box'
                }}>
                  <div style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--color-deep-ink)',
                    opacity: 0.6,
                    textAlign: 'center'
                  }}>
                    {locale === 'tr' ? 'DOĞRULAMA KODUNUZ' : 'VERIFICATION CODE'}
                  </div>

                  {/* 4 Digit Input Group */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '10px',
                    width: '100%',
                    maxWidth: '340px',
                    margin: '0.25rem auto 0 auto'
                  }}>
                    {Array(4).fill('').map((_, i) => (
                      <input
                        key={i}
                        ref={(el) => (inputRefs.current[i] = el)}
                        type="text"
                        inputMode="text"
                        autoComplete={i === 0 ? "one-time-code" : "off"}
                        autoCapitalize="characters"
                        autoCorrect="off"
                        spellCheck={false}
                        aria-label={locale === 'tr' ? `Doğrulama hanesi ${i + 1}` : `Verification digit ${i + 1}`}
                        maxLength={1}
                        value={verificationCode[i] || ''}
                        onChange={(e) => handleCodeDigitChange(e.target, i)}
                        onKeyDown={(e) => handleCodeKeyDown(e, i)}
                        onPaste={handleCodePaste}
                        style={{
                          width: '48px',
                          height: '56px',
                          borderRadius: '14px',
                          border: '1.5px solid rgba(11, 27, 44, 0.12)',
                          textAlign: 'center',
                          fontSize: '1.5rem',
                          fontFamily: 'var(--font-serif)',
                          fontWeight: '700',
                          color: 'var(--color-deep-ink)',
                          backgroundColor: 'var(--color-paper-cream)',
                          outline: 'none',
                          transition: 'all 0.25s ease',
                          boxShadow: 'inset 0 2px 4px rgba(11, 27, 44, 0.02)'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--color-burnt-coral)';
                          e.target.style.boxShadow = '0 0 0 4px rgba(217, 106, 83, 0.15)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(11, 27, 44, 0.12)';
                          e.target.style.boxShadow = 'inset 0 2px 4px rgba(11, 27, 44, 0.02)';
                        }}
                      />
                    ))}
                  </div>

                  {/* Banking-style Resend Timer or Active Button */}
                  <div style={{ margin: '0.25rem 0 0 0', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {resendTimer > 0 ? (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
                        backgroundColor: 'rgba(11, 27, 44, 0.04)',
                        padding: '6px 16px',
                        borderRadius: '20px'
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{t('ui', 'auth_resend_countdown').replace('{time}', formatTimer(resendTimer))}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isEmailSending}
                        onClick={handleSendCode}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          border: 'none',
                          background: 'none',
                          color: 'var(--color-burnt-coral)',
                          fontWeight: 700,
                          cursor: isEmailSending ? 'not-allowed' : 'pointer',
                          fontSize: '0.88rem',
                          textDecoration: 'underline',
                          padding: '6px 12px'
                        }}
                      >
                        {isEmailSending ? (
                          <span className="spinner-mini"></span>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="23 4 23 10 17 10" />
                              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                            </svg>
                            <span>{t('ui', 'auth_resend_btn')}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Inline Error Toast */}
                  {errorMessage && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.65rem 1rem',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.05) 100%)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      width: '100%',
                      boxSizing: 'border-box',
                      animation: 'seenly-shake 0.35s cubic-bezier(0.36,0.07,0.19,0.97) both'
                    }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <p style={{
                        margin: 0,
                        fontSize: '0.82rem',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 600,
                        color: '#dc2626',
                        lineHeight: 1.4
                      }}>{errorMessage}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="seenly-wizard-footer-action">
                <button
                  type="button"
                  className="seenly-wizard-primary-btn"
                  disabled={isVerifying || verificationCode.some(c => !c)}
                  onClick={handleVerifyCode}
                >
                  {isVerifying ? (
                    <span>...</span>
                  ) : (
                    <>
                      <span>{t('ui', 'auth_otp_btn')}</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="seenly-wizard-arrow-icon">
                        <line x1="4" y1="12" x2="20" y2="12" />
                        <polyline points="13 5 20 12 13 19" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {currentIndex === -2 && (
            /* Step 1: Nickname Input */
            <>
              <div className="seenly-wizard-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <div className="seenly-wizard-circle-icon icon-peach" style={{ margin: '0 auto 1.5rem auto' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h2 className="seenly-wizard-title" style={{ textAlign: 'center', width: '100%' }}>{t('ui', 'wizard_nickname_title')}</h2>
                <div className="seenly-wizard-input-container" style={{ width: '100%', maxWidth: '400px', margin: '0 auto 1rem auto' }}>
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="name"
                    autoCapitalize="words"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder={t('ui', 'wizard_nickname_placeholder')}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={15}
                    required
                    autoFocus
                    className="seenly-wizard-input"
                    style={{ fontSize: '1.05rem' }}
                  />
                  {displayName.trim().length > 0 && displayName.trim().length < 2 && (
                    <p style={{ color: 'var(--color-error, #ef4444)', fontSize: '0.85rem', marginTop: '0.5rem', textAlign: 'center' }}>
                      {langCode === 'tr' ? 'İsminiz en az 2 karakter olmalıdır.' : 'Your name must be at least 2 characters.'}
                    </p>
                  )}
                </div>
              </div>
              <div className="seenly-wizard-footer-action">
                <button
                  type="button"
                  className="seenly-wizard-primary-btn"
                  disabled={displayName.trim().length < 2}
                  onClick={() => setCurrentIndex(-4)}
                >
                  <span>{t('ui', 'wizard_continue_btn')}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="seenly-wizard-arrow-icon">
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <polyline points="13 5 20 12 13 19" />
                  </svg>
                </button>
              </div>
            </>
          )}

          {currentIndex === -4 && (
            /* Step 3: Before You Begin */
            <>
              <div className="seenly-wizard-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '0.5rem 0' }}>
                <div className="seenly-wizard-circle-icon icon-purple" style={{ margin: '0 auto 0.75rem auto' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <h2 className="seenly-wizard-title" style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-deep-ink)', marginBottom: '0.75rem', textAlign: 'center', width: '100%' }}>
                  {t('ui', 'wizard_info_title')}
                </h2>

                <ul className="seenly-wizard-info-bullets" style={{ width: '100%', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                  <li>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-burnt-coral)', flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{t('ui', 'wizard_info_bullet1')}</span>
                  </li>
                  <li>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-burnt-coral)', flexShrink: 0 }}>
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                    </svg>
                    <span>{t('ui', 'wizard_info_bullet2')}</span>
                  </li>
                  <li>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-burnt-coral)', flexShrink: 0 }}>
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    <span>{t('ui', 'wizard_info_bullet3')}</span>
                  </li>
                </ul>
              </div>
              <div className="seenly-wizard-footer-action">
                <button
                  type="button"
                  className="seenly-wizard-primary-btn"
                  onClick={() => setCurrentIndex(0)}
                >
                  {t('ui', 'wizard_info_cta')}
                </button>
              </div>
            </>
          )}

          {currentIndex >= 0 && (
            /* Step 4: Quiz Questions */
            <>
              <div className="seenly-wizard-content">
                <h2 className="seenly-wizard-title question-text">
                  {t('questions', SELF_QUESTION_IDS[currentIndex])}
                </h2>
                <div className="seenly-wizard-list-container">
                  {[
                    { value: 1, label: t('ui', 'agreement_strongly_disagree') },
                    { value: 2, label: t('ui', 'agreement_disagree') },
                    { value: 3, label: t('ui', 'agreement_neutral') },
                    { value: 4, label: t('ui', 'agreement_agree') },
                    { value: 5, label: t('ui', 'agreement_strongly_agree') }
                  ].map((opt) => {
                    const questionId = SELF_QUESTION_IDS[currentIndex];
                    const isActive = answers[questionId] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className={`seenly-wizard-list-btn ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          setAnswers(prev => ({ ...prev, [questionId]: opt.value }));
                        }}
                      >
                        <span>{opt.label}</span>
                        {isActive && <span className="seenly-wizard-checkmark">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="seenly-wizard-footer-action">
                <button
                  type="button"
                  className="seenly-wizard-primary-btn"
                  disabled={answers[SELF_QUESTION_IDS[currentIndex]] === undefined}
                  onClick={() => {
                    if (currentIndex < SELF_QUESTION_IDS.length - 1) {
                      setCurrentIndex(prev => prev + 1);
                    } else {
                      setCurrentIndex(-9);
                    }
                  }}
                >
                  {t('ui', 'wizard_next_btn')}
                </button>
              </div>
            </>
          )}

          {currentIndex === -9 && (
            /* Step 5: Avatar Selection Screen (Post-quiz, Pre-email) */
            <>
              <div className="seenly-wizard-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '0.2rem 0', boxSizing: 'border-box' }}>
                {/* Header Icon */}
                <div className="seenly-wizard-circle-icon icon-purple" style={{ margin: '0 auto 0.6rem auto', width: '48px', height: '48px', flexShrink: 0 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>

                {/* Title */}
                <h2 className="seenly-wizard-title" style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-deep-ink)', marginBottom: '0.35rem', textAlign: 'center', width: '100%', fontSize: '1.5rem', lineHeight: '1.2' }}>
                  {langCode === 'tr' ? 'Avatarını Seç' : 'Choose Your Avatar'}
                </h2>

                {/* Subtitle */}
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.84rem',
                  color: 'rgba(11, 27, 44, 0.65)',
                  textAlign: 'center',
                  margin: '0 auto 0.75rem auto',
                  maxWidth: '340px',
                  lineHeight: '1.4'
                }}>
                  {langCode === 'tr'
                    ? 'Profilinde ve arkadaşlarına ileteceğin test kartlarında yer alacak avatarını belirle.'
                    : 'Select the avatar that will represent you on your profile and test cards.'}
                </p>

                {/* Filter Pills */}
                <div className="seenly-onboarding-avatar-filters">
                  <button
                    type="button"
                    onClick={() => setAvatarFilter('all')}
                    className={`seenly-onboarding-filter-pill ${avatarFilter === 'all' ? 'active' : ''}`}
                  >
                    {langCode === 'tr' ? 'Tümü (12)' : 'All (12)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarFilter('kadin')}
                    className={`seenly-onboarding-filter-pill ${avatarFilter === 'kadin' ? 'active' : ''}`}
                  >
                    {langCode === 'tr' ? 'Kadın (6)' : 'Women (6)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarFilter('erkek')}
                    className={`seenly-onboarding-filter-pill ${avatarFilter === 'erkek' ? 'active' : ''}`}
                  >
                    {langCode === 'tr' ? 'Erkek (6)' : 'Men (6)'}
                  </button>
                </div>

                {/* Responsive Avatar Grid */}
                <div className="seenly-onboarding-avatar-grid">
                  {filteredAvatars.map((av) => {
                    const isSelected = selectedAvatar === av.id;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => {
                          setSelectedAvatar(av.id);
                          sessionStorage.setItem('seenly_avatar', av.id);
                          localStorage.setItem('seenly_avatar', av.id);
                        }}
                        className={`seenly-onboarding-avatar-item ${isSelected ? 'is-selected' : ''}`}
                        aria-label={av.label}
                        title={av.label}
                      >
                        <div className="seenly-onboarding-avatar-circle">
                          <img
                            src={av.src}
                            alt={av.label}
                            className="seenly-onboarding-avatar-img"
                          />
                          {isSelected && (
                            <span className="seenly-onboarding-avatar-check">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <div className="seenly-wizard-footer-action">
                <button
                  type="button"
                  className="seenly-wizard-primary-btn"
                  onClick={() => {
                    if (!selectedAvatar) {
                      setSelectedAvatar('kadin1');
                      sessionStorage.setItem('seenly_avatar', 'kadin1');
                      localStorage.setItem('seenly_avatar', 'kadin1');
                    }
                    setCurrentIndex(-10);
                  }}
                >
                  <span>{t('ui', 'wizard_continue_btn') || 'Devam Et'}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="seenly-wizard-arrow-icon">
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <polyline points="13 5 20 12 13 19" />
                  </svg>
                </button>
              </div>

              <style>{`
                .seenly-onboarding-avatar-filters {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 8px;
                  margin-bottom: 0.75rem;
                }

                .seenly-onboarding-filter-pill {
                  padding: 4px 12px;
                  border-radius: 999px;
                  border: 1px solid rgba(197, 160, 89, 0.35);
                  background: #FAF6ED;
                  color: #6B5542;
                  font-family: var(--font-sans);
                  font-size: 0.76rem;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.2s ease;
                }

                .seenly-onboarding-filter-pill:hover {
                  color: #0B1B2C;
                  border-color: rgba(197, 160, 89, 0.65);
                  background: #F4EEDF;
                }

                .seenly-onboarding-filter-pill.active {
                  background: #0B1B2C;
                  color: #FFFFFF;
                  border-color: #0B1B2C;
                  box-shadow: 0 2px 8px rgba(11, 27, 44, 0.18);
                }

                .seenly-onboarding-avatar-grid {
                  display: grid;
                  grid-template-columns: repeat(4, 1fr);
                  gap: 10px;
                  width: 100%;
                  max-width: 360px;
                  margin: 0 auto;
                  max-height: clamp(230px, 36vh, 290px);
                  overflow-y: auto;
                  padding: 4px 4px 8px;
                  box-sizing: border-box;
                }

                .seenly-onboarding-avatar-grid::-webkit-scrollbar {
                  width: 4px;
                }
                .seenly-onboarding-avatar-grid::-webkit-scrollbar-track {
                  background: transparent;
                }
                .seenly-onboarding-avatar-grid::-webkit-scrollbar-thumb {
                  background: rgba(197, 160, 89, 0.35);
                  border-radius: 4px;
                }

                .seenly-onboarding-avatar-item {
                  padding: 0;
                  border: none;
                  background: transparent;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  outline: none;
                  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .seenly-onboarding-avatar-item:hover {
                  transform: translateY(-2px) scale(1.06);
                }

                .seenly-onboarding-avatar-item.is-selected {
                  transform: scale(1.06);
                }

                .seenly-onboarding-avatar-circle {
                  position: relative;
                  width: 62px;
                  height: 62px;
                  border-radius: 50%;
                  padding: 2px;
                  border: 2px solid rgba(197, 160, 89, 0.28);
                  box-sizing: border-box;
                  transition: all 0.2s ease;
                  background: #FDFBF4;
                }

                .seenly-onboarding-avatar-item:hover .seenly-onboarding-avatar-circle {
                  border-color: rgba(197, 160, 89, 0.65);
                  box-shadow: 0 4px 12px rgba(197, 160, 89, 0.22);
                }

                .seenly-onboarding-avatar-item.is-selected .seenly-onboarding-avatar-circle {
                  border-color: #C5A059;
                  border-width: 2.5px;
                  box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.25), 0 6px 16px rgba(80, 60, 40, 0.18);
                }

                .seenly-onboarding-avatar-img {
                  width: 100%;
                  height: 100%;
                  border-radius: 50%;
                  object-fit: cover;
                  display: block;
                }

                .seenly-onboarding-avatar-check {
                  position: absolute;
                  bottom: -2px;
                  right: -2px;
                  width: 18px;
                  height: 18px;
                  border-radius: 50%;
                  background: #C5A059;
                  color: #ffffff;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border: 2px solid #FDFBF4;
                  box-shadow: 0 2px 6px rgba(11, 27, 44, 0.2);
                }

                @media (max-width: 380px) {
                  .seenly-onboarding-avatar-grid {
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                    max-height: 240px;
                  }
                  .seenly-onboarding-avatar-circle {
                    width: 56px;
                    height: 56px;
                  }
                }
              `}</style>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
