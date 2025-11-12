# Frontend Guidelines for TNT Resource Finder

This document outlines the architecture, design principles, and technologies behind the TNT Resource Finder’s frontend. It uses plain language so anyone—technical or not—can understand how the frontend is organized, styled, and maintained.

## 1. Frontend Architecture

### 1.1 Overview
- **Next.js (App Router)**: Our main framework. It gives us server-side rendering (pages load faster and are SEO-friendly) and a clear file-based routing system.  
- **React 19**: Powers our interactive UI components.  
- **TypeScript**: Adds type safety. This catches many bugs before we even run the code.  
- **Tailwind CSS (v4)** and **shadcn/ui**: A utility-first CSS framework combined with pre-built UI components for rapid, consistent styling.  

### 1.2 Scalability, Maintainability & Performance
- **File-Based Structure**: Pages, components, and API routes are neatly organized in folders (`app/`, `components/`, `app/api/`). Adding new features or pages is as simple as creating new files.  
- **Server Components**: We fetch data on the server when possible, reducing client bundle size and improving performance.  
- **Drizzle ORM & Type-Safe Database**: Although on the backend, Drizzle keeps our database layer predictable—less chance of schema mismatches or SQL mistakes spreading to the UI.  
- **Docker & Vercel**: Docker ensures every developer and CI environment runs the same setup. Vercel deploys our Next.js app globally, caching static assets at the edge for fast load times.

## 2. Design Principles

### 2.1 Key Principles
1. **Usability**: Every interaction should feel intuitive. Search boxes, tables, and buttons follow familiar patterns.  
2. **Accessibility (a11y)**: We use semantic HTML, proper ARIA labels, and keyboard-friendly components. shadcn/ui components come with built-in accessibility support.  
3. **Responsiveness**: Layouts adapt to mobile, tablet, and desktop. Tailwind’s responsive utilities (`sm:`, `md:`, `lg:`) make this straightforward.  
4. **Consistency**: Reuse the same spacing, colors, and typography across pages so users always know what to expect.

### 2.2 Applying the Principles
- Our search input, data table, and badges all come from shadcn/ui, ensuring consistent padding, font sizes, and hover states.  
- We enforce a design token file (`tailwind.config.js`) so colors, font sizes, and breakpoints are defined in one place.  
- Interactive elements have clear focus states and tooltips where needed to guide users.

## 3. Styling and Theming

### 3.1 Styling Approach
- **Tailwind CSS**: Utility classes for margins, padding, colors, typography, and more. Example: `className="px-4 py-2 bg-primary text-white rounded"`.  
- **BEM-like Naming (in custom CSS)**: When we need custom CSS, we prefix classes with blocks and elements (e.g., `.search-form__input`).  

### 3.2 Theming
- We define brand colors, font stacks, and sizing in `tailwind.config.js`.  
- Dark mode support via Tailwind’s `dark:` variant. Users can toggle between light and dark themes.  

### 3.3 Visual Style
- **Overall Style**: Modern flat design—clean surfaces, subtle shadows, and rounded corners. No heavy skeuomorphism.  
- **Color Palette**:  
  • Primary: #1D4ED8 (Deep Blue)  
  • Secondary: #9333EA (Vibrant Purple)  
  • Accent: #22D3EE (Bright Cyan)  
  • Neutral Light: #F8FAFC (Off-White)  
  • Neutral Dark: #111827 (Almost Black)  
- **Font**: Inter, a clean sans-serif optimized for web readability. Fallback to system fonts: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

## 4. Component Structure

### 4.1 Organization
- **`components/`**: Reusable pieces like `DataTable`, `SearchInput`, `ResourceCard`, and form controls.  
- **`app/dashboard/`**: Pages and layouts for the protected dashboard.  
- **`app/(public)/`**: Public-facing pages like the landing and auth flows.

### 4.2 Reusability & Maintainability
- Each component lives in its own folder with:  
  • `index.tsx` (the component)  
  • `styles.module.css` or inline Tailwind classes  
  • `types.ts` if it has custom props  
