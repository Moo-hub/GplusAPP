#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const targetDir = path.join(root, 'frontend', 'src');
const hookPath = path.join(targetDir, 'hooks', 'useSafeTranslation'); // without extension

const exts = ['.js', '.jsx', '.ts', '.tsx'];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...walk(full));
    } else if (exts.includes(path.extname(e.name))) {
      files.push(full);
    }
  }
  return files;
}

function makeImportPath(fromFile) {
  const rel = path.relative(path.dirname(fromFile), hookPath);
  let p = rel.split(path.sep).join('/');
  if (!p.startsWith('.')) p = './' + p;
  // remove extension if present
  p = p.replace(/\.jsx?$|\.tsx?$|\.ts$|\.js$/i, '');
  return p;
}

const files = walk(targetDir);
const changed = [];

for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes("react-i18next")) continue;

  // find import lines with named imports
  const importRegex = /import\s*{([^}]*)}\s*from\s*['"]react-i18next['"];?/g;
  let m;
  let updated = src;
  let madeChange = false;
  while ((m = importRegex.exec(src)) !== null) {
    const fullMatch = m[0];
    const inside = m[1];
    const parts = inside.split(',').map(s => s.trim()).filter(Boolean);
    // detect useTranslation (with optional alias)
    const idx = parts.findIndex(p => /^useTranslation(\s+as\s+\w+)?$/.test(p));
    if (idx === -1) continue;

    // remove the useTranslation part
    const remaining = parts.filter((_, i) => i !== idx);
    const importPath = makeImportPath(file);
    let replacement = '';
    if (remaining.length > 0) {
      replacement = `import { ${remaining.join(', ')} } from 'react-i18next';\nimport useSafeTranslation from '${importPath}';`;
    } else {
      replacement = `import useSafeTranslation from '${importPath}';`;
    }

    updated = updated.replace(fullMatch, replacement);
    madeChange = true;
  }

  // Replace common call-site patterns of useTranslation() with useSafeTranslation()
  // but skip test files and files under __tests__
  if (!/__tests__/.test(file) && !/\.test\./.test(path.basename(file))) {
    const callSiteRegex = /const\s*\{?\s*([^}]+?)\s*\}?\s*=\s*useTranslation\s*\(\s*\)\s*;/g;
    updated = updated.replace(callSiteRegex, (match, inner) => {
      // normalize whitespace in inner
      const parts = inner.split(',').map(s => s.trim()).filter(Boolean);
      const left = parts.length ? `{ ${parts.join(', ')} }` : '';
      return `${left ? `const ${left} = ` : 'const '}useSafeTranslation();`;
    });
  }

  if (madeChange && updated !== src) {
    // backup
    fs.writeFileSync(file + '.bak', src, 'utf8');
    fs.writeFileSync(file, updated, 'utf8');
    changed.push(file);
  }
}

console.log(`Scanned ${files.length} files under ${targetDir}`);
console.log(`Updated ${changed.length} files:`);
for (const f of changed) console.log(' -', path.relative(root, f));

if (changed.length === 0) process.exitCode = 0;
