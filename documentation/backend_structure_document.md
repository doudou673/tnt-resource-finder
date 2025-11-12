# Backend Structure Document for TNT Resource Finder

This document outlines the backend setup for the "Teens in Times (TNT) Resource Finder" project. It explains the architecture, data storage, APIs, hosting, infrastructure, security, monitoring, and maintenance in clear, everyday language.

## 1. Backend Architecture

### Overall Design
- We use Next.js both for the frontend and backend. The backend part lives in Next.js API routes (serverless functions).  
- Business logic (search, create, update resources) is separated into clean modules, following a simple request→process→response pattern.  
- Drizzle ORM handles all database interactions in a type-safe way, reducing errors in our queries.

### Support for Scalability, Maintainability, and Performance
- **Scalability**: Serverless functions on Vercel automatically scale up to handle more traffic.  
- **Maintainability**: Clear folder structure (e.g., `app/api/`, `db/schema/`) keeps related code together. Using TypeScript and Drizzle’s types helps catch bugs early.  
- **Performance**: Next.js Server Components fetch data on the server for fast, SEO-friendly pages. Vercel’s global CDN delivers responses close to users.

## 2. Database Management

### Technologies Used
- PostgreSQL (a SQL relational database)  
- Drizzle ORM (type-safe interface for writing SQL queries)  

### Data Structure and Practices
- Data is organized into tables: `members`, `events`, and `resources`.  
- Every table has a primary key (`id`). Relationships are enforced by foreign keys.  
- We use Drizzle migrations to apply schema changes in a safe, repeatable way.  
- Backups and migrations are part of our deployment process to protect data integrity.

## 3. Database Schema

### Human-Readable Overview
1. **members** table  
   • id (unique identifier)  
   • name (member’s full name)  
   • email (contact email)  

2. **events** table  
   • id (unique identifier)  
   • title (event name)  
   • date (event date)  

3. **resources** table  
   • id (unique identifier)  
   • title (resource title)  
   • url (link to the resource)  
   • type (e.g., video, audio)  
   • member_id (foreign key to members.id)  
   • event_id (foreign key to events.id)

### SQL Schema (PostgreSQL)
```sql
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  date DATE NOT NULL
);

CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  url TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  member_id INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE
);
```

## 4. API Design and Endpoints

### Approach
- We follow a RESTful style using Next.js API routes.  
- Endpoints live under `app/api`, each in its own folder with a `route.ts` file.  

### Key Endpoints and Their Purposes
- **POST /api/auth/signup** and **POST /api/auth/signin** (Better Auth)  
  • Handle user registration and login.  

- **GET /api/search?query=[text]**  
  • Searches resources by member name or event title. Returns a list of matching resources.  

- **GET /api/resources**  
  • Returns all resources (admin only).  

- **POST /api/resources**  
  • Creates a new resource entry (admin only).  

- **PUT /api/resources/[id]**  
  • Updates an existing resource (admin only).  

- **DELETE /api/resources/[id]**  
  • Deletes a resource (admin only).  

- **GET /api/members** and **GET /api/events**  
  • Provide lists of members and events for dropdowns or filtering in the UI.

## 5. Hosting Solutions

### Development Environment
- **Docker** containers for PostgreSQL and local services.  
- Ensures everyone on the team runs the same versions and configurations.

### Production Environment
- **Vercel** for deploying the Next.js application.  
  • Serverless functions power our API routes.  
  • Built-in global CDN delivers frontend assets and API responses quickly.  
  • Automatic deployments from the main Git branch.

### Benefits
- **Reliability**: Vercel and Docker both offer proven uptime and tooling.  
- **Scalability**: Serverless functions grow with demand without manual setup.  
- **Cost-Effectiveness**: Pay-as-you-go model on Vercel and minimal infrastructure management.

## 6. Infrastructure Components

- **Load Balancer**: Managed by Vercel—automatically distributes incoming requests.  
- **CDN (Content Delivery Network)**: Vercel’s edge network caches static assets and API responses.  
- **Caching**: Next.js ISR (Incremental Static Regeneration) caches pages for repeated requests.  
- **Reverse Proxy & SSL**: Handled by Vercel for secure HTTPS connections.

These pieces work together to reduce latency, handle large traffic spikes, and keep the service responsive.

## 7. Security Measures

- **Authentication**: Better Auth handles secure sign-up, sign-in, and session management.  
- **Authorization**: Role-based access control (RBAC) ensures only admins can add/edit resources.  
- **Data Encryption**:  
  • In transit: HTTPS everywhere via SSL.  
  • At rest: PostgreSQL encryption options on the hosted database.  
- **Input Validation & Sanitization**:  
  • Zod schemas and React Hook Form on admin forms.  
  • Server-side checks in API routes to prevent injection attacks.  
- **Environment Variables**: Secrets (database URLs, auth keys) stored securely outside of code.

## 8. Monitoring and Maintenance

- **Error Tracking**: Integration with Sentry (or similar) to capture runtime errors in real time.  
- **Performance Monitoring**: Vercel Analytics for request/latency metrics.  
- **Logging**: Serverless logs via Vercel dashboard and optional database logs for slow queries.  
- **Database Migrations**: Drizzle’s migration tool ensures schema updates are applied consistently.  
- **Automated Tests**: CI pipeline runs tests on API routes and database logic to catch regressions.

Maintenance tasks include regular dependency updates, reviewing Sentry alerts, and applying Drizzle migrations as the data model evolves.

## 9. Conclusion and Overall Backend Summary

The TNT Resource Finder backend is built on a modern, full-stack JavaScript stack with Next.js API routes, a type-safe ORM (Drizzle), and PostgreSQL. Docker keeps development consistent, and Vercel provides a reliable, scalable, and cost-efficient production environment. Security is enforced through Better Auth, RBAC, encryption, and rigorous validation. Monitoring tools like Sentry and Vercel Analytics ensure we can detect and resolve issues quickly. Together, these components deliver a fast, maintainable, and user-friendly backend that aligns with the project’s goals: to help teens discover and manage relevant resources through a clean, responsive interface.