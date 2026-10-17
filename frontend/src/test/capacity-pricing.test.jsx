import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { LocaleProvider } from '../context/LocaleContext';
import SubscriptionTab from '../pages/settings/SubscriptionTab';
import { PAYMENT_PRODUCT_CODES } from '../services/api';
import trBilling from '../content/locales/tr/billing.json';
import enBilling from '../content/locales/en/billing.json';
import trHome from '../content/locales/tr/home.json';
import enHome from '../content/locales/en/home.json';
import trUi from '../content/locales/tr/ui.json';
import enUi from '../content/locales/en/ui.json';
import trSettings from '../content/locales/tr/settings.json';
import enSettings from '../content/locales/en/settings.json';

describe('10Signal Launch Capacity & Pricing System', () => {

  describe('Product Code Mappings', () => {
    it('defines correct launch capacity pack and plus product codes', () => {
      expect(PAYMENT_PRODUCT_CODES.TEN_SIGNAL_PLUS).toBe('seenly_plus_v1');
      expect(PAYMENT_PRODUCT_CODES.SEENLY_PLUS).toBe('seenly_plus_v1');
      expect(PAYMENT_PRODUCT_CODES.CAPACITY_50).toBe('response_capacity_50_v2');
      expect(PAYMENT_PRODUCT_CODES.CAPACITY_150).toBe('response_capacity_150_v2');
      expect(PAYMENT_PRODUCT_CODES.CAPACITY_300).toBe('response_capacity_300_v2');
      // Legacy codes preserved for backward compatibility
      expect(PAYMENT_PRODUCT_CODES.CAPACITY_100).toBe('response_capacity_100_v1');
      expect(PAYMENT_PRODUCT_CODES.CAPACITY_250).toBe('response_capacity_250_v1');
      expect(PAYMENT_PRODUCT_CODES.CAPACITY_500).toBe('response_capacity_500_v1');
    });
  });

  describe('Translation & Locale Consistency', () => {
    it('verifies 20 free evaluation limit in TR and EN locale files', () => {
      expect(trBilling.free.f2).toContain('20');
      expect(enBilling.free.f2).toContain('20');
      expect(trHome.pricing.freeF2Title).toContain('20');
      expect(enHome.pricing.freeF2Title).toContain('20');
      expect(trUi.landing_pricing_p1_f3).toContain('20');
      expect(enUi.landing_pricing_p1_f3).toContain('20');
    });

    it('verifies Premium / Plus launch prices in TR ($3.99) and EN ($3.99)', () => {
      expect(trBilling.premium.price).toBe('$3.99');
      expect(enBilling.premium.price).toBe('$3.99');
      expect(trHome.pricing.plusPrice).toBe('$3.99');
      expect(enHome.pricing.plusPrice).toBe('$3.99');
      expect(trUi.pricing_plan_premium_price).toBe('$3.99');
      expect(enUi.pricing_plan_premium_price).toBe('$3.99');
    });

    it('verifies settings pack labels and prices for Mini, Standard, and Large', () => {
      expect(trSettings.subscription.miniPack).toBe('MİNİ PAKET');
      expect(trSettings.subscription.standardPack).toBe('STANDART PAKET');
      expect(trSettings.subscription.maxiPack).toBe('LARGE PAKET');
      expect(trSettings.subscription.miniPrice).toBe('$0.99');
      expect(trSettings.subscription.standardPrice).toBe('$1.99');
      expect(trSettings.subscription.largePrice).toBe('$2.99');
      expect(enSettings.subscription.miniPack).toBe('MINI PACK');
      expect(enSettings.subscription.standardPack).toBe('STANDARD PACK');
      expect(enSettings.subscription.maxiPack).toBe('LARGE PACK');
      expect(enSettings.subscription.miniPrice).toBe('$0.99');
      expect(enSettings.subscription.standardPrice).toBe('$1.99');
      expect(enSettings.subscription.largePrice).toBe('$2.99');
    });
  });

  describe('SubscriptionTab Component Behavior', () => {
    const launchPacks = [
      { amount: 50, productCode: 'response_capacity_50_v2', label: 'MİNİ PAKET', price: '$0.99', theme: 'tier1' },
      { amount: 150, productCode: 'response_capacity_150_v2', label: 'STANDART PAKET', price: '$1.99', theme: 'tier2' },
      { amount: 300, productCode: 'response_capacity_300_v2', label: 'LARGE PAKET', price: '$2.99', theme: 'tier3' }
    ];

    it('renders free quota tracker and launch capacity packs when user is not premium', () => {
      render(
        <LocaleProvider>
          <SubscriptionTab
            isPremium={false}
            responseCount={5}
            maxResponseLimit={20}
            usagePercent={25}
            isQuotaFull={false}
            isQuotaNearFull={false}
            showPlusActivePerks={false}
            setShowPlusActivePerks={vi.fn()}
            actionLoading={false}
            checkoutLoadingCode={null}
            handleUpgradeToPlus={vi.fn()}
            capacityPackOptions={launchPacks}
            handleBuyPack={vi.fn()}
            plusPriceFormatted="$3.99"
          />
        </LocaleProvider>
      );

      // Quota numbers & redesigned SaaS typography (English default in tests)
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('Evaluation Capacity')).toBeInTheDocument();
      expect(screen.getByText('Evaluations received from your friends')).toBeInTheDocument();
      expect(screen.getByText('Used')).toBeInTheDocument();
      expect(screen.getByText('25% of capacity used')).toBeInTheDocument();
      expect(screen.getByText('15 evaluations remaining')).toBeInTheDocument();

      // Launch packs displayed
      expect(screen.getByText('+50')).toBeInTheDocument();
      expect(screen.getByText('+150')).toBeInTheDocument();
      expect(screen.getByText('+300')).toBeInTheDocument();
      expect(screen.getByText('0.99')).toBeInTheDocument();
      expect(screen.getByText('1.99')).toBeInTheDocument();
      expect(screen.getByText('2.99')).toBeInTheDocument();
      expect(screen.getByText('$3.99')).toBeInTheDocument();
    });

    it('hides quota card and capacity pack purchase options when user is Premium', () => {
      const { container } = render(
        <LocaleProvider>
          <SubscriptionTab
            isPremium={true}
            responseCount={45}
            maxResponseLimit={-1}
            usagePercent={0}
            isQuotaFull={false}
            isQuotaNearFull={false}
            showPlusActivePerks={false}
            setShowPlusActivePerks={vi.fn()}
            actionLoading={false}
            checkoutLoadingCode={null}
            handleUpgradeToPlus={vi.fn()}
            capacityPackOptions={launchPacks}
            handleBuyPack={vi.fn()}
            plusPriceFormatted="$3.99"
          />
        </LocaleProvider>
      );

      // Quota tracker must be hidden
      expect(container.querySelector('.tensignal-quota-card')).toBeNull();
      // Capacity packs section must be hidden
      expect(container.querySelector('.tensignal-packs-painterly-container')).toBeNull();
      // Active Plus card must be visible
      expect(container.querySelector('.tensignal-plus-active-card')).toBeInTheDocument();
    });

    it('renders Turkish quota texts and suffix calculations correctly matching reference design', () => {
      localStorage.setItem('tensignal_account_locale', 'tr');
      render(
        <LocaleProvider>
          <SubscriptionTab
            isPremium={false}
            responseCount={5}
            maxResponseLimit={30}
            usagePercent={17}
            isQuotaFull={false}
            isQuotaNearFull={false}
            showPlusActivePerks={false}
            setShowPlusActivePerks={vi.fn()}
            actionLoading={false}
            checkoutLoadingCode={null}
            handleUpgradeToPlus={vi.fn()}
            capacityPackOptions={launchPacks}
            handleBuyPack={vi.fn()}
            plusPriceFormatted="$3.99"
          />
        </LocaleProvider>
      );

      expect(screen.getByText('Değerlendirme kapasitesi')).toBeInTheDocument();
      expect(screen.getByText('Arkadaşlarından gelen değerlendirmeler')).toBeInTheDocument();
      expect(screen.getByText('Kullanılan')).toBeInTheDocument();
      expect(screen.getByText("Kapasitenin %17'si kullanıldı")).toBeInTheDocument();
      expect(screen.getByText('25 değerlendirme hakkı kaldı')).toBeInTheDocument();
      localStorage.removeItem('tensignal_account_locale');
    });

    it('renders pre-payment refund disclosure and working legal links in English', () => {
      render(
        <LocaleProvider>
          <SubscriptionTab
            isPremium={false}
            responseCount={0}
            maxResponseLimit={20}
            usagePercent={0}
            isQuotaFull={false}
            isQuotaNearFull={false}
            showPlusActivePerks={false}
            setShowPlusActivePerks={vi.fn()}
            actionLoading={false}
            checkoutLoadingCode={null}
            handleUpgradeToPlus={vi.fn()}
            capacityPackOptions={launchPacks}
            handleBuyPack={vi.fn()}
            plusPriceFormatted="$3.99"
          />
        </LocaleProvider>
      );

      // Verify EN notice appears twice (for Plus and for Capacity Packs)
      const notices = screen.getAllByText(/Digital purchases are activated after payment confirmation\. Voluntary refunds are not offered\. Your statutory consumer rights remain unaffected\./i);
      expect(notices).toHaveLength(2);

      // Verify working links to Terms of Service and Refund Policy
      const termsLinks = screen.getAllByRole('link', { name: /Terms of Service/i });
      expect(termsLinks.length).toBeGreaterThanOrEqual(2);
      expect(termsLinks[0]).toHaveAttribute('href', '#/terms');
      expect(termsLinks[0]).toHaveAttribute('target', '_blank');

      const refundLinks = screen.getAllByRole('link', { name: /Refund Policy/i });
      expect(refundLinks.length).toBeGreaterThanOrEqual(2);
      expect(refundLinks[0]).toHaveAttribute('href', '#/refund');
      expect(refundLinks[0]).toHaveAttribute('target', '_blank');
    });

    it('renders pre-payment refund disclosure and working legal links in Turkish', () => {
      localStorage.setItem('tensignal_account_locale', 'tr');
      render(
        <LocaleProvider>
          <SubscriptionTab
            isPremium={false}
            responseCount={0}
            maxResponseLimit={20}
            usagePercent={0}
            isQuotaFull={false}
            isQuotaNearFull={false}
            showPlusActivePerks={false}
            setShowPlusActivePerks={vi.fn()}
            actionLoading={false}
            checkoutLoadingCode={null}
            handleUpgradeToPlus={vi.fn()}
            capacityPackOptions={launchPacks}
            handleBuyPack={vi.fn()}
            plusPriceFormatted="$3.99"
          />
        </LocaleProvider>
      );

      // Verify TR notice appears twice (for Plus and for Capacity Packs)
      const notices = screen.getAllByText(/Dijital ürünler ödeme onaylandıktan sonra hesabınıza tanımlanır\. Gönüllü iade sunulmaz\. Kanuni tüketici haklarınız saklıdır\./i);
      expect(notices).toHaveLength(2);

      // Verify working links to Kullanım Koşulları and İade Politikası
      const termsLinks = screen.getAllByRole('link', { name: /Kullanım Koşulları/i });
      expect(termsLinks.length).toBeGreaterThanOrEqual(2);
      expect(termsLinks[0]).toHaveAttribute('href', '#/terms');
      expect(termsLinks[0]).toHaveAttribute('target', '_blank');

      const refundLinks = screen.getAllByRole('link', { name: /İade Politikası/i });
      expect(refundLinks.length).toBeGreaterThanOrEqual(2);
      expect(refundLinks[0]).toHaveAttribute('href', '#/refund');
      expect(refundLinks[0]).toHaveAttribute('target', '_blank');

      localStorage.removeItem('tensignal_account_locale');
    });
  });
});
