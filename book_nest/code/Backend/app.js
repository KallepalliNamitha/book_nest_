require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter, authRateLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bookRoutes = require('./routes/bookRoutes');
const orderRoutes = require('./routes/orderRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload only images.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for development
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allow images to be served cross-origin
}));

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization
app.use(mongoSanitize());
app.use(xss());

// Rate limiting - Apply auth rate limiter only to auth routes
app.use('/api/auth', authRateLimiter);
app.use('/api/admin/login', authRateLimiter);
app.use('/api/admin/signup', authRateLimiter);
app.use('/api/seller/login', authRateLimiter);
app.use('/api/seller/signup', authRateLimiter);

// General rate limiting for other routes
app.use(rateLimiter);

// Compression
app.use(compression());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make multer available to routes
app.use((req, res, next) => {
    req.upload = upload;
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Root route - API status
app.get('/api', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Welcome to BookNest API',
        version: '1.0.0'
    });
});

// Root route - Serve React app in production or welcome message in development
app.get('/', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        res.sendFile(path.join(__dirname, '../Frontend/dist/index.html'));
    } else {
        res.status(200).json({
            status: 'success',
            message: 'BookNest API Server',
            environment: 'development',
            endpoints: {
                auth: '/api/auth',
                admin: '/api/admin',
                books: '/api/books',
                orders: '/api/orders'
            }
        });
    }
});

// Handle 404 routes
app.all('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Cannot find ${req.originalUrl} on this server`
    });
});

// Error handling
app.use(errorHandler);

module.exports = app; 