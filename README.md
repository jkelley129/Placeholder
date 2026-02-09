# DataPulse — AI-Powered Business Analytics Platform

> Track KPIs, visualize data trends, and get AI-powered insights. DataPulse helps companies make data-driven decisions in minutes, not months.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and **npm**

### Development Setup

```bash
# 1. Install backend dependencies
cd backend && npm install

# 2. Start the API server
npm start
# Server runs at http://localhost:3001

# 3. In a new terminal, install frontend dependencies
cd frontend && npm install

# 4. Start the frontend dev server
npm run dev
# App runs at http://localhost:5173
```

### Production Deployment (Docker)

```bash
# Build and run with Docker Compose
docker compose up -d

# App available at http://localhost:3000
```

## 📋 Features

- **📊 Real-Time Dashboards** — Create and customize dashboards with drag-and-drop widgets
- **🤖 AI-Powered Insights** — Automatic anomaly detection, trend analysis, and recommendations
- **⚡ Event Analytics** — Ingest and query millions of events with sub-second performance
- **🔗 Data Source Connectors** — PostgreSQL, MySQL, CSV, REST API, webhooks, JavaScript SDK
- **🔒 Secure by Default** — JWT authentication, bcrypt password hashing, rate limiting, CORS
- **📱 Responsive Design** — Works on desktop, tablet, and mobile

## 🏗️ Architecture

```
Frontend (React + Vite)  →  REST API (Express.js)  →  SQLite/PostgreSQL
     ↓                           ↓
  Recharts                 JWT Auth + RBAC
  React Context            Rate Limiting
                           Input Validation
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed system architecture.

## 📖 API Documentation

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create a new account |
| `/api/auth/login` | POST | Sign in and receive JWT |
| `/api/auth/me` | GET | Get current user profile |

### Dashboards
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboards` | GET | List all dashboards |
| `/api/dashboards` | POST | Create a new dashboard |
| `/api/dashboards/:id` | GET | Get dashboard with widgets |
| `/api/dashboards/:id` | PUT | Update a dashboard |
| `/api/dashboards/:id` | DELETE | Delete a dashboard |

### Analytics
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/events` | POST | Ingest events (batch up to 1000) |
| `/api/analytics/query` | GET | Query analytics data |
| `/api/analytics/insights` | GET | Get AI-powered insights |

### Data Sources
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/datasources` | GET | List connected sources |
| `/api/datasources` | POST | Add a new data source |
| `/api/datasources/:id` | DELETE | Remove a data source |

### Example: Send Events

```bash
curl -X POST http://localhost:3001/api/analytics/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "name": "page_view",
        "properties": { "page": "/home", "referrer": "google.com" }
      }
    ]
  }'
```

## 🧪 Testing

```bash
cd backend
npm test
```

22 integration tests covering all API endpoints including authentication, dashboards, analytics, data sources, and error handling.

## 💰 Business Model

| Plan | Price | Events/mo |
|------|-------|-----------|
| Starter | $49/mo | 100K |
| Growth | $199/mo | 1M |
| Business | $499/mo | 10M |
| Enterprise | Custom | Unlimited |

See [docs/MARKET_RESEARCH.md](docs/MARKET_RESEARCH.md) for full market analysis and revenue projections.

## 🛡️ Security

- JWT tokens with 24h expiry
- bcrypt password hashing (12 rounds)
- API rate limiting (100 req/15min)
- Input validation on all endpoints
- Parameterized SQL queries (injection prevention)
- Helmet.js security headers
- CORS configuration

## 📂 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── index.js              # Express app entry point
│   │   ├── models/database.js    # SQLite schema & connection
│   │   ├── middleware/           # Auth & validation middleware
│   │   └── routes/              # API route handlers
│   ├── tests/                   # Jest integration tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Root component & routing
│   │   ├── pages/               # Landing, Auth, Dashboard pages
│   │   ├── hooks/               # Auth context & hooks
│   │   ├── services/            # API client
│   │   └── styles/              # Global CSS
│   └── package.json
├── docs/
│   ├── MARKET_RESEARCH.md       # Market analysis & revenue model
│   └── ARCHITECTURE.md          # System architecture & design
├── deploy/
│   └── nginx.conf               # Production Nginx config
├── Dockerfile                   # Multi-stage production build
├── docker-compose.yml           # One-command deployment
└── README.md
```

## License

MIT
