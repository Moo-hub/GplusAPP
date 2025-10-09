import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../src/components/Layout';
import { useAuth } from '../src/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import OfflineNotification from '../src/components/OfflineNotification';

// Mock dependencies
vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn()
}));

vi.mock('../src/components/OfflineNotification', () => ({
  default: vi.fn(() => <div data-testid="offline-notification-mock">Offline Notification Mock</div>)
}));

vi.mock('../src/components/dev/ViewportIndicator', () => ({
  default: () => <div data-testid="viewport-indicator-mock">Viewport Indicator Mock</div>
}));

vi.mock('../src/components/Footer', () => ({
  default: () => <div data-testid="footer-mock">Footer Mock</div>
}));

describe('Layout Component', () => {
  beforeEach(() => {
    // Mock auth context
    useAuth.mockReturnValue({
      currentUser: null,
      logout: vi.fn()
    });
    
    // Mock translations
    useTranslation.mockReturnValue({
      t: (key) => key,
      i18n: { language: 'en' }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the layout with OfflineNotification component', async () => {
    // Render the component
    const { getByTestId } = render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );
    
    // Verify that the layout container is rendered
    expect(getByTestId('layout-container')).toBeInTheDocument();
    
    // Verify that the OfflineNotification component is rendered
    expect(getByTestId('offline-notification-mock')).toBeInTheDocument();
    
    // Verify that the OfflineNotification component was called
    expect(OfflineNotification).toHaveBeenCalled();
  });

  it('should render navigation elements correctly when user is not authenticated', () => {
    // Render the component
    const { getByTestId, getByText } = render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );
    
    // Verify that the navigation elements are rendered
    expect(getByTestId('main-navigation')).toBeInTheDocument();
    expect(getByTestId('site-logo')).toBeInTheDocument();
    
    // Verify that login and register links are rendered for non-authenticated users
    expect(getByText('nav.login')).toBeInTheDocument();
    expect(getByText('nav.register')).toBeInTheDocument();
  });

  it('should render user-specific navigation elements when user is authenticated', () => {
    // Mock authenticated user
    useAuth.mockReturnValue({
      currentUser: { name: 'Test User' },
      logout: vi.fn()
    });
    
    // Render the component
    const { getByTestId, getByText } = render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );
    
    // Verify that user-specific elements are rendered
    expect(getByTestId('user-greeting')).toBeInTheDocument();
    expect(getByTestId('logout-button')).toBeInTheDocument();
    
    // Verify that user-specific navigation links are rendered
    expect(getByText('nav.pickups')).toBeInTheDocument();
    expect(getByText('nav.rewards')).toBeInTheDocument();
    expect(getByText('nav.myRedemptions')).toBeInTheDocument();
  });

  it('should call logout when logout button is clicked', () => {
    // Mock authenticated user and logout function
    const mockLogout = vi.fn();
    useAuth.mockReturnValue({
      currentUser: { name: 'Test User' },
      logout: mockLogout
    });
    
    // Render the component
    const { getByTestId } = render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );
    
    // Click the logout button
    getByTestId('logout-button').click();
    
    // Verify that logout was called
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('should render footer, viewport indicator, and offline notification', () => {
    // Render the component
    const { getByTestId } = render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );
    
    // Verify that the footer is rendered
    expect(getByTestId('footer-mock')).toBeInTheDocument();
    
    // Verify that the viewport indicator is rendered
    expect(getByTestId('viewport-indicator-mock')).toBeInTheDocument();
    
    // Verify that the offline notification is rendered
    expect(getByTestId('offline-notification-mock')).toBeInTheDocument();
  });
});