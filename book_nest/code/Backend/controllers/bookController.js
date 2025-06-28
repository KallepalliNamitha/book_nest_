const Book = require('../models/bookModel');
const { AppError } = require('../middleware/errorHandler');

exports.getAllBooks = async (req, res, next) => {
    try {
        const books = await Book.find();
        res.status(200).json({
            status: 'success',
            results: books.length,
            data: { books }
        });
    } catch (error) {
        next(error);
    }
};

exports.getBook = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return next(new AppError('No book found with that ID', 404));
        }
        res.status(200).json({
            status: 'success',
            data: { book }
        });
    } catch (error) {
        next(error);
    }
};

exports.createBook = async (req, res, next) => {
    try {
        // Log the request data for debugging
        console.log('Creating book with data:', {
            body: req.body,
            user: req.user,
            file: req.file
        });

        // Validate required fields
        const requiredFields = ['title', 'author', 'genre', 'description', 'price'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return next(new AppError(`Please provide ${field}`, 400));
            }
        }

        // Validate user exists in request
        if (!req.user || !req.user._id) {
            return next(new AppError('User not authenticated', 401));
        }

        // Validate file was uploaded
        if (!req.file && !req.body.itemImage) {
            return next(new AppError('Please provide a book cover image', 400));
        }

        // Create book with file path and seller info
        const bookData = {
            ...req.body,
            seller: req.user._id,
            userName: req.user.name,
            itemImage: req.file ? req.file.filename : req.body.itemImage
        };

        console.log('Creating book with processed data:', bookData);

        const newBook = await Book.create(bookData);

        res.status(201).json({
            status: 'success',
            data: { book: newBook }
        });
    } catch (error) {
        console.error('Error creating book:', error);
        
        // Clean up uploaded file if book creation fails
        if (req.file) {
            const fs = require('fs');
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }

        // Send more specific error message
        if (error.name === 'ValidationError') {
            return next(new AppError(error.message, 400));
        } else if (error.code === 11000) {
            return next(new AppError('A book with this title already exists', 400));
        }
        
        next(error);
    }
};

exports.updateBook = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return next(new AppError('No book found with that ID', 404));
        }

        // Check if user is seller of the book or admin
        if (req.user.role !== 'admin' && book.seller.toString() !== req.user.id) {
            return next(new AppError('You do not have permission to update this book', 403));
        }

        const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: { book: updatedBook }
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteBook = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return next(new AppError('No book found with that ID', 404));
        }

        // Check if user is seller of the book or admin
        if (req.user.role !== 'admin' && book.seller.toString() !== req.user.id) {
            return next(new AppError('You do not have permission to delete this book', 403));
        }

        await book.remove();
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

exports.getBookStats = async (req, res, next) => {
    try {
        const stats = await Book.getBookStatsByCategory();
        res.status(200).json({
            status: 'success',
            data: { stats }
        });
    } catch (error) {
        next(error);
    }
};

exports.getTopRated = async (req, res, next) => {
    try {
        const books = await Book.getTopRatedBooks();
        res.status(200).json({
            status: 'success',
            results: books.length,
            data: { books }
        });
    } catch (error) {
        next(error);
    }
};

exports.getLowStock = async (req, res, next) => {
    try {
        const books = await Book.getLowStockBooks();
        res.status(200).json({
            status: 'success',
            results: books.length,
            data: { books }
        });
    } catch (error) {
        next(error);
    }
};

exports.addReview = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return next(new AppError('No book found with that ID', 404));
        }

        const review = {
            user: req.user.id,
            rating: req.body.rating,
            comment: req.body.comment
        };

        book.reviews.push(review);
        await book.save();

        res.status(201).json({
            status: 'success',
            data: { review }
        });
    } catch (error) {
        next(error);
    }
};

exports.getReviews = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id).populate('reviews.user', 'name');
        if (!book) {
            return next(new AppError('No book found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            results: book.reviews.length,
            data: { reviews: book.reviews }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateReview = async (req, res, next) => {
    try {
        const book = await Book.findOne({ 'reviews._id': req.params.reviewId });
        if (!book) {
            return next(new AppError('No review found with that ID', 404));
        }

        const review = book.reviews.id(req.params.reviewId);
        if (!review) {
            return next(new AppError('No review found with that ID', 404));
        }

        // Check if user is owner of the review
        if (review.user.toString() !== req.user.id) {
            return next(new AppError('You do not have permission to update this review', 403));
        }

        review.rating = req.body.rating;
        review.comment = req.body.comment;
        await book.save();

        res.status(200).json({
            status: 'success',
            data: { review }
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteReview = async (req, res, next) => {
    try {
        const book = await Book.findOne({ 'reviews._id': req.params.reviewId });
        if (!book) {
            return next(new AppError('No review found with that ID', 404));
        }

        const review = book.reviews.id(req.params.reviewId);
        if (!review) {
            return next(new AppError('No review found with that ID', 404));
        }

        // Check if user is owner of the review or admin
        if (req.user.role !== 'admin' && review.user.toString() !== req.user.id) {
            return next(new AppError('You do not have permission to delete this review', 403));
        }

        review.remove();
        await book.save();

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

exports.getBooksBySeller = async (req, res, next) => {
    try {
        const books = await Book.find({ seller: req.params.sellerId });
        res.status(200).json({
            status: 'success',
            results: books.length,
            data: books
        });
    } catch (error) {
        next(error);
    }
}; 