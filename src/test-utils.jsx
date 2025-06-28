import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

const AllTheProviders = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Helper function to wait for element to be removed
export const waitForElementToBeRemoved = async (element) => {
  return new Promise((resolve) => {
    if (!element) {
      resolve();
      return;
    }
    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
};

// Helper function to simulate API response delay
export const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to mock authenticated user
export const mockAuthenticatedUser = (user = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
}) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', 'mock-token');
};

// Helper function to clear authenticated user
export const clearAuthenticatedUser = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
}; 