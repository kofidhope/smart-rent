package com.kofi.notification.model;

public enum NotificationType {

    // Sent when booking-service publishes BookingConfirmedEvent
    // and saga transitions booking to PAYMENT_INITIATED
    // SMS: "Your booking for {property} is being processed.
    //       Complete payment at: {url}"
    BOOKING_INITIATED,

    // Sent when payment-service publishes PaymentSucceededEvent
    // and booking saga transitions to CONFIRMED
    // SMS: "Booking confirmed! {property} from {start} to {end}.
    //       Amount paid: GHS {amount}"
    BOOKING_CONFIRMED,

    // Sent when payment-service publishes PaymentFailedEvent
    // and booking saga transitions to CANCELLED
    // SMS: "Your booking for {property} could not be completed.
    //       Reason: {reason}. Please try again."
    BOOKING_CANCELLED,

    // Sent when payment succeeds — separate from BOOKING_CONFIRMED
    // because the landlord also needs a notification
    // SMS to owner: "New booking confirmed for {property}.
    //               Tenant: {name}. Amount: GHS {amount}"
    PAYMENT_RECEIVED,

    // Sent when a refund is processed
    // SMS: "Your refund of GHS {amount} has been processed.
    //       Allow 3-5 business days."
    PAYMENT_REFUNDED,

    // Future use — reminder before check-in
    BOOKING_REMINDER,

    // Future use — account related
    ACCOUNT_VERIFICATION,
    PASSWORD_RESET
}
