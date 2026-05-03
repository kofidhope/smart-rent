package com.kofi.paymentservice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;

// Response from GET /transaction/verify/{reference}
// Called after receiving a webhook to independently confirm
// the transaction status directly from Paystack
// Never trust a webhook alone — always verify
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PaystackVerifyResponse {

    private boolean status;
    private String message;
    private TransactionData data;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TransactionData {

        // "success", "failed", "abandoned", "pending"
        // This is the ground truth — what Paystack actually recorded
        private String status;

        // Your reference echoed back
        private String reference;

        // Amount in pesewas — divide by 100 to get GHS
        // Compare against your payment record to detect tampering
        private Long amount;

        private String currency;

        // ISO 8601 timestamp of when payment completed
        @JsonProperty("paid_at")
        private String paidAt;

        // How the tenant paid
        // "card", "mobile_money", "bank", "ussd", "qr"
        private String channel;

        // Gateway response code from the card network
        @JsonProperty("gateway_response")
        private String gatewayResponse;

        // Card or mobile money authorization details
        // Contains authorization_code for future charges
        private Authorization authorization;

        // Tenant details as Paystack knows them
        private Customer customer;

        // Your metadata echoed back
        // Contains bookingId and tenantId you sent originally
        private Metadata metadata;

        @Data
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class Authorization {

            // Store this — used for future charges on this tenant
            // Format: AUTH_xxxxxxxxxx
            @JsonProperty("authorization_code")
            private String authorizationCode;

            // "visa", "mastercard", "verve", "mobile_money"
            @JsonProperty("card_type")
            private String cardType;

            // Last 4 digits of card — safe to store and display
            private String last4;

            // Card expiry month e.g. "12"
            @JsonProperty("exp_month")
            private String expMonth;

            // Card expiry year e.g. "2026"
            @JsonProperty("exp_year")
            private String expYear;

            // Issuing bank name
            private String bank;

            // "card", "mobile_money" etc
            private String channel;

            // Whether this card can be charged again
            // "1" = reusable, "0" = one-time only
            private String reusable;

            // Country code of issuing bank e.g. "GH"
            @JsonProperty("country_code")
            private String countryCode;
        }

        @Data
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class Customer {
            private Long id;

            @JsonProperty("first_name")
            private String firstName;

            @JsonProperty("last_name")
            private String lastName;

            private String email;

            // Paystack's customer code — format: CUS_xxxxxxxxxx
            @JsonProperty("customer_code")
            private String customerCode;

            private String phone;
        }

        @Data
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class Metadata {

            @JsonProperty("booking_id")
            private String bookingId;

            @JsonProperty("tenant_id")
            private Long tenantId;

            @JsonProperty("property_title")
            private String propertyTitle;
        }
    }
}
