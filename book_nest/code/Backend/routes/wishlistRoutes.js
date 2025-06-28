const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const WishlistItem = require('../db/Users/Wishlist');
const { AppError } = require('../middleware/errorHandler');

// Protect all wishlist routes
router.use(protect);

// Get user's wishlist
router.get('/:userId', async (req, res, next) => {
    try {
        const wishlistItems = await WishlistItem.find({ userId: req.params.userId });
        res.status(200).json(wishlistItems);
    } catch (error) {
        next(new AppError('Error fetching wishlist', 500));
    }
});

// Add item to wishlist
router.post('/add', async (req, res, next) => {
    try {
        const { itemId, userId, userName, itemImage, title, author, genre, price } = req.body;

        // Check if item already exists in wishlist
        const existingItem = await WishlistItem.findOne({ itemId, userId });
        if (existingItem) {
            return res.status(400).json({ message: 'Item already in wishlist' });
        }

        // Create new wishlist item
        const wishlistItem = await WishlistItem.create({
            itemId,
            userId,
            userName,
            itemImage,
            title,
            author,
            genre,
            price
        });

        res.status(201).json(wishlistItem);
    } catch (error) {
        next(new AppError('Error adding item to wishlist', 500));
    }
});

// Remove item from wishlist
router.post('/remove', async (req, res, next) => {
    try {
        const { itemId } = req.body;
        await WishlistItem.findOneAndDelete({ itemId });
        res.status(200).json({ message: 'Item removed from wishlist' });
    } catch (error) {
        next(new AppError('Error removing item from wishlist', 500));
    }
});

module.exports = router; 