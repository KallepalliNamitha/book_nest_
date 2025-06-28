const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [function() {
            // Only required for new documents or when password is modified
            return this.isNew || this.isModified('password');
        }, 'Please confirm your password'],
        validate: {
            validator: function(el) {
                // Only run this validation if password is being modified or it's a new document
                if (!this.isModified('password') && !this.isNew) return true;
                return el === this.password;
            },
            message: 'Passwords do not match'
        }
    },
    role: {
        type: String,
        enum: ['user', 'seller', 'admin'],
        default: 'user'
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String
    },
    phone: String,
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    loginAttempts: {
        type: Number,
        default: 0,
        select: false
    },
    lockUntil: {
        type: Date,
        select: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        this.password = await bcrypt.hash(this.password, 12);
        this.passwordConfirm = undefined;
        
        // Update passwordChangedAt field
        if (this.isModified('password') && !this.isNew) {
            this.passwordChangedAt = Date.now() - 1000;
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Query middleware to only find active users
userSchema.pre(/^find/, function(next) {
    this.find({ active: { $ne: false } });
    next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Instance method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken;
};

// Instance method to handle failed login attempts
userSchema.methods.handleFailedLogin = async function() {
    // Increment login attempts
    this.loginAttempts += 1;

    // Lock account if more than 5 failed attempts
    if (this.loginAttempts >= 5) {
        this.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
    }

    await this.save();

    if (this.isLocked()) {
        throw new Error('Account locked. Please try again later.');
    }
};

// Instance method to check if account is locked
userSchema.methods.isLocked = function() {
    return this.lockUntil && this.lockUntil > Date.now();
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    await this.save();
};

// Virtual populate for books (if user is a seller)
userSchema.virtual('books', {
    ref: 'Book',
    foreignField: 'seller',
    localField: '_id'
});

// Virtual populate for orders (if user is a buyer)
userSchema.virtual('orders', {
    ref: 'Order',
    foreignField: 'user',
    localField: '_id'
});

// Virtual populate for sales (if user is a seller)
userSchema.virtual('sales', {
    ref: 'Order',
    foreignField: 'seller',
    localField: '_id'
});

const User = mongoose.model('User', userSchema);

module.exports = User; 