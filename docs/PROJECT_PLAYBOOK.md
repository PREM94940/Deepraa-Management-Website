# DEEPRASTORE: Master Project Playbook & Engineering Blueprint

This document serves as the absolute, single-source-of-truth manual for the Deeprastore platform. Any developer, administrator, or AI agent onboarding to this project in the future can follow this document blindly to understand how the system was built, why architectural decisions were made, and how to maintain, run, and scale it.

---

## 1. Context & Genesis (How We Got Here)

Deeprastore is a high-end, luxury Indian boutique commerce platform specializing in custom-stitched sarees, blouses, and heritage ethnic wear. The project began as a standard design implementation but quickly evolved into an **Operations-First Commerce Platform**.

### Core Philosophy:
Most e-commerce systems treat sizing as a drop-down selector (S/M/L) and treat returns as a shipping problem. For a high-end ethnic brand, custom tailoring is the **core identity** and **returns are a massive financial risk**. Therefore, the engineering goals were defined as:
1.  **A Return-Reduction Engine**: Catching size errors *before* fabric is cut using math.
2.  **A Trust Engine**: Reducing customer delivery anxiety during 18-day hand-tailoring timelines through transparent tracking.
3.  **Zero-Hardcoding CMS Governance**: Allowing the business to edit every label, support category, and status template without touching code.

---

## 2. Engineering Architecture & Directory Structure

The system is built on **Next.js 16.2.6 (App Router, Turbopack)** and **Supabase (PostgreSQL)**. The active, consolidated production workspace is located at:
`D:\Luxary Deeprastore by Ag and Chatgpt`

### Clean Directory Layout:
```
D:\Luxary Deeprastore by Ag and Chatgpt\
├── docs/                     # Architectural freeze documentation
│   ├── CMS_GOVERNANCE.md     # How storefront content rendering is governed
│   ├── SYSTEM_BOUNDARIES.md  # File boundaries and stack rules
│   ├── RBAC_RULES.md         # Database security policies and access rules
│   ├── OPERATIONAL_WORKFLOWS.md # Tailoring flow diagrams
│   └── ORDER_LIFECYCLE.md    # 10-stage order states
├── public/                   # Static storefront media and vectors
├── src/
│   ├── app/                  # Next.js App Router Pages
│   │   ├── (storefront)/     # Customer routes: /, /collections, /product/[id]/customize
│   │   ├── account/          # Customer dashboard & adjustment-first policy forms
│   │   ├── admin/            # Atelier workspace: tailoring, CRM, settings, media
│   │   └── api/              # Razorpay, webhooks, and Cron job SLA managers
│   ├── components/           # Premium storefront layout & visual modular elements
│   └── lib/                  # Shared utilities: database client, audit logger
├── supabase/
│   └── migrations/           # 11 Sequential SQL migration files
├── package.json              # System dependencies and build targets
└── vercel.json               # Platform configuration rules
```

---

## 3. Database Schema Blueprint (The Production Migrations)

The database consists of structured relations that enforce strict business governance rules:

### A. Sizing & Customization Schema
*   `measurement_profiles`: Saves client measurements (bust, waist, shoulder, front/back neck depths, sleeves) under semantic names (e.g., "Mom Sizing") to eliminate friction on repeat orders.
*   `alterations_history`: Serves as the workshop's "fitting memory". If a client submits an adjustment request, it is saved here and displayed on the master cutter's screen for future orders.
*   `stitching_customizations`: Stores specific neckline styles (Sabyasachi Sweetheart, Boat Neck), sleeve styles, and padding details for active orders.

### B. CMS Governance Schema
*   `store_ui_settings`: Configured with a Draft/Live record split. Edits are saved to Draft (`id: 2`) and undergo validation before being published to Live (`id: 1`).
*   `tracking_messages`: Houses the labels and reassurance notices for the 10 order stages.
*   `support_templates`: Dynamically drives the customer support menu categories and WhatsApp redirect messages.

---

## 4. Coding Standards & Governance Rules

Any future changes to this codebase must adhere strictly to these constraints:

### Rule 1: Zero-Hardcoding UI Copy
All operational values, WhatsApp templates, delay timelines, and collection labels must be retrieved dynamically from the database. Do not hardcode copy or thresholds in React components.

### Rule 2: The "Adjustment-First" Lock
Under no circumstances should the dashboard render a direct "Refund" button for customized garments. The UI must direct the user to submit a fitting adjustment request unless a manager explicitly checks the `refund_eligible` database flag for that order.

### Rule 3: Publishing Pre-Flights
All CMS updates must execute validation checks (managed in `src/lib/actions/cms.ts`) before publication. Broken image tags, empty routes, or external links pointing to unapproved domains must be blocked.

---

## 5. Deployment & Local Verification Playbook

### Running Locally:
1.  Navigate to the production folder:
    ```powershell
    cd "D:\Luxary Deeprastore by Ag and Chatgpt"
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Launch the development server:
    ```bash
    npm run dev
    ```
4.  Open `http://localhost:3000` in your web browser.

### Verifying a Production Build:
Before deploying to Vercel or staging, always verify compilation:
```bash
npm run build
```
The output must show successful static page generation across all 33 paths with no TypeScript compile warnings or path mismatch errors.
