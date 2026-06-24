import React from 'react';

export default function OptionButton({ value, isActive, onClick }) {
  return (
    <button
      type="button"
      className={`scale-option-button ${isActive ? 'active' : ''}`}
      onClick={onClick}
      aria-label={`Select score value ${value}`}
    >
      {value}
    </button>
  );
}
