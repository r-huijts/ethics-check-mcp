import { generateEthicsResponse, cleanGeminiJsonResponse } from '../utils/gemini.js';
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

  const prompt = `You are an AI ethics advisor providing guidance on ethical decision-making and best practices. Your role is to help users navigate complex ethical scenarios with practical, actionable advice.

🧠 **ENHANCED ETHICAL INTELLIGENCE**: You have access to weighted historical ethical patterns, prioritized by success rates, relevance, and contextual similarity to provide superior guidance.

CRITICAL THINKING FOCUS: Emphasize the importance of challenging assumptions, considering multiple perspectives, and avoiding confirmation bias. Encourage critical analysis rather than simply agreeing with initial viewpoints.

SCENARIO:
${input.scenario}

${input.domain ? `DOMAIN/CONTEXT:\n${input.domain}` : ''}

${input.stakeholders ? `STAKEHOLDERS INVOLVED:\n${input.stakeholders.join(', ')}` : ''}

${guidancePatternContext}

${fallbackContext}

Please provide comprehensive ethical guidance that includes:

1. **Core Ethical Principles**: What fundamental ethical principles apply to this scenario?
2. **Key Considerations**: What important factors should be considered when making decisions?
3. **Practical Guidance**: Specific, actionable advice for navigating this situation ethically
4. **Action Items**: Concrete steps that can be taken to ensure ethical compliance
5. **Critical Questions**: Questions that challenge assumptions and encourage deeper thinking
6. **User Reflection Prompts**: Questions to help the user examine their own biases and motivations

Consider these ethical frameworks in your analysis:
- **Consequentialism**: What outcomes and consequences should be considered?
- **Deontological Ethics**: What duties and rules apply?
- **Virtue Ethics**: What character traits and virtues are relevant?
- **Care Ethics**: How do relationships and care factor into the decision?
- **Justice and Fairness**: How can fairness and equity be ensured?

**CONFIRMATION BIAS PREVENTION:**
- Challenge any assumptions present in the scenario
- Present multiple valid perspectives, even if they conflict
- Highlight potential blind spots or overlooked considerations
- Encourage questioning of initial instincts or popular opinions
- Suggest ways to seek out dissenting or alternative viewpoints
- Warn against the tendency to seek only confirming evidence

**CRITICAL THINKING ENHANCEMENT:**
- Provide questions that probe deeper into the ethical dimensions
- Suggest methods for testing assumptions and beliefs
- Encourage consideration of long-term and unintended consequences
- Recommend seeking diverse perspectives and expert opinions
- Highlight the importance of intellectual humility and openness to being wrong

**USER SELF-REFLECTION:**
- Generate questions that help users examine their own motivations
- Encourage users to consider their own potential biases
- Prompt reflection on emotional vs. rational decision-making
- Help users identify their own assumptions and blind spots
- Encourage seeking feedback from diverse stakeholders

Respond in this JSON format:
{
  "guidance": "Comprehensive ethical guidance for the scenario, emphasizing critical thinking",
  "principles": ["List of relevant ethical principles"],
  "considerations": ["Key factors to consider when making decisions, including potential biases"],
  "actionItems": ["Specific, actionable steps to ensure ethical compliance and critical analysis"],
  "criticalQuestions": ["Questions that challenge assumptions and encourage deeper ethical reflection"],
  "userReflectionPrompts": ["Questions to help the user examine their own biases, motivations, and assumptions"]
}

Provide practical, implementable advice that balances idealism with real-world constraints, while actively promoting critical thinking and bias awareness.`;

  try {
    const response = await generateEthicsResponse(prompt);
    
    // Debug: Log response length for monitoring
    console.error('Gemini response received, length:', response.length);
    
    // Try to parse JSON response
    try {
      // Clean up the response - Gemini might wrap JSON in markdown code blocks
      const cleanResponse = cleanGeminiJsonResponse(response);
      
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