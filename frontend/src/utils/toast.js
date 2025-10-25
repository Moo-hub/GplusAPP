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

export const showSuccess = (message, options = {}) => {
	const config = {
		...DEFAULT_CONFIG,
		...options,
		className: `${VARIANTS.success.className} ${options.className || ''}`.trim(),
	};
	const content = (
		<div className="toast-content">
			<span className="toast-icon" role="img" aria-hidden="true">
				{VARIANTS.success.icon}
			</span>
			<span>{message}</span>
		</div>
	);
	try {
		const t = getToast();
		if (t && typeof t.success === 'function') t.success(content, config);
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
	const content = (
		<div className="toast-content">
			<span className="toast-icon" role="img" aria-hidden="true">
				{VARIANTS.error.icon}
			</span>
			<span>{errorMessage}</span>
		</div>
	);
	try {
		const t = getToast();
		if (t && typeof t.error === 'function') t.error(content, config);
	} catch (e) {}
};

export const showWarning = (message, options = {}) => {
	const config = {
		...DEFAULT_CONFIG,
		...options,
		className: `${VARIANTS.warning.className} ${options.className || ''}`.trim(),
	};
	const content = (
		<div className="toast-content">
			<span className="toast-icon" role="img" aria-hidden="true">
				{VARIANTS.warning.icon}
			</span>
			<span>{message}</span>
		</div>
	);
	try {
		const t = getToast();
		if (t && typeof t.warn === 'function') t.warn(content, config);
	} catch (e) {}
};

export const showInfo = (message, options = {}) => {
	const config = {
		...DEFAULT_CONFIG,
		...options,
		className: `${VARIANTS.info.className} ${options.className || ''}`.trim(),
	};
	const content = (
		<div className="toast-content">
			<span className="toast-icon" role="img" aria-hidden="true">
				{VARIANTS.info.icon}
			</span>
			<span>{message}</span>
		</div>
	);
	try {
		const t = getToast();
		if (t && typeof t.info === 'function') t.info(content, config);
	} catch (e) {}
};

export const showPromise = (promise, messages, options = {}) => {
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
		if (t && typeof t.isActive === 'function' && t.isActive(toastId)) {
			if (typeof t.update === 'function') t.update(toastId, options);
		}
	} catch (e) {}
};