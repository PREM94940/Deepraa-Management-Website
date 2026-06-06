# Tiered Pipeline Routing (Fast-Lane / Slow-Lane)

To preserve velocity without sacrificing security, all changes must be routed through the appropriate lane.

## 1. The Fast-Lane (2-Phases)
- **Trigger Criteria:** Changes limited to CSS, UI copy, static assets, or non-stateful frontend components.
- **Required Swarm:** Frontend Builder → QA Certification Officer.
- **Phases:** 
  1. **Build:** Code is written and compiled.
  2. **Verify & Deploy:** UI tests are run deterministically. If green, deploy immediately.

## 2. The Slow-Lane (9-Phases)
- **Trigger Criteria:** Changes involving Auth, Database Schemas, API Logic, Payments, or Middleware.
- **Required Swarm:** The Full Enterprise C-Suite.
- **Phases:**
  1. Build
  2. Data Integrity Review
  3. QA Smoke Test
  4. Security Audit
  5. Migration Validation
  6. Production Auth
  7. Deployment
  8. Monitor
  9. RCA/Rollback
