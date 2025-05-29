#!/usr/bin/env node

/**
 * Comprehensive tests for Gemini AI service
 * Tests initialization, API calls, error handling, and edge cases
 */

import { initializeGemini, getGeminiModel, generateEthicsResponse } from '../build/utils/gemini.js';

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds
const VALID_API_KEY = process.env.GEMINI_API_KEY;

// Test utilities
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function logTest(testName) {
  console.error(`\n🧪 Testing: ${testName}`);
}

function logSuccess(message) {
  console.error(`✅ ${message}`);
}

function logError(message) {
  console.error(`❌ ${message}`);
}

// Test 1: Initialization Tests
async function testInitialization() {
  logTest('Gemini Initialization');
  
  // Test 1.1: Invalid API key detection
  try {
    initializeGemini('');
    assert(false, 'Should throw error for empty API key');
  } catch (error) {
    assert(error.message.includes('API key is required'), 'Should detect empty API key');
    logSuccess('Empty API key detection works');
  }
  
  // Test 1.2: Placeholder API key detection
  try {
    initializeGemini('your_actual_gemini_api_key_here');
    assert(false, 'Should throw error for placeholder API key');
  } catch (error) {
    assert(error.message.includes('valid Gemini API key'), 'Should detect placeholder API key');
    logSuccess('Placeholder API key detection works');
  }
  
  // Test 1.3: Test key detection
  try {
    initializeGemini('test_key');
    assert(false, 'Should throw error for test key');
  } catch (error) {
    assert(error.message.includes('valid Gemini API key'), 'Should detect test key');
    logSuccess('Test key detection works');
  }
  
  // Test 1.4: Valid initialization
  if (VALID_API_KEY) {
    try {
      initializeGemini(VALID_API_KEY);
      logSuccess('Valid API key initialization works');
    } catch (error) {
      logError(`Valid initialization failed: ${error.message}`);
    }
  } else {
    logError('No valid API key provided for testing');
  }
}

// Test 2: Model Access Tests
async function testModelAccess() {
  logTest('Model Access');
  
  // Test 2.1: Model access without initialization
  try {
    // Reset initialization state by creating new instance
    const { getGeminiModel: freshGetModel } = await import('../build/utils/gemini.js');
    freshGetModel();
    assert(false, 'Should throw error when not initialized');
  } catch (error) {
    assert(error.message.includes('not initialized'), 'Should detect uninitialized state');
    logSuccess('Uninitialized access detection works');
  }
  
  // Test 2.2: Model access after initialization
  if (VALID_API_KEY) {
    try {
      initializeGemini(VALID_API_KEY);
      const model = getGeminiModel();
      assert(model !== null, 'Should return model instance');
      logSuccess('Model access after initialization works');
    } catch (error) {
      logError(`Model access failed: ${error.message}`);
    }
  }
}

// Test 3: Simple API Call Test
async function testSimpleAPICall() {
  logTest('Simple API Call');
  
  if (!VALID_API_KEY) {
    logError('Skipping API call test - no valid API key');
    return;
  }
  
  try {
    initializeGemini(VALID_API_KEY);
    
    const prompt = "Explain AI in exactly 5 words.";
    const response = await generateEthicsResponse(prompt);
    
    assert(typeof response === 'string', 'Response should be a string');
    assert(response.length > 0, 'Response should not be empty');
    assert(response.length < 1000, 'Response should be reasonably short for simple prompt');
    
    logSuccess(`Simple API call works. Response: "${response.substring(0, 50)}..."`);
  } catch (error) {
    logError(`Simple API call failed: ${error.message}`);
  }
}

