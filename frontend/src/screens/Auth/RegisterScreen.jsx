import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSafeTranslation from '../../hooks/useSafeTranslation';
import { useAuth } from '../../contexts/AuthContext';
import './AuthScreens.css';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // التحقق من تطابق كلمات المرور
    if (password !== passwordConfirm) {
      return setError(t('auth.passwordsDoNotMatch'));
    }
    
    setLoading(true);
    
    try {
      await register({ name, email, password, password_confirmation: passwordConfirm });
      navigate('/points', { replace: true });
    } catch (err) {
      setError(err.message || t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <Card title={t('auth.register')} variant="light">
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="name">{t('auth.name')}</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('auth.enterName')}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.enterEmail')}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.enterPassword')}
              required
              minLength="8"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="passwordConfirm">{t('auth.confirmPassword')}</label>
            <input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            disabled={loading}
          >
            {loading ? t('common.loading') : t('auth.registerButton')}
          </Button>
          
          <div className="auth-links">
            <Link to="/login">{t('auth.alreadyHaveAccount')}</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}