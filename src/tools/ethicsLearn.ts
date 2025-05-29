import { addEthicalConcern, getCategoryStats, ETHICAL_CATEGORIES, EthicalCategory } from '../utils/storage.js';

export interface EthicsLearnInput {
  concern: string;
  category: EthicalCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  sessionId?: string;
}

export interface EthicsLearnOutput {
  added: boolean;
  currentTally: number;
  topCategories: Array<{
    category: EthicalCategory;
    count: number;
    recentExample?: {
      concern: string;
      recommendation: string;
    };
  }>;
}

export async function ethicsLearnTool(input: EthicsLearnInput): Promise<EthicsLearnOutput> {
  console.error('Logging ethical concern...');
  
  // Validate category
  if (!ETHICAL_CATEGORIES.includes(input.category)) {
    throw new Error(`Invalid category. Must be one of: ${ETHICAL_CATEGORIES.join(', ')}`);
  }
  
  // Add the ethical concern
  const added = addEthicalConcern({
    concern: input.concern,
    category: input.category,
    severity: input.severity,
    recommendation: input.recommendation,
    sessionId: input.sessionId
  });
  
  // Get updated statistics
  const categoryStats = getCategoryStats();
  const currentCategory = categoryStats.find(stat => stat.category === input.category);
  const currentTally = currentCategory ? currentCategory.count : 0;
  
  // Format top categories for response
  const topCategories = categoryStats.slice(0, 5).map(stat => ({
    category: stat.category,
    count: stat.count,
    recentExample: stat.recentExample ? {
      concern: stat.recentExample.concern,
      recommendation: stat.recentExample.recommendation
    } : undefined
  }));
  
  console.error('Ethical concern logging complete');
  
  return {
    added,
    currentTally,
    topCategories
  };
} 