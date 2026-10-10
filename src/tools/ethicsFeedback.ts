import { applyRecommendationFeedback } from '../utils/storage.js';

export interface EthicsFeedbackInput {
  useful: boolean;
  concernId?: string;
  sessionId?: string;
  note?: string;
}

export interface EthicsFeedbackOutput {
  updated: boolean;
  concernId?: string;
  successScore?: number;
  message: string;
}

/**
 * User-triggered: "that last pushback was useful / not useful."
 * Feeds successScore so later weighted retrieval prefers recommendations
 * that actually helped in practice.
 */
export async function ethicsFeedbackTool(input: EthicsFeedbackInput): Promise<EthicsFeedbackOutput> {
  console.error(`Recording recommendation feedback (useful=${input.useful})...`);

  const result = applyRecommendationFeedback({
    useful: input.useful,
    concernId: input.concernId,
    sessionId: input.sessionId
  });

  if (input.note) {
    console.error(`Feedback note: ${input.note}`);
  }

  return result;
}
