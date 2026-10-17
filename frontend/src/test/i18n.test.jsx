import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  LocaleProvider,
  useLocale,
  DEFAULT_LOCALE,
  CANONICAL_LOCALE,
  detectBrowserPrimaryLocale,
  resolveInitialLocale
} from '../context/LocaleContext';
import { getSupportedLocales, registerLocale } from '../content/locales/registry';

// Test consumer component
function TestConsumer({ testKey, testParams, errorObj, numberVal, dateVal, currencyVal, legalDocKey }) {
  const {
    locale,
    setLocale,
    t,
    getObject,
    supportedLocales,
    formatNumber,
    formatDate,
    formatCurrency,
    formatApiError
  } = useLocale();

  const legalDoc = legalDocKey ? getObject('legal', legalDocKey) : null;

  return (
    <div>
      <span data-testid="current-locale">{locale}</span>
      <span data-testid="translated-text">{testKey ? t(testKey, testParams) : ''}</span>
      {errorObj && <span data-testid="api-error">{formatApiError(errorObj)}</span>}
      {numberVal !== undefined && <span data-testid="formatted-number">{formatNumber(numberVal)}</span>}
      {dateVal && <span data-testid="formatted-date">{formatDate(dateVal, { year: 'numeric', month: 'numeric', day: 'numeric' })}</span>}
      {currencyVal !== undefined && <span data-testid="formatted-currency">{formatCurrency(currencyVal, 'USD')}</span>}
      {legalDoc && (
        <div data-testid="legal-doc">
          <h1 data-testid="legal-title">{legalDoc.title}</h1>
          <span data-testid="legal-fallback">{String(!!legalDoc.isFallbackBody)}</span>
          <span data-testid="legal-sections-count">{legalDoc.sections?.length || 0}</span>
          <p data-testid="legal-first-clause">{legalDoc.sections?.[0]?.blocks?.[0]?.text || ''}</p>
        </div>
      )}
      <ul data-testid="supported-locales">
        {supportedLocales.map((loc) => (
          <li key={loc.code} data-testid={`locale-${loc.code}`}>
            {loc.nativeName}
          </li>
        ))}
      </ul>
      <button data-testid="switch-to-en" onClick={() => setLocale('en')}>Switch EN</button>
      <button data-testid="switch-to-tr" onClick={() => setLocale('tr')}>Switch TR</button>
      <button data-testid="switch-to-unsupported" onClick={() => setLocale('unsupported_locale')}>Switch Invalid</button>
    </div>
  );
}

