# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Smart-Rent is a rental-marketplace platform for Ghana: a Spring Cloud microservices backend, a React 19 SPA, and an event-driven saga across Kafka. Three user roles (TENANT, LANDLORD, ADMIN). Three third-party integrations (Paystack GHS payments, Twilio SMS/WhatsApp, Cloudinary image hosting).

## Daily commands

### Frontend (`smart-rent-frontend/`)

```bash
npm install          # one-time / after package.json changes
npm run dev          # Vite at http://localhost:5173, proxies /api -> http://localhost:5173 (per vite.config.js)
npm run build        # production build -> dist/
npm run lint         # oxlint — warnings only, 4 pre-existing fast-refresh warnings
npm run preview      # serve the production build
```

There is no `test` script — frontend has no tests. Verify changes with `npm run build` and `npm run lint`.

### Backend (each service)

Spring Boot 3.2.5 + Maven. Each service has its own `./mvnw`. Java 17 required.

```bash
cd <service> && ./mvnw spring-boot:run     # run one service
cd <service> && ./mvnw test                # run tests (currently no project-owned tests)
cd <service> && ./mvnw clean package       # build a JAR
```

There are no project-owned backend tests today; `mvn test` will pass trivially.

### Infrastructure

```bash
docker compose up -d   # from repo root — Postgres, Redis, Kafka, Zookeeper, Kafdrop (9000), Zipkin (9411)
docker compose down -v # stop + wipe volumes
```

Config-server is at `localhost:8888`, Eureka at `8761`. Bring these up **before** other services so they can register and pull config:

```bash
cd config-server    && ./mvnw spring-boot:run
cd discovery-server && ./mvnw spring-boot:run
```

then the rest in any order, then `api-gateway` last (depends on Eureka-discovered routes from config-server).

## Service boot order

1. `docker compose up -d` — Postgres/Redis/Kafka/Zookeeper must be running.
2. `config-server` — other services `spring.config.import=optional:configserver:http://localhost:8888`.
3. `discovery-server` (Eureka) — services register here for Feign / gateway lookup.
4. Business services in any order: `auth-service`, `user-service`, `property-service`, `booking-service`, `payment-service`, `notification-service`.
5. `api-gateway` last — its routes come from config-server (local `application.yml` has no route config).

## High-level architecture

### Layout

```
smart-rent/
├── api-gateway/                 Reactive edge (Spring Cloud Gateway)
├── config-server/               Spring Cloud Config (Git-backed)
├── discovery-server/            Eureka registry
├── auth-service/                JWT issuance + refresh rotation
├── user-service/                Profiles + login orchestration
├── property-service/            Property + Unit (per-room) + Cloudinary images
├── booking-service/             Reservation saga orchestrator
├── payment-service/             Paystack + webhook + reconciliation
├── notification-service/        Twilio SMS/WhatsApp (Kafka consumer only)
├── smart-rent-frontend/         React 19 + Vite + Tailwind
├── init-db/init.sql             six CREATE DATABASE statements
├── docker-compose.yml           Postgres + Redis + Kafka + Kafdrop + Zipkin
└── .env                         JWT secret, DB creds, Twilio, Paystack, Cloudinary
```

### Trust model — gateway-secret handshake (read this before touching security)

1. Frontend stores **httpOnly cookies only**; JavaScript never reads tokens. `localStorage` holds just `smartrent_user` (via `UserStorage`).
2. `api-gateway`'s `JwtAuthenticationFilter` validates the JWT HMAC signature locally (no auth-service round-trip), then injects `X-User-Id`, `X-User-Role`, `X-User-Email`, and `X-Internal-Secret` on every downstream call.
3. Every backend service runs a near-identical `GatewayAuthFilter` (`OncePerRequestFilter`) that compares incoming `X-Internal-Secret` against `gateway.internal-secret` and bypasses only its own internal endpoints (webhook, status endpoints, `/actuator/**`). Service-to-service Feign calls propagate the secret via each service's `FeignClientInterceptor`.
4. **Implication:** if a request is missing `X-Internal-Secret`, it didn't come through the gateway and is rejected.

Cookie-setting responsibility is intentionally split: `user-service` sets cookies on `/login` (and returns the user), `auth-service` sets them on `/refresh`. Don't duplicate.

### Inter-service communication

**Synchronous (Feign + Resilience4j, every client has a Fallback):**
| Caller | Target | Methods |
|---|---|---|
| `user-service` | `auth-service` | `generateToken` |
| `property-service` | `user-service` | `getUserById` (fallback: "Unknown User") |
| `booking-service` | `property-service` | `getPropertyById`, `getPropertiesByIds`, `markAsRented`, `markAsAvailable`, `getUnitsForProperty` |
| `booking-service` | `user-service` | `getUserById` |
| `notification-service` | `user-service` | `getUserById` (fallback: empty user → SKIPPED) |

