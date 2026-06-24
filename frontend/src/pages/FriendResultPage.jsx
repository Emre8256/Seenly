import React, { useEffect, useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import AppShell from '../components/AppShell';

import dengeliGozlemci from '../images/OkuyucuKartları/Dengeli Gözlemci.png';
import netOkuyucu from '../images/OkuyucuKartları/Net Okuyucu.png';
import sosyalYabanci from '../images/OkuyucuKartları/Sosyal Yabancı.png';
import telepatikOkuyucu from '../images/OkuyucuKartları/Telepatik Okuyucu.png';
import yuzeyselKasif from '../images/OkuyucuKartları/Yüzeysel Kaşif.png';

const READER_CARD_IMAGES = {
  balanced_reader: dengeliGozlemci,
  clear_reader: netOkuyucu,
  social_stranger: sosyalYabanci,
  telepathic_reader: telepatikOkuyucu,
  casual_explorer: yuzeyselKasif
};

export default function FriendResultPage({ slug, onNavigateToQuiz }) {
  const { t, getObject } = useLocale();
  const [result, setResult] = useState(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('seenly_friend_result');
      if (saved) {
        setResult(JSON.parse(saved));
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  const handleStartOwn = () => {
    // Clear friend results from session if any
    sessionStorage.removeItem('seenly_friend_result');
    if (onNavigateToQuiz) {
      onNavigateToQuiz();
    }
  };

  const styleId = result?.readerStyleId || 'clear_reader';
  const accuracy = result?.accuracy ?? 75.0;
  const [accuracyOffset, setAccuracyOffset] = useState(2 * Math.PI * 52);

  useEffect(() => {
    const timer = setTimeout(() => {
      const circumference = 2 * Math.PI * 52;
      const targetOffset = circumference * (1 - accuracy / 100);
      setAccuracyOffset(targetOffset);
    }, 150);
    return () => clearTimeout(timer);
  }, [accuracy]);

  const styleObj = getObject('readerStyles', styleId) || {
    name: styleId,
    oneLine: 'Awaiting style calibration...'
  };

  return (
    <AppShell footerMode="simple">
      <div className="friend-result-container">
        {/* Left Column: Premium 3:4 aspect ratio Card Image Display with Embedded Text Overlay */}
        <div className="card-visual-wrapper">
          <div className="premium-result-card">
            <img
              src={READER_CARD_IMAGES[styleId] || READER_CARD_IMAGES.clear_reader}
              alt={styleObj.name}
              className="result-card-image"
            />
            {/* Dark Gradient Overlay for Text Readability */}
            <div className="card-text-gradient-overlay" />
            
            {/* Embedded Title and Description */}
            <div className="card-text-overlay-content">
              <h2 className="card-title-text">
                {styleObj.name}
              </h2>
              <p className="card-one-liner">
                "{styleObj.oneLine}"
              </p>
            </div>
            
            <div className="card-shine-effect" />
          </div>
        </div>

        {/* Right Column: Info, Accuracy, CTA */}
        <div className="result-details-wrapper">
          {/* Accuracy Meter Card */}
          <div className="accuracy-card">
            <span className="accuracy-label">
              {t('ui', 'friend_accuracy_score')}
            </span>
            
            <div className="accuracy-meter-container">
              {/* Circular SVG Meter */}
              <div className="accuracy-svg-wrapper">
                <svg width="120" height="120" viewBox="0 0 120 120" className="accuracy-svg">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="transparent"
                    stroke="rgba(11, 27, 44, 0.04)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="transparent"
                    stroke="var(--color-accent)"
                    strokeWidth="4"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={accuracyOffset}
                    style={{
                      transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  />
                </svg>
                <div className="accuracy-text-overlay">
                  <span className="accuracy-number">%{Math.round(accuracy)}</span>
                </div>
              </div>

              <p className="accuracy-description">
                {t('ui', 'friend_accuracy_desc')}
              </p>
            </div>
          </div>

          {/* Action CTA Card to create own Seenly */}
          <div className="cta-action-card">
            <h3 className="cta-title">
              {t('ui', 'friend_cta_title')}
            </h3>
            <p className="cta-desc">
              {t('ui', 'friend_cta_desc')}
            </p>
            <button
              type="button"
              className="btn-editorial cta-btn"
              onClick={handleStartOwn}
            >
              {t('ui', 'friend_create_own_btn')}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .friend-result-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          max-width: 980px;
          margin: 1.5rem auto 3rem auto;
          padding: 0 1rem;
          align-items: center;
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          width: 100%;
        }

        @media (min-width: 768px) {
          .friend-result-container {
            grid-template-columns: 1fr 1.1fr;
            gap: 3.5rem;
            margin: 3rem auto 5rem auto;
          }
        }

        /* Card Visual Sizing & Aspect Ratio */
        .card-visual-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }

        .premium-result-card {
          position: relative;
          width: 100%;
          max-width: 380px;
          aspect-ratio: 3 / 4;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 45px rgba(11, 27, 44, 0.12),
                      0 5px 15px rgba(11, 27, 44, 0.06);
          background-color: var(--color-paper-cream);
          border: 1px solid var(--color-border);
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                      box-shadow 0.4s ease,
                      border-color 0.4s ease;
          cursor: pointer;
        }

        .premium-result-card:hover {
          transform: scale(1.03) translateY(-6px);
          box-shadow: 0 30px 60px rgba(11, 27, 44, 0.2),
                      0 10px 25px rgba(11, 27, 44, 0.1);
          border-color: var(--color-accent);
        }

        .result-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* Glass shine hover effect */
        .card-shine-effect {
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.25) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-25deg);
          transition: none;
          z-index: 4;
        }

        .premium-result-card:hover .card-shine-effect {
          left: 150%;
          transition: left 0.8s ease-in-out;
        }

        /* Text Details Wrapper & Inner Cards */
        .result-details-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }

        /* Card Text Overlay Styling */
        .card-text-gradient-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(11, 27, 44, 0.95) 0%,
            rgba(11, 27, 44, 0.65) 45%,
            rgba(11, 27, 44, 0.15) 75%,
            rgba(11, 27, 44, 0) 100%
          );
          pointer-events: none;
          z-index: 2;
        }

        .card-text-overlay-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 2.5rem 1.75rem 2rem 1.75rem;
          z-index: 3;
          display: flex;
          flex-direction: column;
          text-align: left;
          pointer-events: none;
        }

        .card-category-label {
          display: inline-block;
          font-family: var(--font-sans);
          font-size: 0.72rem;
          color: rgba(245, 237, 230, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 0.5rem;
          font-weight: 700;
        }

        .card-title-text {
          font-family: var(--font-serif);
          font-size: clamp(1.4rem, 2.5vw, 1.8rem);
          font-weight: 500;
          margin: 0 0 0.625rem 0;
          color: #FDFBF7;
          line-height: 1.25;
          text-shadow: 0 2px 4px rgba(11, 27, 44, 0.3);
        }

        .card-one-liner {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: 0.92rem;
          line-height: 1.5;
          color: rgba(253, 251, 247, 0.85);
          margin: 0;
          text-shadow: 0 1px 2px rgba(11, 27, 44, 0.2);
        }

        /* Accuracy Meter Card */
        .accuracy-card {
          background-color: var(--color-paper-cream);
          border: 1px solid var(--color-border);
          padding: 2rem;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .accuracy-label {
          font-family: var(--font-sans);
          font-size: 0.75rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-weight: 700;
        }

        .accuracy-meter-container {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 1.75rem;
        }

        @media (max-width: 480px) {
          .accuracy-meter-container {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }
        }

        .accuracy-svg-wrapper {
          position: relative;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .accuracy-svg {
          transform: rotate(-90deg);
        }

        .accuracy-text-overlay {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .accuracy-number {
          font-family: var(--font-serif);
          font-size: 1.8rem;
          font-weight: 400;
          color: var(--color-text-primary);
        }

        .accuracy-description {
          font-family: var(--font-sans);
          font-size: 0.88rem;
          color: var(--color-text-muted);
          line-height: 1.6;
          margin: 0;
        }

        /* Action CTA Card */
        .cta-action-card {
          background-color: rgba(200, 157, 50, 0.03);
          border: 1px solid var(--color-accent);
          padding: 2rem;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .cta-title {
          font-family: var(--font-serif);
          font-size: clamp(1.2rem, 2.5vw, 1.6rem);
          font-weight: 500;
          margin: 0;
          color: var(--color-text-primary);
        }

        .cta-desc {
          font-size: 0.92rem;
          line-height: 1.55;
          color: var(--color-text-muted);
          margin: 0 0 0.5rem 0;
        }

        .cta-btn {
          width: 100%;
          transition: transform 0.2s ease, background-color 0.2s ease;
        }

        .cta-btn:hover {
          transform: translateY(-2px);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </AppShell>
  );
}
