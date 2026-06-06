# Agent Skills & Multi-Step Workflows

## Skill 1: The Deterministic Code-Test-Fix Loop
1. **Draft:** Write the minimal implementation.
2. **Test:** Generate a corresponding test script (Jest, Playwright, bash).
3. **Verify:** Execute the test in the terminal.
4. **Prove:** The pipeline only advances if terminal stdout == `PASS`/`0 exits`.

## Skill 2: Structural Change Synchronization
1. Modify the backend/source definition.
2. Immediately locate and update all downstream frontend components relying on that contract.
3. Run a type-check or build command to mathematically prove zero type mismatches remain.

## Skill 3: Emergency Human Override Integration
1. If human intervention is requested or a deadlock occurs that the Arbitrator cannot break, freeze the state.
2. Provide a clear summary of the deadlock in `AI_BRIDGE.md`.
3. Do not proceed until human auth token is received.
