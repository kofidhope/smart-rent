package com.kofi.paymentservice.model;

public enum PaymentStatus {
    PENDING,        // payment record created, not yet sent to Paystack
    PROCESSING,     // sent to Paystack, waiting for webhook
    SUCCESS,        // webhook confirmed payment
    FAILED,         // webhook reported failure
    REFUNDED,       // refund processed
    ABANDONED       // tenant opened payment page but never paid
}