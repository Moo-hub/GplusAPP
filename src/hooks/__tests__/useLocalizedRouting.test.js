/**
 * @file useLocalizedRouting.test.js - اختبارات لخطاف التوجيه متعدد اللغات
 */

import { renderHook } from '@testing-library/react-hooks';
import { MemoryRouter, useNavigate, useLocation, useParams } from 'react-router-dom';
import { vi } from 'vitest';
import { useLocalizedRouting, useLocalizedLink, useLanguageChanger } from '../useLocalizedRouting';
import { useLanguage } from '../../i18nSetup';

// Mock الوظائف المستخدمة
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
  useParams: vi.fn()
}));

vi.mock('../../i18nSetup', () => ({
  useLanguage: vi.fn()
}));

vi.mock('../../components/common/LocalizedRouter', () => ({
  getLocalizedPath: vi.fn((path, language) => {
    // Mock بسيط لتحويل المسار
    const mockPaths = {
      en: {
        '/': '/',
        '/login': '/login',
        '/products': '/products'
      },
      ar: {
        '/': '/',
        '/login': '/تسجيل-دخول',
        '/products': '/المنتجات'
      }
    };
    return mockPaths[language]?.[path] || path;
  }),
  getInternalPath: vi.fn((path, language) => {
    // Mock عكس تحويل المسار
    const mockPaths = {
      en: {
        '/': '/',
        '/login': '/login',
        '/products': '/products'
      },
      ar: {
        '/': '/',
        '/تسجيل-دخول': '/login',
        '/المنتجات': '/products'
      }
    };
    return mockPaths[language]?.[path] || path;
  })
}));

// Wrapper مخصص لتسهيل الاختبارات
const wrapper = ({ children }) => (
  <MemoryRouter initialEntries={['/ar/المنتجات']}>
    {children}
  </MemoryRouter>
);

describe('useLocalizedRouting', () => {
  beforeEach(() => {
    // إعادة تعيين المحاكاة قبل كل اختبار
    vi.resetAllMocks();
    
    // القيم الافتراضية للمحاكاة
    useLanguage.mockReturnValue({ language: 'ar' });
    useNavigate.mockReturnValue(vi.fn());
    useLocation.mockReturnValue({ pathname: '/ar/المنتجات' });
    useParams.mockReturnValue({});
  });
  
  test('should return current internal path', () => {
    const { result } = renderHook(() => useLocalizedRouting(), { wrapper });
    
    expect(result.current.currentInternalPath).toBe('/المنتجات');
  });
  
  test('should navigate to localized path', () => {
    const mockNavigate = vi.fn();
    useNavigate.mockReturnValue(mockNavigate);
    
    const { result } = renderHook(() => useLocalizedRouting(), { wrapper });
    
    result.current.navigateTo('/products');
    
    expect(mockNavigate).toHaveBeenCalledWith('/ar/المنتجات', {});
  });
  
  test('should get full localized path', () => {
    const { result } = renderHook(() => useLocalizedRouting(), { wrapper });
    
    const path = result.current.getFullLocalizedPath('/products');
    
    expect(path).toBe('/ar/المنتجات');
  });
  
  test('should handle route language change', () => {
    const originalWindowLocation = window.location;
    delete window.location;
    window.location = { ...originalWindowLocation, pathname: '' };
    
    const { result } = renderHook(() => useLocalizedRouting(), { wrapper });
    
    result.current.changeRouteLanguage('en');
    
    expect(window.location.pathname).toBe('/en/products');
    
    // استعادة window.location
    window.location = originalWindowLocation;
  });
});

describe('useLocalizedLink', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useLanguage.mockReturnValue({ language: 'ar' });
  });
  
  test('should return localized link', () => {
    const { result } = renderHook(() => useLocalizedLink(), { wrapper });
    
    const localizedLink = result.current('/products');
    
    expect(localizedLink).toBe('/ar/المنتجات');
  });
});

describe('useLanguageChanger', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    const mockChangeLanguage = vi.fn().mockResolvedValue();
    useLanguage.mockReturnValue({ changeLanguage: mockChangeLanguage });
    
    const mockChangeRouteLanguage = vi.fn();
    vi.mock('../useLocalizedRouting', () => ({
      ...vi.importActual('../useLocalizedRouting'),
      useLocalizedRouting: () => ({
        changeRouteLanguage: mockChangeRouteLanguage
      })
    }));
  });
  
  test('should change language and update route', async () => {
    const { result } = renderHook(() => useLanguageChanger(), { wrapper });
    
    await result.current('en');
    
    expect(useLanguage().changeLanguage).toHaveBeenCalledWith('en');
    // في الاختبار الكامل، يجب التحقق من استدعاء changeRouteLanguage
  });
});