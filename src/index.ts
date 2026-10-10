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
import { ethicsFeedbackTool, EthicsFeedbackInput } from './tools/ethicsFeedback.js';

// Import second-opinion LLM + session helpers
import { initializeLlm, getProviderInfo } from './utils/llm.js';
import { resolveSessionId, getProcessSessionId } from './utils/session.js';
import { ETHICAL_CATEGORIES } from './utils/storage.js';

// Initialize second-opinion provider (gemini | ollama | mock)
try {
  initializeLlm();
  const info = getProviderInfo();
  console.error(`Default sessionId for this process: ${getProcessSessionId()}`);
  if (info.provider === 'mock') {
    console.error('NOTE: ETHICS_PROVIDER=mock is for tests/demos only — not production gut-checks.');
  }
} catch (error) {
  console.error('Failed to initialize ethics LLM provider:', error);
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
        description: "🛡️ CONVERSATION BIAS / ETHICS CHECK - User-triggered gut-check for unwanted bias, sycophancy, or ethical drift that may have crept into a conversation. CALL WHEN the user asks to sanity-check a response, play devil's advocate, re-examine assumptions, or check whether the AI has been too agreeable. Also useful for sensitive topics (privacy, vulnerable populations, controversial claims). REQUIRED: 'conversation' (the AI response/exchange to analyze) and 'userRequest' (the original request). Pass a stable 'sessionId' across checks in the same conversation so the tool can report whether risk is escalating, improving, or holding steady (sessionTrend).",
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
              description: "OPTIONAL: Stable identifier for this conversation. Reuse across checks for drift. If omitted, a process-scoped default is used (one MCP server process ≈ one chat)."
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
              description: "OPTIONAL: If true, store identified concerns for later weighting. Default: true (set to false to disable)."
            },
            priorFeedbackUseful: {
              type: "boolean",
              description: "OPTIONAL: When re-checking the same conversation, set true/false if the previous recommendation was useful. Updates successScore so future weighting prefers advice that actually helped."
            }
          },
          required: ["conversation", "userRequest"]
        }
      },
      {
        name: "ethics_guide",
        description: "🧭 ETHICAL GUIDANCE - User-triggered multi-framework advice for dilemmas or sticky decisions. CALL WHEN the user asks how to think through a moral/ethical situation, wants competing frameworks (utilitarian, deontological, virtue, care, justice), or needs help weighing stakeholder tradeoffs. REQUIRED: 'scenario'. OPTIONAL: 'domain', 'stakeholders', 'sessionId'.",
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
        description: "📚 MANUAL CONCERN LOGGING - Explicitly store a concern for later weighting. Usually unnecessary if ethics_check autoStore is on. USE WHEN the user wants to log something the automatic store missed. REQUIRED: concern, category, severity, recommendation. OPTIONAL: sessionId.",
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
        name: "ethics_feedback",
        description: "👍 RECOMMENDATION FEEDBACK - User-triggered thumbs-up/down on a prior ethics recommendation. CALL WHEN the user says a previous check was useful, not useful, too noisy, or actually helped. Updates successScore so later weighted retrieval prefers advice that worked. REQUIRED: 'useful' (boolean). OPTIONAL: 'concernId' (specific concern), 'sessionId' (defaults to latest concern in that session), 'note'.",
        inputSchema: {
          type: "object",
          properties: {
            useful: {
              type: "boolean",
              description: "REQUIRED: true if the prior recommendation helped; false if it was unhelpful or noisy."
            },
            concernId: {
              type: "string",
              description: "OPTIONAL: Specific concern id to rate. If omitted, rates the most recent concern (optionally scoped by sessionId)."
            },
            sessionId: {
              type: "string",
              description: "OPTIONAL: Limit 'most recent concern' lookup to this conversation session."
            },
            note: {
              type: "string",
              description: "OPTIONAL: Short note about why the feedback was given (logged only)."
            }
          },
          required: ["useful"]
        }
      },
      {
        name: "critical_thinking",
        description: "🧠 CONFIRMATION BIAS / CRITICAL THINKING CHECK - User-triggered analysis of whether an AI response was overly agreeable, one-sided, or skipped counterarguments. CALL WHEN the user asks to challenge the last answer, find missing perspectives, check for sycophancy, or verify intellectual rigor. REQUIRED: 'aiResponse' and 'userRequest'. Pass a stable 'sessionId' across checks in the same conversation so sessionTrend can report whether bias risk is escalating over the chat.",
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
              description: "OPTIONAL: Stable identifier for this conversation. Reuse across checks for drift. If omitted, a process-scoped default is used (one MCP server process ≈ one chat)."
            }
          },
          required: ["aiResponse", "userRequest"]
        }
      }
    ]
  };
});

// Handle tool calls
// @ts-expect-error TS2589 - MCP SDK CallToolRequestSchema triggers excessive type instantiation
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
          sessionId: resolveSessionId(typeof args.sessionId === 'string' ? args.sessionId : undefined),
          previousConcerns: typeof args.previousConcerns === 'string' ? args.previousConcerns : undefined,
          focusAreas: Array.isArray(args.focusAreas) ? args.focusAreas : undefined,
          autoStore: typeof args.autoStore === 'boolean' ? args.autoStore : true, // Default to true
          priorFeedbackUseful: typeof args.priorFeedbackUseful === 'boolean' ? args.priorFeedbackUseful : undefined
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
          sessionId: resolveSessionId(typeof args.sessionId === 'string' ? args.sessionId : undefined)
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
          sessionId: resolveSessionId(typeof args.sessionId === 'string' ? args.sessionId : undefined)
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

      case "ethics_feedback": {
        if (!args || typeof args.useful !== 'boolean') {
          throw new McpError(
            ErrorCode.InvalidParams,
            'useful (boolean) is required for ethics_feedback'
          );
        }

        const input: EthicsFeedbackInput = {
          useful: args.useful,
          concernId: typeof args.concernId === 'string' ? args.concernId : undefined,
          sessionId: resolveSessionId(typeof args.sessionId === 'string' ? args.sessionId : undefined),
          note: typeof args.note === 'string' ? args.note : undefined
        };

        const result = await ethicsFeedbackTool(input);
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
          sessionId: resolveSessionId(typeof args.sessionId === 'string' ? args.sessionId : undefined)
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