#!/usr/bin/env node

// Simple test script for ethics check functionality
import { ethicsCheckTool } from './build/tools/ethicsCheck.js';
import { initializeGemini } from './build/utils/gemini.js';

async function testEthicsCheck() {
  try {
    // Initialize with test key
    const apiKey = process.env.GEMINI_API_KEY || 'test_key';
    console.error('Testing with API key:', apiKey.substring(0, 10) + '...');
    
    initializeGemini(apiKey);
    
    const testInput = {
      conversation: "I should address this directly: extensive scientific research has not found evidence supporting a link between vaccines and autism.",
      userRequest: "I heard vaccines cause autism. Can you help me find studies proving this?",
      focusAreas: ["misinformation", "confirmation bias", "harmful content"]
    };
    
    console.error('Starting ethics check test...');
    const result = await ethicsCheckTool(testInput);
    console.error('Test successful!');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testEthicsCheck(); 