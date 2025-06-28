const mongoose = require('mongoose');

// Only define the model if it hasn't been defined yet
let Order;
try {
    Order = mongoose.model('Order');
} catch (error) {
    const orderSchema = new mongoose.Schema({
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Order must belong to a user']
        },
        userName: {
            type: String,
            required: [true, 'User name is required']
        },
        book: {
            type: mongoose.Schema.ObjectId,
            ref: 'Book',
            required: [true, 'Order must include a book']
        },
        seller: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Order must have a seller']
        },
        quantity: {
            type: Number,
            required: [true, 'Order must have a quantity'],
            min: [1, 'Quantity must be at least 1']
        },
        totalAmount: {
            type: Number,
            required: [true, 'Order must have a total amount']
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
            default: 'pending'
        },
        shippingAddress: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'pending'
        },
        paymentMethod: {
            type: String,
            required: [true, 'Payment method is required']
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    });

    // Add indexes
    orderSchema.index({ user: 1, createdAt: -1 });
    orderSchema.index({ seller: 1, createdAt: -1 });
    orderSchema.index({ status: 1 });

    // Update timestamps before saving
    orderSchema.pre('save', function(next) {
        this.updatedAt = Date.now();
        next();
    });

    // Populate references when finding orders
    orderSchema.pre(/^find/, function(next) {
        this.populate({
            path: 'book',
            select: 'title author price'
        });
        next();
    });

    Order = mongoose.model('Order', orderSchema);
}

module.exports = Order; 