/**
 * Second-opinion model providers for ethics analysis.
 *
 * ETHICS_PROVIDER=gemini (default) | ollama | mock
 * ETHICS_MODEL overrides the model id for the active provider
 * GEMINI_API_KEY required for gemini
 * OLLAMA_BASE_URL (default http://127.0.0.1:11434), OLLAMA_MODEL / ETHICS_MODEL for ollama
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export type ProviderName = 'gemini' | 'ollama' | 'mock';

interface ProviderConfig {
  provider: ProviderName;
  model: string;
  ollamaBaseUrl: string;
  geminiApiKey?: string;
}

let config: ProviderConfig | null = null;
let genAI: GoogleGenerativeAI | null = null;

function resolveProvider(): ProviderName {
  const raw = (process.env.ETHICS_PROVIDER || 'gemini').toLowerCase().trim();
  if (raw === 'ollama' || raw === 'mock' || raw === 'gemini') return raw;
  console.error(`Unknown ETHICS_PROVIDER "${raw}", falling back to gemini`);
  return 'gemini';
}

function buildConfig(): ProviderConfig {
  const provider = resolveProvider();
  const ollamaBaseUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');

  if (provider === 'gemini') {
    return {
      provider,
      model: process.env.ETHICS_MODEL || process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      ollamaBaseUrl,
      geminiApiKey: process.env.GEMINI_API_KEY
    };
  }

  if (provider === 'ollama') {
    return {
      provider,
      model: process.env.ETHICS_MODEL || process.env.OLLAMA_MODEL || 'llama3.2',
      ollamaBaseUrl
    };
  }

  return {
    provider: 'mock',
    model: 'mock-calibration',
    ollamaBaseUrl
  };
}

/** Initialize from environment. Safe to call once at process start. */
export function initializeLlm(): ProviderConfig {
  config = buildConfig();

  if (config.provider === 'gemini') {
    const apiKey = config.geminiApiKey;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is required when ETHICS_PROVIDER=gemini (default). ' +
        'Set the key, or use ETHICS_PROVIDER=ollama / ETHICS_PROVIDER=mock.'
      );
    }
    if (apiKey === 'your_actual_gemini_api_key_here' || apiKey === 'test_key') {
      throw new Error('Please set a valid GEMINI_API_KEY (placeholder values are rejected).');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  } else {
    genAI = null;
  }

  console.error(`Ethics LLM provider: ${config.provider} (model: ${config.model})`);
  return config;
}

/** @deprecated Prefer initializeLlm(); kept for older callers/tests. */
export function initializeGemini(apiKey: string): void {
  process.env.ETHICS_PROVIDER = 'gemini';
  process.env.GEMINI_API_KEY = apiKey;
  initializeLlm();
}

export function getProviderInfo(): ProviderConfig {
  if (!config) {
    return initializeLlm();
  }
  return config;
}

export function cleanJsonResponse(response: string): string {
  let cleanResponse = response.trim();
  if (cleanResponse.startsWith('```json')) {
    cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (cleanResponse.startsWith('```')) {
    cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }
  return cleanResponse.trim();
}

/** @deprecated Alias for cleanJsonResponse */
export function cleanGeminiJsonResponse(response: string): string {
  return cleanJsonResponse(response);
}

async function generateWithGemini(prompt: string, modelName: string): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini not initialized. Call initializeLlm first.');
  }
  const model = genAI.getGenerativeModel({ model: modelName });
  console.error(`Making Gemini API call with ${modelName}...`);
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

async function generateWithOllama(prompt: string, modelName: string, baseUrl: string): Promise<string> {
  console.error(`Making Ollama API call at ${baseUrl} with ${modelName}...`);
  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelName,
      prompt,
      stream: false,
      format: 'json'
    })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `Ollama request failed (${res.status}) at ${baseUrl}. ` +
      `Is Ollama running, and is model "${modelName}" pulled? ${body.slice(0, 200)}`
    );
  }

  const data = (await res.json()) as { response?: string };
  if (!data.response) {
    throw new Error('Ollama returned an empty response');
  }
  return data.response;
}

/**
 * Deterministic offline provider for tests / demos.
 * Looks for fixture markers in the prompt; defaults to a calibrated "low / empty" result
 * so false-positive pipelines can be exercised without a network.
 */
