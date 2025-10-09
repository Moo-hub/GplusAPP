/**
 * @file LocalizedRoutingExample.jsx - مثال على استخدام التوجيه متعدد اللغات
 * @module examples/LocalizedRoutingExample
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LanguageProvider } from '../i18nSetup';
import LocalizedRouter from '../components/common/LocalizedRouter';
import LocalizedLink from '../components/common/LocalizedLink';
import LanguageSwitcherWithRoute, { LanguageSwitcherButtons } from '../components/common/LanguageSwitcherWithRoute';
import LocalizedProtectedRoute from '../components/common/LocalizedProtectedRoute';
import useTranslationNamespaces from '../hooks/useTranslationNamespaces';
import LocalizedBreadcrumbs from '../components/common/LocalizedBreadcrumbs';
import { useDirectionalStyles } from '../utils/directionalHelpers';

// مكونات الصفحات للمثال
const HomePage = () => {
  const { t } = useTranslationNamespaces(['common', 'home']);
  const directionalStyles = useDirectionalStyles();
  
  return (
    <div style={directionalStyles.direction()}>
      <h1>{t('home.title', 'Welcome to Our Website')}</h1>
      <p>{t('home.description', 'This is a multilingual website example')}</p>
      
      <nav>
        <ul>
          <li>
            <LocalizedLink to="/products">{t('common.products', 'Products')}</LocalizedLink>
          </li>
          <li>
            <LocalizedLink to="/about">{t('common.about', 'About Us')}</LocalizedLink>
          </li>
          <li>
            <LocalizedLink to="/contact">{t('common.contact', 'Contact')}</LocalizedLink>
          </li>
          <li>
            <LocalizedLink to="/dashboard">{t('common.dashboard', 'Dashboard')}</LocalizedLink>
          </li>
        </ul>
      </nav>
    </div>
  );
};

const ProductsPage = () => {
  const { t } = useTranslationNamespaces(['common', 'products']);
  
  const products = [
    { id: 1, name: t('products.product1', 'Product 1') },
    { id: 2, name: t('products.product2', 'Product 2') },
    { id: 3, name: t('products.product3', 'Product 3') }
  ];
  
  return (
    <div>
      <h1>{t('products.title', 'Our Products')}</h1>
      <ul>
        {products.map(product => (
          <li key={product.id}>
            <LocalizedLink to={`/products/${product.id}`}>{product.name}</LocalizedLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ProductDetailPage = () => {
  const { t } = useTranslationNamespaces(['common', 'products']);
  const productId = window.location.pathname.split('/').pop();
  
  return (
    <div>
      <h1>{t('products.detail', 'Product Details')}</h1>
      <p>{t('products.viewingProduct', 'You are viewing product')} #{productId}</p>
    </div>
  );
};

const AboutPage = () => {
  const { t } = useTranslationNamespaces(['common', 'about']);
  
  return (
    <div>
      <h1>{t('about.title', 'About Us')}</h1>
      <p>{t('about.description', 'We are a company dedicated to providing high-quality products.')}</p>
    </div>
  );
};

const ContactPage = () => {
  const { t } = useTranslationNamespaces(['common', 'contact']);
  
  return (
    <div>
      <h1>{t('contact.title', 'Contact Us')}</h1>
      <form>
        <div>
          <label htmlFor="name">{t('contact.name', 'Name')}</label>
          <input type="text" id="name" />
        </div>
        <div>
          <label htmlFor="email">{t('contact.email', 'Email')}</label>
          <input type="email" id="email" />
        </div>
        <div>
          <label htmlFor="message">{t('contact.message', 'Message')}</label>
          <textarea id="message"></textarea>
        </div>
        <button type="submit">{t('common.buttons.submit', 'Submit')}</button>
      </form>
    </div>
  );
};

const DashboardPage = () => {
  const { t } = useTranslationNamespaces(['common', 'dashboard']);
  
  return (
    <div>
      <h1>{t('dashboard.title', 'Dashboard')}</h1>
      <p>{t('dashboard.welcome', 'Welcome to your dashboard')}</p>
    </div>
  );
};

const LoginPage = () => {
  const { t } = useTranslationNamespaces(['common', 'auth']);
  
  return (
    <div>
      <h1>{t('auth.login.title', 'Login')}</h1>
      <form>
        <div>
          <label htmlFor="email">{t('auth.login.email', 'Email')}</label>
          <input type="email" id="email" />
        </div>
        <div>
          <label htmlFor="password">{t('auth.login.password', 'Password')}</label>
          <input type="password" id="password" />
        </div>
        <button type="submit">{t('common.buttons.login', 'Login')}</button>
      </form>
    </div>
  );
};

// التطبيق الرئيسي
const LocalizedRoutingExample = () => {
  // في تطبيق حقيقي، ستأتي هذه من حالة التطبيق أو سياق المصادقة
  const isAuthenticated = false;
  
  return (
    <LanguageProvider>
      <LocalizedRouter>
        <div className="app">
          <header className="app-header">
            <LocalizedLink to="/" className="logo">GplusApp</LocalizedLink>
            
            {/* مبدل اللغة */}
            <div className="language-options">
              <LanguageSwitcherButtons />
            </div>
          </header>
          
          {/* المسار الهيكلي */}
          <LocalizedBreadcrumbs
            routes={{
              '/': 'common.home',
              '/products': 'common.products',
              '/about': 'common.about',
              '/contact': 'common.contact',
              '/dashboard': 'common.dashboard',
              '/login': 'auth.login.title'
            }}
            dynamicSegments={{
              '/products/:id': (id) => `products.product${id}`
            }}
            separator="›"
            styles={{
              padding: '10px 0',
              margin: '10px 0'
            }}
          />
          
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/dashboard"
                element={
                  <LocalizedProtectedRoute
                    isAuthenticated={isAuthenticated}
                    redirectTo="/login"
                  >
                    <DashboardPage />
                  </LocalizedProtectedRoute>
                }
              />
            </Routes>
          </main>
          
          <footer>
            <p>&copy; 2025 GplusApp</p>
          </footer>
        </div>
      </LocalizedRouter>
    </LanguageProvider>
  );
};

export default LocalizedRoutingExample;