# UpayAche — Security Architecture & Threat Model

> **Document Version**: 1.0.0  
> **Status**: Approved Architecture Baseline  
> **Frameworks**: STRIDE Threat Modeling, OWASP Top 10, Zero Trust Boundary Enforcement

---

## 1. Security Invariants & Principles

1. **Defense in Depth**: Security controls operate across client, API gateway, service, and database tiers.
2. **Zero Client Secrets**: No private keys, database credentials, or AI API keys are bundled into frontend client bundles.
3. **Guarded Intelligence**: Gemini operates with zero write, execute, or financial permissions.
4. **Human-in-the-Loop Financial Authority**: The AI advises; only authenticated human analysts and admins can transition investigation states or flag wallets.
5. **Privacy by Design**: 100% synthetic data. Mobile numbers follow standard synthetic formats with client-side and server-side masking (`+88017****1234`).

---

## 2. STRIDE Threat Analysis & Mitigations

| STRIDE Category | Threat Description | Attack Vector | UpayAche Architectural Mitigation |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Attacker impersonates an Analyst or Admin to tamper with cases | Forged JWT token or session hijacking | Supabase Auth RS256 JWT signature verification on every backend API call. Tokens expire automatically. |
| **Tampering** | Malicious actor modifies transaction amounts, risk scores, or audit logs | Direct database writes or API parameter tampering | Database-level RLS prevents updates to `transactions`, `risk_assessments`, and `audit_logs`. `audit_logs` has zero `UPDATE` or `DELETE` policies. |
| **Repudiation** | Analyst denies resolving a case or altering a fraud determination | Disputed status change | Append-only `audit_logs` records actor UUID, IP address, timestamp, previous state, and new state for every transition. |
| **Information Disclosure** | Leakage of customer phone numbers or proprietary AI keys | Client bundle inspection or unauthenticated endpoints | Client receives only masked phone numbers. `GEMINI_API_KEY` and Supabase `service_role` keys are backend-only. |
| **Denial of Service** | Flooding ML inference or Gemini endpoints to exhaust quota | Heavy repeated scoring requests | IP-based and token-based rate limiting via SlowAPI / FastAPI middleware (60 req/min for scoring, 10 req/min for Gemini). |
| **Elevation of Privilege** | `VIEWER` attempts to create cases or modify investigation state | Direct REST API calls to `PATCH /api/v1/cases/{id}/status` | Backend dependency injection verifies role `in ('ANALYST', 'ADMIN')` before executing business logic; backed by DB RLS. |

---

## 3. Role-Based Access Control (RBAC) Specification

### 3.1 Role Hierarchy
```
    ┌──────────────┐
    │    ADMIN     │ (Full control, system configs, audit trail)
    └───────┬──────┘
            │ inherits
    ┌───────▼──────┐
    │   ANALYST    │ (Investigate alerts, create/close cases, add notes, run AI)
    └───────┬──────┘
            │ inherits
    ┌───────▼──────┐
    │    VIEWER    │ (Read-only dashboard, risk ledger, and 3D network view)
    └──────────────┘
```

### 3.2 Enforcement Points
RBAC is enforced at two independent layers:
1. **API Gateway Layer (FastAPI)**:
   ```python
   # app/core/security.py
   def require_role(allowed_roles: list[str]):
       async def role_checker(current_user: User = Depends(get_current_user)):
           if current_user.role not in allowed_roles:
               raise HTTPException(
                   status_code=status.HTTP_403_FORBIDDEN,
                   detail=f"Role '{current_user.role}' is not authorized for this resource."
               )
           return current_user
       return role_checker
   ```
2. **Database Layer (Supabase PostgreSQL RLS)**:
   Even if an API bug bypasses application middleware, PostgreSQL RLS policies evaluate `public.get_user_role()` and abort unauthorized SQL executions.

---

## 4. Secrets Management & Environment Boundary

| Secret Variable | Exposure Scope | Storage Location | Rotation / Security |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Backend Only** | `.env` on server / Secret Manager | Never prefixed with `NEXT_PUBLIC_`. Revocable in Google AI Studio. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Backend Only** | `.env` on server | Used only for administrative tasks and seed scripts. |
| `SUPABASE_JWT_SECRET` | **Backend Only** | `.env` on server | Used for local signature verification of user tokens. |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Frontend | `.env.local` | Public project endpoint. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Frontend | `.env.local` | Scoped to anonymous/authenticated RLS policies only. |

---

## 5. Injection Defenses

