# Ethics Vibe Check — Usage Guide

## Install

### Cursor (one-click)
[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=ethics-vibe-check&config=eyJjb21tYW5kIjoibnB4IC15IEByLWh1aWp0cy9ldGhpY3MtdmliZS1jaGVjayJ9)

### MCP config

```json
{
  "mcpServers": {
    "ethics-vibe-check": {
      "command": "npx",
      "args": ["-y", "@r-huijts/ethics-vibe-check"],
      "env": {
        "GEMINI_API_KEY": "your_actual_gemini_api_key_here"
      }
    }
  }
}
```

### CLI

```bash
npm install -g @r-huijts/ethics-vibe-check
# or
npx -y @r-huijts/ethics-vibe-check
```

Get a Gemini key from [Google AI Studio](https://aistudio.google.com/app/apikey). Optional: `ETHICS_DATA_DIR` overrides the default store at `~/.ethics-vibe-check/data`.

> Analysis is sent to Gemini. Don't paste secrets you wouldn't send to a third-party API.

## Core idea

This is a **gut-check button**, not a background daemon. Trigger it when a conversation feels too comfortable, one-sided, or drifted. Pass the same `sessionId` across checks in one chat so `sessionTrend` can show whether risk is escalating.

## Tools

### `ethics_check`
Second-opinion ethical scan of an exchange.

```
conversation: <AI reply or transcript>
userRequest: <what you asked>
sessionId: "chat-42"          # reuse within the conversation
focusAreas: ["confirmation bias"]
priorFeedbackUseful: true     # optional: rate the previous recommendation
```

Returns concerns (may be empty — that's good), `overallRisk`, and `sessionTrend` when `sessionId` is set.

### `critical_thinking`
Focused sycophancy / confirmation-bias pass on one AI response. Same `sessionId` → same drift tracking.

### `ethics_guide`
Multi-framework advice for a dilemma (not a mid-chat vibe check).

### `ethics_learn`
Manually log a concern. Usually unnecessary if `autoStore` is left on.

### `ethics_feedback`
Thumbs-up/down on a prior recommendation so later weighting prefers advice that actually helped.

```
useful: true
sessionId: "chat-42"   # rates latest concern in this session
# or concernId: "..."
```

## Session drift

Reuse one `sessionId` per conversation:

| Check # | Risk   | `sessionTrend.riskTrend` |
|---------|--------|---------------------------|
| 1       | low    | `insufficient_data`       |
| 2–n     | rising | `escalating`              |
| 2–n     | falling| `improving`               |
| 2–n     | flat   | `stable`                  |

Example shape:

```json
"sessionTrend": {
  "checksInSession": 3,
  "riskTrend": "escalating",
  "firstRiskLevel": "low",
  "currentRiskLevel": "high",
  "summary": "3 checks this session - risk went from \"low\" to \"high\". ⚠️ Trending upward..."
}
```

## Best practices

1. Trigger on instinct — not every turn
2. Always pass a stable `sessionId` if you care about drift
3. Use `ethics_feedback` (or `priorFeedbackUseful`) so the store learns what helped
4. Leave ordinary balanced replies alone; calibrated prompts should return empty concerns when nothing's wrong
5. Prefer the companion skill (`skills/ethics-vibe-check/SKILL.md`) over a fat always-on rule; optional checkpoint templates live in `docs/system-prompts.md`
