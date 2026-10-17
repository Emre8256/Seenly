import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { LocaleProvider, useLocale } from '../context/LocaleContext';
import LegalDocumentView from '../pages/legal/LegalDocumentView';

function PrivacyTestWrapper() {
  const { locale, setLocale } = useLocale();
  return (
    <div>
      <div data-testid="current-locale">{locale}</div>
      <button data-testid="switch-en" onClick={() => setLocale('en')}>
        Switch EN
      </button>
      <button data-testid="switch-tr" onClick={() => setLocale('tr')}>
        Switch TR
      </button>
      <LegalDocumentView docKey="privacy" fullWidth={true} />
    </div>
  );
}

describe('Privacy Policy Compliance & Bilingual Integrity Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '#/privacy';
  });

  it('renders complete English Privacy Policy with all 16 sections in English locale', async () => {
    localStorage.setItem('tensignal_locale', 'en');
    localStorage.setItem('tensignal_locale_manual', 'true');

    render(
      <LocaleProvider defaultLocale="en">
        <LegalDocumentView docKey="privacy" fullWidth={true} />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /^privacy policy$/i })).toBeInTheDocument();
    });

    // Check last updated date
    expect(screen.getByText(/last updated: october 18, 2026/i)).toBeInTheDocument();

    // Ensure fallback notice is completely absent
    expect(screen.queryByText(/currently available only in its canonical english version/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/bu yasal metin şu anda yalnızca resmi ingilizce sürümünde mevcuttur/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/turkish version coming soon/i)).not.toBeInTheDocument();

    // Check English section titles
    await screen.findByText('Data Controller and Operational Status');
    expect(screen.getByText('Categories of Personal Data Collected')).toBeInTheDocument();
    expect(screen.getByText('Purposes of Processing and Legal Bases (GDPR & KVKK)')).toBeInTheDocument();
    expect(screen.getByText('Assessment Mechanics, Non-Clinical Psychometrics & Profiling Safeguards')).toBeInTheDocument();
    expect(screen.getByText('Anonymous Peer Participation & Privacy Safeguards')).toBeInTheDocument();
    expect(screen.getByText('Technical Identifiers, Hashing & Duplicate Prevention')).toBeInTheDocument();
    expect(screen.getByText('Cookies, Local Storage & Browser State')).toBeInTheDocument();
    expect(screen.getByText('Third-Party Service Providers (Sub-Processors)')).toBeInTheDocument();
    expect(screen.getByText('International Data Transfers (GDPR Chapter V & KVKK Art. 9)')).toBeInTheDocument();
    expect(screen.getByText('Data Retention, Account Deletion & Anonymization Lifecycle')).toBeInTheDocument();
    expect(screen.getByText('Technical and Organizational Security Measures')).toBeInTheDocument();
    expect(screen.getByText('Data Subject Rights under GDPR and KVKK')).toBeInTheDocument();
    expect(screen.getByText("Children's Privacy & Age Limitations")).toBeInTheDocument();
    expect(screen.getByText('Notification Preferences & Direct Communications')).toBeInTheDocument();
    expect(screen.getByText('Amendments to this Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Contact & Inquiries')).toBeInTheDocument();

    // Verify contact email is present as clickable mailto link
    const emailLinks = screen.getAllByRole('link', { name: '10signal.me@gmail.com' });
    expect(emailLinks.length).toBeGreaterThan(0);
    expect(emailLinks[0]).toHaveAttribute('href', 'mailto:10signal.me@gmail.com');

    // Verify accurate technical and legal content
    expect(screen.getByText(/Asynchronous Outbox Scrubbing/i)).toBeInTheDocument();
    expect(screen.getByText(/Status under Turkish KVKK \(Article 9\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Brevo \(Sendinblue SAS - France \/ EU\)/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Lemon Squeezy, LLC/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/explicit informed consent \(KVKK Art\. 9\(1\)\)/i)).not.toBeInTheDocument();
  });

  it('renders complete Turkish Gizlilik Politikası with all 16 sections in Turkish locale', async () => {
    localStorage.setItem('tensignal_locale', 'tr');
    localStorage.setItem('tensignal_locale_manual', 'true');

    render(
      <LocaleProvider defaultLocale="tr">
        <LegalDocumentView docKey="privacy" fullWidth={true} />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /^gizlilik politikası$/i })).toBeInTheDocument();
    });

    // Check Turkish last updated date
    expect(screen.getByText(/son güncelleme: 18 ekim 2026/i)).toBeInTheDocument();

    // Absolutely NO fallback notice banner
    expect(screen.queryByText(/bu yasal metin şu anda yalnızca resmi ingilizce sürümünde mevcuttur/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/currently available only in its canonical english version/i)).not.toBeInTheDocument();

    // Check Turkish section titles
    await screen.findByText('Veri Sorumlusu ve Hizmet Yapısı');
    expect(screen.getByText('İşlenen Kişisel Veri Kategorileri')).toBeInTheDocument();
    expect(screen.getByText('Kişisel Veri İşleme Amaçları ve Hukuki Sebepleri')).toBeInTheDocument();
    expect(screen.getByText('Değerlendirme Sistemi, Psikometrik Boyut ve Otomatik Karar Sınırları')).toBeInTheDocument();
    expect(screen.getByText('Arkadaş Değerlendirmeleri ve Anonimlik Güvencesi')).toBeInTheDocument();
    expect(screen.getByText('Teknik Tanımlayıcılar, Hash Yöntemi ve Mükerrer Oy Engelleme')).toBeInTheDocument();
    expect(screen.getByText('Çerezler ve Tarayıcı Depolama Alanları')).toBeInTheDocument();
    expect(screen.getByText('Üçüncü Taraf Hizmet Sağlayıcılar')).toBeInTheDocument();
    expect(screen.getByText('Yurt Dışına Veri Aktarımı (KVKK m. 9 ve GDPR)')).toBeInTheDocument();
    expect(screen.getByText('Saklama, Hesap Silme ve İmha Süreçleri')).toBeInTheDocument();
    expect(screen.getByText('Teknik ve İdari Güvenlik Önlemleri')).toBeInTheDocument();
    expect(screen.getByText('İlgili Kişinin Hakları (KVKK m. 11 ve GDPR)')).toBeInTheDocument();
    expect(screen.getByText('Çocukların Gizliliği ve Yaş Sınırı')).toBeInTheDocument();
    expect(screen.getByText('Bildirim Tercihleri ve İletişim Ayarları')).toBeInTheDocument();
    expect(screen.getByText('Gizlilik Politikasındaki Değişiklikler')).toBeInTheDocument();
    expect(screen.getByText('İletişim ve Başvuru')).toBeInTheDocument();

    // Verify contact email is clickable mailto link
    const emailLinks = screen.getAllByRole('link', { name: '10signal.me@gmail.com' });
    expect(emailLinks.length).toBeGreaterThan(0);
    expect(emailLinks[0]).toHaveAttribute('href', 'mailto:10signal.me@gmail.com');

    // Verify accurate technical and legal content in Turkish
    expect(screen.getByText(/E-posta Kuyruğunun İşlenmesi ve Maskeleme/i)).toBeInTheDocument();
    expect(screen.getByText(/Türkiye \(KVKK Madde 9\) Kapsamındaki Mevcut Durum/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Brevo \(Sendinblue SAS - Fransa \/ AB\)/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Lemon Squeezy, LLC/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/açık rızası \(KVKK m\. 9\(1\)\) esas alınmaktadır/i)).not.toBeInTheDocument();
  });

  it('smoothly switches between Turkish and English policies on locale change', async () => {
    localStorage.setItem('tensignal_locale', 'tr');
    localStorage.setItem('tensignal_locale_manual', 'true');

    render(
      <LocaleProvider defaultLocale="tr">
        <PrivacyTestWrapper />
      </LocaleProvider>
    );

    // Initial state: Turkish
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /^gizlilik politikası$/i })).toBeInTheDocument();
    });
    await screen.findByText('Veri Sorumlusu ve Hizmet Yapısı');

    // Switch to English
    fireEvent.click(screen.getByTestId('switch-en'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /^privacy policy$/i })).toBeInTheDocument();
    });
    await screen.findByText('Data Controller and Operational Status');
    expect(screen.getByText(/last updated: october 18, 2026/i)).toBeInTheDocument();

    // Switch back to Turkish
    fireEvent.click(screen.getByTestId('switch-tr'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /^gizlilik politikası$/i })).toBeInTheDocument();
    });
    await screen.findByText('Veri Sorumlusu ve Hizmet Yapısı');
    expect(screen.getByText(/son güncelleme: 18 ekim 2026/i)).toBeInTheDocument();
  });
});
