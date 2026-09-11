import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FriendIntroStep from '../pages/friend-quiz/FriendIntroStep';
import { LocaleProvider } from '../context/LocaleContext';

describe('FriendIntroStep Quota & Capped UI State', () => {
  const mockT = (key, params) => {
    const dict = {
      'participant.intro.cappedTitle': 'Katılımcı Kotası Dolu',
      'participant.intro.cappedDesc': `${params?.name || ''} adlı kullanıcının profili maksimum katılımcı limitine ulaşmıştır.`,
      'participant.intro.evaluatedTitle': 'Değerlendirme Tamamlandı',
      'participant.intro.evaluatedDesc': 'Bu kişi için perspektifinizi başarıyla paylaştınız.',
      'participant.intro.evaluateCta': 'Bu Kişiyi Sen De Değerlendir',
      'dashboard.stats.responses': `${params?.count} Yanıt`
    };
    return dict[key] || key;
  };

  const dummyProps = {
    slug: 'abc12345',
    snapshot: {
      displayName: 'Deniz Kaya',
      responseCount: 3,
      acceptingResponses: false,
      outsideSignatureId: 'the_safe_haven'
    },
    langCode: 'tr',
    t: mockT,
    outsideSignatureName: 'Güvenli Liman',
    outsideSignatureCardLine: 'Huzur ve güven veren duruş.',
    outsideRarity: { badgeBg: '#fff', badgeText: '#000', badgeBorder: '#ccc', badgeLabel: 'Nadir' },
    activeOutsideSignatureId: 'the_safe_haven',
    SIGNATURE_IMAGES: {},
    getDashboardWhatsAppLink: vi.fn(),
    handleDashboardInstagramStory: vi.fn(),
    isGenerating: false,
    get10Signals: () => [],
    isLoggedIn: false
  };

  it('renders luxury capped card and hides start button when isCapped is true', () => {
    render(
      <LocaleProvider initialLocale="tr">
        <FriendIntroStep
          {...dummyProps}
          isCapped={true}
          hasEvaluated={false}
          handleStart={vi.fn()}
        />
      </LocaleProvider>
    );

    expect(screen.getByText('Katılımcı Kotası Dolu')).toBeInTheDocument();
    expect(screen.getByText(/Deniz Kaya adlı kullanıcının profili maksimum katılımcı limitine ulaşmıştır/i)).toBeInTheDocument();
    expect(screen.queryByText(/Bu Kişiyi Sen De Değerlendir/i)).not.toBeInTheDocument();
  });

  it('renders start button when isCapped is false and hasEvaluated is false', () => {
    render(
      <LocaleProvider initialLocale="tr">
        <FriendIntroStep
          {...dummyProps}
          isCapped={false}
          hasEvaluated={false}
          handleStart={vi.fn()}
        />
      </LocaleProvider>
    );

    expect(screen.queryByText('Katılımcı Kotası Dolu')).not.toBeInTheDocument();
    expect(screen.getByText(/Bu Kişiyi Sen De Değerlendir/i)).toBeInTheDocument();
  });

  it('renders evaluated card when hasEvaluated is true even if isCapped is true', () => {
    render(
      <LocaleProvider initialLocale="tr">
        <FriendIntroStep
          {...dummyProps}
          isCapped={true}
          hasEvaluated={true}
          handleStart={vi.fn()}
        />
      </LocaleProvider>
    );

    expect(screen.getByText('Değerlendirme Tamamlandı')).toBeInTheDocument();
    expect(screen.queryByText('Katılımcı Kotası Dolu')).not.toBeInTheDocument();
    expect(screen.queryByText(/Bu Kişiyi Sen De Değerlendir/i)).not.toBeInTheDocument();
  });

  it('renders COMPLETE_TEST_REQUIRED locked state when outsidePerceptionLocked is true and reason is COMPLETE_TEST_REQUIRED', () => {
    const mockTWithLock = (key, params) => {
      const dict = {
        'participant.intro.lockedCompleteTestTitle': 'Dış Algıyı Görmek İçin Testi Tamamla',
        'participant.intro.lockedCompleteTestDesc': 'Önce kendi değerlendirmeni tamamlamalısın.',
        'participant.intro.evaluateCta': 'Bu Kişiyi Sen De Değerlendir',
        'dashboard.stats.responses': `${params?.count} Yanıt`
      };
      return dict[key] || key;
    };

    render(
      <LocaleProvider initialLocale="tr">
        <FriendIntroStep
          {...dummyProps}
          t={mockTWithLock}
          snapshot={{
            ...dummyProps.snapshot,
            outsidePerceptionLocked: true,
            outsidePerceptionLockReason: 'COMPLETE_TEST_REQUIRED',
            outsideSignatureId: null
          }}
          isCapped={false}
          hasEvaluated={false}
          handleStart={vi.fn()}
        />
      </LocaleProvider>
    );

    expect(screen.getByText('Dış Algıyı Görmek İçin Testi Tamamla')).toBeInTheDocument();
    expect(screen.getByText('Önce kendi değerlendirmeni tamamlamalısın.')).toBeInTheDocument();
  });

  it('renders INSUFFICIENT_RESPONSES locked state when outsidePerceptionLocked is true and reason is INSUFFICIENT_RESPONSES', () => {
    const mockTWithLock = (key, params) => {
      const dict = {
        'participant.intro.lockedMaskTitle': 'Dış Algı Henüz Kilitli',
        'participant.intro.lockedMaskDesc': 'En az 3 arkadaşın anketi tamamlaması gerekir.',
        'dashboard.stats.responses': `${params?.count} Yanıt`
      };
      return dict[key] || key;
    };

    render(
      <LocaleProvider initialLocale="tr">
        <FriendIntroStep
          {...dummyProps}
          t={mockTWithLock}
          snapshot={{
            ...dummyProps.snapshot,
            responseCount: 1,
            outsidePerceptionLocked: true,
            outsidePerceptionLockReason: 'INSUFFICIENT_RESPONSES',
            outsideSignatureId: null
          }}
          isCapped={false}
          hasEvaluated={false}
          handleStart={vi.fn()}
        />
      </LocaleProvider>
    );

    expect(screen.getByText('Dış Algı Henüz Kilitli')).toBeInTheDocument();
    expect(screen.getByText('En az 3 arkadaşın anketi tamamlaması gerekir.')).toBeInTheDocument();
  });

  it('renders unlocked outside perception card when outsidePerceptionLocked is false and outsideSignatureId exists', () => {
    render(
      <LocaleProvider initialLocale="tr">
        <FriendIntroStep
          {...dummyProps}
          snapshot={{
            ...dummyProps.snapshot,
            outsidePerceptionLocked: false,
            outsidePerceptionLockReason: null,
            outsideSignatureId: 'the_safe_haven'
          }}
          isCapped={false}
          hasEvaluated={false}
          handleStart={vi.fn()}
        />
      </LocaleProvider>
    );

    expect(screen.getByText('Güvenli Liman')).toBeInTheDocument();
    expect(screen.queryByText('Dış Algı Henüz Kilitli')).not.toBeInTheDocument();
    expect(screen.queryByText('Dış Algıyı Görmek İçin Testi Tamamla')).not.toBeInTheDocument();
  });
});
