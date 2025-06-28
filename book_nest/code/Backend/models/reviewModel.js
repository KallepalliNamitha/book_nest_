const mongoose = require('mongoose');

// Only define the model if it hasn't been defined yet
let Review;
try {
    Review = mongoose.model('Review');
} catch (error) {
    const reviewSchema = new mongoose.Schema({
        book: {
            type: mongoose.Schema.ObjectId,
            ref: 'Book',
            required: [true, 'Review must belong to a book']
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user']
        },
        rating: {
            type: Number,
            required: [true, 'Review must have a rating'],
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            required: [true, 'Review must have a comment'],
            trim: true,
            maxlength: [1000, 'Review comment cannot be longer than 1000 characters']
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
    reviewSchema.index({ book: 1, user: 1 }, { unique: true });
    reviewSchema.index({ book: 1, rating: -1 });
    reviewSchema.index({ user: 1, createdAt: -1 });

    // Update timestamps before saving
    reviewSchema.pre('save', function(next) {
        this.updatedAt = Date.now();
        next();
    });

    // After saving a review, update the book's average rating
    reviewSchema.post('save', async function() {
        const Book = mongoose.model('Book');
        const stats = await this.constructor.aggregate([
            {
                $match: { book: this.book }
            },
            {
                $group: {
                    _id: '$book',
                    averageRating: { $avg: '$rating' },
                    numberOfReviews: { $sum: 1 }
                }
            }
        ]);

        if (stats.length > 0) {
            await Book.findByIdAndUpdate(this.book, {
                averageRating: Math.round(stats[0].averageRating * 10) / 10,
                numberOfReviews: stats[0].numberOfReviews
            });
        } else {
            await Book.findByIdAndUpdate(this.book, {
                averageRating: 0,
                numberOfReviews: 0
            });
        }
    });

    // Before query middleware
    reviewSchema.pre(/^find/, function(next) {
        this.populate({
            path: 'user',
            select: 'name'
        });
        next();
    });

    Review = mongoose.model('Review', reviewSchema);
}

module.exports = Review; 