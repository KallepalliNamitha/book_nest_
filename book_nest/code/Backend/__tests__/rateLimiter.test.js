const rateLimit = require('express-rate-limit');
const { rateLimiter, authRateLimiter } = require('../middleware/rateLimiter');

// Mock express-rate-limit
jest.mock('express-rate-limit', () => {
  return jest.fn().mockImplementation((options) => {
    return (req, res, next) => {
      if (req.simulateRateLimit) {
        return res.status(429).json({
          status: 'error',
          message: 'Too many requests from this IP, please try again later.'
        });
      }
      next();
    };
  });
});

describe('Rate Limiter Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
      simulateRateLimit: false
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('General Rate Limiter', () => {
    it('initializes with correct options', () => {
      expect(rateLimit).toHaveBeenCalledWith({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 500,
        message: 'Too many requests from this IP, please try again in 15 minutes',
        standardHeaders: true,
        legacyHeaders: false
      });
    });

    it('has appropriate window size', () => {
      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: 15 * 60 * 1000 // 15 minutes
        })
      );
    });

    it('has appropriate max requests', () => {
      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          max: 500
        })
      );
    });
  });

  describe('Auth Rate Limiter', () => {
    it('initializes with correct options', () => {
      expect(rateLimit).toHaveBeenCalledWith({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 50,
        message: 'Too many authentication attempts, please try again in 1 hour',
        standardHeaders: true,
        legacyHeaders: false
      });
    });

    it('has stricter window size', () => {
      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: 60 * 60 * 1000 // 1 hour
        })
      );
    });

    it('has stricter max requests', () => {
      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          max: 50
        })
      );
    });
  });

  it('uses standard headers and disables legacy headers', () => {
    expect(rateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        standardHeaders: true,
        legacyHeaders: false
      })
    );
  });

  test('allows requests within rate limit', () => {
    rateLimiter(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  test('blocks requests that exceed rate limit', () => {
    mockReq.simulateRateLimit = true;
    rateLimiter(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Too many requests from this IP, please try again later.'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('rate limiter is configured with appropriate window size', () => {
    expect(rateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        windowMs: 15 * 60 * 1000 // 15 minutes
      })
    );
  });

  test('rate limiter is configured with appropriate max requests', () => {
    expect(rateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        max: 100 // Maximum 100 requests per windowMs
      })
    );
  });

  test('rate limiter includes standardHeaders and disables legacyHeaders', () => {
    expect(rateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        standardHeaders: true,
        legacyHeaders: false
      })
    );
  });
}); 