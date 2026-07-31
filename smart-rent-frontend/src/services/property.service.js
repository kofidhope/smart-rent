import api, { getErrorMessage } from './api'

// ─────────────────────────────────────────────────────
// PROPERTY SERVICE
//
// All property-related API calls.
// Public endpoints (search, getById) work without login.
// Protected endpoints (create, update, delete) require
// LANDLORD role — backend enforces this via @PreAuthorize
// ─────────────────────────────────────────────────────

const PropertyService = {

    // ───────────────────────────────────────────────────
    // SEARCH
    // GET /api/properties/search
    // ───────────────────────────────────────────────────
    search: async (params = {}) => {
        try {
            const response = await api.get(
                '/api/properties/search',
                { params }
            )
            return response.data

        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },

    // ───────────────────────────────────────────────────
    // GET BY ID
    // GET /api/properties/{id}
    // Public — no login needed
    // ───────────────────────────────────────────────────
    getById: async (id) => {
        try {
            const response = await api.get(
                `/api/properties/${id}`
            )
            return response.data

        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },

    // ───────────────────────────────────────────────────
    // GET MY PROPERTIES
    // GET /api/properties/my
    // LANDLORD only
    // ───────────────────────────────────────────────────
    getMyProperties: async () => {
        try {
            const response = await api.get(
                '/api/properties/my'
            )
            return response.data

        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },

    // ───────────────────────────────────────────────────
    // CREATE
    // POST /api/properties
    // LANDLORD only
    // ───────────────────────────────────────────────────
    create: async (data) => {
        try {
            const response = await api.post(
                '/api/properties',
                data
            )
            return response.data

        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },

    // ───────────────────────────────────────────────────
    // UPDATE
    // PUT /api/properties/{id}
    // LANDLORD only — must own the property
    // ───────────────────────────────────────────────────
    update: async (id, data) => {
        try {
            const response = await api.put(
                `/api/properties/${id}`,
                data
            )
            return response.data

        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },

    // ───────────────────────────────────────────────────
    // DELETE
    // DELETE /api/properties/{id}
    // LANDLORD only — must own the property
    // ───────────────────────────────────────────────────
    delete: async (id) => {
        try {
            await api.delete(`/api/properties/${id}`)
        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },

    // ───────────────────────────────────────────────────
    // UPLOAD IMAGE
    // POST /api/properties/{id}/images
    // LANDLORD only — multipart/form-data
    //
    // file: File object from input[type=file]
    // ───────────────────────────────────────────────────
    uploadImage: async (propertyId, file) => {
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await api.post(
                `/api/properties/${propertyId}/images`,
                formData,
                {
                    headers: {
                        // Let the browser set multipart boundary
                        'Content-Type': undefined,
                    },
                }
            )
            return response.data

        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },

    // ───────────────────────────────────────────────────
    // GET IMAGES
    // GET /api/properties/{id}/images
    // Public
    // ───────────────────────────────────────────────────
    getImages: async (propertyId) => {
        try {
            const response = await api.get(
                `/api/properties/${propertyId}/images`
            )
            return response.data

        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },

    // ───────────────────────────────────────────────────
    // SET PRIMARY IMAGE
    // PATCH /api/properties/{id}/images/{imageId}/primary
    // LANDLORD only
    // ───────────────────────────────────────────────────
    setPrimaryImage: async (propertyId, imageId) => {
        try {
            const response = await api.patch(
                `/api/properties/${propertyId}/images/${imageId}/primary`
            )
            return response.data

        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },

    // ───────────────────────────────────────────────────
    // DELETE IMAGE
    // DELETE /api/properties/{id}/images/{imageId}
    // LANDLORD only
    // ───────────────────────────────────────────────────
    deleteImage: async (propertyId, imageId) => {
        try {
            await api.delete(
                `/api/properties/${propertyId}/images/${imageId}`
            )
        } catch (error) {
            throw new Error(getErrorMessage(error))
        }
    },
}

export default PropertyService