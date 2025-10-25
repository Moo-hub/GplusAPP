import i18n from '../i18n/i18n';

const getToast = () => {
	if (typeof globalThis !== 'undefined' && globalThis.__TEST_TOAST__) return globalThis.__TEST_TOAST__;
	try {
		if (typeof require === 'function') {
			// eslint-disable-next-line global-require
			const t = require('react-toastify');
			if (!t) return null;
			return t.toast ? t.toast : t;
		}
	} catch (e) {
		// ignore
	}
	return null;
};

export const DEFAULT_CONFIG = {
	position: 'top-right',
	autoClose: 5000,
	hideProgressBar: false,
	closeOnClick: true,
	pauseOnHover: true,
	draggable: true,
	progress: undefined,
};

export const VARIANTS = {
	success: {
		className: 'toast-success',
		icon: '\u2705',
	},
	error: {
		className: 'toast-error',
		icon: '\u274c',
	},
	warning: {
		className: 'toast-warning',
		icon: '\u26a0\ufe0f',
	},
	info: {
		className: 'toast-info',
		icon: '\u2139\ufe0f',
	},
};

function formatToast(variant, message) {
	return `${VARIANTS[variant].icon} ${message}`;
}

export const showSuccess = (message, options = {}) => {
	const config = {
		...DEFAULT_CONFIG,
		...options,
		className: `${VARIANTS.success.className} ${options.className || ''}`.trim(),
	};
	try {
		const t = getToast();
		if (t && typeof t.success === 'function') {
			t.success(formatToast('success', message), config);
		}
	} catch (e) {}
};

export const showError = (message, options = {}) => {
	let errorMessage = '';
	if (message instanceof Error) {
		errorMessage = message.message || String(message);
	} else if (typeof message === 'object' && message !== null) {
		errorMessage = message.message || message.detail || i18n.t('errors.generalError');
	} else {
		errorMessage = String(message || i18n.t('errors.generalError'));
	}
	const config = {
		...DEFAULT_CONFIG,
		...options,
		className: `${VARIANTS.error.className} ${options.className || ''}`.trim(),
		autoClose: options.autoClose || 7000,
	};
	try {
		const t = getToast();
		if (t && typeof t.error === 'function') {
			// Debug trace for test: log every call
			if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
				// eslint-disable-next-line no-console
				console.log('showError called', errorMessage, config);
			}
			t.error(formatToast('error', errorMessage), config);
		}
	} catch (e) {}
};

export const showWarning = (message, options = {}) => {
	const config = {
		...DEFAULT_CONFIG,
		...options,
		className: `${VARIANTS.warning.className} ${options.className || ''}`.trim(),
	};
	try {
		const t = getToast();
		if (t && typeof t.warn === 'function') {
			t.warn(formatToast('warning', message), config);
		}
	} catch (e) {}
};

export const showInfo = (message, options = {}) => {
	const config = {
		...DEFAULT_CONFIG,
		...options,
		className: `${VARIANTS.info.className} ${options.className || ''}`.trim(),
	};
	try {
		const t = getToast();
		if (t && typeof t.info === 'function') {
			t.info(formatToast('info', message), config);
		}
	} catch (e) {}
};

export const showPromise = (promise, messages = {}, options = {}) => {
	const defaultMessages = {
		pending: i18n.t('common.loading'),
		success: i18n.t('common.success'),
		error: i18n.t('errors.generalError'),
	};
	const toastMessages = { ...defaultMessages, ...messages };
	const config = { ...DEFAULT_CONFIG, ...options };
	try {
		const t = getToast();
		if (t && typeof t.promise === 'function') return t.promise(promise, toastMessages, config);
	} catch (e) {}
	return promise;
};

export const dismissAll = (clearWaitingQueue = true) => {
	try {
		const t = getToast();
		if (t && typeof t.dismiss === 'function') t.dismiss(clearWaitingQueue ? undefined : null);
	} catch (e) {}
};

export const updateToast = (toastId, options) => {
	try {
		const t = getToast();
		if (t && typeof t.isActive === 'function') {
			const active = t.isActive(toastId);
			if (active && typeof t.update === 'function') {
				// Debug trace for test: log every call
				if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
					// eslint-disable-next-line no-console
					console.log('updateToast called', toastId, options);
				}
				t.update(toastId, options);
			}
		}
	} catch (e) {}
};

const toastUtils = {
	showSuccess,
	showError,
	showWarning,
	showInfo,
	showPromise,
	dismissAll,
	updateToast,
	DEFAULT_CONFIG,
	VARIANTS,
};

export default toastUtils;
