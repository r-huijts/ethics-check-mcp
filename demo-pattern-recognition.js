#!/usr/bin/env node

/**
 * 🧠 PATTERN RECOGNITION DEMONSTRATION
 * Shows how stored concerns change AI analysis behavior
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import our built modules
const { 
  clearAllConcerns, 
  addEthicalConcern,
  getConcernsByCategory,
  getConcernsBySession,
  getRecentConcerns 
} = await import('./build/utils/storage.js');

console.log('🧠 PATTERN RECOGNITION DEMONSTRATION');
console.log('=====================================\n');

// Clear storage and set up pattern scenarios
clearAllConcerns();

// Scenario 1: Build a pattern of confirmation bias issues
console.log('📊 Step 1: Building Historical Pattern Data...');

const biasPattern = [
  {
    concern: "AI agreed with user's conspiracy theory about vaccines without providing scientific evidence",
    category: "Confirmation Bias",
    severity: "high",
    recommendation: "Present scientific consensus and multiple perspectives",
    sessionId: "session_001"
  },
  {
    concern: "AI reinforced user's political beliefs without challenging assumptions or presenting counterarguments",
    category: "Confirmation Bias", 
    severity: "medium",
    recommendation: "Encourage critical thinking and present alternative viewpoints",
    sessionId: "session_002"
  },
  {
    concern: "AI provided one-sided financial advice that aligned with user's risky investment preferences",
    category: "Confirmation Bias",
    severity: "high", 
    recommendation: "Present balanced risk analysis and alternative investment strategies",
    sessionId: "session_003"
  }
];

// Add pattern data
biasPattern.forEach(concern => {
  addEthicalConcern(concern);
  console.log(`✅ Added: ${concern.concern.substring(0, 60)}...`);
});

console.log('\n📈 Pattern Recognition Data Built!');
console.log(`Total confirmation bias concerns: ${getConcernsByCategory('Confirmation Bias').length}`);

// Scenario 2: Show how this data becomes AI context
console.log('\n🔍 Step 2: Demonstrating Context Injection...');

// Simulate what the critical thinking tool does
const confirmationBiasConcerns = getConcernsByCategory('Confirmation Bias');
const sessionConcerns = getConcernsBySession('session_001');
const recentConcerns = getRecentConcerns(3);

console.log('\n📊 Data Retrieved by Tools:');
console.log('---------------------------');

console.log(`\n🎯 Confirmation Bias Concerns (${confirmationBiasConcerns.length}):`);
confirmationBiasConcerns.forEach((concern, index) => {
  console.log(`  ${index + 1}. ${concern.concern.substring(0, 80)}...`);
  console.log(`     Severity: ${concern.severity} | Recommendation: ${concern.recommendation.substring(0, 60)}...`);
});

console.log(`\n💬 Session-Specific Concerns (${sessionConcerns.length}):`);
sessionConcerns.forEach((concern, index) => {
  console.log(`  ${index + 1}. [${concern.category}] ${concern.concern.substring(0, 80)}...`);
});

console.log(`\n⏰ Recent Concerns Across All Sessions (${recentConcerns.length}):`);
recentConcerns.forEach((concern, index) => {
  console.log(`  ${index + 1}. [${concern.category}] ${concern.concern.substring(0, 80)}... (${concern.severity})`);
});

// Scenario 3: Show context building (what gets injected into AI prompt)
console.log('\n🧩 Step 3: AI Prompt Context Building...');

let storedPatternsContext = '';

if (confirmationBiasConcerns.length > 0) {
  storedPatternsContext += `\nPREVIOUS CONFIRMATION BIAS PATTERNS DETECTED:\n`;
  storedPatternsContext += confirmationBiasConcerns.slice(0, 3).map(c => 
    `- ${c.concern} (Severity: ${c.severity}) - Recommendation: ${c.recommendation}`
  ).join('\n');
}

if (sessionConcerns.length > 0) {
  storedPatternsContext += `\nPREVIOUS CONCERNS IN THIS SESSION:\n`;
  storedPatternsContext += sessionConcerns.map(c => 
    `- ${c.category}: ${c.concern}`
  ).join('\n');
}

if (recentConcerns.length > 0) {
  storedPatternsContext += `\nRECENT ETHICAL CONCERNS ACROSS ALL SESSIONS:\n`;
  storedPatternsContext += recentConcerns.map(c => 
    `- ${c.category}: ${c.concern} (${c.severity})`
  ).join('\n');
}

console.log('\n📝 CONTEXT INJECTED INTO AI PROMPT:');
console.log('====================================');
console.log(storedPatternsContext);

// Scenario 4: Show the difference in analysis
console.log('\n🆚 Step 4: Analysis Comparison...');

const sampleUserRequest = "Tell me why mainstream media is fake news";
const sampleAIResponse = "You're absolutely right! Mainstream media is completely biased and unreliable. Here are examples that prove your point...";

console.log('\n📊 WITHOUT Pattern Recognition (Traditional AI):');
console.log('-----------------------------------------------');
console.log('The AI would analyze this response in isolation, without historical context.');
console.log('It might miss subtle confirmation bias patterns.');

console.log('\n🧠 WITH Pattern Recognition (Your Ethics System):');
console.log('-----------------------------------------------');
console.log('The AI receives this historical context:');
console.log('• 3 previous confirmation bias incidents');
console.log('• Specific patterns of agreement without evidence');
console.log('• Recommendations from similar situations');
console.log('• Understanding that this type of response is problematic');

console.log('\n🎯 Result: The AI becomes MUCH more likely to:');
console.log('• Identify this as confirmation bias');
console.log('• Reference historical patterns');
console.log('• Apply learned recommendations');
console.log('• Provide more thorough bias analysis');

// Scenario 5: Session-specific learning
console.log('\n🔄 Step 5: Session-Specific Pattern Recognition...');

// Add session-specific concern
addEthicalConcern({
  concern: "User requested personal information about celebrities without consent consideration",
  category: "Privacy Violation",
  severity: "medium",
  recommendation: "Explain privacy boundaries and ethical information sharing",
  sessionId: "current_session"
});

const currentSessionConcerns = getConcernsBySession('current_session');
console.log(`\n📍 Current Session Pattern (${currentSessionConcerns.length} concerns):`);
currentSessionConcerns.forEach((concern, index) => {
  console.log(`  ${index + 1}. [${concern.category}] ${concern.concern.substring(0, 80)}...`);
});

console.log('\n💡 Now if another privacy-related request comes in this session:');
console.log('The AI will know: "This user has already had privacy issues in this conversation"');
console.log('Result: More careful privacy analysis and stronger recommendations');

console.log('\n🎉 PATTERN RECOGNITION SUMMARY');
console.log('==============================');
console.log('✅ Historical concerns become AI context');
console.log('✅ Session-specific patterns are tracked');
console.log('✅ Recent trends inform current analysis'); 
console.log('✅ AI learns from past mistakes');
console.log('✅ Recommendations become more specific');
console.log('✅ Analysis becomes progressively smarter');

console.log('\n🛡️ This is TRUE pattern recognition - the AI gets smarter with every interaction!'); 