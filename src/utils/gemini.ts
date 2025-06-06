import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

export function initializeGemini(apiKey: string): void {
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }
  if (apiKey === 'your_actual_gemini_api_key_here' || apiKey === 'test_key') {
    throw new Error('Please set a valid Gemini API key in your .env file');
  }
  genAI = new GoogleGenerativeAI(apiKey);
}

export function getGeminiModel() {
  if (!genAI) {
    throw new Error('Gemini not initialized. Call initializeGemini first.');
  }
  // Use the latest gemini-2.0-flash model as shown in Google AI Studio
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

/**
 * Clean Gemini response by removing markdown code block formatting
 * Gemini 2.0-flash often wraps JSON responses in ```json``` blocks
 */
export function cleanGeminiJsonResponse(response: string): string {
  let cleanResponse = response.trim();
  
  // Remove markdown code block formatting if present
  if (cleanResponse.startsWith('```json')) {
    cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (cleanResponse.startsWith('```')) {
    cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }
  
  return cleanResponse.trim();
}

export async function generateEthicsResponse(prompt: string): Promise<string> {
  const model = getGeminiModel();
  
  // Simple token estimation for monitoring (rough approximation)
  const estimatedTokens = Math.ceil(prompt.length / 4); // ~4 chars per token average
  console.error(`📊 Estimated prompt tokens: ${estimatedTokens}`);
  
  try {
    console.error('Making Gemini API call with gemini-2.0-flash...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Log response length for monitoring
    const responseTokens = Math.ceil(text.length / 4);
    console.error(`📊 Estimated response tokens: ${responseTokens}, Total: ~${estimatedTokens + responseTokens}`);
    console.error('Gemini API call successful');
    return text;
  } catch (error) {
    console.error('Gemini API error details:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      // Quota exceeded errors (429)
      if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests') || errorMessage.includes('quota')) {
        if (errorMessage.includes('free_tier')) {
          throw new Error('Gemini API free tier quota exceeded. Please wait for quota reset (daily) or upgrade to a paid plan at https://ai.google.dev/pricing');
        }
        throw new Error('Gemini API quota exceeded. Please wait a few minutes and try again, or check your billing at https://console.cloud.google.com/billing');
      }
      
      // Authentication errors (401/403)
      if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        throw new Error('Invalid Gemini API key. Please check your API key at https://aistudio.google.com/app/apikey');
      }
      
      if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        throw new Error('Permission denied. Please check your Gemini API key permissions and ensure the Generative Language API is enabled.');
      }
      
      // Rate limiting (different from quota)
      if (errorMessage.includes('rate limit') || errorMessage.includes('RATE_LIMIT_EXCEEDED')) {
        throw new Error('Gemini API rate limit exceeded. Please wait a moment and try again.');
      }
      
      // Service unavailable
      if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) {
        throw new Error('Gemini API service temporarily unavailable. Please try again in a few minutes.');
      }
      
      // Network/timeout errors
      if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
        throw new Error('Gemini API request timed out. Please try again.');
      }
      
      if (errorMessage.includes('network') || errorMessage.includes('NETWORK_ERROR')) {
        throw new Error('Network error connecting to Gemini API. Please check your internet connection.');
      }
      
      // Model-specific errors
      if (errorMessage.includes('model not found') || errorMessage.includes('MODEL_NOT_FOUND')) {
        throw new Error('Gemini model not found. The gemini-2.0-flash model may not be available in your region.');
      }
      
      // Content filtering
      if (errorMessage.includes('SAFETY') || errorMessage.includes('content filter')) {
        throw new Error('Content was blocked by Gemini safety filters. Please rephrase your request.');
      }
      
      // Generic API errors
      if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
        throw new Error('Invalid request to Gemini API. Please check the input parameters.');
      }
    }
    
    // Fallback for unknown errors
    throw new Error(`Gemini API call failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or check your API configuration.`);
  }
} 