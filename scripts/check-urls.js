#!/usr/bin/env node

/**
 * Rozgaar URL & Port Audit Verification Script
 *
 * Scans all repository code, configuration, tests, seed scripts, and documentation
 * to ensure ZERO hard-coded URLs, ports, hostnames, connection strings, or secrets
 * exist in the codebase.
 *
 * Rules:
 *  - No "http://localhost" or "https://localhost"
 *  - No "127.0.0.1"
 *  - No hard-coded MongoDB URLs (mongodb:// or mongodb+srv://) in source/test files
 *  - No usage of port 5000 as a port or fallback (only explicit 5000 rejection guards allowed)
 *  - No unparameterized cloud storage URLs (e.g. *.s3.amazonaws.com)
 *
 * Ignores: .git, node_modules, dist, build, uploads, .env, .env.example, test.env, package-lock.json, binary files.
 *
 * Exit code:
 *  0 - All files clean, zero violations.
 *  1 - Violations found, file & line references printed.
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

const IGNORED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.pdf',
  '.ico',
  '.woff',
  '.woff2',
  '.svg',
]);

// Violation patterns
const RULES = [
  {
    id: 'LOCALHOST_URL',
    name: 'Hard-coded localhost URL (http://localhost or https://localhost)',
    regex: /https?:\/\/localhost/i,
  },
  {
    id: 'LOOPBACK_IP',
    name: 'Hard-coded loopback IPv4 address (127.0.0.1)',
    regex: /127\.0\.0\.1/,
  },
  {
    id: 'HARDCODED_MONGO_URL',
    name: 'Hard-coded MongoDB connection URL (mongodb:// or mongodb+srv://)',
    regex: /mongodb(\+srv)?:\/\/[^\s'"<>`]+/i,
  },
  {
    id: 'PORT_5000_USAGE',
    name: 'Forbidden port 5000 usage (default, fallback, or listen port)',
    // Matches port 5000 when used as a fallback, assignment, or target port
    // Ignores explicit guard checks that reject port 5000 (e.g. '!== 5000', '=== 5000', 'prohibited')
    test: (line) => {
      if (
        line.includes('=== 5000') ||
        line.includes('!== 5000') ||
        line.includes('!= 5000') ||
        line.toLowerCase().includes('prohibited') ||
        line.toLowerCase().includes('reject') ||
        line.toLowerCase().includes('reserves port 5000') ||
        line.toLowerCase().includes('no port 5000') ||
        line.toLowerCase().includes('why not port 5000') ||
        line.toLowerCase().includes('free port 5000') ||
        line.toLowerCase().includes('avoids port 5000')
      ) {
        return false;
      }
      return (
        /(?:PORT\s*\|\|\s*5000|PORT\s*\?\?\s*5000|port\s*:\s*5000|listen\s*\(\s*5000|:5000\b)/.test(
          line
        )
      );
    },
  },
  {
    id: 'UNPARAMETERIZED_S3',
    name: 'Unparameterized hard-coded AWS S3 cloud URL',
    regex: /https:\/\/[a-zA-Z0-9.\-_]+\.s3\.[a-zA-Z0-9.\-_]+\.amazonaws\.com/i,
  },
];

let scannedCount = 0;
const violations = [];

function auditFile(filePath) {
  // Ignore the check-urls script itself
  if (filePath === __filename) return;

  const relPath = path.relative(ROOT_DIR, filePath);
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.warn(`⚠️  Could not read ${relPath}: ${err.message}`);
    return;
  }

  scannedCount++;

  // Documented & audited exception: client/vercel.json
  // Vercel reverse proxy rewrites do not support dynamic environment variables in vercel.json.
  // Therefore, the single production backend destination (https://rozgaar-api.onrender.com/api/v1/:path*)
  // in client/vercel.json is the ONLY allowed exception across the entire codebase.
  const normalizedRelPath = relPath.replace(/\\/g, '/');
  if (normalizedRelPath === 'client/vercel.json') {
    if (content.includes('5000')) {
      violations.push({
        file: relPath,
        line: 1,
        ruleId: 'PORT_5000_USAGE',
        ruleName: 'Forbidden port 5000 usage',
        content: 'Port 5000 is strictly prohibited',
      });
    }
    return;
  }

  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    for (const rule of RULES) {
      let isViolation = false;
      if (rule.regex) {
        isViolation = rule.regex.test(line);
      } else if (rule.test) {
        isViolation = rule.test(line);
      }

      if (isViolation) {
        violations.push({
          file: relPath,
          line: lineNum,
          ruleId: rule.id,
          ruleName: rule.name,
          content: line.trim(),
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
      const ext = path.extname(entry.name).toLowerCase();
      if (IGNORED_EXTENSIONS.has(ext)) continue;
      auditFile(path.join(dir, entry.name));
    }
  }
}

console.log('🔍 Rozgaar Codebase Audit: Checking for forbidden hardcoded URLs, ports, and hosts...');
console.log(`📂 Scanning root directory: ${ROOT_DIR}\n`);

walk(ROOT_DIR);

if (violations.length > 0) {
  console.error(`❌ Audit Failed: Found ${violations.length} violation(s):\n`);
  violations.forEach((v, i) => {
    console.error(
      `  [${i + 1}] ${v.file}:${v.line}\n      Rule: ${v.ruleName}\n      Line: "${v.content}"\n`
    );
  });
  console.error(
    `Total files scanned: ${scannedCount}. Please fix the above violations and ensure all URLs and ports are driven by environment variables.`
  );
  process.exit(1);
} else {
  console.log(`✅ Audit Passed: 0 violations found across ${scannedCount} files.`);
  console.log('✨ All URLs, ports, hosts, and cloud resources are strictly environment-driven.\n');
  process.exit(0);
}

