# API Documentation

## API Architecture

Smart-Rent follows a microservices architecture where each service exposes its own REST API. The API gateway acts as a single entrypoint that routes requests to appropriate services based on path patterns.

### Gateway Routing
- All client requests go through `api-gateway` at `/api/*`
- Gateway routes are configured in config-server's Git repository (not local application.yml)
- Gateway preserves the `/api` prefix when forwarding to services
- Example: `POST /api/users/login` → routed to `user-service` at `/api/users/login`

### Authentication Model
- **Primary**: JWT in httpOnly cookies (access_token)
- **Gateway Validation**: Validates JWT HMAC signature locally (no auth-service round-trip)
- **Trust Headers**: On successful validation, gateway injects:
  - `X-User-Id`: UUID of authenticated user
  - `X-User-Role`: Role enum (TENANT/LANDLORD/ADMIN)
  - `X-User-Email`: User's email address
  - `X-Internal-Secret`: Shared secret for service-to-service trust
- **Service Validation**: Each service validates `X-Internal-Secret` against its configured `gateway.internal-secret`
- **Exception**: Paystack webhook endpoint (`/api/payments/webhook`) bypasses internal-secret check

### Error Handling
Standard error response format across services:
```json
{
  "status": 4xx or 5xx,
  "error": "Error type",
  "message": "Human-readable message",
  "timestamp": "ISO 8601 timestamp",
  "path": "Requested path"
}
```
Frontend's `services/api.js` provides `getErrorMessage(error)` to map this format.

## Major Endpoint Groups

### Authentication Endpoints
*Handled by auth-service and user-service*

| Method | Path | Service | Description |
|--------|------|---------|-------------|
| POST | `/api/users/register` | user-service | Public registration (assigns TENANT role) |
| POST | `/api/users/login` | user-service | Public login - validates credentials, sets httpOnly cookies |
| POST | `/api/auth/refresh` | auth-service | Cookie-driven token rotation |
| POST | `/api/auth/logout` | auth-service | Revoke refresh token, clear cookies |
| GET | `/api/auth/validate` | auth-service | Bearer token validation (internal use) |

### User Management Endpoints
*Handled by user-service*

| Method | Path | Service | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/users/profile` | user-service | Self | Get current user's profile |
| PUT | `/api/users/profile` | user-service | Self | Update current user's profile |
| PUT | `/api/users/profile/password` | user-service | Self | Change password |
| GET | `/api/users/{id}` | user-service | Internal (Feign) | Get user by ID |
| GET | `/api/users/email/{email}` | user-service | Internal (Feign) | Get user by email |
| GET | `/api/users` | user-service | Admin only | List all users |
| DELETE | `/api/users/{id}` | user-service | Admin only | Delete user |

### Property Management Endpoints
*Handled by property-service*

| Method | Path | Service | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/properties/search` | property-service | Public | Search properties with filters |
| GET | `/api/properties/{id}` | property-service | Public | Get property by ID |
| GET | `/api/properties/my` | property-service | Landlord | Get landlord's properties |
| POST | `/api/properties` | property-service | Landlord | Create new property |
| PUT | `/api/properties/{id}` | property-service | Landlord | Update property |
| DELETE | `/api/properties/{id}` | property-service | Landlord | Delete property |
| POST | `/api/properties/{id}/images` | property-service | Landlord | Upload property images |
| GET | `/api/properties/{propertyId}/units` | property-service | Mixed | Get units for property (internal/external) |
| POST | `/api/properties/{propertyId}/units` | property-service | Landlord | Create unit for property |
| PUT | `/api/properties/{id}/status/rent` | property-service | Internal | Mark property/unit as rented |
| PUT | `/api/properties/{id}/status/available` | property-service | Internal | Mark property/unit as available |

### Booking Management Endpoints
*Handled by booking-service*

| Method | Path | Service | Auth | Description |
|--------|------|---------|------|-------------|
| POST | `/api/bookings` | booking-service | TENANT | Create new booking (initiates payment saga) |
| GET | `/api/bookings/my` | booking-service | TENANT | Get current user's bookings |
| GET | `/api/bookings/{id}` | booking-service | TENANT/Landlord | Get booking by ID (access based on involvement) |
| GET | `/api/bookings/property/{propertyId}` | booking-service | Landlord | Get bookings for a property |
| DELETE | `/api/bookings/{id}/cancel` | booking-service | TENANT | Cancel booking (with restrictions) |
| PATCH | `/api/bookings/{id}/complete` | booking-service | Internal Scheduler | Auto-complete booking past endDate |

