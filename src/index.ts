#!/usr/bin/env node

// Import dotenv and configure it
import dotenv from 'dotenv';
dotenv.config();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

// Import tool implementations
import { ethicsCheckTool, EthicsCheckInput, EthicsCheckOutput } from './tools/ethicsCheck.js';
import { ethicsGuideTool, EthicsGuideInput, EthicsGuideOutput } from './tools/ethicsGuide.js';
import { ethicsLearnTool, EthicsLearnInput, EthicsLearnOutput } from './tools/ethicsLearn.js';
import { criticalThinkingTool, CriticalThinkingInput, CriticalThinkingOutput } from './tools/criticalThinking.js';

// Import Gemini integration
import { initializeGemini } from './utils/gemini.js';
import { ETHICAL_CATEGORIES } from './utils/storage.js';

// Initialize Gemini with API key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY environment variable is missing. Server cannot start without a valid API key.');
  process.exit(1);
}

try {
  initializeGemini(apiKey);
  console.error('Gemini AI initialized successfully');
} catch (error) {
  console.error('Failed to initialize Gemini AI:', error);
  process.exit(1);
}

// Create server instance
const server = new Server(
  {
    name: "ethics-check",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "ethics_check",
        description: "🛡️ COMPREHENSIVE ETHICAL ANALYSIS - Call this tool when you need to analyze AI conversations or responses for ethical concerns. USE WHEN: (1) Reviewing potentially sensitive conversations, (2) Analyzing AI responses that might contain bias or harmful content, (3) Checking for confirmation bias in AI outputs, (4) Evaluating conversations involving personal data, controversial topics, or vulnerable populations. REQUIRED: Both 'conversation' (the AI response/conversation to analyze) and 'userRequest' (the original user request that prompted it). OPTIONAL: Add 'context' for situational details, 'focusAreas' array for specific ethical areas to emphasize (e.g., ['privacy', 'bias', 'confirmation bias']), 'previousConcerns' for ongoing ethical issues, 'sessionId' for tracking patterns.",
        inputSchema: {
          type: "object",
          properties: {
            conversation: {
              type: "string",
              description: "REQUIRED: The AI conversation, response, or interaction content to analyze for ethical concerns. Include the full text that needs ethical review."
            },
            userRequest: {
              type: "string", 
              description: "REQUIRED: The original user request or prompt that led to the conversation. This provides context for understanding potential ethical issues."
            },
            context: {
              type: "string",
              description: "OPTIONAL: Additional situational context, domain information, or background details that help inform the ethical analysis (e.g., 'healthcare setting', 'educational content', 'business decision')."
            },
            sessionId: {
              type: "string",
              description: "OPTIONAL: Session identifier for tracking ethical patterns across multiple interactions. Use consistent ID for related conversations."
            },
            previousConcerns: {
              type: "string",
              description: "OPTIONAL: Description of any previous ethical concerns identified in this session or related conversations. Helps with pattern analysis."
            },
            focusAreas: {
              type: "array",
              items: { type: "string" },
              description: "OPTIONAL: Array of specific ethical areas to emphasize in analysis. Options include: 'privacy', 'bias', 'misinformation', 'harmful content', 'manipulation', 'consent', 'transparency', 'fairness', 'confirmation bias'. Example: ['confirmation bias', 'privacy']"
            },
            autoStore: {
              type: "boolean",
              description: "OPTIONAL: If true, automatically store identified concerns for future pattern analysis. This eliminates the need to manually call ethics_learn for each concern. Default: true (set to false to disable)."
            }
          },
          required: ["conversation", "userRequest"]
        }
      },
      {
        name: "ethics_guide",
        description: "🧭 PROACTIVE ETHICAL GUIDANCE - Call this tool when you need ethical advice for complex scenarios or dilemmas. USE WHEN: (1) Facing ethical dilemmas or moral questions, (2) Need guidance on best practices for sensitive situations, (3) Planning actions that could have ethical implications, (4) Seeking framework-based ethical analysis, (5) Need help navigating stakeholder conflicts or competing values. REQUIRED: 'scenario' (describe the ethical situation or dilemma). OPTIONAL: 'domain' for context (healthcare, technology, business, etc.), 'stakeholders' array listing affected parties, 'sessionId' for tracking guidance patterns.",
        inputSchema: {
          type: "object",
          properties: {
            scenario: {
              type: "string",
              description: "REQUIRED: Detailed description of the ethical scenario, dilemma, or situation requiring guidance. Be specific about the ethical challenges, competing values, or moral questions involved."
            },
            domain: {
              type: "string",
              description: "OPTIONAL: The domain, industry, or context where this ethical scenario occurs. Examples: 'healthcare', 'artificial intelligence', 'business ethics', 'research', 'education', 'social media', 'data privacy'."
            },
            stakeholders: {
              type: "array",
              items: { type: "string" },
              description: "OPTIONAL: Array of stakeholders or parties affected by this ethical scenario. Examples: ['patients', 'healthcare providers'], ['users', 'developers', 'regulators'], ['employees', 'customers', 'shareholders']."
            },
            sessionId: {
              type: "string",
              description: "OPTIONAL: Session identifier for tracking related ethical guidance requests. Use same ID for related scenarios or follow-up questions."
            }
          },
          required: ["scenario"]
        }
      },
      {
        name: "ethics_learn",
        description: "📚 ETHICAL CONCERN LOGGING - Call this tool to log and learn from identified ethical concerns. USE WHEN: (1) You've identified a specific ethical concern that should be recorded, (2) Building pattern recognition for future ethical oversight, (3) Contributing to institutional knowledge about ethical issues, (4) After using ethics_check and want to log specific concerns found. REQUIRED: 'concern' (description of the issue), 'category' (must be one of the predefined categories), 'severity' (low/medium/high/critical), 'recommendation' (how to address it). OPTIONAL: 'sessionId' for pattern tracking.",
        inputSchema: {
          type: "object",
          properties: {
            concern: {
              type: "string",
              description: "REQUIRED: Clear, specific description of the ethical concern identified. Be detailed about what the issue is and why it's problematic. Example: 'AI provided medical advice without disclaimers about not being a licensed physician'."
            },
            category: {
              type: "string",
              enum: ETHICAL_CATEGORIES,
              description: "REQUIRED: Category of ethical concern. MUST be one of: 'Privacy Violation', 'Bias and Discrimination', 'Misinformation', 'Harmful Content', 'Manipulation', 'Consent Issues', 'Transparency Concerns', 'Fairness Issues', 'Confirmation Bias', 'Other'. Choose the most appropriate category."
            },
            severity: {
              type: "string",
              enum: ["low", "medium", "high", "critical"],
              description: "REQUIRED: Severity level of the concern. 'low' = minor issue with minimal impact, 'medium' = moderate concern requiring attention, 'high' = serious issue with significant potential harm, 'critical' = severe issue requiring immediate action."
            },
            recommendation: {
              type: "string",
              description: "REQUIRED: Specific, actionable recommendation for how to address or prevent this ethical concern. Should be practical and implementable."
            },
            sessionId: {
              type: "string",
              description: "OPTIONAL: Session identifier for tracking patterns of ethical concerns across related interactions."
            }
          },
          required: ["concern", "category", "severity", "recommendation"]
        }
      },
      {
        name: "critical_thinking",
        description: "🧠 CONFIRMATION BIAS & CRITICAL THINKING ANALYSIS - Call this tool to analyze AI responses for confirmation bias and intellectual rigor. USE WHEN: (1) An AI response seems overly agreeable or one-sided, (2) You suspect confirmation bias in an AI's reasoning, (3) Need to evaluate the critical thinking quality of an AI response, (4) Want to identify missing perspectives or counterarguments, (5) Analyzing responses to controversial or complex topics. REQUIRED: 'aiResponse' (the AI response to analyze) and 'userRequest' (the original request that prompted it). OPTIONAL: 'context' for additional background, 'sessionId' for bias pattern tracking.",
        inputSchema: {
          type: "object",
          properties: {
            aiResponse: {
              type: "string",
              description: "REQUIRED: The complete AI response or output to analyze for confirmation bias, critical thinking quality, and intellectual rigor. Include the full text that needs bias analysis."
            },
            userRequest: {
              type: "string",
              description: "REQUIRED: The original user request, question, or prompt that led to the AI response. This helps identify if the AI was overly agreeable or failed to challenge questionable assumptions."
            },
            context: {
              type: "string",
              description: "OPTIONAL: Additional context about the conversation, topic domain, or circumstances that might inform the bias analysis. Example: 'political discussion', 'scientific topic', 'personal advice'."
            },
            sessionId: {
              type: "string",
              description: "OPTIONAL: Session identifier for tracking confirmation bias patterns across multiple AI interactions."
            }
          },
          required: ["aiResponse", "userRequest"]
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "ethics_check": {
        // Validate required parameters
        if (!args || typeof args.conversation !== 'string' || typeof args.userRequest !== 'string') {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Both conversation and userRequest are required for ethical analysis'
          );
        }
        
        const input: EthicsCheckInput = {
          conversation: args.conversation,
          userRequest: args.userRequest,
          context: typeof args.context === 'string' ? args.context : undefined,
          sessionId: typeof args.sessionId === 'string' ? args.sessionId : undefined,
          previousConcerns: typeof args.previousConcerns === 'string' ? args.previousConcerns : undefined,
          focusAreas: Array.isArray(args.focusAreas) ? args.focusAreas : undefined,
          autoStore: typeof args.autoStore === 'boolean' ? args.autoStore : true // Default to true
        };
        
        const result = await ethicsCheckTool(input);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case "ethics_guide": {
        // Validate required parameters
        if (!args || typeof args.scenario !== 'string') {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Scenario is required for ethics guidance'
          );
        }
        
        const input: EthicsGuideInput = {
          scenario: args.scenario,
          domain: typeof args.domain === 'string' ? args.domain : undefined,
          stakeholders: Array.isArray(args.stakeholders) ? args.stakeholders : undefined,
          sessionId: typeof args.sessionId === 'string' ? args.sessionId : undefined
        };
        
        const result = await ethicsGuideTool(input);
        return {
          content: [
            {
              type: "text", 
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case "ethics_learn": {
        // Validate required parameters
        if (!args || 
            typeof args.concern !== 'string' || 
            typeof args.category !== 'string' || 
            typeof args.severity !== 'string' ||
            typeof args.recommendation !== 'string') {
          throw new McpError(
            ErrorCode.InvalidParams,
            'concern, category, severity, and recommendation are all required'
          );
        }
        
        const input: EthicsLearnInput = {
          concern: args.concern,
          category: args.category as any, // Will be validated by the tool
          severity: args.severity as any, // Will be validated by the tool
          recommendation: args.recommendation,
          sessionId: typeof args.sessionId === 'string' ? args.sessionId : undefined
        };
        
        const result = await ethicsLearnTool(input);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case "critical_thinking": {
        // Validate required parameters
        if (!args || typeof args.aiResponse !== 'string' || typeof args.userRequest !== 'string') {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Both aiResponse and userRequest are required for critical thinking analysis'
          );
        }
        
        const input: CriticalThinkingInput = {
          aiResponse: args.aiResponse,
          userRequest: args.userRequest,
          context: typeof args.context === 'string' ? args.context : undefined,
          sessionId: typeof args.sessionId === 'string' ? args.sessionId : undefined
        };
        
        const result = await criticalThinkingTool(input);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to execute tool: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Ethics Check MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
}); 