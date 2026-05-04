package com.kofi.paymentservice.service;

import com.kofi.paymentservice.config.PaystackConfig;
import com.kofi.paymentservice.dto.PaystackChargeRequest;
import com.kofi.paymentservice.dto.PaystackInitializeRequest;
import com.kofi.paymentservice.dto.PaystackInitializeResponse;
import com.kofi.paymentservice.dto.PaystackVerifyResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaystackService {

    private final WebClient paystackWebClient;
    private final PaystackConfig paystackConfig;

    // INITIALIZE TRANSACTION
    // Called when a tenant books for the first time
    // or has no saved authorization code
    // Returns authorization_url tenant visits to pay
    public PaystackInitializeResponse initializeTransaction(
            String email,
            BigDecimal amount,
            String reference,
            String bookingId,
            UUID tenantId,
            String propertyTitle) {

        log.info("Initializing Paystack transaction — " +
                        "reference: {} amount: {} GHS email: {} key: {}",
                reference, amount, email,
                paystackConfig.getMaskedSecretKey());

        // Convert GHS to pesewas
        // Paystack requires smallest currency unit
        long amountInPesewas = convertToPesewas(amount);

        // Build metadata — echoed back in webhook and verify
        // so you can trace any Paystack event back to your booking
        PaystackInitializeRequest.PaystackMetadata metadata =
                PaystackInitializeRequest.PaystackMetadata.builder()
                        .bookingId(bookingId)
                        .tenantId(tenantId)
                        .propertyTitle(propertyTitle)
                        .customFields(List.of(
                                PaystackInitializeRequest
                                        .PaystackMetadata
                                        .CustomField.builder()
                                        .displayName("Booking ID")
                                        .variableName("booking_id")
                                        .value(bookingId)
                                        .build(),
                                PaystackInitializeRequest
                                        .PaystackMetadata
                                        .CustomField.builder()
                                        .displayName("Property")
                                        .variableName("property_title")
                                        .value(propertyTitle)
                                        .build()
                        ))
                        .build();

        PaystackInitializeRequest request = PaystackInitializeRequest.builder()
                        .email(email)
                        .amount(amountInPesewas)
                        .reference(reference)
                        .currency(paystackConfig.getCurrency())
                        .metadata(metadata)
                        .build();

        try {
            PaystackInitializeResponse response = paystackWebClient
                    .post()
                    .uri("/transaction/initialize")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(PaystackInitializeResponse.class)
                    .block();

            // Validate response shape
            if (response == null) {
                throw new RuntimeException(
                        "Paystack returned null response " +
                                "for initialize — reference: " + reference);
            }

            if (!response.isStatus()) {
                throw new RuntimeException(
                        "Paystack initialization failed — " +
                                "reference: " + reference +
                                " message: " + response.getMessage());
            }

            // Verify Paystack echoed back our reference
            // Mismatch would indicate a serious API issue
            if (!reference.equals(response.getData().getReference())) {
                log.warn("Paystack reference mismatch — " + "sent: {} received: {}", reference,
                        response.getData().getReference());
            }

            log.info("Paystack transaction initialized — " + "reference: {} authUrl: {}", reference,
                    response.getData().getAuthorizationUrl());

            return response;

        } catch (WebClientResponseException e) {
            log.error("Paystack API error during initialize — " + "status: {} body: {} reference: {}",
                    e.getStatusCode(),
                    e.getResponseBodyAsString(),
                    reference);
            throw new RuntimeException("Paystack initialization error: " + e.getResponseBodyAsString(), e);
        }
    }

    // CHARGE AUTHORIZATION
    // Called for returning tenants who have a saved card
    // No browser redirect — fully backend initiated
    // Paystack charges immediately and calls webhook
    public PaystackVerifyResponse chargeAuthorization(
            String authorizationCode,
            String email,
            BigDecimal amount,
            String reference) {

        log.info("Charging Paystack authorization — " + "reference: {} amount: {} GHS", reference, amount);

        long amountInPesewas = convertToPesewas(amount);

        PaystackChargeRequest request = PaystackChargeRequest.builder()
                .authorizationCode(authorizationCode)
                .email(email)
                .amount(amountInPesewas)
                .reference(reference)
                .currency(paystackConfig.getCurrency())
                .build();

        try {
            PaystackVerifyResponse response = paystackWebClient
                    .post()
                    .uri("/transaction/charge_authorization")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(PaystackVerifyResponse.class)
                    .block();

            if (response == null) {
                throw new RuntimeException(
                        "Paystack returned null response " +
                                "for charge_authorization — reference: "
                                + reference);
            }

            log.info("Paystack charge_authorization result — " + "reference: {} status: {}",
                    reference, response.getData() != null ? response.getData().getStatus() : "null");

            return response;

        } catch (WebClientResponseException e) {
            log.error("Paystack API error during charge — " + "status: {} body: {} reference: {}",
                    e.getStatusCode(),
                    e.getResponseBodyAsString(),
                    reference);
            throw new RuntimeException("Paystack charge error: " + e.getResponseBodyAsString(), e);
        }
    }

    // VERIFY TRANSACTION
    // Called after webhook to independently confirm
    // the transaction status directly from Paystack
    // NEVER trust a webhook alone. A bad actor could POST
    // a fake charge.success webhook to your endpoint.
    // Verification calls Paystack directly — ground truth.
    public PaystackVerifyResponse verifyTransaction(String reference) {

        log.info("Verifying Paystack transaction — " + "reference: {}", reference);

        try {
            PaystackVerifyResponse response = paystackWebClient
                    .get()
                    .uri("/transaction/verify/{reference}", reference)
                    .retrieve()
                    .bodyToMono(PaystackVerifyResponse.class)
                    .block();

            if (response == null) {
                throw new RuntimeException("Paystack returned null for verify — " + "reference: " + reference);
            }

            if (!response.isStatus()) {
                throw new RuntimeException(
                        "Paystack verify call failed — " + "reference: " + reference +
                                " message: " + response.getMessage());
            }

            String txStatus = response.getData() != null ? response.getData().getStatus() : "unknown";

            log.info("Paystack verify result — " + "reference: {} status: {} channel: {}", reference,
                    txStatus, response.getData() != null ? response.getData().getChannel() : "unknown");

            return response;

        } catch (WebClientResponseException e) {
            log.error("Paystack API error during verify — " + "status: {} body: {} reference: {}",
                    e.getStatusCode(), e.getResponseBodyAsString(), reference);
            throw new RuntimeException("Paystack verify error: " + e.getResponseBodyAsString(), e);
        }
    }

    // VERIFY WEBHOOK SIGNATURE
    // Paystack signs every webhook with your webhook secret
    // using HMAC-SHA512. You compute the same hash and
    // compare. If they match — genuine Paystack webhook.
    // If they don't — reject immediately, log at ERROR.
    // This method must receive the RAW request body string
    // before any JSON parsing. Parsing changes whitespace
    // and field order which invalidates the signature.
    public boolean verifyWebhookSignature(String paystackSignature, String rawRequestBody) {
        if (paystackSignature == null || paystackSignature.isBlank()) {
            log.error("Webhook received with no " + "x-paystack-signature header — rejected");
            return false;
        }

        try {
            // HMAC-SHA512 of raw body using webhook secret as key
            Mac mac = Mac.getInstance("HmacSHA512");
            SecretKeySpec keySpec = new SecretKeySpec(
                    paystackConfig.getWebhookSecret().getBytes(StandardCharsets.UTF_8),
                    "HmacSHA512"
            );
            mac.init(keySpec);

            byte[] hashBytes = mac.doFinal(
                    rawRequestBody.getBytes(StandardCharsets.UTF_8));

            // Convert bytes to lowercase hex string
            String computedHash = HexFormat.of().formatHex(hashBytes);

            boolean valid = computedHash.equals(paystackSignature);

            if (valid) {
                log.debug("Webhook signature verified — genuine " + "Paystack webhook");
            } else {
                log.error("Webhook signature INVALID — " + "computed: {} received: {}",
                        computedHash.substring(0, 16) + "...", paystackSignature.substring(0, 16) + "...");
            }

            return valid;

        } catch (Exception e) {
            log.error("Error computing webhook signature: {}", e.getMessage(), e);
            return false;
        }
    }

    // GENERATE REFERENCE
    // Creates a unique traceable reference for each payment
    // Format: SMARTRENT-{bookingId first 8 chars uppercase}
    //         -{4 char random suffix}
    //
    // The bookingId prefix makes it instantly traceable —
    // you can find the booking from the reference alone
    // The random suffix prevents collisions if the same
    // booking somehow triggers two payment attempts
    public String generateReference(UUID bookingId) {
        String bookingPrefix = bookingId.toString()
                .replace("-", "")
                .substring(0, 8)
                .toUpperCase();

        String randomSuffix = UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 4)
                .toUpperCase();

        return "SMARTRENT-" + bookingPrefix + "-" + randomSuffix;
    }

    // Private helpers

    // Convert GHS BigDecimal to pesewas Long
    // GHS 25.50 → 2550 pesewas
    // Scale to 0 decimal places before converting to long
    // to prevent floating point precision loss
    private long convertToPesewas(BigDecimal amountInGHS) {
        return amountInGHS
                .multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValue();
    }
}
