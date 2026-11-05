#!/usr/bin/env node
// Fails the build when something that belongs in a private ops log reaches this
// public repository. It exists because a submission log once recorded the account
// holder's full legal name and an Apple Developer Support case id, and nothing
// checked the difference between "operational detail" and "publishable".
//
// Denied names are matched by SHA-256 of the lowercased token, so this file does
// not itself publish the thing it is guarding.
//
// Usage: node scripts/check-public-content.mjs [--list]

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

// SHA-256 of a lowercased single token. Add one with: --list prints how.
const DENIED_TOKEN_HASHES = new Map([
  ['da47d80ba551f790ba3ca296bae6837248d76149247bef1390e79a1fceeede0e',
   'a name that should not appear in a public repo'],
]);

const PATTERNS = [
  {
    name: 'support case id',
    re: /\b(?:case|ticket|incident)\s*#?\s*\d{8,}\b/gi,
    why: 'a vendor support case id identifies the account; describe the outcome instead',
  },
  {
    name: 'Apple-style case number',
    re: /\b10\d{10}\b/g,
    why: 'looks like an Apple Developer Support case number',
  },
];

const TEXT = /\.(md|mdx|txt|json|jsonc|yml|yaml|html|css|js|mjs|cjs|ts|tsx|svelte|sh|plist|entitlements)$/i;
const SKIP = /^(node_modules|dist|build|coverage|\.git|artifacts)\//;

function tokenHash(word) {
  return createHash('sha256').update(word.toLowerCase()).digest('hex');
}

if (process.argv.includes('--list')) {
  console.log('To deny a token, add the SHA-256 of its lowercase form to DENIED_TOKEN_HASHES:');
  console.log("  node -e \"console.log(require('crypto').createHash('sha256').update('WORD'.toLowerCase()).digest('hex'))\"");
  process.exit(0);
}

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter((f) => f && TEXT.test(f) && !SKIP.test(f));

const findings = [];

for (const file of files) {
  let text;
  try {
    if (statSync(file).size > 2_000_000) continue;
    text = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const word of line.match(/[\p{L}][\p{L}'’-]{2,}/gu) ?? []) {
      const hit = DENIED_TOKEN_HASHES.get(tokenHash(word));
      if (hit) findings.push({ file, line: i + 1, rule: 'denied token', why: hit });
    }
    for (const { name, re, why } of PATTERNS) {
      re.lastIndex = 0;
      if (re.test(line)) findings.push({ file, line: i + 1, rule: name, why });
    }
  });
}

if (findings.length === 0) {
  console.log(`check-public-content: ${files.length} tracked text files, nothing to flag.`);
  process.exit(0);
}

console.error('check-public-content: this repository is public, and these look private:\n');
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}  [${f.rule}] ${f.why}`);
}
console.error('\nRecord the outcome without the identifier, or keep the detail in a private note.');
process.exit(1);