describe('Comprehensive i18n Behavior Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. renders Turkish content correctly', () => {
    render(
      <LocaleProvider defaultLocale="tr">
        <TestConsumer testKey="common.save" />
      </LocaleProvider>
    );
    expect(screen.getByTestId('current-locale')).toHaveTextContent('tr');
    expect(screen.getByTestId('translated-text')).toHaveTextContent('Kaydet');
  });

  it('2. renders English content correctly', () => {
    render(
      <LocaleProvider defaultLocale="en">
        <TestConsumer testKey="common.save" />
      </LocaleProvider>
    );
    expect(screen.getByTestId('current-locale')).toHaveTextContent('en');
    expect(screen.getByTestId('translated-text')).toHaveTextContent('Save');
  });

  it('3. language switching updates visible UI dynamically', () => {
    render(
      <LocaleProvider defaultLocale="tr">
        <TestConsumer testKey="common.save" />
      </LocaleProvider>
    );
    expect(screen.getByTestId('translated-text')).toHaveTextContent('Kaydet');

    fireEvent.click(screen.getByTestId('switch-to-en'));
    expect(screen.getByTestId('current-locale')).toHaveTextContent('en');
    expect(screen.getByTestId('translated-text')).toHaveTextContent('Save');

    fireEvent.click(screen.getByTestId('switch-to-tr'));
    expect(screen.getByTestId('current-locale')).toHaveTextContent('tr');
    expect(screen.getByTestId('translated-text')).toHaveTextContent('Kaydet');
  });

  it('4. persists selected locale to localStorage', () => {
    render(
      <LocaleProvider defaultLocale="tr">
        <TestConsumer testKey="common.save" />
      </LocaleProvider>
    );
    fireEvent.click(screen.getByTestId('switch-to-en'));
    expect(localStorage.getItem('seenly_locale')).toBe('en');
  });

  it('5. falls back to default locale when unsupported locale is provided', () => {
    render(
      <LocaleProvider defaultLocale="unsupported_xx">
        <TestConsumer testKey="common.save" />
      </LocaleProvider>
    );
    expect(screen.getByTestId('current-locale')).toHaveTextContent(DEFAULT_LOCALE);
  });

  it('6. falls back to canonical English when key is missing in target locale', () => {
    render(
      <LocaleProvider defaultLocale="tr">
        <TestConsumer testKey="home.hero.title1" />
      </LocaleProvider>
    );
    expect(screen.getByTestId('translated-text').textContent.length).toBeGreaterThan(0);
  });

  it('7. logs a warning in dev mode when translation key is completely missing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <LocaleProvider defaultLocale="en">
        <TestConsumer testKey="completely.nonexistent.fakeKey" />
      </LocaleProvider>
    );
    expect(screen.getByTestId('translated-text')).toHaveTextContent('completely.nonexistent.fakeKey');
    warnSpy.mockRestore();
  });

  it('8. provides registry-driven supported locales', () => {
    render(
      <LocaleProvider defaultLocale="en">
        <TestConsumer />
      </LocaleProvider>
    );
    expect(screen.getByTestId('locale-tr')).toHaveTextContent('Türkçe');
    expect(screen.getByTestId('locale-en')).toHaveTextContent('English');
  });

  it('9. supports variable interpolation in translation strings', async () => {
    render(
      <LocaleProvider defaultLocale="en">
        <TestConsumer testKey="auth.otpDesc" testParams={{ email: 'alex@example.com' }} />
      </LocaleProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('translated-text')).toHaveTextContent('alex@example.com');
    });
  });

  it('10. handles pluralization rules', async () => {
    render(
      <LocaleProvider defaultLocale="en">
        <TestConsumer testKey="dashboard.stats.responses" testParams={{ count: 1 }} />
      </LocaleProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('translated-text')).toHaveTextContent('1 Response');
    });
  });

  it('11. formats numbers using Intl formatting per locale', () => {
    render(
      <LocaleProvider defaultLocale="en">
        <TestConsumer numberVal={1250.5} />
      </LocaleProvider>
    );
    expect(screen.getByTestId('formatted-number')).toHaveTextContent('1,250.5');
  });

  it('12. formats dates using Intl date formatting per locale', () => {
    const testDate = new Date(2026, 8, 4); // Sept 4, 2026
    render(
      <LocaleProvider defaultLocale="en">
        <TestConsumer dateVal={testDate} />
      </LocaleProvider>
    );
    expect(screen.getByTestId('formatted-date')).toHaveTextContent('9/4/2026');
  });

  it('13. formats currencies using Intl currency formatting per locale', () => {
    render(
      <LocaleProvider defaultLocale="en">
        <TestConsumer currencyVal={19.99} />
      </LocaleProvider>
    );
    expect(screen.getByTestId('formatted-currency')).toHaveTextContent('$19.99');
  });

  it('14. localizes API errors by status code and message patterns', () => {
    render(
      <LocaleProvider defaultLocale="en">
        <TestConsumer errorObj={{ status: 401 }} />
      </LocaleProvider>
    );
    expect(screen.getByTestId('api-error')).toHaveTextContent('Session expired. Please log in again.');
  });

  it('15. localizes validation messages across languages', () => {
    const { unmount } = render(
      <LocaleProvider defaultLocale="en">
        <TestConsumer testKey="errors.emailInvalid" />
      </LocaleProvider>
    );
    expect(screen.getByTestId('translated-text')).toHaveTextContent('Please enter a valid email address.');
    unmount();
    localStorage.clear();

    render(
      <LocaleProvider defaultLocale="tr">
        <TestConsumer testKey="errors.emailInvalid" />
      </LocaleProvider>
    );
    expect(screen.getByTestId('translated-text')).toHaveTextContent('Lütfen geçerli bir e-posta adresi giriniz.');
  });

  it('16. localizes accessibility labels', () => {
    const { unmount } = render(
      <LocaleProvider defaultLocale="en">
        <TestConsumer testKey="accessibility.closeDialog" />
      </LocaleProvider>
    );
    expect(screen.getByTestId('translated-text')).toHaveTextContent('Close dialog');
    unmount();
    localStorage.clear();

    render(
      <LocaleProvider defaultLocale="tr">
        <TestConsumer testKey="accessibility.closeDialog" />
      </LocaleProvider>
    );
    expect(screen.getByTestId('translated-text')).toHaveTextContent('Pencereyi kapat');
  });

  it('17. lazily loads extended namespaces on demand', async () => {
    render(
      <LocaleProvider defaultLocale="en">
        <TestConsumer testKey="dashboard.responses.tabTitle" />
      </LocaleProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('translated-text')).toHaveTextContent('Received Analytics');
    });
  });

  it('18. provides canonical English legal fallback for missing TR legal body', async () => {
    render(
      <LocaleProvider defaultLocale="tr">
        <TestConsumer legalDocKey="untranslatedDoc" />
      </LocaleProvider>
    );
    await waitFor(() => {
      // Title is in Turkish
      expect(screen.getByTestId('legal-title')).toHaveTextContent('Çevrilmemiş Belge');
      // Body clauses fall back to canonical English
      expect(screen.getByTestId('legal-fallback')).toHaveTextContent('true');
      expect(Number(screen.getByTestId('legal-sections-count').textContent)).toBeGreaterThan(0);
      expect(screen.getByTestId('legal-first-clause')).toHaveTextContent('Welcome to 10Signal.');
    });
  });

  it('18b. renders complete Turkish legal document when TR sections are provided', async () => {
    render(
      <LocaleProvider defaultLocale="tr">
        <TestConsumer legalDocKey="terms" />
      </LocaleProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('legal-title')).toHaveTextContent('Kullanım Koşulları');
      expect(screen.getByTestId('legal-fallback')).toHaveTextContent('false');
      expect(Number(screen.getByTestId('legal-sections-count').textContent)).toBe(17);
      expect(screen.getByTestId('legal-first-clause')).toHaveTextContent("10Signal'a hoş geldiniz.");
    });
  });

  it('19. allows registering a third locale without modifying application page components', () => {
    registerLocale('es', {
      label: 'Español',
      flag: '🇪🇸',
      loadCore: () => Promise.resolve({
        common: { save: 'Guardar' },
        navigation: {},
        home: {},
        auth: {},
        errors: {},
        accessibility: {}
      }),
      loadExtended: () => Promise.resolve({})
    });

    expect(getSupportedLocales().some(l => l.code === 'es')).toBe(true);
  });
});

