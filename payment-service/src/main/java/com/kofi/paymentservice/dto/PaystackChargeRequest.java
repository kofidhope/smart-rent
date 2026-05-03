package com.kofi.paymentservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Sent to POST https://api.paystack.co/transaction/charge_authorization
// Used for returning tenants — charges their saved card directly
// No browser redirect needed — fully backend initiated
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaystackChargeRequest {

    // The authorization code from the tenant's first payment
    // Stored in payment.authorization_code after first charge
    // Format: AUTH_xxxxxxxxxx
    @JsonProperty("authorization_code")
    private String authorizationCode;

    // Must match the email used during first payment
    // Paystack validates this as a security check
    private String email;

    // Amount in pesewas — same rule as initialize
    private Long amount;

    // Your unique reference for this charge
    // Different from the original reference — new charge, new reference
    private String reference;

    // Currency — GHS
    private String currency;
}
