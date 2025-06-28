const Book = require('../models/bookModel');
const Order = require('../models/orderModel');

class RecommendationService {
    // Get books similar to a given book based on genre and author
    async getSimilarBooks(bookId, limit = 5) {
        try {
            const book = await Book.findById(bookId);
            if (!book) return [];

            const similarBooks = await Book.find({
                _id: { $ne: bookId },
                $or: [
                    { genre: book.genre },
                    { author: book.author }
                ]
            })
            .sort({ averageRating: -1, totalReviews: -1 })
            .limit(limit);

            return similarBooks;
        } catch (error) {
            console.error('Error getting similar books:', error);
            return [];
        }
    }

    // Get personalized recommendations based on user's purchase history and ratings
    static async getPersonalizedRecommendations(userId) {
        try {
            // Get user's order history
            const userOrders = await Order.find({ user: userId })
                .populate('book', 'genre author');

            // Extract genres and authors from user's orders
            const userPreferences = userOrders.reduce((prefs, order) => {
                if (order.book) {
                    prefs.genres.add(order.book.genre);
                    prefs.authors.add(order.book.author);
                }
                return prefs;
            }, { genres: new Set(), authors: new Set() });

            // Find similar books based on user preferences
            const recommendations = await Book.find({
                $or: [
                    { genre: { $in: Array.from(userPreferences.genres) } },
                    { author: { $in: Array.from(userPreferences.authors) } }
                ],
                averageRating: { $gte: 4 }
            })
            .limit(10)
            .sort('-averageRating');

            return recommendations;
        } catch (error) {
            console.error('Error in getPersonalizedRecommendations:', error);
            throw error;
        }
    }

    // Get trending books based on recent orders and ratings
    async getTrendingBooks(days = 30, limit = 10) {
        try {
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - days);

            // Get recently ordered books
            const recentOrders = await Order.find({
                createdAt: { $gte: dateThreshold }
            });
            const recentBookIds = recentOrders.flatMap(order => 
                order.items.map(item => item.bookId)
            );

            // Get books with recent high ratings
            const recentHighRatings = await Review.find({
                createdAt: { $gte: dateThreshold },
                rating: { $gte: 4 }
            }).distinct('bookId');

            // Combine and get trending books
            const trendingBookIds = [...new Set([...recentBookIds, ...recentHighRatings])];
            const trendingBooks = await Book.find({
                _id: { $in: trendingBookIds }
            })
            .sort({ averageRating: -1, totalReviews: -1 })
            .limit(limit);

            return trendingBooks;
        } catch (error) {
            console.error('Error getting trending books:', error);
            return [];
        }
    }

    // Get recommendations based on user's genre preferences
    async getGenreBasedRecommendations(userId, limit = 10) {
        try {
            const user = await User.findById(userId);
            if (!user || !user.preferredGenres || user.preferredGenres.length === 0) {
                return [];
            }

            const recommendations = await Book.find({
                genre: { $in: user.preferredGenres }
            })
            .sort({ averageRating: -1, totalReviews: -1 })
            .limit(limit);

            return recommendations;
        } catch (error) {
            console.error('Error getting genre-based recommendations:', error);
            return [];
        }
    }

    static async getPopularBooks() {
        try {
            const popularBooks = await Book.find({
                averageRating: { $gte: 4 }
            })
            .sort('-averageRating')
            .limit(10);

            return popularBooks;
        } catch (error) {
            console.error('Error in getPopularBooks:', error);
            throw error;
        }
    }

    static async getNewArrivals() {
        try {
            const newBooks = await Book.find()
                .sort('-createdAt')
                .limit(10);

            return newBooks;
        } catch (error) {
            console.error('Error in getNewArrivals:', error);
            throw error;
        }
    }
}

module.exports = new RecommendationService(); 