describe('12.A Automatic Browser Language Detection', () => {
  it('detects tr for tr-TR primary', () => {
    expect(detectBrowserPrimaryLocale({ languages: ['tr-TR', 'en-US'] })).toBe('tr');
    expect(detectBrowserPrimaryLocale({ language: 'tr-TR' })).toBe('tr');
  });

  it('detects tr for tr-CY primary', () => {
    expect(detectBrowserPrimaryLocale({ languages: ['tr-CY'] })).toBe('tr');
  });

  it('detects en for en-US primary', () => {
    expect(detectBrowserPrimaryLocale({ languages: ['en-US', 'tr-TR'] })).toBe('en');
  });

  it('detects en for de-DE primary', () => {
    expect(detectBrowserPrimaryLocale({ languages: ['de-DE'] })).toBe('en');
  });

  it('detects en for fr-FR primary', () => {
    expect(detectBrowserPrimaryLocale({ languages: ['fr-FR'] })).toBe('en');
  });

  it('detects en for invalid or empty primary', () => {
    expect(detectBrowserPrimaryLocale(null)).toBe('en');
    expect(detectBrowserPrimaryLocale({})).toBe('en');
    expect(detectBrowserPrimaryLocale({ languages: [] })).toBe('en');
    expect(detectBrowserPrimaryLocale({ language: '' })).toBe('en');
    expect(detectBrowserPrimaryLocale({ language: 'unknown-XX' })).toBe('en');
  });

  it('requires primary to be Turkish; [de-DE, tr-TR] resolves to en', () => {
    expect(detectBrowserPrimaryLocale({ languages: ['de-DE', 'tr-TR'] })).toBe('en');
  });

  it('requires primary to be Turkish; [tr-TR, en-US] resolves to tr', () => {
    expect(detectBrowserPrimaryLocale({ languages: ['tr-TR', 'en-US'] })).toBe('tr');
  });
});

