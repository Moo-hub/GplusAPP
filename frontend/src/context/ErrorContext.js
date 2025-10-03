// This file intentionally avoids JSX and re-exports the JSX implementation.
// Keeping this lightweight JS re-export prevents tooling from attempting to parse
// JSX in files named .js while allowing existing import paths (../context/ErrorContext)
// to continue to work.

export { default } from './ErrorContext.jsx';
export { ErrorProvider, useError as useErrorContext } from './ErrorContext.jsx';
