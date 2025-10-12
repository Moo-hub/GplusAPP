/**
 * @file LocalizedLoginScreen.jsx - صفحة تسجيل الدخول متعددة اللغات
 * @module screens/LocalizedLoginScreen
 */

import React from 'react';
import LocalizedLoginForm from '../components/auth/LocalizedLoginForm';
import useTranslationNamespaces from '../hooks/useTranslationNamespaces';
import { useLanguage } from '../i18nSetup';

/**
 * صفحة تسجيل الدخول متعددة اللغات
 *
 * @returns {React.ReactElement} صفحة تسجيل الدخول
 */
const LocalizedLoginScreen = () => {
  const { t } = useTranslationNamespaces(['common', 'auth']);
  const { isRTL } = useLanguage();
  
  return (
    <div className={`container ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card mt-5">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0 text-center">{t('auth.signIn')}</h2>
            </div>
            <div className="card-body">
              <LocalizedLoginForm />
            </div>
          </div>
          
          <div className="card mt-3">
            <div className="card-body text-center">
              <p>
                {t('auth.dontHaveAccount')}
                {' '}
                <a href="#" className="text-primary fw-bold">
                  {t('auth.signUp')}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalizedLoginScreen;