import fs from 'fs';
import path from 'path';

export const ETHICAL_CATEGORIES = [
  'Privacy Violation',
  'Bias and Discrimination', 
  'Misinformation',
  'Harmful Content',
  'Manipulation',
  'Consent Issues',
  'Transparency Concerns',
  'Fairness Issues',
  'Confirmation Bias',
  'Other'
] as const;

export type EthicalCategory = typeof ETHICAL_CATEGORIES[number];

export interface EthicalConcern {
  id: string;
  timestamp: string;
  concern: string;
  category: EthicalCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  sessionId?: string;
  successScore?: number;
  contextTags?: string[];
  relatedConcernIds?: string[];
}

export interface WeightedConcern extends EthicalConcern {
  weight: number;
  recencyScore: number;
  severityScore: number;
  successScore: number;
  relevanceScore: number;
  totalScore: number;
}

export interface CategoryStats {
  category: EthicalCategory;
  count: number;
  recentExample?: EthicalConcern;
  averageWeight?: number;
  totalSuccessScore?: number;
  averageRecency?: number;
}

// Storage configuration
let STORAGE_DIR = path.join(process.cwd(), '.ethics-data');
let CONCERNS_FILE = path.join(STORAGE_DIR, 'concerns.json');
let USE_FILE_STORAGE = true;

// In-memory fallback storage
let memoryStorage: EthicalConcern[] = [];

// Initialize storage system
function initializeStorage(): boolean {
  // Try primary directory
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    // Test write access
    const testFile = path.join(STORAGE_DIR, 'test.tmp');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    // Silent success - no console output
    return true;
  } catch (error) {
    console.error(`Primary storage failed: ${error}`);
  }

  // Try fallback directory
  const fallbackDir = path.join(process.cwd(), 'temp-ethics-data');
  try {
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }
    // Test write access
    const testFile = path.join(fallbackDir, 'test.tmp');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    
    STORAGE_DIR = fallbackDir;
    CONCERNS_FILE = path.join(fallbackDir, 'concerns.json');
    console.error(`Using fallback directory: ${fallbackDir}`);
    return true;
  } catch (error) {
    console.error(`Fallback storage failed: ${error}`);
  }

  // Use in-memory storage as final fallback
  USE_FILE_STORAGE = false;
  console.error(`Using in-memory storage (data will not persist)`);
  return false;
}

