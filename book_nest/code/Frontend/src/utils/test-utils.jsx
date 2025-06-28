import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

// Mock user for testing
export const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  password: 'Test@123'
};

// Mock admin user for testing
export const mockAdminUser = {
  id: 'test-admin-id',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin',
  password: 'Test@123'
};

// Mock book data for testing
export const mockBook = {
  _id: 'test-book-id',
  title: 'Test Book',
  author: 'Test Author',
  description: 'Test Description',
  price: 29.99,
  imageUrl: 'test-image.jpg',
  category: 'Fiction',
  rating: 4.5,
  stock: 10
};

// Mock order data for testing
export const mockOrder = {
  _id: 'test-order-id',
  user: mockUser.id,
  books: [{ book: mockBook._id, quantity: 2 }],
  totalAmount: 59.98,
  status: 'pending'
};

// Mock notification data for testing
export const mockNotification = {
  id: 'test-notification-id',
  type: 'order_status',
  message: 'Your order has been shipped',
  timestamp: new Date().toISOString()
};

// Custom render function with all providers
const AllTheProviders = ({ children, initialEntries = ['/'], mockAuthValue = null, mockNotificationValue = null }) => {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider value={mockAuthValue}>
        <NotificationProvider value={mockNotificationValue}>
          {children}
        </NotificationProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

const customRender = (
  ui,
  {
    initialEntries = ['/'],
    mockAuthValue = null,
    mockNotificationValue = null,
    ...renderOptions
  } = {}
) => {
  return render(ui, {
    wrapper: (props) => (
      <AllTheProviders
        {...props}
        initialEntries={initialEntries}
        mockAuthValue={mockAuthValue}
        mockNotificationValue={mockNotificationValue}
      />
    ),
    ...renderOptions
  });
};

// Helper to wait for async operations
export const waitForAsync = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

// Helper to simulate file upload
export const createMockFile = (name = 'test.jpg', type = 'image/jpeg', size = 1024) => {
  const file = new File(['test'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Helper to simulate form submission
export const submitForm = async (form, user) => {
  await act(async () => {
    await user.click(form.querySelector('button[type="submit"]'));
  });
};

// Helper to simulate API responses
export const mockApiResponse = (data, error = null) => {
  if (error) {
    return Promise.reject({
      response: {
        data: { message: error }
      }
    });
  }
  return Promise.resolve({ data });
};

// Helper to simulate WebSocket messages
export const mockWebSocketMessage = (socket, data) => {
  socket.simulateMessage(data);
};

// Helper to simulate intersection observer
export const mockIntersectionObserver = (isIntersecting) => {
  const observer = new window.IntersectionObserver(() => {});
  observer.simulateIntersection(isIntersecting);
  return observer;
};

// Helper to simulate resize observer
export const mockResizeObserver = (entry) => {
  const observer = new window.ResizeObserver(() => {});
  observer.simulateResize(entry);
  return observer;
};

// Helper to simulate scroll
export const simulateScroll = async (element, options = {}) => {
  const { top = 0, left = 0 } = options;
  await act(async () => {
    element.scrollTo(left, top);
  });
};

// Helper to simulate window resize
export const simulateResize = async (width, height) => {
  await act(async () => {
    window.innerWidth = width;
    window.innerHeight = height;
    window.dispatchEvent(new Event('resize'));
  });
};

// Helper to simulate network conditions
export const simulateNetwork = (online = true) => {
  Object.defineProperty(window.navigator, 'onLine', {
    value: online,
    writable: true
  });
  window.dispatchEvent(new Event(online ? 'online' : 'offline'));
};

// Helper to simulate media queries
export const simulateMediaQuery = (query, matches) => {
  window.matchMedia = jest.fn().mockImplementation(q => ({
    matches: q === query ? matches : false,
    media: q,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

// re-export everything
export * from '@testing-library/react';
export { userEvent };
export { customRender as render }; 