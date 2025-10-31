// Test shim for @tanstack/react-query-devtools
// Export a no-op Devtools component so imports in App.jsx don't fail during tests.
export const ReactQueryDevtools = () => null;
export default ReactQueryDevtools;
