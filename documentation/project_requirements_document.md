# TNT Resource Finder - Project Requirements Document (PRD)

## 1. Project Overview

Teens in Times (TNT) Resource Finder is a web application designed to help members and visitors quickly search, browse, and access media resources (video, audio, documents) associated with TNT events and community members. By providing a centralized, searchable database of curated links, the platform solves the problem of scattered or outdated resource lists and offers a polished, responsive front end for both public users and administrators.

This project is being built to accelerate community engagement and learning by making TNT’s recorded talks, interviews, and event materials readily available. Key objectives include a seamless sign-up/sign-in flow, a powerful search interface, clear display of results, and an admin dashboard for ongoing content curation. Success will be measured by user adoption, search performance, and ease of content management by TNT organizers.

## 2. In-Scope vs. Out-of-Scope

**In-Scope (Version 1)**
- Public landing page with clear call-to-action (sign in / sign up).
- Secure user authentication and role-based access control (regular users vs. admins) using Better Auth.
- Dashboard for logged-in users featuring a search bar and filter controls.
- Search API endpoint (`/api/search`) that queries PostgreSQL via Drizzle ORM by member name, event title, or resource type.
- Responsive data table on the dashboard displaying resource title, member, event, type, and link.
- Admin dashboard section for adding, editing, and deleting resources using shadcn/ui forms, React Hook Form, and Zod validation.
- Type-safe database schemas for `members`, `events`, and `resources` in `db/schema/`, with migrations managed by Drizzle.
- Dockerized development environment (PostgreSQL & app containers) and Vercel deployment configuration.

**Out-of-Scope (Phase 2 or later)**
- Automated web crawling or scraping of external sites for resource discovery.
- Mobile-native applications (iOS or Android) or native desktop clients.
- Real-time notifications, chat, or user comments.
- Full-text search with ranking beyond basic PostgreSQL text search.
- Multi-tenant or white-label support.

## 3. User Flow

**Regular User Journey**
1. Visitor lands on the public homepage and clicks “Sign Up” or “Sign In.”
2. After signing in, the user is redirected to the dashboard. They see a search input at the top, filter dropdowns (by resource type, event, or member), and an empty data table below.
3. The user enters a search term (e.g., a speaker’s name) and hits “Search.” The front end calls `/api/search?query=…` and shows a loading state.
4. The API returns matching resources as JSON. The dashboard renders the results in the data table, with clickable links that open in a new tab.
5. The user can sort or apply additional filters. They can also click a “Save Favorite” button (if implemented later) or log out.

**Admin User Journey**
1. Admin user signs in and sees an additional “Admin Panel” option in the dashboard sidebar.
2. In Admin Panel, the admin selects “Add Resource” and fills out a form (title, URL, type, member, event) built with React Hook Form and Zod validation.
3. On submitting, the app calls a protected API route (e.g., `/api/admin/resource`) to create the record. A success notification appears, and the new resource shows up in the dashboard list.
4. Admins can edit or delete existing resources directly from the data table using action buttons.

## 4. Core Features

- **Authentication & Authorization**: Better Auth integration with role-based access (user vs. admin).
- **Database Schemas & Migrations**: Drizzle ORM schemas for `members`, `events`, `resources` and migration scripts.
- **Search API**: Next.js API route that receives query parameters, runs Drizzle queries against PostgreSQL, and returns JSON.
- **Dashboard UI**: React + shadcn/ui components for search inputs, filters, and DataTable display.
- **Admin Dashboard**: Protected React forms (React Hook Form + Zod) for CRUD operations on resources.
- **Responsive Layout**: Tailwind CSS styling with mobile-first breakpoints.
- **Containerized Development**: Docker Compose setup for app and PostgreSQL.
- **Deployment Pipeline**: Vercel configuration for automatic builds and deployments.

## 5. Tech Stack & Tools

- **Frontend Framework**: Next.js (App Router) with React 19 and TypeScript.
- **UI & Styling**: Tailwind CSS v4 + shadcn/ui component library.
- **Auth**: Better Auth for secure sign-up/sign-in and session management.
- **Database**: PostgreSQL for relational data storage.
- **ORM & Migrations**: Drizzle ORM for type-safe queries and schema migrations.
- **Forms & Validation**: React Hook Form + Zod in admin screens.
- **API**: Next.js API routes handling search and admin endpoints.
- **DevOps**: Docker & Docker Compose for local development; Vercel for production deployment.
- **IDE Integrations**: Recommended VS Code with TypeScript, ESLint, Prettier, and Drizzle extensions.

## 6. Non-Functional Requirements

- **Performance**: Search responses under 300 ms for typical queries; page load times under 1 s (TTFB under 200 ms).
- **Security**: Protect admin routes; sanitize all inputs to prevent XSS/SQL injection; HTTPS enforced in production.
- **Scalability**: Database indexing on searchable columns; stateless API routes for easy horizontal scaling.
- **Accessibility**: WCAG 2.1 AA compliance for form labels, keyboard navigation, and color contrast.
- **Reliability**: 99.9% uptime; automated health checks after deployment.

## 7. Constraints & Assumptions

- Better Auth is available and supports role-based access controls out of the box.
- PostgreSQL is the required database; alternative stores (NoSQL) are not considered.
- Drizzle ORM must support incremental migrations in production.
- Vercel environment variables will be set for database connection and auth secrets.
- No legacy browsers below ES2015 support are required.

## 8. Known Issues & Potential Pitfalls

- **Database Migrations**: Forgetting to run or commit migration files can break staging/production schemas.
  *Mitigation*: Enforce a pre-deploy hook that runs `drizzle-kit migrate`.

- **API Rate Limits**: If user search volume spikes, Next.js API routes may hit Vercel function limits.
  *Mitigation*: Implement simple caching (e.g., in-memory or Redis) for repeated queries.

- **Form Validation Gaps**: Without strict Zod schemas, malformed URLs or missing fields could slip through.
  *Mitigation*: Define comprehensive Zod schemas for each form and enforce at both client and server layers.

- **UI Drift**: Mixing shadcn/ui defaults with custom Tailwind styles can produce inconsistent visuals.
  *Mitigation*: Create a shared design tokens file (e.g., colors, spacing) and use it throughout.

---

This PRD captures the essential requirements for the TNT Resource Finder’s first version. It provides a clear roadmap for authentication, search, admin workflows, and the underlying tech stack, ensuring that subsequent technical documents can be generated without ambiguity.