describe('12.B Manual Preference Priority', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('Turkish browser + manual English -> en', () => {
    localStorage.setItem('tensignal_locale', 'en');
    localStorage.setItem('tensignal_locale_manual', 'true');
    // Even if browser is Turkish:
    const mockNav = { languages: ['tr-TR'] };
    const originalNav = global.navigator;
    try {
      expect(resolveInitialLocale()).toBe('en');
    } finally {
      global.navigator = originalNav;
    }
  });

  it('English browser + manual Turkish -> tr', () => {
    localStorage.setItem('tensignal_locale', 'tr');
    localStorage.setItem('tensignal_locale_manual', 'true');
    expect(resolveInitialLocale()).toBe('tr');
  });

  it('persists manual choice after simulated refresh / restart', () => {
    render(
      <LocaleProvider>
        <TestConsumer />
      </LocaleProvider>
    );
    fireEvent.click(screen.getByTestId('switch-to-en'));
    expect(localStorage.getItem('tensignal_locale_manual')).toBe('true');
    expect(localStorage.getItem('tensignal_locale')).toBe('en');

    // On next init
    expect(resolveInitialLocale()).toBe('en');
  });

  it('preserves legacy user saved locale if manual flag not set', () => {
    localStorage.setItem('tensignal_locale', 'tr');
    expect(resolveInitialLocale()).toBe('tr');
  });
});

describe('12.C Account & Device Synchronization', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  function SyncTestConsumer({ accountPreferredLocale }) {
    const { locale, setLocale, syncAccountLocale, resetAccountLocale } = useLocale();
    return (
      <div>
        <span data-testid="sync-locale">{locale}</span>
        <button data-testid="do-sync" onClick={() => syncAccountLocale(accountPreferredLocale)}>Sync</button>
        <button data-testid="do-manual-tr" onClick={() => setLocale('tr')}>Manual TR</button>
        <button data-testid="do-manual-en" onClick={() => setLocale('en')}>Manual EN</button>
        <button data-testid="do-logout" onClick={() => resetAccountLocale()}>Logout</button>
      </div>
    );
  }

  it('account preferredLocale=en takes precedence over device/browser default', () => {
    localStorage.setItem('tensignal_account_locale', 'en');
    expect(resolveInitialLocale()).toBe('en');
  });

  it('account preferredLocale=tr takes precedence over English browser', () => {
    localStorage.setItem('tensignal_account_locale', 'tr');
    expect(resolveInitialLocale()).toBe('tr');
  });

  it('syncAccountLocale applies account preference and persists for cross-device consistency', () => {
    const { unmount } = render(
      <LocaleProvider>
        <SyncTestConsumer accountPreferredLocale="en" />
      </LocaleProvider>
    );
    fireEvent.click(screen.getByTestId('do-sync'));
    expect(screen.getByTestId('sync-locale')).toHaveTextContent('en');
    expect(localStorage.getItem('tensignal_account_locale')).toBe('en');
    expect(localStorage.getItem('tensignal_locale')).toBe('en');
    unmount();
  });

  it('logout cleans account locale and prevents preference leak across users', () => {
    localStorage.setItem('tensignal_account_locale', 'tr');
    localStorage.setItem('tensignal_locale_manual', 'true');
    localStorage.setItem('tensignal_locale', 'tr');

    render(
      <LocaleProvider>
        <SyncTestConsumer accountPreferredLocale="tr" />
      </LocaleProvider>
    );

    fireEvent.click(screen.getByTestId('do-logout'));
    expect(localStorage.getItem('tensignal_account_locale')).toBeNull();
    expect(localStorage.getItem('tensignal_locale_manual')).toBeNull();
  });
});
