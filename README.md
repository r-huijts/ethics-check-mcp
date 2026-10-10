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
2. **A second model grades the exchange.** Independent of the host model — default Gemini, or local **Ollama** via `ETHICS_PROVIDER=ollama`.
3. **Drift via `sessionId`.** Reuse one id across checks to get `sessionTrend` (`escalating` / `improving` / `stable`). If the host omits it, a **process-scoped default** is used (one MCP process ≈ one chat).
4. **Optional learning.** Concerns can be stored (with derived context tags); rate them with `ethics_feedback`. Storage: `~/.ethics-vibe-check/data` (overridable).

### Companion skill (recommended)

```bash
# after npm install -g, or from a clone:
npm run install-skill
# or: npx -y -p @r-huijts/ethics-vibe-check ethics-vibe-check-install-skill
```

Copies [`skills/ethics-vibe-check/SKILL.md`](skills/ethics-vibe-check/SKILL.md) → `~/.cursor/skills/ethics-vibe-check/`. Prefer the skill over a fat always-on rule. Optional checkpoint templates: [`docs/system-prompts.md`](docs/system-prompts.md).

---

## Tools

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
        "ETHICS_PROVIDER": "gemini",
        "GEMINI_API_KEY": "your_actual_gemini_api_key_here"
      }
    }
  }
}
```

Local second opinion (no cloud):

```json
"env": {
  "ETHICS_PROVIDER": "ollama",
  "OLLAMA_MODEL": "llama3.2",
  "OLLAMA_BASE_URL": "http://127.0.0.1:11434"
}
```

### Direct

```bash
npm install -g @r-huijts/ethics-vibe-check
ethics-vibe-check-install-skill   # companion Cursor skill → ~/.cursor/skills/
npx @r-huijts/ethics-vibe-check
```

See [`env.example`](env.example) for `ETHICS_PROVIDER`, `ETHICS_MODEL`, `ETHICS_DATA_DIR`, `ETHICS_SESSION_ID`.

> With `ETHICS_PROVIDER=gemini` (default), analysis is sent to Google. Don't paste secrets you wouldn't send to a third-party API. Use Ollama for local-only checks.

---

## What Changed Conceptually (for returning users)

| Old framing | Current framing |
|---|---|
| "Works automatically in the background" | User-triggered (or skill/rule-triggered) on demand |
| Gemini-only | `ETHICS_PROVIDER=gemini\|ollama\|mock` |
| Disconnected risk snapshots | `sessionTrend` (+ process-default `sessionId` if omitted) |
| Skill missing after npm install | `npm run install-skill` / `ethics-vibe-check-install-skill` |
| Prompts that hunt for guilt | Calibrated prompts + `npm run test:calibration` fixtures |
| Storage under `process.cwd()/.ethics-data` | `~/.ethics-vibe-check/data` |
| `successScore` never updated | `ethics_feedback` closes the loop |

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
