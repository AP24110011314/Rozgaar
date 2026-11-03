#!/usr/bin/env node

/**
 * Rozgaar Secrets Audit Script
 *
 * Scans all repository files to ensure NO production secrets, API keys,
 * cloud credentials, or live database connection strings are tracked in git.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'uploads',
  'docs',
  '.gemini',
  '.system_generated',
  '.vscode',
  '.idea',
]);

const IGNORED_FILES = new Set([
  'package-lock.json',
  '.env',
  '.env.example',
  'test.env',
  '.DS_Store',
]);

const SECRET_PATTERNS = [
  {
    id: 'LIVE_MONGO_SRV',
    name: 'Live MongoDB Connection String with Credentials',
    regex: /mongodb(\+srv)?:\/\/[a-zA-Z0-9._%+-]+:[^@\s'"]+@[a-zA-Z0-9.-]+/i,
  },
  {
    id: 'AWS_ACCESS_KEY',
    name: 'AWS Access Key ID (AKIA...)',
    regex: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    id: 'RESEND_API_KEY',
    name: 'Resend API Key (re_...)',
    regex: /\bre_[0-9a-zA-Z_]{20,}\b/,
  },
  {
    id: 'PRIVATE_KEY',
    name: 'Private Key Block',
    regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
  },
];

let scannedCount = 0;
const violations = [];

function auditFile(filePath) {
  if (filePath === __filename) return;

  const relPath = path.relative(ROOT_DIR, filePath);
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return;
  }

  scannedCount++;
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip example placeholders
    if (line.includes('<username>') || line.includes('<password>') || line.includes('your_')) {
      return;
    }

    for (const pattern of SECRET_PATTERNS) {
      if (pattern.regex.test(line)) {
        violations.push({
          file: relPath,
          line: index + 1,
          rule: pattern.name,
          content: line.trim().slice(0, 80),
        });
      }
    }
  });
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        walk(path.join(dir, entry.name));
      }
    } else if (entry.isFile()) {
      if (IGNORED_FILES.has(entry.name)) continue;
      auditFile(path.join(dir, entry.name));
    }
  }
}

console.log('🔒 Rozgaar Secrets Audit: Checking for leaked credentials and connection strings...');
walk(ROOT_DIR);

if (violations.length > 0) {
  console.error(`\n❌ Secrets Audit Failed: Found ${violations.length} potential secret(s):\n`);
  violations.forEach((v, idx) => {
    console.error(`  [${idx + 1}] ${v.file}:${v.line} - ${v.rule}\n      Line: "${v.content}"`);
  });
  process.exit(1);
} else {
  console.log(`✅ Secrets Audit Passed: 0 secrets detected across ${scannedCount} files.\n`);
  process.exit(0);
}
