import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import useSafeTranslation from '../hooks/useSafeTranslation';

const Login = () => {
  const { t } = useSafeTranslation();
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
  try { const { logError } = require('../logError'); logError('Login error:', error); } catch (e) { try { require('../utils/logger').error('Login error:', error); } catch (er) {} }
      setError(error.response?.data?.detail || t('auth.invalidCredentials'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container" data-testid="login-container">
      <div className="auth-card">
        <h2 data-testid="login-heading">{t('auth.login')}</h2>
        
        {/* Development Test Credentials */}
        {process.env.NODE_ENV === 'development' && (
          <div className="test-credentials" style={{
            background: '#f0f8ff',
            border: '1px solid #0288d1',
            borderRadius: '4px',
            padding: '8px',
            margin: '8px 0',
            fontSize: '12px',
            color: '#0288d1'
          }}>
            <strong>Test Credentials:</strong><br/>
            Email: test@example.com<br/>
            Password: password123
          </div>
        )}
        
        {error && <div className="error-message" data-testid="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} data-testid="login-form">
          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              data-testid="email-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
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