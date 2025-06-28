import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create axios instance with default config
const api = axios.create({
    baseURL: 'http://localhost:5001/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
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

// Response interceptor for handling common errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response || error);

        // Handle network errors
        if (!error.response) {
            toast.error('Network error. Please check your connection.');
            return Promise.reject(error);
        }

        // Get current role and path
        const userRole = localStorage.getItem('userRole');
        const currentPath = window.location.pathname;

        // Handle specific error cases
        switch (error.response.status) {
            case 401:
                // Only clear storage and redirect if it's a token-related error
                if (error.response.data?.error?.includes('token')) {
                    localStorage.clear();
                    sessionStorage.clear();
                    
                    // Determine redirect path
                    let redirectPath = '/login';
                    if (userRole === 'admin' || currentPath.startsWith('/a')) {
                        redirectPath = '/alogin';
                    } else if (userRole === 'seller' || currentPath.startsWith('/s')) {
                        redirectPath = '/slogin';
                    }
                    
                    // Show error message
                    toast.error('Session expired. Please login again.');
                    
                    // Use window.location for hard redirect
                    if (window.location.pathname !== redirectPath) {
                        window.location.href = redirectPath;
                    }
                } else {
                    // For login-specific errors, just show the error message
                    toast.error(error.response.data?.error || 'Invalid email or password');
                }
                break;
                
            case 403:
                toast.error('Access denied. You do not have permission for this action.');
                break;
                
            case 404:
                toast.error(error.response.data?.error || 'Resource not found.');
                break;
                
            case 429:
                toast.error('Too many requests. Please try again later.');
                break;
                
            case 500:
                toast.error('Server error. Please try again later.');
                break;
                
            default:
                toast.error(error.response.data?.error || 'An error occurred');
        }
        
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    adminLogin: (credentials) => api.post('/admin/login', { ...credentials, role: 'admin' }),
    adminRegister: (userData) => api.post('/admin/signup', { ...userData, role: 'admin' }),
    sellerLogin: (credentials) => api.post('/seller/login', credentials),
    sellerRegister: (userData) => api.post('/seller/signup', userData),
    verifyToken: () => api.get('/auth/verify'),
    logout: () => {
        localStorage.clear();
        sessionStorage.clear();
        return Promise.resolve();
    }
};

// Book APIs
export const bookAPI = {
    getAllBooks: () => api.get('/books'),
    getBook: (id) => api.get(`/books/${id}`),
    createBook: (bookData) => api.post('/books', bookData),
    updateBook: (id, bookData) => api.patch(`/books/${id}`, bookData),
    deleteBook: (id) => api.delete(`/books/${id}`),
    getTopRated: () => api.get('/books/top-rated'),
    getLowStock: () => api.get('/books/low-stock'),
};

// Order APIs
export const orderAPI = {
    createOrder: (orderData) => api.post('/orders', orderData),
    getMyOrders: () => api.get('/orders/my-orders'),
    getOrder: (id) => api.get(`/orders/${id}`),
    updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
    cancelOrder: (id) => api.patch(`/orders/${id}/cancel`),
};

// User APIs
export const userAPI = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (userData) => api.patch('/users/profile', userData),
    addToWishlist: (bookId) => api.post('/users/wishlist', { bookId }),
    removeFromWishlist: (bookId) => api.delete(`/users/wishlist/${bookId}`),
    getWishlist: () => api.get('/users/wishlist'),
};

export default api; 