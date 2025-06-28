const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

describe('User Model', () => {
  beforeAll(async () => {
    await mongoose.connect(global.__MONGO_URI__);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('Schema', () => {
    test('creates a user successfully', async () => {
      const validUser = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass123!',
        passwordConfirm: 'StrongPass123!'
      };

      const user = await User.create(validUser);

      expect(user._id).toBeDefined();
      expect(user.name).toBe(validUser.name);
      expect(user.email).toBe(validUser.email);
      expect(user.role).toBe('user'); // default role
      expect(user.active).toBe(true); // default active status
      expect(user.password).not.toBe(validUser.password); // password should be hashed
      expect(user.passwordConfirm).toBeUndefined(); // passwordConfirm should not be saved
    });

    test('fails to create user without required fields', async () => {
      const invalidUser = {
        name: 'Test User'
      };

      await expect(User.create(invalidUser)).rejects.toThrow(mongoose.Error.ValidationError);
    });

    test('fails to create user with invalid email', async () => {
      const invalidUser = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
        passwordConfirm: 'password123'
      };

      await expect(User.create(invalidUser)).rejects.toThrow(mongoose.Error.ValidationError);
    });

    test('fails to create user with non-matching passwords', async () => {
      const invalidUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'different123'
      };

      await expect(User.create(invalidUser)).rejects.toThrow(mongoose.Error.ValidationError);
    });

    test('fails to create user with duplicate email', async () => {
      const user = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123'
      };

      await User.create(user);
      await expect(User.create(user)).rejects.toThrow(mongoose.Error.MongoServerError);
    });

    test('fails to create user with invalid password format', async () => {
      const invalidUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123', // Missing uppercase and special character
        passwordConfirm: 'password123'
      };

      await expect(User.create(invalidUser)).rejects.toThrow(mongoose.Error.ValidationError);
    });

    test('fails to create user with password missing uppercase letter', async () => {
      const invalidUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'test@123',
        passwordConfirm: 'test@123'
      };

      await expect(User.create(invalidUser)).rejects.toThrow(mongoose.Error.ValidationError);
    });

    test('fails to create user with password missing special character', async () => {
      const invalidUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123',
        passwordConfirm: 'Test123'
      };

      await expect(User.create(invalidUser)).rejects.toThrow(mongoose.Error.ValidationError);
    });

    test('fails to create user with password missing number', async () => {
      const invalidUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@abc',
        passwordConfirm: 'Test@abc'
      };

      await expect(User.create(invalidUser)).rejects.toThrow(mongoose.Error.ValidationError);
    });
  });

  describe('Methods', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        passwordConfirm: 'Test@123'
      });
    });

    test('correctly compares passwords', async () => {
      const isMatch = await user.correctPassword('password123', user.password);
      expect(isMatch).toBe(true);

      const isNotMatch = await user.correctPassword('wrong123', user.password);
      expect(isNotMatch).toBe(false);
    });

    test('checks if password was changed after token issued', () => {
      const tokenTimestamp = new Date(Date.now() - 1000).getTime() / 1000;
      expect(user.changedPasswordAfter(tokenTimestamp)).toBe(false);
    });

    test('generates password reset token', () => {
      const resetToken = user.createPasswordResetToken();
      expect(resetToken).toBeDefined();
      expect(user.passwordResetToken).toBeDefined();
      expect(user.passwordResetExpires).toBeDefined();
      expect(user.passwordResetExpires > Date.now()).toBe(true);
    });
  });

  describe('Middleware', () => {
    test('hashes password before save', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123'
      });

      expect(await bcrypt.compare('password123', user.password)).toBe(true);
    });

    test('does not rehash password if not modified', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123'
      });

      const originalPassword = user.password;
      user.name = 'Updated Name';
      await user.save();

      expect(user.password).toBe(originalPassword);
    });

    test('updates passwordChangedAt when password is modified', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123'
      });

      const originalPasswordChangedAt = user.passwordChangedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1000));

      user.password = 'newpassword123';
      user.passwordConfirm = 'newpassword123';
      await user.save();

      expect(user.passwordChangedAt).toBeDefined();
      expect(user.passwordChangedAt).not.toEqual(originalPasswordChangedAt);
    });
  });

  describe('Query Middleware', () => {
    beforeEach(async () => {
      await User.create([
        {
          name: 'Active User',
          email: 'active@example.com',
          password: 'password123',
          passwordConfirm: 'password123',
          active: true
        },
        {
          name: 'Inactive User',
          email: 'inactive@example.com',
          password: 'password123',
          passwordConfirm: 'password123',
          active: false
        }
      ]);
    });

    test('only finds active users', async () => {
      const users = await User.find();
      expect(users.length).toBe(1);
      expect(users[0].active).toBe(true);
    });

    test('finds all users when explicitly querying for active:false', async () => {
      const users = await User.find({ active: false });
      expect(users.length).toBe(1);
      expect(users[0].active).toBe(false);
    });
  });

  describe('Instance Methods', () => {
    test('deactivates user account', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123'
      });

      await user.deactivate();
      expect(user.active).toBe(false);

      const foundUser = await User.findOne({ email: 'test@example.com' });
      expect(foundUser).toBeNull(); // should not be found due to active:false
    });

    test('reactivates user account', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
        active: false
      });

      await user.reactivate();
      expect(user.active).toBe(true);

      const foundUser = await User.findOne({ email: 'test@example.com' });
      expect(foundUser).toBeDefined();
      expect(foundUser.active).toBe(true);
    });
  });
}); 