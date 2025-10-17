import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Import our custom localized routing components
import LocalizedRouter from './LocalizedRouter';
import LocalizedLink from './LocalizedLink';
import LanguageSwitcherWithRoute from './LanguageSwitcherWithRoute';
import LocalizedProtectedRoute from './LocalizedProtectedRoute';
import LocalizedBreadcrumbs from './LocalizedBreadcrumbs';

// Mock authentication state
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  
  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);
  
  return { isAuthenticated, login, logout };
};

// Mock page components
const HomePage = () => {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t('common.pages.home')}</h1>
      <p>{t('common.welcome')}</p>
    </div>
  );
};

const AboutPage = () => {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t('common.pages.about')}</h1>
      <p>{t('about.content')}</p>
    </div>
  );
};

const ProductsPage = () => {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t('common.pages.products')}</h1>
      <ul>
        <li>
          <LocalizedLink to="/products/1">Product 1</LocalizedLink>
        </li>
        <li>
          <LocalizedLink to="/products/2">Product 2</LocalizedLink>
        </li>
      </ul>
    </div>
  );
};

const ProductDetailPage = () => {
  const { t } = useTranslation();
  const params = { id: '1' }; // In a real app, get this from useParams()
  
  return (
    <div>
      <h1>{t('products.detail', { id: params.id })}</h1>
      <p>{t('products.description', { id: params.id })}</p>
    </div>
  );
};

const DashboardPage = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  
  return (
    <div>
      <h1>{t('common.pages.dashboard')}</h1>
      <p>{t('dashboard.welcome')}</p>
      <button onClick={logout}>{t('auth.logout')}</button>
    </div>
  );
};

const LoginPage = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  
  return (
    <div>
      <h1>{t('common.pages.login')}</h1>
      <button onClick={login}>{t('auth.loginButton')}</button>
    </div>
  );
};

// Main example component
const LocalizedRoutingExample = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="localized-routing-example">
      <header>
        <h1>{t('common.appName')}</h1>
        <LanguageSwitcherWithRoute useButtons={true} />
        
        <nav>
          <ul>
            <li><LocalizedLink to="/">{t('common.pages.home')}</LocalizedLink></li>
            <li><LocalizedLink to="/products">{t('common.pages.products')}</LocalizedLink></li>
            <li><LocalizedLink to="/about">{t('common.pages.about')}</LocalizedLink></li>
            {isAuthenticated ? (
              <li><LocalizedLink to="/dashboard">{t('common.pages.dashboard')}</LocalizedLink></li>
            ) : (
              <li><LocalizedLink to="/login">{t('common.pages.login')}</LocalizedLink></li>
            )}
          </ul>
        </nav>
      </header>
      
      <main>
        <LocalizedBreadcrumbs
          routes={{
            '/': 'common.pages.home',
            '/products': 'common.pages.products',
            '/about': 'common.pages.about',
            '/login': 'common.pages.login',
            '/dashboard': 'common.pages.dashboard',
          }}
          dynamicSegments={{
            '/products/:id': (id) => `products.product${id}`
          }}
        />
        
        <LocalizedRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LocalizedRouter>
      </main>
      
      <footer>
        <p>&copy; {new Date().getFullYear()} {t('common.appName')}</p>
      </footer>
    </div>
  );
};

export default LocalizedRoutingExample;