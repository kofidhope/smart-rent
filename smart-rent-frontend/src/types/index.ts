// AUTH TYPES
// These match exactly what your auth-service returns

export type Role = 'TENANT' | 'LANDLORD' | 'ADMIN'

export interface User {
    id: string           // UUID — your user IDs are UUIDs
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    role: Role
    enabled: boolean
    createdAt: string    // ISO date string from backend
}

export interface AuthResponse {
    userId: string
    accessToken: string
    refreshToken: string
    role: Role
}

export interface LoginRequest {
    email: string
    password: string
}

export interface RegisterRequest {
    firstName: string
    lastName: string
    email: string
    password: string
    phoneNumber: string
}

// ─────────────────────────────────────────────────────
// PROPERTY TYPES
// These match your PropertyResponse from property-service
// ─────────────────────────────────────────────────────

export type PropertyType =
    | 'APARTMENT'
    | 'HOUSE'
    | 'STUDIO'
    | 'VILLA'
    | 'OFFICE'

export type PropertyStatus =
    | 'AVAILABLE'
    | 'RENTED'
    | 'MAINTENANCE'

export interface PropertyImage {
    id: string
    propertyId: string
    imageUrl: string
    isPrimary: boolean
    displayOrder: number
    createdAt: string
}

export interface Property {
    id: string
    ownerId: string
    ownerName: string
    title: string
    description: string
    address: string
    city: string
    price: number        // monthly rent in GHS
    type: PropertyType
    status: PropertyStatus
    bedrooms: number
    bathrooms: number
    primaryImageUrl: string | null
    images: PropertyImage[]
    createdAt: string
}

export interface CreatePropertyRequest {
    title: string
    description: string
    address: string
    city: string
    price: number
    type: PropertyType
    bedrooms: number
    bathrooms: number
}

export interface PropertySearchRequest {
    city?: string
    type?: PropertyType
    minPrice?: number
    maxPrice?: number
    minBedrooms?: number
}

// ─────────────────────────────────────────────────────
// BOOKING TYPES
// These match your BookingResponse from booking-service
// ─────────────────────────────────────────────────────

export type BookingStatus =
    | 'PENDING'
    | 'PAYMENT_INITIATED'
    | 'CONFIRMED'
    | 'CANCELLED'
    | 'COMPLETED'

export type PaymentStatus =
    | 'PENDING'
    | 'PROCESSING'
    | 'PAID'
    | 'FAILED'
    | 'REFUNDED'

export interface Booking {
    id: string
    tenantId: string
    propertyId: string
    ownerId: string
    startDate: string      // ISO date string
    endDate: string        // ISO date string
    totalPrice: number
    bookingStatus: BookingStatus
    paymentStatus: PaymentStatus
    createdAt: string
    updatedAt: string
}

export interface CreateBookingRequest {
    propertyId: string
    startDate: string    // format: YYYY-MM-DD
    endDate: string      // format: YYYY-MM-DD
}

// ─────────────────────────────────────────────────────
// PAYMENT TYPES
// These match your Payment entity from payment-service
// ─────────────────────────────────────────────────────

export type PaymentStatusType =
    | 'PENDING'
    | 'PROCESSING'
    | 'SUCCESS'
    | 'FAILED'
    | 'REFUNDED'

export interface Payment {
    id: string
    bookingId: string
    tenantId: string
    ownerId: string
    amount: number
    currency: string
    status: PaymentStatusType
    paystackReference: string
    authorizationUrl: string | null
    channel: string | null
    paidAt: string | null
    createdAt: string
}

// ─────────────────────────────────────────────────────
// PAGINATION TYPES
// Matches your PageResponse<T> from property-service
// ─────────────────────────────────────────────────────

export interface PageResponse<T> {
    content: T[]
    pageNumber: number
    pageSize: number
    totalElements: number
    totalPages: number
    first: boolean
    last: boolean
}

// ─────────────────────────────────────────────────────
// ERROR TYPES
// Matches your ApiError shape from GlobalExceptionHandler
// ─────────────────────────────────────────────────────

export interface ApiError {
    status: number
    error: string
    message: string
    timestamp: string
    path: string
}

// ─────────────────────────────────────────────────────
// VERIFICATION TYPES
// Matches your VerificationService from user-service
// ─────────────────────────────────────────────────────

export type VerificationStatus =
    | 'NONE'
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'

export interface VerificationStatusResponse {
    status: VerificationStatus
    role: Role
    documentsUploaded: number
    rejectionReason: string
}