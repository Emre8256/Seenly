import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { LocaleProvider, useLocale } from '../context/LocaleContext';
import LegalDocumentView from '../pages/legal/LegalDocumentView';

function TermsTestWrapper() {
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
      <LegalDocumentView docKey="terms" fullWidth={true} />
    </div>
  );
}

describe('Terms of Service Compliance & Bilingual Integrity Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '#/terms';
  });

  it('renders complete English Terms of Service with all 16 sections in English locale', async () => {
    localStorage.setItem('tensignal_locale', 'en');
    localStorage.setItem('tensignal_locale_manual', 'true');

    render(
      <LocaleProvider defaultLocale="en">
        <LegalDocumentView docKey="terms" fullWidth={true} />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /^terms of service$/i })).toBeInTheDocument();
    });

    // Check last updated date
    expect(screen.getByText(/last updated: october 18, 2026/i)).toBeInTheDocument();

    // Ensure fallback notice is completely absent
    expect(screen.queryByText(/currently available only in its canonical english version/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/bu yasal metin şu anda yalnızca resmi ingilizce sürümünde mevcuttur/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/turkish version coming soon/i)).not.toBeInTheDocument();

    // Check English section titles
    await screen.findByText('About 10Signal & Operational Structure');
    expect(screen.getByText('Personal Reflection — Non-Clinical & Non-Professional Disclaimer')).toBeInTheDocument();
    expect(screen.getByText('User Accounts, Authentication & Security')).toBeInTheDocument();
    expect(screen.getByText('Anonymous Peer Participation & Safeguards')).toBeInTheDocument();
    expect(screen.getByText('Acceptable Use & Prohibited Conduct')).toBeInTheDocument();
    expect(screen.getByText('Digital Products & One-Time Purchases')).toBeInTheDocument();
    expect(screen.getByText('Payment Processing & Merchant of Record')).toBeInTheDocument();
    expect(screen.getByText('No Voluntary Refunds & Statutory Consumer Rights')).toBeInTheDocument();
    expect(screen.getByText('Distance Contracts & Statutory Withdrawal Disclosures')).toBeInTheDocument();
    expect(screen.getByText('Account Deletion & Impact on Purchased Rights')).toBeInTheDocument();
    expect(screen.getByText('Intellectual Property Rights')).toBeInTheDocument();
    expect(screen.getByText('Service Availability, Maintenance & Limitation of Liability')).toBeInTheDocument();
    expect(screen.getByText('Age Eligibility & Protection of Minors')).toBeInTheDocument();
    expect(screen.getByText('Dispute Resolution & Applicable Law')).toBeInTheDocument();
    expect(screen.getByText('Amendments to these Terms')).toBeInTheDocument();
    expect(screen.getByText('Contact & Customer Inquiries')).toBeInTheDocument();

    // Verify key terms content
    expect(screen.getByText(/10Signal is an independent digital platform developed and operated by a two-person team based in Türkiye/i)).toBeInTheDocument();
    expect(screen.getByText(/Merchant of Record \(MoR\), Lemon Squeezy, LLC/i)).toBeInTheDocument();
    expect(screen.getAllByText(/10signal\.me@gmail\.com/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/support@tensignal\.app/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/support@10signal\.me/i)).not.toBeInTheDocument();
  });

  it('renders complete Turkish Kullanım Koşulları with all 16 sections in Turkish locale', async () => {
    localStorage.setItem('tensignal_locale', 'tr');
    localStorage.setItem('tensignal_locale_manual', 'true');

    render(
      <LocaleProvider defaultLocale="tr">
        <LegalDocumentView docKey="terms" fullWidth={true} />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /^kullanım koşulları$/i })).toBeInTheDocument();
    });

    // Check last updated date
    expect(screen.getByText(/son güncelleme: 18 ekim 2026/i)).toBeInTheDocument();

    // Ensure fallback notice is completely absent
    expect(screen.queryByText(/bu yasal metin şu anda yalnızca resmi ingilizce sürümünde mevcuttur/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/türkçe sürüm yakında/i)).not.toBeInTheDocument();

    // Check Turkish section titles
    await screen.findByText('10Signal Hakkında ve İşletmeci Yapısı');
    expect(screen.getByText('Bireysel Farkındalık — Tıbbi ve Klinik Olmayan Nitelik')).toBeInTheDocument();
    expect(screen.getByText('Kullanıcı Hesapları ve Hesap Güvenliği')).toBeInTheDocument();
    expect(screen.getByText('Anonim Arkadaş Değerlendirmeleri ve Güvenceler')).toBeInTheDocument();
    expect(screen.getByText('Kabul Edilebilir Kullanım ve Yasaklanan Fiiller')).toBeInTheDocument();
    expect(screen.getByText('Dijital Ürünler ve Satın Alma Esasları')).toBeInTheDocument();
    expect(screen.getByText('Yetkili Satıcı Olarak Lemon Squeezy')).toBeInTheDocument();
    expect(screen.getByText('İadesiz Dijital Ürün Politikası ve Yasal Haklar')).toBeInTheDocument();
    expect(screen.getByText('Mesafeli Sözleşmeler ve Cayma Hakkı Bilgilendirmesi')).toBeInTheDocument();
    expect(screen.getByText('Hesap Silme ve Satın Alınan Dijital Hakların Durumu')).toBeInTheDocument();
    expect(screen.getByText('Fikrî Mülkiyet Hakları')).toBeInTheDocument();
    expect(screen.getByText('Hizmetin Sunumu ve Sorumluluğun Sınırlandırılması')).toBeInTheDocument();
    expect(screen.getByText('Yaş Sınırı ve Reşit Olmayanların Korunması')).toBeInTheDocument();
    expect(screen.getByText('Uyuşmazlıkların Çözümü ve Tüketici Başvuruları')).toBeInTheDocument();
    expect(screen.getByText('Koşullardaki Değişiklikler ve Yürürlük')).toBeInTheDocument();
    expect(screen.getByText('İletişim ve Müşteri Destek Kanalları')).toBeInTheDocument();

    // Verify key Turkish legal terms content
    expect(screen.getByText(/Türkiye'de bulunan iki kişilik bağımsız bir ekip tarafından geliştirilen ve işletilen dijital bir platformdur/i)).toBeInTheDocument();
    expect(screen.getByText(/Lemon Squeezy, LLC \(ABD\) tarafından yürütülmektedir/i)).toBeInTheDocument();
    expect(screen.getAllByText(/10signal\.me@gmail\.com/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Tüketici Hakem Heyetleri/i)).toBeInTheDocument();
  });

  it('switches dynamically between English and Turkish Terms without fallback banners or layout breakage', async () => {
    localStorage.setItem('tensignal_locale', 'en');
    localStorage.setItem('tensignal_locale_manual', 'true');

    render(
      <LocaleProvider defaultLocale="en">
        <TermsTestWrapper />
      </LocaleProvider>
    );

    // Initial state: EN
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /^terms of service$/i })).toBeInTheDocument();
    });
    expect(screen.getByTestId('current-locale')).toHaveTextContent('en');

    // Switch to Turkish
    fireEvent.click(screen.getByTestId('switch-tr'));

    await waitFor(() => {
      expect(screen.getByTestId('current-locale')).toHaveTextContent('tr');
      expect(screen.getByRole('heading', { level: 1, name: /^kullanım koşulları$/i })).toBeInTheDocument();
    });

    expect(screen.getByText('10Signal Hakkında ve İşletmeci Yapısı')).toBeInTheDocument();
    expect(screen.queryByText(/bu yasal metin şu anda yalnızca resmi ingilizce sürümünde mevcuttur/i)).not.toBeInTheDocument();

    // Switch back to English
    fireEvent.click(screen.getByTestId('switch-en'));

    await waitFor(() => {
      expect(screen.getByTestId('current-locale')).toHaveTextContent('en');
      expect(screen.getByRole('heading', { level: 1, name: /^terms of service$/i })).toBeInTheDocument();
    });

    expect(screen.getByText('About 10Signal & Operational Structure')).toBeInTheDocument();
  });
});
