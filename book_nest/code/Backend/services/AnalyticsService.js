const Book = require('../models/bookModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');

class AnalyticsService {
    static async getSellerAnalytics(sellerId) {
        try {
            // Get total sales
            const orders = await Order.find({ seller: sellerId });
            const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
            const totalOrders = orders.length;

            // Get books by seller
            const books = await Book.find({ seller: sellerId });
            const totalBooks = books.length;

            // Calculate average rating
            const averageRating = books.reduce((sum, book) => sum + (book.averageRating || 0), 0) / totalBooks || 0;

            // Get sales by status
            const salesByStatus = await Order.aggregate([
                { $match: { seller: sellerId } },
                { $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    total: { $sum: '$totalAmount' }
                }}
            ]);

            // Get monthly sales
            const monthlySales = await Order.aggregate([
                { $match: { seller: sellerId } },
                { $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    total: { $sum: '$totalAmount' },
                    count: { $sum: 1 }
                }},
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 12 }
            ]);

            // Get top selling books
            const topSellingBooks = await Order.aggregate([
                { $match: { seller: sellerId } },
                { $group: {
                    _id: '$book',
                    totalSold: { $sum: '$quantity' },
                    totalRevenue: { $sum: '$totalAmount' }
                }},
                { $sort: { totalSold: -1 } },
                { $limit: 5 },
                { $lookup: {
                    from: 'books',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'bookDetails'
                }},
                { $unwind: '$bookDetails' }
            ]);

            return {
                totalSales,
                totalOrders,
                totalBooks,
                averageRating,
                salesByStatus,
                monthlySales,
                topSellingBooks
            };
        } catch (error) {
            console.error('Error in getSellerAnalytics:', error);
            throw error;
        }
    }

    static async getAdminAnalytics() {
        try {
            // Get total users
            const totalUsers = await User.countDocuments({ role: 'user' });
            const totalSellers = await User.countDocuments({ role: 'seller' });

            // Get total books and orders
            const totalBooks = await Book.countDocuments();
            const totalOrders = await Order.countDocuments();

            // Get total revenue
            const revenue = await Order.aggregate([
                { $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' }
                }}
            ]);
            const totalRevenue = revenue[0]?.total || 0;

            // Get monthly revenue
            const monthlyRevenue = await Order.aggregate([
                { $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    total: { $sum: '$totalAmount' },
                    count: { $sum: 1 }
                }},
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 12 }
            ]);

            // Get top selling books
            const topSellingBooks = await Order.aggregate([
                { $group: {
                    _id: '$book',
                    totalSold: { $sum: '$quantity' },
                    totalRevenue: { $sum: '$totalAmount' }
                }},
                { $sort: { totalSold: -1 } },
                { $limit: 10 },
                { $lookup: {
                    from: 'books',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'bookDetails'
                }},
                { $unwind: '$bookDetails' }
            ]);

            // Get top sellers
            const topSellers = await Order.aggregate([
                { $group: {
                    _id: '$seller',
                    totalSales: { $sum: '$totalAmount' },
                    totalOrders: { $sum: 1 }
                }},
                { $sort: { totalSales: -1 } },
                { $limit: 10 },
                { $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'sellerDetails'
                }},
                { $unwind: '$sellerDetails' }
            ]);

            return {
                totalUsers,
                totalSellers,
                totalBooks,
                totalOrders,
                totalRevenue,
                monthlyRevenue,
                topSellingBooks,
                topSellers
            };
        } catch (error) {
            console.error('Error in getAdminAnalytics:', error);
            throw error;
        }
    }

    // User Analytics
    async getUserAnalytics(timeRange = 30) {
        try {
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - timeRange);

            const analytics = {
                totalUsers: await User.countDocuments(),
                newUsers: await User.countDocuments({ createdAt: { $gte: dateThreshold } }),
                activeUsers: await Order.distinct('userId', { createdAt: { $gte: dateThreshold } }).length,
                usersByGenre: {},
                topReviewers: []
            };

            // Get users' preferred genres
            const users = await User.find({}, 'preferredGenres');
            users.forEach(user => {
                user.preferredGenres.forEach(genre => {
                    analytics.usersByGenre[genre] = (analytics.usersByGenre[genre] || 0) + 1;
                });
            });

            // Get top reviewers
            const reviewers = await Review.aggregate([
                { $match: { createdAt: { $gte: dateThreshold } } },
                { $group: {
                    _id: '$userId',
                    reviewCount: { $sum: 1 },
                    averageRating: { $avg: '$rating' }
                }},
                { $sort: { reviewCount: -1 } },
                { $limit: 5 }
            ]);

            analytics.topReviewers = await Promise.all(
                reviewers.map(async reviewer => {
                    const user = await User.findById(reviewer._id, 'name');
                    return {
                        userId: reviewer._id,
                        name: user.name,
                        reviewCount: reviewer.reviewCount,
                        averageRating: reviewer.averageRating
                    };
                })
            );

            return analytics;
        } catch (error) {
            console.error('Error getting user analytics:', error);
            throw error;
        }
    }

    // Inventory Analytics
    async getInventoryAnalytics(sellerId) {
        try {
            const analytics = {
                totalBooks: 0,
                lowStock: [],
                outOfStock: [],
                inventoryValue: 0,
                booksByGenre: {}
            };

            const books = await Book.find({ seller: sellerId });

            books.forEach(book => {
                analytics.totalBooks++;
                analytics.inventoryValue += book.price * book.quantity;

                // Track books by genre
                analytics.booksByGenre[book.genre] = analytics.booksByGenre[book.genre] || {
                    count: 0,
                    value: 0
                };
                analytics.booksByGenre[book.genre].count++;
                analytics.booksByGenre[book.genre].value += book.price * book.quantity;

                // Track low and out of stock items
                if (book.quantity === 0) {
                    analytics.outOfStock.push({
                        id: book._id,
                        title: book.title,
                        lastRestocked: book.updatedAt
                    });
                } else if (book.quantity < 5) {
                    analytics.lowStock.push({
                        id: book._id,
                        title: book.title,
                        quantity: book.quantity,
                        lastRestocked: book.updatedAt
                    });
                }
            });

            return analytics;
        } catch (error) {
            console.error('Error getting inventory analytics:', error);
            throw error;
        }
    }

    // Review Analytics
    async getReviewAnalytics(sellerId, timeRange = 30) {
        try {
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - timeRange);

            const books = await Book.find({ seller: sellerId }, '_id');
            const bookIds = books.map(book => book._id);

            const analytics = {
                totalReviews: 0,
                averageRating: 0,
                ratingDistribution: {
                    1: 0, 2: 0, 3: 0, 4: 0, 5: 0
                },
                recentReviews: [],
                reviewTrend: {}
            };

            const reviews = await Review.find({
                bookId: { $in: bookIds },
                createdAt: { $gte: dateThreshold }
            }).populate('userId', 'name').populate('bookId', 'title');

            reviews.forEach(review => {
                analytics.totalReviews++;
                analytics.ratingDistribution[review.rating]++;

                const reviewDate = review.createdAt.toISOString().split('T')[0];
                analytics.reviewTrend[reviewDate] = analytics.reviewTrend[reviewDate] || {
                    count: 0,
                    totalRating: 0
                };
                analytics.reviewTrend[reviewDate].count++;
                analytics.reviewTrend[reviewDate].totalRating += review.rating;
            });

            // Calculate average rating
            analytics.averageRating = analytics.totalReviews > 0
                ? Object.entries(analytics.ratingDistribution)
                    .reduce((acc, [rating, count]) => acc + (rating * count), 0) / analytics.totalReviews
                : 0;

            // Get recent reviews
            analytics.recentReviews = reviews
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 5)
                .map(review => ({
                    id: review._id,
                    bookTitle: review.bookId.title,
                    userName: review.userId.name,
                    rating: review.rating,
                    comment: review.review,
                    date: review.createdAt
                }));

            return analytics;
        } catch (error) {
            console.error('Error getting review analytics:', error);
            throw error;
        }
    }
}

module.exports = AnalyticsService; 