# Role-Based Access Control (RBAC) & Security Policy

This document defines the row-level security (RLS) policies, schema security parameters, and roles that govern data access on the Deeprastore platform.

---

## 1. System Roles
-   **Anonymous / Public User**: Can browse storefront catalog, place orders, read public CMS configuration blocks, and query their own order tracking and support tickets.
-   **Staff**: Can view and transition orders on the tailoring lines, manage alterations, and copy concierge templates.
-   **Manager / Administrator**: Full access to theme config publication, settings modification, refund flags, and audit logs.

---

## 2. Supabase Row-Level Security Rules

All database tables have RLS enabled. Policies are structured as follows:

| Table | Operations | Allowed Role | Policy Logic |
| :--- | :--- | :--- | :--- |
| `site_settings` | SELECT | Public | Allowed |
| `site_settings` | ALL | Staff / Manager | Checked against `public.staff_roles` matching `auth.uid()` |
| `measurement_profiles` | ALL | Staff / Manager | Allowed |
| `measurement_profiles` | SELECT/INSERT | Public | Restricted to individual session context |
| `alterations_history` | ALL | Public / Staff | Allowed (Public can submit complaints; Staff can edit status) |
| `audit_logs` | SELECT | Manager | Authorized managers only |

---

## 3. Pre-Flight Governance Rules
Any attempt by an administrator to publish homepage config changes or theme updates triggers a mandatory pre-flight validation check to protect against:
-   Unsafe navigation links or external URL injections.
-   Broken image assets or zero-byte placeholders.
-   Unsaved collections or empty storefront categories.
