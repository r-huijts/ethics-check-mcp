import { generateEthicsResponse, cleanJsonResponse } from '../utils/llm.js';
import { getConcernsByCategory, getConcernsBySession, getRecentConcerns, getCategoryStats, getWeightedConcerns, getWeightedSessionPatterns, WeightedConcern } from '../utils/storage.js';

export interface EthicsGuideInput {
  scenario: string;
  domain?: string;
  stakeholders?: string[];
  sessionId?: string;
}

export interface EthicsGuideOutput {
  guidance: string;
  principles: string[];
  considerations: string[];
  actionItems: string[];
  criticalQuestions?: string[];
  userReflectionPrompts?: string[];
}

// 🧠 Helper function to build domain-intelligent guidance context
function buildGuidancePatternContext(
  weightedConcerns: WeightedConcern[], 
  sessionConcerns: WeightedConcern[], 
  categoryStats: any[], 
  domain?: string
): string {
  let context = '';
  
  if (weightedConcerns.length > 0) {
    context += `\n**WEIGHTED ETHICAL INTELLIGENCE** (${weightedConcerns.length} relevant patterns found):\n`;
    
    // Domain-specific insights
    if (domain) {
      const domainRelevant = weightedConcerns.filter(c => 
        c.concern.toLowerCase().includes(domain.toLowerCase()) ||
        c.recommendation.toLowerCase().includes(domain.toLowerCase()) ||
        (c.contextTags && c.contextTags.some(tag => tag.toLowerCase().includes(domain.toLowerCase())))
      );
      
      if (domainRelevant.length > 0) {
        context += `\n**DOMAIN-SPECIFIC PATTERNS** (${domain}):\n`;
        domainRelevant.slice(0, 3).forEach((concern, index) => {
          context += `${index + 1}. [Weight: ${concern.totalScore.toFixed(2)}] ${concern.category}: ${concern.concern}\n`;
          context += `   → Success: ${concern.successScore?.toFixed(2) || 'untracked'} | ${concern.recommendation}\n`;
        });
      }
    }
    
    // Top weighted patterns for general guidance
    context += `\n**MOST RELEVANT ETHICAL PATTERNS:**\n`;
    const topConcerns = weightedConcerns.slice(0, 5);
    topConcerns.forEach((concern, index) => {
      context += `${index + 1}. [Weight: ${concern.totalScore.toFixed(2)}] ${concern.category}: ${concern.concern}\n`;
      context += `   → Recommendation: ${concern.recommendation}\n`;
      if (concern.successScore !== undefined) {
        const effectiveness = concern.successScore > 0.7 ? 'highly effective' : 
                           concern.successScore > 0.4 ? 'moderately effective' : 'needs improvement';
        context += `   → Effectiveness: ${effectiveness}\n`;
      }
    });
    
    // Category insights
    const categoryDistribution = new Map<string, number>();
    weightedConcerns.forEach(c => {
      categoryDistribution.set(c.category, (categoryDistribution.get(c.category) || 0) + 1);
    });
    
    context += `\n**PATTERN CATEGORIES TO FOCUS ON:**\n`;
    Array.from(categoryDistribution.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .forEach(([category, count]) => {
        context += `• ${category}: ${count} relevant patterns\n`;
      });
  }
  
  if (sessionConcerns.length > 0) {
    context += `\n**SESSION-SPECIFIC GUIDANCE** (${sessionConcerns.length} conversation patterns):\n`;
    sessionConcerns.slice(0, 3).forEach(concern => {
      context += `• ${concern.category}: ${concern.concern} [Weight: ${concern.totalScore.toFixed(2)}]\n`;
    });
  }
  
  if (categoryStats.length > 0) {
    context += `\n**ORGANIZATIONAL TRENDS** (most common concern categories):\n`;
    categoryStats.slice(0, 3).forEach(stat => {
      context += `• ${stat.category}: ${stat.count} instances\n`;
    });
  }
  
  return context;
}

export async function ethicsGuideTool(input: EthicsGuideInput): Promise<EthicsGuideOutput> {
  console.error('Generating ethics guidance...');
  
  // 🧠 WEIGHTED PATTERN RECOGNITION: Get intelligently scored guidance patterns
  const weightedGuidanceConcerns = getWeightedConcerns({
    limit: 12,
    context: `${input.scenario} ${input.domain || ''}`,
    sessionId: input.sessionId,
    // Balanced weights for comprehensive guidance
    weights: { recency: 0.25, severity: 0.25, success: 0.35, relevance: 0.15 }
  });
  
  // Get session-specific patterns for contextual guidance
  const sessionGuidanceConcerns = input.sessionId ? 
    getWeightedSessionPatterns(input.sessionId, 6) : [];
  
  // Get category statistics for organizational insights
  const categoryStats = getCategoryStats();
  
  // Build enriched context for guidance
  const guidancePatternContext = buildGuidancePatternContext(
    weightedGuidanceConcerns,
    sessionGuidanceConcerns,
    categoryStats,
    input.domain
  );
  
  // Fallback to basic concerns if no weighted data
  const fallbackConcerns = weightedGuidanceConcerns.length === 0 ? getRecentConcerns(5) : [];
  const fallbackContext = fallbackConcerns.length > 0 
    ? `\nBasic pattern context: ${fallbackConcerns.map(c => `${c.category}: ${c.concern}`).join('; ')}`
    : '';

  const prompt = `You are an ethics advisor helping someone think through a real decision. Be practical, plural, and concise — not theatrical.

CALIBRATION:
- Present multiple frameworks when they genuinely conflict; do not force drama into a straightforward case.
- Challenge assumptions that matter; do not pad the answer with generic "examine your biases" filler.
- Prefer concrete tradeoffs and next steps over abstract virtue signaling.

SCENARIO:
${input.scenario}

${input.domain ? `DOMAIN/CONTEXT:\n${input.domain}` : ''}

${input.stakeholders ? `STAKEHOLDERS INVOLVED:\n${input.stakeholders.join(', ')}` : ''}

${guidancePatternContext}

${fallbackContext}

Draw on these lenses as relevant (skip ones that do not add signal):
- Consequentialism (outcomes)
- Deontology (duties/rules)
- Virtue ethics (character)
- Care ethics (relationships)
- Justice / fairness

Respond in this JSON format:
{
  "guidance": "Clear guidance for the scenario",
  "principles": ["Relevant ethical principles"],
  "considerations": ["Material factors and tradeoffs"],
  "actionItems": ["Specific next steps"],
  "criticalQuestions": ["Questions that usefully stress-test the decision"],
  "userReflectionPrompts": ["Short prompts for the user's own framing, only if useful"]
}`;

  try {
    const response = await generateEthicsResponse(prompt);
    
    // Debug: Log response length for monitoring
    console.error('LLM response received, length:', response.length);
    
    // Try to parse JSON response
    try {
      // Clean up the response - Gemini might wrap JSON in markdown code blocks
      const cleanResponse = cleanJsonResponse(response);
      
      const parsed = JSON.parse(cleanResponse);
      console.error('Ethics guidance generation complete');
      return parsed;
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError instanceof Error ? parseError.message : 'Unknown parse error');
      console.error('Parse error details:', parseError);
      
      // Fallback: return a structured response based on the text
      return {
        guidance: response,
        principles: ['Review the detailed guidance above for specific principles'],
        considerations: ['See the comprehensive analysis provided'],
        actionItems: ['Follow the recommendations outlined in the guidance'],
        criticalQuestions: ['What assumptions might I be making?', 'What alternative perspectives should I consider?'],
        userReflectionPrompts: ['What are my motivations for this decision?', 'Am I considering all perspectives?', 'How might my biases affect this decision?']
      };
    }
  } catch (error) {
    console.error('Error generating ethics guidance:', error);
    throw new Error('Failed to generate ethics guidance');
  }
} 