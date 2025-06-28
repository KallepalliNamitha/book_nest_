const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/userModel');
const { promisify } = require('util');

describe('Auth Controller', () => {
  beforeAll(async () => {
    await mongoose.connect(global.__MONGO_URI__);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/signup', () => {
    test('successfully registers a regular user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'StrongPass123!',
          passwordConfirm: 'StrongPass123!'
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.role).toBe('user');
    });

    test('successfully registers a seller', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup/seller')
        .send({
          name: 'Jane Smith',
          email: 'jane@example.com',
          password: 'StrongPass123!',
          passwordConfirm: 'StrongPass123!',
          address: {
            street: '123 Main St',
            city: 'Sample City',
            state: 'Sample State',
            pincode: '123456'
          },
          phone: '1234567890'
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.role).toBe('seller');
      expect(response.body.user.address).toBeDefined();
      expect(response.body.user.phone).toBeDefined();
    });

    test('fails to register with admin role directly', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Test Admin',
          email: 'admin@example.com',
          password: 'Test@123',
          passwordConfirm: 'Test@123',
          role: 'admin'
        });

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/admin accounts cannot be created through signup/i);
    });

    test('fails to register seller without required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup/seller')
        .send({
          name: 'Test Seller',
          email: 'seller@example.com',
          password: 'Test@123',
          passwordConfirm: 'Test@123'
          // Missing address and phone
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
    });

    test('fails to register user with existing email', async () => {
      await User.create({
        name: 'Existing User',
        email: 'test@example.com',
        password: 'Test@123',
        passwordConfirm: 'Test@123'
      });

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test@123',
          passwordConfirm: 'Test@123'
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/email already exists/i);
    });

    test('fails to register user with non-matching passwords', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test@123',
          passwordConfirm: 'Different@123'
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/passwords do not match/i);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        passwordConfirm: 'Test@123'
      });
    });

    test('successfully logs in user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@123'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
    });

    test('fails to login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Wrong@123'
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/incorrect email or password/i);
    });

    test('fails to login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test@123'
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/incorrect email or password/i);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let token;
    let user;

    beforeEach(async () => {
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        passwordConfirm: 'Test@123'
      });

      token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
      });
    });

    test('gets current user profile', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user).toHaveProperty('email', user.email);
    });

    test('fails without authentication token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/not logged in/i);
    });

    test('fails with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/invalid token/i);
    });
  });

  describe('PATCH /api/v1/auth/updateMe', () => {
    let token;
    let user;

    beforeEach(async () => {
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        passwordConfirm: 'Test@123'
      });

      token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
      });
    });

    test('updates user profile', async () => {
      const response = await request(app)
        .patch('/api/v1/auth/updateMe')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          email: 'updated@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user).toHaveProperty('name', 'Updated Name');
      expect(response.body.data.user).toHaveProperty('email', 'updated@example.com');
    });

    test('fails to update password through updateMe', async () => {
      const response = await request(app)
        .patch('/api/v1/auth/updateMe')
        .set('Authorization', `Bearer ${token}`)
        .send({
          password: 'NewTest@123'
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/not for password updates/i);
    });

    test('fails to update with existing email', async () => {
      await User.create({
        name: 'Another User',
        email: 'another@example.com',
        password: 'Test@123',
        passwordConfirm: 'Test@123'
      });

      const response = await request(app)
        .patch('/api/v1/auth/updateMe')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'another@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/email already exists/i);
    });
  });

  describe('PATCH /api/v1/auth/updateMyPassword', () => {
    let token;
    let user;

    beforeEach(async () => {
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        passwordConfirm: 'Test@123'
      });

      token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
      });
    });

    test('updates user password', async () => {
      const response = await request(app)
        .patch('/api/v1/auth/updateMyPassword')
        .set('Authorization', `Bearer ${token}`)
        .send({
          passwordCurrent: 'Test@123',
          password: 'NewTest@123',
          passwordConfirm: 'NewTest@123'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();
    });

    test('fails with incorrect current password', async () => {
      const response = await request(app)
        .patch('/api/v1/auth/updateMyPassword')
        .set('Authorization', `Bearer ${token}`)
        .send({
          passwordCurrent: 'Wrong@123',
          password: 'NewTest@123',
          passwordConfirm: 'NewTest@123'
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/current password is wrong/i);
    });

    test('fails with non-matching new passwords', async () => {
      const response = await request(app)
        .patch('/api/v1/auth/updateMyPassword')
        .set('Authorization', `Bearer ${token}`)
        .send({
          passwordCurrent: 'Test@123',
          password: 'NewTest@123',
          passwordConfirm: 'Different@123'
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/passwords do not match/i);
    });
  });

  describe('POST /api/v1/auth/forgotPassword', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        passwordConfirm: 'Test@123'
      });
    });

    test('sends password reset token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgotPassword')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toMatch(/token sent to email/i);
    });

    test('fails with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgotPassword')
        .send({
          email: 'nonexistent@example.com'
        });

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/no user with that email/i);
    });
  });

  describe('PATCH /api/v1/auth/resetPassword', () => {
    let resetToken;
    let user;

    beforeEach(async () => {
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        passwordConfirm: 'Test@123'
      });

      resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });
    });

    test('resets password with valid token', async () => {
      const response = await request(app)
        .patch(`/api/v1/auth/resetPassword/${resetToken}`)
        .send({
          password: 'NewTest@123',
          passwordConfirm: 'NewTest@123'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();
    });

    test('fails with invalid token', async () => {
      const response = await request(app)
        .patch('/api/v1/auth/resetPassword/invalidtoken')
        .send({
          password: 'NewTest@123',
          passwordConfirm: 'NewTest@123'
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/token is invalid/i);
    });

    test('fails with expired token', async () => {
      // Set token expiry to past
      user.passwordResetExpires = Date.now() - 10 * 60 * 1000;
      await user.save({ validateBeforeSave: false });

      const response = await request(app)
        .patch(`/api/v1/auth/resetPassword/${resetToken}`)
        .send({
          password: 'NewTest@123',
          passwordConfirm: 'NewTest@123'
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/token has expired/i);
    });
  });

  describe('POST /api/v1/auth/create-admin', () => {
    let adminToken;

    beforeEach(async () => {
      // Create an admin user first
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Test@123',
        passwordConfirm: 'Test@123',
        role: 'admin'
      });

      adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);
    });

    test('admin can create another admin', async () => {
      const response = await request(app)
        .post('/api/v1/auth/create-admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Admin',
          email: 'newadmin@example.com',
          password: 'Test@123',
          passwordConfirm: 'Test@123',
          role: 'admin'
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.user.role).toBe('admin');
    });

    test('non-admin cannot create admin', async () => {
      const user = await User.create({
        name: 'Regular User',
        email: 'user@example.com',
        password: 'Test@123',
        passwordConfirm: 'Test@123'
      });

      const userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

      const response = await request(app)
        .post('/api/v1/auth/create-admin')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'New Admin',
          email: 'newadmin@example.com',
          password: 'Test@123',
          passwordConfirm: 'Test@123',
          role: 'admin'
        });

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/not authorized/i);
    });
  });
}); 