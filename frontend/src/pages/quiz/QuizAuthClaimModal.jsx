import React, { memo } from 'react';
import { useLocale } from '../../context/LocaleContext';

const QuizAuthClaimModal = memo(function QuizAuthClaimModal({
  currentIndex,
  email,
  setEmail,
  emailValidationError,
  setEmailValidationError,
  postQuizOtp,
  postQuizOtpRefs,
  handlePostQuizOtpDigitChange,
  handlePostQuizOtpKeyDown,
  handlePostQuizOtpPaste,
  handlePostQuizSendCode,
  handlePostQuizVerifyCode,
  isEmailSending,
  isVerifying,
  resendTimer,
  formatTimer,
  errorMessage,
  authFlowNotification,
  setAuthFlowNotification,
  onSwitchToLogin,
  isValidEmail,
  langCode,
  locale,
  t: propT
}) {
  const { t: contextT } = useLocale();
  const t = propT || contextT;
  const tr = t;
  const isConflict = authFlowNotification?.status === 'conflict';
  const hasError = !!emailValidationError || (authFlowNotification?.status === 'error') || !!errorMessage;

  return (
    <div
      className="tensignal-wizard-body tensignal-wizard-result-body"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        height: '100%',
        maxHeight: '100%',
        padding: '0.8rem 1.5rem 1.4rem 1.5rem',
        boxSizing: 'border-box'
      }}
    >
      <div
        className="tensignal-wizard-content"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: 'clamp(260px, min(80vw, 40vh), 360px)',
          margin: 'auto 0',
          boxSizing: 'border-box'
        }}
      >
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
              maxWidth: '350px',
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
                {tr('auth.claimTitle')}
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
                {tr('auth.claimDesc')}
              </p>

              {/* Input container */}
              <div className="tensignal-wizard-input-container" style={{ width: '100%', margin: '0.2rem 0 0 0' }}>
                <input
                  type="email"
                  aria-label={tr('auth.emailAddressLabel')}
                  enterKeyHint="go"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder={tr('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailValidationError) setEmailValidationError('');
                    if (authFlowNotification?.status) setAuthFlowNotification?.({ message: '', status: '' });
                  }}
                  required
                  className="tensignal-wizard-input"
                  style={{
                    width: '100%',
                    height: '48px',
                    minHeight: '48px',
                    borderRadius: '16px',
                    border: isConflict
                      ? '1.5px solid rgba(217, 106, 83, 0.65)'
                      : hasError
                        ? '1.5px solid var(--color-error, #ef4444)'
                        : '1.5px solid rgba(11, 27, 44, 0.12)',
                    background: '#ffffff',
                    textAlign: 'center',
                    fontSize: '1rem',
                    fontWeight: '500',
                    boxSizing: 'border-box',
                    boxShadow: isConflict
                      ? '0 0 0 3px rgba(217, 106, 83, 0.12)'
                      : 'inset 0 2px 4px rgba(11, 27, 44, 0.02)'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isValidEmail(email) && !isEmailSending && resendTimer === 0) {
                      handlePostQuizSendCode();
                    }
                  }}
                />

                {/* Conflict Notice Card (409 Conflict) */}
                {isConflict && (
                  <div style={{
                    marginTop: '0.65rem',
                    padding: '0.75rem 0.85rem',
                    borderRadius: '14px',
                    background: 'rgba(255, 248, 242, 0.95)',
                    border: '1px solid rgba(217, 106, 83, 0.3)',
                    boxShadow: '0 4px 16px rgba(217, 106, 83, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.45rem',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    animation: 'fadeInUp 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-burnt-coral)' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9a3412' }}>
                        {tr('auth.accountExists')}
                      </span>
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: '0.78rem',
                      lineHeight: '1.4',
                      color: '#7c2d12',
                      fontWeight: 500
                    }}>
                      {authFlowNotification.message}
                    </p>
                    {onSwitchToLogin && (
                      <button
                        type="button"
                        onClick={onSwitchToLogin}
                        style={{
                          marginTop: '0.2rem',
                          padding: '0.35rem 0.9rem',
                          borderRadius: '10px',
                          border: '1px solid rgba(217, 106, 83, 0.35)',
                          backgroundColor: '#ffffff',
                          color: 'var(--color-burnt-coral)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 2px 6px rgba(217, 106, 83, 0.1)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span>{tr('auth.logIn')}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}

                {/* Standard validation error */}
                {emailValidationError && !isConflict && (
                  <p style={{ color: 'var(--color-error, #ef4444)', fontSize: '0.82rem', marginTop: '0.35rem', textAlign: 'center', fontWeight: '600' }}>
                    {emailValidationError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                className="tensignal-wizard-primary-btn"
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
                  tr('auth.resendCodeWithTimer', { time: formatTimer(resendTimer) })
                ) : (
                  tr('auth.sendCodeBtn')
                )}
              </button>
            </div>
          ) : (
            /* Step 2: 4-Digit OTP Input */
            <div style={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              maxWidth: '350px',
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
                {tr('auth.otpTitle')}
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
                {tr('auth.otpDesc', { email })}
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
                  {tr('auth.verificationCodeHeader')}
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
                      aria-label={tr('auth.verificationDigit', { index: i + 1 })}
                      maxLength={1}
                      value={postQuizOtp[i] || ''}
                      onChange={(e) => {
                        handlePostQuizOtpDigitChange(e.target, i);
                        if (authFlowNotification?.status) setAuthFlowNotification?.({ message: '', status: '' });
                      }}
                      onKeyDown={(e) => handlePostQuizOtpKeyDown(e, i)}
                      onPaste={handlePostQuizOtpPaste}
                      style={{
                        width: '46px',
                        height: '52px',
                        borderRadius: '12px',
                        border: (authFlowNotification?.status === 'error' || errorMessage)
                          ? '1.5px solid rgba(239, 68, 68, 0.65)'
                          : '1.5px solid rgba(11, 27, 44, 0.14)',
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
                        e.target.style.borderColor = (authFlowNotification?.status === 'error' || errorMessage) ? 'rgba(239, 68, 68, 0.65)' : 'rgba(11, 27, 44, 0.14)';
                        e.target.style.boxShadow = 'inset 0 2px 4px rgba(11, 27, 44, 0.02)';
                      }}
                    />
                  ))}
                </div>

                {/* Resend countdown */}
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
                      <span>{tr('auth.resendCountdown', { time: formatTimer(resendTimer) })}</span>
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
                          <span>{tr('auth.resendBtn')}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Error Banner if any */}
                {(errorMessage || authFlowNotification?.status === 'error') && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0.55rem 0.8rem',
                    borderRadius: '12px',
                    background: 'rgba(254, 242, 242, 0.95)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.05)',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p style={{
                      margin: 0,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#dc2626',
                      lineHeight: 1.3
                    }}>
                      {authFlowNotification?.message || errorMessage}
                    </p>
                  </div>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="button"
                className="tensignal-wizard-primary-btn"
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
                  tr('auth.verifyBtn')
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default QuizAuthClaimModal;
