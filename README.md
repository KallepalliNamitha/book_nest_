# Book Nest 📚

<div align="center">

![Book Nest Logo](code/Frontend/src/assets/default-book-cover.png)

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-darkgreen.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

*A modern, full-stack e-commerce platform for book lovers* 🌟

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [API Documentation](#api-documentation) • [Contributing](#contributing)

</div>

## 🌟 Features

### 📱 For Customers
- **Browse & Search** - Find books by title, author, genre, or keywords
- **Smart Filters** - Filter books by price range, ratings, and availability
- **Personalized Experience** - Get book recommendations based on interests
- **Secure Shopping** - Safe checkout process with multiple payment options
- **Order Tracking** - Real-time updates on order status
- **Reviews & Ratings** - Share experiences and read others' reviews
- **Wishlist** - Save books for later purchase

### 💼 For Sellers
- **Dashboard Analytics** - Track sales, revenue, and inventory
- **Inventory Management** - Add, update, and manage book listings
- **Order Processing** - Manage orders and update shipping status
- **Sales Reports** - Generate detailed sales and performance reports
- **Customer Insights** - Access customer feedback and preferences
- **Real-time Notifications** - Get instant alerts for new orders

### 👑 For Administrators
- **User Management** - Monitor and manage user accounts
- **Platform Analytics** - Track overall platform performance
- **Content Moderation** - Review and moderate user content
- **System Settings** - Configure platform settings and features
- **Security Controls** - Manage access and security settings

## 🛠️ Tech Stack

### Frontend Technologies
\`\`\`
📱 Core:
- React 18 with Vite
- React Router v6
- Context API for state management

🎨 Styling:
- Tailwind CSS
- React Bootstrap
- CSS Modules

📡 Data Handling:
- Axios for API requests
- React Query for caching
- WebSocket for real-time features

🔒 Security:
- JWT authentication
- Role-based access control
\`\`\`

### Backend Technologies
\`\`\`
🏗️ Core:
- Node.js & Express.js
- MongoDB with Mongoose
- WebSocket Server

🔒 Security:
- JWT authentication
- Helmet for headers
- Rate limiting
- XSS protection

📦 Features:
- Multer for file uploads
- Winston for logging
- Nodemailer for emails
\`\`\`

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- npm or yarn
- Git

### Installation Steps

1. **Clone the Repository**
   \`\`\`bash
   git clone https://github.com/yourusername/book_nest.git
   cd book_nest
   \`\`\`

2. **Install Dependencies**
   \`\`\`bash
   # Install all dependencies
   npm run install:all
   \`\`\`

3. **Configure Environment**
   
   Create \`.env\` files in both frontend and backend directories:

   Backend (\`/code/Backend/.env\`):
   \`\`\`env
   PORT=5001
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   \`\`\`

   Frontend (\`/code/Frontend/.env\`):
   \`\`\`env
   VITE_API_URL=http://localhost:5001
   \`\`\`

4. **Start Development Servers**
   \`\`\`bash
   # Start backend server
   npm run dev:backend

   # In a new terminal, start frontend server
   npm run dev:frontend
   \`\`\`

5. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001
   - API Docs: http://localhost:5001/api-docs

## 📚 API Documentation

### Authentication Endpoints
\`\`\`http
POST /api/auth/login          # User login
POST /api/auth/register      # User registration
POST /api/auth/refresh      # Refresh token
POST /api/auth/logout       # Logout user
\`\`\`

### Book Endpoints
\`\`\`http
GET    /api/books           # Get all books
GET    /api/books/:id      # Get single book
POST   /api/books         # Create book (Seller only)
PUT    /api/books/:id    # Update book (Seller only)
DELETE /api/books/:id   # Delete book (Seller/Admin)
\`\`\`

### Order Endpoints
\`\`\`http
GET    /api/orders          # Get user orders
POST   /api/orders         # Create order
GET    /api/orders/:id    # Get order details
PATCH  /api/orders/:id   # Update order status
\`\`\`

## 🧪 Testing

Run tests using these commands:

\`\`\`bash
# Backend tests
npm run test:backend

# Frontend tests
npm run test:frontend

# Test coverage
npm run test:coverage
\`\`\`

## 🔒 Security Features

- ✅ JWT based authentication
- ✅ Rate limiting for API protection
- ✅ XSS protection
- ✅ Security headers with Helmet
- ✅ MongoDB query sanitization
- ✅ File upload validation
- ✅ Password hashing
- ✅ CORS configuration

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- All our amazing contributors
- The open-source community
- Book lovers everywhere!

---

<div align="center">
Made with ❤️ by the Book Nest Team

[⬆ Back to Top](#book-nest-)
</div> 