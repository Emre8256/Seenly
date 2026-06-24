import React, { useState, useEffect, useRef } from 'react';
import { useLocale } from '../context/LocaleContext';
import QuestionCard from '../components/QuestionCard';
import AppShell from '../components/AppShell';
import { createSeenly, sendVerificationCode, verifyCode, loginWithEmail } from '../services/api';
import hiwStep1 from '../images/kart1.png';
import hiwStep2 from '../images/kart2.png';
import hiwStep3 from '../images/kart3.png';
import hiwStep4 from '../images/kart4.png';

import { CARD_IMAGES } from '../images/cardImages';

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

const calculatePersonalityCard = (answers) => {
  if (!answers || Object.keys(answers).length === 0) {
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
    const selfKey = `classic_self_${key}_01`;
    if (answers[selfKey] !== undefined) {
      const num = Number(answers[selfKey]);
      return ((num - 1) / 4) * 100;
    }
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

  const SUPPORTED_LANGS = [
    { code: 'tr', label: 'Türkçe' },
    { code: 'en', label: 'English' },
  ];

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

  // 1. Session Storage State Restoration
  const [displayName, setDisplayName] = useState(() => {
    return sessionStorage.getItem('seenly_displayName') || '';
  });

  const [email, setEmail] = useState(() => {
    return sessionStorage.getItem('seenly_email') || '';
  });

  const [verificationCode, setVerificationCode] = useState(Array(6).fill(''));
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = React.useRef([]);

  // Post-quiz verification flow state
  const [postQuizOtp, setPostQuizOtp] = useState(Array(6).fill(''));
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
    return Number(sessionStorage.getItem('seenly_currentIndex') || -1); // -1 is landing page, -5 is Email Entry, -6 is Code Entry, -2 is Nickname, -3 is Language, -4 is Info
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [selectedLang, setSelectedLang] = useState(() => {
    return sessionStorage.getItem('seenly_selectedLang') || locale;
  });

  const [quizResult, setQuizResult] = useState(null);
  const [isQuickLogin, setIsQuickLogin] = useState(() => {
    return sessionStorage.getItem('seenly_isQuickLogin') === 'true';
  });

  useEffect(() => {
    sessionStorage.setItem('seenly_isQuickLogin', isQuickLogin ? 'true' : 'false');
  }, [isQuickLogin]);

  useEffect(() => {
    const handleTriggerLogin = () => {
      setIsQuickLogin(true);
      setCurrentIndex(-5);
    };
    const handleTriggerStartQuiz = () => {
      setIsQuickLogin(false);
      setCurrentIndex(-2);
    };
    window.addEventListener('seenly_trigger_login', handleTriggerLogin);
    window.addEventListener('seenly_trigger_start_quiz', handleTriggerStartQuiz);
    return () => {
      window.removeEventListener('seenly_trigger_login', handleTriggerLogin);
      window.removeEventListener('seenly_trigger_start_quiz', handleTriggerStartQuiz);
    };
  }, []);

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

  useEffect(() => {
    setErrorMessage('');
  }, [currentIndex]);

  useEffect(() => {
    sessionStorage.setItem('seenly_selectedLang', selectedLang);
  }, [selectedLang]);

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
      if (isQuickLogin) {
        setCurrentIndex(-6);
      } else {
        setCurrentIndex(-1);
      }
    } else if (currentIndex === -6) {
      setCurrentIndex(-5);
    } else if (currentIndex === -5) {
      setIsQuickLogin(false);
      setCurrentIndex(-1);
    } else if (currentIndex === -10) {
      setCurrentIndex(SELF_QUESTION_IDS.length - 1);
    } else if (currentIndex === -11) {
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
      const response = await createSeenly(displayName, email, selfAnswersPayload);

      // Save owner token locally
      localStorage.setItem('seenly_owner_token', response.ownerToken);

      // Clear session values
      sessionStorage.removeItem('seenly_displayName');
      sessionStorage.removeItem('seenly_email');
      sessionStorage.removeItem('seenly_answers');
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
    setIsEmailSending(true);
    setErrorMessage('');
    try {
      await sendVerificationCode(email, isQuickLogin);
      setVerificationCode(Array(6).fill('')); // reset verification code
      setCurrentIndex(-6);
    } catch (err) {
      setErrorMessage(err.message || 'Error sending verification code.');
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleCodeDigitChange = (element, index) => {
    const val = element.value.replace(/[^0-9]/g, '');
    const newCode = [...verificationCode];
    newCode[index] = val ? val.substring(val.length - 1) : '';
    setVerificationCode(newCode);

    // Auto focus next input
    if (val && index < 5 && inputRefs.current[index + 1]) {
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
    const pasteText = e.clipboardData.getData('text').replace(/[^0-9]/g, '').substring(0, 6);
    if (pasteText.length === 6) {
      const digits = pasteText.split('');
      setVerificationCode(digits);
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
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
    const val = element.value.replace(/[^0-9]/g, '');
    const newCode = [...postQuizOtp];
    newCode[index] = val ? val.substring(val.length - 1) : '';
    setPostQuizOtp(newCode);

    // Auto focus next input
    if (val && index < 5 && postQuizOtpRefs.current[index + 1]) {
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
    const pasteText = e.clipboardData.getData('text').replace(/[^0-9]/g, '').substring(0, 6);
    if (pasteText.length === 6) {
      const digits = pasteText.split('');
      setPostQuizOtp(digits);
      if (postQuizOtpRefs.current[5]) {
        postQuizOtpRefs.current[5].focus();
      }
    }
  };

  const handlePostQuizSendCode = async () => {
    setIsEmailSending(true);
    setErrorMessage('');
    setAuthFlowNotification({ message: '', status: '' });
    try {
      await sendVerificationCode(email, false);
      setPostQuizOtp(Array(6).fill('')); // reset 6-digit code
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
    progressPercentage = 38 + ((currentIndex + 1) / SELF_QUESTION_IDS.length) * 48;
  } else if (currentIndex === -10) {
    progressPercentage = 91;
  } else if (currentIndex === -11) {
    progressPercentage = 96;
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
    const signatureId = quizResult?.resultSnapshot?.selfSignatureId || calculatePersonalityCard(answers);
    const signature = getObject('signatures', signatureId);
    const signatureName = signature ? signature.name : t('ui', 'missing_id_fallback');
    const signatureOneLine = signature ? signature.oneLine : "";
    const signatureCardLine = signature ? signature.cardLine : "";
    const signatureImage = SIGNATURE_IMAGES[signatureId];

    return (
      <div className="seenly-wizard-wrapper">
        <div className="seenly-wizard-container">
          <style>{`
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
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
          <header className="seenly-wizard-header">
            {isPostQuizFlow ? (
              <button
                type="button"
                className="seenly-wizard-back-btn"
                onClick={handleGoBack}
                aria-label="Go back"
              >
                ←
              </button>
            ) : (
              <div style={{ width: 40 }} />
            )}
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
                aria-label="Dil seç"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span>{locale.toUpperCase()}</span>
                <svg className={`lang-dropdown-chevron ${langOpen ? 'open' : ''}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
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
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* Show inline notifications/error messages during post-quiz flow */}
          {isPostQuizFlow && (authFlowNotification.message || errorMessage) && (
            <div style={{ padding: '1rem 2rem 0 2rem' }}>
              <div 
                className="editorial-card" 
                style={{ 
                  borderColor: authFlowNotification.status === 'success' ? '#2e7d32' : 'red', 
                  color: authFlowNotification.status === 'success' ? '#2e7d32' : 'red', 
                  padding: '0.75rem', 
                  margin: 0,
                  fontSize: '0.88rem',
                  backgroundColor: authFlowNotification.status === 'success' ? '#e8f5e9' : '#ffebee'
                }}
              >
                <p style={{ margin: 0 }}>{authFlowNotification.message || errorMessage}</p>
              </div>
            </div>
          )}

          {/* Wizard Body */}
          <div className="seenly-wizard-body seenly-wizard-result-body" style={{ position: 'relative' }}>
            <div className="seenly-wizard-content" style={{ position: 'relative' }}>

              {/* Elegant Custom Archetype Card */}
              <div 
                className="seenly-wizard-result-card"
                style={{
                  filter: isPostQuizFlow ? 'blur(16px)' : 'blur(0)',
                  transition: 'filter 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  pointerEvents: isPostQuizFlow ? 'none' : 'auto',
                  opacity: isPostQuizFlow ? 0.65 : 1
                }}
              >
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-burnt-coral)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '0.5rem'
                }}>
                  ✦ {t('ui', 'self_view_title')} ✦
                </div>

                <h3 className="seenly-wizard-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>
                  {signatureName}
                </h3>

                {signatureImage && (
                  <img
                    src={signatureImage}
                    alt={signatureName}
                    className="seenly-wizard-result-img"
                  />
                )}

                {signatureCardLine && (
                  <p style={{
                    fontSize: '0.9rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: '1.4',
                    fontStyle: 'italic',
                    marginTop: '0.25rem'
                  }}>
                    "{signatureCardLine}"
                  </p>
                )}
              </div>

              {/* Description Abstract Lines underneath the card */}
              <div 
                className="seenly-wizard-placeholder-lines seenly-wizard-result-lines"
                style={{
                  filter: isPostQuizFlow ? 'blur(8px)' : 'blur(0)',
                  transition: 'filter 0.8s ease',
                  opacity: isPostQuizFlow ? 0.3 : 1
                }}
              >
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  color: 'var(--color-text-primary)',
                  fontWeight: 500,
                  margin: '0 0 0.5rem 0'
                }}>
                  {signatureOneLine}
                </p>
                <div className="seenly-wizard-line w-full"></div>
                <div className="seenly-wizard-line w-80"></div>
              </div>

              {/* POST-QUIZ AUTH OVERLAYS (on top of the blurred card) */}
              {isPostQuizFlow && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '2rem',
                  zIndex: 10,
                  boxSizing: 'border-box'
                }}>
                  {currentIndex === -10 ? (
                    /* Step 1: Mail Input */
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '20px',
                      padding: '2rem 1.5rem',
                      width: '100%',
                      maxWidth: '360px',
                      textAlign: 'center',
                      boxShadow: '0 10px 30px rgba(11, 27, 44, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.6)',
                      animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                      <div className="seenly-wizard-circle-icon icon-peach" style={{ margin: '0 auto 1rem auto' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <h4 style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: 'var(--color-deep-ink)',
                        marginBottom: '0.75rem',
                        letterSpacing: '0.05em'
                      }}>
                        {t('ui', 'auth_mail_title')}
                      </h4>
                      <p style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.88rem',
                        lineHeight: '1.5',
                        color: 'var(--color-text-muted)',
                        marginBottom: '1.5rem'
                      }}>
                        {t('ui', 'auth_mail_desc')}
                      </p>
                      <div className="seenly-wizard-input-container" style={{ marginBottom: '1.25rem' }}>
                        <input
                          type="email"
                          placeholder={t('ui', 'auth_mail_placeholder')}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoFocus
                          className="seenly-wizard-input"
                          style={{
                            textAlign: 'center',
                            fontSize: '1rem',
                            padding: '0.85rem'
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && email.trim() && email.includes('@') && !isEmailSending) {
                              handlePostQuizSendCode();
                            }
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className="seenly-wizard-primary-btn"
                        style={{
                          width: '100%',
                          borderRadius: '12px',
                          padding: '0.85rem',
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          backgroundColor: 'var(--color-burnt-coral)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          transition: 'all 0.3s ease'
                        }}
                        disabled={isEmailSending || !email.trim() || !email.includes('@')}
                        onClick={handlePostQuizSendCode}
                      >
                        {isEmailSending ? (
                          <span className="spinner-mini"></span>
                        ) : (
                          t('ui', 'auth_mail_btn')
                        )}
                      </button>
                    </div>
                  ) : (
                    /* Step 2: 4-Digit OTP Input */
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '20px',
                      padding: '2rem 1.5rem',
                      width: '100%',
                      maxWidth: '360px',
                      textAlign: 'center',
                      boxShadow: '0 10px 30px rgba(11, 27, 44, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.6)',
                      animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                      <div className="seenly-wizard-circle-icon icon-purple" style={{ margin: '0 auto 1rem auto' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <h4 style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: 'var(--color-deep-ink)',
                        marginBottom: '0.5rem',
                        letterSpacing: '0.05em'
                      }}>
                        {t('ui', 'auth_otp_title')}
                      </h4>
                      <p style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.85rem',
                        lineHeight: '1.4',
                        color: 'var(--color-text-muted)',
                        marginBottom: '1.25rem'
                      }}>
                        {t('ui', 'auth_otp_desc')}
                      </p>
                      
                      {/* 6 Digit OTP Inputs */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '10px',
                        width: '100%',
                        maxWidth: '360px',
                        margin: '0 auto 1.5rem auto'
                      }}>
                        {Array(6).fill('').map((_, i) => (
                          <input
                            key={i}
                            ref={(el) => (postQuizOtpRefs.current[i] = el)}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={postQuizOtp[i] || ''}
                            onChange={(e) => handlePostQuizOtpDigitChange(e.target, i)}
                            onKeyDown={(e) => handlePostQuizOtpKeyDown(e, i)}
                            onPaste={handlePostQuizOtpPaste}
                            style={{
                              width: '46px',
                              height: '56px',
                              borderRadius: '12px',
                              border: '1.5px solid rgba(11, 27, 44, 0.12)',
                              textAlign: 'center',
                              fontSize: '1.5rem',
                              fontFamily: 'var(--font-serif)',
                              fontWeight: '700',
                              color: 'var(--color-deep-ink)',
                              backgroundColor: '#fff',
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

                      <button
                        type="button"
                        className="seenly-wizard-primary-btn"
                        style={{
                          width: '100%',
                          borderRadius: '12px',
                          padding: '0.85rem',
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          backgroundColor: 'var(--color-burnt-coral)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          transition: 'all 0.3s ease'
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

            {!isPostQuizFlow && (
              <div className="seenly-wizard-footer-action">
                <button
                  type="button"
                  className="seenly-wizard-primary-btn"
                  onClick={() => {
                    if (onComplete) onComplete(quizResult.ownerToken);
                  }}
                >
                  {t('ui', 'quiz_completion_cta')} →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentIndex === -1) {
    return (
      <AppShell
        isLanding={true}
        onStartClick={() => {
          setIsQuickLogin(false);
          setCurrentIndex(-2);
        }}
      >
        <div className="landing-content-container">
          <div id="hero-section">
            <div className="hero-container">
              {/* Left Column: Branding, Copy, CTAs, and Social Proof */}
              <section className="hero-text-side">
                <div className="badge-signal">
                  {t('ui', 'badge_text')}
                </div>

                <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: t('ui', 'landing_title_html') }} />

                <p className="hero-description">
                  {t('ui', 'landing_description_mock')}
                </p>

                <div className="cta-group">
                  <button
                    onClick={() => {
                      setIsQuickLogin(false);
                      setCurrentIndex(-2);
                    }}
                    className="btn-editorial btn-dark btn-hero"
                  >
                    {t('ui', 'create_my_seenly_btn')}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setIsQuickLogin(true);
                      setCurrentIndex(-5);
                    }}
                    className="btn-editorial btn-light btn-hero"
                  >
                    {t('ui', 'learn_more_btn')}
                  </button>
                </div>

                <div className="privacy-notice">
                  <span className="lock-icon">▲</span> {t('ui', 'anonymous_no_signup')}
                </div>

                {/* Separator line for mobile */}
                <div className="hero-divider"></div>

                {/* Social Proof (Avatar Stacks) */}
                <div className="social-proof">
                  <div className="avatar-group">
                    <div className="avatar" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80')" }}></div>
                    <div className="avatar" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80')" }}></div>
                    <div className="avatar" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80')" }}></div>
                    <div className="avatar" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=100&h=100&q=80')" }}></div>
                    <div className="avatar" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80')" }}></div>
                  </div>
                  <span className="proof-text">
                    <strong>25K+</strong> {t('ui', 'social_proof_answers')}
                  </span>
                </div>
              </section>
            </div>
          </div>

          <div id="how-it-works" style={{ marginBottom: '6rem' }}>
            <div className="how-it-works-inner">
              <h3 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.35rem, 2.5vw, 1.85rem)',
                textAlign: 'center',
                marginBottom: '2.5rem',
                fontWeight: 900,
                color: 'var(--color-deep-ink)'
              }}>
                {t('ui', 'how_it_works_title')}
              </h3>

              <div className="how-it-works-grid">
                {[1, 2, 3, 4].map((stepNum) => (
                  <div key={stepNum} className="hiw-card">
                    {/* Circle milestone indicator with luxury tab */}
                    <div className="hiw-badge-tab">
                      <div className="hiw-badge-circle">
                        {stepNum}
                      </div>
                    </div>

                    <h4 className="hiw-title">
                      {t('ui', `how_it_works_step${stepNum}_title`).replace(/^\d+\.\s*/, '')}
                    </h4>

                    {/* Step Graphics matching mockup */}
                    <div className="hiw-visual-container">
                      {stepNum === 1 && <img src={hiwStep1} alt="Step 1" className="hiw-step-img" />}
                      {stepNum === 2 && <img src={hiwStep2} alt="Step 2" className="hiw-step-img" />}
                      {stepNum === 3 && <img src={hiwStep3} alt="Step 3" className="hiw-step-img" />}
                      {stepNum === 4 && <img src={hiwStep4} alt="Step 4" className="hiw-step-img" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>


        </div>
      </AppShell>
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
            aria-label="Go back"
            style={currentIndex === -5 || currentIndex === -6 ? { 
              width: '44px', 
              height: '44px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(11, 27, 44, 0.05)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--color-deep-ink)',
              transition: 'all 0.2s',
              flexShrink: 0
            } : {}}
          >
            ←
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
          <div className="seenly-wizard-step-lang" ref={langRef}>
            {!(currentIndex === -5 || currentIndex === -6) && (
              <span className="seenly-wizard-step-info">
                {currentIndex === -4 ? `1/${SELF_QUESTION_IDS.length}` : (currentIndex >= 0 ? `${currentIndex + 1}/${SELF_QUESTION_IDS.length}` : '···')}
              </span>
            )}
            <button
              type="button"
              className="lang-dropdown-trigger"
              onClick={() => setLangOpen(prev => !prev)}
              aria-label="Dil seç"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span>{locale.toUpperCase()}</span>
              <svg className={`lang-dropdown-chevron ${langOpen ? 'open' : ''}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
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
                        <polyline points="20 6 9 17 4 12"/>
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
          {currentIndex === -5 && (
            /* Step A: Email Entry */
            <>
              <div className="seenly-wizard-content">
                <div className="seenly-wizard-circle-icon icon-peach">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h2 className="seenly-wizard-title" style={{ marginBottom: '0.75rem' }}>
                  {isQuickLogin
                    ? t('ui', 'email_entry_quick_login_title')
                    : t('ui', 'email_entry_new_profile_title')}
                </h2>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.92rem',
                  color: 'var(--color-text-muted)',
                  marginTop: '0',
                  marginBottom: '1.5rem',
                  textAlign: 'center',
                  lineHeight: '1.5',
                  maxWidth: '360px',
                  boxSizing: 'border-box',
                  padding: '0 1rem'
                }}>
                  {isQuickLogin
                    ? t('ui', 'email_entry_quick_login_desc')
                    : t('ui', 'email_entry_new_profile_desc')}
                </p>
                <div className="seenly-wizard-input-container">
                  <input
                    type="email"
                    placeholder={locale === 'tr' ? 'adiniz@ornek.com' : 'you@example.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="seenly-wizard-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && email.trim() && email.includes('@')) {
                        handleSendCode();
                      }
                    }}
                  />
                </div>
              </div>
              <div className="seenly-wizard-footer-action">
                <button
                  type="button"
                  className="seenly-wizard-primary-btn"
                  disabled={isEmailSending || !email.trim() || !email.includes('@')}
                  onClick={handleSendCode}
                >
                  {isEmailSending ? (
                    <span>...</span>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="seenly-wizard-arrow-icon">
                      <line x1="4" y1="12" x2="20" y2="12" />
                      <polyline points="13 5 20 12 13 19" />
                    </svg>
                  )}
                </button>
              </div>
            </>
          )}

          {currentIndex === -6 && (
            /* Step B: 6-Digit Code Verification */
            <>
              <div className="seenly-wizard-content">
                <div className="seenly-wizard-circle-icon icon-purple">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h2 className="seenly-wizard-title">
                  {t('ui', 'otp_entry_title')}
                </h2>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.88rem',
                  color: 'var(--color-text-muted)',
                  marginTop: '-1rem',
                  marginBottom: '2rem',
                  textAlign: 'center',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  {t('ui', 'otp_entry_desc').replace('{email}', email)}
                </p>

                {/* 6 Digit Input Group */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '10px',
                  width: '100%',
                  maxWidth: '360px',
                  margin: '0 auto 1.5rem auto'
                }}>
                  {Array(6).fill('').map((_, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={verificationCode[i] || ''}
                      onChange={(e) => handleCodeDigitChange(e.target, i)}
                      onKeyDown={(e) => handleCodeKeyDown(e, i)}
                      onPaste={handleCodePaste}
                      style={{
                        width: '46px',
                        height: '56px',
                        borderRadius: '12px',
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
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="seenly-wizard-arrow-icon">
                      <line x1="4" y1="12" x2="20" y2="12" />
                      <polyline points="13 5 20 12 13 19" />
                    </svg>
                  )}
                </button>
              </div>
            </>
          )}

          {currentIndex === -2 && (
            /* Step 1: Nickname Input */
            <>
              <div className="seenly-wizard-content">
                <div className="seenly-wizard-circle-icon icon-peach">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h2 className="seenly-wizard-title">{t('ui', 'wizard_nickname_title')}</h2>
                <div className="seenly-wizard-input-container">
                  <input
                    type="text"
                    placeholder={t('ui', 'wizard_nickname_placeholder')}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={18}
                    required
                    autoFocus
                    className="seenly-wizard-input"
                  />
                </div>
              </div>
              <div className="seenly-wizard-footer-action">
                <button
                  type="button"
                  className="seenly-wizard-primary-btn"
                  disabled={displayName.trim().length < 2}
                  onClick={() => setCurrentIndex(-4)}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="seenly-wizard-arrow-icon">
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
              <div className="seenly-wizard-content">
                <div className="seenly-wizard-circle-icon icon-purple">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <h2 className="seenly-wizard-title">{t('ui', 'wizard_info_title')}</h2>

                {/* Visual abstract mockup lines */}
                <div className="seenly-wizard-placeholder-lines">
                  <div className="seenly-wizard-line w-full"></div>
                  <div className="seenly-wizard-line w-80"></div>
                  <div className="seenly-wizard-line w-60"></div>
                </div>

                <ul className="seenly-wizard-info-bullets">
                  <li>{t('ui', 'wizard_info_bullet1')}</li>
                  <li>{t('ui', 'wizard_info_bullet2')}</li>
                  <li>{t('ui', 'wizard_info_bullet3')}</li>
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
                      setCurrentIndex(-10);
                    }
                  }}
                >
                  {t('ui', 'wizard_next_btn')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

