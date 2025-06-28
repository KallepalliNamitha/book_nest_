const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Book = require('../models/bookModel');
const User = require('../models/userModel');
const { generateToken } = require('../middleware/auth');

describe('Book API Endpoints', () => {
    let testUser;
    let testToken;
    let testBook;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booknest_test', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Create a test user
        testUser = await User.create({
            name: 'Test Seller',
            email: 'testseller@test.com',
            password: 'password123',
            role: 'seller'
        });

        testToken = generateToken(testUser, 'seller');

        // Create a test book
        testBook = await Book.create({
            title: 'Test Book',
            author: 'Test Author',
            description: 'Test Description',
            price: 29.99,
            genre: 'Fiction',
            seller: testUser._id,
            stock: 10
        });
    });

    afterAll(async () => {
        // Clean up test data
        await Book.deleteMany({});
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    describe('GET /api/books', () => {
        it('should return all books', async () => {
            const res = await request(app)
                .get('/api/books')
                .expect(200);

            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0]).toHaveProperty('title', 'Test Book');
        });

        it('should filter books by genre', async () => {
            const res = await request(app)
                .get('/api/books?genre=Fiction')
                .expect(200);

            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body[0].genre).toBe('Fiction');
        });
    });

    describe('GET /api/books/:id', () => {
        it('should return a single book', async () => {
            const res = await request(app)
                .get(`/api/books/${testBook._id}`)
                .expect(200);

            expect(res.body).toHaveProperty('title', 'Test Book');
            expect(res.body).toHaveProperty('author', 'Test Author');
        });

        it('should return 404 for non-existent book', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            await request(app)
                .get(`/api/books/${fakeId}`)
                .expect(404);
        });
    });

    describe('POST /api/books', () => {
        it('should create a new book', async () => {
            const newBook = {
                title: 'New Test Book',
                author: 'New Author',
                description: 'New Description',
                price: 19.99,
                genre: 'Non-Fiction',
                stock: 5
            };

            const res = await request(app)
                .post('/api/books')
                .set('Authorization', `Bearer ${testToken}`)
                .field(newBook)
                .expect(201);

            expect(res.body).toHaveProperty('title', 'New Test Book');
            expect(res.body).toHaveProperty('seller', testUser._id.toString());
        });

        it('should not create book without authentication', async () => {
            const newBook = {
                title: 'Another Test Book',
                author: 'Another Author',
                description: 'Another Description',
                price: 24.99,
                genre: 'Mystery',
                stock: 3
            };

            await request(app)
                .post('/api/books')
                .field(newBook)
                .expect(401);
        });
    });

    describe('PUT /api/books/:id', () => {
        it('should update a book', async () => {
            const updates = {
                title: 'Updated Test Book',
                price: 34.99
            };

            const res = await request(app)
                .put(`/api/books/${testBook._id}`)
                .set('Authorization', `Bearer ${testToken}`)
                .send(updates)
                .expect(200);

            expect(res.body).toHaveProperty('title', 'Updated Test Book');
            expect(res.body).toHaveProperty('price', 34.99);
        });

        it('should not update book without authentication', async () => {
            const updates = {
                title: 'Unauthorized Update'
            };

            await request(app)
                .put(`/api/books/${testBook._id}`)
                .send(updates)
                .expect(401);
        });
    });

    describe('DELETE /api/books/:id', () => {
        it('should delete a book', async () => {
            await request(app)
                .delete(`/api/books/${testBook._id}`)
                .set('Authorization', `Bearer ${testToken}`)
                .expect(200);

            const deletedBook = await Book.findById(testBook._id);
            expect(deletedBook).toBeNull();
        });

        it('should not delete book without authentication', async () => {
            await request(app)
                .delete(`/api/books/${testBook._id}`)
                .expect(401);
        });
    });
}); 