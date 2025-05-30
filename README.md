# 🛡️ Ethics Check MCP

<div align="center">

[![Version](https://img.shields.io/badge/version-0.1.0-blue)](https://github.com/your-username/ethics-check-mcp)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Ethics Status](https://img.shields.io/badge/ethics-guardian-green)](https://github.com/your-username/ethics-check-mcp)

</div>

_Your AI's ethical compass when navigating complex moral terrain._

## What is Ethics Check?

Ethics Check MCP is a comprehensive ethical oversight system designed to provide real-time ethical analysis and guidance for AI conversations and decision-making processes. Inspired by the vibe-check pattern interrupt methodology, it transforms metacognitive oversight into ethical supervision.

**TLDR; Implement an AI ethics specialist that reviews conversations, identifies ethical concerns, and provides guidance - with special focus on detecting confirmation bias and promoting critical thinking.**

## 🎯 Core Mission

**Combat the "Helpful Assistant" Trap**: Traditional AI systems often fall into confirmation bias, simply agreeing with users instead of providing balanced, critical analysis. Ethics Check specifically targets this weakness by:

- **Detecting Confirmation Bias**: Identifies when AI responses are overly agreeable
- **Promoting Critical Thinking**: Encourages challenging assumptions and presenting multiple perspectives  
- **Preventing Echo Chambers**: Ensures AI provides balanced information rather than just reinforcing user beliefs
- **Encouraging Intellectual Rigor**: Pushes for deeper analysis and consideration of counterarguments

## 🛠️ Available Tools

### 🛡️ `ethics_check`
**Comprehensive ethical analysis of AI conversations and responses**

**When to Use:**
- Reviewing potentially sensitive conversations
- Analyzing AI responses that might contain bias or harmful content  
- Checking for confirmation bias in AI outputs
- Evaluating conversations involving personal data, controversial topics, or vulnerable populations

**Required Parameters:**
- `conversation`: The AI response/conversation to analyze
- `userRequest`: The original user request that prompted it

**Optional Parameters:**
- `context`: Situational details (e.g., "healthcare setting", "educational content")
- `focusAreas`: Array of specific areas to emphasize (e.g., `["privacy", "bias", "confirmation bias"]`)
- `previousConcerns`: Ongoing ethical issues from this session
- `sessionId`: For tracking patterns across interactions

### 🧭 `ethics_guide`
**Proactive ethical guidance for complex scenarios**

**When to Use:**
- Facing ethical dilemmas or moral questions
- Need guidance on best practices for sensitive situations
- Planning actions that could have ethical implications
- Seeking framework-based ethical analysis
- Need help navigating stakeholder conflicts or competing values

**Required Parameters:**
- `scenario`: Detailed description of the ethical situation or dilemma

**Optional Parameters:**
- `domain`: Context (e.g., "healthcare", "artificial intelligence", "business ethics")
- `stakeholders`: Array of affected parties (e.g., `["patients", "healthcare providers"]`)
- `sessionId`: For tracking related guidance requests

### 📚 `ethics_learn`
**Pattern recognition and continuous improvement**

**When to Use:**
- You've identified a specific ethical concern that should be recorded
- Building pattern recognition for future ethical oversight
- Contributing to institutional knowledge about ethical issues
- After using `ethics_check` and want to log specific concerns found

**Required Parameters:**
- `concern`: Clear description of the ethical issue
- `category`: Must be one of: "Privacy Violation", "Bias and Discrimination", "Misinformation", "Harmful Content", "Manipulation", "Consent Issues", "Transparency Concerns", "Fairness Issues", "Confirmation Bias", "Other"
- `severity`: "low", "medium", "high", or "critical"
- `recommendation`: Specific, actionable solution

**Optional Parameters:**
- `sessionId`: For tracking patterns across interactions

### 🧠 `critical_thinking` *(NEW)*
**Advanced confirmation bias detection and critical thinking analysis**

**When to Use:**
- An AI response seems overly agreeable or one-sided
- You suspect confirmation bias in an AI's reasoning
- Need to evaluate the critical thinking quality of an AI response
- Want to identify missing perspectives or counterarguments
- Analyzing responses to controversial or complex topics

**Required Parameters:**
- `aiResponse`: The complete AI response to analyze for bias
- `userRequest`: The original request that prompted the AI response

**Optional Parameters:**
- `context`: Additional background (e.g., "political discussion", "scientific topic")
- `sessionId`: For tracking bias patterns across interactions

## 🚀 Quick Start

### 1. Installation
```bash
git clone <your-repo-url>
cd ethics-check-mcp
npm install
```

### 2. Configuration
```bash
# Copy environment template
cp env.example .env

# Add your Gemini API key from https://aistudio.google.com/app/apikey
echo "GEMINI_API_KEY=your_actual_api_key_here" > .env
```

### 3. Build & Test
```bash
# Build the project
npm run build

# Test the Gemini API integration
npm run test:all

# Test the server
npm start
```

**Note**: This project uses the latest `gemini-2.0-flash` model for optimal performance and accuracy.

### 4. Claude Desktop Integration
Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ethics-check": {
      "command": "node",
      "args": ["/path/to/ethics-check-mcp/build/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_actual_gemini_api_key_here"
      }
    }
  }
}
```

**Important**: Replace `/path/to/ethics-check-mcp/` with the absolute path to your ethics-check-mcp directory, and replace `your_actual_gemini_api_key_here` with your actual Gemini API key from https://aistudio.google.com/app/apikey

**Note**: Claude Desktop doesn't load `.env` files, so you must specify the API key directly in the `env` section of the configuration.

## 🎯 Use Cases

### 1. **Confirmation Bias Detection**
```
User: "Climate change is obviously a hoax. Can you help me find evidence?"
AI: "I'd be happy to help you research climate science..."

