package com.tensignal.backend.payment;

import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class PaymentProductCatalog {
    // Current Launch Products (Version 2 Model)
    public static final String TEN_SIGNAL_PLUS = "seenly_plus_v1";
    public static final String SEENLY_PLUS = TEN_SIGNAL_PLUS;
    public static final String TEN_SIGNAL_PLUS_V2 = "tensignal_plus_v1";

    public static final String CAPACITY_50 = "response_capacity_50_v2";
    public static final String CAPACITY_150 = "response_capacity_150_v2";
    public static final String CAPACITY_300 = "response_capacity_300_v2";

    // Legacy / Historical Products (Version 1 Model)
    public static final String CAPACITY_100 = "response_capacity_100_v1";
    public static final String CAPACITY_250 = "response_capacity_250_v1";
    public static final String CAPACITY_500 = "response_capacity_500_v1";
    public static final String LEGACY_CAPACITY_100 = CAPACITY_100;
    public static final String LEGACY_CAPACITY_250 = CAPACITY_250;
    public static final String LEGACY_CAPACITY_500 = CAPACITY_500;

    private final Map<String, PaymentProduct> products;

    public PaymentProductCatalog() {
        Map<String, PaymentProduct> catalog = new LinkedHashMap<>();

        // 1. Current Launch Products
        // Premium: Lifetime unlimited responses ($3.99 USD)
        catalog.put(SEENLY_PLUS, new PaymentProduct(SEENLY_PLUS, EntitlementType.PLUS, 0, 399, true));
        catalog.put(TEN_SIGNAL_PLUS_V2, new PaymentProduct(TEN_SIGNAL_PLUS_V2, EntitlementType.PLUS, 0, 399, true));

        // Mini: +50 responses ($0.99 USD)
        catalog.put(CAPACITY_50, new PaymentProduct(CAPACITY_50, EntitlementType.RESPONSE_CAPACITY, 50, 99, true));

        // Standard: +150 responses ($1.99 USD)
        catalog.put(CAPACITY_150, new PaymentProduct(CAPACITY_150, EntitlementType.RESPONSE_CAPACITY, 150, 199, true));

        // Large: +300 responses ($2.99 USD)
        catalog.put(CAPACITY_300, new PaymentProduct(CAPACITY_300, EntitlementType.RESPONSE_CAPACITY, 300, 299, true));

        // 2. Legacy Products (Maintained for backward compatibility and historical webhook / order verification)
        catalog.put(CAPACITY_100, new PaymentProduct(CAPACITY_100, EntitlementType.RESPONSE_CAPACITY, 100, 99, true));
        catalog.put(CAPACITY_250, new PaymentProduct(CAPACITY_250, EntitlementType.RESPONSE_CAPACITY, 250, 199, true));
        catalog.put(CAPACITY_500, new PaymentProduct(CAPACITY_500, EntitlementType.RESPONSE_CAPACITY, 500, 399, true));

        products = Collections.unmodifiableMap(catalog);
    }

    public PaymentProduct requireActive(String code) {
        PaymentProduct product = findProduct(code).orElse(null);
        if (product == null || !product.active()) {
            throw new IllegalArgumentException("Unknown or inactive product code.");
        }
        return product;
    }

    public Optional<PaymentProduct> findProduct(String code) {
        if (code == null) {
            return Optional.empty();
        }
        PaymentProduct product = products.get(code);
        if (product == null && (TEN_SIGNAL_PLUS_V2.equalsIgnoreCase(code) || "tensignal_plus".equalsIgnoreCase(code))) {
            return Optional.ofNullable(products.get(SEENLY_PLUS));
        }
        return Optional.ofNullable(product);
    }

    public List<PaymentProduct> activeProducts() {
        return products.values().stream().filter(PaymentProduct::active).distinct().toList();
    }

    /**
     * Returns the 4 active launch products according to the finalized pricing and capacity model:
     * Plus (Unlimited), Mini (+50), Standard (+150), Large (+300).
     */
    public List<PaymentProduct> launchProducts() {
        return List.of(
            products.get(SEENLY_PLUS),
            products.get(CAPACITY_50),
            products.get(CAPACITY_150),
            products.get(CAPACITY_300)
        );
    }
}
