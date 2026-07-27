import api, { getErrorMessage } from './api'

// ─────────────────────────────────────────────────────
// PAYMENT SERVICE
//
// Note: payment initiation is automatic — when a booking
// is created, Kafka notifies payment-service which calls
// Paystack and gets the authorizationUrl. The frontend
// only needs to fetch the payment to get that URL
// and redirect the user to Paystack checkout.
// ─────────────────────────────────────────────────────

const PaymentService = {

    // ───────────────────────────────────────────────────
    // GET BY BOOKING
    // GET /api/payments/booking/{bookingId}
    // TENANT or LANDLORD
    //
    // Call this after creating a booking to get
    // the authorizationUrl for Paystack checkout.
    // May need to poll briefly — payment-service
    // needs a second to process the Kafka event
    // and call Paystack before the record exists.
    // ───────────────────────────────────────────────────
    getByBooking: async (bookingId) => {
        try {
            const response = await api.get(
                `/api/payments/booking/${bookingId}`
            )
            return response.data

        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },

    // ───────────────────────────────────────────────────
    // GET MY PAYMENTS
    // GET /api/payments/my
    // TENANT only
    // ───────────────────────────────────────────────────
    getMyPayments: async () => {
        try {
            const response = await api.get(
                '/api/payments/my'
            )
            return response.data

        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },

    // ───────────────────────────────────────────────────
    // GET OWNER REVENUE LIST
    // GET /api/payments/owner/revenue
    // LANDLORD only
    // ───────────────────────────────────────────────────
    getOwnerRevenue: async () => {
        try {
            const response = await api.get(
                '/api/payments/owner/revenue'
            )
            return response.data

        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },

    // ───────────────────────────────────────────────────
    // GET OWNER TOTAL REVENUE
    // GET /api/payments/owner/revenue/total
    // LANDLORD only — single number in GHS
    // ───────────────────────────────────────────────────
    getOwnerTotalRevenue: async () => {
        try {
            const response = await api.get(
                '/api/payments/owner/revenue/total'
            )
            return response.data

        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },

    // ───────────────────────────────────────────────────
    // POLL FOR PAYMENT RECORD
    // Utility — not an API endpoint
    //
    // After booking is created payment-service needs
    // a moment to consume the Kafka event and call
    // Paystack. This helper polls until the payment
    // record exists or max attempts is reached.
    //
    // Usage:
    //   const payment = await PaymentService
    //     .waitForPayment(bookingId)
    //   window.location.href = payment.authorizationUrl
    // ───────────────────────────────────────────────────
    waitForPayment: async (bookingId, maxAttempts = 10, intervalMs = 1500) => {

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {

            try {
                const payment = await PaymentService
                    .getByBooking(bookingId)

                // Payment record exists and has a URL
                if (payment && payment.authorizationUrl) {
                    return payment
                }

            } catch {
                // 404 means payment not created yet
                // Keep polling
            }

            // Wait before next attempt
            if (attempt < maxAttempts) {
                await new Promise(resolve =>
                    setTimeout(resolve, intervalMs)
                )
            }
        }

        throw new Error('Payment could not be initialized. ' + 'Please try again or contact support.')
    },
}

export default PaymentService