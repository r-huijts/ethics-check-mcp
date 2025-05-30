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
}

export interface CategoryStats {
  category: EthicalCategory;
  count: number;
  recentExample?: EthicalConcern;
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

// Add a new ethical concern
export function addEthicalConcern(concern: Omit<EthicalConcern, 'id' | 'timestamp'>): boolean {
  try {
    // Initialize storage on first use
    if (USE_FILE_STORAGE && !fs.existsSync(STORAGE_DIR)) {
      initializeStorage();
    }

    const concerns = loadConcerns();
    const newConcern: EthicalConcern = {
      ...concern,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    
    concerns.push(newConcern);
    saveConcerns(concerns);
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

// Initialize storage system on module load
initializeStorage(); 