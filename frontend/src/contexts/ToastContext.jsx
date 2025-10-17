import React, { createContext, useContext, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
	const defaultOpts = { position: toast.POSITION.TOP_RIGHT, autoClose: 5000 };

	const showSuccess = useCallback((message, config = {}) => {
		toast.success(message, { ...defaultOpts, ...config });
	}, []);

	const showError = useCallback((message, config = {}) => {
		toast.error(message, { ...defaultOpts, ...config });
	}, []);

	const showInfo = useCallback((message, config = {}) => {
		toast.info(message, { ...defaultOpts, ...config });
	}, []);

	const showWarning = useCallback((message, config = {}) => {
		toast.warn(message, { ...defaultOpts, ...config });
	}, []);

	const addToast = useCallback(({
		type = 'info',
		title = '',
		message = '',
		...opts
	}) => {
		const content = title ? `${title}: ${message}` : message;
		switch (type) {
			case 'success':
				toast.success(content, { ...defaultOpts, ...opts });
				break;
			case 'error':
				toast.error(content, { ...defaultOpts, ...opts });
				break;
			case 'warning':
				toast.warn(content, { ...defaultOpts, ...opts });
				break;
			default:
				toast.info(content, { ...defaultOpts, ...opts });
		}
	}, []);

	const value = { showSuccess, showError, showInfo, showWarning, addToast };

	return (
		<ToastContext.Provider value={value}>
			{children}
			<ToastContainer position={toast.POSITION.TOP_RIGHT} autoClose={5000} />
		</ToastContext.Provider>
	);
};

export const useToast = () => {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error('useToast must be used within a ToastProvider');
	return ctx;
};

export default ToastContext;
