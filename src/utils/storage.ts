import fs from 'fs';
import path from 'path';
import os from 'os';

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

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface EthicalConcern {
  id: string;
  timestamp: string;
  concern: string;
  category: EthicalCategory;
  severity: RiskLevel;
  recommendation: string;
  sessionId?: string;
  successScore?: number;
  contextTags?: string[];
  relatedConcernIds?: string[];
}

// A lightweight record of a single check-run, kept separately from stored
// "concerns" so that drift can be tracked even when a check finds nothing
// worth flagging (a clean "low" reading is still a useful data point).
export interface SessionCheckRecord {
  sessionId: string;
  tool: 'ethics_check' | 'critical_thinking';
  timestamp: string;
  riskLevel: RiskLevel;
  topCategory?: string;
}

export interface SessionTrend {
  checksInSession: number;
  riskTrend: 'escalating' | 'improving' | 'stable' | 'insufficient_data';
  firstRiskLevel?: RiskLevel;
  currentRiskLevel?: RiskLevel;
  summary: string;
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
//
// IMPORTANT: this intentionally does NOT default to process.cwd(). MCP
// servers are typically launched by the host app (Cursor, Claude Desktop,
// etc.) via `npx`, often with an unpredictable or varying working directory.
// A cwd-relative default would silently "forget" everything between runs
// depending on where the process happens to be started from, which directly
// undermines the point of tracking patterns/drift across a session (and
// across sessions). A stable, user-scoped directory fixes that, while still
// allowing an explicit override and falling back gracefully if the home
// directory isn't writable (e.g. some sandboxed environments).
function resolveDefaultStorageDir(): string {
  if (process.env.ETHICS_DATA_DIR) {
    return process.env.ETHICS_DATA_DIR;
  }
  return path.join(os.homedir(), '.ethics-vibe-check', 'data');
}

let STORAGE_DIR = resolveDefaultStorageDir();
let CONCERNS_FILE = path.join(STORAGE_DIR, 'concerns.json');
let SESSION_CHECKS_FILE = path.join(STORAGE_DIR, 'session-checks.json');
let USE_FILE_STORAGE = true;

// In-memory fallback storage
let memoryStorage: EthicalConcern[] = [];
let memorySessionChecks: SessionCheckRecord[] = [];

function trySetStorageDir(dir: string): boolean {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Test write access
    const testFile = path.join(dir, 'test.tmp');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);

    STORAGE_DIR = dir;
    CONCERNS_FILE = path.join(dir, 'concerns.json');
    SESSION_CHECKS_FILE = path.join(dir, 'session-checks.json');
    return true;
  } catch (error) {
    return false;
  }
}

