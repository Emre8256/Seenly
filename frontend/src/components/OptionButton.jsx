import React from 'react';
import { useLocale } from '../context/LocaleContext';

export default function OptionButton({ value, isActive, onClick }) {
  const { t } = useLocale();
  return (
    <button
      type="button"
      className={`scale-option-button ${isActive ? 'active' : ''}`}
      onClick={onClick}
      aria-label={t('accessibility.selectScore', { value })}
    >
      {value}
    </button>
  );
}
