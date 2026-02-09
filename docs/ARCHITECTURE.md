# DataPulse - System Architecture

## Overview

DataPulse follows a modern microservices-ready architecture with a clear separation between frontend and backend services. The initial deployment uses a monolithic backend that can be decomposed as the system scales.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CDN / Load Balancer                   │
│                    (CloudFlare / Nginx)                   │
└──────────────┬──────────────────────┬────────────────────┘
               │                      │
    ┌──────────▼──────────┐  ┌───────▼─────────────┐
    │   Frontend (React)   │  │   Backend (Node.js)  │
    │   - SPA Dashboard    │  │   - REST API         │
    │   - Auth UI          │  │   - WebSocket        │
    │   - Visualizations   │  │   - Auth Service     │
    │   - Settings         │  │   - Analytics Engine │
    └─────────────────────┘  │   - AI Service       │
                              └───────┬──────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                   │
             ┌──────▼──────┐  ┌──────▼──────┐  ┌───────▼───────┐
             │  PostgreSQL  │  │    Redis     │  │  Object Store  │
             │  (Primary DB)│  │  (Cache/     │  │  (S3/MinIO)    │
             │              │  │   Queues)    │  │                │
             └─────────────┘  └─────────────┘  └───────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18 with functional components and hooks
- **Build Tool**: Vite for fast development and optimized builds
- **State Management**: React Context + useReducer
- **Charting**: Recharts for data visualization
- **Styling**: CSS Modules
- **HTTP Client**: Fetch API with custom wrapper

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: better-sqlite3 (dev) / Knex.js (production)
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: express-validator
- **Testing**: Jest + Supertest

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions
- **Monitoring**: Built-in health checks and metrics

## API Design

### RESTful Endpoints

```
Authentication:
  POST   /api/auth/register     - Register new account
  POST   /api/auth/login        - Login and receive JWT
  GET    /api/auth/me           - Get current user profile

Dashboards:
  GET    /api/dashboards        - List user's dashboards
  POST   /api/dashboards        - Create new dashboard
  GET    /api/dashboards/:id    - Get dashboard details
  PUT    /api/dashboards/:id    - Update dashboard
  DELETE /api/dashboards/:id    - Delete dashboard

Widgets:
  GET    /api/dashboards/:id/widgets     - List widgets
  POST   /api/dashboards/:id/widgets     - Create widget
  PUT    /api/widgets/:id                - Update widget
  DELETE /api/widgets/:id                - Delete widget

Analytics:
  POST   /api/analytics/events   - Ingest analytics events
  GET    /api/analytics/query    - Query analytics data
  GET    /api/analytics/insights - Get AI-powered insights

Data Sources:
  GET    /api/datasources        - List connected sources
  POST   /api/datasources        - Add new data source
  DELETE /api/datasources/:id    - Remove data source
```

### Authentication Flow

```
1. User registers with email/password
2. Password is hashed with bcrypt (12 rounds)
3. JWT token issued with 24h expiry
4. Token included in Authorization header for subsequent requests
5. Refresh token rotation for extended sessions
```

## Database Schema

### Core Tables

```sql
-- Users and authentication
users (id, email, name, password_hash, company, role, created_at)

-- Multi-tenant organizations
organizations (id, name, plan, stripe_customer_id, created_at)

-- User-organization membership
org_members (user_id, org_id, role, joined_at)

-- Dashboard definitions
dashboards (id, org_id, name, description, layout, created_by, created_at)

-- Widget configurations
widgets (id, dashboard_id, type, title, config, position, size, created_at)

-- Analytics events
events (id, org_id, name, properties, user_id, timestamp, session_id)

-- Data source connections
datasources (id, org_id, type, name, config, status, created_at)
```

## Security Considerations

1. **Authentication**: JWT with short expiry + refresh tokens
2. **Authorization**: Role-based access control (RBAC)
3. **Data Isolation**: Multi-tenant with org-level data isolation
4. **Input Validation**: All inputs validated and sanitized
5. **Rate Limiting**: API rate limiting per user/organization
6. **CORS**: Strict CORS policy for API access
7. **Encryption**: bcrypt for passwords, TLS for data in transit
8. **SQL Injection**: Parameterized queries via ORM
9. **XSS Prevention**: Content Security Policy headers

## Scalability Path

### Phase 1 (Current - MVP)
- Monolithic Node.js backend
- SQLite database
- Single server deployment

### Phase 2 (1K-10K users)
- Migrate to PostgreSQL
- Add Redis for caching and session management
- Horizontal scaling with load balancer
- CDN for static assets

### Phase 3 (10K-100K users)
- Decompose into microservices
- Event-driven architecture with message queues
- Kubernetes orchestration
- Data warehouse for analytics (ClickHouse/TimescaleDB)

### Phase 4 (100K+ users)
- Multi-region deployment
- Edge computing for real-time analytics
- ML pipeline for advanced insights
- Custom query engine for sub-second performance
