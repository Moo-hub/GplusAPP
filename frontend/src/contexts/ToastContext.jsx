import React, { createContext, useContext, useCallback, useState } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    setToasts((t) => [...t, toast]);
    return toast.id || null;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Provide a no-op fallback so importing modules work in tests without provider
    return {
      toasts: [],
      addToast: () => null,
      removeToast: () => {}
    };
  }
  return ctx;
};

export default ToastContext;
