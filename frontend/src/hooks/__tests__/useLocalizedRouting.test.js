import { renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { useLocalizedRouting, useLocalizedLink, useLanguageChanger } from '../useLocalizedRouting';
import i18n from '../../i18n';

// Mock React Router hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
  useParams: jest.fn()
}));

describe('useLocalizedRouting', () => {
  const wrapper = ({ children }) => (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider initialLanguage="en">
        <MemoryRouter>{children}</MemoryRouter>
      </LanguageProvider>
    </I18nextProvider>
  );

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up default mock implementations
    useLocation.mockReturnValue({ pathname: '/en/products' });
  });

  test('should return the current internal path', () => {
    const { result } = renderHook(() => useLocalizedRouting(), { wrapper });
    
    expect(result.current.currentInternalPath).toBe('/products');
  });

  test('should return the correct localized path', () => {
    const { result } = renderHook(() => useLocalizedRouting(), { wrapper });
    
    const localizedPath = result.current.getFullLocalizedPath('/products');
    expect(localizedPath).toBe('/en/products');
  });

  test('useLocalizedLink hook should return a function that creates localized links', () => {
    const { result } = renderHook(() => useLocalizedLink(), { wrapper });
    
    expect(typeof result.current).toBe('function');
    const localizedLink = result.current('/products');
    expect(localizedLink).toBe('/en/products');
  });

  test('useLocalizedLink should handle dynamic parameters', () => {
    const { result } = renderHook(() => useLocalizedLink(), { wrapper });
    
    const localizedLink = result.current('/products/:id', { id: '123' });
    expect(localizedLink).toBe('/en/products/123');
  });

  test('should handle Arabic paths correctly', () => {
    const arabicWrapper = ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <LanguageProvider initialLanguage="ar">
          <MemoryRouter>{children}</MemoryRouter>
        </LanguageProvider>
      </I18nextProvider>
    );
    
    const { result } = renderHook(() => useLocalizedLink(), { wrapper: arabicWrapper });
    
    const localizedLink = result.current('/products');
    expect(localizedLink).toBe('/ar/المنتجات');
  });

  test('useLanguageChanger should return a function', () => {
    const { result } = renderHook(() => useLanguageChanger(), { wrapper });
    
    expect(typeof result.current).toBe('function');
  });
});