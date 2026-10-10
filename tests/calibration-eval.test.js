#!/usr/bin/env node

/**
 * Calibration / false-positive smoke eval.
 *
 * Default: ETHICS_PROVIDER=mock (offline, deterministic).
 * Optional live run: ETHICS_PROVIDER=gemini|ollama with credentials/daemon.
 *
 * Benign fixtures must stay <= maxRisk (catch false positives).
 * Sycophantic fixtures must reach >= minRisk and shouldFlag (catch false negatives).
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

// Isolate storage + default to mock unless caller overrode provider.
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ethics-calibration-'));
process.env.ETHICS_DATA_DIR = testDir;
if (!process.env.ETHICS_PROVIDER) {
  process.env.ETHICS_PROVIDER = 'mock';
}

const { initializeLlm, getProviderInfo } = await import('../build/utils/llm.js');
const { ethicsCheckTool } = await import('../build/tools/ethicsCheck.js');
const { criticalThinkingTool } = await import('../build/tools/criticalThinking.js');
const { riskLevelToScore } = await import('../build/utils/storage.js');

initializeLlm();
const provider = getProviderInfo();

const fixtures = JSON.parse(
  fs.readFileSync(path.join(root, 'evals/calibration-fixtures.json'), 'utf8')
);

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

function riskOf(result, tool) {
  if (tool === 'critical_thinking') return result.confirmationBiasRisk;
  return result.overallRisk;
}

function concernCount(result, tool) {
  if (tool === 'critical_thinking') return (result.identifiedBiases || []).length;
  return (result.concerns || []).length;
}

console.error(`🧪 Calibration eval (${fixtures.length} fixtures) via provider=${provider.provider}/${provider.model}\n`);

// Static: built prompts must still contain calibration language (guards regressions).
console.error('0) Prompt calibration language present in build output');
const ethicsCheckSrc = fs.readFileSync(path.join(root, 'build/tools/ethicsCheck.js'), 'utf8');
const criticalSrc = fs.readFileSync(path.join(root, 'build/tools/criticalThinking.js'), 'utf8');
assert(ethicsCheckSrc.includes('CALIBRATION'), 'ethicsCheck prompt includes CALIBRATION');
assert(
  ethicsCheckSrc.includes('Do NOT invent concerns') || ethicsCheckSrc.includes('Do NOT invent'),
  'ethicsCheck prompt forbids inventing concerns'
);
assert(criticalSrc.includes('CALIBRATION'), 'criticalThinking prompt includes CALIBRATION');
assert(
  criticalSrc.includes('Politeness') || criticalSrc.includes('politeness'),
  'criticalThinking prompt distinguishes politeness from sycophancy'
);

for (const fixture of fixtures) {
  console.error(`\n${fixture.id} — ${fixture.label}`);

  let result;
  if (fixture.tool === 'ethics_check') {
    result = await ethicsCheckTool({
      conversation: fixture.conversation,
      userRequest: fixture.userRequest,
      context: fixture.context,
      sessionId: `eval-${fixture.id}`,
      autoStore: false
    });
  } else {
    result = await criticalThinkingTool({
      aiResponse: fixture.aiResponse,
      userRequest: fixture.userRequest,
      context: fixture.context,
      sessionId: `eval-${fixture.id}`
    });
  }

  const risk = riskOf(result, fixture.tool);
  const count = concernCount(result, fixture.tool);
  const { maxRisk, minRisk, shouldFlag } = fixture.expect;

  assert(typeof risk === 'string', `returned risk level (${risk})`);

  if (maxRisk) {
    assert(
      riskLevelToScore(risk) <= riskLevelToScore(maxRisk),
      `risk ${risk} <= max ${maxRisk}`
    );
  }
  if (minRisk) {
    assert(
      riskLevelToScore(risk) >= riskLevelToScore(minRisk),
      `risk ${risk} >= min ${minRisk}`
    );
  }
  if (shouldFlag === false) {
    assert(count === 0, `false-positive guard: 0 findings (got ${count})`);
  }
  if (shouldFlag === true) {
    assert(count > 0, `false-negative guard: at least 1 finding (got ${count})`);
  }
}

try {
  fs.rmSync(testDir, { recursive: true, force: true });
} catch {
  // best-effort
}

console.error(`\n📊 Calibration results: ${passed} passed, ${failed} failed [provider=${provider.provider}]`);
if (failed > 0) {
  process.exit(1);
}
console.error('\n🎉 Calibration eval passed!');
process.exit(0);
