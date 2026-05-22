# DEEPRSTORE MASTER SYSTEM

This document serves as the absolute source of truth for the Deeprastore platform. It unifies all governance doctrines, operational philosophies, frontend aesthetics, architecture rules, and development workflows into a single master reference. 

Every agent, developer, and operator working on this platform MUST adhere to these principles.

---

## 1. Governance & Operational Philosophy

The core philosophy of Deeprastore is **operational reliability over feature bloat**. The platform is treated as a production-capable operational foundation, not an experimental sandbox.

* **Stability First:** Prioritize operational calmness, monitoring confidence, and failure recovery over rapid feature expansion.
* **Staging-First Discipline:** Staging is a production simulation environment, not a development sandbox. All major changes must be verified in staging (via smoke tests) before touching production.
* **Controlled Rollouts:** Never proceed to production deployment automatically. Deployments must follow the defined `Production Launch Governance Runbook`.
* **Recovery Doctrine:** Prefer controlled rollbacks over panic hotfixes. In the event of a critical anomaly, activate maintenance mode and rely on PITR (Point-In-Time Recovery) rather than direct emergency database edits.
* **Audit & Visibility:** Maintain strict audit logging for privileged actions and unauthorized access attempts.

---

## 2. Frontend & UX Philosophy

The storefront must feel like a **curated luxury fashion editorial**, not a generic ecommerce marketplace. 

* **Luxury Aesthetics:** Use strict 4:5 portrait aspect ratios for products, elegant typography (Google Fonts like Inter/Outfit), subtle gradients, and very slow/smooth micro-animations (e.g., 2-second zooms). Avoid flashy animations or visual clutter.
* **Trust Over Conversion Tricks:** Prioritize immediate trust signals (e.g., "The Deepra Promise", Authentic Handloom disclaimers, secure payment strips) above aggressive conversion tactics.
* **Mobile-First Supremacy:** Ensure fat-finger-friendly touch targets, full-bleed immersive imagery on mobile, and readable typography downscaling. Never sacrifice mobile performance for desktop aesthetics.
* **Operational Clarity:** The UI must actively reduce customer confusion and prevent complaints. Return policies, shipping times, and pricing must be completely transparent.
* **WhatsApp Concierge Integration:** Avoid complex chatbots. Use lightweight, contextual WhatsApp routing (e.g., "Need Styling Advice?") directly on product pages and in the cart to provide immediate, human luxury assistance.

---

## 3. Architecture Doctrine

Deeprastore relies on a secure, modern, and highly defensive architecture.

* **Core Stack:** Next.js 14 (App Router), Vanilla CSS (Tailwind where appropriate but strictly controlled), Framer Motion for micro-animations, and Supabase for database/auth.
* **Authentication & RBAC:** 
    * Use `@supabase/ssr` for cryptographically validated cookie-based session management.
    * **Never trust frontend role assertions.** All permissions are verified strictly server-side by fetching user roles directly from the `staff_roles` table.
    * The Service Role Key is strictly isolated in `src/lib/supabase-server.ts`. Any attempt to expose it to the frontend triggers a hard build-time error.
* **Webhook Idempotency:** All third-party webhooks (logistics, payments) must be protected against duplicate processing using the `webhook_events` tracking table.
* **Gatekeeper Logic:** Refund pipelines and critical business operations must be heavily guarded (e.g., refund blocking before a return is physically received and marked in `return_status`).

---

## 4. Workflows

* **Iterative Refinement:** Work on UI/UX "one layer at a time" (e.g., Hero -> Collection Discovery -> Product Storytelling -> Mobile Polish).
* **Launch Protocol:** 
    1. Production Supabase Provisioning
    2. Production Environment Configuration
    3. Production Deployment Verification
    4. Third-Party Webhook Activation
    5. Controlled Live Order Verification
* **Hypercare Monitoring:** During initial rollouts, operators must actively monitor Sentry, webhook failure logs, WhatsApp delivery health, and RBAC integrity.

---

## 5. Anti-Patterns (What NOT to do)

* **Direct Database Edits:** Never edit production database rows manually during an incident unless absolutely required and documented.
* **Simulated Roles:** Do not use `SIMULATE_ROLE` or rely on client-side state for authorization.
* **Frontend Bloat:** Do not introduce heavy multi-step checkout flows, intrusive popups, or unnecessary dependency additions.
* **Generic Framework Migrations:** Do not migrate frameworks or rewrite schemas unless there is a critical, proven operational need.
* **Assumption-Based Development:** Do not build major features based on assumptions. Wait for live operational feedback and real customer behavior to dictate the roadmap.

---

## 6. Current Roadmap Focus

With the core architecture stabilized and the frontend UX layers complete, the immediate roadmap shifts entirely to **Content & Operations**:

1. **Real Product Organization:** Structuring actual SKUs, variants, and pricing logic.
2. **Collection Curation:** Populating live categories.
3. **Content Population:** Uploading high-fidelity product imagery and storytelling copy.
4. **Homepage Merchandising:** Assigning active products to the curated elegance and trending sections.
5. **Live Operational Testing:** Executing end-to-end purchasing flows in the production environment.
