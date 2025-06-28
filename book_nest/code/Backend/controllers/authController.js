const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const { AppError } = require('../middleware/errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-book-nest-app';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const signToken = (user) => {
    return jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user);

    // Remove sensitive data from output
    user.password = undefined;
    user.passwordConfirm = undefined;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            address: user.address,
            phone: user.phone,
            createdAt: user.createdAt
        }
    });
};

exports.signup = async (req, res, next) => {
    try {
        // Validate required fields
        const requiredFields = ['name', 'email', 'password', 'passwordConfirm'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return next(new AppError(`Please provide ${field}`, 400));
            }
        }

        // Validate role
        const allowedRoles = ['user', 'seller'];
        if (req.body.role && !allowedRoles.includes(req.body.role)) {
            return next(new AppError('Invalid role specified. Allowed roles are: user, seller', 400));
        }

        // Admin role cannot be created through signup
        if (req.body.role === 'admin') {
            return next(new AppError('Admin accounts cannot be created through signup', 403));
        }

        // Check if passwords match
        if (req.body.password !== req.body.passwordConfirm) {
            return next(new AppError('Passwords do not match', 400));
        }

        // Create user
        const newUser = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm,
            role: req.body.role || 'user',
            address: req.body.address,
            phone: req.body.phone
        });

        createSendToken(newUser, 201, res);
    } catch (error) {
        if (error.code === 11000) {
            return next(new AppError('Email already exists. Please use a different email.', 400));
        }
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password, role } = req.body;

        // Check if email and password exist
        if (!email || !password) {
            return next(new AppError('Please provide email and password!', 400));
        }

        // Check if user exists and get password
        const user = await User.findOne({ email })
            .select('+password +active +loginAttempts +lockUntil')
            .exec();

        if (!user) {
            return next(new AppError('Invalid email or password', 401));
        }

        // If role is specified, check if user has that role
        if (role && user.role !== role) {
            await user.handleFailedLogin();
            return next(new AppError(`Invalid credentials for ${role} login`, 401));
        }

        // Check if account is locked
        if (user.isLocked()) {
            const waitTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
            return next(new AppError(`Account is locked. Please try again in ${waitTime} minutes.`, 423));
        }

        // Check if password is correct
        if (!(await user.correctPassword(password, user.password))) {
            await user.handleFailedLogin();
            return next(new AppError('Invalid email or password', 401));
        }

        // Check if user is active
        if (!user.active) {
            return next(new AppError('Your account is inactive. Please contact support.', 401));
        }

        // Reset login attempts on successful login
        await user.resetLoginAttempts();

        createSendToken(user, 200, res);
    } catch (error) {
        next(error);
    }
};

exports.verify = async (req, res, next) => {
    try {
        // Get token
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('No token provided', 401));
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if user still exists
        const user = await User.findById(decoded.userId);
        if (!user) {
            return next(new AppError('User not found', 401));
        }

        // Check if user changed password after token was issued
        if (user.changedPasswordAfter(decoded.iat)) {
            return next(new AppError('User recently changed password', 401));
        }

        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.logout = (req, res) => {
    res.status(200).json({ 
        status: 'success',
        message: 'Logged out successfully'
    });
};

exports.protect = async (req, res, next) => {
    try {
        // Get token
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('You are not logged in! Please log in to get access.', 401));
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if user still exists
        const user = await User.findById(decoded.userId);
        if (!user) {
            return next(new AppError('The user belonging to this token no longer exists.', 401));
        }

        // Check if user changed password after the token was issued
        if (user.changedPasswordAfter(decoded.iat)) {
            return next(new AppError('User recently changed password! Please log in again.', 401));
        }

        // Grant access to protected route
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid token. Please log in again!', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Your token has expired! Please log in again.', 401));
        }
        next(error);
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};

exports.forgotPassword = async (req, res, next) => {
    try {
        // Get user based on POSTed email
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return next(new AppError('There is no user with that email address.', 404));
        }

        // Generate random reset token
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        // Send it to user's email
        // TODO: Implement email sending
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!',
            resetToken // Remove this in production
        });
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        next(new AppError('There was an error sending the email. Try again later!', 500));
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        // Get user based on the token
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        // If token has not expired, and there is user, set the new password
        if (!user) {
            return next(new AppError('Token is invalid or has expired', 400));
        }

        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        createSendToken(user, 200, res);
    } catch (error) {
        next(error);
    }
};

exports.updatePassword = async (req, res, next) => {
    try {
        // Get user from collection
        const user = await User.findById(req.user.id).select('+password');

        // Check if POSTed current password is correct
        if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
            return next(new AppError('Your current password is wrong.', 401));
        }

        // If so, update password
        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        await user.save();

        createSendToken(user, 200, res);
    } catch (error) {
        next(error);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            status: 'success',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                address: user.address,
                phone: user.phone,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateMe = async (req, res, next) => {
    try {
        // Create error if user POSTs password data
        if (req.body.password || req.body.passwordConfirm) {
            return next(new AppError('This route is not for password updates. Please use /updatePassword.', 400));
        }

        // Filter unwanted fields that are not allowed to be updated
        const filteredBody = filterObj(req.body, 'name', 'email', 'address', 'phone');

        // Update user document
        const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                address: updatedUser.address,
                phone: updatedUser.phone,
                createdAt: updatedUser.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteMe = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { active: false });
        res.status(200).json({
            status: 'success',
            message: 'Account successfully deactivated'
        });
    } catch (error) {
        next(error);
    }
};

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}; 