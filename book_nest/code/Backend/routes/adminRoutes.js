const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { protect, restrictTo } = require('../middleware/auth');
const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Book = require('../models/bookModel');

const router = express.Router();

// Helper function to generate JWT token
const generateToken = (user, role) => {
    return jwt.sign(
        { userId: user._id, email: user.email, role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );
};

// File upload configuration
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!require('fs').existsSync(uploadDir)) {
            require('fs').mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, callback) {
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        callback(null, `${Date.now()}-${sanitizedFilename}`);
    },
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size is too large. Max size is 5MB.' });
        }
        return res.status(400).json({ error: err.message });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
};

// Login
router.post('/login', async (req, res) => {  
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Please provide email and password" });
        }

        // Find admin and explicitly select password field
        const admin = await Admin.findOne({ email }).select('+password');
        console.log('Admin found:', admin ? 'Yes' : 'No');
        
        if (!admin) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        if (!admin.password) {
            console.error('Admin password field is missing');
            return res.status(500).json({ error: "Invalid account configuration" });
        }

        // Use the model's correctPassword method
        const isMatch = await admin.correctPassword(password, admin.password);
        console.log('Password match:', isMatch ? 'Yes' : 'No');
        
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        
        const token = generateToken(admin, 'admin');
        
        // Remove sensitive data before sending response
        const adminData = admin.toObject();
        delete adminData.password;
        
        res.json({ 
            Status: "Success",
            user: { 
                id: admin._id,
                name: admin.name, 
                email: admin.email,
                role: 'admin'
            },
            token
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: "Failed to login. Please try again." });
    }
});

// Register
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Please provide name, email and password" });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Please provide a valid email address" });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters long" });
        }

        const existingAdmin = await Admin.findOne({ email });
        
        if (existingAdmin) {
            return res.status(400).json({ error: "Email already registered" });
        }
        
        const newAdmin = await Admin.create({ 
            email, 
            name, 
            password,
            role: 'admin'
        });

        // Remove password from response
        const adminData = newAdmin.toObject();
        delete adminData.password;

        res.status(201).json({ 
            Status: "Success",
            message: "Admin account created successfully",
            admin: {
                id: newAdmin._id,
                name: newAdmin.name,
                email: newAdmin.email,
                role: 'admin'
            }
        });
    } catch (error) {
        console.error('Admin signup error:', error);
        res.status(500).json({ error: "Failed to create account. Please try again." });
    }
});

// Get all users
router.get('/users', protect, restrictTo('admin'), async (req, res) => {
    try {
        const allUsers = await User.find().select('-password');
        res.status(200).json(allUsers);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// Delete user
router.delete('/users/:id', protect, restrictTo('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.sendStatus(200);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete order
router.delete('/orders/:id', protect, restrictTo('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        await Order.findByIdAndDelete(id);
        res.sendStatus(200);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete item
router.delete('/items/:id', protect, restrictTo('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        await Book.findByIdAndDelete(id);
        res.sendStatus(200);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 