// auto-fix-react-imports.cjs
// Scans all .js/.jsx/.ts/.tsx files in src/ for JSX usage and injects 'import React from "react";' if missing.
// Usage: node ./scripts/auto-fix-react-imports.js

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
const REACT_IMPORT = "import React from 'react';\n";

function isJSX(content) {
  // Naive but effective: look for <Component or return (< or <> (fragment)
  return /<\w|return\s*\(\s*<|<>/.test(content);
}

function hasReactImport(content) {
  return /import\s+React(\s|,|\{|$)/.test(content);
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!isJSX(content) || hasReactImport(content)) return false;

  // Insert after shebang or first comment block, else at top
  let insertPos = 0;
  if (content.startsWith('#!')) {
    insertPos = content.indexOf('\n') + 1;
  } else if (content.startsWith('/*')) {
    insertPos = content.indexOf('*/') + 2;
    if (insertPos > 1) insertPos += (content[insertPos] === '\n' ? 1 : 0);
  }
  const newContent = content.slice(0, insertPos) + REACT_IMPORT + content.slice(insertPos);
  fs.writeFileSync(filePath, newContent, 'utf8');
  return true;
}

function walk(dir) {
  let changed = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      changed += walk(fullPath);
    } else if (FILE_EXTENSIONS.includes(path.extname(entry.name))) {
      if (processFile(fullPath)) {
        console.log('Patched:', path.relative(process.cwd(), fullPath));
        changed++;
      }
    }
  }
  return changed;
}

console.log('Scanning for JSX files missing React import...');
const total = walk(SRC_DIR);
console.log(`\nDone. Patched ${total} file(s).`);
