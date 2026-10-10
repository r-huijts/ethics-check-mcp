#!/usr/bin/env node

/**
 * Demo: conversation drift signal without calling Gemini.
 * Simulates three mid-chat gut-checks with the same sessionId and prints
 * the sessionTrend the tools would return after each one.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

const demoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ethics-drift-demo-'));
process.env.ETHICS_DATA_DIR = demoDir;

const {
  recordSessionCheck,
  getSessionTrend
} = await import('./build/utils/storage.js');

const sessionId = 'demo-conversation-42';

const checks = [
  { tool: 'ethics_check', riskLevel: 'low', topCategory: undefined, label: 'Early in chat — casual topic' },
  { tool: 'critical_thinking', riskLevel: 'medium', topCategory: 'Confirmation Bias', label: 'Mid chat — model getting agreeable' },
  { tool: 'ethics_check', riskLevel: 'high', topCategory: 'Confirmation Bias', label: 'Later — one-sided framing locked in' }
];

console.log('Ethics Vibe Check — session drift demo');
console.log(`sessionId: ${sessionId}`);
console.log(`storage:   ${demoDir}`);
console.log('');

for (const [i, check] of checks.entries()) {
  recordSessionCheck({
    sessionId,
    tool: check.tool,
    riskLevel: check.riskLevel,
    topCategory: check.topCategory
  });

  const trend = getSessionTrend(sessionId);
  console.log(`── Check ${i + 1}: ${check.label}`);
  console.log(`   tool risk: ${check.riskLevel}`);
  console.log(`   sessionTrend:`);
  console.log(`     checksInSession:  ${trend.checksInSession}`);
  console.log(`     riskTrend:        ${trend.riskTrend}`);
  console.log(`     first → current:  ${trend.firstRiskLevel ?? '—'} → ${trend.currentRiskLevel}`);
  console.log(`     summary: ${trend.summary}`);
  console.log('');
}

fs.rmSync(demoDir, { recursive: true, force: true });
console.log('Done — drift signal surfaces only after repeated checks in the same session.');
