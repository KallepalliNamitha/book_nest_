# Book Nest 📚

Book Nest is a full-stack e-commerce platform for buying and selling books. It features a modern, responsive interface and supports multiple user roles including customers, sellers, and administrators.

## Features 🌟

### For Customers
- Browse and search books by title, author, or genre
- View detailed book information and reviews
- Add books to cart and wishlist
- Secure checkout process
- Track order status
- Write and manage reviews
- User profile management

### For Sellers
- Manage book inventory
- Add new books with details and images
- Track sales and orders
- View analytics dashboard
- Manage product listings
- Real-time order notifications

### For Administrators
- User management (customers and sellers)
- Monitor all transactions
- View platform analytics
- Manage content and categories
- System configuration

## Technology Stack 🛠️

### Frontend
- React 18 with Vite
- React Router for navigation
- React Bootstrap & Tailwind CSS for styling
- Axios for API requests
- JWT for authentication
- Recharts for analytics
- React Hot Toast for notifications
- Jest & React Testing Library for testing

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT for authentication
- WebSocket for real-time notifications
- Multer for file uploads
- Express Rate Limiter for API protection
- Helmet for security headers
- Winston for logging
- Jest & Supertest for testing

## Prerequisites 📋

- Node.js 16 or higher
- MongoDB 4.4 or higher
- npm or yarn
- Git

## Installation 🚀

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/book_nest.git
   cd book_nest/code/Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file:
   ```
   PORT=5001
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   ```

4. Run the server:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file:
   ```
   VITE_API_URL=http://localhost:5001
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Testing 🧪

### Backend Tests
```bash
cd Backend
npm test
# For coverage report
npm run test:coverage
```

### Frontend Tests
```bash
cd Frontend
npm test
```

## API Documentation 📖

### Authentication Endpoints
- POST /api/auth/login - User login
- POST /api/auth/register - User registration
- POST /api/admin/login - Admin login
- POST /api/seller/login - Seller login

### Book Endpoints
- GET /api/books - Get all books
- GET /api/books/:id - Get book details
- POST /api/books - Add new book (seller only)
- PUT /api/books/:id - Update book (seller only)
- DELETE /api/books/:id - Delete book (seller/admin only)

### Order Endpoints
- GET /api/orders - Get user orders
- POST /api/orders - Create new order
- GET /api/orders/:id - Get order details
- PATCH /api/orders/:id/status - Update order status

## Security Features 🔒

- JWT based authentication
- Rate limiting for API protection
- XSS protection
- Security headers with Helmet
- MongoDB query sanitization
- File upload validation
- Password hashing with bcrypt
- CORS configuration

## Contributing 🤝

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments 🙏

- All contributors and testers
- Open source community
- Book lovers everywhere! 