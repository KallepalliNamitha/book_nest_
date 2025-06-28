const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const Book = require('../models/bookModel');
const User = require('../models/userModel');

describe('Book Controller', () => {
  let adminToken;
  let userToken;
  let testBook;

  beforeAll(async () => {
    await mongoose.connect(global.__MONGO_URI__);

    // Create admin user
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'StrongPass123!',
      passwordConfirm: 'StrongPass123!',
      role: 'admin'
    });

    // Create regular user
    const user = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'StrongPass123!',
      passwordConfirm: 'StrongPass123!'
    });

    adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Book.deleteMany({});

    testBook = await Book.create({
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

  describe('GET /api/v1/books', () => {
    test('gets all books', async () => {
      const response = await request(app)
        .get('/api/v1/books');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.results).toBe(1);
      expect(response.body.data[0]).toHaveProperty('title', 'Test Book');
    });

    test('filters books by category', async () => {
      await Book.create({
        title: 'Non-Fiction Book',
        author: 'Another Author',
        description: 'Another Description',
        price: 19.99,
        imageUrl: 'another-image.jpg',
        category: 'Non-Fiction',
        rating: 4.0,
        stock: 5,
        isbn: '1234567890124'
      });

      const response = await request(app)
        .get('/api/v1/books')
        .query({ category: 'Fiction' });

      expect(response.status).toBe(200);
      expect(response.body.results).toBe(1);
      expect(response.body.data[0].category).toBe('Fiction');
    });

    test('sorts books by price', async () => {
      await Book.create({
        title: 'Cheap Book',
        author: 'Another Author',
        description: 'Another Description',
        price: 9.99,
        imageUrl: 'another-image.jpg',
        category: 'Fiction',
        rating: 4.0,
        stock: 5,
        isbn: '1234567890124'
      });

      const response = await request(app)
        .get('/api/v1/books')
        .query({ sort: 'price' });

      expect(response.status).toBe(200);
      expect(response.body.data[0].price).toBe(9.99);
      expect(response.body.data[1].price).toBe(29.99);
    });

    test('limits fields in response', async () => {
      const response = await request(app)
        .get('/api/v1/books')
        .query({ fields: 'title,price' });

      expect(response.status).toBe(200);
      expect(response.body.data[0]).toHaveProperty('title');
      expect(response.body.data[0]).toHaveProperty('price');
      expect(response.body.data[0]).not.toHaveProperty('description');
    });

    test('paginates results', async () => {
      // Create 15 more books
      const books = Array(15).fill().map((_, i) => ({
        title: `Book ${i + 2}`,
        author: 'Test Author',
        description: 'Test Description',
        price: 19.99,
        imageUrl: 'test-image.jpg',
        category: 'Fiction',
        rating: 4.0,
        stock: 5,
        isbn: `123456789012${i + 4}`
      }));

      await Book.create(books);

      const response = await request(app)
        .get('/api/v1/books')
        .query({ page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.results).toBe(6); // 16 total books, page 2 with limit 10
      expect(response.body.data).toHaveLength(6);
    });
  });

  describe('GET /api/v1/books/:id', () => {
    test('gets a specific book', async () => {
      const response = await request(app)
        .get(`/api/v1/books/${testBook._id}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('title', 'Test Book');
    });

    test('fails with invalid book id', async () => {
      const response = await request(app)
        .get('/api/v1/books/invalid_id');

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/invalid.*id/i);
    });

    test('fails with non-existent book id', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/books/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/no book found/i);
    });
  });

  describe('POST /api/v1/books', () => {
    const newBook = {
      title: 'New Book',
      author: 'New Author',
      description: 'New Description',
      price: 19.99,
      imageUrl: 'new-image.jpg',
      category: 'Fiction',
      rating: 4.0,
      stock: 5,
      isbn: '1234567890124'
    };

    test('creates a new book as admin', async () => {
      const response = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newBook);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('title', 'New Book');
    });

    test('fails to create book without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/books')
        .send(newBook);

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/not logged in/i);
    });

    test('fails to create book as regular user', async () => {
      const response = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newBook);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/not authorized/i);
    });

    test('fails to create book with duplicate ISBN', async () => {
      const response = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newBook,
          isbn: testBook.isbn
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/duplicate.*isbn/i);
    });
  });

  describe('PATCH /api/v1/books/:id', () => {
    test('updates a book as admin', async () => {
      const response = await request(app)
        .patch(`/api/v1/books/${testBook._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Title',
          price: 39.99
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('title', 'Updated Title');
      expect(response.body.data).toHaveProperty('price', 39.99);
    });

    test('fails to update book without authentication', async () => {
      const response = await request(app)
        .patch(`/api/v1/books/${testBook._id}`)
        .send({
          title: 'Updated Title'
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/not logged in/i);
    });

    test('fails to update book as regular user', async () => {
      const response = await request(app)
        .patch(`/api/v1/books/${testBook._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated Title'
        });

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/not authorized/i);
    });

    test('fails to update non-existent book', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/v1/books/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Title'
        });

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/no book found/i);
    });
  });

  describe('DELETE /api/v1/books/:id', () => {
    test('deletes a book as admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/books/${testBook._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);

      const book = await Book.findById(testBook._id);
      expect(book).toBeNull();
    });

    test('fails to delete book without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/books/${testBook._id}`);

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/not logged in/i);
    });

    test('fails to delete book as regular user', async () => {
      const response = await request(app)
        .delete(`/api/v1/books/${testBook._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/not authorized/i);
    });

    test('fails to delete non-existent book', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/books/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/no book found/i);
    });
  });

  describe('GET /api/v1/books/stats', () => {
    beforeEach(async () => {
      await Book.create([
        {
          title: 'Fiction Book 1',
          author: 'Author 1',
          description: 'Description 1',
          price: 19.99,
          imageUrl: 'image1.jpg',
          category: 'Fiction',
          rating: 4.0,
          stock: 5,
          isbn: '1234567890124'
        },
        {
          title: 'Non-Fiction Book',
          author: 'Author 2',
          description: 'Description 2',
          price: 24.99,
          imageUrl: 'image2.jpg',
          category: 'Non-Fiction',
          rating: 4.2,
          stock: 8,
          isbn: '1234567890125'
        }
      ]);
    });

    test('gets book statistics as admin', async () => {
      const response = await request(app)
        .get('/api/v1/books/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('totalBooks');
      expect(response.body.data).toHaveProperty('avgPrice');
      expect(response.body.data).toHaveProperty('avgRating');
      expect(response.body.data).toHaveProperty('categoryStats');
    });

    test('fails to get stats without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/books/stats');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/not logged in/i);
    });

    test('fails to get stats as regular user', async () => {
      const response = await request(app)
        .get('/api/v1/books/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/not authorized/i);
    });
  });

  describe('GET /api/v1/books/top-rated', () => {
    beforeEach(async () => {
      await Book.create([
        {
          title: 'Top Rated Book',
          author: 'Author 1',
          description: 'Description 1',
          price: 19.99,
          imageUrl: 'image1.jpg',
          category: 'Fiction',
          rating: 5.0,
          stock: 5,
          isbn: '1234567890124'
        },
        {
          title: 'Average Book',
          author: 'Author 2',
          description: 'Description 2',
          price: 24.99,
          imageUrl: 'image2.jpg',
          category: 'Fiction',
          rating: 3.5,
          stock: 8,
          isbn: '1234567890125'
        }
      ]);
    });

    test('gets top rated books', async () => {
      const response = await request(app)
        .get('/api/v1/books/top-rated');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.results).toBe(3); // including testBook
      expect(response.body.data[0]).toHaveProperty('rating', 5.0);
    });

    test('limits number of top rated books', async () => {
      const response = await request(app)
        .get('/api/v1/books/top-rated')
        .query({ limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.results).toBe(2);
    });
  });

  describe('GET /api/v1/books/low-stock', () => {
    beforeEach(async () => {
      await Book.create([
        {
          title: 'Low Stock Book',
          author: 'Author 1',
          description: 'Description 1',
          price: 19.99,
          imageUrl: 'image1.jpg',
          category: 'Fiction',
          rating: 4.0,
          stock: 2,
          isbn: '1234567890124'
        },
        {
          title: 'Well Stocked Book',
          author: 'Author 2',
          description: 'Description 2',
          price: 24.99,
          imageUrl: 'image2.jpg',
          category: 'Fiction',
          rating: 4.2,
          stock: 20,
          isbn: '1234567890125'
        }
      ]);
    });

    test('gets low stock books as admin', async () => {
      const response = await request(app)
        .get('/api/v1/books/low-stock')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data[0]).toHaveProperty('stock', 2);
    });

    test('fails to get low stock books without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/books/low-stock');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/not logged in/i);
    });

    test('fails to get low stock books as regular user', async () => {
      const response = await request(app)
        .get('/api/v1/books/low-stock')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/not authorized/i);
    });
  });
}); 