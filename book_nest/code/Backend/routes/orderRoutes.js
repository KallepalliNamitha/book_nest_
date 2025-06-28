const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const router = express.Router();

// Import controllers
const {
    getAllOrders,
    getOrder,
    createOrder,
    updateOrder,
    deleteOrder,
    getMyOrders,
    getOrderStats,
    updateOrderStatus,
    addTracking,
    cancelOrder,
    getSellerOrders
} = require('../controllers/orderController');

// Protected routes - all order routes require authentication
router.use(protect);

// User routes
router.get('/my-orders', getMyOrders);
router.post('/', createOrder);
router.get('/:id', getOrder);
router.patch('/cancel/:id', cancelOrder);

// Admin and seller routes
router.use(restrictTo('admin', 'seller'));
router.get('/', getAllOrders);
router.get('/stats', getOrderStats);
router.get('/seller/:sellerId', getSellerOrders);
router.patch('/:id', updateOrder);
router.delete('/:id', deleteOrder);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/tracking', addTracking);

module.exports = router; 