const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();
const authController = require('../controllers/authController');
const User = require('../models/userModel');

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/user/login', (req, res, next) => {
    req.body.role = 'user';
    next();
}, authController.login);
router.post('/seller/login', (req, res, next) => {
    req.body.role = 'seller';
    next();
}, authController.login);
router.post('/admin/login', (req, res, next) => {
    req.body.role = 'admin';
    next();
}, authController.login);

// Password reset routes
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Protected routes
router.use(authController.protect);

// Verification and logout routes
router.get('/verify', authController.verify);
router.get('/logout', authController.logout);

// User profile routes
router.get('/me', authController.protect, (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user
        }
    });
});

router.patch('/update-me', authController.protect, async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.user.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/delete-me', authController.protect, async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { active: false });
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router; 