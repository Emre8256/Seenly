package com.seenly.backend.controller;

import com.seenly.backend.config.PaymentProperties;
import com.seenly.backend.dto.CheckoutResponse;
import com.seenly.backend.dto.CreateCheckoutRequest;
import com.seenly.backend.dto.PaymentProductDto;
import com.seenly.backend.dto.PaymentTransactionDto;
import com.seenly.backend.dto.PaymentWebhookResponse;
import com.seenly.backend.service.BillingService;
import com.seenly.backend.service.PaymentCheckoutService;
import com.seenly.backend.service.PaymentWebhookService;
import com.seenly.backend.service.RateLimitService;
import com.seenly.backend.service.AbuseSignalService;
import com.seenly.backend.service.ClientIpResolver;
import com.seenly.backend.config.RateLimitPolicy;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.time.Duration;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;
    private final PaymentCheckoutService checkoutService;
    private final PaymentWebhookService webhookService;
    private final PaymentProperties paymentProperties;
    private final RateLimitService rateLimitService;
    private final AbuseSignalService abuseSignalService;
    private final ClientIpResolver clientIpResolver;
    private final RateLimitPolicy ratePolicy;

    @GetMapping("/products")
    public ResponseEntity<List<PaymentProductDto>> products() {
        return ResponseEntity.ok(checkoutService.products());
    }

    @PostMapping("/checkouts")
    public ResponseEntity<CheckoutResponse> createCheckout(
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            @Valid @RequestBody CreateCheckoutRequest checkoutRequest,
            HttpServletRequest request) {
        limit("BILLING_CHECKOUT", ownerToken, request);
        return ResponseEntity.ok(checkoutService.createCheckout(ownerToken, checkoutRequest.productCode()));
    }

    @GetMapping("/transactions/{transactionId}")
    public ResponseEntity<PaymentTransactionDto> transaction(
            @PathVariable UUID transactionId,
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            HttpServletRequest request) {
        limit("BILLING_STATUS", ownerToken, request);
        return ResponseEntity.ok(checkoutService.getTransaction(ownerToken, transactionId));
    }

    @PostMapping(value = "/webhooks/{provider}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PaymentWebhookResponse> webhook(
            @PathVariable String provider,
            @RequestHeader(value = "X-Payment-Signature", required = false) String signature,
            HttpServletRequest request) throws IOException {
        byte[] payload = request.getInputStream().readAllBytes();
        long declaredLength = request.getContentLengthLong();
        if (payload.length > paymentProperties.getMaxWebhookBytes()
            || declaredLength > paymentProperties.getMaxWebhookBytes()) {
            return ResponseEntity.status(413).build();
        }
        return ResponseEntity.ok(webhookService.handle(provider, signature, payload));
    }

    @DeleteMapping("/delete-account")
    public ResponseEntity<Void> deleteAccount(
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            HttpServletRequest request) {
        limit("ACCOUNT_DELETE", ownerToken, request);
        billingService.deleteAccount(ownerToken);
        return ResponseEntity.ok().build();
    }

    private void limit(String action, String ownerToken, HttpServletRequest request) {
        String subject = abuseSignalService.networkHash(clientIpResolver.resolve(request)) + "|"
            + (ownerToken == null ? "missing" : ownerToken);
        rateLimitService.check(action, subject, ratePolicy.ownerMutations, Duration.ofMinutes(1));
    }
}