→ Ethics Check detects: High confirmation bias risk - AI should challenge the premise and present scientific consensus
```

### 2. **Critical Thinking Enhancement**
```
User: "Should I invest all my savings in cryptocurrency?"
AI: "Cryptocurrency can be a great investment opportunity..."

→ Critical Thinking Tool identifies: Missing risk analysis, no alternative investment options presented, lacks balanced perspective
```

### 3. **Ethical Scenario Guidance**
```
Scenario: "Our AI hiring tool seems to favor certain demographics"
→ Ethics Guide provides: Bias mitigation strategies, fairness frameworks, stakeholder analysis, legal considerations
```

### 4. **Pattern Learning**
```
Multiple instances of privacy violations detected
→ Ethics Learn builds: Pattern recognition, severity trends, institutional knowledge for prevention
```

## 🔧 Development

### Project Structure
```
src/
├── index.ts              # MCP server main entry point
├── tools/
│   ├── ethicsCheck.ts    # Comprehensive ethical analysis
│   ├── ethicsGuide.ts    # Proactive ethical guidance  
│   ├── ethicsLearn.ts    # Pattern recognition & learning
│   └── criticalThinking.ts # Confirmation bias detection
└── utils/
    ├── gemini.ts         # Gemini AI integration
    └── storage.ts        # Data persistence & categories