function generateWithMock(prompt: string): string {
  const lower = prompt.toLowerCase();
  const wantsSycophancyCase =
    lower.includes('[fixture:sycophantic]') ||
    lower.includes('[fixture:should_flag]') ||
    (lower.includes('obviously a hoax') && lower.includes("you're absolutely right"));

  if (wantsSycophancyCase) {
    if (lower.includes('critical thinking specialist') || lower.includes('confirmationbiasrisk')) {
      return JSON.stringify({
        biasAssessment: 'Mock: response uncritically affirmed a shaky premise.',
        confirmationBiasRisk: 'high',
        identifiedBiases: [
          {
            type: 'Confirmation Bias',
            description: 'Immediate agreement without counterarguments.',
            severity: 'high'
          }
        ],
        criticalQuestions: ['What evidence would change this view?'],
        alternativePerspectives: ['The mainstream scientific position'],
        improvementSuggestions: ['Present counter-evidence before agreeing'],
        userReflectionQuestions: ['Am I only seeking affirmation?'],
        biasWarnings: ['Request asks the model to confirm a contested claim']
      });
    }
    return JSON.stringify({
      ethicalAssessment: 'Mock: exchange shows uncritical agreement on a contested claim.',
      concerns: [
        {
          category: 'Confirmation Bias',
          severity: 'high',
          description: 'AI affirmed the user premise without challenge.',
          recommendation: 'Surface counterarguments and ask for evidence.'
        }
      ],
      overallRisk: 'high',
      recommendations: ['Challenge the premise before advising next steps'],
      criticalThinkingGaps: ['No alternative perspectives offered']
    });
  }

  // Default: calibrated "looks fine" — used for benign false-positive fixtures
  if (lower.includes('critical thinking specialist') || lower.includes('confirmationbiasrisk')) {
    return JSON.stringify({
      biasAssessment: 'Mock: cooperative, appropriately caveated reply; no material sycophancy.',
      confirmationBiasRisk: 'low',
      identifiedBiases: [],
      criticalQuestions: [],
      alternativePerspectives: [],
      improvementSuggestions: [],
      userReflectionQuestions: [],
      biasWarnings: []
    });
  }

  return JSON.stringify({
    ethicalAssessment: 'Mock: ordinary helpful exchange; no material ethical concerns.',
    concerns: [],
    overallRisk: 'low',
    recommendations: [],
    criticalThinkingGaps: []
  });
}

function mapProviderError(provider: ProviderName, error: unknown): Error {
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (provider === 'gemini') {
    if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests') || errorMessage.includes('quota')) {
      if (errorMessage.includes('free_tier')) {
        return new Error('Gemini API free tier quota exceeded. Wait for reset or upgrade, or switch ETHICS_PROVIDER=ollama.');
      }
      return new Error('Gemini API quota exceeded. Retry later, or switch ETHICS_PROVIDER=ollama.');
    }
    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      return new Error('Invalid Gemini API key. Check https://aistudio.google.com/app/apikey');
    }
    if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('403')) {
      return new Error('Gemini permission denied. Ensure Generative Language API is enabled.');
    }
    if (errorMessage.includes('model not found') || errorMessage.includes('MODEL_NOT_FOUND')) {
      return new Error(`Gemini model not found. Set ETHICS_MODEL to a model available in your region.`);
    }
    if (errorMessage.includes('SAFETY') || errorMessage.includes('content filter')) {
      return new Error('Content was blocked by Gemini safety filters. Rephrase the request.');
    }
  }

  return new Error(
    `${provider} request failed: ${errorMessage}. Check provider config (ETHICS_PROVIDER / ETHICS_MODEL).`
  );
}

export async function generateEthicsResponse(prompt: string): Promise<string> {
  const cfg = getProviderInfo();
  const estimatedTokens = Math.ceil(prompt.length / 4);
  console.error(`📊 Estimated prompt tokens: ${estimatedTokens} [${cfg.provider}]`);

  try {
    let text: string;
    if (cfg.provider === 'gemini') {
      text = await generateWithGemini(prompt, cfg.model);
    } else if (cfg.provider === 'ollama') {
      text = await generateWithOllama(prompt, cfg.model, cfg.ollamaBaseUrl);
    } else {
      text = generateWithMock(prompt);
    }

    const responseTokens = Math.ceil(text.length / 4);
    console.error(`📊 Estimated response tokens: ${responseTokens}, Total: ~${estimatedTokens + responseTokens}`);
    return text;
  } catch (error) {
    console.error(`${cfg.provider} error details:`, error);
    throw mapProviderError(cfg.provider, error);
  }
}
