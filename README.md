# Smart-Rent

A multi-tenant rental marketplace for Ghana, connecting **tenants**, **landlords**, and **administrators** through a Spring Boot microservices backend and a React 19 single-page application.

> Properties → Browsing → Booking → Paystack payment → Twilio notification, coordinated by a Kafka-driven saga.

---

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Infrastructure](#infrastructure)
- [Backend Services](#backend-services)
- [Cross-Cutting Patterns](#cross-cutting-patterns)
- [Frontend](#frontend)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints (Overview)](#api-endpoints-overview)
- [Saga: Booking → Payment → Notification](#saga-booking--payment--notification)
- [Project Status](#project-status)
- [Reading Order for Contributors](#reading-order-for-contributors)

---

## Architecture Overview

Smart-Rent follows a **domain-decomposed microservices** pattern. Each bounded context owns its database, exposes a REST API, and participates in cross-service workflows via Kafka events. A single API gateway handles JWT validation, rate limiting, CORS, and trust-header propagation.

```
                ┌─────────────────────┐
                │  React 19 SPA       │
                │  smart-rent-frontend│
                └──────────┬──────────┘
                           │ HTTPS + httpOnly cookies
                           ▼
                ┌─────────────────────┐
                │   api-gateway       │ ← Redis rate-limiter
                │ (Spring Cloud GW)   │ ← JWT validation
                │                    │ ← Trust-header injection
                └──────────┬──────────┘
                           │ Eureka / Feign
        ┌────────────┬─────┴──────┬──────────────────┐
        ▼            ▼            ▼                  ▼
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

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Language | Java 17 |
| Framework | Spring Boot 3.2.5 (config-server: 3.5.13) |
| Cloud | Spring Cloud 2023.0.x (config-server: 2025.0.2) |
| Gateway | Spring Cloud Gateway (reactive/WebFlux) |
| Discovery | Netflix Eureka |
| Config | Spring Cloud Config Server (Git-backed) |
| Persistence | Spring Data JPA + Flyway |
| Messaging | Spring Kafka (acks=all, idempotent producer) |
| HTTP | OpenFeign + Resilience4j circuit breakers |
| Security | Spring Security + JJWT 0.12 |
| Tracing | Micrometer + Zipkin |
| Logging | SLF4J (sensitive data masked) |

### Third-Party Integrations
| Service | Use |
|---|---|
| **Paystack** | GHS payments + webhooks |
| **Twilio** | SMS + WhatsApp notifications |
| **Cloudinary** | Property image hosting |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19.2 + Vite 8 |
| Routing | react-router-dom 7 (data router API) |
| Styling | Tailwind CSS 3.4 (semantic design tokens) |
| Forms | react-hook-form |
| HTTP | axios (singleton + refresh queue) |
| Date picker | react-datepicker (branded) |
| Icons | lucide-react |
| Toasts | react-hot-toast |
| Lint | oxlint |

### Infrastructure
- PostgreSQL 16 (one instance, six service-scoped databases)
- Redis 7 (refresh tokens + gateway rate limit)
- Apache Kafka 7.6 (Confluent CP)
- Zookeeper (Kafka coordinator)
- Kafdrop (Kafka UI)
- Zipkin (distributed tracing UI)

---

## Repository Layout

```
smart-rent/
├── api-gateway/                 Reactive edge (Spring Cloud Gateway)
├── config-server/               Spring Cloud Config (Git-backed)
├── discovery-server/            Eureka registry
├── auth-service/                JWT issuance + refresh rotation
├── user-service/                Profiles, roles, login orchestration
├── property-service/            Property + Unit + Image (Cloudinary)
├── booking-service/             Reservation saga orchestrator
├── payment-service/             Paystack integration + reconciliation
├── notification-service/        Twilio SMS/WhatsApp consumer
├── smart-rent-frontend/         React 19 SPA
├── init-db/                     init.sql — six CREATE DATABASE statements
├── docker-compose.yml           Postgres + Redis + Kafka + tools
└── .env                         Secrets, DB creds, third-party keys
```

---

## Infrastructure

All services share the `smart-rent-network` Docker bridge.

| Container | Image | Host Port | Purpose |
|---|---|---|---|
| `postgres` | `postgres:16-alpine` | 5432 | 6 service-scoped databases |
| `redis` | `redis:7-alpine` | 6379 | Refresh tokens + rate-limit counters |
| `kafka` | `confluentinc/cp-kafka:7.6.0` | 9092 (internal), 29092 (host) | Event bus |
| `zookeeper` | `confluentinc/cp-zookeeper` | 2181 | Kafka coordinator |
| `kafdrop` | `obsidiandynamics/kafdrop` | 9000 | Kafka UI → http://localhost:9000 |
| `zipkin` | `openzipkin/zipkin` | 9411 | Tracing UI → http://localhost:9411 |

Kafka listeners:
- `PLAINTEXT` — `kafka:9092` (inter-container)
- `PLAINTEXT_HOST` — `localhost:29092` (host apps on Windows)

Topic defaults: 3 partitions, replication factor 1 (single broker), retention 168h, auto-create enabled.

---

## Backend Services

### 1. `api-gateway`
Single entrypoint. Reactive WebFlux.

**Responsibilities:**
- JWT validation (HMAC signature, no auth-service round-trip)
- Rate limiting (Redis-backed, 60s window, fail-open)
- CORS handling
- Trust-header injection (`X-User-Id`, `X-User-Role`, `X-User-Email`, `X-Internal-Secret`)

**Filter chain (ordered):**
1. `CorsFilter`
2. `JwtAuthenticationFilter` — reads `access_token` cookie first, then `Authorization: Bearer`
3. `RateLimitFilter` — keyed `rate_limit:{user|ip}:{id}`

Routes are sourced from config-server's Git repo (not the local `application.yml`).

### 2. `config-server`
Spring Cloud Config backed by `github.com/kofidhope/smart-rent-config` (default branch `main`). Port 8888.

> ⚠️ Version note: this service runs Spring Boot 3.5.13 / Spring Cloud 2025.0.2 while the rest of the fleet is on 3.2.5 / 2023.0.x.

### 3. `discovery-server`
Standard Eureka registry. Port 8761 (default).

### 4. `auth-service`
Stateless JWT issuer. Redis-only persistence.

**Endpoints (`/api/auth`):**
| Method | Path | Description |
|---|---|---|
| POST | `/generate` | Internal — called via Feign by user-service |
| POST | `/refresh` | Cookie-driven rotation |
| POST | `/logout` | Revoke refresh token, clear cookies |
| GET | `/validate` | Bearer validation |

**Refresh-token model:** stored as `@RedisHash("refresh_tokens")` with `@Indexed userId` and `@TimeToLive expiration`. Two key namespaces used (`refresh_tokens:{token}` and `refresh_tokens:userId:{userId}` set) to enable atomic token-family revocation on reuse.

### 5. `user-service`
Identity, roles, login orchestration.

**Entities:** `User` (UUID PK, unique email/phone, hashed password, `Role`), `Role` enum (`TENANT` / `LANDLORD` / `ADMIN`). Hibernate `ddl-auto` manages schema (no Flyway here).

**Endpoints (`/api/users`):**
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Public (always assigns TENANT) |
| POST | `/login` | Public — calls auth-service, sets httpOnly cookies |
| GET | `/profile` | Self |
| PUT | `/profile` | Self update |
| PUT | `/profile/password` | Change password |
| GET | `/{id}` | Internal (Feign) |
| GET | `/email/{email}` | Internal (Feign) |
| GET | `/` | Admin only (list users) |
| DELETE | `/{id}` | Admin only |

Seeded on startup: `admin@smartrent.com` (ADMIN), `landlord@smartrent.com` (LANDLORD).

### 6. `property-service`
Listings, units (per-room), image hosting via Cloudinary.

**Entities:**
- `Property` (UUID; owner/title/description/address/city/price; `PropertyType`; `PropertyStatus`; bedrooms/bathrooms; `@OneToMany units`)
- `Unit` (newly added — name/description/nullable priceOverride/bedroomsOverride; helpers `getEffectivePrice/Bedrooms/Bathrooms`)
- `PropertyImage` (UUID; url, publicId, isPrimary, displayOrder)

**Endpoints (`/api/properties`):**
- `GET /search` (public, paginated), `GET /my` (landlord), `GET /bulk?ids=…` (internal), `GET /{id}` (public)
- `POST /`, `PUT /{id}`, `DELETE /{id}` (landlord-scoped)
- `PUT /{id}/status/rent`, `…/available` (internal)
- Sub-paths: `/{propertyId}/units` (CRUD), `/{propertyId}/images` (multipart, get, set primary, delete)

**Image rules:** max 10/property, 5 MB, JPG/PNG/WebP only; first upload = primary; deleting primary promotes next.

**Database:** `property_db`. Flyway-managed (V1 properties → V2 indexes → V3 images → V4 partial-unique primary → **V5 units + migration copying every existing property into a "Whole Property" unit**).

Feign: `UserServiceClient` (with `UserServiceClientFallback` → "Unknown User") + Resilience4j.

### 7. `booking-service`
Reservation lifecycle and **saga orchestrator**.

**Entities:** `Booking` (UUID; tenantId, propertyId, ownerId, **unitId**, startDate/endDate, totalPrice, `BookingStatus`, `PaymentStatus`, paystackPaymentId, failureReason, timestamps).

**Endpoints (`/api/bookings`):**
- `POST /` (TENANT) — validates availability, computes `nights × price`, persists PENDING, kicks off saga
- `GET /my`, `GET /{id}`, `GET /property/{propertyId}`
- `DELETE /{id}/cancel` (TENANT — rejects already-CANCELLED/COMPLETED/CONFIRMED)
- `PATCH /{id}/complete` (internal scheduler)

**Rules:** 1–365 nights, startDate ≥ today, no tenant = owner, unit-level date-overlap check.

**`BookingScheduler`** (cron `0 */30 * * * *`) auto-completes CONFIRMED bookings past `endDate`.

**Kafka topics:**
- Publishes: `booking.confirmed`, `booking.cancelled`, `booking-completed-topic`
- Consumes: `payment.succeeded`, `payment.failed` (typed factories, manual ack)

**Database:** `booking_db`. Flyway-managed (V1 bookings → V2 indexes → V3 nullable `unit_id`).

### 8. `payment-service`
Paystack (GHS) integration + webhook ingestion + reconciliation.

**Entities:** `Payment` (UUID; bookingId/tenantId/ownerId/amount/currency; `PaymentStatus`; `PaymentType`; unique `paystackReference`; `paystackAccessCode`/`authorizationUrl`/`authorizationCode`; channel; failureReason; paidAt).

**Endpoints (`/api/payments`):**
- `GET /booking/{bookingId}`, `GET /my` (tenant), `GET /owner/revenue`, `GET /owner/revenue/total` (landlord)
- `POST /webhook` (public — Paystack HMAC-SHA512, raw body required)

**Smart path:**
- If tenant already has a successful `authorizationCode` → `charge_authorization` (no redirect)
- Else `initialize` (returns Paystack URL for tenant redirect)

Reference format: `SMARTRENT-{first8OfBookingId}-{random4}` for traceability.

**Reconciliation:** scheduled `reconcileStuckPayments` every 30 min finds PROCESSING payments > 30 min old, re-verifies with Paystack, publishes the appropriate event.

**Kafka:** concurrency=3, manual ack, `DefaultErrorHandler` with `FixedBackOff(2s, 2)`; deserialization errors are non-retryable.

`GatewayAuthFilter` lets `/api/payments/webhook` bypass the internal-secret check.

### 9. `notification-service`
Outbound SMS/WhatsApp via Twilio. Pure Kafka consumer — **no external REST API**.

**Entities:** `NotificationLog` (UUID; bookingId; tenantId; `NotificationType`; `NotificationChannel`; `NotificationStatus`; recipientPhone/Email; messageBody; twilioSid; failureReason; retryCount; sentAt).

**Kafka topics consumed** (all with concurrency=3, `RECORD` ack):
- `booking.confirmed`, `booking.cancelled`, `booking-completed-topic`
- `payment.succeeded`, `payment.failed`

**Reliability patterns:**
- Pre-call `existsByBookingIdAndType` rejects duplicate SMS
- PENDING record written before Twilio call (so a crash yields a stuck-pending row)
- Failures are never rethrown — offset commits regardless of Twilio outcome; retries via scheduled job (retryCount < 3)
- Twilio init in `@PostConstruct`; E.164 validation; phone masking in logs
- Templates ≤ 160 chars
- Feign fallback to user-service returns an "Unknown User" → notification logged as SKIPPED rather than retried forever

**Note:** the scheduled retry job is not yet wired despite supporting repository methods (`findStuckPending`, `findRetryEligible`, `deleteOldLogs`).

---

## Cross-Cutting Patterns

### Trust model (gateway-secret handshake)
1. Frontend sends httpOnly cookies set by gateway/auth/user-service on login.
2. Gateway verifies JWT HMAC signature locally — no auth-service round-trip.
3. Gateway injects `X-User-Id`, `X-User-Role`, `X-User-Email`, and `X-Internal-Secret` on every downstream call (Paystack webhook excepted).
4. Every downstream service runs an identical `GatewayAuthFilter` (`OncePerRequestFilter`) that:
   - Bypasses `/actuator/**` plus each service's internal endpoints.
   - Compares incoming `X-Internal-Secret` to the configured `gateway.internal-secret`.
   - Builds `UsernamePasswordAuthenticationToken` with `ROLE_<UPPERCASE_ROLE>` from headers.
5. Service-to-service Feign calls propagate `X-Internal-Secret` via each service's `FeignClientInterceptor`.

**Implication:** any HTTP caller without the secret is rejected as direct external access.

### Inter-service communication

**Synchronous (Feign + Resilience4j):**
| Caller | Target | Use |
|---|---|---|
| `user-service` | `auth-service` | `AuthClient.generateToken` |
| `property-service` | `user-service` | `UserServiceClient.getUserById` (fallback: "Unknown User") |
| `booking-service` | `property-service` | `getPropertyById`, `getPropertiesByIds`, `markAsRented`, `markAsAvailable`, `getUnitsForProperty` |
| `booking-service` | `user-service` | `getUserById` |
| `notification-service` | `user-service` | `getUserById` (fallback: empty user → SKIPPED) |

**Asynchronous (Kafka):**
| Producer | Topic | Consumer |
|---|---|---|
| booking-service | `booking.confirmed` | payment-service, notification-service |
| booking-service | `booking.cancelled` | payment-service, notification-service |
| booking-service | `booking-completed-topic` | notification-service |
| payment-service | `payment.succeeded` | booking-service, notification-service |
| payment-service | `payment.failed` | booking-service, notification-service |

### Observability
All services report to Zipkin via `micrometer-tracing-bridge-brave` + `zipkin-reporter-brave`. Kafka producers in payment-service have `template.setObservationEnabled(true)`. All sensitive data (Twilio SID, Paystack secret, phones) is masked in logs.

### Idempotency
Every state transition in the saga has idempotency guards. Twilio side-writes PENDING before the call. Webhook handlers re-verify with Paystack rather than trusting the payload alone.

---

## Frontend (`smart-rent-frontend`)

**Stack:** React 19 + Vite + Tailwind + react-router 7 + react-hook-form + axios + react-datepicker + lucide-react + react-hot-toast. JSX (no TypeScript).

### Layout (feature-based)
```
src/
├── assets/                      hero.png, react.svg, vite.svg
├── components/
│   ├── layout/                  Layout.jsx, Navbar.jsx
│   ├── property/                PropertyCard.jsx
│   └── ui/                      Button, Input, Badge, Card, ErrorMessage, LoadingSpinner, DatePicker
├── context/AuthContext.jsx      Single source of truth for session
├── hooks/useAuth.js              Wraps AuthContext with a provider check
├── pages/
│   ├── public/                  HomePage, PropertiesPage, PropertyDetailPage, LoginPage, RegisterPage
│   ├── tenant/                  TenantDashboard, MyBookings, MyPayments
│   ├── landlord/                LandlordDashboard, MyProperties, CreateProperty, EditProperty, PropertyBookings
│   └── admin/                   AdminDashboard, VerificationRequests
├── router/index.jsx             createBrowserRouter + guards
└── services/
    ├── api.js                   Axios singleton + refresh queue
    ├── auth.service.js          login/register/logout/getCurrentUser/updateProfile/changePassword
    ├── property.service.js      search/getById/getMy/create/update/delete + image upload
    ├── booking.service.js       create/getMy/getById/getByProperty/cancel
    └── payment.service.js       getByBooking/getMy/getOwnerRevenue/waitForPayment
```

### Routing & guards (`router/index.jsx`)
Three layered guards:
- **`ProtectedRoute`** — redirects guests to `/login` (preserves `state.from`); shows spinner while session restores.
- **`RoleGuard(allowedRoles)`** — inside ProtectedRoute; mismatch redirects to user's role-home.
- **`GuestOnly`** — inverse, used for `/login`, `/register`.

| Path | Page | Access |
|---|---|---|
| `/` | HomePage | Public |
| `/properties` | PropertiesPage | Public |
| `/properties/:id` | PropertyDetailPage | Public |
| `/login` | LoginPage | GuestOnly |
| `/register` | RegisterPage | GuestOnly |
| `/tenant/dashboard` | TenantDashboard | TENANT |
| `/tenant/bookings` | MyBookings | TENANT |
| `/tenant/payments` | MyPayments | TENANT |
| `/landlord/dashboard` | LandlordDashboard | LANDLORD |
| `/landlord/properties` | MyProperties | LANDLORD |
| `/landlord/properties/new` | CreateProperty | LANDLORD |
| `/landlord/properties/:id/edit` | EditProperty | LANDLORD |
| `/landlord/properties/:propertyId/bookings` | PropertyBookings | LANDLORD |
| `/admin/dashboard` | AdminDashboard | ADMIN |
| `/admin/verification` | VerificationRequests | ADMIN |
| `*` | redirect to `/` | — |

### Authentication flow
- Tokens in **httpOnly cookies**; JavaScript never reads them.
- `localStorage` holds the user profile only (`smartrent_user` key, via `UserStorage`).
- **`AuthContext`** restores session on mount: reads `UserStorage` for instant UI, then calls `GET /api/users/profile` to verify; on failure clears state.
- **`services/api.js`** uses a **singleton refresh queue**: first 401 triggers `POST /api/auth/refresh` (cookie-only); concurrent failures enqueue and replay on success. Refresh skipped for `auth/refresh`, `users/login`, `users/register`, or when there's no stored user.
- `getErrorMessage(error)` maps the backend's `{status, error, message, timestamp, path}` shape and provides status-code fallbacks.

### State management
- **Auth** — React Context only.
- **Forms** — react-hook-form per page with `onBlur` validation.
- **Page state** — `useState` + `useEffect` (no React Query / SWR).
- **URL state** — `useSearchParams` on `/properties` for shareable filters (city/type/minPrice/maxPrice/minBedrooms).
- **Toasts** — react-hot-toast configured globally in `App.jsx`.

### Styling
- Tailwind 3.4 with brand palette (`brand.green #1D9E75`, `brand.dark #0F6E56`, `brand.light #E8F5F0`, `brand.lighter #F4FAF8`).
- Semantic tokens (`success`, `warning`, `danger`, `info`) split into `bg`/`border`/`text`/`icon`.
- Custom shadows, type scale (`display`→`meta`), and radii (`card 0.75rem`, `btn 0.5rem`, `badge 9999px`).
- `src/index.css` is the design-system hub: Tailwind layers + `@layer components` (`.page-container`, `.card`, `.btn-*`, `.input`, `.badge-*`, `.alert-*`, `.empty-state`, `.overlay`, `.drawer-bottom`, `.table-container`) + `.react-datepicker*` overrides in brand-green.
- No CSS modules / styled-components / Sass. Inter font via Google Fonts in `index.html`.

### Accessibility
`role="alert"` + `aria-live` on errors, `aria-busy` on buttons, `aria-invalid` + `aria-describedby` on inputs, `aria-hidden` on decorative icons, `aria-label` on the PropertyCard button, focus-visible rings on every interactive element, `role="status"` on the spinner.

---

## Getting Started

### Prerequisites
- Docker + Docker Compose
- Java 17 + Maven (per-service)
- Node.js 20+ + npm (frontend)

### 1. Start infrastructure

```bash
# from repo root
docker compose up -d
```

This brings up Postgres, Redis, Kafka, Zookeeper, Kafdrop, and Zipkin.

### 2. Configure

The repo uses `Spring Dotenv` and Spring Cloud Config. Set secrets in `.env`:

```bash
cp .env.example .env   # then fill in real values
```

### 3. Start infrastructure services

```bash
# config-server
(cd config-server && ./mvnw spring-boot:run)

# discovery-server
(cd discovery-server && ./mvnw spring-boot:run)
```

### 4. Start backend services (in any order; they'll register with Eureka)
```bash
(cd auth-service       && ./mvnw spring-boot:run)
(cd user-service       && ./mvnw spring-boot:run)
(cd property-service   && ./mvnw spring-boot:run)
(cd booking-service    && ./mvnw spring-boot:run)
(cd payment-service    && ./mvnw spring-boot:run)
(cd notification-service && ./mvnw spring-boot:run)

# gateway last (depends on Eureka-discovered services)
(cd api-gateway && ./mvnw spring-boot:run)
```

### 5. Start frontend

```bash
(cd smart-rent-frontend && npm install && npm run dev)
```

Open http://localhost:5173. The frontend proxies `/api/*` → `http://localhost:8882` (the gateway).

### Useful UIs
- Frontend: http://localhost:5173
- Gateway (dev): http://localhost:8882
- Zipkin: http://localhost:9411
- Kafdrop: http://localhost:9000

---

## Environment Variables

Defined in `.env` at repo root.

### JWT
| Variable | Example | Notes |
|---|---|---|
| `JWT_SECRET` | Base64 string | HMAC signing key (shared by gateway + auth-service) |
| `JWT_EXPIRATION` | `900000` (15 min) | Access-token TTL (ms) |
| `JWT_REFRESH_EXPIRATION` | `604800000` (7 d) | Refresh-token TTL (ms) |
| `GATEWAY_INTERNAL_SECRET` | `smartrent-internal-2026` | Service-to-service trust header |

### Databases (per-service)
| Variable | DB | Username |
|---|---|---|
| `DB_NAME` / `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | `user_service_db` | `username` |
| `P_DB_NAME` / `P_DB_URL` / `P_DB_USERNAME` / `P_DB_PASSWORD` | `property_db` | `username` |
| `B_DB_NAME` / `B_DB_URL` / `B_DB_USERNAME` / `B_DB_PASSWORD` | `booking_db` | `username` |
| `M_DB_NAME` / `M_DB_URL` / `M_DB_USERNAME` / `M_DB_PASSWORD` | `payment_db` | `username` |
| `N_DB_NAME` / `N_DB_URL` / `N_DB_USERNAME` / `N_DB_PASSWORD` | `payment_db` ⚠️ | `username` |

> ⚠️ `N_DB_NAME` is set to `payment_db` instead of `notification_db`. This needs reconciling with `init-db/init.sql`.

### Redis
| Variable | Example |
|---|---|
| `REDIS_HOST` | `localhost` |
| `REDIS_PORT` | `6379` |

### Twilio
| Variable | Example |
|---|---|
| `TWILIO_ACCOUNT_SID` | `AC076c39…` |
| `TWILIO_AUTH_TOKEN` | `…` |
| `TWILIO_PHONE_NUMBER` | `+18632436818` |
| `TWILIO_WHATSAPP_NUMBER` | `whatsapp:+14155238886` |
| `TWILIO_MESSAGING_SERVICE_SID` | `MGc121c4e…` |

### Paystack
| Variable | Example |
|---|---|
| `PAYSTACK_SECRET_KEY` | `sk_test_…` |
| `PAYSTACK_PUBLIC_KEY` | `pk_test_…` |
| `PAYSTACK_WEBHOOK_SECRET` | `your_webhook_secret_here` ⚠️ |
| `PAYSTACK_BASE_URL` | `https://api.paystack.co` |
| `PAYSTACK_CURRENCY` | `GHS` |

### Cloudinary
| Variable | Example |
|---|---|
| `CLOUD-NAME` | `dhope-cloud` |
| `CLOUD-API-KEY` | `…` |
| `CLOUD-API-SECRET` | `…` |

---

## API Endpoints (Overview)

Frontend → gateway (`/api`) → service. Full paths shown below the gateway prefix.

| Method | Path | Service | Auth |
|---|---|---|---|
| POST | `/api/users/register` | user-service | public |
| POST | `/api/users/login` | user-service | public |
| GET | `/api/users/profile` | user-service | self |
| PUT | `/api/users/profile` | user-service | self |
| PUT | `/api/users/profile/password` | user-service | self |
| GET | `/api/users` | user-service | admin |
| DELETE | `/api/users/{id}` | user-service | admin |
| POST | `/api/auth/refresh` | auth-service | cookie |
| POST | `/api/auth/logout` | auth-service | cookie |
| GET | `/api/properties/search` | property-service | public |
| GET | `/api/properties/{id}` | property-service | public |
| GET | `/api/properties/my` | property-service | landlord |
| POST | `/api/properties` | property-service | landlord |
| PUT | `/api/properties/{id}` | property-service | landlord |
| DELETE | `/api/properties/{id}` | property-service | landlord |
| POST | `/api/properties/{id}/images` | property-service | landlord |
| GET | `/api/properties/{propertyId}/units` | property-service | mixed |
| POST | `/api/properties/{propertyId}/units` | property-service | landlord |
| POST | `/api/bookings` | booking-service | tenant |
| GET | `/api/bookings/my` | booking-service | tenant |
| GET | `/api/bookings/{id}` | booking-service | tenant / landlord |
| GET | `/api/bookings/property/{propertyId}` | booking-service | landlord |
| DELETE | `/api/bookings/{id}/cancel` | booking-service | tenant |
| GET | `/api/payments/booking/{bookingId}` | payment-service | tenant / landlord |
| GET | `/api/payments/my` | payment-service | tenant |
| GET | `/api/payments/owner/revenue` | payment-service | landlord |
| GET | `/api/payments/owner/revenue/total` | payment-service | landlord |
| POST | `/api/payments/webhook` | payment-service | Paystack HMAC |
| GET | `/api/verification/pending` | user-service | admin |
| PATCH | `/api/verification/{userId}/decision` | user-service | admin |

---

## Saga: Booking → Payment → Notification

```
Tenant POST /api/bookings
   │
   ▼
BookingService.createBooking
   ├─ property-service: validate unit availability + fetch price
   ├─ compute total = nights × price
   └─ save Booking (PENDING)
        │
        ▼
BookingSaga.initiatePayment
   ├─ flip Booking → PAYMENT_INITIATED, PaymentStatus → PROCESSING
   └─ publish "booking.confirmed"  (key = bookingId)
        │
        ▼
PaymentService  (Kafka: booking.confirmed)
   ├─ choose path:
   │    ├─ has prior authorizationCode → charge_authorization (no redirect)
   │    └─ else → initialize → returns PayStack authorization_url
   └─ save Payment (PROCESSING)
        │
        ▼
   Paystack  ────►  Tenant pays on Paystack UI
        │
        ▼
   Paystack webhook POST /api/payments/webhook
        │
        ▼
PaymentService.PaystackWebhookController
   ├─ verify HMAC-SHA512 signature
   ├─ re-verify transaction with Paystack (never trust webhook alone)
   ├─ update Payment → SUCCESS / FAILED
   └─ publish "payment.succeeded" or "payment.failed"
        │
        ├─────────────────────┬───────────────────────────┐
        ▼                     ▼                           ▼
BookingService             NotificationService      (state for tenant UI)
   ├─ success:              ├─ lookup tenant phone
   │    ├─ Booking → CONFIRMED    ├─ write PENDING log
   │    └─ property-service:      ├─ send via Twilio
   │       markAsRented()         └─ log → SENT / FAILED
   └─ failure:
        ├─ Booking → CANCELLED
        └─ publish "booking.cancelled"
```

**Idempotency** at every transition. Property is only marked RENTED on success — the failure path leaves it AVAILABLE, keeping actions reversible until the saga commits.

---

## Project Status

### Recent evolution (from git log)
```
feat(payment-service):   handle unitId in payment flow
feat(notification-service): support unit-based notifications
feat(booking-service):   support unitId in bookings + per-unit overlap check
feat(property-service):  add Unit entity + CRUD + data migration
```
The **Unit** abstraction is the active theme — properties now contain bookable rooms/units rather than being rented as a whole.

### Known inconsistencies / risks
- **Version drift** — `config-server` is on Spring Boot 3.5.13 / Spring Cloud 2025.0.2 while the rest of the fleet is 3.2.5 / 2023.0.x.
- **Package drift** — services split across `com.kofi`, `com.smartrent`, and `com.dhopecode`. Event DTOs are duplicated across packages; field names must be kept in sync manually.
- **`.env` DB mismatch** — `N_DB_NAME=payment_db` but `init.sql` creates `notification_db`.
- **Webhook secret placeholder** — `PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_here` must be set before going live.
- **Gateway routing config** lives entirely in config-server's Git repo — no local routes.
- **Cookie duplication** — `auth-service` and `user-service` both set `access_token` + `refresh_token` httpOnly cookies (intentional but brittle).
- **`BookingService.getDefaultUnit`** throws `RuntimeException` for missing units, breaking graceful degradation when property-service is unreachable (the fallback returns an empty list).
- **`notification-service` retry scheduler** is not wired despite supporting repository methods (`findStuckPending`, `findRetryEligible`).

---

## Reading Order for Contributors

1. `docker-compose.yml` + `.env` + `init-db/init.sql` — runtime context.
2. `api-gateway/` — the gateway-secret handshake is the spine of the trust boundary.
3. `auth-service/` + `user-service/` — identity + login + cookies.
4. `property-service/` — the core domain (Property + Unit + Image + Cloudinary).
5. `booking-service/` — the saga (`BookingSaga.java` + `PaymentEventListener.java`).
6. `payment-service/` — Paystack integration + webhook + reconciliation scheduler.
7. `notification-service/` — Kafka consumers + Twilio.
8. `smart-rent-frontend/src/router/index.jsx` — frontend entry.
9. `smart-rent-frontend/src/services/api.js` — auth refresh queue (most subtle frontend file).
10. `smart-rent-frontend/src/context/AuthContext.jsx` — session restore flow.

---

## License

Proprietary — internal Smart-Rent project.
