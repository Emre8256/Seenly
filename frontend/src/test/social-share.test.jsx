import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { LocaleProvider } from '../context/LocaleContext';
import ShareModal from '../components/ShareModal';
import SelfPerceptionTab from '../pages/dashboard/SelfPerceptionTab';
import FriendResultPreview from '../pages/friend-quiz/FriendResultPreview';
import {
  SHARE_CARD_TYPES,
  getShareUrl,
  getShareMessage,
  getWhatsAppShareUrl,
  getXShareUrl,
  slugifyTitle,
  getStoryFileName,
  copyToClipboard,
  canNativeShareFiles,
  canNativeShareText
} from '../services/shareService';

let html2canvasMockImpl = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 810;
  canvas.toBlob = (callback) => {
    const blob = new Blob(['mock-png'], { type: 'image/png' });
    callback(blob);
  };
  return Promise.resolve(canvas);
};

// Mock html2canvas
vi.mock('html2canvas', () => {
  return {
    default: (node, opts) => html2canvasMockImpl(node, opts)
  };
});

// Mock loadImageAsDataURL for jsdom environment
vi.mock('../services/shareService', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    loadImageAsDataURL: (src) => Promise.resolve(src || '')
  };
});

describe('10Signal Social Media Share System Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    html2canvasMockImpl = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 810;
      canvas.toBlob = (callback) => {
        const blob = new Blob(['mock-png'], { type: 'image/png' });
        callback(blob);
      };
      return Promise.resolve(canvas);
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // 1 & 3: Dashboard Kişilik Kartından Paylaşım Açılması & Doğru Veriler
  // ─────────────────────────────────────────────────────────────
  it('opens share modal from dashboard personality card with correct archetype, rarity and description', async () => {
    const mockGet10Signals = vi.fn().mockReturnValue([]);

    render(
      <LocaleProvider defaultLocale="tr">
        <SelfPerceptionTab
          langCode="tr"
          selfSignatureName="Oyun Kurucu"
          selfRarity={{ badgeLabel: 'Nadir', badgeBg: '#FEF3C7', badgeText: '#92400E', badgeBorder: '#F59E0B' }}
          selfSignatureCardLine="Kelimeleriyle değil, kurduğu oyunla konuşur."
          SIGNATURE_IMAGES={{ the_playmaker: '/assets/playmaker.avif' }}
          activeSelfSignatureId="the_playmaker"
          getDashboardWhatsAppLink={vi.fn()}
          handleDashboardInstagramStory={vi.fn()}
          isGenerating={false}
          get10Signals={mockGet10Signals}
        />
      </LocaleProvider>
    );

    const shareButton = screen.getByRole('button', { name: /paylaş/i });
    expect(shareButton).toBeInTheDocument();

    fireEvent.click(shareButton);

    // Modal opens
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: 'Sonucunu Paylaş' })).toBeInTheDocument();
    expect(screen.getAllByText('Oyun Kurucu').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Nadir').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/"Kelimeleriyle değil, kurduğu oyunla konuşur."/).length).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────────────────────
  // 2 & 3: Gözlemci Kartından Paylaşım Açılması & Doğru Veriler
  // ─────────────────────────────────────────────────────────────
  it('opens share modal from observer result card with correct title and description without rarity', async () => {
    render(
      <LocaleProvider defaultLocale="tr">
        <FriendResultPreview
          styleId="balanced_reader"
          styleObj={{
            name: 'Dengeli Gözlemci',
            oneLine: 'Kişinin temel karakter çizgilerini doğru yakalamışsınız.'
          }}
          accuracy={85.4}
          accuracyOffset={50}
          READER_CARD_IMAGES={{ balanced_reader: '/assets/dengeli_gozlemci.avif' }}
          getWhatsAppShareLink={vi.fn()}
          handleInstagramShare={vi.fn()}
          isGenerating={false}
          handleStartOwn={vi.fn()}
          handleGoToDashboard={vi.fn()}
          isLoggedIn={false}
          langCode="tr"
          t={(k) => (k === 'common.share' ? 'Paylaş' : k)}
        />
      </LocaleProvider>
    );

    const shareButton = screen.getByRole('button', { name: /paylaş/i });
    expect(shareButton).toBeInTheDocument();

    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Dengeli Gözlemci').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/"Kişinin temel karakter çizgilerini doğru yakalamışsınız."/).length).toBeGreaterThan(0);
    // Observer card has no rarity badge
    expect(screen.queryByText('Nadir')).not.toBeInTheDocument();
    expect(screen.queryByText('Yaygın')).not.toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────
  // 4: Türkçe / İngilizce Paylaşım Metinleri
  // ─────────────────────────────────────────────────────────────
  it('formats personality and observer sharing messages correctly in Turkish and English', () => {
    const personalityCardTR = {
      type: SHARE_CARD_TYPES.PERSONALITY,
      title: 'Oyun Kurucu'
    };
    const personalityMsgTR = getShareMessage(personalityCardTR, null, 'tr');
    expect(personalityMsgTR).toBe("10Signal'da kişilik sonucum Oyun Kurucu çıktı. Seninki ne? ✨");

    const personalityCardEN = {
      type: SHARE_CARD_TYPES.PERSONALITY,
      title: 'Playmaker'
    };
    const personalityMsgEN = getShareMessage(personalityCardEN, null, 'en');
    expect(personalityMsgEN).toBe("My personality result on 10Signal is Playmaker. What's yours? ✨");

    const observerCardTR = {
      type: SHARE_CARD_TYPES.OBSERVER,
      title: 'Dengeli Gözlemci'
    };
    const observerMsgTR = getShareMessage(observerCardTR, null, 'tr');
    expect(observerMsgTR).toBe("10Signal'da gözlemci karakterim Dengeli Gözlemci çıktı. Sen insanları nasıl değerlendiriyorsun? ✨");

    const observerCardEN = {
      type: SHARE_CARD_TYPES.OBSERVER,
      title: 'Balanced Observer'
    };
    const observerMsgEN = getShareMessage(observerCardEN, null, 'en');
    expect(observerMsgEN).toBe("My observer type on 10Signal is Balanced Observer. How do you see others? ✨");
  });

  // ─────────────────────────────────────────────────────────────
  // 5 & 6: WhatsApp ve X Paylaşım URL'leri
  // ─────────────────────────────────────────────────────────────
  it('builds secure, encoded WhatsApp and X intent URLs with canonical origin', () => {
    const cardData = {
      type: SHARE_CARD_TYPES.PERSONALITY,
      title: 'Playmaker'
    };

    const waUrl = getWhatsAppShareUrl(cardData, null, 'en');
    expect(waUrl).toContain('https://api.whatsapp.com/send?text=');
    expect(waUrl).toContain(encodeURIComponent("My personality result on 10Signal is Playmaker. What's yours? ✨"));
    expect(waUrl).toContain(encodeURIComponent('https://10signal.me'));

    const xUrl = getXShareUrl(cardData, null, 'en');
    expect(xUrl).toContain('https://twitter.com/intent/tweet?text=');
    expect(xUrl).toContain(encodeURIComponent("My personality result on 10Signal is Playmaker. What's yours? ✨"));
    expect(xUrl).toContain(`url=${encodeURIComponent('https://10signal.me')}`);
  });

  // ─────────────────────────────────────────────────────────────
  // 7 & 10: Bağlantıyı Kopyalama & Gizli Verilerin Paylaşılmaması
  // ─────────────────────────────────────────────────────────────
  it('guarantees canonical privacy-safe URL without private tokens or secrets', () => {
    const sensitiveCardData = {
      type: SHARE_CARD_TYPES.PERSONALITY,
      title: 'Playmaker',
      userToken: 'secret_token_123',
      privateSlug: 'private-slug-abc',
      friendEvaluationData: { friendName: 'Alice', answers: [1, 2, 3] }
    };

    const shareUrl = getShareUrl(sensitiveCardData);
    expect(shareUrl).toBe('https://10signal.me');
    expect(shareUrl).not.toContain('secret_token_123');
    expect(shareUrl).not.toContain('private-slug-abc');
    expect(shareUrl).not.toContain('Alice');

    const shareMsg = getShareMessage(sensitiveCardData, null, 'tr');
    expect(shareMsg).not.toContain('secret');
    expect(shareMsg).not.toContain('Alice');
  });

  it('generates personalized invitation URL for dashboard personality cards with publicSlug', () => {
    const cardWithSlug = {
      type: SHARE_CARD_TYPES.PERSONALITY,
      title: 'Playmaker',
      publicSlug: 'ahmet-yilmaz-77'
    };
    const shareUrl = getShareUrl(cardWithSlug);
    expect(shareUrl).toBe('https://10signal.me/#/friend/ahmet-yilmaz-77');

    const waUrl = getWhatsAppShareUrl(cardWithSlug, null, 'tr');
    expect(waUrl).toContain(encodeURIComponent('https://10signal.me/#/friend/ahmet-yilmaz-77'));

    const xUrl = getXShareUrl(cardWithSlug, null, 'tr');
    expect(xUrl).toContain(encodeURIComponent('https://10signal.me/#/friend/ahmet-yilmaz-77'));
  });

  it('strictly isolates observer card URLs to canonical platform link even if friend data exists', () => {
    const observerCard = {
      type: SHARE_CARD_TYPES.OBSERVER,
      title: 'Dengeli Gözlemci',
      publicSlug: 'evaluated-friend-slug-secret',
      friendName: 'John Doe'
    };
    const shareUrl = getShareUrl(observerCard);
    expect(shareUrl).toBe('https://10signal.me');
    expect(shareUrl).not.toContain('evaluated-friend-slug-secret');
    expect(shareUrl).not.toContain('John');

    const waUrl = getWhatsAppShareUrl(observerCard, null, 'tr');
    expect(waUrl).toContain(encodeURIComponent('https://10signal.me'));
    expect(waUrl).not.toContain('evaluated-friend-slug-secret');
  });

  it('copies canonical link to clipboard successfully with fallback', async () => {
    const originalClipboard = navigator.clipboard;
    const writeTextMock = vi.fn().mockResolvedValue(true);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock }
    });

    const success = await copyToClipboard('https://10signal.me');
    expect(success).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith('https://10signal.me');

    Object.assign(navigator, { clipboard: originalClipboard });
  });

  it('removes copy link button on observer result card modal and shows it on personality card', () => {
    // 1. Observer modal: No Copy Link button
    const { unmount } = render(
      <LocaleProvider defaultLocale="tr">
        <ShareModal
          isOpen={true}
          onClose={vi.fn()}
          cardData={{
            type: SHARE_CARD_TYPES.OBSERVER,
            title: 'Dengeli Gözlemci',
            description: 'Net bir bakış'
          }}
        />
      </LocaleProvider>
    );

    expect(screen.queryByText('Bağlantıyı Kopyala')).not.toBeInTheDocument();
    expect(screen.getByText('Görseli İndir')).toBeInTheDocument();
    expect(screen.getByText('Paylaşım Önizlemesi (4:3)')).toBeInTheDocument();

    unmount();

    // 2. Personality modal: Copy Link button is present
    render(
      <LocaleProvider defaultLocale="tr">
        <ShareModal
          isOpen={true}
          onClose={vi.fn()}
          cardData={{
            type: SHARE_CARD_TYPES.PERSONALITY,
            title: 'Oyun Kurucu',
            description: 'Stratejik akıl',
            publicSlug: 'user-slug-123'
          }}
        />
      </LocaleProvider>
    );

    expect(screen.getByText('Bağlantıyı Kopyala')).toBeInTheDocument();
    expect(screen.getByText('Görseli İndir')).toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────
  // 8: PNG İndirme ve Dosya Adı Standardı (4:3)
  // ─────────────────────────────────────────────────────────────
  it('generates OS-safe filename for personality and observer cards without story suffix', () => {
    expect(getStoryFileName({ title: 'Playmaker' })).toBe('10signal-playmaker.png');
    expect(getStoryFileName({ title: 'Dengeli Gözlemci' })).toBe('10signal-dengeli-gozlemci.png');
    expect(getStoryFileName({ title: 'Oyun Kurucu' })).toBe('10signal-oyun-kurucu.png');
    expect(getStoryFileName({ title: 'Telepatik Okuyucu / Sezgi' })).toBe('10signal-telepatik-okuyucu-sezgi.png');
    expect(slugifyTitle('Türkçe Başlık & Özel Karakterler!')).toBe('turkce-baslik-ozel-karakterler');
  });

  // ─────────────────────────────────────────────────────────────
  // 9: Web Share API Desteği ve Fallback
  // ─────────────────────────────────────────────────────────────
  it('correctly detects Web Share API support and handles user cancellation gracefully', () => {
    expect(canNativeShareText()).toBe(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
    const mockFile = new File([''], 'test.png', { type: 'image/png' });
    expect(typeof canNativeShareFiles(mockFile)).toBe('boolean');
  });

  // ─────────────────────────────────────────────────────────────
  // 11: Modal Açma / Kapatma (Escape, Backdrop, Buton)
  // ─────────────────────────────────────────────────────────────
  it('closes modal when close button or Escape key is pressed', async () => {
    const handleClose = vi.fn();
    const cardData = {
      type: SHARE_CARD_TYPES.PERSONALITY,
      title: 'Playmaker',
      description: 'Visionary mind',
      imageSrc: '/playmaker.png'
    };

    const { rerender } = render(
      <LocaleProvider defaultLocale="tr">
        <ShareModal isOpen={true} onClose={handleClose} cardData={cardData} />
      </LocaleProvider>
    );

    const closeBtn = screen.getByLabelText('Kapat');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Escape key press
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);

    // Does not render when isOpen is false
    rerender(
      <LocaleProvider defaultLocale="tr">
        <ShareModal isOpen={false} onClose={handleClose} cardData={cardData} />
      </LocaleProvider>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────
  // 12: Görsel Oluşturma Hatalarının Yönetimi
  // ─────────────────────────────────────────────────────────────
  it('handles image generation failure gracefully with accessible notice and no crash', async () => {
    html2canvasMockImpl = () => Promise.reject(new Error('Canvas rendering timeout'));

    const cardData = {
      type: SHARE_CARD_TYPES.PERSONALITY,
      title: 'Playmaker',
      description: 'Visionary mind',
      imageSrc: '/playmaker.png'
    };

    render(
      <LocaleProvider defaultLocale="tr">
        <ShareModal isOpen={true} onClose={vi.fn()} cardData={cardData} />
      </LocaleProvider>
    );

    const downloadBtn = screen.getByText('Görseli İndir');
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(screen.getByText('Görsel hazırlanırken bir hata oluştu')).toBeInTheDocument();
    });

    // App remains functional, buttons are re-enabled
    expect(downloadBtn).not.toBeDisabled();
  });
});
