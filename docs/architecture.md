# Smart-Rent Architecture

## System Overview

Smart-Rent is a multi-tenant rental marketplace platform for Ghana that connects tenants, landlords, and administrators through a Spring Boot microservices backend and a React 19 single-page application. The platform follows a domain-decomposed microservices pattern where each bounded context owns its database, exposes a REST API, and participates in cross-service workflows via Kafka events.

## Major Components

### Frontend Layer
- **smart-rent-frontend**: React 19 SPA built with Vite, Tailwind CSS, and react-router-dom
- Handles user interface for all three roles (tenant, landlord, admin)
- Communicates with backend exclusively through the API gateway
- Uses httpOnly cookies for authentication (tokens never accessible to JavaScript)

### API Gateway
- **api-gateway**: Spring Cloud Gateway (reactive/WebFlux)
- Single entrypoint for all client requests
- Responsibilities:
  - JWT validation (HMAC signature, no auth-service round-trip)
  - Rate limiting (Redis-backed, 60s window, fail-open)
  - CORS handling
  - Trust-header injection (X-User-Id, X-User-Role, X-User-Email, X-Internal-Secret)

### Configuration & Discovery
- **config-server**: Spring Cloud Config Server (Git-backed at github.com/kofidhope/smart-rent-config)
- **discovery-server**: Netflix Eureka registry for service discovery

### Backend Services
1. **auth-service**: JWT issuance + refresh rotation (stateless, Redis persistence)
2. **user-service**: Profiles, roles, login orchestration
3. **property-service**: Property + Unit management + Cloudinary image hosting
4. **booking-service**: Reservation saga orchestrator
5. **payment-service**: Paystack integration + webhook + reconciliation
6. **notification-service**: Twilio SMS/WhatsApp consumer (Kafka-only)

## Component Relationships

```
Frontend (React SPA)
        ↓ (HTTPS + httpOnly cookies)
API Gateway (Spring Cloud Gateway)
        ↓ (Eureka / Feign)
┌─────────────┐ ┌─────────┐ ┌─────────────┐ ┌──────────────┐
│ auth-service│ │ user-   │ │ property-   │ │ booking-     │
│ (JWT, refresh│ service │ │ service     │ │ service      │
│  rotation)  │ │(profiles,│ │(Property +  │ │ (Saga        │
│             │ │ roles)  │ │ Unit + img) │ │  orchestrator)│
└─────────────┘ └─────────┘ └──────┬──────┘ └──────┬───────┘
                                    │ Feign         │ Kafka
                                    ▼               ▼
                              ┌─────────────┐ ┌─────────────┐
                              │ payment-    │ │notification-│
                              │ service     │ │ service     │
                              │ (Paystack + │ │ (Twilio SMS/│
                              │  Webhook)   │ │  WhatsApp)  │
                              └──────┬──────┘ └──────┬──────┘
                                     │ Kafka events   │ Kafka events
                                     └────────┬───────┘
                                              ▼
                                  ┌─────────────────────┐
                                  │  Kafka + Zookeeper  │
                                  └─────────────────────┘
                                (PostgreSQL · Redis · Zipkin)
```

## Data Flow

### Authentication Flow
1. User submits login credentials to `/api/users/login` (user-service)
2. user-service calls auth-service via Feign to generate JWT
3. auth-service returns JWT and sets httpOnly cookie
4. Subsequent requests include cookie, gateway validates JWT and injects trust headers
5. Services validate trust headers and establish authentication context

### Booking Saga Flow
1. Tenant POST `/api/bookings` (booking-service)
2. booking-service validates unit availability & fetches price via property details (property-service Feign)
3. booking-service computes total price and saves booking as PENDING
4. booking-service initiates payment saga:
   - Flips booking to PAYMENT_INITIATED
   - Publishes `booking.confirmed` event to Kafka
5. payment-service consumes event:
   - Processes Paystack payment (initialize or charge_authorization)
   - Saves payment as PROCESSING
6. Paystack webhook notifies payment-service:
   - payment-service re-verifies with Paystack
   - Updates payment status (SUCCESS/FAILED)
   - Publishes `payment.succeeded` or `payment.failed` event
7. booking-service consumes payment event:
   - On success: marks booking CONFIRMED, property unit as RENTED
   - On failure: marks booking CANCELLED, publishes `booking.cancelled`
8. notification-service consumes relevant events:
   - Sends Twilio SMS/WhatsApp notifications for booking/payment status changes

## Architectural Boundaries

### Service Boundaries
Each service owns:
- Single responsibility domain (auth, user, property, booking, payment, notification)
- Private database (no direct database access between services)
- REST API for synchronous communication
- Kafka topics for asynchronous event-driven communication

### Trust Boundary
- Gateway validates JWT and establishes trust via `X-Internal-Secret`
- Services reject requests missing or with invalid internal secret
- Service-to-service calls propagate secret via Feign interceptors
- Webhook endpoints (Paystack) bypass internal secret check as they're external calls

### Data Ownership
- user-service: user_service_db (users, roles)
- property-service: property_db (properties, units, images)
- booking-service: booking_db (bookings)
- payment-service: payment_db (payments)
- notification-service: notification_db (notification logs)
- (Note: image_db referenced in docs but not visibly implemented)

## Infrastructure Concerns

### Messaging
- Apache Kafka 7.6 as event bus
- Topics: booking.confirmed, booking.cancelled, booking-completed-topic, payment.succeeded, payment.failed
- Manual offset acknowledgment, concurrency=3 listeners
- Idempotent producers (acks=all, enable.idempotence=true)

### Caching & Rate Limiting
- Redis 7 for:
  - Refresh token storage (auth-service)
  - Gateway rate limiting (60s window, fail-open)

### Observability
- Distributed tracing via Micrometer + Zipkin
- All services report to Zipkin server
- Sensitive data masked in logs (Twilio SIDs, Paystack keys, phone numbers, JWTs)

## Key Architectural Decisions

### JWT with httpOnly Cookies
- Tokens stored in httpOnly cookies, inaccessible to JavaScript
- Reduces XSS attack surface
- Gateway validates JWT locally (no round-trip to auth-service)
- Refresh token rotation handled via dedicated endpoint

### Gateway-Secret Handshake for Service Trust
- Gateway injects cryptographically signed headers on downstream requests
- Services validate headers to confirm request originated through gateway
- Prevents direct service-to-service bypassing security checks
- Eliminates need for service-to-service auth round-trips

### Event-Driven Saga for Booking Flow
- Booking service orchestrates reservation lifecycle via Kafka events
- Each step publishes events consumed by downstream services
- Idempotency guards at every state transition
- Compensating transactions (cancellation) on failure paths

### Database-per-Service Pattern
- Each service owns its PostgreSQL database
- Eliminates database coupling and enables independent scaling
- user-service uses Hibernate ddl-auto (dev convenience)
- Other services use Flyway for controlled schema migrations

### Spring Cloud Version Strategy
- config-server runs newer Spring Boot/Cloud (3.5.13/2025.0.2)
- Other services on stable versions (3.2.5/2023.0.x)
- Intentional drift allowing config-server innovation while maintaining stability