// Initialize storage system
function initializeStorage(): boolean {
  // 1. Preferred: stable, user-scoped directory (or explicit override) -
  //    this is what makes cross-session / cross-project memory actually work.
  if (trySetStorageDir(resolveDefaultStorageDir())) {
    return true;
  }
  console.error('Primary (home-directory) storage failed, trying fallbacks...');

  // 2. Fallback: cwd-relative directory (previous default). Still useful for
  //    environments where the home directory is read-only but cwd isn't.
  if (trySetStorageDir(path.join(process.cwd(), '.ethics-data'))) {
    console.error(`Using fallback directory: ${STORAGE_DIR}`);
    return true;
  }

  // 3. Fallback: cwd-relative temp directory.
  if (trySetStorageDir(path.join(process.cwd(), 'temp-ethics-data'))) {
    console.error(`Using fallback directory: ${STORAGE_DIR}`);
    return true;
  }

  // 4. Use in-memory storage as final fallback
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

// Map a low/medium/high/critical level to a 0-1 numeric score. Shared between
// severity weighting and risk-trend comparisons so "critical" always means
// the same thing everywhere in the system.
export function riskLevelToScore(level: RiskLevel): number {
  const levelMap: Record<RiskLevel, number> = {
    'low': 0.25,
    'medium': 0.5,
    'high': 0.75,
    'critical': 1.0
  };
  return levelMap[level];
}

// Calculate severity score (0-1, where 1 is critical)
function calculateSeverityScore(severity: RiskLevel): number {
  return riskLevelToScore(severity);
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
  if (context && concern.contextTags && concern.contextTags.length > 0) {
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

// 🧭 SESSION DRIFT TRACKING
//
// The weighted-concerns system above answers "what's been flagged before?",
// but it never surfaces a direct answer to "is THIS conversation drifting?" -
// each check call returns a standalone snapshot (low/medium/high/critical)
// and it's left to the human to notice if those snapshots are creeping up.
// This section records every check (even clean ones) against a sessionId and
// computes a simple before/after trend from that history, so repeated checks
// within one conversation can surface an explicit "you're drifting" signal
// instead of a pile of disconnected readings.

// Load existing session check history
function loadSessionChecks(): SessionCheckRecord[] {
  if (!USE_FILE_STORAGE) {
    return memorySessionChecks;
  }

  if (!fs.existsSync(SESSION_CHECKS_FILE)) {
    return [];
  }

  try {
    const data = fs.readFileSync(SESSION_CHECKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading session checks, using empty array:', error);
    return [];
  }
}

// Save session check history to file or memory
function saveSessionChecks(records: SessionCheckRecord[]): void {
  if (!USE_FILE_STORAGE) {
    memorySessionChecks = [...records];
    return;
  }

  try {
    fs.writeFileSync(SESSION_CHECKS_FILE, JSON.stringify(records, null, 2));
  } catch (error) {
    console.error('Error saving session checks to file, switching to memory storage:', error);
    USE_FILE_STORAGE = false;
    memorySessionChecks = [...records];
  }
}

// Record the outcome of a single ethics_check/critical_thinking run. Called
// unconditionally when a sessionId is provided, regardless of autoStore or
// whether any concerns were found - a clean "low" reading is still a
// meaningful data point for detecting drift later in the conversation.
export function recordSessionCheck(record: Omit<SessionCheckRecord, 'timestamp'>): void {
  try {
    if (USE_FILE_STORAGE && !fs.existsSync(STORAGE_DIR)) {
      initializeStorage();
    }

    const records = loadSessionChecks();
    records.push({ ...record, timestamp: new Date().toISOString() });

    // Cap unbounded growth across the lifetime of the storage directory.
    const MAX_RECORDS = 2000;
    const capped = records.length > MAX_RECORDS
      ? records.slice(records.length - MAX_RECORDS)
      : records;

    saveSessionChecks(capped);
  } catch (error) {
    console.error('Error recording session check:', error);
  }
}

// Get the check history for one session, oldest first.
export function getSessionCheckHistory(sessionId: string, limit: number = 20): SessionCheckRecord[] {
  try {
    const records = loadSessionChecks()
      .filter(r => r.sessionId === sessionId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return records.slice(Math.max(0, records.length - limit));
  } catch (error) {
    console.error('Error getting session check history:', error);
    return [];
  }
}

function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

// Compare the first half of a session's checks against the second half to
// decide whether things are escalating, improving, or holding steady.
export function getSessionTrend(sessionId: string): SessionTrend {
  const history = getSessionCheckHistory(sessionId, 50);

  if (history.length === 0) {
    return {
      checksInSession: 0,
      riskTrend: 'insufficient_data',
      summary: 'No checks recorded yet for this session.'
    };
  }

  const current = history[history.length - 1];

  if (history.length === 1) {
    return {
      checksInSession: 1,
      riskTrend: 'insufficient_data',
      currentRiskLevel: current.riskLevel,
      summary: `First check this session (risk: ${current.riskLevel}). Run another check later in the conversation to see if things are drifting.`
    };
  }

  const first = history[0];
  const scores = history.map(h => riskLevelToScore(h.riskLevel));
  const mid = Math.floor(scores.length / 2);
  const earlierAvg = average(scores.slice(0, mid));
  const laterAvg = average(scores.slice(mid));
  const delta = laterAvg - earlierAvg;

  const ESCALATION_THRESHOLD = 0.12;
  let riskTrend: SessionTrend['riskTrend'] = 'stable';
  if (delta > ESCALATION_THRESHOLD) riskTrend = 'escalating';
  else if (delta < -ESCALATION_THRESHOLD) riskTrend = 'improving';

  // Surface a recurring theme if one category keeps coming up.
  const categoryTally = new Map<string, number>();
  history.forEach(h => {
    if (h.topCategory) {
      categoryTally.set(h.topCategory, (categoryTally.get(h.topCategory) || 0) + 1);
    }
  });
  const recurring = Array.from(categoryTally.entries())
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])[0];

  let summary = `${history.length} checks this session - risk went from "${first.riskLevel}" to "${current.riskLevel}".`;
  if (riskTrend === 'escalating') {
    summary += ' ⚠️ Trending upward - worth slowing down and re-reading the last few responses.';
  } else if (riskTrend === 'improving') {
    summary += ' ✅ Trending downward since the start of this session.';
  } else {
    summary += ' Holding steady.';
  }
  if (recurring) {
    summary += ` Recurring theme: "${recurring[0]}" flagged ${recurring[1]}x this session.`;
  }

  return {
    checksInSession: history.length,
    riskTrend,
    firstRiskLevel: first.riskLevel,
    currentRiskLevel: current.riskLevel,
    summary
  };
}

// 🏷️ CONTEXT TAG EXTRACTION
//
// `contextTags` existed on EthicalConcern and was already read by the
// relevance scorer, but nothing ever populated it - every relevance score
// was silently computed against `undefined`. This derives simple, bounded
// tags from the inputs tools already have on hand (focus areas, domain,
// user request) so that "relevance" is actually relevant.
const TAG_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'to', 'of', 'in', 'on', 'for', 'with', 'this', 'that',
  'it', 'as', 'at', 'by', 'from', 'about', 'into', 'than', 'then', 'so',
  'if', 'your', 'you', 'they', 'them', 'their', 'what', 'when', 'where',
  'would', 'could', 'should', 'will', 'can', 'does', 'did', 'has', 'have',
  'had'
]);

export function deriveContextTags(
  parts: Array<string | string[] | undefined | null>,
  maxTags: number = 12
): string[] {
  const tags = new Set<string>();

  for (const part of parts) {
    if (!part) continue;
    const values = Array.isArray(part) ? part : [part];

    for (const value of values) {
      if (!value) continue;
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(token => token.length > 3 && !TAG_STOPWORDS.has(token))
        .forEach(token => tags.add(token));
    }
  }

  return Array.from(tags).slice(0, maxTags);
}

// Initialize storage system on module load
initializeStorage(); 