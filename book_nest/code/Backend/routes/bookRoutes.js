const express = require('express');
const multer = require('multer');
const { protect, restrictTo } = require('../middleware/auth');
const router = express.Router();

// Import controllers
const {
    getAllBooks,
    getBook,
    createBook,
    updateBook,
    deleteBook,
    getBookStats,
    getTopRated,
    getLowStock,
    addReview,
    getReviews,
    updateReview,
    deleteReview,
    getBooksBySeller
} = require('../controllers/bookController');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
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

// Public routes
router.get('/', getAllBooks);
router.get('/stats', getBookStats);
router.get('/top-rated', getTopRated);
router.get('/low-stock', getLowStock);
router.get('/seller/:sellerId', getBooksBySeller);
router.get('/:id', getBook);
router.get('/:id/reviews', getReviews);

// Protected routes
router.use(protect);

// Seller and admin only routes
router.post('/', restrictTo('seller', 'admin'), upload.single('itemImage'), createBook);
router.patch('/:id', restrictTo('seller', 'admin'), upload.single('itemImage'), updateBook);
router.delete('/:id', restrictTo('seller', 'admin'), deleteBook);

// Review routes
router.post('/:id/reviews', addReview);
router.patch('/reviews/:reviewId', updateReview);
router.delete('/reviews/:reviewId', deleteReview);

module.exports = router; 