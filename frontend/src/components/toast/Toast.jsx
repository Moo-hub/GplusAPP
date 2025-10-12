import React, { createContext, useContext, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Deprecated: Use ToastProvider and useToast from ../contexts/ToastContext instead
export { ToastProvider, useToast } from '../../contexts/ToastContext';
