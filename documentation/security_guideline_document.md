# Security Guidelines for TNT Resource Finder

This document provides security best practices tailored to the `tnt-resource-finder` codebase, ensuring a robust, secure, and maintainable application from development through production.

---

## 1. Security by Design

- Embed security reviews into every sprint and code review.  
- Treat features (search, admin dashboard) with threat modeling to identify risks early.  
- Document security decisions and maintain up-to-date architecture diagrams.

## 2. Authentication & Access Control

### 2.1 User Authentication (Better Auth)
- Enforce strong password policies (minimum 12 characters, mixed‐case, numbers, symbols).  
- Hash passwords using Argon2 or bcrypt with unique per-user salts.  
- Rate-limit sign-in attempts and implement exponential backoff to mitigate brute-force.

### 2.2 Session Management & JWT
- Use secure, HTTP-only, SameSite=Strict cookies for session/JWT storage.  
- Sign JWTs with a strong secret (HS256 or RS256) and validate `alg` and `exp`.  
- Implement idle and absolute session timeouts; provide logout endpoints that revoke tokens.

### 2.3 Role-Based Access Control (RBAC)
- Define roles: `admin`, `user`.  
- Protect admin routes (`/dashboard/admin`) server-side, checking user role on every request.  
- Default to deny-by-default: if no role is assigned, restrict access.

## 3. Input Validation & Output Encoding

### 3.1 API Inputs (Search & Admin)
- Validate and sanitize all query parameters (`/api/search?query=…`) using a schema library (e.g., Zod).  
- Enforce strict types for resource fields (URL patterns, enum for `resourceType`).  
- On admin forms, use React Hook Form + Zod to validate on both client and server.

### 3.2 Prevent Injection Attacks
- Use Drizzle ORM with parameterized queries—never interpolate raw user input into SQL.  
- Escape or encode any user-supplied data before rendering in tables or badges.

## 4. Data Protection & Privacy

### 4.1 Encryption
- Enforce TLS 1.2+ for all client–server and server–server communication (Vercel default).  
- Encrypt any at-rest backups or database replicas (PostgreSQL encrypted volumes).

### 4.2 Secrets Management
- Store API keys, database credentials, and JWT secrets in a secrets manager (e.g., Vercel Environment Variables, HashiCorp Vault).  
- Avoid hardcoding secrets in Dockerfiles or source code.

### 4.3 Data Minimization
- Return only required fields in API responses (avoid exposing internal IDs or metadata).  
- Mask or redact PII when logging errors or operations in production logs.

## 5. API & Service Security

- Enforce HTTPS on all API routes; redirect HTTP to HTTPS.  
- Implement rate limiting/throttling on search and login endpoints to mitigate DoS and brute-force.  
- Configure CORS to allow only trusted origins (your frontend domain).  
- Version your API (`/api/v1/search`) to manage changes securely.

## 6. Web Application Security Hygiene

### 6.1 Security Headers
- `Strict-Transport-Security`: max-age=31536000; includeSubDomains; preload  
- `Content-Security-Policy`: restrict script/src, style-src, and frame-ancestors to your domains.  
- `X-Content-Type-Options`: nosniff  
- `X-Frame-Options`: DENY or SAMEORIGIN  
- `Referrer-Policy`: strict-origin-when-cross-origin

### 6.2 CSRF Protection
- Use synchronizer tokens on state-changing POST/PUT/DELETE admin forms.  
- Validate tokens server-side on each form submission.

### 6.3 XSS Mitigation
- Use React’s built-in escaping for dynamic content.  
- Sanitize rich text inputs (if any) with a library like DOMPurify.

## 7. Infrastructure & Configuration Management

### 7.1 Docker & Deployment
- Do not run containers as root; define a non-root user in Dockerfiles.  
- Expose only necessary ports (e.g., 3000 for Next.js, 5432 internally for PG).  
- Disable debugging and verbose logging in production builds.

### 7.2 Server Hardening
- Keep OS and dependencies updated (subscribe to security bulletins).  
- Close unused ports and disable default or sample accounts.

## 8. Dependency Management

- Maintain `package-lock.json` and audit dependencies with `npm audit` or Snyk.  
- Update to patched versions promptly; avoid deprecated or unmaintained packages.  
- Limit the use of high-risk libraries; prefer official shadcn/ui and Drizzle ORM releases.

## 9. Monitoring, Logging & Incident Response

- Log authentication attempts, API errors, and admin actions with severity levels.  
- Avoid logging sensitive data (passwords, tokens, PII).  
- Integrate with monitoring tools (Datadog, Sentry) to alert on anomalies or error spikes.  
- Define an incident response plan: detection, containment, eradication, recovery, lessons learned.

## 10. Testing & Continuous Improvement

- Write unit and integration tests for critical endpoints (search, admin CRUD).  
- Include security tests: attempt injection, XSS, CSRF in test harness.  
- Incorporate CI/CD gates: run linters, SAST tools, dependency scans, and automated tests before merge.

---

Adhering to these guidelines will help ensure the TNT Resource Finder is built with a strong security posture, safeguarding user data and maintaining application integrity at every layer.