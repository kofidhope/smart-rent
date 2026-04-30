package com.kofi.booking_service.model;

public enum BookingStatus {
    PENDING,            // booking created, waiting for payment
    PAYMENT_INITIATED,  // payment request sent to payment-service
    CONFIRMED,          // payment succeeded
    CANCELLED,          // payment failed or user cancelled
    COMPLETED           // stay is over
}