- Promote “single responsibility”: a component does one thing (e.g., `DataTable` strictly renders tabular data).  
- Compose complex UIs by combining smaller components, making it easy to swap or update parts without rewriting everything.

## 5. State Management

### 5.1 Local vs. Global State
- **Local State**: React’s `useState` and `useEffect` for simple UI toggles (e.g., open/close modals).  
- **Server State / Data Fetching**: TanStack Query (React Query) handles remote data, caching, background refetching, and loading/error states.  
- **Global UI State**: React Context API for theme toggles or user preferences (light/dark mode). We avoid over-architecting with heavy state libraries unless absolutely needed.

### 5.2 How State Flows
1. **UI triggers** (e.g., user types a search).  
2. **React Query** sends a request to `/api/search?query=…`.  
3. **Server** responds with JSON.  
4. **DataTable** receives the data as props and re-renders.

## 6. Routing and Navigation

### 6.1 File-Based Routing (App Router)
- **Pages** live under `app/`. Filenames and folder names map directly to URLs.  
- Dynamic routes: `[id]` for resource details or admin editing pages (`app/dashboard/admin/[resourceId]/page.tsx`).

### 6.2 Navigation Structure
- **Public**: `/` (landing), `/sign-in`, `/sign-up`.  
- **Protected Dashboard**: `/dashboard` for searching, `/dashboard/admin` for resource management (only for admin roles).  
- **Layout Components**: A shared `DashboardLayout` wraps all dashboard pages, providing side nav, header, and footer.  
- **Linking**: We use Next.js’s `<Link>` component for client-side transitions and fast navigation.

## 7. Performance Optimization

### 7.1 Key Strategies
- **Code Splitting**: Next.js automatically splits code by page. Shared components live in common bundles.  
- **Lazy Loading**: Heavy components (e.g., admin charts) load only when needed via `next/dynamic()`.  
- **Image Optimization**: Using Next.js `<Image>` with built-in resizing and lazy loading.  
- **Asset Compression & Caching**: Vercel serves compressed JS/CSS and caches static assets at the edge.  
- **Server Components**: Minimizes client JS by doing data fetching and rendering on the server when possible.

### 7.2 Impact on UX
- Faster first contentful paint (FCP) because only essential JS loads initially.  
- Smooth interactions—query caching reduces loading spinners on repeated searches.

## 8. Testing and Quality Assurance

### 8.1 Testing Layers
1. **Unit Tests**: Test individual functions and components with **Jest** and **React Testing Library**.  
2. **Integration Tests**: Verify component interactions (e.g., search input + data table) using React Testing Library.  
3. **End-to-End (E2E) Tests**: Simulate real user flows (sign in, search, admin CRUD) with **Cypress**.

### 8.2 Tooling
- **Jest**: Fast unit tests, snapshot tests for UI.  
- **React Testing Library**: Encourages testing the DOM as a user would.  
- **Cypress**: Runs in a real browser, perfect for multi-page flows and authentication testing.  
- **Linting & Formatting**: ESLint (with TypeScript and React rules) and Prettier ensure consistent code style.  
- **CI Integration**: GitHub Actions run lint, type-check, unit, and E2E tests on every pull request.

## 9. Conclusion and Overall Frontend Summary

Our frontend setup for TNT Resource Finder is built on modern, well-supported technologies—Next.js, React, TypeScript, and Tailwind CSS—ensuring fast load times, an accessible UI, and a maintainable codebase. We adhere to clear design principles (usability, accessibility, responsiveness) and a component-based structure that scales as your resource library grows. Performance optimizations like server components, code splitting, and edge caching deliver a smooth user experience. Finally, our robust testing strategy and containerized development environment keep the code reliable and development predictable.

By following these guidelines, your team can confidently expand, maintain, and deploy the TNT Resource Finder’s frontend, meeting user needs today and adapting seamlessly as requirements evolve.