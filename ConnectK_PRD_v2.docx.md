

**PRODUCT REQUIREMENTS DOCUMENT**

**ConnectK**

Multi-Cloud AI Infrastructure Management Platform

Unified Kubernetes-native platform for managing AI inference deployments across GKE, AKS, and EKS with NVIDIA Dynamo, GitOps, and enterprise-grade SSO.

| Document Version | 2.0 |
| :---- | :---- |
| **Status** | Draft – Development Ready |
| **Author** | Mahammad Rafi Shaik |
| **Reviewers** | Principal Architect, Engineering Lead, Security Lead |
| **Created** | February 2026 |
| **Last Updated** | February 18, 2026 |
| **Classification** | Internal – Confidential |

**Table of Contents**

# **1\. Executive Summary**

ConnectK is a next-generation, Kubernetes-native platform that enables enterprises to centrally manage AI inference deployments across multiple cloud providers (Google Cloud GKE, Azure AKS, and AWS EKS) from a single unified interface. The platform provides end-to-end lifecycle management for AI model deployments powered by NVIDIA Dynamo Inference Server, with GitOps-driven operations via FluxCD and ArgoCD.

The platform adopts a read-only KubeAPI access pattern for observability and a write-through-GitOps pattern for all mutations, ensuring auditability, consistency, and compliance with enterprise change management processes. Authentication is handled through Azure Entra ID (formerly Azure AD) using OAuth 2.0 / OIDC with PKCE, enabling seamless SSO for enterprise users.

## **1.1 Key Value Propositions**

* Multi-Cloud Visibility: Unified view across GKE, AKS, and EKS clusters with role-based access filtering.

* AI-First Design: Purpose-built for AI/ML inference workload management with NVIDIA Dynamo as the inference runtime.

* GitOps-Native Mutations: All write operations flow through ArgoCD or FluxCD, providing full audit trails and rollback capabilities.

* Enterprise SSO: Seamless authentication via Azure Entra ID with OIDC Authorization Code \+ PKCE grant type.

* Intelligent Caching: PostgreSQL-backed cluster metadata caching (configurable TTL, default 300s) to prevent KubeAPI rate limiting.

* Granular RBAC: Page-level and action-level access control mapped to enterprise AD groups.

# **2\. Product Overview**

## **2.1 Technology Stack**

| Layer | Technology | Notes |
| :---- | :---- | :---- |
| Frontend | Next.js \+ TypeScript | Server-side rendering, TanStack Query for data fetching and caching |
| API Layer | FastAPI (Python) | Async endpoints, OpenAPI auto-docs, Pydantic validation |
| State Management | TanStack Query | Server state caching, optimistic updates, background refetch |
| Identity Provider | Azure Entra ID | OAuth 2.0 \+ OIDC, Authorization Code \+ PKCE |
| Database | PostgreSQL | Cluster metadata cache, user preferences, audit logs |
| Session Store | Redis | Server-side session storage, token caching, rate limit counters |
| Inference Runtime | NVIDIA Dynamo | Supports sglang, vLLM, TensorRT-LLM backends |
| GitOps | ArgoCD / FluxCD | Write path for all cluster mutations (deployments, config) |
| DB Migrations | Alembic | Version-controlled schema migrations with rollback support |
| Container Orchestration | Kubernetes (GKE/AKS/EKS) | Application runs as K8s workload on any supported provider |
| Cluster Access | KubeAPI (read-only) | Service accounts with read-only ClusterRole bindings |
| Real-time Updates | Server-Sent Events (SSE) | Live deployment status and cluster health updates |

## **2.2 Deployment Architecture**

ConnectK is packaged as a Kubernetes application and can be deployed on any of the supported cloud providers (GKE, AKS, or EKS). The deployment includes the FastAPI backend, Next.js frontend, PostgreSQL database, Redis for session/cache management, and supporting services. The application communicates with managed clusters via KubeAPI servers using provider-specific authentication mechanisms.

## **2.3 Access Patterns**

**Read Path:** Application → KubeAPI Server (read-only service account) → Cluster resources. Cached in PostgreSQL with configurable TTL (default 300 seconds).

**Write Path:** Application → Git Repository (commit) → ArgoCD/FluxCD → KubeAPI Server → Cluster resources. Provides full audit trail via Git history.

**User Access:** Azure Entra ID → OIDC tokens → FastAPI session → RBAC enforcement at page and action level.

**Real-time Path:** KubeAPI Watch → Backend Event Processor → SSE Channel → Frontend TanStack Query Invalidation.

# **3\. Environment & Configuration Management**

ConnectK supports three standard deployment environments with environment-specific configuration managed through Kubernetes ConfigMaps, Secrets, and a hierarchical configuration strategy.

## **3.1 Environments**

| Environment | Purpose | Data | Deployment Trigger |
| :---- | :---- | :---- | :---- |
| Development | Local and shared dev testing | Seeded mock data; local PostgreSQL/Redis | Push to feature branch |
| Staging | Pre-production validation, QA | Anonymized copy of production data | Merge to develop branch |
| Production | Live customer-facing | Real cluster connections, production data | Tagged release from main branch |

## **3.2 Configuration Hierarchy**

Configuration is resolved in the following order of precedence (highest to lowest): environment variables, Kubernetes Secrets, Kubernetes ConfigMaps, application defaults in code.

## **3.3 Required Environment Variables**