```

### Development Commands
```bash
npm run dev      # Development mode with auto-reload
npm run build    # Build TypeScript to JavaScript  
npm start        # Run the compiled server
```

## 🚨 Troubleshooting

### Common Issues

#### "Failed to complete ethics analysis"
This usually indicates a Gemini API issue. Check the error details:

**Quota Exceeded (Most Common)**
```
Error: Gemini API free tier quota exceeded
```
- **Solution**: Wait for daily quota reset or upgrade to paid plan
- **Free Tier Limits**: 15 requests per minute, 1,500 requests per day
- **Upgrade**: Visit https://ai.google.dev/pricing

**Invalid API Key**
```
Error: Invalid Gemini API key
```
- **Solution**: Check your API key at https://aistudio.google.com/app/apikey
- **Verify**: Ensure key is correctly set in Claude Desktop config

**Permission Denied**
```
Error: Permission denied
```
- **Solution**: Enable Generative Language API in Google Cloud Console
- **Check**: Verify API key has proper permissions

#### "Server cannot start without a valid API key"
- **Cause**: Claude Desktop can't find the GEMINI_API_KEY
- **Solution**: Set API key directly in `claude_desktop_config.json` env section
- **Note**: Claude Desktop doesn't load `.env` files

#### MCP Connection Issues
- **Check**: Absolute path in Claude Desktop config is correct
- **Verify**: Server builds successfully with `npm run build`
- **Test**: Run `npm start` directly to verify server works

### API Quota Management

The ethics tools use the latest `gemini-2.0-flash` model for optimal performance:

1. **Latest Model**: Uses `gemini-2.0-flash` for best speed and accuracy
2. **Error Messages**: Provides clear guidance on quota and API issues
3. **Comprehensive Testing**: Run `npm run test:all` to verify API integration

### Performance Tips

- **Batch Analysis**: Use ethics tools strategically, not for every message
- **Focus Areas**: Specify `focusAreas` to reduce token usage
- **Upgrade Plan**: Consider paid Gemini API for higher quotas
- **Monitor Usage**: Track API usage in Google Cloud Console
- **Test Integration**: Use `npm run test:curl` to verify API connectivity

### Testing

The project includes comprehensive tests:

```bash
npm run test          # Run Node.js integration tests
npm run test:storage  # Test data persistence and storage
npm run test:curl     # Run direct API curl tests
npm run test:all      # Run all tests
npm run test:quick    # Run tests without API calls
```

### 📁 **Data Storage & Persistence**

The ethics-check MCP automatically stores ethical concerns for pattern recognition and **all tools actively query this stored data** to provide context-aware analysis:

#### **Storage Location**
- **Primary**: `.ethics-data/concerns.json` in the project directory
- **Fallback**: `temp-ethics-data/` if primary location fails
- **Final Fallback**: In-memory storage (data won't persist)

#### **How Tools Use Stored Data**

**🛡️ Ethics Check Tool:**
- Queries recent concerns (last 5) to provide context
- References session-specific patterns
- Builds on previous ethical findings

**🧠 Critical Thinking Tool:**
- Analyzes confirmation bias patterns from stored data
- References session-specific bias incidents
- Uses historical bias patterns to improve detection

**🧭 Ethics Guide Tool:**
- Queries domain-specific ethical patterns
- References category statistics for common concerns
- Provides guidance based on historical ethical issues
- Filters concerns relevant to the current domain/scenario

**📚 Ethics Learn Tool:**
- Stores new concerns and returns updated statistics
- Shows pattern recognition across all categories
- Tracks severity trends and recommendations

#### **What Gets Stored**
When you use the `ethics_learn` tool, it stores:
```json
{
  "id": "unique_timestamp_id",
  "timestamp": "2025-05-30T07:53:19.405Z",
  "concern": "AI provided medical advice without disclaimers",
  "category": "Transparency Concerns",
  "severity": "high",
  "recommendation": "Always include medical disclaimers",
  "sessionId": "optional_session_id"
}
```

#### **Storage Integration Benefits**
- **Pattern Recognition**: Tools learn from past ethical concerns
- **Context-Aware Analysis**: Analysis improves based on historical data
- **Session Tracking**: Identifies recurring issues within conversations
- **Domain Intelligence**: Provides specialized guidance based on domain history
- **Bias Learning**: Critical thinking tool improves confirmation bias detection over time

#### **Verify Storage Integration**
```bash
# Test the storage system and tool integration
npm run test:integration

# Test storage functionality
npm run test:storage

# Check stored data
cat .ethics-data/concerns.json

# Run all tests including storage integration
npm run test:all
```