// Simple error logging utility for frontend
export function logError(error) {
  // Log to console (can be extended to send to a monitoring service)
  // Optionally, integrate Sentry or another service here
  // Example: Sentry.captureException(error);
  console.error('App Error:', error);
}

