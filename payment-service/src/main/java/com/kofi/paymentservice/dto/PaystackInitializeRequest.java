package com.kofi.paymentservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Sent to POST https://api.paystack.co/transaction/initialize
// Paystack responds with authorization_url tenant visits to pay
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaystackInitializeRequest {

    // Tenant email — required by Paystack for every transaction
    private String email;

    // Amount in PESEWAS (smallest GHS unit)
    // GHS 25.00 → 2500 pesewas
    // PaystackService multiplies your BigDecimal by 100 before setting this
    private Long amount;

    // Your unique reference for this transaction
    // Format: SMARTRENT-{bookingId first 12 chars}
    // Paystack returns this in every webhook so you can match
    // the webhook back to your payment record
    private String reference;

    // Currency code — GHS for Ghana Cedis
    private String currency;

    // URL Paystack redirects the tenant to after payment
    // For mobile apps or SPAs this is your frontend URL
    // For backend-only flow you can omit this
    @JsonProperty("callback_url")
    private String callbackUrl;

    // Extra data attached to the transaction
    // Visible on Paystack dashboard and echoed back in webhooks
    // Use it to carry your internal IDs without a database lookup
    @JsonProperty("metadata")
    private PaystackMetadata metadata;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaystackMetadata {

        @JsonProperty("booking_id")
        private String bookingId;

        @JsonProperty("tenant_id")
        private Long tenantId;

        @JsonProperty("property_title")
        private String propertyTitle;

        // Custom fields array Paystack displays on receipts
        @JsonProperty("custom_fields")
        private java.util.List<CustomField> customFields;

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class CustomField {
            @JsonProperty("display_name")
            private String displayName;

            @JsonProperty("variable_name")
            private String variableName;

            private String value;
        }
    }
}