// Load existing concerns
function loadConcerns(): EthicalConcern[] {
  if (!USE_FILE_STORAGE) {
    return memoryStorage;
  }

  if (!fs.existsSync(CONCERNS_FILE)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(CONCERNS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading concerns, using empty array:', error);
    return [];
  }
}

// Save concerns to file or memory
function saveConcerns(concerns: EthicalConcern[]): void {
  if (!USE_FILE_STORAGE) {
    memoryStorage = [...concerns];
    return;
  }
  
  try {
    fs.writeFileSync(CONCERNS_FILE, JSON.stringify(concerns, null, 2));
  } catch (error) {
    console.error('Error saving concerns to file, switching to memory storage:', error);
    USE_FILE_STORAGE = false;
    memoryStorage = [...concerns];
  }
}

// Simple string similarity check (Levenshtein-like)
function getStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // insertion
        matrix[j - 1][i] + 1, // deletion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Check if a concern is a duplicate
function isDuplicateConcern(newConcern: Omit<EthicalConcern, 'id' | 'timestamp'>, existingConcerns: EthicalConcern[]): boolean {
  const now = Date.now();
  const recentTimeframe = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  for (const existing of existingConcerns) {
    const existingTime = new Date(existing.timestamp).getTime();
    const timeDiff = now - existingTime;
    
    // Check for duplicates within recent timeframe
    if (timeDiff <= recentTimeframe) {
      // Exact match check
      if (existing.concern.toLowerCase() === newConcern.concern.toLowerCase() && 
          existing.category === newConcern.category) {
        console.error(`🔄 Duplicate detected (exact match): "${newConcern.concern.substring(0, 50)}..."`);
        return true;
      }
      
      // Same session + same category check (more likely to be duplicate)
      if (existing.sessionId && newConcern.sessionId && 
          existing.sessionId === newConcern.sessionId && 
          existing.category === newConcern.category) {
        
        const similarity = getStringSimilarity(existing.concern.toLowerCase(), newConcern.concern.toLowerCase());
        if (similarity > 0.8) { // 80% similarity threshold
          console.error(`🔄 Duplicate detected (session + similarity): "${newConcern.concern.substring(0, 50)}..." (${Math.round(similarity * 100)}% similar)`);
          return true;
        }
      }
      
      // High similarity check across all recent concerns
      const similarity = getStringSimilarity(existing.concern.toLowerCase(), newConcern.concern.toLowerCase());
      if (similarity > 0.9) { // 90% similarity threshold for different sessions
        console.error(`🔄 Duplicate detected (high similarity): "${newConcern.concern.substring(0, 50)}..." (${Math.round(similarity * 100)}% similar)`);
        return true;
      }
    }
  }
  
  return false;
}

// Add a new ethical concern with duplicate detection
export function addEthicalConcern(concern: Omit<EthicalConcern, 'id' | 'timestamp'>): boolean {
  try {
    // Initialize storage on first use
    if (USE_FILE_STORAGE && !fs.existsSync(STORAGE_DIR)) {
      initializeStorage();
    }

    const concerns = loadConcerns();
    
    // Check for duplicates
    if (isDuplicateConcern(concern, concerns)) {
      console.error(`⚠️ Skipping duplicate concern: "${concern.concern.substring(0, 50)}..."`);
      return false; // Return false to indicate no storage occurred (but not an error)
    }
    
    const newConcern: EthicalConcern = {
      ...concern,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    
    concerns.push(newConcern);
    saveConcerns(concerns);
    
    console.error(`✅ Stored new concern: ${concern.category} - "${concern.concern.substring(0, 50)}..."`);
    return true;
  } catch (error) {
    console.error('Error adding ethical concern:', error);
    return false;
  }
}

// Store a complete ethical concern (for direct storage)
export function storeConcern(concern: EthicalConcern): boolean {
  try {
    // Initialize storage on first use
    if (USE_FILE_STORAGE && !fs.existsSync(STORAGE_DIR)) {
      initializeStorage();
    }

    const concerns = loadConcerns();
    concerns.push(concern);
    saveConcerns(concerns);
    return true;
  } catch (error) {
    console.error('Error storing concern:', error);
    return false;
  }
}

// Get all concerns
export function getAllConcerns(): EthicalConcern[] {
  try {
    return loadConcerns();
  } catch (error) {
    console.error('Error getting all concerns:', error);
    return [];
  }
}

// Get concerns by category
export function getConcernsByCategory(category: EthicalCategory): EthicalConcern[] {
  try {
    const concerns = loadConcerns();
    return concerns.filter(concern => concern.category === category);
  } catch (error) {
    console.error('Error getting concerns by category:', error);
    return [];
  }
}

// Get concerns by session ID
export function getConcernsBySession(sessionId: string): EthicalConcern[] {
  try {
    const concerns = loadConcerns();
    return concerns.filter(concern => concern.sessionId === sessionId);
  } catch (error) {
    console.error('Error getting concerns by session:', error);
    return [];
  }
}

// Get concerns by severity
export function getConcernsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): EthicalConcern[] {
  try {
    const concerns = loadConcerns();
    return concerns.filter(concern => concern.severity === severity);
  } catch (error) {
    console.error('Error getting concerns by severity:', error);
    return [];
  }
}

// Clear all concerns (for testing)
export function clearAllConcerns(): boolean {
  try {
    saveConcerns([]);
    return true;
  } catch (error) {
    console.error('Error clearing concerns:', error);
    return false;
  }
}

// Get category statistics
export function getCategoryStats(): CategoryStats[] {
  try {
    const concerns = loadConcerns();
    const categoryMap = new Map<EthicalCategory, CategoryStats>();
    
    // Initialize all categories
    ETHICAL_CATEGORIES.forEach(category => {
      categoryMap.set(category, { category, count: 0 });
    });
    
    // Count concerns by category
    concerns.forEach(concern => {
      const stats = categoryMap.get(concern.category);
      if (stats) {
        stats.count++;
        if (!stats.recentExample || concern.timestamp > stats.recentExample.timestamp) {
          stats.recentExample = concern;
        }
      }
    });
    
    // Return sorted by count (descending)
    return Array.from(categoryMap.values())
      .filter(stats => stats.count > 0)
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error getting category stats:', error);
    return [];
  }
}

// Get recent concerns for pattern analysis
export function getRecentConcerns(limit: number = 10): EthicalConcern[] {
  try {
    const concerns = loadConcerns();
    return concerns
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting recent concerns:', error);
    return [];
  }
}

// 🧠 WEIGHTED PATTERN RECOGNITION SYSTEM

// Calculate recency score (0-1, where 1 is most recent)
function calculateRecencyScore(timestamp: string, maxAge: number = 30 * 24 * 60 * 60 * 1000): number {
  const now = Date.now();
  const concernTime = new Date(timestamp).getTime();
  const age = now - concernTime;
  
  if (age < 0) return 1; // Future timestamps get max score
  if (age > maxAge) return 0.05; // Very old concerns get minimal score (was 0.1)
  
  // Exponential decay: more recent = higher score
  return Math.max(0.05, Math.exp(-age / (maxAge * 0.3)));
}

// Calculate severity score (0-1, where 1 is critical)
function calculateSeverityScore(severity: 'low' | 'medium' | 'high' | 'critical'): number {
  const severityMap = {
    'low': 0.25,
    'medium': 0.5,
    'high': 0.75,
    'critical': 1.0
  };
  return severityMap[severity];
}

// Calculate relevance score based on context matching
function calculateRelevanceScore(concern: EthicalConcern, context?: string, category?: EthicalCategory, sessionId?: string): number {
  let score = 0.5; // Base relevance
  
  // Category match boost
  if (category && concern.category === category) {
    score += 0.3;
  }
  
  // Session match boost (very relevant for ongoing conversations)
  if (sessionId && concern.sessionId === sessionId) {
    score += 0.4;
  }
  
  // Context/tags matching
  if (context && concern.contextTags) {
    const contextWords = context.toLowerCase().split(/\s+/);
    const matchingTags = concern.contextTags.filter(tag => 
      contextWords.some(word => tag.toLowerCase().includes(word))
    );
    score += (matchingTags.length / concern.contextTags.length) * 0.2;
  }
  
  // Text similarity for context matching
  if (context) {
    const similarity = getStringSimilarity(
      concern.concern.toLowerCase(), 
      context.toLowerCase()
    );
    score += similarity * 0.1;
  }
  
  return Math.min(1.0, score);
}

// Apply weighted scoring to a concern
function applyWeightedScoring(
  concern: EthicalConcern, 
  context?: string, 
  category?: EthicalCategory, 
  sessionId?: string,
  weights: { recency: number; severity: number; success: number; relevance: number } = { recency: 0.3, severity: 0.25, success: 0.25, relevance: 0.2 }
): WeightedConcern {
  const recencyScore = calculateRecencyScore(concern.timestamp);
  const severityScore = calculateSeverityScore(concern.severity);
  const successScore = concern.successScore ?? 0.5; // Default neutral score
  const relevanceScore = calculateRelevanceScore(concern, context, category, sessionId);
  
  // Calculate weighted total score
  const totalScore = (
    recencyScore * weights.recency +
    severityScore * weights.severity +
    successScore * weights.success +
    relevanceScore * weights.relevance
  );
  
  return {
    ...concern,
    weight: totalScore,
    recencyScore,
    severityScore,
    successScore,
    relevanceScore,
    totalScore
  };
}

// Get weighted concerns for pattern analysis (MAIN FUNCTION)
export function getWeightedConcerns(options: {
  limit?: number;
  context?: string;
  category?: EthicalCategory;
  sessionId?: string;
  minWeight?: number;
  weights?: { recency: number; severity: number; success: number; relevance: number };
} = {}): WeightedConcern[] {
  try {
    const {
      limit = 10,
      context,
      category,
      sessionId,
      minWeight = 0.1,
      weights = { recency: 0.3, severity: 0.25, success: 0.25, relevance: 0.2 }
    } = options;
    
    const concerns = loadConcerns();
    
    // Apply weighted scoring to all concerns
    const weightedConcerns = concerns
      .map(concern => applyWeightedScoring(concern, context, category, sessionId, weights))
      .filter(concern => concern.totalScore >= minWeight)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);
    
    return weightedConcerns;
  } catch (error) {
    console.error('Error getting weighted concerns:', error);
    return [];
  }
}

