# 🛡️ Ethics Check MCP

**An AI ethics companion that learns from your patterns and helps you code more thoughtfully.**

[![Add to Cursor](https://img.shields.io/badge/Add%20to-Cursor-blue?style=for-the-badge)](cursor://mcp/install?name=ethics-check-mcp&command=npx&args=-y,ethics-check-mcp)
[![npm version](https://img.shields.io/npm/v/ethics-check-mcp.svg)](https://www.npmjs.com/package/ethics-check-mcp)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

---

## What This Actually Does For You

Ever had that nagging feeling about a code decision? Or wished you could catch problematic patterns before they become problems? Ethics Check MCP is your coding conscience - an AI assistant that learns from your past decisions and helps you navigate ethical choices in real-time.

### Real Use Cases

**🔍 Before You Ship That Feature**
- "Should this user tracking be opt-in or opt-out?"
- "Is this data collection pattern actually necessary?"
- "Am I being transparent enough about what this algorithm does?"

**🧠 Learning From Your Team's Wisdom**
- Captures successful approaches to privacy challenges
- Remembers what worked (and what didn't) in past decisions
- Builds institutional knowledge about ethical practices

**⚡ In-the-Moment Guidance**
- Get contextual advice while you're actually coding
- Quick ethical sanity checks during code reviews
- Pattern recognition: "We've seen this type of issue before..."

---

## How It Actually Works

Think of it as your team's ethical memory bank that gets smarter over time:

1. **You Code** → Ethics Check observes patterns and decisions
2. **You Reflect** → Ask questions, flag concerns, document outcomes  
3. **It Learns** → Builds a weighted knowledge base of what works
4. **It Guides** → Offers increasingly smart, context-aware advice

The system uses **weighted pattern recognition** - recent decisions and successful outcomes carry more weight, so advice gets better and more relevant over time.

---

## Why This Matters Now

**For Individual Developers:**
- Catch blind spots before they become production problems
- Build confidence in ethical decision-making
- Document your reasoning for future reference

**For Teams:**
- Share ethical insights across the organization
- Create consistency in ethical approaches
- Reduce the "burden" of being the only one thinking about ethics

**For Products:**
- Ship with confidence that you've considered the implications
- Build user trust through thoughtful design decisions
- Stay ahead of regulatory and social expectations

---

## Installation & Setup

### One-Click Install (Recommended)
Click the button above or visit your Cursor MCP settings and add:

```json
{
  "mcpServers": {
    "ethics-check-mcp": {
      "command": "npx",
      "args": ["-y", "ethics-check-mcp"]
    }
  }
}
```

### Alternative Installation Methods

**Global Install:**
```bash
npm install -g ethics-check-mcp
```

**Direct Usage:**
```bash
npx ethics-check-mcp
```

---

## How to Use Your New Ethics Companion

### 1. Quick Ethics Check
When you're unsure about something:
```
@ethics-check Is this data collection pattern ethical? [describe your situation]
```

### 2. Critical Thinking Session
For complex decisions:
```
@critical-thinking Help me think through the implications of [your scenario]
```

### 3. Get Guidance Based on Best Practices
```
@ethics-guide What's the best approach for [specific ethical challenge]?
```

### Customize with System Prompts

Add this to your Cursor rules to make Ethics Check work with your specific context:

```markdown
## Ethics Context
- Our product: [describe what you're building]
- Our users: [who uses your product]
- Our values: [key principles that matter to your team]
- Regulatory context: [GDPR, CCPA, industry standards, etc.]

When using ethics tools, always consider:
- User consent and transparency
- Data minimization principles  
- Impact on vulnerable populations
- Long-term societal implications
```

---

## Example Conversations

**🔒 Privacy Design:**
> **You:** "I'm building a feature that tracks user behavior for analytics. What should I consider?"

> **Ethics Check:** "Based on successful patterns, consider: 1) Explicit opt-in consent, 2) Clear data retention policies, 3) Anonymous aggregation when possible. Previous similar cases showed that transparent data use actually increased user trust."

**🤖 AI Fairness:**
> **You:** "Our recommendation algorithm might have bias issues. How do we approach this?"

> **Ethics Check:** "High-priority concern detected. Successful approaches include: bias testing with diverse datasets, regular algorithmic audits, and transparent explanations to users. Document your bias mitigation steps for accountability."

**⚖️ Feature Ethics:**
> **You:** "Is it ethical to use dark patterns to increase engagement?"

> **Ethics Check:** "Strong ethical concern. Dark patterns typically violate user autonomy and trust principles. Consider value-aligned design: features that genuinely help users achieve their goals rather than platform goals."

---

## Smart Features You'll Love

- **🧠 Pattern Learning**: Gets smarter with every interaction
- **📊 Weighted Insights**: Recent and successful advice carries more weight
- **🔄 Context Awareness**: Understands your specific domain and challenges
- **📚 Knowledge Building**: Creates a searchable database of ethical decisions
- **⚡ Real-time Guidance**: Available right in your IDE while you code

---

## Made for Real Developers

This isn't academic theory - it's practical ethics for people shipping real products. Built by developers who've faced these challenges and wanted better tools for thinking them through.

**No judgment, just better decisions.**

---

## Contributing & Community

Have ideas? Found a useful pattern? Want to improve the ethical reasoning?

- 🐛 [Report Issues](https://github.com/your-repo/ethics-check-mcp/issues)
- 💡 [Suggest Features](https://github.com/your-repo/ethics-check-mcp/discussions)
- 🔧 [Contribute Code](https://github.com/your-repo/ethics-check-mcp/pulls)

---

## License

MIT © 2024 - Built for developers who care about building better software.

*"Technology is not neutral. We're responsible for the choices we build into our code."*