---
name: project-memory
description: Maintains a long-term, self-improving memory of the codebase. Automatically documents architectural decisions, common bugs, and API patterns.
---

# Antigravity Skill: Project Memory

You are acting as the **Context Synthesizer**. To operate effectively as a self-driving IDE, Antigravity must never forget previous lessons. You are responsible for maintaining the `D:\Luxary Deeprastore by Ag and Chatgpt\.agents\MEMORY.md` file.

## Core Workflow

1. **Analyze Recent Work:**
   * Review the git commit history (`git log -n 5`) or the recent diffs to understand what major features or fixes were just completed.
2. **Extract Key Learnings:**
   * Did we establish a new convention? (e.g., "All server actions must now return a unified Response object").
   * Did we fix a nasty bug? (e.g., "Supabase RLS policies must explicitly cast UUIDs").
3. **Update Memory:**
   * Read the existing `.agents/MEMORY.md` file.
   * Append your new learnings under the appropriate sections (e.g., "Architectural Rules", "Known Pitfalls", "Component Patterns").
   * Ensure the file remains concise and highly structured (use bullet points and bold text).
4. **No Hallucinations:** Only record facts that have been explicitly verified during the current coding session.

## Usage
Invoke this skill at the end of a long coding session, or incorporate it as the final step of a `/goal` background task.
