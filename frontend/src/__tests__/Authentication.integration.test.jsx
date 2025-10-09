import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../../contexts/AuthContext";
import LoginScreen from "../../screens/Auth/LoginScreen";
import ProtectedRoute from "../../routes/ProtectedRoute";
import api from "../../services/api";

// Mock dependencies
vi.mock("../../services/api", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn()
  }
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// A simple dashboard component for testing protected routes
const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  return (
    <div>
      <h1>Dashboard</h1>
      <p data-testid="user-email">{currentUser?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const setupTest = (initialRoute = "/login") => {
  // Create a fresh QueryClient for each test
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  // Mock localStorage
  const mockLocalStorage = {};
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
    (key, value) => (mockLocalStorage[key] = value)
  );
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
    (key) => mockLocalStorage[key]
  );
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(
    (key) => delete mockLocalStorage[key]
  );

  return {
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={[initialRoute]}>
            <Routes>
              <Route path="/login" element={<LoginScreen />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    )
  };
};

describe("Authentication Flow Integration Test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it("redirects unauthenticated users to login page when accessing protected route", async () => {
    setupTest("/dashboard");
    
    // Should redirect to login page
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    });
    
    // Should not see dashboard content
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });
  
  it("allows users to log in and access protected routes", async () => {
    // Mock successful login response
    const mockUser = { id: 1, name: "Test User", email: "test@example.com" };
    const mockToken = "mock-jwt-token";
    
    api.post.mockResolvedValueOnce({ 
      user: mockUser, 
      token: mockToken 
    });
    
    const { user } = setupTest("/login");
    
    // Fill in login form
    await user.type(screen.getByPlaceholderText(/email/i), "test@example.com");
    await user.type(screen.getByPlaceholderText(/password/i), "password123");
    
    // Submit form
    await user.click(screen.getByRole("button", { name: /login/i }));
    
    // API should be called with credentials
    expect(api.post).toHaveBeenCalledWith("/auth/login", {
      email: "test@example.com",
      password: "password123"
    });
    
    // Should redirect to dashboard after successful login
    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByTestId("user-email")).toHaveTextContent("test@example.com");
    });
    
    // Token should be stored in localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith("token", mockToken);
    expect(localStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify(mockUser));
  });
  
  it("shows error message on failed login", async () => {
    // Mock failed login
    api.post.mockRejectedValueOnce({
      response: {
        data: { message: "Invalid credentials" }
      }
    });
    
    const { user } = setupTest("/login");
    
    // Fill in login form
    await user.type(screen.getByPlaceholderText(/email/i), "wrong@example.com");
    await user.type(screen.getByPlaceholderText(/password/i), "wrongpassword");
    
    // Submit form
    await user.click(screen.getByRole("button", { name: /login/i }));
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
    
    // Should still be on login page
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });
  
  it("allows users to log out", async () => {
    // Setup with authenticated user
    const mockUser = { id: 1, name: "Test User", email: "test@example.com" };
    const mockToken = "mock-jwt-token";
    
    // Directly set authentication in localStorage
    localStorage.setItem("token", mockToken);
    localStorage.setItem("user", JSON.stringify(mockUser));
    
    const { user } = setupTest("/dashboard");
    
    // Should see dashboard
    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByTestId("user-email")).toHaveTextContent("test@example.com");
    });
    
    // Click logout button
    await user.click(screen.getByRole("button", { name: /logout/i }));
    
    // Should redirect to login
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    });
    
    // Authentication data should be removed from localStorage
    expect(localStorage.removeItem).toHaveBeenCalledWith("token");
    expect(localStorage.removeItem).toHaveBeenCalledWith("user");
  });
  
  it("remembers user session on page reload", async () => {
    // Setup with authenticated user in localStorage
    const mockUser = { id: 1, name: "Test User", email: "test@example.com" };
    const mockToken = "mock-jwt-token";
    
    localStorage.setItem("token", mockToken);
    localStorage.setItem("user", JSON.stringify(mockUser));
    
    // Navigate to protected route
    setupTest("/dashboard");
    
    // Should directly show dashboard without redirection
    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByTestId("user-email")).toHaveTextContent("test@example.com");
    });
    
    // Login page should not be shown
    expect(screen.queryByPlaceholderText(/email/i)).not.toBeInTheDocument();
  });
});