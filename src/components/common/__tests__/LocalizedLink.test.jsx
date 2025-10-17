/**
 * @file LocalizedLink.test.jsx - اختبارات لمكون الرابط متعدد اللغات
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import LocalizedLink from '../../components/common/LocalizedLink';

// Mock للـ hooks والمكونات المستخدمة
vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...rest }) => (
    <a href={to} data-testid="link" {...rest}>{children}</a>
  )
}));

vi.mock('../../hooks/useLocalizedRouting', () => ({
  useLocalizedLink: () => (path) => {
    // Mock بسيط لمحاكاة تحويل المسار
    const mockPaths = {
      '/': '/ar/',
      '/login': '/ar/تسجيل-دخول',
      '/products': '/ar/المنتجات',
      '/about': '/ar/من-نحن'
    };
    return mockPaths[path] || `/ar${path}`;
  }
}));

describe('LocalizedLink', () => {
  test('renders link with localized path', () => {
    render(
      <LocalizedLink to="/products">المنتجات</LocalizedLink>
    );
    
    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('href', '/ar/المنتجات');
    expect(link).toHaveTextContent('المنتجات');
  });
  
  test('passes additional props to Link component', () => {
    render(
      <LocalizedLink to="/about" className="custom-link" target="_blank">
        من نحن
      </LocalizedLink>
    );
    
    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('href', '/ar/من-نحن');
    expect(link).toHaveAttribute('className', 'custom-link');
    expect(link).toHaveAttribute('target', '_blank');
  });
  
  test('handles different path formats', () => {
    render(
      <>
        <LocalizedLink to="/">الرئيسية</LocalizedLink>
        <LocalizedLink to="/login">تسجيل الدخول</LocalizedLink>
        <LocalizedLink to="/products/123">منتج 123</LocalizedLink>
      </>
    );
    
    const links = screen.getAllByTestId('link');
    expect(links[0]).toHaveAttribute('href', '/ar/');
    expect(links[1]).toHaveAttribute('href', '/ar/تسجيل-دخول');
    expect(links[2]).toHaveAttribute('href', '/ar/products/123');
  });
});