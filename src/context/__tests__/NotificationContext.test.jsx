import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { NotificationProvider, useNotification } from '../NotificationContext';
import { useAuth } from '../AuthContext';

// Mock useAuth hook
jest.mock('../AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    this.onopen = null;
    this.close = jest.fn();
  }

  // Helper to simulate receiving a message
  simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }

  // Helper to simulate connection close
  simulateClose() {
    if (this.onclose) {
      this.onclose();
    }
  }

  // Helper to simulate connection open
  simulateOpen() {
    if (this.onopen) {
      this.onopen();
    }
  }
}

// Mock window.WebSocket
global.WebSocket = MockWebSocket;

// Test component that uses notification context
const TestComponent = () => {
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotification();
  
  return (
    <div>
      <div data-testid="unread-count">{unreadCount}</div>
      <button onClick={markAllAsRead}>Mark All Read</button>
      <button onClick={clearNotifications}>Clear All</button>
      <ul>
        {notifications.map((notification, index) => (
          <li key={index}>{notification.message}</li>
        ))}
      </ul>
    </div>
  );
};

describe('NotificationContext', () => {
  let mockSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Mock authenticated user
    useAuth.mockImplementation(() => ({
      user: { id: 'test-user' },
      isAuthenticated: true
    }));
  });

  test('establishes WebSocket connection when user is authenticated', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(global.WebSocket).toHaveBeenCalledWith(
        expect.stringContaining('ws://localhost:5001')
      );
    });
  });

  test('handles incoming notifications', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const mockNotification = {
      type: 'order_status',
      message: 'Your order has been shipped',
      timestamp: new Date().toISOString()
    };

    await waitFor(() => {
      mockSocket = global.WebSocket.mock.instances[0];
      mockSocket.simulateOpen();
      mockSocket.simulateMessage(mockNotification);
    });

    expect(screen.getByText(mockNotification.message)).toBeInTheDocument();
    expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
  });

  test('marks all notifications as read', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Add some notifications
    await waitFor(() => {
      mockSocket = global.WebSocket.mock.instances[0];
      mockSocket.simulateOpen();
      mockSocket.simulateMessage({
        type: 'order_status',
        message: 'Notification 1',
        timestamp: new Date().toISOString()
      });
      mockSocket.simulateMessage({
        type: 'order_status',
        message: 'Notification 2',
        timestamp: new Date().toISOString()
      });
    });

    expect(screen.getByTestId('unread-count')).toHaveTextContent('2');

    // Mark all as read
    act(() => {
      screen.getByText('Mark All Read').click();
    });

    expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
  });

  test('clears all notifications', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Add some notifications
    await waitFor(() => {
      mockSocket = global.WebSocket.mock.instances[0];
      mockSocket.simulateOpen();
      mockSocket.simulateMessage({
        type: 'order_status',
        message: 'Notification 1',
        timestamp: new Date().toISOString()
      });
    });

    expect(screen.getByText('Notification 1')).toBeInTheDocument();

    // Clear all notifications
    act(() => {
      screen.getByText('Clear All').click();
    });

    expect(screen.queryByText('Notification 1')).not.toBeInTheDocument();
    expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
  });

  test('attempts to reconnect on connection close', async () => {
    jest.useFakeTimers();

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      mockSocket = global.WebSocket.mock.instances[0];
      mockSocket.simulateOpen();
      mockSocket.simulateClose();
    });

    // Fast-forward past the reconnection delay
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Should have attempted to create a new WebSocket connection
    expect(global.WebSocket).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  test('does not establish WebSocket connection when user is not authenticated', () => {
    useAuth.mockImplementation(() => ({
      user: null,
      isAuthenticated: false
    }));

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    expect(global.WebSocket).not.toHaveBeenCalled();
  });
}); 