package com.kofi.paymentservice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

// Response from POST /transaction/initialize
// The data.authorizationUrl is what the tenant visits to pay
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PaystackInitializeResponse {

    // true = Paystack accepted the request
    // false = something wrong — check message for reason
    private boolean status;

    // Human-readable result e.g. "Authorization URL created"
    private String message;

    private ResponseData data;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ResponseData {

        // URL you redirect the tenant to complete payment
        // Valid for a limited time — use it immediately
        @JsonProperty("authorization_url")
        private String authorizationUrl;

        // Shorter code used with Paystack Inline or mobile SDKs
        // You store this in payment.paystack_access_code
        @JsonProperty("access_code")
        private String accessCode;

        // The reference you sent — echoed back for confirmation
        // Verify this matches what you sent before proceeding
        private String reference;
    }
}
