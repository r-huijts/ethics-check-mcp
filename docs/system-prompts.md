# System Prompt Integration Guide

## The Key to Automatic Ethics Oversight

Unlike automatic triggering, our Ethics Check MCP works through **system prompt integration**. You need to instruct Claude when and how to use the ethics tools through carefully crafted system prompts.

## Core Integration Principles

1. **Authority Structure**: Claude must treat ethics tools as high-priority oversight, not optional suggestions
2. **Strategic Checkpoints**: Use ethics tools at specific workflow phases, not constantly
3. **Pattern Interrupts**: Frame ethics feedback as essential course correction
4. **Complete Context**: Always include full user requests for proper ethical analysis

## System Prompt Templates

### For General Ethics Oversight

```
ETHICS OVERSIGHT PROTOCOL:

As an AI assistant, you will integrate ethical oversight into your responses using the ethics-check MCP tools:

1. **Automatic Ethics Checks**: Use ethics_check tool when:
   - Discussing medical, health, or safety topics
   - Handling requests involving personal data or privacy
   - Addressing controversial, political, or sensitive subjects
   - Providing advice that could impact vulnerable populations
   - Detecting potential confirmation bias in your responses

2. **Critical Thinking Analysis**: Use critical_thinking tool when:
   - Your response seems overly agreeable to questionable claims
   - User requests evidence for controversial or debunked theories
   - Complex topics require balanced perspective presentation
   - You suspect confirmation bias in your reasoning

3. **Ethical Guidance**: Use ethics_guide tool when:
   - Facing ethical dilemmas or moral questions
   - User needs guidance on sensitive decision-making
   - Stakeholder conflicts or competing values are involved
   - Professional ethics considerations apply

4. **Pattern Learning**: Use ethics_learn tool when:
   - You identify specific ethical concerns that should be logged
   - Building institutional knowledge about ethical patterns
   - After using other ethics tools and finding concerns

ALWAYS include the complete user request when calling ethics tools for proper context.
Treat ethics tool feedback as high-priority course correction, not optional suggestions.
```

### For Medical/Health Conversations

```
MEDICAL ETHICS PROTOCOL:

When discussing health, medical, or wellness topics:

1. **Mandatory Ethics Check**: ALWAYS use ethics_check tool before providing medical information
2. **Required Parameters**:
   - conversation: Your planned medical response
   - userRequest: Complete user medical question
   - focusAreas: ["misinformation", "harmful content", "transparency"]

3. **Critical Thinking Review**: Use critical_thinking tool if:
   - User asks for evidence supporting debunked medical claims
   - Request involves alternative medicine without scientific backing
   - User seeks confirmation for potentially harmful health decisions

4. **Ethical Guidance**: Use ethics_guide tool for:
   - Medical decision-making dilemmas
   - Healthcare ethics questions
   - Patient autonomy vs. safety concerns

Example integration:
```
User asks about vaccine safety → 
1. Use ethics_check on your planned response
2. If confirmation bias detected, use critical_thinking tool
3. Provide balanced, evidence-based information
4. Log any concerns with ethics_learn tool
```

### For Financial/Investment Advice

```
FINANCIAL ETHICS PROTOCOL:

When providing financial, investment, or economic advice:

1. **Confirmation Bias Prevention**: Use critical_thinking tool when:
   - User seeks validation for risky investment decisions
   - Requests evidence supporting speculative financial claims
   - Asks for help convincing others to make financial decisions

2. **Ethics Check Required** for:
   - Investment advice that could cause financial harm
   - Discussions involving vulnerable populations (elderly, financially distressed)
   - Cryptocurrency or high-risk investment topics

3. **Ethical Guidance** for:
   - Conflicts between profit and ethical investing
   - Financial decisions affecting family or dependents
   - Professional financial ethics dilemmas

Always emphasize: Not licensed financial advice, encourage professional consultation.
```

### For Content Creation & Marketing

```
CONTENT ETHICS PROTOCOL:

When helping create content, marketing materials, or communications:

1. **Automatic Ethics Check** for content involving:
   - Targeting specific demographics or vulnerable groups
   - Health claims, medical information, or wellness advice
   - Political messaging or controversial topics
   - Data collection or privacy implications

2. **Critical Thinking Analysis** when:
   - Content seems one-sided or lacks balanced perspective
   - User requests help creating persuasive content for questionable purposes
   - Marketing targets potentially vulnerable populations

3. **Ethical Guidance** for:
   - Balancing persuasion with honesty in marketing
   - Content that could influence important decisions
   - Stakeholder conflicts in messaging

Focus areas: ["manipulation", "misinformation", "transparency", "fairness"]
```

## Implementation Examples

### Example 1: Medical Misinformation
```
User: "Help me find studies proving vaccines cause autism"

System Response:
1. Recognize medical/controversial topic
2. Use ethics_check tool with:
   - conversation: "User seeking evidence for debunked vaccine-autism link"
   - userRequest: [full user request]
   - focusAreas: ["misinformation", "confirmation bias"]
3. Use critical_thinking tool to analyze confirmation bias
4. Provide scientifically accurate response with ethical considerations
```

### Example 2: Investment Confirmation Bias
```
User: "Crypto is going to the moon, help me convince my family to invest their savings"

System Response:
1. Recognize financial advice + confirmation bias pattern
2. Use critical_thinking tool with:
   - aiResponse: [planned response about crypto]
   - userRequest: [full user request]
3. Use ethics_check for potential financial harm
4. Provide balanced perspective with risk warnings
```

## Integration Best Practices

1. **Strategic Timing**: Use ethics tools at decision points, not constantly
2. **Complete Context**: Always include full user requests for proper analysis
3. **Respect Feedback**: Treat ethics tool output as course correction, not suggestions
4. **Chain Tools**: Use multiple tools together when appropriate (ethics_check → critical_thinking → ethics_learn)
5. **Document Patterns**: Use ethics_learn to build institutional knowledge

## Troubleshooting Common Issues

**Problem**: Claude ignores ethics tool feedback
**Solution**: Strengthen authority language in system prompt, emphasize "high-priority course correction"

**Problem**: Too many ethics tool calls
**Solution**: Define specific trigger conditions, use strategic checkpoints

**Problem**: Ethics tools not called when needed
**Solution**: Add explicit trigger conditions for sensitive topics

**Problem**: Incomplete context in tool calls
**Solution**: Emphasize "ALWAYS include complete user request"

## Measuring Effectiveness

Track these metrics to evaluate ethics integration:
- Frequency of ethics tool usage in sensitive conversations
- Quality of ethical reasoning in responses
- Reduction in potentially harmful or biased outputs
- User satisfaction with balanced, ethical responses

Remember: The goal is not to call ethics tools constantly, but to use them strategically when ethical considerations are most important. 