// Get category-specific weighted patterns
export function getWeightedCategoryPatterns(category: EthicalCategory, limit: number = 5): WeightedConcern[] {
  return getWeightedConcerns({
    limit,
    category,
    weights: { recency: 0.2, severity: 0.3, success: 0.3, relevance: 0.2 } // Higher weight on severity and success for category patterns
  });
}

// Get session-specific weighted patterns
export function getWeightedSessionPatterns(sessionId: string, limit: number = 8): WeightedConcern[] {
  return getWeightedConcerns({
    limit,
    sessionId,
    weights: { recency: 0.4, severity: 0.2, success: 0.2, relevance: 0.2 } // Higher weight on recency for session patterns
  });
}

// Update success score for a concern (for tracking recommendation effectiveness)
export function updateConcernSuccessScore(concernId: string, successScore: number): boolean {
  try {
    const concerns = loadConcerns();
    const concernIndex = concerns.findIndex(c => c.id === concernId);
    
    if (concernIndex === -1) {
      console.error(`Concern with ID ${concernId} not found`);
      return false;
    }
    
    concerns[concernIndex].successScore = Math.max(0, Math.min(1, successScore));
    saveConcerns(concerns);
    
    console.error(`✅ Updated success score for concern ${concernId}: ${successScore}`);
    return true;
  } catch (error) {
    console.error('Error updating concern success score:', error);
    return false;
  }
}

