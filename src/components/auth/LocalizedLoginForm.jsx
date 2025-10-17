/**
 * @file LocalizedLoginForm.jsx - نموذج تسجيل الدخول متعدد اللغات
 * @module components/auth/LocalizedLoginForm
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useTranslationNamespaces from '../../hooks/useTranslationNamespaces';
import { useLanguage } from '../../i18nSetup';
import { useDirectionalStyles } from '../../utils/directionalHelpers';
import LanguageSelector from '../common/LanguageSelector';

/**
 * نموذج تسجيل الدخول متعدد اللغات
 *
 * @returns {React.ReactElement} نموذج تسجيل الدخول
 */
const LocalizedLoginForm = () => {
  const { t } = useTranslationNamespaces(['common', 'auth']);
  const { isRTL } = useLanguage();
  const directionalStyles = useDirectionalStyles();
  const navigate = useNavigate();
  
  // حالة النموذج
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  // حالة الأخطاء
  const [errors, setErrors] = useState({});
  
  /**
   * معالجة تغيير حقل النموذج
   *
   * @param {Event} e - حدث تغيير الحقل
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // إزالة رسالة الخطأ عند تعديل الحقل
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  /**
   * التحقق من صحة النموذج
   *
   * @returns {boolean} صحة النموذج
   */
  const validateForm = () => {
    const newErrors = {};
    
    // التحقق من البريد الإلكتروني
    if (!formData.email) {
      newErrors.email = t('auth:errors.emailRequired', 'Email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth:errors.emailInvalid', 'Email is invalid');
    }
    
    // التحقق من كلمة المرور
    if (!formData.password) {
      newErrors.password = t('auth:errors.passwordRequired', 'Password is required');
    } else if (formData.password.length < 6) {
      newErrors.password = t('auth:errors.passwordTooShort', 'Password must be at least 6 characters');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  /**
   * معالجة إرسال النموذج
   *
   * @param {Event} e - حدث الإرسال
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // محاكاة نجاح تسجيل الدخول
      console.log('Login successful with:', formData);
      
      // انتقل إلى الصفحة الرئيسية بعد نجاح تسجيل الدخول
      setTimeout(() => {
        navigate('/');
      }, 1000);
    }
  };
  
  return (
    <div className={`login-form-container ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="language-selector-container" style={{ textAlign: 'right', marginBottom: '20px' }}>
        <LanguageSelector variant="buttons" />
      </div>
      
      <h2 style={directionalStyles.textAlign('start')}>{t('auth.signIn')}</h2>
      
      <form onSubmit={handleSubmit} className="login-form" style={directionalStyles.direction()}>
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={directionalStyles.textAlign('start')}>
            {t('auth.email')}:
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
            style={{ direction: 'ltr' }}
          />
          {errors.email && (
            <div className="invalid-feedback" style={{ display: 'block', color: 'red' }}>
              {errors.email}
            </div>
          )}
        </div>
        
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={directionalStyles.textAlign('start')}>
            {t('auth.password')}:
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
          />
          {errors.password && (
            <div className="invalid-feedback" style={{ display: 'block', color: 'red' }}>
              {errors.password}
            </div>
          )}
        </div>
        
        <div className="form-group form-check" style={{ marginBottom: '15px' }}>
          <input
            type="checkbox"
            id="rememberMe"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="form-check-input"
          />
          <label htmlFor="rememberMe" className="form-check-label" style={{ ...directionalStyles.padding('5px', '0px') }}>
            {t('auth.rememberMe')}
          </label>
        </div>
        
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <button type="submit" className="btn btn-primary">
            {t('auth.signIn')}
          </button>
        </div>
        
        <div className="form-group" style={{ marginBottom: '15px', textAlign: 'center' }}>
          <a href="#" className="forgot-password">
            {t('auth.forgotPassword')}
          </a>
        </div>
      </form>
    </div>
  );
};

export default LocalizedLoginForm;