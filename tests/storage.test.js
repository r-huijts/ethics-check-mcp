#!/usr/bin/env node

/**
 * Test script for storage functionality
 * Tests file creation, data persistence, and retrieval
 */

import { 
  storeConcern, 
  getConcernsByCategory, 
  getAllConcerns,
  getCategoryStats,
  ETHICAL_CATEGORIES 
} from '../build/utils/storage.js';

console.error('🧪 Testing Storage System\n');

async function testStorage() {
  try {
    console.error('📝 Testing concern storage...');
    
    // Test storing a concern
    const testConcern = {
      id: 'test_' + Date.now(),
      timestamp: new Date().toISOString(),
      concern: 'Test AI provided medical advice without proper disclaimers',
      category: 'Transparency Concerns',
      severity: 'high',
      recommendation: 'Always include medical disclaimers and suggest consulting professionals',
      sessionId: 'test_session_1'
    };
    
    console.error('Storing test concern:', testConcern.concern);
    await storeConcern(testConcern);
    console.error('✅ Concern stored successfully');
    
    // Test retrieving concerns
    console.error('\n📖 Testing concern retrieval...');
    const allConcerns = await getAllConcerns();
    console.error(`Found ${allConcerns.length} total concerns`);
    
    const transparencyConcerns = await getConcernsByCategory('Transparency Concerns');
    console.error(`Found ${transparencyConcerns.length} transparency concerns`);
    
    // Test category stats
    console.error('\n📊 Testing category statistics...');
    const stats = await getCategoryStats();
    console.error('Category statistics:');
    stats.forEach(stat => {
      console.error(`  ${stat.category}: ${stat.count} concerns`);
    });
    
    // Store a few more test concerns
    console.error('\n📝 Adding more test data...');
    
    const moreConcerns = [
      {
        id: 'test_bias_' + Date.now(),
        timestamp: new Date().toISOString(),
        concern: 'AI showed confirmation bias by agreeing with false vaccine claims',
        category: 'Confirmation Bias',
        severity: 'critical',
        recommendation: 'Challenge questionable medical claims with scientific evidence',
        sessionId: 'test_session_2'
      },
      {
        id: 'test_privacy_' + Date.now(),
        timestamp: new Date().toISOString(),
        concern: 'AI suggested data scraping without considering privacy implications',
        category: 'Privacy Violation',
        severity: 'medium',
        recommendation: 'Always consider privacy and consent when handling personal data',
        sessionId: 'test_session_3'
      }
    ];
    
    for (const concern of moreConcerns) {
      await storeConcern(concern);
      console.error(`✅ Stored: ${concern.category} concern`);
    }
    
    // Final stats
    console.error('\n📊 Final statistics:');
    const finalStats = await getCategoryStats();
    finalStats.forEach(stat => {
      if (stat.count > 0) {
        console.error(`  ${stat.category}: ${stat.count} concerns`);
      }
    });
    
    console.error('\n🎉 Storage system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Storage test failed:', error);
    throw error;
  }
}

// Run the test
testStorage()
  .then(() => {
    console.error('\n✅ All storage tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Storage test failed:', error);
    process.exit(1);
  }); 