| Variable | Required | Secret | Description |
| :---- | :---- | :---- | :---- |
| ConnectK\_ENV | Yes | No | Environment identifier: development, staging, production |
| DATABASE\_URL | Yes | Yes | PostgreSQL connection string (e.g., postgresql://user:pass@host:5432/ConnectK) |
| REDIS\_URL | Yes | Yes | Redis connection string for session store |
| AZURE\_TENANT\_ID | Yes | No | Azure Entra ID tenant identifier |
| AZURE\_CLIENT\_ID | Yes | No | OAuth 2.0 application (client) ID registered in Entra |
| AZURE\_CLIENT\_SECRET | Yes | Yes | OAuth 2.0 client secret (backend confidential client) |
| OIDC\_REDIRECT\_URI | Yes | No | Callback URL (e.g., https://ConnectK.example.com/api/auth/callback) |
| SESSION\_SECRET\_KEY | Yes | Yes | Cryptographic key for session signing (min 256-bit) |
| CSRF\_SECRET\_KEY | Yes | Yes | Cryptographic key for CSRF token generation |
| GIT\_SSH\_PRIVATE\_KEY | Yes | Yes | SSH key for GitOps repository commits (base64 encoded) |
| GIT\_REPO\_BASE\_URL | Yes | No | Base URL for GitOps repositories |
| ALLOWED\_ORIGINS | Yes | No | Comma-separated list of allowed CORS origins |
| SESSION\_TIMEOUT\_MINUTES | No | No | Idle session timeout (default: 30\) |
| SESSION\_MAX\_AGE\_HOURS | No | No | Absolute session lifetime (default: 8\) |
| CACHE\_DEFAULT\_TTL\_SECONDS | No | No | Default cluster cache TTL (default: 300\) |
| LOG\_LEVEL | No | No | Logging level: DEBUG, INFO, WARNING, ERROR (default: INFO) |
| AUDIT\_RETENTION\_DAYS | No | No | Audit log retention period (default: 90\) |
| SSE\_HEARTBEAT\_SECONDS | No | No | SSE keep-alive heartbeat interval (default: 15\) |
| KUBEAPI\_TIMEOUT\_SECONDS | No | No | KubeAPI request timeout (default: 10\) |
| MAX\_CONCURRENT\_SESSIONS | No | No | Max active sessions per user (default: 5, 0 \= unlimited) |

## **3.4 Secrets Management**

* Kubernetes Secrets: All variables marked as “Secret” above must be stored in Kubernetes Secrets objects, not ConfigMaps.

* External Secrets Operator (recommended): For production, use the External Secrets Operator to sync secrets from HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, or Google Secret Manager into Kubernetes Secrets.

* Rotation: All secrets must support rotation without application restart. The backend reloads secrets on a configurable interval (default: 5 minutes) or via SIGHUP signal.

* No Secrets in Code: Secrets must never appear in source code, Git history, container images, environment variable defaults, or log output.

## **3.5 Feature Flags**

Feature flags are stored in a ConfigMap and evaluated at runtime. They control the rollout of new features without redeployment.

| Flag | Type | Default | Description |
| :---- | :---- | :---- | :---- |
| ENABLE\_SSE\_LIVE\_UPDATES | Boolean | true | Enable/disable real-time SSE status updates |
| ENABLE\_COST\_ESTIMATION | Boolean | false | Enable cost projection features (requires billing API) |
| ENABLE\_CUSTOM\_GROUPS | Boolean | false | Allow Admins to create custom permission groups beyond the default three |
| MAX\_CLUSTERS\_PER\_USER | Integer | 50 | Maximum clusters a user can have associated |
| GITOPS\_DRY\_RUN | Boolean | false | Stage GitOps commits without pushing (for testing) |

# **4\. Authentication & Authorization**

## **4.1 Authentication Flow (Azure Entra ID \+ OIDC)**

The platform uses Azure Entra ID as the Identity Provider (IdP) implementing OAuth 2.0 with OpenID Connect (OIDC). The Authorization Code \+ PKCE grant type is used to ensure security for the browser-based SPA flow without requiring a client secret on the frontend.

### **4.1.1 Login Flow**

1. User navigates to the ConnectK application URL.

2. The application checks for an existing valid session cookie. If present and not expired, the user is authenticated immediately (SSO).

3. If no valid session exists, the frontend initiates the OIDC Authorization Code \+ PKCE flow by generating a code\_verifier and code\_challenge.

4. The user is redirected to the Azure Entra ID authorization endpoint. If the user is on an enterprise-managed device with an active Entra session, SSO completes without prompting for credentials.

5. Azure Entra ID authenticates the user and returns an authorization code to the configured redirect URI.

6. The FastAPI backend exchanges the authorization code (along with the code\_verifier) at the Entra token endpoint for: an access\_token (for API authorization), an id\_token (containing user identity claims such as name, email, groups, and roles), and a refresh\_token (for silent token renewal).

7. The backend creates a server-side session in Redis, stores tokens securely, and sets HTTP-only, Secure, SameSite session cookies.

8. The user is redirected to the Clusters page (default landing page) with their identity and group memberships resolved.

### **4.1.2 Token Management**

| Token | Purpose | Handling |
| :---- | :---- | :---- |
| Authorization Code | One-time code exchanged for tokens | Received via redirect URI; exchanged server-side with PKCE verifier |
| Access Token | Authorize API requests to backend | Stored server-side in Redis session; attached to downstream API calls; short-lived (typically 1 hr) |
| ID Token | User identity and claims (name, email, groups) | Parsed server-side to extract user profile and group memberships for RBAC |
| Refresh Token | Renew expired access tokens silently | Stored server-side in Redis; used to obtain new access/ID tokens without re-authentication |
| Session Cookie | Maintain authenticated session | HTTP-only, Secure, SameSite=Lax; ties browser to server-side session in Redis |
| CSRF Token | Prevent cross-site request forgery | Double-submit cookie pattern; validated on all state-changing requests (POST/PUT/DELETE) |

### **4.1.3 Session Management**

* Server-side session store: Redis, keyed by a cryptographically random session ID (256-bit minimum).

* Session cookie attributes: HttpOnly, Secure, SameSite=Lax, Path=/, Domain restricted to application domain.

* Absolute session lifetime: Configurable, default 8 hours. After this, re-authentication is required regardless of activity.

* Idle session timeout: Configurable, default 30 minutes of inactivity. Each API request resets the idle timer.

* Automatic token refresh: When the access token is within 5 minutes of expiry, the backend uses the refresh token to obtain new tokens transparently. If the refresh token itself has expired, the user is redirected to re-authenticate.

* Concurrent session control: Configurable limit (default 5). When exceeded, the oldest session is invalidated. Admin can force-logout any session.

* Session data stored in Redis: session\_id, user\_id, access\_token (encrypted), refresh\_token (encrypted), id\_token\_claims, created\_at, last\_activity\_at, ip\_address, user\_agent.

### **4.1.4 CORS Configuration**

* Allowed origins: Restricted to the ConnectK application domain(s) defined in ALLOWED\_ORIGINS environment variable. No wildcard origins in production.

* Allowed methods: GET, POST, PUT, DELETE, OPTIONS.

* Credentials: Access-Control-Allow-Credentials set to true for cookie-based authentication.

* Headers: Authorization, Content-Type, X-CSRF-Token explicitly allowed.

* Max-Age: Preflight cache set to 3600 seconds.

### **4.1.5 Logout Flow**

1. User initiates logout from the application.

2. The backend invalidates the server-side session in Redis and clears all session/CSRF cookies.

3. The backend revokes the refresh token with Azure Entra ID.

4. The user is redirected to the Azure Entra ID logout endpoint (end\_session\_endpoint) with post\_logout\_redirect\_uri for single sign-out.

5. After Entra sign-out completes, the user is redirected to the ConnectK login page.

## **4.2 Authorization (RBAC)**

Authorization operates at two levels: application-level RBAC (managed by ConnectK) and cluster-level RBAC (managed by Kubernetes). Both share the same Azure Entra ID groups as the source of truth.

### **4.2.1 Application-Level RBAC**

The application defines three default user group tiers mapped from Entra ID security groups. Each group has configurable page-level and action-level permissions managed through the Admin page.

| Group | Default Permissions | Description |
| :---- | :---- | :---- |
| Admin | Full access to all pages and actions | Can manage user group permissions via the Admin page, add/remove clusters, manage all deployments and models |
| Manager | View, Create, Edit on most pages | Can create and edit deployments, add models, view all accessible clusters. Cannot modify group permissions or delete clusters. |
| Developer | View access, limited Create/Edit | Can view clusters, nodes, deployments. Can create/edit own deployments. View-only on Model Registry by default. |

### **4.2.2 Permission Matrix (Default, Admin-Configurable)**

| Page / Action | Admin | Manager | Developer | Custom | Notes |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Clusters – List/View | ✓ | ✓ | ✓ | Configurable | Filtered by Entra group → cluster mapping |
| Clusters – Add | ✓ | ✓ | ✗ | Configurable | Add existing cluster to platform |
| Clusters – Remove | ✓ | ✗ | ✗ | Configurable | Dissociate cluster from platform |
| Deployments – List/View | ✓ | ✓ | ✓ | Configurable | Scoped to accessible clusters |
| Deployments – Create | ✓ | ✓ | ✓ | Configurable | On clusters user has deploy access |
| Deployments – Edit | ✓ | ✓ | Own only | Configurable | Edit own; Manager+ can edit all |
| Deployments – Delete | ✓ | ✓ | Own only | Configurable | Explicit permission or ownership required |
| Model Registry – View | ✓ | ✓ | ✓ | Configurable | All users have view access by default |
| Model Registry – Add | ✓ | ✓ | ✗ | Configurable | Add model to registry |
| Model Registry – Edit | ✓ | ✓ | ✗ | Configurable | Edit model metadata |
| Model Registry – Delete | ✓ | ✗ | ✗ | Configurable | Admin only by default |
| Nodes – View | ✓ | ✓ | ✓ | Configurable | Scoped to accessible clusters |
| GPUs – View | ✓ | ✓ | ✓ | Configurable | Scoped to accessible clusters |
| Admin Page | ✓ | ✗ | ✗ | N/A | Admin group only; not configurable |
| Audit Logs | ✓ | ✓ | Own only | Configurable | Admins see all; others see own actions |

### **4.2.3 Cluster-Level Authorization**

Cluster-level access is managed by the client organization through Kubernetes RBAC. The ConnectK application accesses each cluster’s KubeAPI server using a service account with read-only ClusterRole bindings. User-specific cluster visibility is determined by Entra ID group memberships mapped to cluster access lists maintained in the ConnectK database.

* A user sees only clusters where their Entra group(s) have been granted access in ConnectK.

* Within a cluster, the KubeAPI read-only service account retrieves all namespace-scoped resources; the application filters results based on user permissions.

* Write operations (deployments, edits, deletions) are submitted as Git commits to the cluster’s GitOps repository; ArgoCD/FluxCD reconciles the desired state.

### **4.2.4 Shared Responsibility Model**

Authentication and authorization are shared responsibilities between ConnectK and the client’s infrastructure team:

* Client Responsibility: Azure Entra ID configuration, group/scope definitions, Kubernetes RBAC policies, KubeAPI OIDC trust configuration, cluster-level service account provisioning.

* ConnectK Responsibility: OIDC integration, session management, application-level RBAC enforcement, page/action-level permission gating, audit logging, user-facing error messages for access denials.

The application must provide clear, actionable error messages when authorization failures occur, distinguishing between application-level and cluster-level access issues to guide users toward the correct remediation path.

# **5\. API Design**

## **5.1 FastAPI Backend Endpoints**

All endpoints require authenticated sessions unless marked Public. Responses follow a consistent JSON envelope with pagination support. Rate limiting is applied per-user.

### **5.1.1 Authentication Endpoints**

| Method | Endpoint | Auth | Description |
| :---- | :---- | :---- | :---- |
| GET | /api/auth/login | Public | Initiate OIDC Authorization Code \+ PKCE flow; redirect to Entra ID |
| GET | /api/auth/callback | Public | Handle Entra ID redirect; exchange code for tokens; create session |
| POST | /api/auth/refresh | Session | Refresh access token using stored refresh token |
| POST | /api/auth/logout | Session | Invalidate session, revoke refresh token, redirect to Entra logout |
| GET | /api/auth/me | Session | Return current user profile, groups, permissions, accessible clusters |
| GET | /api/events/stream | Session | SSE endpoint for real-time deployment status and cluster health updates |

### **5.1.2 Cluster Endpoints**

| Method | Endpoint | Auth | Description |
| :---- | :---- | :---- | :---- |
| GET | /api/clusters | Session \+ RBAC | List clusters accessible to current user with summary KPIs |
| GET | /api/clusters/{cluster\_id} | Session \+ RBAC | Get detailed cluster info: nodes, GPUs, deployed models, namespaces |
| POST | /api/clusters | Session \+ Admin/Manager | Register an existing cluster with ConnectK (name, provider, region, auth config) |
| POST | /api/clusters/{cluster\_id}/test | Session \+ Admin/Manager | Test KubeAPI connectivity for a cluster before registration |
| DELETE | /api/clusters/{cluster\_id} | Session \+ Admin | Dissociate a cluster from ConnectK (does not delete the cluster) |
| GET | /api/clusters/{cluster\_id}/nodes | Session \+ RBAC | List all nodes in a specific cluster |
| GET | /api/clusters/{cluster\_id}/gpus | Session \+ RBAC | List GPU resources in a specific cluster |
| GET | /api/clusters/{cluster\_id}/deployments | Session \+ RBAC | List AI deployments in a specific cluster |

### **5.1.3 Deployment Endpoints**

| Method | Endpoint | Auth | Description |
| :---- | :---- | :---- | :---- |
| GET | /api/deployments | Session \+ RBAC | List all deployments across accessible clusters with KPIs |
| GET | /api/deployments/{dep\_id} | Session \+ RBAC | Get deployment details: config, metrics, cost, runtime info |
| POST | /api/deployments | Session \+ RBAC | Create new deployment (commits to GitOps repo; returns status=creating) |
| PUT | /api/deployments/{dep\_id} | Session \+ RBAC | Edit deployment (non-editable fields enforced server-side) |
| DELETE | /api/deployments/{dep\_id} | Session \+ RBAC | Delete deployment (ownership or explicit permission required) |

### **5.1.4 Model Registry Endpoints**

| Method | Endpoint | Auth | Description |
| :---- | :---- | :---- | :---- |
| GET | /api/models | Session | List all registered models with metadata (view access for all users) |
| GET | /api/models/{model\_id} | Session | Get detailed model info: architecture, size, supported platforms |
| POST | /api/models | Session \+ Admin/Manager | Register a new model (validate source, store metadata) |
| PUT | /api/models/{model\_id} | Session \+ Admin/Manager | Edit model metadata (non-editable fields enforced) |
| DELETE | /api/models/{model\_id} | Session \+ Admin | Remove model from registry |

### **5.1.5 Node & GPU Endpoints**

| Method | Endpoint | Auth | Description |
| :---- | :---- | :---- | :---- |
| GET | /api/nodes | Session \+ RBAC | List all nodes across accessible clusters with hardware details |
| GET | /api/nodes/{node\_id} | Session \+ RBAC | Get detailed node info: hardware, CUDA, K8s config, GPU specs |
| GET | /api/gpus | Session \+ RBAC | List GPU resources across clusters (utilization, model, memory) |

### **5.1.6 Admin & Audit Endpoints**

| Method | Endpoint | Auth | Description |
| :---- | :---- | :---- | :---- |
| GET | /api/admin/groups | Session \+ Admin | List user groups with current permission configuration |
| PUT | /api/admin/groups/{group\_id} | Session \+ Admin | Update page/action permissions for a group |
| GET | /api/admin/sessions | Session \+ Admin | List active user sessions |
| DELETE | /api/admin/sessions/{session\_id} | Session \+ Admin | Force-logout a specific session |
| GET | /api/admin/health | Session \+ Admin | System health: KubeAPI connectivity, cache hit rates, API response times |
| GET | /api/audit/logs | Session \+ RBAC | Query audit trail (Admin: all; others: own actions) |
| GET | /api/audit/logs/{log\_id} | Session \+ RBAC | Get detailed audit log entry |
| GET | /api/audit/export | Session \+ Admin | Export audit logs as CSV or JSON for compliance |

## **5.2 API Response Envelope**

All API responses follow a consistent JSON structure to simplify frontend parsing and error handling.

### **5.2.1 Success Response (Single Resource)**

{ "status": "success", "data": { "id": "uuid", "name": "cluster-prod-1", ... }, "meta": { "request\_id": "uuid", "timestamp": "ISO8601" } }

### **5.2.2 Success Response (Collection / Paginated)**

{ "status": "success", "data": \[ { ... }, { ... } \], "pagination": { "page": 1, "page\_size": 25, "total\_items": 142, "total\_pages": 6, "has\_next": true, "has\_previous": false }, "meta": { "request\_id": "uuid", "timestamp": "ISO8601", "cache\_hit": true, "cache\_age\_seconds": 45 } }

### **5.2.3 Error Response**

{ "status": "error", "error": { "code": "CLUSTER\_UNREACHABLE", "message": "Unable to connect to cluster KubeAPI server.", "details": "Connection timed out after 10s. Verify cluster network is accessible and service account is configured.", "field": null }, "meta": { "request\_id": "uuid", "timestamp": "ISO8601" } }

## **5.3 API Request / Response Schemas (Key Endpoints)**

Below are representative Pydantic schema definitions for critical endpoints. Full OpenAPI schema is auto-generated by FastAPI.

### **5.3.1 POST /api/deployments – Create Deployment**

**Request Body:** { "name": "llama3-70b-prod", "cluster\_id": "uuid", "namespace": "ai-inference", "model\_id": "uuid", "backend": "vllm", "deployment\_type": "aggregated", "replicas": 2, "gpu\_per\_replica": 4, "quantization": "FP16", "kv\_cache\_gb": 32.0, "max\_batch\_size": 256, "runtime\_optimizations": \["continuous\_batching", "prefix\_caching"\] }

**Response (201 Created):** { "status": "success", "data": { "id": "uuid", "name": "llama3-70b-prod", "status": "creating", "gitops\_commit\_sha": "abc123...", "cluster\_id": "uuid", "created\_at": "ISO8601", "owner\_id": "uuid" } }

### **5.3.2 GET /api/clusters – List Clusters**

**Query Parameters:** page (int, default 1), page\_size (int, default 25), provider (enum, optional), region (string, optional), sort\_by (string, default “name”), sort\_order (asc|desc, default “asc”), search (string, optional).

**Response (200 OK):** { "status": "success", "data": \[ { "id": "uuid", "name": "gke-prod-us-east1", "provider": "GKE", "region": "us-east1", "k8s\_version": "1.29", "node\_count": 12, "gpu\_count": 48, "active\_models": 5, "utilization\_pct": 72.5, "status": "active" } \], "kpis": { "total\_clusters": 8, "total\_nodes": 96, "total\_gpus": 384, "avg\_utilization\_pct": 68.2, "active\_deployments": 34, "est\_monthly\_cost\_usd": 125000 }, "pagination": { ... } }

## **5.4 Data Caching Strategy**

To prevent overwhelming KubeAPI servers and hitting rate limits, cluster metadata is cached in PostgreSQL with a configurable Time-to-Live (TTL).

* Default TTL: 300 seconds (5 minutes). Configurable per cluster via the admin interface.

* Cache Scope: Cluster metadata, node lists, GPU details, namespace-scoped workloads.

* Cache Invalidation: Automatic on TTL expiry. Manual refresh available via a “Refresh” button on each page. Force-refresh on write operations (deployment create/edit/delete).

* Stale-While-Revalidate: TanStack Query on the frontend implements stale-while-revalidate to show cached data instantly while fetching fresh data in the background.

* Concurrent Cache Refresh Protection: A distributed lock (Redis SETNX with TTL) ensures only one backend instance refreshes the cache for a given cluster at a time. Other requests receive the stale cached data until the refresh completes.

* Cache Warming: On cluster registration and application startup, an initial cache population is triggered for all registered clusters.

## **5.5 Rate Limiting**

Rate limiting is enforced at the API gateway and application level to protect both the ConnectK backend and downstream KubeAPI servers.

| Scope | Limit | Window | Behavior on Exceed |
| :---- | :---- | :---- | :---- |
| Per-user, all endpoints | 200 requests | 1 minute | HTTP 429 with Retry-After header |
| Per-user, write endpoints (POST/PUT/DELETE) | 30 requests | 1 minute | HTTP 429 with Retry-After header |
| Per-user, SSE connections | 3 concurrent | N/A | Oldest connection closed |
| Per-cluster, KubeAPI fetch | 10 requests | 1 minute | Queued; served from cache if available |
| Per-user, auth endpoints | 10 requests | 5 minutes | HTTP 429; prevents brute force |
| Per-user, audit export | 5 requests | 1 hour | HTTP 429; prevents abuse of export |

# **6\. Page Specifications**

All pages follow a consistent layout: KPI cards at the top, a data table with pagination, filtering, and sorting below, and contextual action buttons above the table. The left sidebar provides navigation to all major sections: Clusters, Nodes, GPUs, Deployments, Model Registry, and Profile.

## **6.1 Clusters Page (/api/clusters)**

**Default Landing Page:** Users see this page immediately after login.

### **6.1.1 KPI Cards**

* Total Clusters, Total Nodes, Total GPUs, Overall Cluster Utilization (%), Active AI Deployments, Estimated Monthly Cost.

### **6.1.2 Table Columns**

* Cluster Name, Provider (GKE/AKS/EKS), Region, Kubernetes Version, Node Count, GPU Count, Active AI Models, Overall Utilization (%), Status.

### **6.1.3 Actions**

* Add Cluster (top of page): Opens the cluster registration form. User provides cluster name (must match the name on the cloud provider portal), provider, region, and provider-specific authentication configuration (e.g., EKS uses OIDC trust with Entra; GKE uses Workload Identity Federation). A “Test” button validates KubeAPI connectivity before enabling “Submit.”

* Click on Cluster Row: Navigates to the individual Cluster Detail Page (/api/clusters/{cluster\_id}).

* Select Cluster (checkbox): Reveals action bar with View, Dissociate (Admin only).

## **6.2 Cluster Detail Page (/api/clusters/{cluster\_id})**

### **6.2.1 Header Section**

* Cluster Name, Provider, Region, Kubernetes Version, Created At, Status, KubeAPI Connectivity Status, Last Cache Refresh timestamp.

### **6.2.2 Tabbed Content**

* Deployed Models (by Namespace): Table of AI model deployments grouped by namespace with name, model, replicas, status, GPU allocation.

* Nodes: Node list with hardware summary (CPU, GPU, Memory), status, and utilization.

* GPUs: GPU inventory with model, VRAM, utilization, assigned workloads, temperature, and power draw.

* Non-AI Workloads: System and infrastructure pods (monitoring, logging, networking) for context.

* Additional tabs as applicable: Events, Resource Quotas, Network Policies.

## **6.3 Deployments Page (/api/deployments)**

### **6.3.1 KPI Cards**

* Total Deployments, Total Models in Use, Top Used Model, Average Latency (ms), Average Throughput (tokens/sec), Estimated Total Cost.

### **6.3.2 Table Columns**

* Deployment Name, Model, Replicas, Cluster, Provider, Region, Status, Latency (p50/p95/p99), Throughput (tokens/sec), Created At, Owner.

### **6.3.3 Actions**

* Create New Deployment: Opens the deployment creation form.

* Select Row (checkbox): Reveals action bar with View, Edit, Delete (based on permissions and ownership).

## **6.4 Create New Deployment**

### **6.4.1 Form Fields**

| Field | Type | Required | Notes |
| :---- | :---- | :---- | :---- |
| Deployment Name | Text input | Yes | Unique within cluster; alphanumeric \+ hyphens; 3-63 chars |
| Provider | Dropdown | Yes | GKE, AKS, EKS (filtered by user access) |
| Cluster | Dropdown | Yes | Populated based on selected provider and user access |
| Namespace | Dropdown/Text | Yes | Existing or new namespace |
| Model | Searchable Dropdown | Yes | From Model Registry |
| Backend Framework | Dropdown | Yes | sglang, vLLM, TensorRT-LLM |
| Deployment Type | Dropdown | Yes | Aggregated, Aggregated with Route, Disaggregated with Route |
| Replicas | Number input | Yes | Min 1; validated against cluster capacity |
| GPU Count (per replica) | Number input | Yes | Based on model requirements |
| Quantization | Dropdown | No | FP16, INT8, INT4, None |
| Max Batch Size | Number input | No | Backend-specific default applied |
| KV Cache Size (GB) | Number input | No | Auto-calculated if not specified |
| Runtime Optimizations | Multi-select | No | Continuous batching, speculative decoding, prefix caching, etc. |

### **6.4.2 Behavior**

* On Submit: The application commits the deployment manifest to the GitOps repository. The user is redirected to the Deployments page with the new deployment shown at the top in “Creating” status. Status updates in real-time via SSE as ArgoCD/FluxCD reconciles.

* Validation: Client-side (immediate feedback) and server-side (authoritative). Cluster capacity checks performed before submission. Duplicate name check within cluster scope.

## **6.5 View Deployment (/api/deployments/{dep\_id})**

### **6.5.1 Detail Sections**

* Configuration: Name, Cluster, Region, Model, Backend Framework, Deployment Type, Replicas, Namespace, Quantization, GPU allocation, KV Cache, Memory requirements.

* Performance Metrics: Latency (p50, p95, p99), TTFT (Time to First Token), TPOT (Time Per Output Token), Throughput (tokens/sec), Requests per second, Queue depth.

* Cost Analysis: GPU-hours consumed, Estimated cost per 1M tokens (input/output), Daily/Monthly cost projection.

* Runtime Details: NVIDIA Dynamo Inference Server version, CUDA version, Container image, Git commit SHA (from GitOps), Last reconciled at.

### **6.5.2 Actions**

* Edit Deployment: Navigates to Edit Deployment page (pre-populated form).

* Delete Deployment: Confirmation dialog, then deletion via GitOps commit. Redirects to Deployments page.

## **6.6 Edit Deployment**

Uses the same form layout as Create New Deployment, pre-populated with current deployment values.

* Non-Editable Fields (grayed out): Deployment Name, Provider, Cluster, Namespace. To change these, the user must delete and recreate the deployment.

* Editable Fields: Replicas, Backend Framework, Quantization, Runtime Optimizations, Max Batch Size, KV Cache Size.

* On Submit: Updates the GitOps repository. User is redirected to the Deployments page with the deployment showing “Updating” status.

## **6.7 Delete Deployment**

* Triggered from the Deployments table (checkbox \+ action bar) or from the individual Deployment page.

* Permission Check: User must have explicit delete permission for the cluster, or must be the deployment owner.

* Confirmation Dialog: Displays deployment name, cluster, and model. Requires the user to type the deployment name for destructive confirmation.

* On Confirm: Removes the deployment manifest from the GitOps repository. ArgoCD/FluxCD reconciles the deletion. User is redirected to the Deployments page.

## **6.8 Model Registry (/api/models)**

### **6.8.1 KPI Cards**

* Total Models, Most Deployed Model, Model Sources (Hugging Face, S3, etc.), Average Model Size (GB).

### **6.8.2 Table Columns**

* Model Name, Custom Name (if any), Architecture (e.g., Transformer, MoE), Parameter Count, Size at FP32 (GB), Source (Hugging Face, S3, GCS, etc.), Supported Platforms (CUDA, ROCm), Supported Backends (sglang, vLLM, TensorRT-LLM), Active Deployments count.

### **6.8.3 Actions**

* Add Model: Opens the model registration form.

* Select Row (checkbox): Reveals action bar with View, Edit (Admin/Manager), Delete (Admin only).

## **6.9 Add Model**

### **6.9.1 Form Fields**

| Field | Type | Required | Notes |
| :---- | :---- | :---- | :---- |
| Model Name | Text input | Yes | Official model name (e.g., meta-llama/Llama-3-70B) |
| Custom Display Name | Text input | No | Internal alias for the model |
| Source Type | Dropdown | Yes | Hugging Face, S3, GCS, Azure Blob, Custom URL |
| Source URI | Text input | Yes | Full path/URI to model weights |
| Architecture | Dropdown | Yes | Transformer, MoE, Custom |
| Parameter Count | Number input | Yes | In billions (e.g., 70\) |
| Native Size FP32 (GB) | Number input | Yes | Size of model at full precision |
| Supported Platforms | Multi-select | Yes | CUDA, ROCm, CPU |
| Supported Backends | Multi-select | Yes | sglang, vLLM, TensorRT-LLM |
| Tokenizer Path | Text input | No | If different from model source |
| Description / Notes | Text area | No | Additional details about the model |

### **6.9.2 Behavior**

* On Submit: Validates source URI accessibility (HEAD request to verify endpoint is reachable), stores metadata in PostgreSQL, redirects to Model Registry with the new model displayed.

* Models added here become available in the Model dropdown during deployment creation.

## **6.10 View Model (/api/models/{model\_id})**

Displays all metadata captured during model registration plus any platform-populated details (e.g., auto-detected quantization support, max context length). Provides “Edit Model” and “Delete Model” action buttons based on user permissions.

## **6.11 Edit Model**

Same form as Add Model, pre-populated. Non-editable fields: Model Name, Source Type, Source URI (to change these, delete and re-add). On submit, the platform re-validates source accessibility and updates metadata. Redirects to Model Registry.

## **6.12 Delete Model**

* Permission: Admin only by default.

* Pre-check: If the model has active deployments, deletion is blocked with a message listing the dependent deployments.

* Confirmation dialog with model name. On confirm, the model is soft-deleted (marked inactive) from the registry and the user is redirected to the Model Registry page.

## **6.13 Nodes Page (/api/nodes)**

### **6.13.1 KPI Cards**

* Total Nodes, Total CPUs, Total GPUs, Average Utilization (%), Nodes with GPU, Estimated Hourly Cost.

### **6.13.2 Table Columns**

* Node Name, Cluster, Provider, OS, CPU Cores, GPU Count, GPU Model, Memory (GB), Utilization (%), Status, Cost/Hour.

### **6.13.3 Actions**

* Click on Node Row: Navigates to the Node Detail page.

## **6.14 Node Detail Page (/api/nodes/{node\_id})**

Comprehensive node information organized under the following sections:

* System: OS, Kernel version, Architecture, Hostname, Instance type.

* CPU: Cores, Model, Clock speed, NUMA topology, Hyper-threading status.

* Memory: Total, Allocatable, Huge Pages configuration, Swap status.

* GPU: Count, Model, VRAM, Driver version, CUDA version, GPU utilization, Temperature, Power draw.

* Kubernetes: Kubelet version, Containerd version, Pod CIDR, Node labels, Taints, Allocatable resources, Running pods.

* Network: Internal IP, External IP, CNI plugin, Bandwidth capacity.

## **6.15 GPUs Page (/api/gpus)**

### **6.15.1 KPI Cards**

* Total GPUs, GPU Models in Use, Average Utilization (%), Total VRAM (TB), GPUs Available, Estimated GPU Cost/Hour.

### **6.15.2 Table Columns**

* GPU ID, Node, Cluster, Provider, GPU Model, VRAM (GB), Utilization (%), Temperature, Power Draw (W), Assigned Workload, Status.

## **6.16 Profile Page**

Displays the current user’s profile information from Azure Entra ID (name, email, department, groups) and their ConnectK-specific settings: accessible clusters, role/group within ConnectK, recent activity feed, notification preferences, and active sessions list with the ability to revoke other sessions.

## **6.17 Admin Page**

### **6.17.1 Group Permission Grid**

Displays a matrix with user groups (Admin, Manager, Developer, and any custom groups) as rows and page/action combinations as columns. Each cell is a toggle (checkbox) to enable or disable that permission for the group. Changes are saved immediately and take effect on the user’s next API call (no session restart required).

### **6.17.2 Additional Admin Functions**

* View active user sessions and force-logout capability.

* Cluster-to-group mapping management.

* Audit log viewer with advanced filtering (user, action, resource, timestamp range).

* System health dashboard: KubeAPI connectivity status for all registered clusters, cache hit rates, API response times, error rates.

* Database migration status and version.

# **7\. Navigation & UX Requirements**

## **7.1 Sidebar Navigation**

* Persistent left sidebar visible on all pages.

* Menu items: Clusters (default), Nodes, GPUs, Deployments, Model Registry, Profile, Admin (visible only to Admin group).

* Active page is highlighted. Sidebar is collapsible on smaller screens.

## **7.2 Page Navigation Rules**

* Post-Submit Redirects: After creating a deployment → Deployments page (new item at top). After editing a deployment → Deployments page. After deleting a deployment → Deployments page. After adding a model → Model Registry. After editing a model → Model Registry. After deleting a model → Model Registry.

* Breadcrumbs: Displayed at the top of detail and form pages for context (e.g., Clusters \> cluster-prod-1 \> Nodes \> node-gpu-04).

* Back Navigation: Browser back button support via proper URL routing. No loss of filter/sort state on return.

* Deep Linking: All pages and detail views have unique, shareable URLs.

* Unsaved Changes Guard: If a user navigates away from a form with unsaved changes, a confirmation dialog is shown.

## **7.3 Table Behavior (All Pages)**

* Pagination: Server-side with configurable page size (10, 25, 50, 100). Maintains page state across navigation.

* Filtering: Column-level filters (text search, dropdowns for enums, range for numerics). Persisted in URL query parameters.

* Sorting: Click column headers to toggle ascending/descending. Server-side sort for performance.

* Selection: Checkbox on each row. Bulk actions appear in action bar when items are selected.

* Loading States: Skeleton loaders during data fetch. TanStack Query handles stale-while-revalidate for seamless experience.

* Empty States: Meaningful empty state messages with CTAs (e.g., “No clusters registered yet. Add your first cluster.”).

* Error States: Inline error banners with retry options. Never a blank page.

# **8\. Error Handling & Edge Cases**

This section defines the systematic error handling behavior across all layers of the application. Every error condition must produce a clear, actionable message for the user and a structured log entry for observability.

## **8.1 Error Taxonomy**

| Error Code | HTTP | User Message | Recovery Action |
| :---- | :---- | :---- | :---- |
| AUTH\_SESSION\_EXPIRED | 401 | Your session has expired. Please log in again. | Redirect to /api/auth/login |
| AUTH\_REFRESH\_FAILED | 401 | Unable to renew your session. Please log in again. | Clear session; redirect to login |
| AUTH\_INSUFFICIENT\_PERMISSION | 403 | You do not have permission to perform this action. | Show required permission; suggest contacting Admin |
| AUTH\_CSRF\_INVALID | 403 | Security validation failed. Please refresh and try again. | Refresh CSRF token; retry |
| CLUSTER\_UNREACHABLE | 502 | Unable to connect to cluster {name}. Showing cached data. | Show stale data with warning banner; offer retry |
| CLUSTER\_AUTH\_FAILED | 502 | Cluster authentication failed. Service account may need reconfiguration. | Log details; show Admin contact info |
| CLUSTER\_RATE\_LIMITED | 429 | Cluster API rate limit reached. Data will refresh shortly. | Serve cached data; queue retry after backoff |
| GITOPS\_COMMIT\_FAILED | 500 | Failed to save changes. Please try again. | Retry with exponential backoff (max 3 attempts) |
| GITOPS\_RECONCILE\_TIMEOUT | 202 | Deployment is taking longer than expected to apply. | Continue polling; show warning after 5 minutes |
| GITOPS\_RECONCILE\_FAILED | 200 | Deployment failed to apply. Check configuration. | Show ArgoCD/Flux error details; link to GitOps logs |
| MODEL\_SOURCE\_UNREACHABLE | 422 | Unable to validate model source URI. | Show which URI failed; suggest checking access |
| DEPLOYMENT\_CAPACITY\_EXCEEDED | 422 | Insufficient GPU capacity on selected cluster. | Show available capacity; suggest different cluster |
| DEPLOYMENT\_DUPLICATE\_NAME | 409 | A deployment with this name already exists in the cluster. | Suggest alternative name |
| RATE\_LIMIT\_EXCEEDED | 429 | Too many requests. Please wait and try again. | Show Retry-After countdown timer |
| DATABASE\_ERROR | 500 | An internal error occurred. Please try again. | Log full error; show generic message to user |
| VALIDATION\_ERROR | 422 | Please correct the highlighted fields. | Highlight invalid fields with per-field messages |

## **8.2 Degraded Mode Behavior**

When a cluster’s KubeAPI server becomes unreachable, the application enters a degraded mode for that cluster:

* Data Display: Cached data continues to be shown with a prominent warning banner indicating “Data may be stale – Last updated {timestamp}.” The cache\_age\_seconds field in the API response enables the frontend to display this.

* Write Operations: Deployment create/edit/delete operations against unreachable clusters are queued locally with a warning: “Cluster is currently unreachable. Your changes will be submitted when connectivity is restored.” Alternatively, if the GitOps repository is reachable, the commit proceeds and reconciliation will happen when the cluster recovers.

* Health Indicator: Each cluster card on the Clusters page shows a color-coded connectivity status (green \= active, yellow \= degraded/stale, red \= unreachable).

* Automatic Recovery: The backend retries KubeAPI connectivity every 30 seconds for unreachable clusters. When connectivity is restored, the cache is immediately refreshed and the status updates in real-time via SSE.

* Full Outage: If PostgreSQL or Redis is down, the application returns HTTP 503 with a maintenance page. Kubernetes liveness/readiness probes detect this and stop routing traffic to affected pods.

## **8.3 Concurrent Cache Refresh**

When multiple users trigger cache refreshes for the same cluster simultaneously:

* The first request acquires a Redis distributed lock (SETNX with 30-second TTL) and performs the KubeAPI fetch.

* Subsequent requests detect the lock and return the current cached data (even if stale) immediately.

* When the first request completes, it updates the cache and releases the lock.

* A background notification via Redis Pub/Sub informs connected SSE clients that fresh data is available, triggering TanStack Query invalidation on the frontend.

## **8.4 GitOps Failure Scenarios**

| Scenario | Behavior | User Communication |
| :---- | :---- | :---- |
| Git commit fails (network/auth) | Retry 3 times with exponential backoff (1s, 2s, 4s) | Show progress spinner with “Retrying...”; error after 3 failures |
| Git commit succeeds, reconciliation pending | Poll deployment status via KubeAPI every 5s | Show “Creating”/“Updating” status with elapsed time |
| Reconciliation exceeds 5 minutes | Continue polling; escalate to warning state | Show yellow warning: “Taking longer than expected. ArgoCD/Flux may need attention.” |
| Reconciliation fails (ArgoCD/Flux error) | Mark deployment as “failed” in local DB | Show error details from GitOps tool; link to ArgoCD/Flux UI if accessible |
| Merge conflict in Git repo | Abort commit; do not retry automatically | Show error: “Conflict detected in configuration repository. Please contact Admin.” |
| GitOps tool (ArgoCD/Flux) is down | Git commit proceeds; reconciliation is delayed | Show info: “Changes saved. Cluster sync is delayed. Will apply automatically when GitOps tool recovers.” |

# **9\. Deployment Status State Machine**

Each deployment has a well-defined status lifecycle. Transitions are triggered by GitOps reconciliation events observed via KubeAPI polling or SSE updates.

## **9.1 Status Definitions**

| Status | Description | Exit Conditions |
| :---- | :---- | :---- |
| creating | Git commit submitted; waiting for ArgoCD/Flux to reconcile | Pods scheduled → provisioning; Timeout (10 min) → failed; Git error → failed |
| provisioning | Pods are being scheduled and containers are starting | All replicas ready → running; Container crash → failed; Timeout (15 min) → failed |
| running | All replicas are healthy and serving traffic | Edit submitted → updating; Delete submitted → deleting; Health check fail → degraded |
| updating | Edit committed to Git; ArgoCD/Flux reconciling changes | All replicas healthy with new config → running; Timeout (10 min) → failed; Rollback → rolling\_back |
| degraded | Some replicas are unhealthy or performance is below threshold | All replicas recover → running; All replicas fail → failed; User deletes → deleting |
| failed | Deployment could not be created, updated, or has crashed | User edits → updating; User deletes → deleting; Manual fix → provisioning |
| deleting | Delete committed to Git; ArgoCD/Flux removing resources | All resources removed → deleted; Timeout (10 min) → delete\_failed |
| deleted | Terminal state. Deployment fully removed from cluster | N/A – record retained in DB for audit; hidden from default list views |
| delete\_failed | Deletion did not complete. Resources may still exist in cluster | Admin manual intervention; retry delete → deleting |
| rolling\_back | Reverting to previous Git commit after failed update | Rollback complete → running; Rollback fails → failed |

## **9.2 Timeout Configuration**

| Transition | Default Timeout | Configurable | On Timeout |
| :---- | :---- | :---- | :---- |
| creating → provisioning | 10 minutes | Yes (per cluster) | Mark as failed; log timeout event |
| provisioning → running | 15 minutes | Yes (per cluster) | Mark as failed; log unready pods |
| updating → running | 10 minutes | Yes (per cluster) | Mark as failed; option to rollback |
| deleting → deleted | 10 minutes | Yes (per cluster) | Mark as delete\_failed; alert Admin |
| rolling\_back → running | 10 minutes | No | Mark as failed; require manual intervention |

## **9.3 Retry Logic**

* GitOps commits: Retry up to 3 times with exponential backoff (1s, 2s, 4s). If all retries fail, mark operation as failed and notify the user.

* KubeAPI status polling: Retry indefinitely with 5-second intervals during active transitions. Fall back to 30-second intervals for stable states. Stop polling for terminal states (deleted, delete\_failed).

* Token refresh: Retry up to 2 times with 1-second delay. If all retries fail, invalidate the session and redirect to login.

# **10\. Real-Time Updates (Server-Sent Events)**

ConnectK uses Server-Sent Events (SSE) to push real-time status updates to connected clients, replacing the need for aggressive frontend polling.

## **10.1 SSE Architecture**

* Endpoint: GET /api/events/stream (authenticated, session-based).

* Backend: The FastAPI backend maintains a Kubernetes Watch on deployment-related resources (Pods, Deployments, ReplicaSets) for each registered cluster.

* Event Processing: Watch events are processed by a background task, matched to ConnectK deployments, and pushed to connected SSE clients filtered by user access permissions.

* Heartbeat: A keep-alive comment (:ping) is sent every 15 seconds (configurable) to prevent proxy/load balancer timeouts.

* Reconnection: The frontend uses EventSource with automatic reconnection. The Last-Event-ID header is used to resume from the last received event on reconnect.

## **10.2 Event Types**

| Event Type | Payload | Frontend Action |
| :---- | :---- | :---- |
| deployment.status\_changed | {dep\_id, old\_status, new\_status, timestamp} | Invalidate deployment query; update status badge in table |
| deployment.metrics\_updated | {dep\_id, latency\_p50, throughput, timestamp} | Update metrics display on deployment detail page |
| cluster.connectivity\_changed | {cluster\_id, status, timestamp} | Update cluster health indicator; show/hide stale data warning |
| cluster.cache\_refreshed | {cluster\_id, resource\_type, timestamp} | Invalidate relevant TanStack Query cache keys |
| node.status\_changed | {node\_id, cluster\_id, status, timestamp} | Update node status in tables |
| system.maintenance | {message, estimated\_duration} | Show maintenance banner |

## **10.3 Frontend Integration with TanStack Query**

* SSE events trigger targeted TanStack Query cache invalidation using queryClient.invalidateQueries() with specific query keys.

* This ensures the UI re-fetches only the affected data, not the entire page.

* Optimistic updates are used for user-initiated actions (create, edit, delete) to provide instant UI feedback while the SSE confirmation is in transit.

* If the SSE confirmation contradicts the optimistic update (e.g., the operation failed), the UI rolls back to the server state and shows an error notification.

# **11\. GitOps Repository Contract**

This section defines the Git repository structure and manifest format that ConnectK writes and that ArgoCD/FluxCD consumes. This contract is critical for the Principal Architect to understand the integration surface.

## **11.1 Repository Structure**

Each cluster has a dedicated directory in the GitOps repository. ConnectK operates within the ConnectK/ subdirectory only and does not modify any files outside this path.

gitops-repo/

  clusters/

    {cluster-name}/

      ConnectK/

        deployments/

          {namespace}/

            {deployment-name}.yaml

        kustomization.yaml

## **11.2 Manifest Template (Deployment)**

ConnectK generates Kubernetes manifests using a server-side templating engine. The template produces a namespace-scoped set of resources for each AI deployment.

Each deployment manifest includes: a Kubernetes Deployment resource (with NVIDIA Dynamo container spec, GPU resource requests/limits, environment variables for backend framework, quantization, and runtime optimizations), a Kubernetes Service for inference endpoint exposure, a ConfigMap for deployment-specific configuration, and ConnectK-specific annotations for tracking (ConnectK.io/deployment-id, ConnectK.io/owner, ConnectK.io/created-at, ConnectK.io/backend, ConnectK.io/model-id).

## **11.3 Commit Convention**

* Commit message format: \[ConnectK\] {action} {resource-type}/{resource-name} by {user-email}

* Example: \[ConnectK\] create deployment/llama3-70b-prod by user@company.com

* Each commit is atomic: one deployment action per commit. No multi-deployment batch commits.

* The commit author is set to the ConnectK service account. The user who initiated the action is recorded in the commit message and the ConnectK audit log.

## **11.4 Branch Strategy**

* Default: All commits go to the main branch directly (ArgoCD/FluxCD watches main).

* Optional (configurable per cluster): Commits go to a staging branch; a separate approval process (PR/MR) gates promotion to main. This is outside ConnectK’s scope but the branch name is configurable.

# **12\. Data Model (PostgreSQL)**

## **12.1 Core Entities**

### **12.1.1 clusters**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK, DEFAULT gen\_random\_uuid() | Unique cluster identifier |
| name | VARCHAR(255) | NOT NULL, UNIQUE | Cluster name (matches cloud provider name) |
| provider | ENUM | NOT NULL | GKE, AKS, EKS |
| region | VARCHAR(100) | NOT NULL | Cloud provider region |
| auth\_config | JSONB | NOT NULL | Provider-specific auth config (encrypted at application layer) |
| kubeapi\_endpoint | VARCHAR(500) | NOT NULL | KubeAPI server URL |
| k8s\_version | VARCHAR(20) |  | Kubernetes version |
| status | ENUM | NOT NULL, DEFAULT 'pending' | active, unreachable, pending |
| cache\_ttl\_seconds | INTEGER | DEFAULT 300 | Metadata cache TTL for this cluster |
| gitops\_tool | ENUM | NOT NULL | argocd, fluxcd |
| gitops\_repo\_url | VARCHAR(500) | NOT NULL | GitOps repository URL for this cluster |
| gitops\_branch | VARCHAR(100) | DEFAULT 'main' | Git branch for commits |
| added\_by | UUID | FK → users | User who registered this cluster |
| created\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Registration timestamp |
| updated\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

### **12.1.2 deployments**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK, DEFAULT gen\_random\_uuid() | Unique deployment identifier |
| name | VARCHAR(255) | NOT NULL | Deployment name |
| cluster\_id | UUID | FK → clusters ON DELETE RESTRICT | Target cluster |
| namespace | VARCHAR(255) | NOT NULL | K8s namespace |
| model\_id | UUID | FK → models ON DELETE RESTRICT | Deployed model |
| backend | ENUM | NOT NULL | sglang, vllm, trtllm |
| deployment\_type | ENUM | NOT NULL | aggregated, aggregated\_route, disaggregated\_route |
| replicas | INTEGER | NOT NULL, CHECK \> 0 | Replica count |
| gpu\_per\_replica | INTEGER | NOT NULL, CHECK \> 0 | GPUs allocated per replica |
| quantization | VARCHAR(20) |  | FP16, INT8, INT4, None |
| kv\_cache\_gb | DECIMAL(10,2) |  | KV cache size in GB |
| max\_batch\_size | INTEGER |  | Maximum batch size |
| runtime\_optimizations | JSONB | DEFAULT '\[\]' | Array of optimization flags |
| gitops\_commit\_sha | VARCHAR(64) |  | Latest Git commit SHA |
| status | ENUM | NOT NULL, DEFAULT 'creating' | creating, provisioning, running, updating, degraded, failed, deleting, deleted, delete\_failed, rolling\_back |
| status\_message | TEXT |  | Human-readable status detail or error message |
| status\_changed\_at | TIMESTAMPTZ |  | Timestamp of last status transition |
| owner\_id | UUID | FK → users NOT NULL | User who created the deployment |
| created\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |  |
| updated\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |  |
| deleted\_at | TIMESTAMPTZ |  | Soft delete timestamp (NULL if active) |

Unique constraint: (cluster\_id, namespace, name) WHERE deleted\_at IS NULL – ensures no duplicate active deployment names within a cluster/namespace.

### **12.1.3 models**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK, DEFAULT gen\_random\_uuid() | Unique model identifier |
| name | VARCHAR(255) | NOT NULL, UNIQUE | Official model name |
| custom\_name | VARCHAR(255) |  | User-assigned display name |
| source\_type | ENUM | NOT NULL | huggingface, s3, gcs, azure\_blob, custom |
| source\_uri | VARCHAR(1000) | NOT NULL | Full URI to model weights |
| architecture | VARCHAR(100) | NOT NULL | e.g., Transformer, MoE |
| param\_count\_b | DECIMAL(10,2) | NOT NULL | Parameter count in billions |
| size\_fp32\_gb | DECIMAL(10,2) | NOT NULL | Size at FP32 in GB |
| supported\_platforms | JSONB | NOT NULL | Array: cuda, rocm, cpu |
| supported\_backends | JSONB | NOT NULL | Array: sglang, vllm, trtllm |
| tokenizer\_path | VARCHAR(1000) |  |  |
| description | TEXT |  |  |
| is\_active | BOOLEAN | NOT NULL, DEFAULT true | Soft delete flag |
| added\_by | UUID | FK → users |  |
| created\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |  |
| updated\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |  |

### **12.1.4 audit\_logs**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK, DEFAULT gen\_random\_uuid() | Unique log entry identifier |
| user\_id | UUID | FK → users, NOT NULL | Acting user |
| action | ENUM | NOT NULL | create, read, update, delete, login, logout, permission\_change |
| resource\_type | VARCHAR(100) | NOT NULL | cluster, deployment, model, user\_session, group\_permission |
| resource\_id | UUID |  | ID of the affected resource |
| details | JSONB |  | Request payload, before/after state diff |
| ip\_address | INET |  | Client IP address |
| user\_agent | TEXT |  | Browser/client user agent string |
| created\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Timestamp of the action (immutable) |

Note: audit\_logs table has no UPDATE or DELETE permissions granted to the application role. Append-only by design.

### **12.1.5 cluster\_cache**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK, DEFAULT gen\_random\_uuid() | Cache entry identifier |
| cluster\_id | UUID | FK → clusters ON DELETE CASCADE | Associated cluster |
| resource\_type | VARCHAR(100) | NOT NULL | nodes, gpus, deployments, namespaces, pods |
| data | JSONB | NOT NULL | Cached KubeAPI response data |
| fetched\_at | TIMESTAMPTZ | NOT NULL | When the data was retrieved from KubeAPI |
| expires\_at | TIMESTAMPTZ | NOT NULL | fetched\_at \+ cluster.cache\_ttl\_seconds |

Unique constraint: (cluster\_id, resource\_type). Index on expires\_at for efficient cleanup.

### **12.1.6 group\_permissions**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK, DEFAULT gen\_random\_uuid() | Permission entry identifier |
| group\_name | VARCHAR(100) | NOT NULL | admin, manager, developer, or custom group |
| page | VARCHAR(100) | NOT NULL | clusters, deployments, models, nodes, gpus, admin, audit |
| action | VARCHAR(50) | NOT NULL | list, view, create, edit, delete |
| enabled | BOOLEAN | NOT NULL, DEFAULT false | Whether this permission is active |
| updated\_by | UUID | FK → users | Admin who last changed this permission |
| updated\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |  |

Unique constraint: (group\_name, page, action).

### **12.1.7 cluster\_user\_access**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK, DEFAULT gen\_random\_uuid() |  |
| cluster\_id | UUID | FK → clusters ON DELETE CASCADE |  |
| entra\_group\_id | VARCHAR(255) | NOT NULL | Azure Entra ID group object ID |
| entra\_group\_name | VARCHAR(255) | NOT NULL | Human-readable group name |
| access\_level | ENUM | NOT NULL | list, view, deploy, admin |
| granted\_by | UUID | FK → users |  |
| created\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |  |

Unique constraint: (cluster\_id, entra\_group\_id).

# **13\. Database Migrations & Seeding**

## **13.1 Migration Tooling**

* Tool: Alembic (SQLAlchemy-based migration framework for Python/FastAPI).

* Migration files are version-controlled in the application repository under /alembic/versions/.

* Each migration has both upgrade() and downgrade() functions for rollback support.

* Migrations run automatically as a Kubernetes init container before the FastAPI pod starts. If migration fails, the pod does not start (CrashLoopBackOff triggers alerts).

* Migration locking: Alembic uses a database advisory lock to prevent concurrent migration execution in multi-replica deployments.

## **13.2 Initial Seed Data**

On first deployment (empty database), the following seed data is applied after schema creation:

### **13.2.1 Default Group Permissions**

The group\_permissions table is seeded with the full permission matrix defined in Section 4.2.2. This ensures the application is functional immediately after deployment with sensible defaults.

### **13.2.2 Initial Admin User Bootstrap**

* Environment variable INITIAL\_ADMIN\_ENTRA\_GROUP\_ID specifies the Azure Entra group that will be granted the Admin role on first startup.

* The first user who logs in from this Entra group is automatically assigned as the initial Admin.

* This bootstrap only occurs if no Admin users exist in the system. Once an Admin exists, further Admin assignment is done through the Admin page.

### **13.2.3 Enum Seed Values**

Database enum types are created during migration: cloud providers (GKE, AKS, EKS), deployment backends (sglang, vllm, trtllm), deployment types (aggregated, aggregated\_route, disaggregated\_route), deployment statuses (as defined in the state machine), model source types (huggingface, s3, gcs, azure\_blob, custom), and access levels (list, view, deploy, admin).

## **13.3 Migration Workflow**

1. Developer creates a new migration: alembic revision \--autogenerate \-m "description"

2. Developer reviews the generated migration file and adjusts as needed.

3. Migration is tested locally and in the staging environment.

4. On deployment to production, the init container runs: alembic upgrade head

5. If rollback is needed: alembic downgrade \-1 (reverts one migration step).

# **14\. Frontend State Management**

This section defines how TanStack Query is configured and how the frontend manages server state, optimistic updates, and cache invalidation.

## **14.1 TanStack Query Configuration**

| Setting | Value | Rationale |
| :---- | :---- | :---- |
| staleTime (cluster data) | 30 seconds | Balance between freshness and KubeAPI load; SSE supplements |
| staleTime (model registry) | 5 minutes | Model metadata changes infrequently |
| staleTime (user profile/permissions) | 10 minutes | Permission changes are rare |
| gcTime (garbage collection) | 30 minutes | Keep inactive query data in memory for fast back-navigation |
| refetchOnWindowFocus | true | Refresh data when user returns to the tab |
| refetchOnReconnect | true | Refresh after network interruption |
| retry | 3 with exponential backoff | Handle transient network errors |

## **14.2 Query Key Structure**

Consistent query keys enable targeted cache invalidation:

* \["clusters"\] – Cluster list

* \["clusters", clusterId\] – Single cluster detail

* \["clusters", clusterId, "nodes"\] – Nodes for a cluster

* \["deployments", { page, filters, sort }\] – Paginated deployment list

* \["deployments", depId\] – Single deployment detail

* \["models"\] – Model registry list

* \["models", modelId\] – Single model detail

## **14.3 Optimistic Update Strategy**

For user-initiated mutations (create, edit, delete), TanStack Query optimistic updates provide instant UI feedback:

1. Before the API call: The query cache is updated optimistically with the expected result (e.g., new deployment with status “creating”).

2. On API success: The cache is updated with the actual server response (which may include server-generated fields like id, gitops\_commit\_sha).

3. On API failure: The cache is rolled back to the pre-mutation state. A toast notification shows the error.

4. SSE confirmation: When the SSE event confirms the final state (e.g., deployment status changes to “running”), the cache is invalidated and re-fetched to ensure consistency.

## **14.4 Error Boundary Strategy**

* Page-level error boundaries catch rendering errors and display a fallback UI with a “Retry” button.

* API errors are handled per-query: the error state is available in each component that consumes the query.

* Global error handler: A top-level toast notification system displays non-blocking error messages for background operations (e.g., SSE disconnection, token refresh failure).

* 401 responses trigger a global redirect to the login page (via an Axios/fetch interceptor).

# **15\. Multi-Cloud Cluster Connectivity**

ConnectK must support connecting to clusters across all three major cloud providers. Each provider has different authentication mechanisms for KubeAPI access.

| Provider | Auth Mechanism | Configuration Required |
| :---- | :---- | :---- |
| AWS EKS | OIDC Federation with Entra ID \+ IAM Role | EKS OIDC provider URL, IAM Role ARN for ConnectK service account, trust policy mapping Entra groups to K8s RBAC |
| Azure AKS | Entra ID Integration (native) | AKS cluster AAD integration enabled, ConnectK service principal registered, K8s ClusterRoleBinding for service account |
| Google GKE | Workload Identity Federation | GCP Workload Identity Pool, Entra ID as IdP, K8s service account annotated with GCP SA, ClusterRoleBinding |

## **15.1 Cluster Registration Flow**

1. User selects provider (GKE, AKS, or EKS) and enters cluster name and region.

2. Provider-specific form fields appear dynamically (OIDC URL, IAM Role, Workload Identity Pool, etc.).

3. User selects the GitOps tool for this cluster (ArgoCD or FluxCD) and provides the GitOps repository URL.

4. User clicks “Test Connection”: The backend attempts to authenticate with the target cluster’s KubeAPI server using the provided configuration.

5. If successful: The “Submit” button is enabled. Backend confirms read-only access is working and displays the cluster’s Kubernetes version and node count.

6. If failed: A descriptive error message indicates the issue (e.g., “OIDC trust not configured,” “Service account lacks ClusterRole binding,” “Network unreachable”) following the error taxonomy in Section 8\.

7. On Submit: Cluster is registered in PostgreSQL. Initial metadata fetch and cache population begins. Cluster appears on the Clusters page with status “pending” until cache is populated.

## **15.2 User Access Combinations**

Users may have access to any combination of cloud providers. The application must handle all permutations gracefully: GKE only, AKS only, EKS only, any two providers, or all three. The Clusters page displays all accessible clusters regardless of provider, with clear provider indicators. Deployment creation filters available clusters by provider when selected.

# **16\. GitOps Integration**

All write operations to clusters flow through Git repositories reconciled by ArgoCD or FluxCD. The ConnectK application never writes directly to the KubeAPI server.

## **16.1 Write Flow**

1. User initiates a write action (create/edit/delete deployment) via the ConnectK UI.

2. The FastAPI backend generates or modifies the Kubernetes manifest (YAML) according to the repository contract in Section 11\.

3. The backend commits the manifest to the cluster’s designated Git repository and branch.

4. ArgoCD or FluxCD (configured per cluster) detects the new commit and reconciles the desired state with the cluster.

5. ConnectK observes the deployment status via KubeAPI (read-only) Watch events and pushes updates to the frontend via SSE.

## **16.2 GitOps Tool Selection**

* Each cluster is configured with its GitOps tool (ArgoCD or FluxCD) during registration.

* The ConnectK backend abstracts the Git commit workflow so the user experience is identical regardless of the underlying GitOps tool.

* Git repository credentials (SSH keys) are stored encrypted in PostgreSQL (auth\_config column) and loaded into memory at runtime.

## **16.3 Benefits**

* Full audit trail via Git commit history (complements ConnectK’s internal audit log).

* Rollback capability: Revert to any previous Git commit to restore a prior state.

* Separation of concerns: ConnectK handles the user experience; GitOps handles cluster mutations.

* Compliance: All changes are traceable to a user, timestamp, and Git SHA.

# **17\. Audit Trail**

The ConnectK platform maintains a comprehensive audit trail of all user actions. Every state-changing operation is recorded in the audit\_logs table with the acting user, action type, resource details, timestamp, IP address, and request payload.

## **17.1 Audited Actions**

* Authentication: login, logout, session refresh, failed login attempts.

* Clusters: register, dissociate, test connection, connectivity status changes.

* Deployments: create, edit, delete, view, status transitions.

* Models: add, edit, delete.

* Admin: permission changes, group modifications, force-logout events.

* System: cache refresh events, KubeAPI connectivity changes, rate limit triggers.

## **17.2 Before/After State Diff**

For update operations, the audit log’s details JSONB field stores both the previous state and the new state of the modified resource. This enables compliance teams to see exactly what changed and who changed it.

## **17.3 Retention & Compliance**

* Default retention: 90 days (configurable via AUDIT\_RETENTION\_DAYS environment variable).

* Audit logs are append-only: The PostgreSQL application role has INSERT-only permission on the audit\_logs table. No UPDATE or DELETE is possible.

* Expired logs are purged by a scheduled Kubernetes CronJob that runs daily and deletes records older than the retention period.

* Export capability: Admins can export audit logs as CSV or JSON via /api/audit/export for external compliance systems.

# **18\. Testing Strategy**

This section defines the testing approach across all layers of the ConnectK application. Testing is a shared responsibility between the development team and QA, with automated tests integrated into the CI/CD pipeline.

## **18.1 Testing Pyramid**

| Layer | Scope | Tools | Coverage Target |
| :---- | :---- | :---- | :---- |
| Unit Tests | Individual functions, Pydantic models, utility logic | pytest, Jest/Vitest | 80%+ line coverage |
| Integration Tests | API endpoints with real DB, Redis; auth flow | pytest \+ httpx (TestClient), Docker Compose | All endpoints; happy \+ error paths |
| Component Tests | React components in isolation | React Testing Library, Vitest | All interactive components |
| E2E Tests | Full user workflows (login → action → verify) | Playwright | Critical paths (see 18.2) |
| Contract Tests | API response schema validation | Schemathesis (OpenAPI fuzz testing) | All endpoints |
| Load Tests | Performance under concurrent users | k6 or Locust | Target: 200 concurrent users |
| Security Tests | OWASP Top 10, auth bypass, injection | OWASP ZAP, Trivy (container scanning) | All endpoints; pre-release gate |

## **18.2 Critical E2E Test Scenarios**

1. Login via Azure Entra ID SSO → land on Clusters page → verify user-specific clusters are shown.

2. Register a new cluster → Test connectivity → Submit → verify cluster appears on Clusters page.

3. Create a new deployment → verify GitOps commit → verify status transitions (creating → running).

4. Edit a deployment → verify non-editable fields are locked → submit → verify updated config.

5. Delete a deployment → type confirmation name → verify removal from list.

6. Add a model to registry → verify source URI validation → verify model appears in deployment form dropdown.

7. Admin changes group permissions → verify affected user sees/loses access immediately.

8. Session expiry → verify user is redirected to login → verify they return to the page they were on.

9. Cluster becomes unreachable → verify stale data banner appears → verify write operations show appropriate warnings.

10. Concurrent users accessing the same cluster → verify cache lock prevents duplicate KubeAPI calls.

## **18.3 Mock Services for Testing**

* KubeAPI Mock: A lightweight mock server that simulates KubeAPI responses for nodes, pods, deployments, and GPU resources. Used in integration and E2E tests.

* Azure Entra ID Mock: A mock OIDC provider that returns configurable tokens and group claims. Used in integration tests to validate auth flows without a real Entra tenant.

* GitOps Mock: A local Git repository with a mock webhook that simulates ArgoCD/FluxCD reconciliation (returns configurable success/failure after a delay). Used in E2E tests.

## **18.4 CI/CD Pipeline Integration**

* Pre-commit: Lint (Ruff for Python, ESLint for TypeScript), type checking (mypy, tsc), format check.

* PR Build: Unit tests \+ integration tests \+ contract tests. Must pass before merge.

* Staging Deploy: E2E tests \+ load tests \+ security scan. Must pass before production promotion.

* Production Deploy: Canary deployment with automated rollback if error rate exceeds 1% in the first 10 minutes.

# **19\. Non-Functional Requirements**

## **19.1 Performance**

* API response time: \< 200ms for cached data, \< 2s for fresh KubeAPI fetches (p95).

* Page load time: \< 1.5s (first contentful paint), \< 3s (time to interactive).

* SSE event delivery latency: \< 500ms from KubeAPI Watch event to frontend display.

* Support for managing up to 50 clusters, 500 nodes, and 200 concurrent deployments per tenant.

* Database query performance: All list queries \< 100ms with proper indexing.

## **19.2 Security**

* All communication over TLS 1.3.

* Secrets (tokens, credentials, Git keys) encrypted at rest using AES-256-GCM at the application layer.

* No sensitive data in URL parameters, client-side logs, or browser console output.

* OWASP Top 10 compliance. Automated security scanning in CI/CD (OWASP ZAP, Trivy).

* Container images scanned for CVEs before deployment; base images updated monthly.

* Content Security Policy (CSP) headers enforced on all frontend responses.

* HTTP Strict Transport Security (HSTS) with max-age of 1 year.

## **19.3 Availability & Scalability**

* Target availability: 99.9% (excluding scheduled maintenance windows).

* Horizontal scaling: Stateless FastAPI backend behind a Kubernetes Ingress with multiple replicas (minimum 2 in production).

* Database: PostgreSQL with read replicas for query scaling. Connection pooling via PgBouncer (max 100 connections per pool).

* Redis: Sentinel or Cluster mode for high availability of session store.

* Zero-downtime deployments: Rolling update strategy with readiness probes.

## **19.4 Observability**

* Structured JSON logging from all components (FastAPI, Next.js, background workers).

* Log correlation: Each request is assigned a request\_id that is propagated through all services and included in logs, API responses, and audit entries.

* Metrics exported in Prometheus format: API latency histograms, error rate counters, cache hit/miss ratios, KubeAPI query times, active SSE connections, Redis connection pool usage.

* Distributed tracing with OpenTelemetry for cross-service request tracking.

* Alerting: PagerDuty/Slack integration for KubeAPI connectivity failures, high error rates (\>1%), certificate expiry warnings (30 days), database connection pool exhaustion, and Redis connectivity loss.

* Dashboards: Pre-built Grafana dashboards for platform health, cluster connectivity, deployment status distribution, and user activity.

## **19.5 Compliance & Data Governance**

* Audit log immutability and configurable retention (see Section 17).

* Data residency: PostgreSQL and Redis instances deployed in the same region as the ConnectK control plane.

* GDPR considerations: User PII limited to Entra ID profile data (name, email, group memberships). No additional PII collection. Data subject access requests are satisfied via audit log export.

* SOC 2 Type II alignment: Audit logs, access controls, encryption at rest and in transit, and change management via GitOps.

# **20\. Open Questions & Decisions for Architecture Review**

| \# | Question | Options | Owner |
| :---- | :---- | :---- | :---- |
| 1 | Multi-tenancy model: shared instance or tenant-isolated? | Shared DB with row-level security vs. DB per tenant | Principal Architect |
| 2 | Redis deployment topology for production | Sentinel (HA) vs. Cluster (HA \+ sharding) vs. managed (ElastiCache/Memorystore) | Principal Architect |
| 3 | GitOps repository structure: monorepo per cluster or per deployment? | Monorepo vs. per-cluster repo vs. per-deployment | Platform Engineering |
| 4 | Cost calculation source: cloud provider billing API or estimated from GPU-hours? | Billing API integration vs. GPU-hour estimation | Product Manager |
| 5 | Notification system for deployment status changes | In-app toast only vs. Slack/Teams/Email integration | Product Manager |
| 6 | Model validation depth during registry addition | Metadata only vs. download and verify weights checksum | Engineering Lead |
| 7 | Custom group support beyond Admin/Manager/Developer | Fixed 3-tier vs. Admin-configurable custom groups | Product Manager |
| 8 | External secrets provider for production | HashiCorp Vault vs. AWS Secrets Manager vs. Azure Key Vault vs. GCP Secret Manager | Security Lead |
| 9 | GitOps branch strategy per cluster | Direct to main vs. PR-based approval flow | Platform Engineering |
| 10 | Deployment rollback UX: automated vs. manual revert | One-click rollback in UI vs. manual Git revert | Product Manager |

# **21\. Glossary**

| Term | Definition |
| :---- | :---- |
| OIDC | OpenID Connect – authentication layer on top of OAuth 2.0 |
| PKCE | Proof Key for Code Exchange – security extension for OAuth public clients |
| Entra ID | Microsoft’s identity platform (formerly Azure Active Directory) |
| KubeAPI | Kubernetes API Server – the control plane endpoint for cluster operations |
| GitOps | Operational framework using Git as the single source of truth for infrastructure |
| ArgoCD | Declarative GitOps continuous delivery tool for Kubernetes |
| FluxCD | GitOps toolkit for keeping Kubernetes clusters in sync with configuration sources |
| NVIDIA Dynamo | NVIDIA’s inference serving platform for large language models |
| sglang | SGLang – structured generation language framework for LLM serving |
| vLLM | High-throughput LLM serving engine with PagedAttention |
| TensorRT-LLM | NVIDIA’s library for optimizing LLM inference on GPUs |
| TTFT | Time to First Token – latency from request to first generated token |
| TPOT | Time Per Output Token – average time to generate each subsequent token |
| KV Cache | Key-Value Cache – memory used to store attention states during inference |
| TTL | Time to Live – duration a cached entry remains valid |
| RBAC | Role-Based Access Control |
| MoE | Mixture of Experts – model architecture with conditional computation |
| SSE | Server-Sent Events – HTTP-based protocol for server-to-client push updates |
| Alembic | Database migration tool for SQLAlchemy (Python ORM) |
| TanStack Query | Frontend server state management library (formerly React Query) |
| CSP | Content Security Policy – HTTP header to prevent XSS and injection attacks |
| HSTS | HTTP Strict Transport Security – forces HTTPS connections |

# **22\. Appendix**

## **22.1 Revision History**

| Date | Version | Author | Changes |
| :---- | :---- | :---- | :---- |
| Feb 18, 2026 | 1.0 | \[Product Manager\] | Initial draft for architectural review |
| Feb 18, 2026 | 2.0 | \[Product Manager\] | Added: Environment config (Sec 3), Error handling & edge cases (Sec 8), Deployment state machine (Sec 9), Real-time SSE (Sec 10), GitOps repo contract (Sec 11), DB migrations & seeding (Sec 13), Frontend state management (Sec 14), Testing strategy (Sec 18), API schemas, rate limiting, feature flags |

## **22.2 References**

* Azure Entra ID OIDC Documentation: https://learn.microsoft.com/en-us/entra/identity-platform/

* OAuth 2.0 Authorization Code \+ PKCE: RFC 7636

* NVIDIA Dynamo Inference Server: https://developer.nvidia.com/dynamo

* ArgoCD Documentation: https://argo-cd.readthedocs.io/

* FluxCD Documentation: https://fluxcd.io/docs/

* TanStack Query: https://tanstack.com/query/latest

* FastAPI Documentation: https://fastapi.tiangolo.com/

* Alembic Documentation: https://alembic.sqlalchemy.org/

* Server-Sent Events (SSE) Specification: https://html.spec.whatwg.org/multipage/server-sent-events.html

* OWASP Top 10: https://owasp.org/www-project-top-ten/