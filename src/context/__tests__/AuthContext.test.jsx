import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

// Mock axios
jest.mock('axios');

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

// Test component that uses auth context
const TestComponent = () => {
  const { user, isAuthenticated, login, logout, register, updateProfile } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      <div data-testid="user-info">
        {user ? JSON.stringify(user) : 'No user'}
      </div>
      <button onClick={() => login('test@test.com', 'password123')}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={() => register({
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123',
        passwordConfirm: 'password123'
      })}>Register</button>
      <button onClick={() => updateProfile({
        name: 'Updated Name',
        email: 'updated@test.com'
      })}>Update Profile</button>
    </div>
  );
};

describe('AuthContext', () => {
  const mockUser = {
    id: 'user123',
    name: 'Test User',
    email: 'test@test.com',
    role: 'user'
  };

  const mockToken = 'mock.jwt.token';

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  const renderWithAuthProvider = () => {
    return render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
  };

  describe('Initial State', () => {
    test('starts with unauthenticated state', () => {
      renderWithAuthProvider();

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
    });

    test('loads user from localStorage if token exists', async () => {
      localStorage.setItem('token', mockToken);
      axios.get.mockResolvedValueOnce({ data: { data: mockUser } });

      renderWithAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
        expect(screen.getByTestId('user-info')).toHaveTextContent(mockUser.email);
      });
    });
  });

  describe('Login', () => {
    test('successfully logs in user', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          token: mockToken,
          data: mockUser
        }
      });

      renderWithAuthProvider();

      await act(async () => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
        expect(screen.getByTestId('user-info')).toHaveTextContent(mockUser.email);
        expect(localStorage.getItem('token')).toBe(mockToken);
        expect(toast.success).toHaveBeenCalledWith('Logged in successfully!');
      });
    });

    test('handles login error', async () => {
      const errorMessage = 'Invalid credentials';
      axios.post.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      renderWithAuthProvider();

      await act(async () => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
      });
    });
  });

  describe('Logout', () => {
    test('successfully logs out user', async () => {
      // Setup initial authenticated state
      localStorage.setItem('token', mockToken);
      axios.get.mockResolvedValueOnce({ data: { data: mockUser } });

      renderWithAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });

      await act(async () => {
        screen.getByText('Logout').click();
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
      expect(localStorage.getItem('token')).toBeNull();
      expect(toast.success).toHaveBeenCalledWith('Logged out successfully!');
    });
  });

  describe('Register', () => {
    test('successfully registers new user', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          token: mockToken,
          data: mockUser
        }
      });

      renderWithAuthProvider();

      await act(async () => {
        screen.getByText('Register').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
        expect(screen.getByTestId('user-info')).toHaveTextContent(mockUser.email);
        expect(localStorage.getItem('token')).toBe(mockToken);
        expect(toast.success).toHaveBeenCalledWith('Registration successful!');
      });
    });

    test('handles registration error', async () => {
      const errorMessage = 'Email already exists';
      axios.post.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      renderWithAuthProvider();

      await act(async () => {
        screen.getByText('Register').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
      });
    });
  });

  describe('Update Profile', () => {
    test('successfully updates user profile', async () => {
      // Setup initial authenticated state
      localStorage.setItem('token', mockToken);
      axios.get.mockResolvedValueOnce({ data: { data: mockUser } });

      const updatedUser = {
        ...mockUser,
        name: 'Updated Name',
        email: 'updated@test.com'
      };

      axios.patch.mockResolvedValueOnce({
        data: {
          data: updatedUser
        }
      });

      renderWithAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });

      await act(async () => {
        screen.getByText('Update Profile').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent(updatedUser.email);
        expect(toast.success).toHaveBeenCalledWith('Profile updated successfully!');
      });
    });

    test('handles update profile error', async () => {
      // Setup initial authenticated state
      localStorage.setItem('token', mockToken);
      axios.get.mockResolvedValueOnce({ data: { data: mockUser } });

      const errorMessage = 'Email already taken';
      axios.patch.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      renderWithAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });

      await act(async () => {
        screen.getByText('Update Profile').click();
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
      });
    });
  });

  describe('Token Management', () => {
    test('removes token and user on invalid token', async () => {
      localStorage.setItem('token', 'invalid-token');
      axios.get.mockRejectedValueOnce({
        response: { status: 401 }
      });

      renderWithAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
        expect(localStorage.getItem('token')).toBeNull();
      });
    });

    test('automatically adds token to axios headers after login', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          token: mockToken,
          data: mockUser
        }
      });

      renderWithAuthProvider();

      await act(async () => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(axios.defaults.headers.common['Authorization']).toBe(`Bearer ${mockToken}`);
      });
    });
  });
}); 