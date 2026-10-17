import React, { memo } from 'react';
import { useLocale } from '../../context/LocaleContext';

const QuizQuestionsRunner = memo(function QuizQuestionsRunner({
  currentIndex,
  selfQuestionIds,
  answers,
  setAnswers,
  selectedAvatar,
  setSelectedAvatar,
  avatarFilter,
  setAvatarFilter,
  filteredAvatars,
  setCurrentIndex,
  langCode,
  t: propT
}) {
  const { t: contextT } = useLocale();
  const t = propT || contextT;
  const tr = t;
  // Step 4: Quiz Questions (0 to 9)
  if (currentIndex >= 0 && currentIndex < selfQuestionIds.length) {
    const questionId = selfQuestionIds[currentIndex];
    return (
      <>
        <div className="tensignal-wizard-content">
          <h2 className="tensignal-wizard-title question-text">
            {t('questions', questionId)}
          </h2>
          <div className="tensignal-wizard-list-container">
            {[
              { value: 1, label: t('common.agreement_strongly_disagree') },
              { value: 2, label: t('common.agreement_disagree') },
              { value: 3, label: t('common.agreement_neutral') },
              { value: 4, label: t('common.agreement_agree') },
              { value: 5, label: t('common.agreement_strongly_agree') }
            ].map((opt) => {
              const isActive = answers[questionId] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`tensignal-wizard-list-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setAnswers(prev => ({ ...prev, [questionId]: opt.value }));
                  }}
                >
                  <span>{opt.label}</span>
                  {isActive && <span className="tensignal-wizard-checkmark">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="tensignal-wizard-footer-action">
          <button
            type="button"
            className="tensignal-wizard-primary-btn"
            disabled={answers[questionId] === undefined}
            onClick={() => {
              if (currentIndex < selfQuestionIds.length - 1) {
                setCurrentIndex(prev => prev + 1);
              } else {
                setCurrentIndex(-9);
              }
            }}
          >
            {t('common.next')}
          </button>
        </div>
      </>
    );
  }

  // Step 5: Avatar Selection Screen (-9)
  if (currentIndex === -9) {
    return (
      <>
        <div className="tensignal-wizard-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '0.2rem 0', boxSizing: 'border-box' }}>
          {/* Header Icon */}
          <div className="tensignal-wizard-circle-icon icon-purple" style={{ margin: '0 auto 0.6rem auto', width: '48px', height: '48px', flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="tensignal-wizard-title" style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-deep-ink)', marginBottom: '0.35rem', textAlign: 'center', width: '100%', fontSize: '1.5rem', lineHeight: '1.2' }}>
            {tr('quiz.runner.chooseAvatarTitle')}
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
            {tr('quiz.runner.chooseAvatarSubtitle')}
          </p>

          {/* Filter Pills */}
          <div className="tensignal-onboarding-avatar-filters">
            <button
              type="button"
              onClick={() => setAvatarFilter('kadin')}
              className={`tensignal-onboarding-filter-pill ${avatarFilter === 'kadin' ? 'active' : ''}`}
            >
              {tr('quiz.runner.avatarWomen')}
            </button>
            <button
              type="button"
              onClick={() => setAvatarFilter('erkek')}
              className={`tensignal-onboarding-filter-pill ${avatarFilter === 'erkek' ? 'active' : ''}`}
            >
              {tr('quiz.runner.avatarMen')}
            </button>
          </div>

          {/* Responsive Avatar Grid */}
          <div className="tensignal-onboarding-avatar-grid">
            {filteredAvatars.map((av) => {
              const isSelected = selectedAvatar === av.id;
              return (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => {
                    setSelectedAvatar(av.id);
                    sessionStorage.setItem('tensignal_avatar', av.id);
                    localStorage.setItem('tensignal_avatar', av.id);
                    localStorage.setItem('seenly_avatar', av.id);
                  }}
                  className={`tensignal-onboarding-avatar-item ${isSelected ? 'is-selected' : ''}`}
                  aria-label={av.label}
                  title={av.label}
                >
                  <div className="tensignal-onboarding-avatar-circle">
                    <img
                      src={av.src}
                      alt={av.label}
                      className="tensignal-onboarding-avatar-img"
                    />
                    {isSelected && (
                      <span className="tensignal-onboarding-avatar-check">
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
        <div className="tensignal-wizard-footer-action">
          <button
            type="button"
            className="tensignal-wizard-primary-btn"
            onClick={() => {
              if (!selectedAvatar) {
                setSelectedAvatar('kadin1');
                sessionStorage.setItem('tensignal_avatar', 'kadin1');
                localStorage.setItem('tensignal_avatar', 'kadin1');
                localStorage.setItem('seenly_avatar', 'kadin1');
              }
              setCurrentIndex(-10);
            }}
          >
            <span>{t('common.next')}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="tensignal-wizard-arrow-icon">
              <line x1="4" y1="12" x2="20" y2="12" />
              <polyline points="13 5 20 12 13 19" />
            </svg>
          </button>
        </div>
      </>
    );
  }

  return null;
});

export default QuizQuestionsRunner;
