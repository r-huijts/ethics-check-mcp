# System Prompt / Cursor Rules Guide

## Do you need this?

**Usually no.** Prefer the companion skill at [`skills/ethics-vibe-check/SKILL.md`](../skills/ethics-vibe-check/SKILL.md) — it covers triggers, `sessionId`, `sessionTrend`, and `ethics_feedback` without living in every conversation.

The core product is user-triggered: say “sanity check that,” “play devil’s advocate,” or “are we drifting?” and the host should call the tools from skill + tool descriptions alone.

Use **this** file only if you want an always-on Cursor rule / Claude custom instruction for a few fixed checkpoints.

---

## Minimal rule (recommended)

Copy into Cursor rules or Claude custom instructions:

```markdown
## Ethics vibe check

When I ask to sanity-check, play devil’s advocate, check for drift/sycophancy,
or challenge the last answer:
- Call `ethics_check` or `critical_thinking` (pick the tighter fit)
- Always pass a stable `sessionId` for this conversation
- Include the full user request + the AI reply being checked
- If `sessionTrend.riskTrend` is `escalating`, say so clearly before continuing
- Do not call these tools on every turn — only when I ask, or at the
  checkpoints I list below

Optional checkpoints (edit to taste):
- Before acting on medical, legal, or high-stakes financial advice
- When I’ve been pushing one framing hard for several turns

After a check, if I say the pushback helped (or didn’t), call `ethics_feedback`
with `useful: true|false` and the same `sessionId`.

Challenge me on: [your typical biases]
Don’t let me: [seek easy agreement / skip counterarguments / …]
```

That’s enough for most people. The longer templates below are optional.

---

## Principles (if you customize further)

1. **User intent first** — prefer explicit asks over ambient scanning
2. **Stable `sessionId`** — same id for the whole chat, or drift tracking is blind
3. **Sparse triggers** — strategic checkpoints beat constant interruption
4. **Surface the trend** — when `sessionTrend` says escalating, don’t bury it in JSON
5. **Close the loop** — `ethics_feedback` when the user rates a prior check; skip `ethics_learn` unless auto-store missed something
6. **Empty findings are fine** — a low-risk / empty-concerns result means “looks okay,” not “try harder”

---

## Optional: domain checkpoints

Use these only if you want semi-automatic calls in a domain. Keep them narrow.

### Health / medical

```markdown
For health or medical topics:
- If I ask for a vibe check, or I’m about to treat AI output as medical advice,
  call ethics_check with focusAreas: ["misinformation", "harmful content", "transparency"]
- Always pass sessionId; mention escalating sessionTrend before continuing
- Still include “not a doctor / seek professional care” where appropriate
- Do NOT run ethics_check on every health-adjacent sentence
```

### Money / investing

```markdown
For investing or “convince someone to put money into X”:
- On my ask, or before drafting persuasion aimed at family/friends’ savings,
  call critical_thinking (and ethics_check if harm/privacy is in play)
- Pass sessionId; flag escalating drift
- Remind: not licensed financial advice
```

### Persuasive content / marketing

```markdown
When drafting persuasive copy and I ask for a check (or we’re targeting
vulnerable groups / health claims / dark-pattern engagement):
- ethics_check with focusAreas: ["manipulation", "misinformation", "transparency", "fairness"]
- Pass sessionId
```

---

## How a good mid-chat check looks

**User:** “Sanity check that last answer — did you just agree with me too easily?”

**Host should:**
1. Call `critical_thinking` with `aiResponse` = last reply, `userRequest` = original ask, `sessionId` = this chat’s id
2. Summarize findings in plain language
3. If `sessionTrend.riskTrend === "escalating"`, say that up front
4. Adjust the next reply only if the check earned it

**User (later):** “That pushback was useful.”

**Host should:** Call `ethics_feedback` with `useful: true` and the same `sessionId`.

---

## Anti-patterns to avoid in your rule

| Don’t write… | Write instead… |
|---|---|
| “ALWAYS use ethics_check before every response” | “Call when I ask, or at these N checkpoints” |
| “Build institutional ethical knowledge with ethics_learn” | “Prefer autoStore; use ethics_feedback for useful/not useful” |
| “Automatic ethics oversight protocol” | “Gut-check tools; I trigger them” |
| Forcing concerns every time | Trust low/empty results from calibrated tools |

---

## Troubleshooting

**Host never calls the tools**  
Make the trigger phrases explicit in the rule (“sanity check”, “devil’s advocate”, “are we drifting?”).

**Too many calls**  
Delete broad “ALWAYS” language; keep 1–3 checkpoints max.

**No drift signal**  
You’re not reusing `sessionId`. Fix the rule: one stable id per conversation.

**Host ignores escalating trend**  
Add: “If sessionTrend.riskTrend is escalating, lead with that before continuing.”

**Feedback never recorded**  
Add the `ethics_feedback` sentence from the minimal rule above.
