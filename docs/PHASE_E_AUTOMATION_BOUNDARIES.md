# Phase E: Advanced Automation & AI Concierge Boundaries

This document establishes the absolute operational limits for all AI-assisted features introduced during Phase E. Deeprastore utilizes AI strictly as a **governed operational assistant layer** under continuous human supervision. 

## The Golden Rule of Automation
**Every automation must answer: "Who approves this?"**
If an automated system lacks an explicit human-in-the-loop approval mechanism, it is fundamentally incompatible with this platform and must not be built.

---

## 1. Allowed Automations (Assistance Only)
AI systems are strictly limited to augmentative, draft-generation, and classification tasks to improve staff efficiency:
- **AI Support Ticket Summarizer**: Reading complex ticket histories and providing bulleted summaries for support staff.
- **Support Priority Classification**: Auto-tagging tickets (e.g., "High Priority", "Refund Request") based on semantic analysis.
- **Concierge WhatsApp Draft Suggestions**: Pre-generating personalized WhatsApp responses for staff to review, edit, and send.
- **Delay Reminder Draft Engine**: Proposing proactive delay notifications for tailored items.
- **Internal Operational Recommendations**: Suggesting workflow optimizations to managers based on queue backlogs.

---

## 2. Forbidden Automations (No Autonomy)
The following operations must NEVER be executed by an AI agent or orchestration tool autonomously:
- ❌ **Autonomous Refunds**: No automated initiation or approval of financial refunds.
- ❌ **Autonomous Customer Messaging**: No system may dispatch emails, SMS, or WhatsApp messages without manual human review and explicit click-to-send approval.
- ❌ **Autonomous Order Modification**: No automated changing of order statuses (e.g., to 'Delivered' or 'Cancelled') without human verification.
- ❌ **Autonomous Inventory Mutations**: AI cannot alter stock counts.
- ❌ **Unrestricted MCP Execution**: Model Context Protocol servers must operate with read-only database roles and restricted network access.
- ❌ **Destructive Database Operations**: AI is barred from executing `DELETE` operations or dropping tables.

---

## 3. Approval Checkpoints & Human-in-the-loop
Every AI-generated output must flow through a strict UI checkpoint:
- **Draft Status**: AI outputs (emails, WhatsApp messages, order updates) must default to a "Draft" or "Pending Review" state.
- **Explicit Affirmation**: A human operator must explicitly click "Approve", "Send", or "Save" for the action to propagate.
- **UI Highlighting**: AI-generated suggestions must be visually distinct in the dashboard (e.g., via specific border colors or AI icons) so staff clearly recognize they are reviewing machine-generated content.

---

## 4. Audit & QA Requirements
- **Logging**: Every time an AI suggestion is utilized or approved, the `audit_logs` must record the event, explicitly attributing the action to both the AI model that generated it and the human who approved it.
- **QA Verification**: No AI feature is considered complete until it passes the Governance QA Swarm (verifying RBAC isolation, browser visibility, and lack of ghost automation).

## 5. Rollback Procedures
In the event of an AI anomaly (e.g., generating inappropriate drafts or hallucinatory summaries):
- The `MAINTENANCE_MODE` flag in `.env.local` can immediately lock the platform.
- AI features will be wrapped in feature flags (e.g., `NEXT_PUBLIC_ENABLE_AI_SUMMARIES`), allowing managers to instantly disable specific automations via the Vercel dashboard without deploying code.
