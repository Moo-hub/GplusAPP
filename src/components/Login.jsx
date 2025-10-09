import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Get the redirect path from state, or default to dashboard
  const from = location.state?.from?.pathname || "/dashboard";
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refs for focus management
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const errorRef = useRef(null);
  
  // Set focus to email input on mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);
  
  // Handle focus when errors appear
  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError(t('validation.allFieldsRequired'));
      return;
    }
    
    try {
      setIsSubmitting(true);
      await login(email, password);
      // Navigate to the redirect path (either the intended page or dashboard)
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.detail || t('auth.invalidCredentials'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('auth.login')}</h2>
        
        {error && (
          <div 
            id="form-error"
            ref={errorRef}
            className="error-message" 
            role="alert"
            tabIndex="-1"
          >
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} data-testid="login-form">
          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              data-testid="email-input"
              ref={emailInputRef}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-describedby={error ? "form-error" : undefined}
              aria-invalid={error ? "true" : "false"}
              required
            />
            {/* Field-level errors are surfaced via the main form alert for screen-readers */}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              data-testid="password-input"
              ref={passwordInputRef}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={error ? "form-error" : undefined}
              aria-invalid={error ? "true" : "false"}
              required
            />
            {/* Field-level errors are surfaced via the main form alert for screen-readers */}
          </div>
          
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isSubmitting}
            data-testid="login-button"
          >
            {isSubmitting ? t('common.loading') : t('auth.login')}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            {t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;