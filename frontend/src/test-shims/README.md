# Test shims pattern

Purpose

This directory contains small test shim modules used to keep runtime JSX inside .jsx files while preserving existing import paths that reference .js files. Vite's import-analysis requires JSX-containing modules to use a .jsx extension; these shims avoid breaking imports by re-exporting the .jsx implementations from a .js path.

Pattern

- Implement runtime JSX in a .jsx file (e.g. `react-icons-fa.jsx`).
- Create a small .js shim with the same import path that re-exports from the .jsx file:

  export * from './react-icons-fa.jsx';
  export { default } from './react-icons-fa.jsx';

Why this helps

- Avoids Vite import-analysis errors when a module contains JSX but is imported via a .js path.
- Keeps existing code and tests that import the .js path working without refactors.
- Makes incremental migrations safe and low-risk.

When to add a shim

- Add a shim when you convert a .js file that contains runtime JSX to .jsx but want to preserve the original .js import path.
- Prefer converting small files first (tests, utilities, tiny components). For larger files, consider changing importers to the .jsx path if possible.

Notes

- Keep shims minimal — only re-export from the .jsx file.
- Avoid duplicating test bodies in the .js shim; prefer a side-effect shim that imports the .jsx test (so both `vitest` and existing importers pick up the correct test).
- If you later update all importers to the .jsx path, you can remove the .js shim.
