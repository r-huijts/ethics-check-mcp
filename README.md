# Ethics Vibe Check

**A gut-check button for AI conversations.**

MCP tools that run an independent second-opinion model over an exchange so you can catch sycophancy, confirmation bias, or quiet drift — when you ask, not as ambient surveillance.

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=ethics-vibe-check&config=eyJjb21tYW5kIjoibnB4IC15IEByLWh1aWp0cy9ldGhpY3MtdmliZS1jaGVjayJ9)
[![npm version](https://img.shields.io/npm/v/@r-huijts/ethics-vibe-check.svg)](https://www.npmjs.com/package/@r-huijts/ethics-vibe-check)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Package: [`@r-huijts/ethics-vibe-check`](https://www.npmjs.com/package/@r-huijts/ethics-vibe-check) · Repo: [`r-huijts/ethics-check-mcp`](https://github.com/r-huijts/ethics-check-mcp)

---

## What it is

LLMs are trained to be helpful. That often means they agree too easily and let a chat slide toward whatever you already believe.

This server does **not** intercept every turn. It exposes tools you (or your host, when you ask) call mid-conversation:

> “Sanity check that.” · “Play devil’s advocate.” · “Are we drifting?”

A **second model** grades the exchange. Reuse (or omit) a session id to get a **`sessionTrend`** — `escalating` / `improving` / `stable` — so creep shows up as a signal, not a pile of disconnected snapshots.

---

## Quick start

### 1. MCP server

**Cursor one-click** (above) installs the server command only. Afterward, open MCP settings and add env (Gemini by default):

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

**Local second opinion** (no cloud):

```json
"env": {
  "ETHICS_PROVIDER": "ollama",
  "OLLAMA_MODEL": "llama3.2",
  "OLLAMA_BASE_URL": "http://127.0.0.1:11434"
}
```

**CLI:**

```bash
npm install -g @r-huijts/ethics-vibe-check
npx @r-huijts/ethics-vibe-check
```

Full env reference: [`env.example`](env.example).

### 2. Companion skill (recommended)

The skill teaches the host *when* to call tools, how to treat `sessionTrend`, and when to record feedback. Prefer it over a fat always-on rule.

```bash
# global install:
ethics-vibe-check-install-skill

# from a clone / local package:
npm run install-skill

# one-shot without a global install:
npx -y -p @r-huijts/ethics-vibe-check ethics-vibe-check-install-skill
```

Installs [`skills/ethics-vibe-check/SKILL.md`](skills/ethics-vibe-check/SKILL.md) → `~/.cursor/skills/ethics-vibe-check/` (override with `CURSOR_SKILLS_DIR`).

Optional always-on checkpoint templates: [`docs/system-prompts.md`](docs/system-prompts.md).

---

## Tools

| Tool | Use when |
|---|---|
| `ethics_check` | Broader scan of an exchange (bias, privacy, manipulation, confirmation bias, …). Returns `overallRisk`, concerns (may be empty), `sessionTrend`. |
| `critical_thinking` | Focused sycophancy / one-sidedness pass on one AI reply. Returns `confirmationBiasRisk`, `sessionTrend`. |
| `ethics_guide` | Multi-framework advice for a dilemma (not a mid-chat vibe check). |
| `ethics_learn` | Manually log a concern. Usually unnecessary if `autoStore` is on. |
| `ethics_feedback` | Thumbs-up/down on a prior recommendation so `successScore` weighting reflects what helped. |

**Session / drift**

- Pass the same `sessionId` across checks in one chat when you can.
- If omitted, the server uses a **process-scoped default** (typical MCP hosts run one process per conversation).
- Override with `ETHICS_SESSION_ID` for evals or known ids.

**Calibration**

Prompts are written so ordinary helpful replies can return **low risk and empty findings**. Empty is a valid gut-check result — not a failure.

---

## Providers

| `ETHICS_PROVIDER` | Needs | Notes |
|---|---|---|
| `gemini` (default) | `GEMINI_API_KEY` | Cloud second opinion. Optional `ETHICS_MODEL` / `GEMINI_MODEL`. |
| `ollama` | Local Ollama | `OLLAMA_BASE_URL`, `OLLAMA_MODEL` or `ETHICS_MODEL`. |
| `mock` | nothing | Deterministic offline answers for tests/demos only. |

Storage defaults to `~/.ethics-vibe-check/data` (`ETHICS_DATA_DIR` to override).

With Gemini, analysis leaves your machine — don’t paste secrets you wouldn’t send to a third-party API. Use Ollama for local-only checks.

---

## Example flow

1. Mid-chat: “Sanity check that last answer — did you just agree with me too easily?”
2. Host calls `critical_thinking` with the reply + your request (session id optional but nice).
3. If `sessionTrend.riskTrend` is `escalating`, the host should say so up front.
4. Later: “That pushback helped.” → `ethics_feedback` with `useful: true`.

---

## Develop / verify

```bash
npm install
cp env.example .env   # or ETHICS_PROVIDER=mock for offline work
npm run build
npm run test:all      # session unit tests + calibration fixtures (mock)
```

| Script | What |
|---|---|
| `npm run test:session` | Drift, tags, feedback, session-id default |
| `npm run test:calibration` | 8 false-positive / sycophancy fixtures via `mock` |
| `npm run test:calibration:live` | Same fixtures against your configured provider |
| `npm run install-skill` | Copy companion skill into Cursor skills dir |

More detail: [`USAGE.md`](USAGE.md).

---

## Who this is for

**Yes if** you want a deliberate pause when a chat feels too comfortable, and you’ll act on an uncomfortable answer.

**No if** you want the model to always agree, or you need fully automatic enforcement with zero prompting — that’s a different product.

---

## License

MIT © 2024–2026

*The point isn’t to be right. The point is to be thoughtful.*
