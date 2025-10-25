
// Simple error logging utility for frontend
export function logError(...args) {
	// يمكنك تخصيص طريقة تسجيل الخطأ هنا (مثلاً إرسال للـ Sentry أو console)
	if (typeof console !== 'undefined') {
		console.error('[logError]', ...args);
	}
}

