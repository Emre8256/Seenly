import React, { useState, useEffect } from 'react';
import { useLocale } from '../context/LocaleContext';
import ResultIdentityCard from '../components/ResultIdentityCard';
import AppShell from '../components/AppShell';
import { getOwnerDashboard } from '../services/api';

export default function ResultPage({ onNavigateToQuiz }) {
  const { locale: langCode, t } = useLocale();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('seenly_owner_token');

    if (!token) {
      setError('no_token');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const data = await getOwnerDashboard(token);
        setSnapshot(data);
      } catch (err) {
        localStorage.removeItem('seenly_owner_token');
        localStorage.removeItem('seenly_display_name');
        sessionStorage.clear();
        setError('profile_not_found');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCopyLink = () => {
    if (!snapshot || !snapshot.publicSlug) return;
    const inviteUrl = `${window.location.origin}/#/friend/${snapshot.publicSlug}`;

    navigator.clipboard.writeText(inviteUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // clipboard copy failed
      });
  };

  // Render Loading State
  if (loading) {
    return (
      <AppShell>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          padding: '4rem 1.5rem',
          textAlign: 'center'
        }}>
          <p style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.25rem',
            fontStyle: 'italic',
            color: 'var(--color-text-muted)',
            margin: 0
          }}>
            {t('common.loading')}
          </p>
        </div>
      </AppShell>
    );
  }

  // Render Error / Missing Token State
  if (error) {
    return (
      <AppShell isDashboard={true}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '6rem 1.5rem', textAlign: 'center' }}>
          <div className="editorial-card" style={{ maxWidth: '500px', width: '100%', padding: '3rem 2rem' }}>
            <h2 className="editorial-title" style={{ color: 'red', fontSize: '1.75rem', marginBottom: '1.5rem' }}>
              {t('errors.notFoundTitle')}
            </h2>
            <p className="editorial-body" style={{ color: 'var(--color-text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
              {t('errors.notFoundDesc')}
            </p>
            <button
              type="button"
              className="btn-editorial"
              onClick={() => window.location.hash = '#/'}
              style={{ width: '100%' }}
            >
              {t('common.backToHome')}
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ animation: 'fadeIn 0.5s ease' }}>
        {/* Render Identity Result */}
        <ResultIdentityCard
          signatureId={snapshot.selfSignatureId}
          familyId={snapshot.selfFamilyId}
        />

        {/* Invite Friends Section */}
        <div className="editorial-card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.15rem, 2.5vw, 1.6rem)',
            fontWeight: '400',
            margin: '0 0 1rem 0',
            color: 'var(--color-text-primary)'
          }}>
            {t('quiz.results.inviteFriendsTitle')}
          </h3>
          <p style={{
            fontSize: '0.9rem',
            lineHeight: '1.5',
            color: 'var(--color-text-muted)',
            marginBottom: '1.5rem'
          }}>
            {t('quiz.results.inviteFriendsDesc')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {snapshot.publicSlug && (
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/#/friend/${snapshot.publicSlug}`}
                style={{
                  width: '100%',
                  background: 'var(--color-hover)',
                  border: '1px solid var(--color-border)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.85rem',
                  padding: '0.75rem 1rem',
                  color: 'var(--color-text-muted)',
                  outline: 'none'
                }}
              />
            )}
            <button
              type="button"
              className="btn-editorial"
              onClick={handleCopyLink}
              style={{ width: '100%' }}
            >
              {copied ? t('common.copied') : t('common.copyLink')}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </AppShell>
  );
}
