import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { LocaleProvider } from '../context/LocaleContext';
import IdentityDetailModal from '../pages/identities/IdentityDetailModal';
import IdentitiesPage from '../pages/IdentitiesPage';

// Mock API and images
vi.mock('../services/api', () => ({
  fetchAllCardRarities: () => Promise.resolve({})
}));

vi.mock('../images/cardImages', () => ({
  CARD_IMAGES: {
    the_playmaker: '/mock-playmaker.avif'
  }
}));

describe('Identities Detail Modal Auth CTA Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '#/identities';
  });

  it('hides "Kendindeki Bu Rolü Keşfet" button when user is logged in', () => {
    localStorage.setItem('tensignal_owner_token', 'mock_jwt_token_123');

    const mockCard = {
      id: 'the_playmaker',
      signals: ['s1', 's2']
    };

    render(
      <LocaleProvider defaultLocale="tr">
        <IdentityDetailModal
          selectedCard={mockCard}
          setSelectedCard={vi.fn()}
          apiRarities={{}}
          getFamilyLabel={() => 'Stratega'}
          generateDetailedDescription={() => 'Detaylı analiz metni'}
          handleStartQuiz={vi.fn()}
          getObject={() => ({ name: 'Oyun Kurucu', oneLine: 'Strateji ustası' })}
          langCode="tr"
          t={(k) => (k === 'quiz.identities.ctaDiscover' ? 'Kendindeki Bu Rolü Keşfet' : k)}
          isLoggedIn={true}
        />
      </LocaleProvider>
    );

    // Modal title is present
    expect(screen.getByText('Oyun Kurucu')).toBeInTheDocument();

    // CTA button MUST NOT be present
    expect(screen.queryByText(/Kendindeki Bu Rolü Keşfet/i)).not.toBeInTheDocument();
  });

  it('shows "Kendindeki Bu Rolü Keşfet" button when user is NOT logged in and clicking it redirects to registration step', () => {
    // Ensure no token
    localStorage.removeItem('tensignal_owner_token');
    localStorage.removeItem('seenly_owner_token');

    const handleStartQuiz = vi.fn();

    const mockCard = {
      id: 'the_playmaker',
      signals: ['s1', 's2']
    };

    render(
      <LocaleProvider defaultLocale="tr">
        <IdentityDetailModal
          selectedCard={mockCard}
          setSelectedCard={vi.fn()}
          apiRarities={{}}
          getFamilyLabel={() => 'Stratega'}
          generateDetailedDescription={() => 'Detaylı analiz metni'}
          handleStartQuiz={handleStartQuiz}
          getObject={() => ({ name: 'Oyun Kurucu', oneLine: 'Strateji ustası' })}
          langCode="tr"
          t={(k) => (k === 'quiz.identities.ctaDiscover' ? 'Kendindeki Bu Rolü Keşfet' : k)}
          isLoggedIn={false}
        />
      </LocaleProvider>
    );

    const ctaButton = screen.getByRole('button', { name: /Kendindeki Bu Rolü Keşfet/i });
    expect(ctaButton).toBeInTheDocument();

    fireEvent.click(ctaButton);
    expect(handleStartQuiz).toHaveBeenCalledTimes(1);
  });

  it('navigates to registration onboarding step and sets sessionStorage properly on IdentitiesPage', async () => {
    localStorage.removeItem('tensignal_owner_token');

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(
      <LocaleProvider defaultLocale="tr">
        <IdentitiesPage />
      </LocaleProvider>
    );

    // Click on the first card in the gallery
    const cardBtn = document.querySelector('.identity-gallery-card');
    expect(cardBtn).toBeInTheDocument();
    fireEvent.click(cardBtn);

    // Detail modal opens and CTA button is visible
    const ctaButton = await screen.findByRole('button', { name: /Kendindeki Bu Rolü Keşfet/i }, { timeout: 3000 });
    expect(ctaButton).toBeInTheDocument();

    fireEvent.click(ctaButton);

    // Verifies redirection and session setup
    expect(sessionStorage.getItem('tensignal_currentIndex')).toBe('-2');
    expect(sessionStorage.getItem('tensignal_isQuickLogin')).toBe('false');
    expect(window.location.hash).toBe('#/');
    expect(dispatchSpy).toHaveBeenCalled();
  });
});
