import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import LocalizedRouter from '../../LocalizedRouter';
import LocalizedLink from '../../LocalizedLink';
import LanguageSwitcherWithRoute from '../../LanguageSwitcherWithRoute';
import i18n from '../../../i18n';

// Mocking navigation hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: jest.fn(),
  useParams: () => ({}),
}));

// Sample pages for testing
const HomePage = () => <div data-testid="home-page">Home Page Content</div>;
const ProductsPage = () => <div data-testid="products-page">Products Page Content</div>;
const AboutPage = () => <div data-testid="about-page">About Page Content</div>;

// Component that shows current location for testing
const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}</div>;
};

describe('Localized Routing Integration Tests', () => {
  // Setup function for rendering the test components
  const renderWithProviders = (initialEntries = ['/en']) => {
    // Mock useLocation to return the current path
    useLocation.mockImplementation(() => ({
      pathname: initialEntries[0],
    }));

    return render(
      <I18nextProvider i18n={i18n}>
        <LanguageProvider initialLanguage="en">
          <MemoryRouter initialEntries={initialEntries}>
            <div data-testid="nav-container">
              <LocalizedLink to="/" data-testid="home-link">Home</LocalizedLink>
              <LocalizedLink to="/products" data-testid="products-link">Products</LocalizedLink>
              <LocalizedLink to="/about" data-testid="about-link">About</LocalizedLink>
              <LanguageSwitcherWithRoute useButtons={true} className="test-switcher" />
            </div>
            <LocationDisplay />
            <LocalizedRouter>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/about" element={<AboutPage />} />
              </Routes>
            </LocalizedRouter>
          </MemoryRouter>
        </LanguageProvider>
      </I18nextProvider>
    );
  };

  test('should render localized links with correct paths', async () => {
    renderWithProviders();

    // Check if all links are rendered with correct paths
    const homeLink = screen.getByTestId('home-link');
    const productsLink = screen.getByTestId('products-link');
    const aboutLink = screen.getByTestId('about-link');

    expect(homeLink).toBeInTheDocument();
    expect(productsLink).toBeInTheDocument();
    expect(aboutLink).toBeInTheDocument();

    expect(homeLink.getAttribute('href')).toBe('/en');
    expect(productsLink.getAttribute('href')).toBe('/en/products');
    expect(aboutLink.getAttribute('href')).toBe('/en/about');
  });

  test('should render the correct page based on current path', async () => {
    renderWithProviders(['/en/products']);

    // Check if the products page is rendered
    const productsPage = screen.getByTestId('products-page');
    expect(productsPage).toBeInTheDocument();

    // Check if location display shows correct path
    const locationDisplay = screen.getByTestId('location-display');
    expect(locationDisplay).toHaveTextContent('/en/products');
  });

  test('should show language switcher with correct options', () => {
    renderWithProviders();

    // Check if language switcher buttons are rendered
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2); // At least English and Arabic buttons

    // Check if the container has the correct classes
    const buttonContainer = buttons[0].closest('.language-switcher-buttons');
    expect(buttonContainer).toHaveClass('test-switcher');
  });

  test('integration with all components together', async () => {
    renderWithProviders(['/en']);

    // Check initial rendering
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.getByTestId('location-display')).toHaveTextContent('/en');

    // Test language switcher (limited by mock, but checking if it's there)
    const languageSwitcher = screen.getAllByRole('button')[0];
    expect(languageSwitcher).toBeInTheDocument();
  });
});