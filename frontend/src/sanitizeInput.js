// Simple input sanitization utility for React frontend
export function sanitizeInput(input) {
  // Remove script tags and encode special characters
  return input
    .replace(/<script.*?>.*?<\/script>/gi, '')
    .replace(/[&<>"]/g, function (c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
    });
}

