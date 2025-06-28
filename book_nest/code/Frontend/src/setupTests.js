// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';
import 'jest-fetch-mock';
import { jest } from '@jest/globals';
import { server } from './mocks/server';

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    this.observe = jest.fn();
    this.unobserve = jest.fn();
    this.disconnect = jest.fn();
  }

  // Helper to simulate intersection
  simulateIntersection(isIntersecting) {
    this.callback([{
      isIntersecting,
      boundingClientRect: {},
      intersectionRatio: isIntersecting ? 1 : 0,
      intersectionRect: {},
      rootBounds: null,
      target: {},
      time: Date.now()
    }]);
  }
}

window.IntersectionObserver = MockIntersectionObserver;

// Mock window.matchMedia
window.matchMedia = query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

// Mock ResizeObserver
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.observe = jest.fn();
    this.unobserve = jest.fn();
    this.disconnect = jest.fn();
  }

  // Helper to simulate resize
  simulateResize(entry) {
    this.callback([{
      borderBoxSize: entry.borderBoxSize || [],
      contentBoxSize: entry.contentBoxSize || [],
      contentRect: entry.contentRect || {},
      devicePixelContentBoxSize: entry.devicePixelContentBoxSize || [],
      target: entry.target || {}
    }]);
  }
}

window.ResizeObserver = MockResizeObserver;

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock window.URL.createObjectURL
window.URL.createObjectURL = jest.fn();
window.URL.revokeObjectURL = jest.fn();

// Mock window.fetch
global.fetch = jest.fn();

// Mock console methods
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  fetch.resetMocks();
});

// Clean up after each test
afterEach(() => {
  // Clean up any mounted components
  document.body.innerHTML = '';
  
  // Reset window location
  delete window.location;
  window.location = new URL('http://localhost');
});

// Global test timeout
jest.setTimeout(10000); // 10 seconds

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    this.onopen = null;
    this.readyState = WebSocket.CONNECTING;
    this.send = jest.fn();
    this.close = jest.fn();

    // Simulate connection after a tick
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) this.onopen();
    }, 0);
  }

  // Helper to simulate receiving a message
  simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }

  // Helper to simulate connection close
  simulateClose() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose();
    }
  }

  // Helper to simulate error
  simulateError() {
    if (this.onerror) {
      this.onerror(new Error('WebSocket error'));
    }
  }
}

global.WebSocket = MockWebSocket;
WebSocket.CONNECTING = 0;
WebSocket.OPEN = 1;
WebSocket.CLOSING = 2;
WebSocket.CLOSED = 3;

// Setup MSW
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close()); 