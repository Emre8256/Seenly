package com.seenly.backend.payment;

import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
public class PaymentProductCatalog {
    public static final String SEENLY_PLUS = "seenly_plus_v1";
    public static final String CAPACITY_100 = "response_capacity_100_v1";
    public static final String CAPACITY_250 = "response_capacity_250_v1";
    public static final String CAPACITY_500 = "response_capacity_500_v1";

    private final Map<String, PaymentProduct> products;

    public PaymentProductCatalog() {
        Map<String, PaymentProduct> catalog = new LinkedHashMap<>();
        catalog.put(SEENLY_PLUS, new PaymentProduct(SEENLY_PLUS, EntitlementType.PLUS, 0, 299, "USD", true));
        catalog.put(CAPACITY_100, new PaymentProduct(CAPACITY_100, EntitlementType.RESPONSE_CAPACITY, 100, 99, "USD", true));
        catalog.put(CAPACITY_250, new PaymentProduct(CAPACITY_250, EntitlementType.RESPONSE_CAPACITY, 250, 199, "USD", true));
        catalog.put(CAPACITY_500, new PaymentProduct(CAPACITY_500, EntitlementType.RESPONSE_CAPACITY, 500, 399, "USD", true));
        products = Collections.unmodifiableMap(catalog);
    }

    public PaymentProduct requireActive(String code) {
        PaymentProduct product = products.get(code);
        if (product == null || !product.active()) {
            throw new IllegalArgumentException("Unknown or inactive product code.");
        }
        return product;
    }

    public List<PaymentProduct> activeProducts() {
        return products.values().stream().filter(PaymentProduct::active).toList();
    }
}
