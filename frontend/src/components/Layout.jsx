import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTranslation } from 'react-i18next';
import ViewportIndicator from './dev/ViewportIndicator';
import Footer from './Footer';
import './Layout.css';

const Layout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isNavOpen, setIsNavOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsNavOpen(false);
  };

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  return (
    <div className="app-container" data-testid="layout-container">
      <a href="#main-content" className="skip-link">
        {t('accessibility.skipToContent', 'Skip to content')}
      </a>
      <header data-testid="site-header">
        <nav className="navbar" role="navigation" data-testid="main-navigation">
          <div className="logo" data-testid="site-logo">
            <Link to="/" data-testid="logo-link">G+</Link>
          </div>
          <button 
            className="mobile-nav-toggle" 
            onClick={toggleNav}
            aria-label={isNavOpen ? t('nav.close') : t('nav.menu')}
            data-testid="mobile-nav-toggle"
          >
            {isNavOpen ? '✕' : '☰'}
          </button>
          <div className={`nav-links ${isNavOpen ? 'open' : ''}`} data-testid="nav-links">
            <Link to="/" onClick={() => setIsNavOpen(false)}>{t('nav.home')}</Link>
            <Link to="/companies" onClick={() => setIsNavOpen(false)}>{t('nav.companies')}</Link>
            {currentUser && (
              <>
                <Link to="/pickups" onClick={() => setIsNavOpen(false)}>{t('nav.pickups')}</Link>
                <Link to="/rewards" onClick={() => setIsNavOpen(false)}>{t('nav.rewards')}</Link>
                <Link to="/account/redemptions" onClick={() => setIsNavOpen(false)}>{t('nav.myRedemptions')}</Link>
              </>
            )}
          </div>
          <div className="auth-links" data-testid="auth-links">
            {currentUser ? (
              <>
                <div className="user-menu" data-testid="user-menu">
                  <button aria-haspopup="true" aria-expanded="false" className="user-menu-button" data-testid="user-menu-button">
                    {currentUser.name}
                  </button>
                </div>
                <span className="user-greeting" data-testid="user-greeting">
                  {t('nav.hello', { name: currentUser.name })}
                </span>
                <button onClick={handleLogout} className="logout-btn" data-testid="logout-button">
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsNavOpen(false)}>{t('nav.login')}</Link>
                <Link to="/register" className="register-btn" onClick={() => setIsNavOpen(false)}>
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main role="main" id="main-content" data-testid="main-content">
        <Outlet />
      </main>

      <Footer data-testid="site-footer" />
      
      {/* Viewport indicator for responsive design testing */}
      <ViewportIndicator />
    </div>
  );
};

export default Layout;