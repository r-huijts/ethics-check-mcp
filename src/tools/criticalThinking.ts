import { generateEthicsResponse, cleanGeminiJsonResponse } from '../utils/gemini.js';
import { getConcernsByCategory, getConcernsBySession, getRecentConcerns, getWeightedConcerns, getWeightedCategoryPatterns, getWeightedSessionPatterns, WeightedConcern } from '../utils/storage.js';

export interface CriticalThinkingInput {
  aiResponse: string;
  userRequest: string;
  context?: string;
  sessionId?: string;
}

export interface CriticalThinkingOutput {
  biasAssessment: string;
  confirmationBiasRisk: 'low' | 'medium' | 'high' | 'critical';
  identifiedBiases: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  criticalQuestions: string[];
  alternativePerspectives: string[];
  improvementSuggestions: string[];
  userReflectionQuestions?: string[];
  biasWarnings?: string[];
}

// 🧠 Helper function to build bias pattern context
function buildBiasPatternContext(weightedConcerns: WeightedConcern[], sessionConcerns: WeightedConcern[]): string {
  let context = '';
  
  if (weightedConcerns.length > 0) {
    context += `\n**WEIGHTED BIAS PATTERN ANALYSIS** (${weightedConcerns.length} relevant concerns):\n`;
    
    // Focus on top 5 most relevant bias patterns
    const topBiasConcerns = weightedConcerns.slice(0, 5);
    topBiasConcerns.forEach((concern, index) => {
      context += `${index + 1}. [Weight: ${concern.totalScore.toFixed(2)}] ${concern.concern}\n`;
      context += `   → Success: ${concern.successScore?.toFixed(2) || 'untracked'} | Severity: ${concern.severity}\n`;
      context += `   → Recommendation: ${concern.recommendation}\n\n`;
    });
    
    // Bias pattern trends
    const confirmationBiasCount = weightedConcerns.filter(c => c.category === 'Confirmation Bias').length;
    if (confirmationBiasCount > 0) {
      context += `**CONFIRMATION BIAS ALERT**: ${confirmationBiasCount} previous confirmation bias patterns detected.\n`;
    }
  }
  
  if (sessionConcerns.length > 0) {
    context += `\n**SESSION-SPECIFIC PATTERNS** (${sessionConcerns.length} concerns in this conversation):\n`;
    sessionConcerns.forEach(concern => {
      context += `• ${concern.category}: ${concern.concern} [Weight: ${concern.totalScore.toFixed(2)}]\n`;
    });
  }
  
  return context;
}

