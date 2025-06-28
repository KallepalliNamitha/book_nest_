const mongoose = require('mongoose');
const Book = require('../models/bookModel');

describe('Book Model', () => {
  beforeAll(async () => {
    await mongoose.connect(global.__MONGO_URI__, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Book.deleteMany({});
  });

  describe('Schema', () => {
    test('creates a book successfully', async () => {
      const validBook = {
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test Description',
        price: 29.99,
        imageUrl: 'test-image.jpg',
        category: 'Fiction',
        rating: 4.5,
        stock: 10,
        isbn: '1234567890123'
      };

      const book = await Book.create(validBook);

      expect(book._id).toBeDefined();
      expect(book.title).toBe(validBook.title);
      expect(book.author).toBe(validBook.author);
      expect(book.description).toBe(validBook.description);
      expect(book.price).toBe(validBook.price);
      expect(book.imageUrl).toBe(validBook.imageUrl);
      expect(book.category).toBe(validBook.category);
      expect(book.rating).toBe(validBook.rating);
      expect(book.stock).toBe(validBook.stock);
      expect(book.isbn).toBe(validBook.isbn);
    });

    test('fails to create book without required fields', async () => {
      const invalidBook = {
        title: 'Test Book'
      };

      await expect(Book.create(invalidBook)).rejects.toThrow(mongoose.Error.ValidationError);
    });

    test('fails to create book with invalid price', async () => {
      const invalidBook = {
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test Description',
        price: -10,
        imageUrl: 'test-image.jpg',
        category: 'Fiction',
        rating: 4.5,
        stock: 10,
        isbn: '1234567890123'
      };

      await expect(Book.create(invalidBook)).rejects.toThrow(mongoose.Error.ValidationError);
    });

    test('fails to create book with invalid rating', async () => {
      const invalidBook = {
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test Description',
        price: 29.99,
        imageUrl: 'test-image.jpg',
        category: 'Fiction',
        rating: 6,
        stock: 10,
        isbn: '1234567890123'
      };

      await expect(Book.create(invalidBook)).rejects.toThrow(mongoose.Error.ValidationError);
    });

    test('fails to create book with invalid stock', async () => {
      const invalidBook = {
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test Description',
        price: 29.99,
        imageUrl: 'test-image.jpg',
        category: 'Fiction',
        rating: 4.5,
        stock: -1,
        isbn: '1234567890123'
      };

      await expect(Book.create(invalidBook)).rejects.toThrow(mongoose.Error.ValidationError);
    });

    test('fails to create book with duplicate ISBN', async () => {
      const book = {
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test Description',
        price: 29.99,
        imageUrl: 'test-image.jpg',
        category: 'Fiction',
        rating: 4.5,
        stock: 10,
        isbn: '1234567890123'
      };

      await Book.create(book);
      await expect(Book.create(book)).rejects.toThrow(mongoose.Error.MongoServerError);
    });
  });

  describe('Methods', () => {
    let book;

    beforeEach(async () => {
      book = await Book.create({
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test Description',
        price: 29.99,
        imageUrl: 'test-image.jpg',
        category: 'Fiction',
        rating: 4.5,
        stock: 10,
        isbn: '1234567890123'
      });
    });

    test('calculates sale price correctly', () => {
      book.salePrice = 19.99;
      book.onSale = true;
      expect(book.calculateSalePrice()).toBe(19.99);

      book.onSale = false;
      expect(book.calculateSalePrice()).toBe(29.99);
    });

    test('checks if book is in stock', () => {
      expect(book.isInStock()).toBe(true);

      book.stock = 0;
      expect(book.isInStock()).toBe(false);
    });

    test('checks if book is low in stock', () => {
      expect(book.isLowStock()).toBe(false);

      book.stock = 3;
      expect(book.isLowStock()).toBe(true);
    });

    test('updates stock level', async () => {
      await book.updateStock(-2);
      expect(book.stock).toBe(8);

      await book.updateStock(3);
      expect(book.stock).toBe(11);
    });

    test('fails to update stock below zero', async () => {
      await expect(book.updateStock(-11)).rejects.toThrow('Stock cannot be negative');
    });
  });

  describe('Virtual Fields', () => {
    test('generates slug from title', async () => {
      const book = await Book.create({
        title: 'Test Book Title',
        author: 'Test Author',
        description: 'Test Description',
        price: 29.99,
        imageUrl: 'test-image.jpg',
        category: 'Fiction',
        rating: 4.5,
        stock: 10,
        isbn: '1234567890123'
      });

      expect(book.slug).toBe('test-book-title');
    });

    test('formats price with currency symbol', async () => {
      const book = await Book.create({
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test Description',
        price: 29.99,
        imageUrl: 'test-image.jpg',
        category: 'Fiction',
        rating: 4.5,
        stock: 10,
        isbn: '1234567890123'
      });

      expect(book.formattedPrice).toBe('$29.99');
    });
  });

  describe('Query Middleware', () => {
    beforeEach(async () => {
      await Book.create([
        {
          title: 'Active Book',
          author: 'Test Author',
          description: 'Test Description',
          price: 29.99,
          imageUrl: 'test-image.jpg',
          category: 'Fiction',
          rating: 4.5,
          stock: 10,
          isbn: '1234567890123',
          active: true
        },
        {
          title: 'Inactive Book',
          author: 'Test Author',
          description: 'Test Description',
          price: 19.99,
          imageUrl: 'test-image.jpg',
          category: 'Fiction',
          rating: 4.0,
          stock: 0,
          isbn: '1234567890124',
          active: false
        }
      ]);
    });

    test('only finds active books', async () => {
      const books = await Book.find();
      expect(books.length).toBe(1);
      expect(books[0].active).toBe(true);
    });

    test('finds all books when explicitly querying for active:false', async () => {
      const books = await Book.find({ active: false });
      expect(books.length).toBe(1);
      expect(books[0].active).toBe(false);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      await Book.create([
        {
          title: 'Fiction Book 1',
          author: 'Author 1',
          description: 'Description 1',
          price: 29.99,
          imageUrl: 'image1.jpg',
          category: 'Fiction',
          rating: 4.5,
          stock: 10,
          isbn: '1234567890123'
        },
        {
          title: 'Fiction Book 2',
          author: 'Author 2',
          description: 'Description 2',
          price: 19.99,
          imageUrl: 'image2.jpg',
          category: 'Fiction',
          rating: 4.0,
          stock: 5,
          isbn: '1234567890124'
        },
        {
          title: 'Non-Fiction Book',
          author: 'Author 3',
          description: 'Description 3',
          price: 24.99,
          imageUrl: 'image3.jpg',
          category: 'Non-Fiction',
          rating: 4.2,
          stock: 8,
          isbn: '1234567890125'
        }
      ]);
    });

    test('gets book statistics by category', async () => {
      const stats = await Book.getBookStatsByCategory();
      expect(stats).toHaveLength(2);
      
      const fictionStats = stats.find(s => s._id === 'Fiction');
      expect(fictionStats.count).toBe(2);
      expect(fictionStats.avgPrice).toBeCloseTo(24.99);
      expect(fictionStats.avgRating).toBeCloseTo(4.25);
      expect(fictionStats.totalStock).toBe(15);
    });

    test('gets top rated books', async () => {
      const topBooks = await Book.getTopRatedBooks(2);
      expect(topBooks).toHaveLength(2);
      expect(topBooks[0].rating).toBeGreaterThanOrEqual(topBooks[1].rating);
    });

    test('gets low stock books', async () => {
      const lowStockBooks = await Book.getLowStockBooks();
      expect(lowStockBooks).toHaveLength(1);
      expect(lowStockBooks[0].stock).toBeLessThanOrEqual(5);
    });
  });
}); 