### 5.1 SQL Injection
- PostgREST parameterized queries via Supabase Python SDK and TypeScript client.
- Zero raw string formatting (`f"SELECT * FROM ... WHERE id = '{user_input}'"`) allowed in repositories.

### 5.2 Cross-Site Scripting (XSS)
- React / Next.js auto-escapes all JSX bindings.
- Analyst notes use a sanitized markdown renderer (`rehype-sanitize`) that strips `<script>`, `<iframe>`, and malicious attributes.

### 5.3 Prompt Injection Protection (Gemini)
- Zero concatenation of analyst notes or freeform chat inputs into the system prompt.
- Evidence sent to Gemini is pre-extracted and converted to typed Pydantic models before being serialized to JSON.
- System prompt uses strict boundary delimiters and explicit negative constraints.
- Output is enforced via `response_mime_type="application/json"` with schema validation.

---

## 6. Audit Trail & Non-Repudiation

Every security-sensitive action writes an immutable record to `public.audit_logs`:
- Case state changes (`OPEN` → `INVESTIGATING` → `REVIEWED` → `CLOSED`)
- Case resolutions (`CONFIRMED_FRAUD`, `FALSE_POSITIVE`, `SUSPICIOUS_MONITOR`)
- Analyst note additions
- AI investigation assistant invocations
- User authentication events

The `audit_logs` table has no `UPDATE` or `DELETE` SQL policies, guaranteeing append-only persistence.

---

## 7. Phase 10 — Supabase Authentication & Authorization Specifications

### 7.1 Client-Safe Architecture & Zero Service-Role Key Invariant
- **Frontend Environment**:
  - Exposes ONLY `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - `SUPABASE_SERVICE_ROLE_KEY` is strictly prohibited from frontend code, environment bundles, or public repositories.
  - Automated tests scan `.env.example` and all frontend source files to guarantee zero service-role key leakage.

### 7.2 Role-Based Access Control (RBAC) Matrix

| Operation / Resource | ADMIN | ANALYST | VIEWER | Unauthenticated |
| :--- | :---: | :---: | :---: | :---: |
| Read Transactions & Network | ✅ 200 | ✅ 200 | ✅ 200 | ❌ 401 |
| Read Risk Assessments & SHAP | ✅ 200 | ✅ 200 | ✅ 200 | ❌ 401 |
| Analyze & Ingest Transactions | ✅ 200 | ✅ 200 | ❌ 403 | ❌ 401 |
| Create Investigation Case | ✅ 201 | ✅ 201 | ❌ 403 | ❌ 401 |
| Advance Case (`OPEN` → `CLOSED`) | ✅ 200 | ✅ 200 | ❌ 403 | ❌ 401 |
| Reopen `CLOSED` Case | ✅ 200 | ❌ 403 | ❌ 403 | ❌ 401 |
| Append Analyst Note | ✅ 201 | ✅ 201 | ❌ 403 | ❌ 401 |
| Run Guarded Gemini Assistant | ✅ 200 | ✅ 200 | ❌ 403 | ❌ 401 |
| Access Compliance Audit Trail | ✅ 200 | ✅ 200 | ❌ 403 | ❌ 401 |
| Access Cross-User Profile (IDOR) | ✅ 200 (Governance) | ❌ 403 | ❌ 403 | ❌ 401 |

### 7.3 IDOR & Cross-User Data Access Protection
- Endpoints enforcing individual user resource access verify caller identity against the target resource `owner_id`:
  - If `current_user.id != target_owner_id` and `current_user.role != 'ADMIN'`, the request is immediately aborted with `HTTP 403 Forbidden: You are not authorized to modify or access resource owned by another user`.
  - `ADMIN` role is granted global audit clearance for regulatory compliance.

### 7.4 Session Lifecycle & Cryptographic Expiration
- Bearer tokens are validated on every request:
  - Cryptographic HS256 signature verification against `SUPABASE_JWT_SECRET`.
  - Manual epoch timestamp verification (`exp`).
  - Tokens older than expiration or containing invalid claims receive `HTTP 401 Unauthorized: Token has expired. Please log in again.`

### 7.5 Frontend Route Protection & State Machine
- `AuthContext`:
  - Persists authenticated JWT and profile metadata in browser `localStorage`.
  - Seamlessly syncs with Supabase `onAuthStateChange`.
  - Offers one-click interactive role persona switcher for development and compliance demos.
- `ProtectedRoute`:
  - Renders 401 Unauthenticated screen if no session exists.
  - Renders 403 Forbidden screen if user's role lacks clearance for the target route.
  - Renders child view when authorization criteria are fully satisfied.

