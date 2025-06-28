const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Book = require('../models/bookModel');

describe('Order Model', () => {
  let testUser;
  let testBook;

  beforeAll(async () => {
    await mongoose.connect(global.__MONGO_URI__);

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Test@123',
      passwordConfirm: 'Test@123'
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
  });

  describe('Schema', () => {
    test('creates an order successfully', async () => {
      const validOrder = {
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
        paymentMethod: 'credit_card',
        paymentResult: {
          id: 'test_payment_id',
          status: 'completed',
          updateTime: Date.now(),
          email: 'test@example.com'
        }
      };

      const order = await Order.create(validOrder);

      expect(order._id).toBeDefined();
      expect(order.user.toString()).toBe(testUser._id.toString());
      expect(order.books[0].book.toString()).toBe(testBook._id.toString());
      expect(order.books[0].quantity).toBe(2);
      expect(order.status).toBe('pending'); // default status
      expect(order.totalAmount).toBeDefined();
      expect(order.shippingAddress).toEqual(validOrder.shippingAddress);
      expect(order.paymentMethod).toBe(validOrder.paymentMethod);
      expect(order.paymentResult).toEqual(validOrder.paymentResult);
    });

    test('fails to create order without required fields', async () => {
      const invalidOrder = {
        user: testUser._id
      };

      await expect(Order.create(invalidOrder)).rejects.toThrow(mongoose.Error.ValidationError);
    });

    test('fails to create order with invalid quantity', async () => {
      const invalidOrder = {
        user: testUser._id,
        books: [{
          book: testBook._id,
          quantity: 0
        }],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        }
      };

      await expect(Order.create(invalidOrder)).rejects.toThrow(mongoose.Error.ValidationError);
    });

    test('fails to create order with invalid status', async () => {
      const invalidOrder = {
        user: testUser._id,
        books: [{
          book: testBook._id,
          quantity: 2
        }],
        status: 'invalid_status',
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        }
      };

      await expect(Order.create(invalidOrder)).rejects.toThrow(mongoose.Error.ValidationError);
    });
  });

  describe('Methods', () => {
    let order;

    beforeEach(async () => {
      order = await Order.create({
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
        }
      });
    });

    test('calculates total amount correctly', async () => {
      const expectedTotal = testBook.price * 2;
      expect(order.totalAmount).toBe(expectedTotal);
    });

    test('updates order status', async () => {
      await order.updateStatus('processing');
      expect(order.status).toBe('processing');
      expect(order.statusHistory).toHaveLength(2); // including initial status
    });

    test('adds tracking information', async () => {
      const trackingInfo = {
        carrier: 'Test Carrier',
        trackingNumber: '1234567890',
        estimatedDelivery: new Date()
      };

      await order.addTrackingInfo(trackingInfo);
      expect(order.tracking).toEqual(trackingInfo);
      expect(order.status).toBe('shipped');
    });

    test('cancels order', async () => {
      const reason = 'Customer request';
      await order.cancel(reason);
      expect(order.status).toBe('cancelled');
      expect(order.cancellationReason).toBe(reason);
      expect(order.cancelledAt).toBeDefined();
    });

    test('cannot cancel completed order', async () => {
      await order.updateStatus('completed');
      await expect(order.cancel('Customer request')).rejects.toThrow('Cannot cancel completed order');
    });
  });

  describe('Virtual Fields', () => {
    test('generates order number', async () => {
      const order = await Order.create({
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
        }
      });

      expect(order.orderNumber).toMatch(/^ORD-\d{6}$/);
    });

    test('calculates total items', async () => {
      const order = await Order.create({
        user: testUser._id,
        books: [
          {
            book: testBook._id,
            quantity: 2
          },
          {
            book: testBook._id,
            quantity: 3
          }
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        }
      });

      expect(order.totalItems).toBe(5);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      await Order.create([
        {
          user: testUser._id,
          books: [{
            book: testBook._id,
            quantity: 2
          }],
          status: 'completed',
          totalAmount: 59.98,
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
            quantity: 1
          }],
          status: 'pending',
          totalAmount: 29.99,
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

    test('gets order statistics', async () => {
      const stats = await Order.getOrderStats();
      expect(stats.totalOrders).toBe(2);
      expect(stats.totalRevenue).toBe(89.97);
      expect(stats.averageOrderValue).toBe(44.985);
    });

    test('gets user order history', async () => {
      const history = await Order.getUserOrderHistory(testUser._id);
      expect(history).toHaveLength(2);
      expect(history[0].user.toString()).toBe(testUser._id.toString());
    });

    test('gets orders by status', async () => {
      const pendingOrders = await Order.getOrdersByStatus('pending');
      expect(pendingOrders).toHaveLength(1);
      expect(pendingOrders[0].status).toBe('pending');
    });
  });

  describe('Middleware', () => {
    test('updates book stock after order creation', async () => {
      const order = await Order.create({
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
        }
      });

      const updatedBook = await Book.findById(testBook._id);
      expect(updatedBook.stock).toBe(8); // original stock (10) - order quantity (2)
    });

    test('restores book stock after order cancellation', async () => {
      const order = await Order.create({
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
        }
      });

      await order.cancel('Customer request');
      const updatedBook = await Book.findById(testBook._id);
      expect(updatedBook.stock).toBe(10); // stock restored after cancellation
    });
  });
}); 