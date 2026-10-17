package com.tensignal.backend.config;

import com.tensignal.backend.payment.PaymentProductCatalog;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.payment")
public class PaymentProperties {
    private String provider = "disabled";
    private String testWebhookSecret = "";
    private int maxWebhookBytes = 65_536;
    private LemonSqueezy lemonSqueezy = new LemonSqueezy();

    @Getter
    @Setter
    public static class LemonSqueezy {
        private String apiKey = "";
        private String webhookSecret = "";
        private String plusCheckoutUrl = "";
        private String capacity50CheckoutUrl = "";
        private String capacity150CheckoutUrl = "";
        private String capacity300CheckoutUrl = "";
        private String capacity100CheckoutUrl = "";
        private String capacity250CheckoutUrl = "";
        private String capacity500CheckoutUrl = "";

        public String getCheckoutUrl(String productCode) {
            if (productCode == null) {
                return null;
            }
            return switch (productCode) {
                case PaymentProductCatalog.SEENLY_PLUS, PaymentProductCatalog.TEN_SIGNAL_PLUS_V2 -> plusCheckoutUrl;
                case PaymentProductCatalog.CAPACITY_50 -> !capacity50CheckoutUrl.isBlank() ? capacity50CheckoutUrl : capacity100CheckoutUrl;
                case PaymentProductCatalog.CAPACITY_150 -> !capacity150CheckoutUrl.isBlank() ? capacity150CheckoutUrl : capacity250CheckoutUrl;
                case PaymentProductCatalog.CAPACITY_300 -> !capacity300CheckoutUrl.isBlank() ? capacity300CheckoutUrl : capacity500CheckoutUrl;
                case PaymentProductCatalog.CAPACITY_100 -> capacity100CheckoutUrl;
                case PaymentProductCatalog.CAPACITY_250 -> capacity250CheckoutUrl;
                case PaymentProductCatalog.CAPACITY_500 -> capacity500CheckoutUrl;
                default -> null;
            };
        }
    }
}
