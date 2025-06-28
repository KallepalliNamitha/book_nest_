const { AppError, errorHandler } = require('../middleware/errorHandler');
const winston = require('winston');

// Mock winston logger
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    error: jest.fn()
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    json: jest.fn(),
    simple: jest.fn()
  },
  transports: {
    File: jest.fn(),
    Console: jest.fn()
  }
}));

describe('Error Handler Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    process.env.NODE_ENV = 'production'; // Set to production by default
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates AppError with correct properties', () => {
    const error = new AppError('Test error', 400);
    expect(error.statusCode).toBe(400);
    expect(error.status).toBe('fail');
    expect(error.message).toBe('Test error');
    expect(error.isOperational).toBe(true);
  });

  it('handles operational errors in development', () => {
    process.env.NODE_ENV = 'development';
    const error = new AppError('Test error', 400);
    errorHandler(error, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'fail',
      message: 'Test error',
      error: expect.any(Object),
      stack: expect.any(String)
    }));
  });

  it('handles operational errors in production', () => {
    const error = new AppError('Test error', 400);
    errorHandler(error, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'fail',
      message: 'Test error'
    });
  });

  it('handles programming errors in production', () => {
    const error = new Error('Programming error');
    errorHandler(error, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Something went wrong! Please try again later.'
    });
  });

  it('handles mongoose CastError', () => {
    const error = new Error('Cast Error');
    error.name = 'CastError';
    error.path = 'id';
    error.value = 'invalid-id';
    
    errorHandler(error, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json.mock.calls[0][0].message).toContain('Invalid id: invalid-id');
  });

  it('handles mongoose duplicate field error', () => {
    const error = new Error('Duplicate field');
    error.code = 11000;
    error.keyValue = { email: 'test@test.com' };
    
    errorHandler(error, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json.mock.calls[0][0].message).toContain('Duplicate field value');
  });

  it('handles mongoose validation error', () => {
    const error = new Error('Validation Error');
    error.name = 'ValidationError';
    error.errors = {
      name: { message: 'Name is required' },
      email: { message: 'Email is invalid' }
    };
    
    errorHandler(error, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json.mock.calls[0][0].message).toContain('Name is required');
    expect(mockRes.json.mock.calls[0][0].message).toContain('Email is invalid');
  });

  it('handles JWT error', () => {
    const error = new Error('JWT Error');
    error.name = 'JsonWebTokenError';
    
    errorHandler(error, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json.mock.calls[0][0].message).toBe('Invalid token. Please log in again!');
  });

  it('handles JWT expired error', () => {
    const error = new Error('JWT Expired');
    error.name = 'TokenExpiredError';
    
    errorHandler(error, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json.mock.calls[0][0].message).toBe('Your token has expired! Please log in again.');
  });
}); 