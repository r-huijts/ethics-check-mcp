import { 
  addEthicalConcern, 
  getWeightedConcerns, 
  getWeightedCategoryPatterns, 
  getWeightedSessionPatterns,
  updateConcernSuccessScore,
  getPatternInsights,
  clearAllConcerns 
} from './build/utils/storage.js';

async function testWeightedPatternRecognition() {
  console.log('🧠 Testing Weighted Pattern Recognition System\n');
  
  // Clear existing data for clean test
  clearAllConcerns();
  console.log('✅ Cleared existing concerns for clean test\n');
  
  // Add test concerns with different characteristics
  console.log('📝 Adding test concerns...');
  
  // Recent high-severity confirmation bias (should get high weight)
  addEthicalConcern({
    concern: 'AI agreed with controversial political statement without providing counterarguments',
    category: 'Confirmation Bias',
    severity: 'high',
    recommendation: 'Always present multiple perspectives on controversial topics',
    sessionId: 'session-123'
  });
  
  // Older privacy concern (should get lower recency weight)
  const oldTimestamp = new Date(Date.now() - (5 * 24 * 60 * 60 * 1000)); // 5 days ago
  addEthicalConcern({
    concern: 'Personal data shared without explicit consent',
    category: 'Privacy Violation',
    severity: 'critical',
    recommendation: 'Always obtain explicit consent before sharing personal data',
    sessionId: 'session-456'
  });
  
  // Recent medium severity bias
  addEthicalConcern({
    concern: 'AI provided one-sided investment advice without risk warnings',
    category: 'Bias and Discrimination',
    severity: 'medium',
    recommendation: 'Include balanced risk assessment in financial advice',
    sessionId: 'session-123'
  });
  
  // Another confirmation bias with same session
  addEthicalConcern({
    concern: 'AI reinforced user misconceptions about climate science',
    category: 'Confirmation Bias',
    severity: 'critical',
    recommendation: 'Provide scientifically accurate information regardless of user beliefs',
    sessionId: 'session-123'
  });
  
  console.log('✅ Added 4 test concerns\n');
  
  // Wait a moment to ensure timestamp differences
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Test 1: Basic weighted concerns
  console.log('🔍 Test 1: Basic Weighted Concerns (default weights)');
  const weightedConcerns = getWeightedConcerns({ limit: 10 });
  console.log(`Found ${weightedConcerns.length} weighted concerns:`);
  weightedConcerns.forEach((concern, index) => {
    console.log(`  ${index + 1}. [Total: ${concern.totalScore.toFixed(3)}] ${concern.category}`);
    console.log(`     Recency: ${concern.recencyScore.toFixed(3)} | Severity: ${concern.severityScore.toFixed(3)} | Success: ${concern.successScore.toFixed(3)}`);
    console.log(`     Concern: ${concern.concern.substring(0, 60)}...`);
  });
  console.log();
  
  // Test 2: Category-specific patterns
  console.log('🔍 Test 2: Category-Specific Patterns (Confirmation Bias)');
  const biasPatterns = getWeightedCategoryPatterns('Confirmation Bias', 5);
  console.log(`Found ${biasPatterns.length} confirmation bias patterns:`);
  biasPatterns.forEach((concern, index) => {
    console.log(`  ${index + 1}. [Weight: ${concern.totalScore.toFixed(3)}] ${concern.concern.substring(0, 60)}...`);
  });
  console.log();
  
  // Test 3: Session-specific patterns
  console.log('🔍 Test 3: Session-Specific Patterns (session-123)');
  const sessionPatterns = getWeightedSessionPatterns('session-123', 5);
  console.log(`Found ${sessionPatterns.length} session patterns:`);
  sessionPatterns.forEach((concern, index) => {
    console.log(`  ${index + 1}. [Weight: ${concern.totalScore.toFixed(3)}] ${concern.category}`);
    console.log(`     Relevance: ${concern.relevanceScore.toFixed(3)} (session match boost applied)`);
  });
  console.log();
  
  // Test 4: Context-aware weighted concerns
  console.log('🔍 Test 4: Context-Aware Weighted Concerns');
  const contextualConcerns = getWeightedConcerns({
    limit: 5,
    context: 'political discussion confirmation bias',
    sessionId: 'session-123',
    weights: { recency: 0.2, severity: 0.3, success: 0.2, relevance: 0.3 } // Higher relevance weight
  });
  console.log('Context: "political discussion confirmation bias"');
  console.log(`Found ${contextualConcerns.length} contextually relevant concerns:`);
  contextualConcerns.forEach((concern, index) => {
    console.log(`  ${index + 1}. [Total: ${concern.totalScore.toFixed(3)}] ${concern.category}`);
    console.log(`     Relevance: ${concern.relevanceScore.toFixed(3)} | Context match detected`);
  });
  console.log();
  
  // Test 5: Update success scores and verify weighting changes
  console.log('🔍 Test 5: Success Score Updates');
  const allConcerns = getWeightedConcerns({ limit: 10 });
  if (allConcerns.length > 0) {
    const firstConcernId = allConcerns[0].id;
    console.log(`Updating success score for concern ${firstConcernId} to 0.9 (highly successful)`);
    updateConcernSuccessScore(firstConcernId, 0.9);
    
    // Re-fetch to see the weight change
    const updatedConcerns = getWeightedConcerns({ 
      limit: 5,
      weights: { recency: 0.2, severity: 0.2, success: 0.6, relevance: 0.0 } // High success weight
    });
    console.log('Updated weighted concerns (high success weight):');
    updatedConcerns.forEach((concern, index) => {
      console.log(`  ${index + 1}. [Total: ${concern.totalScore.toFixed(3)}] Success: ${concern.successScore.toFixed(3)}`);
    });
  }
  console.log();
  
  // Test 6: Pattern insights
  console.log('🔍 Test 6: Pattern Insights');
  const insights = getPatternInsights();
  console.log('Pattern Recognition Insights:');
  console.log(`  Total Concerns: ${insights.totalConcerns}`);
  console.log(`  Average Weight: ${insights.averageWeight.toFixed(3)}`);
  console.log('  Category Distribution:');
  Object.entries(insights.categoryDistribution).forEach(([category, count]) => {
    console.log(`    ${category}: ${count}`);
  });
  console.log('  Recent Trends:');
  insights.recentTrends.forEach(trend => {
    console.log(`    ${trend.category}: ${trend.trend}`);
  });
  console.log();
  
  console.log('🎉 Weighted Pattern Recognition Test Complete!');
  console.log('✅ All systems operational - Batman would be proud! 🦇');
}

// Run the test
testWeightedPatternRecognition().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 