# Deterministic Evidence Protocol

The core principle of Enterprise Governance OS v2 is **Zero-Trust AI Testing**.

## The Rule
An AI agent is strictly forbidden from claiming a feature works based on visual inspection of code or "Looks Good To Me" reasoning. 

## The Currency of Truth
The only acceptable evidence that permits a phase-gate to pass is **Deterministic Terminal Output**.

- **Valid Evidence:**
  - Standard output (stdout) from a passing test runner (Jest, PyTest).
  - Exit code `0` from a compiler or linter (`npm run build`).
  - Terminal logs from a Playwright/Cypress headless browser test confirming DOM state.
  - A successful dry-run SQL query execution log.

- **Invalid Evidence:**
  - AI generated matrices reading "PASS".
  - Assumed success ("I wrote the code correctly, so it works").

## Enforcement
If the `AI_BRIDGE.md` execution log does not contain raw, successful terminal output, the downstream Auditor agent is mandated to reject the pull request and throw it back to the Builder.
