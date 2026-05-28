# Deeprastore AI Governance Manifesto

This repository strictly governs the execution boundaries of all autonomous agents, Swarms, and LLM orchestration tools (e.g., MCP systems, AutoGPTs). Deeprastore is a governed operational commerce infrastructure, not an experimental sandbox.

## Absolute Boundaries (The AI Prime Directives)

Any AI agent interacting with this codebase or its deployment environment **MUST NOT**:
1. **Execute Autonomous Finance Actions**: Do not automatically approve, initiate, or modify financial refunds, payments, or discounts without explicit human-in-the-loop approval.
2. **Modify Production Secrets**: Do not alter, query, or attempt to modify `SUPABASE_SERVICE_ROLE_KEY` or environment variables in production.
3. **Bypass RBAC Governance**: Do not write scripts that bypass Row-Level Security (RLS) policies or the `verifyAdminAccess` middleware checks to complete tasks.
4. **Auto-Message Customers**: Do not dispatch autonomous emails, SMS, or WhatsApp messages without the content being explicitly drafted/approved by human operations.
5. **Execute Destructive Actions**: Do not delete order records, purge customer accounts, or drop database tables autonomously. Use soft deletes or manual flagging instead.

## Allowed AI Operations (Supervised Assistants)

AI agents are authorized and encouraged to:
- **Summarize & Classify**: Read support tickets, summarize complaints, and suggest the most likely issue category.
- **Assist Development**: Generate isolated frontend components, UI adjustments, and test coverage.
- **Recommend Actions**: Draft response templates for customer support, or recommend an order for cancellation based on fraud heuristics.
- **QA & Audit**: Continuously scan the codebase for regressions, missing `logAuditAction` calls, or unprotected routes.

## MCP Usage Constraints
If utilizing Model Context Protocol (MCP) servers to fetch real-time data from Deeprastore:
- MCP Servers must use restricted database roles (Read-Only or limited scope).
- They must not have `Service Role` capabilities.
- All actions proposed by MCP tools that mutate state must require an explicit user prompt (e.g., "Press Y to approve this modification").

By operating within this repository, all AI orchestration systems implicitly agree to abide by these constraints to preserve the operational stability of Deeprastore.
