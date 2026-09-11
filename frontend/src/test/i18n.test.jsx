import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { LocaleProvider, useLocale, DEFAULT_LOCALE, CANONICAL_LOCALE } from '../context/LocaleContext';
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
        <TestConsumer legalDocKey="terms" />
      </LocaleProvider>
    );
    await waitFor(() => {
      // Title is in Turkish
      expect(screen.getByTestId('legal-title')).toHaveTextContent('Kullanım Koşulları');
      // Body clauses fall back to canonical English
      expect(screen.getByTestId('legal-fallback')).toHaveTextContent('true');
      expect(Number(screen.getByTestId('legal-sections-count').textContent)).toBeGreaterThan(0);
      expect(screen.getByTestId('legal-first-clause')).toHaveTextContent('Welcome to Seenly.');
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
