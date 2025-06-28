const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    review: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    verified: {
        type: Boolean,
        default: false // Will be true if the user has purchased the book
    }
}, {
    timestamps: true
});

// Index for faster queries
ReviewSchema.index({ bookId: 1, userId: 1 }, { unique: true }); // One review per book per user
ReviewSchema.index({ bookId: 1, rating: -1 }); // For sorting by rating
ReviewSchema.index({ bookId: 1, createdAt: -1 }); // For sorting by date

// Static method to calculate average rating
ReviewSchema.statics.calculateAverageRating = async function(bookId) {
    const result = await this.aggregate([
        {
            $match: { bookId: mongoose.Types.ObjectId(bookId) }
        },
        {
            $group: {
                _id: '$bookId',
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    return result[0] || { averageRating: 0, totalReviews: 0 };
};

module.exports = mongoose.model('Review', ReviewSchema); 