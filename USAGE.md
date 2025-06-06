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

## 🧠 Smart Features

### Weighted Pattern Recognition
- **Learns** from previous ethical concerns
- **Prioritizes** recent, severe, and successful patterns
- **Adapts** analysis based on context and session
- **Improves** recommendations over time

### Automatic Storage
- **Auto-saves** identified concerns by default
- **Prevents** duplicates with intelligent detection
- **Tracks** success rates of recommendations
- **Builds** institutional ethical knowledge

### Cost Monitoring
- **Estimates** token usage for Gemini API
- **Tracks** prompt and response sizes
- **Helps** optimize API costs

## 📊 Pattern Intelligence

The system gets smarter with use:

1. **Initial State**: Basic ethical analysis
2. **After 5-10 concerns**: Pattern recognition begins
3. **After 20+ concerns**: Intelligent weighting and context awareness
4. **Ongoing**: Continuous learning and adaptation

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
2. **Start with small tests** to verify functionality
3. **Use `autoStore: false`** if you don't want automatic learning
4. **Monitor token usage** for cost management
5. **Review stored patterns** periodically with pattern insights

## 🚀 Advanced Usage

### Custom Weighting
```javascript
// Focus on recent patterns for ongoing conversations
{ recency: 0.4, severity: 0.2, success: 0.3, relevance: 0.1 }

// Focus on proven successful recommendations
{ recency: 0.2, severity: 0.2, success: 0.5, relevance: 0.1 }
```

### Session Tracking
Use `sessionId` to track patterns within conversations and identify escalating ethical concerns.

### Domain Specialization
Specify `domain` in ethics_guide for specialized guidance (e.g., "healthcare", "finance", "education").

---

**Ready to enhance your AI's ethical capabilities?** 

Click the "Add to Cursor" button above or install via npm! 🛡️ 