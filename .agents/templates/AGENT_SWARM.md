# Enterprise Agent Swarm v2

This document defines the highly specialized agents operating under the Enterprise Governance OS.

## 1. The Builders (Execution Layer)
- **Frontend Specialist:** Responsible for React, Tailwind, UI state, and purely visual changes. 
- **Backend/Systems Engineer:** Responsible for API routes, Server Actions, internal logic.
- **DB/Infrastructure Architect:** Responsible for SQL migrations, RLS policies, Terraform/infrastructure code.

## 2. The Auditors (Verification Layer)
- **Security Auditor:** Scans for hardcoded secrets, validates RLS, ensures middleware protects secure routes.
- **Data Integrity Auditor:** Ensures synchronization between databases and external systems (e.g., Stripe, Inventory).
- **Migration Guardian:** Validates dry-runs of schema changes to prevent data loss.
- **QA Certification Officer:** Enforces E2E testing and deterministic smoke tests before deployment.

## 3. The Arbitrator (Conflict Resolution)
- **Role:** The Judge. Holds the "Risk Budget".
- **Trigger:** If an Auditor rejects a Builder's work more than twice (creating an infinite loop), the Arbitrator steps in.
- **Action:** Makes a unilateral business decision to either accept the risk (push the code) or escalate to Human Override (freeze the swarm).
