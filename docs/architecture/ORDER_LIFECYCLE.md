# Order Lifecycle & State Machine

This document defines the 10-stage order lifecycle, tracking milestones, and status transitions governing the Deeprastore fulfilment engine.

---

## 1. Lifecycle Stages

```
[1] Order Confirmed ────> [2] Fabric Sourcing ────> [3] Fabric Inspection
                                                              │
                                                              ▼
[6] Quality Check   <──── [5] Stitching Room   <──── [4] Tailoring Commenced
       │
       ▼
[7] Packing ────────────> [8] Dispatched ─────────> [9] Out for Delivery
                                                              │
                                                              ▼
                                                        [10] Delivered
```

---

## 2. Transition Rules & Automation
*   **Draft to Confirmed**: Triggered upon verified payment payload from Razorpay or gateway partner.
*   **Tailoring Assignment**: Transitioning from `Fabric Inspection` to `Tailoring Commenced` requires the assignment of a designated Master Cutter/Artisan in the CRM.
*   **SLA and Delay Check**: If an order remains in any single stage longer than the SLA thresholds defined in `policy_content`, a flag is set, and a WhatsApp warning template is generated for customer communication.

---

## 3. Dynamic Tracking Reassurance
- Tracking messages are loaded dynamically from the `tracking_messages` table in the database.
- Customers view the live status with explanatory details and reassurance notes designed to reduce anxiety during custom tailoring (e.g., explaining why fabric inspection is underway).
