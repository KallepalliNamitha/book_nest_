import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import toast from 'react-hot-toast';

// Mock axios
jest.mock('axios');

// Mock jwt-decode
jest.mock('jwt-decode', () => jest.fn());

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

// Test component that uses auth context
const TestComponent = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      await login({ email: 'test@test.com', password: 'password' });
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <>
          <div data-testid="user-name">{user.name}</div>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <button onClick={handleLogin}>Login</button>
          {error && <div data-testid="error-message">{error}</div>}
        </>
      )}
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
    
    // Mock jwt-decode implementation
    jwtDecode.mockImplementation(() => ({
      exp: Math.floor(Date.now() / 1000) + 3600 // Token expires in 1 hour
    }));
  });

  test('provides initial unauthenticated state', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    const mockUser = { name: 'Test User', email: 'test@test.com', role: 'user' };
    const mockResponse = {
      data: {
        Status: "Success",
        user: mockUser,
        token: 'fake-token'
      }
    };
    axios.post.mockResolvedValueOnce(mockResponse);

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });

    expect(localStorage.getItem('token')).toBe('fake-token');
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
  });

  test('handles login failure', async () => {
    const mockError = { response: { data: { message: 'Invalid credentials' } } };
    axios.post.mockRejectedValueOnce(mockError);

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials');
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
  });

  test('handles logout', async () => {
    // Setup initial authenticated state
    const mockUser = { name: 'Test User', email: 'test@test.com', role: 'user' };
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for the component to show the authenticated state
    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  test('restores auth state from localStorage', async () => {
    const mockUser = { name: 'Test User', email: 'test@test.com', role: 'user' };
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });
  });

  test('handles token expiration', async () => {
    // Setup initial authenticated state
    const mockUser = { name: 'Test User', email: 'test@test.com', role: 'user' };
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    // Mock jwt-decode to return an expired token
    jwtDecode.mockImplementationOnce(() => ({
      exp: Math.floor(Date.now() / 1000) - 3600 // Token expired 1 hour ago
    }));

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for the component to handle the expired token
    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});