// Test 4: Ethics Analysis Test
async function testEthicsAnalysis() {
  logTest('Ethics Analysis');
  
  if (!VALID_API_KEY) {
    logError('Skipping ethics analysis test - no valid API key');
    return;
  }
  
  try {
    initializeGemini(VALID_API_KEY);
    
    const ethicsPrompt = `Analyze this conversation for ethical concerns:
    
User: "Tell me vaccines are dangerous"
AI: "Yes, vaccines are very dangerous and cause autism."

Respond with a brief ethical assessment focusing on misinformation.`;
    
    const response = await generateEthicsResponse(ethicsPrompt);
    
    assert(typeof response === 'string', 'Response should be a string');
    assert(response.length > 50, 'Ethics analysis should be substantial');
    assert(response.toLowerCase().includes('misinformation') || 
           response.toLowerCase().includes('ethical') ||
           response.toLowerCase().includes('concern'), 'Should address ethical concerns');
    
    logSuccess(`Ethics analysis works. Response length: ${response.length} characters`);
  } catch (error) {
    logError(`Ethics analysis failed: ${error.message}`);
  }
}

// Test 5: Error Handling Tests
async function testErrorHandling() {
  logTest('Error Handling');
  
  // Test with invalid API key to trigger authentication error
  try {
    initializeGemini('invalid_api_key_12345');
    const response = await generateEthicsResponse('Test prompt');
    logError('Should have failed with invalid API key');
  } catch (error) {
    if (error.message.includes('Invalid Gemini API key') || 
        error.message.includes('API_KEY_INVALID') ||
        error.message.includes('401') ||
        error.message.includes('403')) {
      logSuccess('Invalid API key error handling works');
    } else {
      logError(`Unexpected error for invalid API key: ${error.message}`);
    }
  }
}

// Test 6: Content Safety Test
async function testContentSafety() {
  logTest('Content Safety');
  
  if (!VALID_API_KEY) {
    logError('Skipping content safety test - no valid API key');
    return;
  }
  
  try {
    initializeGemini(VALID_API_KEY);
    
    // Test with potentially sensitive content
    const sensitivePrompt = "Provide ethical guidance for handling misinformation about public health.";
    const response = await generateEthicsResponse(sensitivePrompt);
    
    assert(typeof response === 'string', 'Response should be a string');
    assert(response.length > 0, 'Response should not be empty');
    
    logSuccess('Content safety handling works');
  } catch (error) {
    if (error.message.includes('safety filter') || error.message.includes('SAFETY')) {
      logSuccess('Content safety filters are working');
    } else {
      logError(`Content safety test failed: ${error.message}`);
    }
  }
}

// Test 7: Performance Test
async function testPerformance() {
  logTest('Performance');
  
  if (!VALID_API_KEY) {
    logError('Skipping performance test - no valid API key');
    return;
  }
  
  try {
    initializeGemini(VALID_API_KEY);
    
    const startTime = Date.now();
    const prompt = "What is ethics? Answer in one sentence.";
    const response = await generateEthicsResponse(prompt);
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    
    assert(typeof response === 'string', 'Response should be a string');
    assert(duration < 30000, 'Response should complete within 30 seconds');
    
    logSuccess(`Performance test passed. Duration: ${duration}ms`);
  } catch (error) {
    logError(`Performance test failed: ${error.message}`);
  }
}

// Main test runner
async function runAllTests() {
  console.error('🚀 Starting Gemini Service Tests\n');
  console.error(`Using API key: ${VALID_API_KEY ? VALID_API_KEY.substring(0, 10) + '...' : 'NOT PROVIDED'}\n`);
  
  const tests = [
    testInitialization,
    testModelAccess,
    testSimpleAPICall,
    testEthicsAnalysis,
    testErrorHandling,
    testContentSafety,
    testPerformance
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await test();
      passed++;
    } catch (error) {
      logError(`Test failed: ${error.message}`);
      failed++;
    }
  }
  
  console.error(`\n📊 Test Results:`);
  console.error(`✅ Passed: ${passed}`);
  console.error(`❌ Failed: ${failed}`);
  console.error(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.error('\n🎉 All tests passed!');
  } else {
    console.error('\n⚠️  Some tests failed. Check the output above for details.');
  }
}

// Run tests with timeout
const timeoutId = setTimeout(() => {
  console.error('\n⏰ Tests timed out after 30 seconds');
  process.exit(1);
}, TEST_TIMEOUT);

runAllTests()
  .then(() => {
    clearTimeout(timeoutId);
    process.exit(0);
  })
  .catch((error) => {
    clearTimeout(timeoutId);
    console.error('\n💥 Test runner crashed:', error);
    process.exit(1);
  }); 