**Asynchronous (Kafka):**
| Producer | Topic | Consumers |
|---|---|---|
| booking-service | `booking.confirmed`, `booking.cancelled`, `booking-completed-topic` | payment-service, notification-service |
| payment-service | `payment.succeeded`, `payment.failed` | booking-service (saga), notification-service |

Kafka listener factories use `concurrency=3`, `RECORD` ack mode, manual offset commit. Producer config: `acks=all`, `enable.idempotence=true`, retries=3. **No type headers on JSON** — cross-service event-DTO field names must stay in sync manually across packages (`com.kofi.booking_service.event`, `com.kofi.paymentservice.event`, `com.kofi.notification.event`).

### Booking saga (1-line mental model)

`POST /api/bookings` → `BookingService` validates via Feign → persists PENDING → `BookingSaga.initiatePayment` flips to PAYMENT_INITIATED and publishes `booking.confirmed` → `payment-service` calls Paystack → webhook re-verifies with Paystack → publishes `payment.succeeded` / `payment.failed` → `BookingEventListener` flips booking to CONFIRMED (also `propertyServiceClient.markAsRented`) or CANCELLED → `NotificationEventListener` sends Twilio SMS.

Idempotency guards on every state transition. `BookingService.getDefaultUnit` throws `RuntimeException` for missing units — that's a known sharp edge; don't make it worse by adding more downstream calls before the unit is resolved.

### Unit abstraction (active area of development)

A property now contains bookable units/rooms rather than being rented as a whole. The migration has been rolling out commit-by-commit:

```
property-service:    Unit entity, V5 Flyway migration copies each existing
                     property into a "Whole Property" unit
booking-service:     unitId on Booking, per-unit overlap check, getUnitsForProperty
                     Feign method (with empty-list fallback)
payment-service:     unitId on Payment
notification-service: per-unit notifications to landlords
```

When working on anything tenant-facing, assume the booking is for a unitId, not a propertyId. Unit availability is checked per-unit. Backend services for this abstraction are wired in; the frontend is mid-rollout, so guard `property.unitId` reads defensively.

### Database

One PostgreSQL instance, six databases: `user_service_db`, `property_db`, `booking_db`, `payment_db`, `notification_db`, `image_db`. Hibernate `ddl-auto` runs only in `user-service` (no Flyway there). All other services use Flyway — when changing a schema, **add a new `V{n}__*.sql` to `db/migration/`** and don't edit existing migrations.

> Known bug in `.env`: `N_DB_NAME=payment_db` but `init.sql` creates `notification_db`. Fix the env value, not the SQL.

### Frontend

```
src/
├── components/ {layout, property, ui/}     ui has the design-system primitives
├── context/AuthContext.jsx                  single session store, restoreSession() on mount
├── hooks/useAuth.js                         thin wrapper, throws if no provider
├── pages/ {public, tenant, landlord, admin} feature folders
├── router/index.jsx                         createBrowserRouter + ProtectedRoute/RoleGuard/GuestOnly
└── services/ {api.js, *.service.js}         api.js owns the singleton refresh queue
```

**Authentication refresh queue:** `services/api.js` is the only place that knows about token refresh. On 401 it serializes concurrent failures through a queue, calls `POST /api/auth/refresh` (cookie-only), and replays each request on success. Skip the queue for `auth/refresh`, `users/login`, `users/register`, and any 401 with no `UserStorage.get()` cached user. Do not duplicate refresh logic elsewhere.

**Design system:** Tailwind tokens live in `tailwind.config.js` (brand palette + semantic success/warning/danger/info split into bg/border/text/icon). Semantic class set lives in `src/index.css` under `@layer components` (`.card`, `.btn-*`, `.input`, `.badge-*`, `.alert-*`, `.empty-state`, `.overlay`, `.drawer-bottom`, `.table-container`). Brand styling for react-datepicker is the `.react-datepicker*` overrides near the bottom of `index.css`. When adding UI primitives, extend the design system rather than hardcoding styles.

**Unit abstraction in frontend:** `PropertyCard` uses `property.primaryImageUrl` / `property.status` / `property.bedrooms` — none of these are unit-scoped yet. `property-service` V5 migration guarantees every property has a "Whole Property" unit, so `property-service` currently still works without unitId in the frontend. Don't add new unit-aware UI without checking the `property-service` response shape; it isn't backfilled yet.

## Conventions specific to this repo

