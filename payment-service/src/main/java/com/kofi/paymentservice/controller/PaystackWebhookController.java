package com.kofi.paymentservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kofi.paymentservice.dto.PaystackWebhookPayload;
import com.kofi.paymentservice.service.PaymentService;
import com.kofi.paymentservice.service.PaystackService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaystackWebhookController {

    private final PaymentService paymentService;
    private final PaystackService paystackService;
    private final ObjectMapper objectMapper;

    // Paystack calls this URL after every transaction event
    // Must be publicly accessible — no JWT auth
    // Must respond 200 within 30 seconds or Paystack retries
    // Must verify signature before processing anything
    // Set this URL in Paystack dashboard:
    // Settings → Webhooks → https://your-domain/api/payments/webhook
    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(
            @RequestHeader(value = "x-paystack-signature", required = false) String signature,
            @RequestBody String rawBody) {
        // Step 1: Validate signature header exists
        if (signature == null || signature.isBlank()) {
            return ResponseEntity.ok().build();
        }
        // Step 2: Verify signature
        boolean signatureValid = paystackService.verifyWebhookSignature(signature, rawBody);
        if (!signatureValid) {
            return ResponseEntity.ok().build();
        }

        // Step 3: Parse JSON payload
        // Only parse AFTER signature verification
        // Never parse untrusted input before verifying origin
        PaystackWebhookPayload payload;
        try {
            payload = objectMapper.readValue(rawBody, PaystackWebhookPayload.class);
        } catch (Exception e) {
            log.error("Webhook rejected — " + "failed to parse JSON body: {} " + "raw: {}", e.getMessage(),
                    rawBody.length() > 200 ? rawBody.substring(0, 200) + "..." : rawBody);
            // Return 200 — bad JSON won't fix itself on retry
            return ResponseEntity.ok().build();
        }

        //Step 4: Validate payload structure
        if (payload.getEvent() == null || payload.getData() == null || payload.getData().getReference() == null) {
            log.error("Webhook rejected — " + "missing required fields. " + "event: {} data: {} reference: {}",
                    payload.getEvent(),
                    payload.getData() != null
                            ? "present" : "null",
                    payload.getData() != null
                            ? payload.getData().getReference()
                            : "null");
            return ResponseEntity.ok().build();
        }

        log.info("Webhook verified — event: {} reference: {}",
                payload.getEvent(),
                payload.getData().getReference());

        //Step 5: Process the webhook
        try {
            paymentService.handleWebhook(payload);

        } catch (Exception e) {
            log.error("Webhook processing failed — " +
                            "event: {} reference: {} error: {}",
                    payload.getEvent(),
                    payload.getData().getReference(),
                    e.getMessage(),
                    e);
        }
        return ResponseEntity.ok().build();
    }
}
