import React, { memo } from 'react';

const FriendQuestionsRunner = memo(function FriendQuestionsRunner({
  currentIndex,
  friendQuestionIds,
  answers,
  handleSelectOption,
  handleNext,
  t
}) {
  const questionId = friendQuestionIds[currentIndex];
  const selectedValue = answers[questionId];

  return (
    <>
      <div className="seenly-wizard-content">
        <h2 className="seenly-wizard-title question-text">
          {t(`questions.${questionId}`)}
        </h2>
        <div className="seenly-wizard-list-container">
          {[
            { value: 1, label: t('common.agreement_strongly_disagree') },
            { value: 2, label: t('common.agreement_disagree') },
            { value: 3, label: t('common.agreement_neutral') },
            { value: 4, label: t('common.agreement_agree') },
            { value: 5, label: t('common.agreement_strongly_agree') }
          ].map((opt) => {
            const isActive = selectedValue === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`seenly-wizard-list-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectOption(opt.value)}
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
          disabled={selectedValue === undefined}
          onClick={handleNext}
        >
          {t('common.continue')}
        </button>
      </div>
    </>
  );
});

export default FriendQuestionsRunner;
