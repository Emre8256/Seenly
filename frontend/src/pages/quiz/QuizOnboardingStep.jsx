import React, { memo } from 'react';

const QuizOnboardingStep = memo(function QuizOnboardingStep({
  currentIndex,
  displayName,
  setDisplayName,
  email,
  setEmail,
  emailValidationError,
  setEmailValidationError,
  verificationCode,
  inputRefs,
  handleCodeDigitChange,
  handleCodeKeyDown,
  handleCodePaste,
  handleSendCode,
  handleVerifyCode,
  isEmailSending,
  isVerifying,
  resendTimer,
  formatTimer,
  errorMessage,
  setErrorMessage,
  authFlowNotification,
  setAuthFlowNotification,
  onStartQuiz,
  isQuickLogin,
  setCurrentIndex,
  isValidEmail,
  langCode,
  locale,
  t
}) {
  const isNotFound = authFlowNotification?.status === 'not_found';
  const isConflict = authFlowNotification?.status === 'conflict';
  const hasError = !!emailValidationError || (authFlowNotification?.status === 'error') || !!errorMessage;

  // Step 1: Quick Login - Email Entry (-5)
  if (currentIndex === -5) {
    return (
      <>
        <div className="seenly-wizard-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', flex: 1 }}>
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

          <div className="seenly-auth-card" style={{
            width: '100%',
            maxWidth: '400px',
            background: 'rgba(255, 253, 250, 0.75)',
            border: isNotFound
              ? '1.5px solid rgba(197, 160, 89, 0.45)'
              : isConflict
                ? '1.5px solid rgba(217, 106, 83, 0.45)'
                : '1px solid rgba(11, 27, 44, 0.08)',
            borderRadius: '20px',
            padding: '1.75rem 1.5rem',
            boxShadow: '0 10px 30px rgba(11, 27, 44, 0.03)',
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
                  if (authFlowNotification?.status) setAuthFlowNotification?.({ message: '', status: '' });
                  if (setErrorMessage) setErrorMessage('');
                }}
                required
                autoFocus
                className="seenly-wizard-input"
                style={{
                  borderColor: isNotFound
                    ? 'rgba(197, 160, 89, 0.75)'
                    : isConflict
                      ? 'rgba(217, 106, 83, 0.75)'
                      : hasError
                        ? 'var(--color-error, #ef4444)'
                        : undefined,
                  fontSize: '1rem',
                  boxShadow: isNotFound
                    ? '0 0 0 3px rgba(197, 160, 89, 0.12)'
                    : isConflict
                      ? '0 0 0 3px rgba(217, 106, 83, 0.12)'
                      : undefined
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isValidEmail(email) && !isEmailSending && resendTimer === 0) {
                    handleSendCode();
                  }
                }}
              />

              {/* 404 Not Found Porcelain Card */}
              {isNotFound && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '14px',
                  background: 'rgba(255, 252, 245, 0.95)',
                  border: '1px solid rgba(197, 160, 89, 0.35)',
                  boxShadow: '0 4px 16px rgba(197, 160, 89, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                  animation: 'fadeInUp 0.3s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#92400e' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      {langCode === 'tr' ? 'Hesap Bulunamadı' : 'Account Not Found'}
                    </span>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '0.8rem',
                    lineHeight: '1.45',
                    color: '#78350f',
                    fontWeight: 500
                  }}>
                    {authFlowNotification.message}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onStartQuiz) {
                        onStartQuiz();
                      } else {
                        setCurrentIndex(-2);
                      }
                    }}
                    style={{
                      marginTop: '0.25rem',
                      padding: '0.45rem 1.1rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(197, 160, 89, 0.45)',
                      backgroundColor: '#0B1B2C',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(11, 27, 44, 0.12)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>{langCode === 'tr' ? 'Testi Başlat' : 'Start Test'}</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Standard Validation Error */}
              {emailValidationError && !isNotFound && (
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
    );
  }

  // Step 2: Quick Login - 4-Digit Code Verification (-6)
  if (currentIndex === -6) {
    const isOtpError = !!errorMessage || authFlowNotification?.status === 'error';

    return (
      <>
        <div className="seenly-wizard-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', flex: 1 }}>
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

          <div className="seenly-auth-card" style={{
            width: '100%',
            maxWidth: '400px',
            background: 'rgba(255, 253, 250, 0.75)',
            border: isOtpError ? '1.5px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(11, 27, 44, 0.08)',
            borderRadius: '20px',
            padding: '1.75rem 1.5rem',
            boxShadow: '0 10px 30px rgba(11, 27, 44, 0.03)',
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
                  onChange={(e) => {
                    handleCodeDigitChange(e.target, i);
                    if (setErrorMessage) setErrorMessage('');
                    if (authFlowNotification?.status) setAuthFlowNotification?.({ message: '', status: '' });
                  }}
                  onKeyDown={(e) => handleCodeKeyDown(e, i)}
                  onPaste={handleCodePaste}
                  style={{
                    width: '48px',
                    height: '56px',
                    borderRadius: '14px',
                    border: isOtpError ? '1.5px solid rgba(239, 68, 68, 0.65)' : '1.5px solid rgba(11, 27, 44, 0.12)',
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
                    e.target.style.borderColor = isOtpError ? 'rgba(239, 68, 68, 0.65)' : 'rgba(11, 27, 44, 0.12)';
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(11, 27, 44, 0.02)';
                  }}
                />
              ))}
            </div>

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

            {/* Error Feedback Banner */}
            {(errorMessage || authFlowNotification?.status === 'error') && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.65rem 1rem',
                borderRadius: '12px',
                background: 'rgba(254, 242, 242, 0.95)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                width: '100%',
                boxSizing: 'border-box',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.05)',
                animation: 'fadeInUp 0.3s ease'
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
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
                }}>
                  {authFlowNotification?.message || errorMessage}
                </p>
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
              <span className="spinner-mini"></span>
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
    );
  }

  // Step 3: Nickname Input (-2)
  if (currentIndex === -2) {
    return (
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && displayName.trim().length >= 2) {
                  setCurrentIndex(-4);
                }
              }}
            />
          </div>
        </div>
        <div className="seenly-wizard-footer-action">
          <button
            type="button"
            className="seenly-wizard-primary-btn"
            disabled={!displayName || displayName.trim().length < 2}
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
    );
  }

  // Step 4: Before You Begin Info (-4)
  if (currentIndex === -4) {
    return (
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
    );
  }

  return null;
});

export default QuizOnboardingStep;
