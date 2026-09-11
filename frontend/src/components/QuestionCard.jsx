import React from 'react';
import { useLocale } from '../context/LocaleContext';
import OptionButton from './OptionButton';

export default function QuestionCard({ question, currentValue, onSelect }) {
  const { t } = useLocale();

  return (
    <div className="editorial-card">
      <div className="editorial-body" style={{
        fontSize: 'clamp(1.1rem, 2.5vw, 1.45rem)',
        fontWeight: '400',
        lineHeight: '1.5',
        marginBottom: '2rem',
        minHeight: '4.5rem'
      }}>
        {question.text}
      </div>

      <div className="scale-container">
        {[1, 2, 3, 4, 5].map((val) => (
          <OptionButton
            key={val}
            value={val}
            isActive={currentValue === val}
            onClick={() => onSelect(val)}
          />
        ))}
      </div>

      <div className="scale-captions">
        <span>{t('common.agreement_strongly_disagree')}</span>
        <span>{t('common.agreement_strongly_agree')}</span>
      </div>
    </div>
  );
}
