#!/usr/bin/env node

/**
 * Unit tests for session drift tracking + context tag derivation.
 * No Gemini calls — pure storage-layer logic.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

// Isolate storage to a temp dir BEFORE importing the storage module.
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ethics-session-test-'));
process.env.ETHICS_DATA_DIR = testDir;

const {
  recordSessionCheck,
  getSessionCheckHistory,
  getSessionTrend,
  deriveContextTags,
  riskLevelToScore
} = await import('../build/utils/storage.js');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.error(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ ${message}`);
    failed++;
  }
}

console.error('🧪 Session trend + context tag tests\n');
console.error(`Using isolated storage: ${testDir}\n`);

console.error('1) riskLevelToScore ordering');
assert(riskLevelToScore('low') < riskLevelToScore('medium'), 'low < medium');
assert(riskLevelToScore('medium') < riskLevelToScore('high'), 'medium < high');
assert(riskLevelToScore('high') < riskLevelToScore('critical'), 'high < critical');

console.error('\n2) deriveContextTags filters stopwords and short tokens');
const tags = deriveContextTags([
  ['confirmation bias', 'privacy'],
  'healthcare setting about the patient',
  'Can you help me with vaccine claims?'
]);
assert(tags.includes('confirmation'), 'keeps meaningful token "confirmation"');
assert(tags.includes('privacy'), 'keeps focus-area token "privacy"');
assert(tags.includes('healthcare'), 'keeps domain token "healthcare"');
assert(tags.includes('vaccine'), 'keeps request token "vaccine"');
assert(!tags.includes('the'), 'drops stopword "the"');
assert(!tags.includes('can'), 'drops short/stopword "can"');

console.error('\n3) insufficient_data with 0–1 checks');
const empty = getSessionTrend('session-empty');
assert(empty.riskTrend === 'insufficient_data', 'empty session → insufficient_data');
assert(empty.checksInSession === 0, 'empty session check count is 0');

recordSessionCheck({
  sessionId: 'session-one',
  tool: 'ethics_check',
  riskLevel: 'low',
  topCategory: 'Confirmation Bias'
});
const one = getSessionTrend('session-one');
assert(one.riskTrend === 'insufficient_data', 'single check → insufficient_data');
assert(one.checksInSession === 1, 'single check count is 1');
assert(one.currentRiskLevel === 'low', 'current risk reflected');

console.error('\n4) escalating trend across a session');
const escalateId = 'session-escalate';
for (const level of ['low', 'low', 'medium', 'high', 'critical']) {
  recordSessionCheck({
    sessionId: escalateId,
    tool: 'critical_thinking',
    riskLevel: level,
    topCategory: 'Confirmation Bias'
  });
}
const escalating = getSessionTrend(escalateId);
assert(escalating.checksInSession === 5, 'escalating session recorded 5 checks');
assert(escalating.riskTrend === 'escalating', `expected escalating, got ${escalating.riskTrend}`);
assert(escalating.firstRiskLevel === 'low', 'first risk is low');
assert(escalating.currentRiskLevel === 'critical', 'current risk is critical');
assert(escalating.summary.includes('Trending upward'), 'summary mentions upward trend');
assert(escalating.summary.includes('Confirmation Bias'), 'summary mentions recurring theme');

console.error('\n5) improving trend across a session');
const improveId = 'session-improve';
for (const level of ['critical', 'high', 'medium', 'low', 'low']) {
  recordSessionCheck({
    sessionId: improveId,
    tool: 'ethics_check',
    riskLevel: level
  });
}
const improving = getSessionTrend(improveId);
assert(improving.riskTrend === 'improving', `expected improving, got ${improving.riskTrend}`);
assert(improving.summary.includes('Trending downward'), 'summary mentions downward trend');

console.error('\n6) stable trend');
const stableId = 'session-stable';
for (const level of ['medium', 'medium', 'medium', 'medium']) {
  recordSessionCheck({
    sessionId: stableId,
    tool: 'ethics_check',
    riskLevel: level
  });
}
const stable = getSessionTrend(stableId);
assert(stable.riskTrend === 'stable', `expected stable, got ${stable.riskTrend}`);

console.error('\n7) history isolation by sessionId');
const hist = getSessionCheckHistory(escalateId);
assert(hist.length === 5, 'history returns only matching session records');
assert(hist.every(r => r.sessionId === escalateId), 'all history rows match session');

console.error('\n8) ETHICS_DATA_DIR isolation wrote files under temp dir');
assert(fs.existsSync(path.join(testDir, 'session-checks.json')), 'session-checks.json created in ETHICS_DATA_DIR');

// Cleanup
try {
  fs.rmSync(testDir, { recursive: true, force: true });
} catch {
  // best-effort
}

console.error(`\n📊 Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
console.error('\n🎉 Session trend tests passed!');
process.exit(0);
