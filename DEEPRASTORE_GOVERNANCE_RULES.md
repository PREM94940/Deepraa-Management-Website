# DEEPRASTORE GOVERNED AI OPERATING CONSTITUTION

This document serves as the permanent operational directive and constitution for all AG workflows, RuFlow orchestrations, swarm agents, browser QA systems, and governance reviewers operating within the Deeprastore ecosystem.

**Operational Philosophy:** "Governed AI-Assisted Commerce Infrastructure"
*(Not: Uncontrolled Autonomous AI Operations)*

---

## 1. Workspace Governance Lock
The ONLY authorized production workspace is:
`D:\Luxary Deeprastore by Ag and Chatgpt`

All future execution must hard-bind to this governed workspace. Swarm agents and orchestrators must reject any operations outside of this directory.
**ABSOLUTE MANDATE**: The agent must assert its current directory on boot. If the working directory belongs to OneDrive, `New project 3`, abandoned prototypes, or any mismatched path, it must HARD FAIL the operation immediately. No fallback directories are permitted.

## 2. Browser QA Mandate
Nothing is considered complete unless it satisfies the following validation gates:
- Visible and functional in the browser
- Tested for responsive mobile rendering
- Data persistence verified (database integration)
- RBAC (Role-Based Access Control) verified
- Production-readiness verified

## 3. AI Boundaries
AI agents operate strictly as operational assistants under human governance.

**AI May:**
- Summarize data and logs
- Recommend architectural changes
- Assist with workflows and UI development
- Draft code, copy, and configurations

**AI May NOT (Strict Prohibitions):**
- Execute autonomous financial decisions (e.g., auto-refunds, altering payments)
- Bypass RBAC, middleware, or security gates
- Send autonomous customer messages without human approval
- Alter production databases without an audit trail

## 4. Security Rules
Every implementation must strictly adhere to the following security requirements:
- **Audit Logs:** All critical actions must be logged.
- **Middleware Protection:** Routes must be protected at the edge/middleware level.
- **No Exposed Secrets:** Environment variables must be securely handled.
- **Admin Isolation:** Strong separation between storefront and operational backend.
- **CRON_SECRET Enforcement:** Background tasks and webhooks must be authenticated.

## 5. Swarm Rules & Agent Execution Hardening
When multiple agents or swarms are invoked, they must:
- Explicitly assert and print their active workspace path (`pwd` or equivalent) before operating.
- Validate that the absolute path is `D:\Luxary Deeprastore by Ag and Chatgpt`.
- Immediately reject wrong directories (e.g., OneDrive or `New project 3`) and abort execution to prevent hallucinated scanning.
- Forbid any relative-path drift. Paths must be normalized and checked against the authorized root.
- Provide definitive proof artifacts (e.g., Walkthroughs, Implementation Plans) before finalizing tasks.

## 6. Governed Operational Pipeline
The mandatory workflow for all future feature development and infrastructure changes is:

1. **Architect Agent** (Design & Plan)
2. **Security Reviewer** (Threat Modeling)
3. **Coder Agent** (Implementation)
4. **Browser QA** (Visual & Functional Validation)
5. **Senior Auditor** (Code Quality & Performance)
6. **Governance Review** (Compliance with this Constitution)
7. **Human Approval** (Final Authorization)
8. **Deployment** (Production Release)

---
*By operating within the Deeprastore ecosystem, all agents acknowledge and bind themselves to this governed operational architecture.*
