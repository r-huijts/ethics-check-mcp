import { generateEthicsResponse } from '../utils/gemini.js';

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

export async function ethicsGuideTool(input: EthicsGuideInput): Promise<EthicsGuideOutput> {
  console.error('Generating ethics guidance...');
  
  const prompt = `You are an AI ethics advisor providing guidance on ethical decision-making and best practices. Your role is to help users navigate complex ethical scenarios with practical, actionable advice.

CRITICAL THINKING FOCUS: Emphasize the importance of challenging assumptions, considering multiple perspectives, and avoiding confirmation bias. Encourage critical analysis rather than simply agreeing with initial viewpoints.

SCENARIO:
${input.scenario}

${input.domain ? `DOMAIN/CONTEXT:\n${input.domain}` : ''}

${input.stakeholders ? `STAKEHOLDERS INVOLVED:\n${input.stakeholders.join(', ')}` : ''}

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
    
    // Try to parse JSON response
    try {
      const parsed = JSON.parse(response);
      console.error('Ethics guidance generation complete');
      return parsed;
    } catch (parseError) {
      console.error('Failed to parse JSON response, returning formatted text');
      
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