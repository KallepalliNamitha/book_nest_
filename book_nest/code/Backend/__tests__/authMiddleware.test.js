const jwt = require('jsonwebtoken');
const { protect, restrictTo } = require('../middleware/auth');
const User = require('../models/userModel');

jest.mock('../models/userModel');

describe('Auth Middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockReq = {
            headers: {},
            header: jest.fn()
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
    });

    describe('protect', () => {
        it('should return 401 if no token is provided', async () => {
            mockReq.headers.authorization = undefined;
            await protect(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 401,
                message: 'You are not logged in! Please log in to get access.'
            }));
        });

        it('should verify token and set user on request', async () => {
            const user = { id: '123', role: 'user' };
            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-book-nest-app');
            mockReq.headers.authorization = `Bearer ${token}`;
            User.findById.mockResolvedValue(user);

            await protect(mockReq, mockRes, mockNext);
            expect(mockReq.user).toEqual(user);
            expect(mockNext).toHaveBeenCalled();
        });

        it('should handle invalid tokens', async () => {
            mockReq.headers.authorization = 'Bearer invalid-token';
            await protect(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 401,
                message: 'Invalid token. Please log in again!'
            }));
        });
    });

    describe('restrictTo', () => {
        it('should allow access for authorized roles', () => {
            const restrictToMiddleware = restrictTo('admin');
            mockReq.user = { role: 'admin' };
            restrictToMiddleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });

        it('should deny access for unauthorized roles', () => {
            const restrictToMiddleware = restrictTo('admin');
            mockReq.user = { role: 'user' };
            restrictToMiddleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 403,
                message: 'You do not have permission to perform this action'
            }));
        });
    });
}); 