/**
 * Replace imports of `act` from 'react-dom/test-utils' to 'react'
 * Usage with jscodeshift:
 *   jscodeshift -t transform-act-imports.js <path>
 */

module.exports = function transformer(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Replace named import { act } from 'react-dom/test-utils' -> from 'react'
  root.find(j.ImportDeclaration, { source: { value: 'react-dom/test-utils' } })
    .forEach(path => {
      const specifiers = path.node.specifiers || [];
      // If there's an `act` specifier, we'll move it to a new import from 'react'
      const hasAct = specifiers.some(s => s.type === 'ImportSpecifier' && s.imported && s.imported.name === 'act');
      if (!hasAct) return;

      // Remove only the act specifier from this import
      path.node.specifiers = specifiers.filter(s => !(s.type === 'ImportSpecifier' && s.imported && s.imported.name === 'act'));

      // If the original import now has no specifiers, remove the whole import
      if (!path.node.specifiers || path.node.specifiers.length === 0) {
        j(path).remove();
      }

      // Add or merge import { act } from 'react'
      const existingReactImport = root.find(j.ImportDeclaration, { source: { value: 'react' } });
      if (existingReactImport.size() > 0) {
        existingReactImport.forEach(ri => {
          // Ensure we don't duplicate the specifier
          const has = (ri.node.specifiers || []).some(s => s.type === 'ImportSpecifier' && s.imported && s.imported.name === 'act');
          if (!has) {
            ri.node.specifiers.push(j.importSpecifier(j.identifier('act')));
          }
        });
      } else {
        // Insert a new import at the top
        root.get().node.program.body.unshift(
          j.importDeclaration([j.importSpecifier(j.identifier('act'))], j.literal('react'))
        );
      }
    });

  return root.toSource({ quote: 'single' });
};
