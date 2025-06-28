const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Book = require('../models/bookModel');

describe('Order Controller', () => {
  let adminToken;
  let userToken;
  let testUser;
  let testBook;
  let testOrder;

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
    testUser = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'StrongPass123!',
      passwordConfirm: 'StrongPass123!'
    });

    adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    userToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    // Create test book
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

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Order.deleteMany({});

    testOrder = await Order.create({
      user: testUser._id,
      books: [{
        book: testBook._id,
        quantity: 2
      }],
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country'
      },
      totalAmount: 59.98
    });
  });

  describe('GET /api/v1/orders', () => {
    test('gets all orders as admin', async () => {
      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.results).toBe(1);
      expect(response.body.data[0]).toHaveProperty('totalAmount', 59.98);
    });

    test('gets only user orders as regular user', async () => {
      // Create another user's order
      await Order.create({
        user: new mongoose.Types.ObjectId(),
        books: [{
          book: testBook._id,
          quantity: 1
        }],
        shippingAddress: {
          street: '456 Other St',
          city: 'Other City',
          state: 'Other State',
          zipCode: '67890',
          country: 'Other Country'
        },
        totalAmount: 29.99
      });

      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.results).toBe(1);
      expect(response.body.data[0].user).toBe(testUser._id.toString());
    });

    test('fails without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/orders');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/not logged in/i);
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    test('gets specific order as admin', async () => {
      const response = await request(app)
        .get(`/api/v1/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('totalAmount', 59.98);
    });

    test('gets own order as regular user', async () => {
      const response = await request(app)
        .get(`/api/v1/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('user', testUser._id.toString());
    });

    test('fails to get other user order as regular user', async () => {
      const otherOrder = await Order.create({
        user: new mongoose.Types.ObjectId(),
        books: [{
          book: testBook._id,
          quantity: 1
        }],
        shippingAddress: {
          street: '456 Other St',
          city: 'Other City',
          state: 'Other State',
          zipCode: '67890',
          country: 'Other Country'
        },
        totalAmount: 29.99
      });

      const response = await request(app)
        .get(`/api/v1/orders/${otherOrder._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/not authorized/i);
    });
  });

  describe('POST /api/v1/orders', () => {
    const newOrder = {
      books: [{
        book: null, // will be set in beforeEach
        quantity: 1
      }],
      shippingAddress: {
        street: '789 New St',
        city: 'New City',
        state: 'New State',
        zipCode: '13579',
        country: 'New Country'
      }
    };

    beforeEach(() => {
      newOrder.books[0].book = testBook._id;
    });

    test('creates new order as authenticated user', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newOrder);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('user', testUser._id.toString());
      expect(response.body.data).toHaveProperty('totalAmount', 29.99);

      // Verify book stock is updated
      const updatedBook = await Book.findById(testBook._id);
      expect(updatedBook.stock).toBe(9);
    });

    test('fails to create order with insufficient stock', async () => {
      newOrder.books[0].quantity = 11;

      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newOrder);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/insufficient stock/i);
    });

    test('fails to create order with non-existent book', async () => {
      newOrder.books[0].book = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newOrder);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/book not found/i);
    });
  });

  describe('PATCH /api/v1/orders/:id', () => {
    test('updates order status as admin', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'processing'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('status', 'processing');
    });

    test('fails to update order as regular user', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'processing'
        });

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/not authorized/i);
    });

    test('fails to update order with invalid status', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'invalid_status'
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/invalid.*status/i);
    });
  });

  describe('DELETE /api/v1/orders/:id', () => {
    test('cancels order as admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);

      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.status).toBe('cancelled');

      // Verify book stock is restored
      const updatedBook = await Book.findById(testBook._id);
      expect(updatedBook.stock).toBe(12);
    });

    test('cancels own order as regular user', async () => {
      const response = await request(app)
        .delete(`/api/v1/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(204);

      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.status).toBe('cancelled');
    });

    test('fails to cancel other user order as regular user', async () => {
      const otherOrder = await Order.create({
        user: new mongoose.Types.ObjectId(),
        books: [{
          book: testBook._id,
          quantity: 1
        }],
        shippingAddress: {
          street: '456 Other St',
          city: 'Other City',
          state: 'Other State',
          zipCode: '67890',
          country: 'Other Country'
        },
        totalAmount: 29.99
      });

      const response = await request(app)
        .delete(`/api/v1/orders/${otherOrder._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/not authorized/i);
    });

    test('fails to cancel completed order', async () => {
      await Order.findByIdAndUpdate(testOrder._id, { status: 'completed' });

      const response = await request(app)
        .delete(`/api/v1/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/cannot cancel completed order/i);
    });
  });

  describe('GET /api/v1/orders/stats', () => {
    beforeEach(async () => {
      await Order.create([
        {
          user: testUser._id,
          books: [{
            book: testBook._id,
            quantity: 1
          }],
          status: 'completed',
          totalAmount: 29.99,
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'Test Country'
          },
          createdAt: new Date('2023-01-01')
        },
        {
          user: testUser._id,
          books: [{
            book: testBook._id,
            quantity: 2
          }],
          status: 'processing',
          totalAmount: 59.98,
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'Test Country'
          },
          createdAt: new Date('2023-01-02')
        }
      ]);
    });

    test('gets order statistics as admin', async () => {
      const response = await request(app)
        .get('/api/v1/orders/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('totalOrders');
      expect(response.body.data).toHaveProperty('totalRevenue');
      expect(response.body.data).toHaveProperty('averageOrderValue');
      expect(response.body.data).toHaveProperty('ordersByStatus');
    });

    test('fails to get stats as regular user', async () => {
      const response = await request(app)
        .get('/api/v1/orders/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/not authorized/i);
    });
  });

  describe('GET /api/v1/orders/my-orders', () => {
    beforeEach(async () => {
      // Create another user's order
      await Order.create({
        user: new mongoose.Types.ObjectId(),
        books: [{
          book: testBook._id,
          quantity: 1
        }],
        shippingAddress: {
          street: '456 Other St',
          city: 'Other City',
          state: 'Other State',
          zipCode: '67890',
          country: 'Other Country'
        },
        totalAmount: 29.99
      });
    });

    test('gets user orders', async () => {
      const response = await request(app)
        .get('/api/v1/orders/my-orders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.results).toBe(1);
      expect(response.body.data[0].user).toBe(testUser._id.toString());
    });

    test('fails without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/orders/my-orders');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/not logged in/i);
    });
  });
}); 