package com.kofi.paymentservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;

// Binds the paystack: block in payment-service.yml
// to strongly typed Java fields.
//
// Every service that needs a Paystack value injects this
// bean — no one reads Environment or @Value directly.
// One place, one source of truth.
@Configuration
@ConfigurationProperties(prefix = "paystack")
@Validated
@Data
public class PaystackConfig {

    // sk_test_xxx for test, sk_live_xxx for production
    // Used in WebClientConfig as the Authorization header
    // for every call to Paystack's API
    @NotBlank(message = "Paystack secret key must be configured")
    private String secretKey;

    // pk_test_xxx for test, pk_live_xxx for production
    // Not used server-side — included here for completeness
    // and in case you return it to a frontend that needs it
    @NotBlank(message = "Paystack public key must be configured")
    private String publicKey;

    // The secret you set in Paystack dashboard → Webhooks
    // Used by PaystackService.verifyWebhookSignature to
    // compute HMAC-SHA512 and compare against
    // x-paystack-signature header on incoming webhooks
    @NotBlank(message = "Paystack webhook secret must be configured")
    private String webhookSecret;

    // https://api.paystack.co — never changes unless Paystack
    // releases a v2 API. Injected into WebClient base URL.
    // Having it in config means you can point to a mock
    // server in tests without changing Java code
    @NotBlank(message = "Paystack base URL must be configured")
    private String baseUrl;

    // GHS for Ghana Cedis
    // Sent in every initialize and charge request
    // Change to NGN, USD etc if you expand to other markets
    @NotBlank(message = "Paystack currency must be configured")
    private String currency;

    // -------------------------------------------------------
    // Convenience method — used by PaystackService to build
    // the Authorization header value for Paystack API calls
    // Format Paystack expects: "Bearer sk_test_xxx"
    // -------------------------------------------------------
    public String getBearerToken() {
        return "Bearer " + secretKey;
    }

    // -------------------------------------------------------
    // Convenience method — used when logging to avoid
    // accidentally printing the full secret key to console
    // Shows only the first 12 characters e.g. "sk_test_xxxx"
    // -------------------------------------------------------
    public String getMaskedSecretKey() {
        if (secretKey == null || secretKey.length() < 12) {
            return "***";
        }
        return secretKey.substring(0, 12) + "***";
    }
}