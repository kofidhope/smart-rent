# Architectural Decisions

## Decision: Microservices Architecture
**Description**: Smart-Rent implements a domain-decomposed microservices architecture where each business capability is a separate service with its own database.

**Evidence from Repository**:
- Six distinct services: auth-service, user-service, property-service, booking-service, payment-service, notification-service
- Each service has its own `pom.xml`, `src/main` structure, and database configuration
- Services communicate via REST (Feign) and asynchronous events (Kafka)
- docker-compose.yml shows separate containers for each service
- README.md Architecture Overview section explicitly describes domain-decomposed microservices pattern

**Consequences**:
- Services can be developed, deployed, and scaled independently
- Technology heterogeneity possible (though all currently use Java/Spring)
- Increased operational complexity (monitoring, debugging, deployment)
- Network latency and failure modes introduced
- Data consistency requires event-driven patterns or sagas

## Decision: JWT Authentication with httpOnly Cookies
**Description**: Authentication uses JWT tokens stored in httpOnly cookies, with validation performed at the API gateway layer.

**Evidence from Repository**:
- CLAUDE.md: "Frontend stores httpOnly cookies only; JavaScript never reads tokens."
- CLAUDE.md: "Gateway's JwtAuthenticationFilter reads the access_token httpOnly cookie first"
- user-service/login endpoint sets cookies (visible in controllers)
- auth-service/refresh endpoint handles cookie-based token rotation
- services/api.js implements refresh queue for handling 401 responses
- No token storage in localStorage or sessionStorage observed in frontend code

**Consequences**:
- Reduced XSS vulnerability (tokens not accessible to JavaScript)
- CSRF protection required (implied by SameSite cookie attributes)
- Gateway becomes critical security chokepoint
- Token revocation requires server-side tracking (implemented via Redis)
- Mobile/native clients would need different approach

## Decision: Gateway-Secret Handshake for Service-to-Service Trust
**Description**: The API gateway validates JWT and injects trusted headers (X-User-Id, X-User-Role, X-User-Email, X-Internal-Secret) that services validate to establish trust.

**Evidence from Repository**:
- CLAUDE.md detailed explanation of trust model with gateway-secret handshake
- api-gateway/src/main/java/com/dhopecode/config/JwtAuthenticationFilter.java (implied)
- Each service has GatewayAuthFilter once-per-request filter
- FeignClientInterceptor propagates headers between services
- .env contains GATEWAY_INTERNAL_SECRET configuration
- README.md Cross-Cutting Patterns section documents this extensively

**Consequences**:
- Eliminates need for service-to-service authentication round-trips
- Centralizes authentication logic at gateway
- Creates single point of failure for trust validation
- Requires secure distribution of internal secret to all services
- Services must validate header on every request (performance overhead)

## Decision: Event-Driven Choreography via Kafka
**Description**: Cross-service communication happens through Kafka events for loose coupling and reliability.

**Evidence from Repository**:
- docker-compose.yml includes Kafka and Zookeeper services
- README.md shows Kafka topics in diagrams and tables
- Each service has Kafka configuration in application.yml
- booking-service publishes booking.confirmed, booking.cancelled, booking-completed-topic
- payment-service publishes payment.succeeded, payment.failed
- notification-service consumes multiple topics for sending notifications
- payment-service has reconciliation scheduler for stuck payments
- Manual acknowledgment mode configured (RECORD ack mode)

**Consequences**:
- Services remain loosely coupled (no direct dependencies)
- Eventual consistency model (temporary inconsistencies possible)
- Improved fault tolerance (services can process events when ready)
- Increased system complexity (event schema management, debugging)
- Requires idempotency handling (evident in code)
- Schema evolution challenges (no headers on JSON events noted)

## Decision: Database-per-Service Pattern
**Description**: Each microservice owns its own PostgreSQL database, preventing direct database access between services.

**Evidence from Repository**:
- .env shows separate DB_NAME variables for each service:
  - DB_NAME=user_service_db
  - P_DB_NAME=property_db
  - B_DB_NAME=booking_db
  - M_DB_NAME=payment_db
  - N_DB_NAME=notification_db
- Each service's application.yml references its specific database URL
- init-db/init.sql contains six CREATE DATABASE statements
- Services use Flyway (except user-service which uses Hibernate ddl-auto)
- CLAUDE.md Database section: "One PostgreSQL instance, six databases"

**Consequences**:
- Strong encapsulation and loose coupling
- Independent scaling and deployment of services
- Technology flexibility per service (though all use PostgreSQL)
- No ACID transactions across services
- Data consistency must be handled at application level (via events/sagas)
- Potential for data duplication when services need shared data

## Decision: Spring Cloud Gateway as API Edge
**Description**: Using Spring Cloud Gateway as the sole entrypoint for all client requests, handling cross-cutting concerns.

**Evidence from Repository**:
- api-gateway/ directory present in repository
- CLAUDE.md: "api-gateway/ Reactive edge (Spring Cloud Gateway)"
- README.md Infrastructure section shows gateway as entrypoint
- docker-compose.yml would include gateway service (implied)
- Routes are sourced from config-server's Git repo (not local application.yml)
- Gateway handles JWT validation, rate limiting, CORS, trust-header injection

**Consequences**:
- Centralized cross-cutting concerns (security, logging, monitoring)
- Single point of failure for ingress traffic
- Flexibility to route to different services based on paths/rules
- Potential bottleneck under high load
- Gateway-specific knowledge required for routing configuration

## Decision: React 19 SPA with Vite for Frontend
**Description**: Frontend built as a single-page application using React 19 with Vite build tool.

**Evidence from Repository**:
- smart-rent-frontend/package.json shows React 19 dependencies
- README.md Tech Stack section: "Framework: React 19.2 + Vite 8"
- frontend structure follows feature-based layout (pages/, components/, services/)
- Uses react-router-dom 7 (data router API)
- Build command: npm run dev (Vite)
- No TypeScript observed (JSX files only)

**Consequences**:
- Rich, interactive user experience
- Client-side routing and state management
- Build toolchain complexity (though Vite simplifies this)
- SEO challenges (mitigated by public pages being crawler-friendly)
- Initial load performance considerations
- Code splitting and lazy loading opportunities