- **Sensitive data must be masked in logs.** Twilio SIDs, Paystack keys, phone numbers, JWTs — never `System.out.println` / `log.info` the raw value. PaystackConfig uses masked getters for exactly this reason.
- **JWT secret** is BASE64 in `.env` under `JWT_SECRET`. All services share it (gateway verifies HMAC, auth-service issues).
- **Gateway JWT lookup order:** the gateway's `JwtAuthenticationFilter` reads the `access_token` httpOnly cookie **first**, then falls back to the `Authorization: Bearer` header. Keep that order — cookie-first is what lets the httpOnly flow work without per-request code in the frontend.
- **Env-variable per-service pattern:** `.env` keys are prefixed by service scope (`DB_*` for user, `P_DB_*` for property, `B_DB_*` for booking, `M_DB_*` for payment, `N_DB_*` for notification). When adding a new service-scoped env value, follow the same prefix convention.
- **Java package split:** `com.kofi` for most services, `com.smartrent` for payment + notification, `com.dhopecode` for config + discovery. Don't move packages without a deprecation period — event DTOs are duplicated across packages on purpose.
- **Spring Cloud version drift:** `config-server` is on Spring Boot 3.5.13 / Spring Cloud 2025.0.2. Rest of the fleet is on 3.2.5 / 2023.0.x. Mixing is intentional, but don't upgrade other services without checking with the config-server author.
- **Backend version drift note** — `property-service` pins Spring Cloud `2023.0.3` while sibling services use `2023.0.1`. Trivial, but grep before bumping.
- **Gateway routes** live entirely in `config-server`'s Git repo (no local `application.yml` route config, no Java `RouteLocator` bean). Don't add routes locally.
- **`config-server` Git URI:** `github.com/kofidhope/smart-rent-config` (default branch `main`).
- **Twilio from a Ghana number:** `+18632436818`; WhatsApp via sandbox `+14155238886`.
- **Paystack currency is GHS.** Don't change without rechecking the `chargeAuthorization` path.

## Cross-cutting change checklist

When you touch something that crosses service boundaries, expect more files than the one you're editing:

- **Cookie name/path change** → update both `auth-service` (`AuthController.refresh`) and `user-service` (`UserController.login`). The frontend reads cookies implicitly via `withCredentials`; it doesn't see names.
- **Shared Kafka event DTO** → keep `BookingConfirmedEvent` / `PaymentSucceededEvent` / `PaymentFailedEvent` field names identical across `com.kofi.booking_service.event`, `com.kofi.paymentservice.event`, `com.kofi.notification.event`. **No type headers on JSON**, so a rename is silent at compile time.
- **Gateway trust header change** (e.g. add `X-User-Phone`) → update `JwtAuthenticationFilter` (injects) AND every service's `GatewayAuthFilter` (reads) AND every service's `FeignClientInterceptor` (propagates between services).
- **Schema change in a Flyway-managed DB** → add a new `V{n}__*.sql` to `<service>/src/main/resources/db/migration/`. Don't edit existing migrations.
- **New env var** → add to `.env` AND every service's `application.yml` reference AND config-server's Git repo (services pull config from there).
- **New Kafka topic** → declare as a `NewTopic` bean in `KafkaConfig` of the producer service (auto-create is enabled, but declaring it controls partitions/replication).

## Things that don't exist yet (avoid implementing under "best practices" pretense)

- The `notification-service` retry / cleanup scheduler — repository methods (`findStuckPending`, `findRetryEligible`, `deleteOldLogs`) exist but no `@Scheduled` job consumes them. Don't add a generic scheduler; ask before introducing one.
- No project-owned backend tests. Don't add a test suite unprompted.
- Frontend has no `test` script.
- No structured logging, no rate-limiting beyond the gateway's coarse per-minute Redis counter, no outbox.

## Sharp edges to keep in mind

- `BookingService.getDefaultUnit` throws `RuntimeException` for missing units and bypasses the existing `PropertyNotAvailableException`. Property-service fallback returns an empty list, so the user's booking flow breaks badly when property-service is down. If you fix this, do it inside `BookingService.getDefaultUnit` — don't paper over it in the controller.
- `.env` `N_DB_NAME=payment_db` is wrong (should be `notification_db`).
- `auth-service` / `user-service` both set the same httpOnly cookies — duplication is intentional (login vs refresh) but brittle; one cookie-name change has to land in both.
- OAuth buttons on Login/Register (`Google`, `Facebook`) are disabled placeholders. Don't enable them.
- `AdminDashboard`'s `/api/verification/pending` endpoint is best-effort; the page already degrades to an "unavailable" empty state if the endpoint 404s. Match that pattern if you add more admin-only endpoints.
