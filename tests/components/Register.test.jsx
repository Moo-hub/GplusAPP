// Mock react-toastify to avoid missing module error
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));
import React from 'react';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { renderWithProviders, makeAuthMocks } from '../test-utils.jsx';

// We'll import testing utilities after mocks so BrowserRouter (from react-router-dom)
// isn't loaded before our react-router-dom mock. Declare holders for the utils.
let render, screen, fireEvent, waitFor, userEvent;
import '@testing-library/jest-dom';

// We'll import the component and the (mocked) auth module dynamically in beforeEach
let Register;

// Provide a module-scoped navigate mock so the module mock can return it and
// individual tests can assert calls without trying to redefine properties.
const mockNavigate = vi.fn();

// NOTE: Tests use the shared `renderWithProviders` and inject a test auth
// object via `globalThis.__TEST_AUTH` (see tests/test-utils.jsx). Avoid
// mocking the AuthContext module here to prevent brittle module-mock ordering.

// Do not mock react-router-dom at module scope — tests import BrowserRouter
// dynamically in beforeEach and render real routes using MemoryRouter/BrowserRouter.
// We'll mock react-router-dom at module scope but preserve all actual exports
// except `useNavigate`, which we override to return our module-scoped
// `mockNavigate`. This avoids trying to redefine properties at runtime with
// vi.spyOn and ensures navigation calls from components are observable.
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => mockNavigate
  };
});
// Provide a lightweight react-i18next mock so tests don't pull in a second
// copy of react/react-i18next from the frontend subpackage and cause
// invalid hook calls. The mock returns translated strings used by the tests.
const _translations = {
  'auth.register': 'Register',
  'auth.name': 'Name',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.confirmPassword': 'Confirm Password',
  'auth.alreadyHaveAccount': 'Already have an account?',
  'auth.login': 'Log In',
  'auth.registrationFailed': 'Registration failed',
  'validation.nameRequired': 'Name is required',
  'validation.emailRequired': 'Email is required',
  'validation.emailInvalid': 'Email is invalid',
  'validation.passwordRequired': 'Password is required',
  'validation.passwordTooShort': 'Password must be at least 6 characters',
  'validation.passwordsDontMatch': 'Passwords do not match',
  'common.loading': 'Loading'
};

vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key) => _translations[key] || key }),
  I18nextProvider: ({ children }) => React.createElement(React.Fragment, null, children)
}));

// We'll provide a small i18n instance in beforeEach and wrap the component with
// I18nextProvider so useTranslation works inside the component.

// Mock the LoadingSpinner component
vi.mock('../components/common/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>
}));

describe('Register Component', () => {
  const mockRegister = vi.fn();

  beforeEach(async () => {
  // dynamically import the component under test so that our vi.mock calls take effect
    const comp = await import('../../frontend/src/components/Register');
    Register = comp.default;

    const rtl = await import('@testing-library/react');
    const { BrowserRouter } = await import('react-router-dom');
    // Note: we avoid runtime spies on router hooks. The module-scoped
    // `vi.mock('react-router-dom', ...)` declared at the top of this file
    // already ensures `useNavigate` returns `mockNavigate` for the component.

    // Simple Wrapper that only provides Router. react-i18next is mocked above
    // so useTranslation and I18nextProvider come from the mock and won't pull
    // in another React instance.
    const Wrapper = ({ children }) => React.createElement(BrowserRouter, null, children);

    render = (ui, options) => rtl.render(ui, { wrapper: Wrapper, ...options });
    screen = (await import('@testing-library/dom')).screen || rtl.screen;
    fireEvent = rtl.fireEvent;
    waitFor = rtl.waitFor;

    const ue = await import('@testing-library/user-event');
    userEvent = ue.default;

    // Provide a consistent auth mock via the shared test helper.
    const auth = makeAuthMocks({ register: mockRegister, isAuthenticated: () => false });

    // Use the shared render helper so all tests receive the same providers
    render = (ui, options) => renderWithProviders(ui, { auth, ...options });

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders the registration form', () => {
    render(<Register />);
    
    // Check that the form elements are rendered
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/log in/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<Register />);
    
    // Submit the form without filling any fields
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
    
    // Registration function should not be called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    render(<Register />);
    
    // Fill in invalid email
    await userEvent.type(screen.getByLabelText(/name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    
  // Change input type to text to avoid native browser email validation
  // preventing the React onSubmit handler from running in the test DOM.
  screen.getByLabelText(/email/i).setAttribute('type', 'text');

  // Submit the form (validation runs on submit in this component)
  await userEvent.click(screen.getByRole('button', { name: /register/i }));

    // Check for email format error after submit. Instead of a global text
    // search, scope to the email form-group container which is more robust
    // if the message is wrapped or split across nodes.
    await waitFor(() => {
      const emailGroup = screen.getByLabelText(/email/i).closest('.form-group');
      expect(emailGroup).toHaveTextContent(/email is invalid/i);
    });

    // Registration function should not be called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('validates password length', async () => {
    render(<Register />);
    
    // Fill in short password
    await userEvent.type(screen.getByLabelText(/name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), '12345');
    await userEvent.type(screen.getByLabelText(/confirm password/i), '12345');
    
    // Submit the form (validation runs on submit)
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Check for password length error after submit
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });

    // Registration function should not be called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('validates password match', async () => {
    render(<Register />);
    
    // Fill in non-matching passwords
    await userEvent.type(screen.getByLabelText(/name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password456');
    
    // Submit the form (validation runs on submit)
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Check for password match error after submit
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    // Registration function should not have been called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('submits the form with valid data', async () => {
    // Setup
    mockRegister.mockResolvedValueOnce();
    render(<Register />);
    
    // Fill out the form with valid data
    await userEvent.type(screen.getByLabelText(/name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Verify registration was called with correct data
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    });
    
    // Check navigation to dashboard
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays an error message when registration fails', async () => {
    // Setup
    const errorMessage = 'Email already registered';
    mockRegister.mockRejectedValueOnce({
      response: {
        data: {
          message: errorMessage
        }
      }
    });
    
    render(<Register />);
    
    // Fill out the form with valid data
    await userEvent.type(screen.getByLabelText(/name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('displays loading spinner while submitting', async () => {
    // Setup with a delayed registration
    let resolvePromise;
    mockRegister.mockImplementationOnce(() => new Promise((resolve) => {
      resolvePromise = resolve;
    }));
    
    render(<Register />);
    
    // Fill out the form with valid data
    await userEvent.type(screen.getByLabelText(/name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // The component shows a loading state by disabling the submit button and
    // changing its text. Assert that behaviour instead of looking for a
    // separate LoadingSpinner component.
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /loading/i });
      expect(btn).toBeDisabled();
    });

    // Complete the registration process
    resolvePromise();

    // Check that navigation occurred after registration completed
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});