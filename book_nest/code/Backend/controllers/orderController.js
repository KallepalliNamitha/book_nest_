const Order = require('../models/orderModel');
const Book = require('../models/bookModel');
const { AppError } = require('../middleware/errorHandler');

exports.getAllOrders = async (req, res, next) => {
    try {
        const orders = await Order.find().populate('user', 'name email');
        res.status(200).json({
            status: 'success',
            results: orders.length,
            data: { orders }
        });
    } catch (error) {
        next(error);
    }
};

exports.getOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');
        if (!order) {
            return next(new AppError('No order found with that ID', 404));
        }

        // Check if user is owner of the order or admin/seller
        if (req.user.role === 'user' && order.user.toString() !== req.user.id) {
            return next(new AppError('You do not have permission to view this order', 403));
        }

        res.status(200).json({
            status: 'success',
            data: { order }
        });
    } catch (error) {
        next(error);
    }
};

exports.createOrder = async (req, res, next) => {
    try {
        // Check if all books exist and have enough stock
        const books = await Promise.all(
            req.body.items.map(async (item) => {
                const book = await Book.findById(item.book);
                if (!book) {
                    throw new AppError(`Book not found with ID: ${item.book}`, 404);
                }
                if (book.stock.quantity < item.quantity) {
                    throw new AppError(`Not enough stock for book: ${book.title}`, 400);
                }
                return book;
            })
        );

        // Create order
        const order = await Order.create({
            user: req.user.id,
            items: req.body.items,
            shippingAddress: req.body.shippingAddress,
            paymentMethod: req.body.paymentMethod
        });

        // Update book stock
        await Promise.all(
            books.map(async (book, index) => {
                book.stock.quantity -= req.body.items[index].quantity;
                await book.save();
            })
        );

        res.status(201).json({
            status: 'success',
            data: { order }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return next(new AppError('No order found with that ID', 404));
        }

        // Only allow updating certain fields
        const allowedUpdates = ['status', 'trackingNumber'];
        const updates = {};
        Object.keys(req.body).forEach((key) => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: { order: updatedOrder }
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return next(new AppError('No order found with that ID', 404));
        }

        await order.remove();
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

exports.getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.user.id });
        res.status(200).json({
            status: 'success',
            results: orders.length,
            data: { orders }
        });
    } catch (error) {
        next(error);
    }
};

exports.getOrderStats = async (req, res, next) => {
    try {
        const stats = await Order.getOrderStats();
        res.status(200).json({
            status: 'success',
            data: { stats }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateOrderStatus = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return next(new AppError('No order found with that ID', 404));
        }

        order.status = req.body.status;
        await order.save();

        res.status(200).json({
            status: 'success',
            data: { order }
        });
    } catch (error) {
        next(error);
    }
};

exports.addTracking = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return next(new AppError('No order found with that ID', 404));
        }

        order.trackingNumber = req.body.trackingNumber;
        order.trackingUrl = req.body.trackingUrl;
        await order.save();

        res.status(200).json({
            status: 'success',
            data: { order }
        });
    } catch (error) {
        next(error);
    }
};

exports.cancelOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return next(new AppError('No order found with that ID', 404));
        }

        // Check if user is owner of the order
        if (order.user.toString() !== req.user.id) {
            return next(new AppError('You do not have permission to cancel this order', 403));
        }

        // Check if order can be cancelled
        if (order.status !== 'pending' && order.status !== 'processing') {
            return next(new AppError('Order cannot be cancelled at this stage', 400));
        }

        // Restore book stock
        await Promise.all(
            order.items.map(async (item) => {
                const book = await Book.findById(item.book);
                if (book) {
                    book.stock.quantity += item.quantity;
                    await book.save();
                }
            })
        );

        order.status = 'cancelled';
        await order.save();

        res.status(200).json({
            status: 'success',
            data: { order }
        });
    } catch (error) {
        next(error);
    }
};

exports.getSellerOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ 'items.seller': req.params.sellerId })
            .populate('user', 'name email')
            .populate('items.book', 'title author price');

        res.status(200).json({
            status: 'success',
            results: orders.length,
            data: orders
        });
    } catch (error) {
        next(error);
    }
}; 