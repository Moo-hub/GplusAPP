/**
 * @file LocalizedRouter.test.jsx - اختبارات لمكون التوجيه متعدد اللغات
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import LocalizedRouter, { getLocalizedPath, getInternalPath } from '../../components/common/LocalizedRouter';
import { LanguageProvider } from '../../i18nSetup';

// Mock الوظائف المستخدمة
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div data-testid="browser-router">{children}</div>,
  Routes: ({ children }) => <div data-testid="routes">{children}</div>,
  Route: ({ path, element }) => (
    <div data-testid="route" data-path={path}>
      {element}
    </div>
  ),
  Navigate: ({ to, replace }) => (
    <div data-testid="navigate" data-to={to} data-replace={replace || undefined}>
      Navigate
    </div>
  )
}));

vi.mock('../../i18nSetup', () => ({
  LanguageProvider: ({ children }) => <div data-testid="language-provider">{children}</div>,
  useLanguage: () => ({ language: 'ar' })
}));

describe('LocalizedRouter', () => {
  test('renders router with routes', () => {
    render(
      <LocalizedRouter>
        <div data-testid="content">Content</div>
      </LocalizedRouter>
    );
    
    expect(screen.getByTestId('browser-router')).toBeInTheDocument();
    expect(screen.getByTestId('routes')).toBeInTheDocument();
    expect(screen.getAllByTestId('route')).toHaveLength(3); // Root route, language route, and catch-all route
  });
  
  test('renders children inside language route', () => {
    render(
      <LocalizedRouter>
        <div data-testid="content">Content</div>
      </LocalizedRouter>
    );
    
    const languageRoute = screen.getAllByTestId('route')[1]; // الطريق الثاني هو طريق اللغة
    expect(languageRoute).toHaveAttribute('data-path', '/ar/*');
    expect(languageRoute).toContainHTML('data-testid="content"');
  });
  
  test('renders root redirect route', () => {
    render(
      <LocalizedRouter>
        <div>Content</div>
      </LocalizedRouter>
    );
    
    const rootRoute = screen.getAllByTestId('route')[0]; // الطريق الأول هو طريق الجذر
    expect(rootRoute).toHaveAttribute('data-path', '/');
    expect(rootRoute.querySelector('[data-testid="navigate"]')).toHaveAttribute('data-to', '/ar');
  });
  
  test('renders catch-all redirect route', () => {
    render(
      <LocalizedRouter>
        <div>Content</div>
      </LocalizedRouter>
    );
    
    const catchAllRoute = screen.getAllByTestId('route')[2]; // الطريق الثالث هو طريق الإمساك بالكل
    expect(catchAllRoute).toHaveAttribute('data-path', '*');
    expect(catchAllRoute).toContainHTML('data-testid="navigate"');
  });
});

describe('getLocalizedPath and getInternalPath', () => {
  test('translates paths from internal to localized', () => {
    const enPath = getLocalizedPath('/login', 'en');
    const arPath = getLocalizedPath('/login', 'ar');
    
    expect(enPath).toBe('/login');
    expect(arPath).toBe('/تسجيل-دخول');
  });
  
  test('translates paths from localized to internal', () => {
    const fromEn = getInternalPath('/login', 'en');
    const fromAr = getInternalPath('/تسجيل-دخول', 'ar');
    
    expect(fromEn).toBe('/login');
    expect(fromAr).toBe('/login');
  });
  
  test('handles dynamic parameters in paths', () => {
    const enPathWithParam = getLocalizedPath('/products/123', 'en');
    const arPathWithParam = getLocalizedPath('/products/123', 'ar');
    
    expect(enPathWithParam).toContain('/products/');
    expect(arPathWithParam).toContain('/المنتجات/');
    
    const internalPath = getInternalPath('/المنتجات/123', 'ar');
    expect(internalPath).toContain('/products/');
  });
});