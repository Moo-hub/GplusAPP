import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.detail || t('auth.invalidCredentials'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container" data-testid="login-container">
      <div className="auth-card">
        <h2 data-testid="login-heading">{t('auth.login')}</h2>
        
        {error && <div className="error-message" data-testid="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} data-testid="login-form">
          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="email-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="password-input"
            />
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
        
        <div className="auth-links" data-testid="auth-links">
          <p>
            {t('auth.noAccount')} <Link to="/register" data-testid="register-link">{t('auth.register')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;