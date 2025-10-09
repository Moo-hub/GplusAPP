import fs from 'fs';
import glob from 'glob';

const files = glob.sync('frontend/src/**/*.test.{js,jsx,ts,tsx}', { nodir: true });
for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  const original = code;
  // Replace common screen.getBy* -> await screen.findBy*
  code = code.replace(/screen\.getBy([A-Z][A-Za-z0-9_]*)/g, 'await screen.findBy$1');
  // Replace getBy (from destructured queries) -> await findBy
  code = code.replace(/([^\w])getBy([A-Z][A-Za-z0-9_]*)/g, '$1await findBy$2');
  // If file uses render but not awaited, we don't force await to avoid false positives
  if (code !== original) {
    fs.writeFileSync(file, code);
    console.log(`Patched async queries in ${file}`);
  }
}
