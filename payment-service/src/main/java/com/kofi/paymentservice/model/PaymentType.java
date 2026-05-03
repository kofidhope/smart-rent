package com.kofi.paymentservice.model;

public enum PaymentType {
    INITIALIZE,     // first-time payment — generates authorization_url
    CHARGE          // recurring — uses stored authorization_code
}