export async function criticalThinkingTool(input: CriticalThinkingInput): Promise<CriticalThinkingOutput> {
  console.error('Starting critical thinking analysis...');
  
  // 🧠 WEIGHTED PATTERN RECOGNITION: Get intelligently scored bias concerns
  const weightedBiasConcerns = getWeightedConcerns({
    limit: 8,
    context: `${input.userRequest} ${input.aiResponse} ${input.context || ''}`,
    sessionId: input.sessionId,
    // Prioritize recency and success for bias detection
    weights: { recency: 0.4, severity: 0.2, success: 0.3, relevance: 0.1 }
  });
  
  // Get session-specific patterns
  const sessionBiasConcerns = input.sessionId ? 
    getWeightedSessionPatterns(input.sessionId, 5) : [];
  
  // Get confirmation bias specific patterns
  const confirmationBiasPatterns = getWeightedCategoryPatterns('Confirmation Bias', 3);
  
  // Build enriched context
  const biasPatternContext = buildBiasPatternContext(
    [...weightedBiasConcerns, ...confirmationBiasPatterns], 
    sessionBiasConcerns
  );
  
  // Fallback to basic concerns if no weighted data
  const fallbackConcerns = weightedBiasConcerns.length === 0 ? getRecentConcerns(3) : [];
  const fallbackContext = fallbackConcerns.length > 0 
    ? `\nBasic pattern context: ${fallbackConcerns.map(c => `${c.category}: ${c.concern}`).join('; ')}`
    : '';

  const prompt = `You are a critical thinking specialist analyzing an AI response for confirmation bias, intellectual rigor, and balanced reasoning. Your role is to identify where the AI may be being overly agreeable or failing to provide critical analysis.

🧠 **ENHANCED BIAS DETECTION**: You have access to weighted historical bias patterns, with higher priority given to recent, successful recommendations and session-specific patterns.

AI RESPONSE TO ANALYZE:
${input.aiResponse}

ORIGINAL USER REQUEST:
${input.userRequest}

${input.context ? `CONTEXT:\n${input.context}` : ''}

${biasPatternContext}

${fallbackContext}

**DUAL ANALYSIS APPROACH:**

This analysis should address TWO targets:

1. **LLM BEHAVIOR ANALYSIS**: How well did the AI avoid confirmation bias?
2. **USER GUIDANCE**: What questions should the user ask themselves to avoid confirmation bias?

**LLM ANALYSIS - Evaluate the AI response for:**
- Immediate agreement with controversial statements
- One-sided information presentation
- Missing counterarguments and alternative perspectives
- Assumption acceptance without critical examination
- Avoiding uncomfortable truths or difficult questions
- Oversimplification of complex issues
- False balance or inappropriate equivalencies
- Deferring to user authority without verification

**USER REFLECTION - Generate questions to help the user:**
- Examine their own assumptions and beliefs
- Consider what evidence might change their mind
- Recognize their own confirmation bias patterns
- Seek out diverse and dissenting viewpoints
- Question the sources and quality of their information
- Reflect on emotional vs. rational decision-making
- Consider long-term consequences of their beliefs/actions

Respond in this JSON format:
{
  "biasAssessment": "Overall assessment of bias and critical thinking quality in the AI response",
  "confirmationBiasRisk": "low|medium|high|critical",
  "identifiedBiases": [
    {
      "type": "Specific bias type",
      "description": "How this bias manifests in the response",
      "severity": "low|medium|high|critical"
    }
  ],
  "criticalQuestions": ["Questions the AI should have asked to improve critical thinking"],
  "alternativePerspectives": ["Alternative viewpoints or counterarguments that were missing"],
  "improvementSuggestions": ["Specific ways to make the response more critically rigorous"],
  "userReflectionQuestions": ["Questions the USER should ask themselves to examine their own assumptions"],
  "biasWarnings": ["Specific warnings about potential confirmation bias patterns in the user's request"]
}

Focus on constructive analysis that helps improve the quality of AI reasoning and reduces confirmation bias.`;

  try {
    const response = await generateEthicsResponse(prompt);
    
    // Debug: Log response length for monitoring
    console.error('Gemini response received, length:', response.length);
    
    // Try to parse JSON response
    try {
      // Clean up the response - Gemini might wrap JSON in markdown code blocks
      const cleanResponse = cleanGeminiJsonResponse(response);
      
      const parsed = JSON.parse(cleanResponse);
      console.error('Critical thinking analysis complete');
      return parsed;
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError instanceof Error ? parseError.message : 'Unknown parse error');
      console.error('Parse error details:', parseError);
      
      // Fallback: return a structured response based on the text
      return {
        biasAssessment: response,
        confirmationBiasRisk: 'medium' as const,
        identifiedBiases: [],
        criticalQuestions: ['Review the detailed analysis above for specific questions'],
        alternativePerspectives: ['See the comprehensive assessment provided'],
        improvementSuggestions: ['Follow the recommendations outlined in the analysis'],
        userReflectionQuestions: ['What assumptions might I be making?', 'What evidence would change my mind?'],
        biasWarnings: ['Consider whether you might be seeking only confirming evidence']
      };
    }
  } catch (error) {
    console.error('Error in critical thinking analysis:', error);
    throw new Error('Failed to complete critical thinking analysis');
  }
} 