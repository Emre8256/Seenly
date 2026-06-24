import React from 'react';
import { useLocale } from '../context/LocaleContext';

export default function MilestoneBar({ responseCount }) {
  const { t } = useLocale();
  const maxCap = 12;
  const percentage = Math.min((responseCount / maxCap) * 100, 100);

  const milestones = [
    { value: 3, label: 'Outside' },
    { value: 6, label: 'Gap' }
  ];

  const isFull = responseCount >= maxCap;

  return (
    <div style={{
      width: '100%',
      fontFamily: 'var(--font-sans)',
      margin: '2rem 0'
    }}>
      {/* Label and Count */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '0.75rem',
        fontSize: 'clamp(0.8rem, 1.5vw, 0.95rem)'
      }}>
        <span style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('ui', 'responses_received')}
        </span>
        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {responseCount} / {maxCap} {isFull && `(${t('ui', 'full_signal_label')})`}
        </span>
      </div>

      {/* Bar Container */}
      <div style={{
        width: '100%',
        height: '4px',
        backgroundColor: 'var(--color-border)',
        position: 'relative',
        borderRadius: '2px',
        marginBottom: '1.5rem'
      }}>
        {/* Active Progress */}
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: 'var(--color-accent)',
          borderRadius: '2px',
          transition: 'width 0.4s ease'
        }}></div>

        {/* Milestone Markers */}
        {milestones.map((milestone) => {
          const milestonePercent = (milestone.value / maxCap) * 100;
          const isReached = responseCount >= milestone.value;
          return (
            <div
              key={milestone.value}
              style={{
                position: 'absolute',
                left: `${milestonePercent}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              {/* Tick Circle */}
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isReached ? 'var(--color-accent)' : 'var(--color-bg)',
                border: `2px solid ${isReached ? 'var(--color-accent)' : 'var(--color-border)'}`,
                transition: 'all 0.3s ease'
              }}></div>

              {/* Tick Label */}
              <span style={{
                marginTop: '0.5rem',
                fontSize: '0.7rem',
                color: isReached ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                fontWeight: isReached ? 600 : 400,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {milestone.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Free Cap Banner */}
      {isFull && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'rgba(200, 157, 50, 0.08)',
          border: '1px solid var(--color-accent)',
          fontSize: '0.8rem',
          textAlign: 'center',
          color: 'var(--color-text-primary)'
        }}>
          <strong>{t('ui', 'capacity_full_label')}:</strong> {t('ui', 'privacy_note')}
        </div>
      )}
    </div>
  );
}
