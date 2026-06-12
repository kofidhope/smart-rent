package com.kofi.paymentservice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PaystackVerifyResponse {

    private boolean status;
    private String message;
    private TransactionData data;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TransactionData {

        // Paystack internal transaction ID — numeric
        private Long id;

        // "success", "failed", "abandoned", "pending"
        private String status;

        private String reference;

        // Amount in pesewas — divide by 100 for GHS
        private Long amount;

        private String currency;

        @JsonProperty("paid_at")
        private String paidAt;

        @JsonProperty("created_at")
        private String createdAt;

        private String channel;

        @JsonProperty("gateway_response")
        private String gatewayResponse;

        private Authorization authorization;
        private Customer customer;
        private Metadata metadata;

        @Data
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class Authorization {

            @JsonProperty("authorization_code")
            private String authorizationCode;

            @JsonProperty("card_type")
            private String cardType;

            private String last4;

            @JsonProperty("exp_month")
            private String expMonth;

            @JsonProperty("exp_year")
            private String expYear;

            private String bank;
            private String channel;

            // "1" = reusable, "0" = one time only
            private String reusable;

            @JsonProperty("country_code")
            private String countryCode;
        }

        @Data
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class Customer {

            // Paystack numeric ID — NOT a UUID
            private Long id;

            private String email;

            @JsonProperty("first_name")
            private String firstName;

            @JsonProperty("last_name")
            private String lastName;

            private String phone;

            @JsonProperty("customer_code")
            private String customerCode;
        }

        @Data
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class Metadata {

            // bookingId is your UUID stored as String
            // Paystack echoes it back exactly as you sent it
            @JsonProperty("booking_id")
            private String bookingId;

            // tenant_id stored as String to avoid
            // UUID vs Long conflicts
            @JsonProperty("tenant_id")
            private String tenantId;

            @JsonProperty("property_title")
            private String propertyTitle;
        }
    }
}