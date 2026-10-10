#!/usr/bin/env node

/**
 * Install the companion Cursor skill next to the MCP server.
 *
 *   npx --package @r-huijts/ethics-vibe-check ethics-vibe-check-install-skill
 *   npm run install-skill
 *
 * Destination: $CURSOR_SKILLS_DIR or ~/.cursor/skills/ethics-vibe-check
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.join(__dirname, '..');
const sourceDir = path.join(packageRoot, 'skills', 'ethics-vibe-check');

const destRoot =
  process.env.CURSOR_SKILLS_DIR ||
  path.join(os.homedir(), '.cursor', 'skills');
const destDir = path.join(destRoot, 'ethics-vibe-check');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

if (!fs.existsSync(path.join(sourceDir, 'SKILL.md'))) {
  console.error(`Skill source not found at ${sourceDir}`);
  console.error('If you installed from npm, ensure package version includes the skills/ folder.');
  process.exit(1);
}

copyDir(sourceDir, destDir);
console.log(`Installed ethics-vibe-check skill → ${destDir}`);
console.log('Restart Cursor (or reload skills) if it was already open.');