### Payment Endpoints
*Handled by payment-service*

| Method | Path | Service | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/payments/booking/{bookingId}` | payment-service | TENANT/Landlord | Get payment for booking |
| GET | `/api/payments/my` | payment-service | TENANT | Get current user's payments |
| GET | `/api/payments/owner/revenue` | payment-service | Landlord | Get landlord's revenue (detailed) |
| GET | `/api/payments/owner/revenue/total` | payment-service | Landlord | Get landlord's total revenue |
| POST | `/api/payments/webhook` | payment-service | Paystack HMAC | Paystack webhook endpoint (public) |

### Notification Endpoints
*Handled by notification-service*
- **Note**: Pure Kafka consumer - no external REST API for sending notifications
- All notifications triggered by consuming Kafka events from other services

### Admin Endpoints
*Handled by user-service*

| Method | Path | Service | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/verification/pending` | user-service | Admin | Get pending verification requests |
| PATCH | `/api/verification/{userId}/decision` | user-service | Admin | Approve/reject verification request |

## Important Request/Response Concepts

### Idempotency Keys
Several endpoints implement idempotency to prevent duplicate operations:
- Booking creation checks for existing pending/confirmed bookings for same unit/date range
- Payment processing uses Paystack reference checks
- Notification service prevents duplicate SMS via `existsByBookingIdAndType` check

### Pagination
Search endpoints typically support pagination:
- `/api/properties/search` accepts `page` and `size` parameters
- Responses include pagination metadata (total elements, total pages, etc.)

### Filtering
Property search supports multiple filter parameters:
- `city`, `propertyType`, `minPrice`, `maxPrice`, `minBedrooms`, `minBathrooms`
- Parameters are optional and can be combined

### Expandable References
Some endpoints return expanded references when internally called:
- Feign calls between services often return expanded objects
- External API calls may return simplified references (fallbacks like "Unknown User")

### Date Handling
- All dates stored and transmitted in UTC
- Frontend handles timezone conversion for display
- Booking start/end dates are inclusive dates (not timestamps)

## Service Boundaries and Communication Patterns

### Synchronous Communication (Feign + Resilience4j)
Direct service-to-service calls for immediate data needs:
- `user-service` → `auth-service`: Token generation/validation
- `property-service` → `user-service`: Get user details for ownership
- `booking-service` → `property-service`: Validate unit availability, get pricing, mark units as rented/available
- `booking-service` → `user-service`: Get tenant/landlord details
- `notification-service` → `user-service`: Get user contact info for notifications

Each Feign client has a fallback implementation:
- Returns safe defaults ("Unknown User", empty lists) rather than failing calls
- Configured with Resilience4j circuit breakers and timeouts

### Asynchronous Communication (Kafka)
Event-driven communication for loose coupling:
**From booking-service**:
- `booking.confirmed`: Booking moved to PAYMENT_INITIATED state
- `booking.cancelled`: Booking cancelled (user or system)
- `booking-completed-topic`: Booking reached endDate and was auto-completed

**From payment-service**:
- `payment.succeeded`: Payment successfully processed
- `payment.failed`: Payment failed (insufficient funds, card declined, etc.)

**Consumers**:
- `payment-service`: Consumes booking events to initiate payment processing
- `notification-service`: Consumes booking and payment events to send notifications
- `booking-service`: Consumes payment events to complete saga (confirm/cancel booking)

### Event Schema Convention
- No message headers or content-type indicators in Kafka messages
- Services determine event type by topic name only
- Field names must remain consistent across services for same event
- Events typically contain IDs (bookingId, paymentId) rather than full objects
- Services fetch additional details via Feign calls when needed

## Security Considerations

### Authentication
- All endpoints except public ones require valid JWT cookie
- Role-based access control enforced at service level
- Internal endpoints (like `/{id}` on user-service) restricted to Feign calls only
- Admin endpoints require ADMIN role

### Data Protection
- Sensitive data masked in logs (Twilio SIDs, Paystack keys, phone numbers)
- Passwords stored hashed (bcrypt)
- JWT secrets managed via environment variables
- HTTPS enforced in production (terminated at load balancer/gateway)

### Rate Limiting
- Gateway implements Redis-backed rate limiting (60s window)
- Keyed by user ID or IP address: `rate_limit:{user|ip}:{id}`
- Fail-open behavior (if Redis unavailable, requests allowed)
- Configurable limits per service/endpoint

### Input Validation
- All services validate request parameters and bodies
- Constraint annotations (@Valid, @NotNull, etc.) used on DTOs
- Path variables validated (UUID format, numeric ranges)
- String length limits enforced