import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';
import axios from 'axios';

const AuthContext = createContext(null);

// API base URL
const API_BASE_URL = 'http://localhost:5001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Enable sending cookies
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const navigate = useNavigate();

  // Initialize axios interceptors
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Clear user data and redirect to login
          logout();
          toast.error('Session expired. Please login again.');
          navigate('/login');
        } else if (error.response?.status === 423) {
          // Account locked
          toast.error(error.response.data.message || 'Account locked');
          logout();
          navigate('/login');
        } else if (error.response?.status === 403) {
          toast.error('Access denied. You do not have permission to perform this action.');
        } else if (error.response?.status === 404) {
          toast.error('Resource not found.');
        } else if (error.response?.status === 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error(error.response?.data?.message || 'An error occurred. Please try again.');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [navigate]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const storedCart = localStorage.getItem('cart');
        
        if (token && storedUser) {
          try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            
            if (decoded.exp > currentTime) {
              const userData = JSON.parse(storedUser);
              
              // Verify token is still valid with backend
              try {
                const response = await api.get('/auth/verify');
                if (response.data.status === 'success') {
                  setUser(userData);
                } else {
                  throw new Error('Failed to verify user session');
                }
              } catch (error) {
                console.error('Token verification failed:', error);
                logout();
                return;
              }
            } else {
              // Token expired
              logout();
              return;
            }
          } catch (error) {
            console.error('Error decoding token:', error);
            logout();
            return;
          }
        }
        
        if (storedCart) {
          try {
            const parsedCart = JSON.parse(storedCart);
            setCart(parsedCart);
            calculateCartTotal(parsedCart);
          } catch (error) {
            console.error('Error parsing cart:', error);
            localStorage.removeItem('cart');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const calculateCartTotal = (cartItems) => {
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setCartTotal(total);
  };

  const login = async (email, password, role = 'user') => {
    try {
      const response = await api.post('/auth/login', { 
        email, 
        password,
        role
      });
      
      if (response.data.status === 'success' && response.data.token && response.data.user) {
        const { token, user: userData } = response.data;
        
        // Verify the token can be decoded and has correct role
        try {
          const decoded = jwtDecode(token);
          if (!decoded.userId || !decoded.role) {
            throw new Error('Invalid token format');
          }
          if (role && decoded.role !== role) {
            throw new Error(`Invalid credentials for ${role} login`);
          }
        } catch (error) {
          console.error('Token validation error:', error);
          throw new Error(error.message || 'Invalid authentication token received');
        }
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        
        // Set default authorization header for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Redirect based on role
        switch (userData.role) {
          case 'admin':
            navigate('/ahome');
            break;
          case 'seller':
            navigate('/shome');
            break;
          default:
            navigate('/uhome');
        }
        
        toast.success('Login successful!');
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific error messages
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message || 
                         'Failed to login. Please try again.';
      throw new Error(errorMessage);
    }
  };

  const register = async (userData, role = 'user') => {
    try {
      // Use the unified signup endpoint and include role in request body
      const response = await api.post('/auth/signup', { ...userData, role });
      
      if (response.data.status === 'success') {
        toast.success('Registration successful! Please login.');
        navigate(`/${role === 'admin' ? 'alogin' : role === 'seller' ? 'slogin' : 'login'}`);
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message || 
                         'Registration failed. Please try again.';
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    setCartTotal(0);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('cart');
    delete api.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const addToCart = (book) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item._id === book._id);
      let newCart;
      
      if (existingItem) {
        newCart = prevCart.map(item =>
          item._id === book._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newCart = [...prevCart, { ...book, quantity: 1 }];
      }
      
      localStorage.setItem('cart', JSON.stringify(newCart));
      calculateCartTotal(newCart);
      return newCart;
    });
    
    toast.success('Added to cart!');
  };

  const removeFromCart = (bookId) => {
    setCart(prevCart => {
      const newCart = prevCart.filter(item => item._id !== bookId);
      localStorage.setItem('cart', JSON.stringify(newCart));
      calculateCartTotal(newCart);
      return newCart;
    });
    toast.success('Removed from cart');
  };

  const updateCartItemQuantity = (bookId, quantity) => {
    if (quantity < 1) return;
    
    setCart(prevCart => {
      const newCart = prevCart.map(item =>
        item._id === bookId
          ? { ...item, quantity: quantity }
          : item
      );
      localStorage.setItem('cart', JSON.stringify(newCart));
      calculateCartTotal(newCart);
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    setCartTotal(0);
    localStorage.removeItem('cart');
  };

  const updateUserProfile = async (profileData) => {
    try {
      const response = await api.put(`/auth/${user.role}/profile`, profileData);
      
      if (response.data.status === 'success') {
        const updatedUser = { ...user, ...response.data.user };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success('Profile updated successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message || 
                         'Failed to update profile. Please try again.';
      toast.error(errorMessage);
      throw error;
    }
  };

  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!user && !!token;
  };

  const hasRole = (requiredRole) => {
    return isAuthenticated() && user?.role === requiredRole;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        register,
        isAuthenticated: isAuthenticated(),
        hasRole,
        cart,
        cartTotal,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        updateUserProfile
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 