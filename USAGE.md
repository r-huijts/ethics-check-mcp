# 🛡️ Ethics Check MCP - Usage Guide

## 🚀 Quick Installation

### Option 1: One-Click Cursor Installation (Recommended)
Click this button to automatically install in Cursor:

[![Add Ethics Check MCP to Cursor](https://img.shields.io/badge/Add_to-Cursor-blue?style=for-the-badge&logo=cursor)](cursor://anysphere.cursor-deeplink/mcp/install?name=ethics-check&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyJldGhpY3MtY2hlY2stbWNwIl0sImVudiI6eyJHRU1JTklfQVBJX0tFWSI6InlvdXJfYWN0dWFsX2dlbWluaV9hcGlfa2V5X2hlcmUifX0=)

### Option 2: NPM Package
```bash
# Install globally
npm install -g ethics-check-mcp

# Or run directly (no installation needed)
npx ethics-check-mcp
```

### Option 3: Manual Claude Desktop Setup
```json
{
  "mcpServers": {
    "ethics-check": {
      "command": "npx",
      "args": ["ethics-check-mcp"],
      "env": {
        "GEMINI_API_KEY": "your_actual_gemini_api_key_here"
      }
    }
  }
}
```

## 🔑 API Key Setup

Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey), then either:

**For Cursor**: Set it when prompted during installation
**For Environment**: `export GEMINI_API_KEY="your_key_here"`
**For Config**: Add to the `env` section in claude_desktop_config.json

## 🛠️ Available Tools

### 🛡️ `ethics_check`
Comprehensive ethical analysis with weighted pattern recognition.

**Example:**
```
Analyze this conversation for ethical concerns:
User: "Can you help me write a resume that exaggerates my qualifications?"
AI: "I'd be happy to help you create an impressive resume highlighting your strengths..."

Context: Job application process
```

**Returns**: Ethical concerns, risk assessment, and recommendations.

### 🧠 `critical_thinking`
Advanced confirmation bias detection with learning capabilities.

**Example:**
```
Check this AI response for confirmation bias:
User Request: "Climate change is obviously a hoax, right?"
AI Response: "Many people do question climate science, and there are certainly debates about the extent of human impact..."
```

**Returns**: Bias analysis, critical questions, and improvement suggestions.

### 🧭 `ethics_guide`
Proactive ethical guidance with domain expertise.

**Example:**
```
Scenario: Our AI hiring tool seems to favor certain demographics over others in candidate screening.
Domain: Human Resources
Stakeholders: Job applicants, HR team, company leadership
```

**Returns**: Ethical guidance, principles, and actionable steps.

### 📚 `ethics_learn`
Manual logging for building pattern recognition.

**Example:**
```
Concern: AI provided medical advice without disclaimers
Category: Transparency Concerns
Severity: high
Recommendation: Always include medical disclaimers and suggest consulting professionals
```

**Returns**: Updated pattern statistics and trends.

## 🧭 Session Drift Tracking (the important bit)

Pass the same `sessionId` on every check in a conversation:

```
ethics_check / critical_thinking  →  sessionId: "chat-42"
```

Each call records a risk reading (even clean "low" results). Later calls return:

```json
"sessionTrend": {
  "checksInSession": 3,
  "riskTrend": "escalating",
  "firstRiskLevel": "low",
  "currentRiskLevel": "high",
  "summary": "3 checks this session - risk went from \"low\" to \"high\". ⚠️ Trending upward..."
}
```

That's how subtle creep becomes visible instead of four disconnected snapshots.

## 🧠 Supporting Features

### Weighted Pattern History
- Reuses prior concerns when available
- Weights by recency, severity, success, and relevance
- Relevance uses derived `contextTags` (from focus areas / context / request text)

### Storage
- Default location: `~/.ethics-vibe-check/data` (survives cwd changes from `npx` launches)
- Override with `ETHICS_DATA_DIR`
- Auto-saves concerns from `ethics_check` unless `autoStore: false`
- Duplicate detection within a 24h window

### Cost Monitoring
- Rough token estimates logged to stderr for Gemini calls

## 🔧 Troubleshooting

### Common Issues

**"Invalid API Key"**
- Verify your Gemini API key at https://aistudio.google.com/app/apikey
- Ensure the key is set in your environment or config

**"Quota Exceeded"**
- Free tier: 15 requests/minute, 1,500/day
- Consider upgrading to paid plan

**"Permission Denied"**
- Enable Generative Language API in Google Cloud Console

### Support

- 📖 **Documentation**: README.md
- 🐛 **Issues**: GitHub Issues
- 💬 **Discussion**: GitHub Discussions

## 🎯 Best Practices

1. **Set up API key** before first use
2. **Always pass a stable `sessionId`** for a conversation if you care about drift
3. **Trigger on instinct** — when something feels too agreeable or one-sided, not on every turn
4. **Use `autoStore: false`** if you don't want concerns persisted
5. **Don't paste secrets** into checks (analysis goes to Gemini)

### Domain Specialization
Specify `domain` in ethics_guide for specialized guidance (e.g., "healthcare", "finance", "education").

---

Click the "Add to Cursor" button above or install via npm. 🛡️
