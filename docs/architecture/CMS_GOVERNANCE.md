# Storefront CMS Governance & Rendering

This document explains the dynamic, database-driven CMS architecture that powers the Deeprastore storefront.

---

## 1. Zero Hardcoding Rule
To ensure maximum operational flexibility, the storefront contains no hardcoded UI copy, support messages, or tracking milestones. All components fetch their contents at runtime using standard API integrations or React Server Actions.

---

## 2. Editor Core and State Management
-   **Zustand Config Store**: Public components use `useStorefrontCMS` to access configuration properties.
-   **Draft vs Live Split**: The `store_ui_settings` table contains two records:
    -   `id: 1` -> **Live Config**: Active state rendered to public traffic.
    -   `id: 2` -> **Draft Config**: Under-edit configuration visible in the Admin Editor preview panel.
-   **Publication Flow**: Saving updates the Draft Config. Publishing copies the Draft Config record values into the Live Config record.

---

## 3. Pre-Flight Security Check Validation
Before any publishing action is executed, the backend action `publishCMSAction` runs automated pre-flight checks:
1.  **Domain Security Check**: Block any outbound links targeting unapproved domains.
2.  **Asset Integrity**: Confirm that all background hero banners, category icons, and links have active, non-null values.
3.  **Audit Logging**: Log the admin ID, changed keys, timestamps, and description to the `audit_logs` table for compliance.
