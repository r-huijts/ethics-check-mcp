# 🛡️ Ethics Vibe Check MCP

**A gut-check button for AI conversations.** Catch unwanted bias, sycophancy, or subtle drift before they harden into "obviously correct" answers.

*An MCP server that turns Claude (or any MCP host) into a philosophical sparring partner — on demand — by running an independent second-opinion model over the exchange.*

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=ethics-vibe-check&config=eyJjb21tYW5kIjoibnB4IC15IEByLWh1aWp0cy9ldGhpY3MtdmliZS1jaGVjayJ9)
[![npm version](https://img.shields.io/npm/v/@r-huijts/ethics-vibe-check.svg)](https://www.npmjs.com/package/@r-huijts/ethics-vibe-check)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

---

## The Problem

AI assistants are trained to be helpful. In practice that often means they agree too easily, reinforce your framing, and let a conversation quietly drift toward whatever you already believe.

You don't need a background daemon yelling about ethics on every turn. You need a reliable way to **pause mid-conversation and ask: did something off creep in?**

That's what this is — a set of tools you (or your host model, when you ask) can invoke when something feels sticky, one-sided, or too comfortable.

---

## How It Works (Honest Version)

1. **You trigger it.** Ask for a sanity check, devil's advocate, or `@ethics-check` / `@critical-thinking` mid-chat. These are MCP tools — they run when called, not as ambient interception.
2. **A second model grades the exchange.** The conversation is analyzed by Gemini (independent of the host model), so the same system that may have drifted isn't grading itself.
3. **Pass a `sessionId` to see drift.** Reuse the same session id across checks in one conversation. Each call records a risk reading; later calls return a `sessionTrend` (`escalating` / `improving` / `stable`) so subtle creep becomes visible instead of a pile of disconnected snapshots.
4. **Optional learning.** Flagged concerns can be stored (with derived context tags) so later checks in related chats weigh past patterns. Storage lives in `~/.ethics-vibe-check/data` by default so it survives different project directories and MCP launch cwd quirks.

Want semi-automatic triggering? Add a system prompt / Cursor rule that tells the host when to call these tools. Templates live in [`docs/system-prompts.md`](docs/system-prompts.md). That's a power-user layer — not required for the core use case.

---

## The Four Tools

### 🛡️ `ethics_check`
Scan an exchange across privacy, bias, transparency, fairness, manipulation, confirmation bias, and related dimensions. Returns concerns, overall risk, and (with `sessionId`) a `sessionTrend`.

### 🧠 `critical_thinking`
Focused confirmation-bias / intellectual-rigor pass. Surfaces missing counterarguments, overly agreeable phrasing, and reflection questions for *you* as well as the model. Also returns `sessionTrend` when `sessionId` is set.

### 🧭 `ethics_guide`
Multi-framework guidance (utilitarian, deontological, virtue, care, justice) when you're stuck on a dilemma — not a mid-chat vibe check, but useful when the question itself is ethical.

### 📚 `ethics_learn`
Manually log a concern for future pattern weighting. Usually unnecessary if `autoStore` is left on for `ethics_check`.

### 👍 `ethics_feedback`
Thumbs-up/down on a prior recommendation. Closes the learning loop so `successScore` weighting reflects what actually helped (instead of silently defaulting forever).

---

## Quick Examples

**User-triggered mid-conversation:**
> "Sanity check that last answer — did you just agree with me too easily?"
>
> → host calls `critical_thinking` with the last response + your request + a session id

**Drift across a long chat:**
> Run `ethics_check` early (risk: low), again after the topic gets heated (risk: medium), again later (risk: high).
>
> → `sessionTrend.riskTrend` becomes `"escalating"` with a short summary of the creep

**Customize what you're hunting:**
Add a short rule to Cursor / Claude custom instructions (full guide: [`docs/system-prompts.md`](docs/system-prompts.md)):

```markdown
## Ethics vibe check
When I ask to sanity-check, play devil's advocate, or check for drift:
- Call ethics_check or critical_thinking
- Always pass a stable sessionId for this conversation
- Surface the sessionTrend summary if risk is escalating
- If I say the pushback helped / didn't, call ethics_feedback
Challenge me on: [your typical biases]
```

---

## Installation

### One-click (Cursor)
[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=ethics-vibe-check&config=eyJjb21tYW5kIjoibnB4IC15IEByLWh1aWp0cy9ldGhpY3MtdmliZS1jaGVjayJ9)

### Manual MCP config

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

### Direct

```bash
npm install -g @r-huijts/ethics-vibe-check
# or
npx @r-huijts/ethics-vibe-check
```

Requires a Gemini API key ([Google AI Studio](https://aistudio.google.com/app/apikey)). Optional: set `ETHICS_DATA_DIR` to override the default storage location (`~/.ethics-vibe-check/data`).

> Note: analysis is sent to Gemini. Don't paste secrets or sensitive personal data into checks you wouldn't send to a third-party API.

---

## What Changed Conceptually (for returning users)

| Old framing | Current framing |
|---|---|
| "Works automatically in the background" | User-triggered (or rule-triggered) on demand |
| Disconnected risk snapshots | `sessionTrend` across a conversation via `sessionId` |
| "Intelligent pattern recognition" as the headline | Honest second opinion + simple drift signal; history is a helper |
| Storage under `process.cwd()/.ethics-data` | Stable `~/.ethics-vibe-check/data` (overridable) |
| `contextTags` field never populated | Tags derived from focus areas / context / request text |
| Prompts that hunt for guilt | Calibrated prompts: empty concerns / low risk is a valid result |
| `successScore` never updated | `ethics_feedback` (+ optional `priorFeedbackUseful`) closes the loop |

---

## Not for Everyone

**Useful if you:**
- Want a deliberate pause button when a chat feels too comfortable
- Prefer uncomfortable questions over tidy agreement
- Are willing to re-examine your own framing

**Skip if you:**
- Just want the model to agree and move on
- Prefer never being interrupted mid-flow
- Want fully automatic enforcement with zero prompting (that's a different product)

---

## Philosophy

As AI gets better at sounding right, the skill that matters is noticing when a conversation has quietly stopped being rigorous. This tool doesn't make you more "ethical" by decree — it gives you a structured way to ask harder questions of an exchange that already happened.

**The point isn't to be right. The point is to be thoughtful.**

---

## Contributing

Ideas for better drift signals, bias patterns, or prompt framing welcome:

- 🐛 [Report Issues](https://github.com/r-huijts/ethics-check-mcp/issues)
- 💡 [Suggest Features](https://github.com/r-huijts/ethics-check-mcp/discussions)
- 🔧 [Contribute Code](https://github.com/r-huijts/ethics-check-mcp/pulls)

---

## License

MIT © 2024–2026 — Built for people who want AI to make them think harder, not just feel better.
