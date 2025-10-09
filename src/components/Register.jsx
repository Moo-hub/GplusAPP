import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import useFormValidation from '../hooks/useFormValidation';
import LoadingSpinner from './common/LoadingSpinner';

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  
  // Form validation
  const validateForm = (values) => {
    const errors = {};
    
    if (!values.name?.trim()) {
      errors.name = t('validation.nameRequired');
    }
    
    if (!values.email) {
      errors.email = t('validation.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = t('validation.emailInvalid');
    }
    
    if (!values.password) {
      errors.password = t('validation.passwordRequired');
    } else if (values.password.length < 6) {
      errors.password = t('validation.passwordTooShort');
    }
    
    if (values.password !== values.confirmPassword) {
      errors.confirmPassword = t('validation.passwordsDontMatch');
    }
    
    return errors;
  };
  
  // Initialize form with validation
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit
  } = useFormValidation(
    {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    validateForm,
    async (validatedValues) => {
      try {
        await registerUser({
          name: validatedValues.name,
          email: validatedValues.email,
          password: validatedValues.password
        });
        navigate('/dashboard');
      } catch (error) {
        console.error('Registration error:', error);
        return {
          form: error.response?.data?.message || t('auth.registrationFailed')
        };
      }
    }
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('auth.register')}</h2>
        
        {errors.form && (
          <div className="error-message">{errors.form}</div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{t('auth.name')}</label>
            <input
              type="text"
              id="name"
              name="name"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.name && errors.name ? 'input-error' : ''}
            />
            {touched.name && errors.name && (
              <div className="error-message">{errors.name}</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.email && errors.email ? 'input-error' : ''}
            />
            {touched.email && errors.email && (
              <div className="error-message">{errors.email}</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.password && errors.password ? 'input-error' : ''}
            />
            {touched.password && errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={values.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.confirmPassword && errors.confirmPassword ? 'input-error' : ''}
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <div className="error-message">{errors.confirmPassword}</div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <LoadingSpinner size="small" color="white" />
            ) : (
              t('auth.register')
            )}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            {t('auth.alreadyHaveAccount')} <Link to="/login">{t('auth.login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;