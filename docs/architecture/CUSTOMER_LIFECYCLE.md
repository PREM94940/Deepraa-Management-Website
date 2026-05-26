# Customer Lifecycle & Fitting Memory

This document outlines the customer retention system, fitting memory, and policies designed to maximize repeat orders while reducing returns.

---

## 1. Sizing Profiles & Fitting Memory
-   Customers can save custom measurements under individual profiles (e.g., "Mom Sizing", "My Festive Blouse") linked to their profile ID.
-   When placing repeat orders, customers select a saved profile with a single click, eliminating measurement friction.
-   **Fitting Memory Database**: All alterations are tracked in the `alterations_history` table. If a customer requests a adjustment, the master cutter sees the history (e.g., "Shorten sleeves by 0.5 inches in future orders") to ensure the next garment fits perfectly.

---

## 2. Adjustment-First Policy Enforcement
-   **Alterations Window**: Customers can request adjustments within a strict 60-day window following delivery.
-   **No Direct Refunds for Custom Work**: Refunds are structurally locked for custom-stitched items. The UI directs clients to the Adjustment Request page.
-   **Refund Eligibility Flag**: A manager can override and enable a refund button in the customer dashboard by manually changing the `refund_eligible` database flag.
