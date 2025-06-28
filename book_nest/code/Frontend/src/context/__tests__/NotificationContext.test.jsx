import { render, act } from '@testing-library/react';
import { NotificationProvider, useNotifications } from '../NotificationContext';
import { renderHook } from '@testing-library/react-hooks';

describe('NotificationContext', () => {
  it('provides notification context to children', () => {
    const TestComponent = () => {
      const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotifications();
      return (
        <div>
          <span data-testid="notification-count">{notifications.length}</span>
          <span data-testid="unread-count">{unreadCount}</span>
        </div>
      );
    };

    const { getByTestId } = render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    expect(getByTestId('notification-count')).toHaveTextContent('0');
    expect(getByTestId('unread-count')).toHaveTextContent('0');
  });

  it('handles notifications correctly', () => {
    const { result } = renderHook(
      () => useNotifications(),
      {
        wrapper: NotificationProvider
      }
    );

    act(() => {
      result.current.addNotification({
        title: 'Test',
        message: 'Test notification'
      });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.unreadCount).toBe(1);

    act(() => {
      result.current.markAllAsRead();
    });

    expect(result.current.unreadCount).toBe(0);

    act(() => {
      result.current.clearNotifications();
    });

    expect(result.current.notifications).toHaveLength(0);
  });
}); 