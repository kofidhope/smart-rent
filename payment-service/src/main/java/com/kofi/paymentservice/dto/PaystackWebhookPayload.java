package com.kofi.paymentservice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

// Shape of every POST Paystack sends to your webhook URL
// Paystack sends this for: charge.success, charge.failed,
// transfer.success, transfer.failed, refund.processed etc.
// You only handle charge.success and charge.failed for now
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PaystackWebhookPayload {

    // Event type — drives your switch statement in PaymentService
    // "charge.success"  → payment completed
    // "charge.failed"   → payment failed
    // "transfer.success"→ payout to owner completed
    // "refund.processed"→ refund completed
    private String event;

    private EventData data;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class EventData {

        // Paystack's internal transaction ID
        private Long id;

        // Your reference — use this to find your payment record
        private String reference;

        // "success", "failed", "abandoned"
        private String status;

        // Amount in pesewas
        private Long amount;

        private String currency;

        // How the tenant paid
        // "card", "mobile_money", "bank", "ussd"
        private String channel;

        @JsonProperty("paid_at")
        private String paidAt;

        @JsonProperty("created_at")
        private String createdAt;

        // Gateway response — human readable
        // e.g. "Approved", "Insufficient Funds", "Do Not Honour"
        @JsonProperty("gateway_response")
        private String gatewayResponse;

        // Authorization details — contains authorization_code
        // Store this after first successful payment
        private Authorization authorization;

        // Tenant who paid
        private Customer customer;

        // Your metadata sent during initialize — echoed back here
        // Contains bookingId so you don't need to parse the reference
        private Metadata metadata;

        // Log of attempts Paystack made to charge
        // Useful for debugging failed payments
        private java.util.List<Log> log;

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
            private String reusable;

            @JsonProperty("country_code")
            private String countryCode;
        }

        @Data
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class Customer {
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

            @JsonProperty("booking_id")
            private String bookingId;

            @JsonProperty("tenant_id")
            private Long tenantId;

            @JsonProperty("property_title")
            private String propertyTitle;
        }

        @Data
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class Log {
            private String type;
            private String message;
            private Long time;
        }
    }
}
