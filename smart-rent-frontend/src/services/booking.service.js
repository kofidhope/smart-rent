import api, { getErrorMessage } from './api'

// ─────────────────────────────────────────────────────
// BOOKING SERVICE
// ─────────────────────────────────────────────────────

const BookingService = {

    // ───────────────────────────────────────────────────
    // CREATE BOOKING
    // POST /api/bookings
    // TENANT only
    // ───────────────────────────────────────────────────
    create: async (data) => {
        try {
            const response = await api.post(
                '/api/bookings',
                data
            )
            return response.data

        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },

    // ───────────────────────────────────────────────────
    // GET MY BOOKINGS
    // GET /api/bookings/my
    // TENANT only — returns their own bookings
    // ───────────────────────────────────────────────────
    getMyBookings: async () => {
        try {
            const response = await api.get(
                '/api/bookings/my'
            )
            return response.data

        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },

    // ───────────────────────────────────────────────────
    // GET BY ID
    // GET /api/bookings/{id}
    // TENANT or LANDLORD
    // ───────────────────────────────────────────────────
    getById: async (id) => {
        try {
            const response = await api.get(
                `/api/bookings/${id}`
            )
            return response.data

        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },

    // ───────────────────────────────────────────────────
    // GET BY PROPERTY
    // GET /api/bookings/property/{propertyId}
    // LANDLORD only — see all bookings for their property
    // ───────────────────────────────────────────────────
    getByProperty: async (propertyId) => {
        try {
            const response = await api.get(
                `/api/bookings/property/${propertyId}`
            )
            return response.data

        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },

    // ───────────────────────────────────────────────────
    // CANCEL
    // DELETE /api/bookings/{id}/cancel
    // TENANT only — can only cancel their own bookings
    // ───────────────────────────────────────────────────
    cancel: async (id) => {
        try {
            const response = await api.delete(
                `/api/bookings/${id}/cancel`
            )
            return response.data

        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },
}

export default BookingService