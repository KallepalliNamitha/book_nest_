const mongoose = require('mongoose');

// Only define the model if it hasn't been defined yet
let Book;
try {
    Book = mongoose.model('Book');
} catch (error) {
    const bookSchema = new mongoose.Schema({
        title: {
            type: String,
            required: [true, 'A book must have a title'],
            trim: true
        },
        author: {
            type: String,
            required: [true, 'A book must have an author'],
            trim: true
        },
        genre: {
            type: String,
            required: [true, 'A book must have a genre'],
            trim: true
        },
        description: {
            type: String,
            required: [true, 'A book must have a description'],
            trim: true
        },
        price: {
            type: Number,
            required: [true, 'A book must have a price'],
            min: [0, 'Price cannot be negative']
        },
        itemImage: {
            type: String,
            required: [true, 'A book must have a cover image']
        },
        seller: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'A book must belong to a seller']
        },
        userName: {
            type: String,
            required: [true, 'Seller name is required']
        },
        reviews: [{
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: true
            },
            rating: {
                type: Number,
                required: true,
                min: 1,
                max: 5
            },
            comment: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        averageRating: {
            type: Number,
            default: 0,
            min: [0, 'Rating must be above 0'],
            max: [5, 'Rating must be below 5'],
            set: val => Math.round(val * 10) / 10
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
    bookSchema.index({ title: 'text', author: 'text', genre: 'text' });
    bookSchema.index({ seller: 1, createdAt: -1 });

    // Calculate average rating before saving
    bookSchema.pre('save', function(next) {
        if (this.reviews.length > 0) {
            this.averageRating = this.reviews.reduce((acc, review) => acc + review.rating, 0) / this.reviews.length;
        }
        this.updatedAt = Date.now();
        next();
    });

    // Static methods
    bookSchema.statics.getBookStatsByCategory = function() {
        return this.aggregate([
            {
                $group: {
                    _id: '$genre',
                    count: { $sum: 1 },
                    avgPrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            }
        ]);
    };

    bookSchema.statics.getTopRatedBooks = function() {
        return this.find({ averageRating: { $gt: 4 } })
            .sort('-averageRating')
            .limit(10);
    };

    bookSchema.statics.getLowStockBooks = function() {
        return this.find()
            .sort('quantity')
            .limit(10);
    };

    Book = mongoose.model('Book', bookSchema);
}

module.exports = Book; 