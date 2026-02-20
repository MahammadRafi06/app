# ConnectK – Multi-Cloud AI Infrastructure Management Platform

ConnectK is a Kubernetes-native platform for managing AI inference deployments across GKE, AKS, and EKS with NVIDIA Dynamo, GitOps-driven operations, and enterprise-grade SSO.

## Architecture

```
connectk/
├── backend/              # FastAPI (Python) API server
│   ├── app/
│   │   ├── main.py       # FastAPI app entry point
│   │   ├── config.py     # Settings (env vars, feature flags)
│   │   ├── database.py   # SQLAlchemy async engine
│   │   ├── redis_client.py  # Redis session store
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── routers/      # FastAPI route handlers
│   │   │   ├── auth.py   # OIDC/PKCE auth endpoints
│   │   │   ├── clusters.py
│   │   │   ├── deployments.py
│   │   │   ├── models.py
│   │   │   ├── nodes.py
│   │   │   ├── admin.py
│   │   │   └── events.py  # SSE endpoint
│   │   ├── services/     # Business logic
│   │   │   ├── auth_service.py   # OIDC token exchange, session management
│   │   │   ├── gitops_service.py # Git commit / manifest generation
│   │   │   ├── cache_service.py  # KubeAPI cache with distributed locks
│   │   │   └── sse_service.py    # Real-time event broadcasting
│   │   ├── middleware/   # Auth, rate limiting
│   │   └── utils/        # Crypto, audit logging, response helpers
│   └── alembic/          # Database migrations
├── frontend/             # Next.js (TypeScript) UI
│   ├── app/              # Next.js App Router pages
│   │   ├── clusters/     # Cluster list + detail
│   │   ├── deployments/  # Deployment CRUD
│   │   ├── models/       # Model Registry CRUD
│   │   ├── nodes/        # Node inventory
│   │   ├── gpus/         # GPU inventory
│   │   ├── admin/        # Group permissions + admin
│   │   └── profile/      # User profile + sessions
│   ├── components/       # Reusable UI components
│   │   ├── layout/       # Sidebar, Header
│   │   ├── ui/           # KPI cards, DataTable, StatusBadge, Toast
│   │   ├── clusters/     # Cluster registration form
│   │   ├── deployments/  # Deployment create/edit form
│   │   └── models/       # Model registration form
│   ├── hooks/            # useSSE (Server-Sent Events)
│   ├── lib/              # API client, query keys, utils
│   └── types/            # TypeScript interfaces
└── docker-compose.yml
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + TypeScript + TanStack Query |
| Backend | FastAPI (Python 3.12) + Pydantic v2 |
| Database | PostgreSQL 16 (SQLAlchemy + Alembic) |
| Session Store | Redis 7 |
| Auth | Azure Entra ID (OAuth 2.0 + OIDC + PKCE) |
| GitOps | ArgoCD / FluxCD (via Git commits) |
| Real-time | Server-Sent Events (SSE) |
| Styling | Tailwind CSS |

## Quick Start (Docker Compose)

### Prerequisites
- Docker & Docker Compose
- Azure Entra ID app registration (for OIDC)

### 1. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Azure Entra ID credentials and secrets
```

Generate secure keys:
```bash
openssl rand -hex 32  # for SESSION_SECRET_KEY
openssl rand -hex 32  # for CSRF_SECRET_KEY
```

### 2. Start All Services

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **FastAPI backend** on port 8000 (auto-runs Alembic migrations)
- **Next.js frontend** on port 3000

### 3. Access the Application

- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/api/docs
- **ReDoc:** http://localhost:8000/api/redoc

## Local Development (without Docker)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp ../.env.example .env

# Run migrations
DATABASE_SYNC_URL=postgresql://connectk:connectk@localhost:5432/connectk \
  alembic upgrade head

# Start dev server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set environment variable
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start dev server
npm run dev
```

## Azure Entra ID Setup

1. Register an application in Azure Entra ID
2. Set the redirect URI to: `http://localhost:8000/api/auth/callback`
3. Add API permissions: `openid`, `profile`, `email`, `offline_access`
4. Create security groups for Admin, Manager, and Developer roles
5. Set `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` in `.env`
6. Set `INITIAL_ADMIN_ENTRA_GROUP_ID` to the Admin group's object ID

## API Endpoints

All endpoints are documented at `/api/docs` (Swagger UI).

| Category | Base Path |
|----------|-----------|
| Auth | `/api/auth/` |
| Clusters | `/api/clusters/` |
| Deployments | `/api/deployments/` |
| Models | `/api/models/` |
| Nodes | `/api/nodes` |
| GPUs | `/api/gpus` |
| Admin | `/api/admin/` |
| Audit | `/api/audit/` |
| SSE | `/api/events/stream` |

## Key Design Decisions

### Read Path
`Frontend → FastAPI → PostgreSQL cache (TTL: 300s) → KubeAPI`

### Write Path
`Frontend → FastAPI → Git commit → ArgoCD/FluxCD → KubeAPI`

### Auth Flow
`Browser → Azure Entra ID (PKCE) → Authorization Code → FastAPI → Redis session → HTTP-only cookie`

## Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

## Environment Variables

See `.env.example` for all configuration options with descriptions.

## Security Features

- OIDC Authorization Code + PKCE (no client secret in browser)
- HTTP-only, Secure, SameSite session cookies
- Server-side sessions in Redis (no JWT on client)
- CSRF protection via double-submit cookie pattern
- Tokens encrypted at rest with AES-256-GCM
- Rate limiting per user (200 req/min general, 30 req/min writes)
- RBAC at page and action level mapped to Entra ID groups
- Audit logs (append-only, configurable retention)

## License

Internal – Confidential. See `ConnectK_PRD_v2.docx.md` for full product requirements.
