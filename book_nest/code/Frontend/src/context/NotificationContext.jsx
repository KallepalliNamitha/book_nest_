import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

const WS_BASE_URL = process.env.NODE_ENV === 'production'
  ? `wss://${window.location.host}/api/ws`
  : 'ws://localhost:5001/ws'; // Removed /api prefix for development

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 5;
  const INITIAL_RETRY_DELAY = 1000;
  const MAX_RETRY_DELAY = 30000;
  const [notificationCache, setNotificationCache] = useState(new Map());
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const lastPongRef = useRef(Date.now());

  const handleNotification = useCallback((notification) => {
    if (!notification || !notification.type) return;

    // Create a unique key for the notification
    const notificationKey = `${notification.type}:${notification.message}:${Date.now()}`;
    const now = Date.now();

    // Check cache for recent duplicate notifications (within last 5 seconds)
    const lastShown = notificationCache.get(notificationKey);
    if (lastShown && (now - lastShown) < 5000) {
      return; // Skip duplicate notification
    }

    // Update cache with current timestamp
    setNotificationCache(prev => {
      const newCache = new Map(prev);
      newCache.set(notificationKey, now);
      
      // Clean up old cache entries (older than 5 seconds)
      for (const [key, timestamp] of newCache.entries()) {
        if (now - timestamp > 5000) {
          newCache.delete(key);
        }
      }
      return newCache;
    });

    // Special handling for profile load errors
    if (notification.type === 'error' && notification.message.includes('Failed to load user profile')) {
      // Only show one profile load error every 30 seconds
      const profileErrorKey = 'profile_load_error';
      const lastProfileError = notificationCache.get(profileErrorKey);
      if (lastProfileError && (now - lastProfileError) < 30000) {
        return;
      }
      setNotificationCache(prev => {
        const newCache = new Map(prev);
        newCache.set(profileErrorKey, now);
        return newCache;
      });
    }

    const newNotification = {
      ...notification,
      id: Date.now(),
      read: false,
      timestamp: notification.timestamp || new Date()
    };

    setNotifications(prev => {
      // Remove any existing notifications with the same content
      const filteredNotifications = prev.filter(n => 
        !(n.type === notification.type && n.message === notification.message)
      );
      return [newNotification, ...filteredNotifications].slice(0, 50); // Keep last 50 notifications
    });
    
    setUnreadCount(prev => prev + 1);

    // Show toast notification with deduplication
    toast(notification.message, {
      icon: getNotificationIcon(notification.type),
      id: notificationKey,
      duration: notification.type === 'error' ? 5000 : 3000
    });
  }, [notificationCache]);

  const cleanupWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (socket) {
      socket.close();
      setSocket(null);
    }
  }, [socket]);

  const connectWebSocket = useCallback(() => {
    if (!isAuthenticated || !user || isConnecting) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setIsConnecting(true);

    try {
      cleanupWebSocket();

      const ws = new WebSocket(`${WS_BASE_URL}?token=${token}`);
      let connectionTimeout;

      const cleanup = () => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
        }
        setIsConnecting(false);
      };

      connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          cleanup();
          ws.close();
          console.log('WebSocket connection timeout');
          // Schedule reconnection
          if (retryCount < MAX_RETRIES) {
            const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY);
            reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
            setRetryCount(prev => prev + 1);
          }
        }
      }, 5000);

      ws.onopen = () => {
        cleanup();
        console.log('WebSocket connected');
        setSocket(ws);
        setRetryCount(0);
        lastPongRef.current = Date.now();

        // Setup ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            if (Date.now() - lastPongRef.current > 45000) {
              console.log('No pong received, reconnecting...');
              ws.close();
              return;
            }
            try {
              ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
            } catch (error) {
              console.error('Error sending ping:', error);
              ws.close();
            }
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') {
            lastPongRef.current = Date.now();
          } else if (data.type !== 'connection') {
            handleNotification(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        cleanup();
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        cleanup();

        // Only retry if we haven't exceeded max retries and the user is still logged in
        if (retryCount < MAX_RETRIES && isAuthenticated) {
          const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY);
          console.log(`Reconnecting in ${delay}ms...`);
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
          setRetryCount(prev => prev + 1);
        }
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      setIsConnecting(false);
    }
  }, [isAuthenticated, user, isConnecting, retryCount, cleanupWebSocket, handleNotification]);

  // Connect WebSocket when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      connectWebSocket();
    } else {
      cleanupWebSocket();
    }
    return () => cleanupWebSocket();
  }, [isAuthenticated, user, connectWebSocket, cleanupWebSocket]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_status':
        return '📦';
      case 'low_stock':
        return '⚠️';
      case 'new_review':
        return '⭐';
      case 'price_change':
        return '💰';
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext; 