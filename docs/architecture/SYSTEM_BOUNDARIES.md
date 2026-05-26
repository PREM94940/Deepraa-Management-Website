# System Boundaries & Architecture Freeze

This document outlines the technical boundaries, layout structures, and dependency definitions for the consolidated Deeprastore production application.

---

## 1. Technical Stack Boundaries
*   **Frontend Framework**: Next.js 16.2.6 (App Router with Turbopack)
*   **Language**: TypeScript (strict type checking enabled)
*   **Database & Backend-as-a-Service**: Supabase (PostgreSQL)
*   **Styling**: Vanilla CSS (`src/app/globals.css`, `src/app/admin/admin.css`)
*   **State Management**: Zustand (`useCMSStore` for storefront rendering configuration)

---

## 2. Directory Structure Boundaries

The system is strictly divided into three primary runtime domains:

```
D:\Luxary Deeprastore by Ag and Chatgpt\
├── public/                 # Static assets, logos, and illustration resources
├── supabase/
│   └── migrations/         # Production-governed database schema migrations
├── src/
│   ├── app/                # Application routes
│   │   ├── (storefront)    # Public pages: /, /collections, /product, /support, /track
│   │   ├── account/        # Customer dashboard and adjustment requests
│   │   ├── admin/          # Atelier control plane, CRM, theme and content CMS
│   │   └── api/            # Webhooks, CRON tasks, and API entrypoints
│   ├── components/         # Reusable presentation components
│   └── lib/                # Database clients, actions, and shared utilities
```

---

## 3. Boundary Invariants
1.  **No Unsanctioned Scripts**: Playground scripts (`check_*.js`, `fix_*.js`) are forbidden in the production workspace.
2.  **Explicit Imports**: All paths must use standard alias paths (`@/components/*`, `@/lib/*`) referencing the current active directory.
3.  **Strict Isolation of Concerns**: Config values, labels, and pricing formulas must never be hardcoded into frontend components. They must remain driven by the Supabase database and managed via the Admin CMS panel.
