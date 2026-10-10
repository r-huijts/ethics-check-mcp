---
name: ethics-vibe-check
description: Use when the user asks to sanity-check an AI reply, play devil's advocate, check for sycophancy or confirmation bias, or notice subtle drift in a conversation — and the ethics-vibe-check MCP tools are available.
---

# Ethics Vibe Check

Gut-check button for mid-conversation bias/sycophancy/drift. Requires the `@r-huijts/ethics-vibe-check` MCP server. Not ambient oversight — call only when triggered.

## When to use

- User asks to sanity-check, challenge, or re-examine the last answer
- Phrases like “devil’s advocate,” “did you just agree with me,” “are we drifting,” “too comfortable”
- Optional sparse checkpoints the user has configured (high-stakes medical/legal/financial) — not every turn

**Do not use** for ordinary helpful replies with no ask and no agreed checkpoint.

## Workflow

1. Pick the tool:
   - `critical_thinking` — sycophancy / one-sidedness / missing counterarguments on one reply
   - `ethics_check` — broader ethical scan of an exchange
   - `ethics_guide` — dilemma advice (not a mid-chat vibe check)
2. Prefer a **stable `sessionId` for this conversation**. If omitted, the server uses a process-scoped default (usually fine for one MCP process per chat) — still pass an explicit id when you can.
3. Pass the full `userRequest` plus the AI text under review (`aiResponse` or `conversation`).
4. Report results in plain language. If `sessionTrend.riskTrend` is `escalating`, **lead with that** before continuing.
5. Empty concerns / `low` risk means “looks fine” — do not re-run to hunt for problems.
6. If the user says the pushback helped or didn’t, call `ethics_feedback` with `useful: true|false` and the same `sessionId` (or set `priorFeedbackUseful` on the next `ethics_check`).

Skip `ethics_learn` unless auto-store missed something the user wants logged.

## Common mistakes

| Mistake | Fix |
|---|---|
| New random `sessionId` every call | One id per conversation (or rely on process default) |
| Burying escalating trend in JSON | Say it up front |
| Calling on every turn | Wait for ask or listed checkpoint |
| Treating empty findings as failure | Accept low/empty as a valid gut-check |
| Never recording feedback | Use `ethics_feedback` when they rate the check |

## Deeper reference

- Tool install / parameters: repo `README.md`, `USAGE.md`
- Optional always-on Cursor rule templates: `docs/system-prompts.md` (prefer this skill over a fat rule)