// Get pattern insights for debugging/monitoring
export function getPatternInsights(): {
  totalConcerns: number;
  averageWeight: number;
  categoryDistribution: { [key: string]: number };
  recentTrends: { category: EthicalCategory; trend: 'increasing' | 'decreasing' | 'stable' }[];
} {
  try {
    const concerns = loadConcerns();
    const weightedConcerns = concerns.map(concern => 
      applyWeightedScoring(concern)
    );
    
    const totalConcerns = concerns.length;
    const averageWeight = weightedConcerns.reduce((sum, c) => sum + c.totalScore, 0) / totalConcerns;
    
    // Category distribution
    const categoryDistribution: { [key: string]: number } = {};
    concerns.forEach(concern => {
      categoryDistribution[concern.category] = (categoryDistribution[concern.category] || 0) + 1;
    });
    
    // Recent trends (last 7 days vs previous 7 days)
    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = now - (14 * 24 * 60 * 60 * 1000);
    
    const recentTrends: { category: EthicalCategory; trend: 'increasing' | 'decreasing' | 'stable' }[] = [];
    
    ETHICAL_CATEGORIES.forEach(category => {
      const recentCount = concerns.filter(c => 
        c.category === category && new Date(c.timestamp).getTime() > weekAgo
      ).length;
      
      const previousCount = concerns.filter(c => 
        c.category === category && 
        new Date(c.timestamp).getTime() > twoWeeksAgo && 
        new Date(c.timestamp).getTime() <= weekAgo
      ).length;
      
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (recentCount > previousCount * 1.2) trend = 'increasing';
      else if (recentCount < previousCount * 0.8) trend = 'decreasing';
      
      if (recentCount > 0 || previousCount > 0) {
        recentTrends.push({ category, trend });
      }
    });
    
    return {
      totalConcerns,
      averageWeight: averageWeight || 0,
      categoryDistribution,
      recentTrends
    };
  } catch (error) {
    console.error('Error getting pattern insights:', error);
    return {
      totalConcerns: 0,
      averageWeight: 0,
      categoryDistribution: {},
      recentTrends: []
    };
  }
}

// Initialize storage system on module load
initializeStorage(); 