import { http, HttpResponse } from 'msw';

// Mock user data
const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user'
};

// Mock book data
const mockBooks = [
  {
    _id: 'book1',
    title: 'Test Book 1',
    author: 'Test Author 1',
    description: 'Test Description 1',
    price: 29.99,
    imageUrl: 'test-image-1.jpg',
    category: 'Fiction',
    rating: 4.5,
    stock: 10
  },
  {
    _id: 'book2',
    title: 'Test Book 2',
    author: 'Test Author 2',
    description: 'Test Description 2',
    price: 19.99,
    imageUrl: 'test-image-2.jpg',
    category: 'Non-Fiction',
    rating: 4.0,
    stock: 5
  }
];

// Mock order data
const mockOrders = [
  {
    _id: 'order1',
    user: mockUser.id,
    books: [{ book: mockBooks[0]._id, quantity: 2 }],
    totalAmount: 59.98,
    status: 'pending',
    createdAt: new Date().toISOString()
  }
];

export const handlers = [
  // Auth endpoints
  http.post('/api/v1/auth/login', () => {
    return HttpResponse.json({
      status: 'success',
      token: 'test-token',
      data: mockUser
    });
  }),

  http.post('/api/v1/auth/register', () => {
    return HttpResponse.json({
      status: 'success',
      token: 'test-token',
      data: mockUser
    });
  }),

  http.get('/api/v1/auth/me', () => {
    return HttpResponse.json({
      status: 'success',
      data: mockUser
    });
  }),

  http.patch('/api/v1/auth/updateMe', () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        ...mockUser,
        name: 'Updated Name'
      }
    });
  }),

  // Books endpoints
  http.get('/api/v1/books', () => {
    return HttpResponse.json({
      status: 'success',
      results: mockBooks.length,
      data: mockBooks
    });
  }),

  http.get('/api/v1/books/:id', ({ params }) => {
    const book = mockBooks.find(b => b._id === params.id);
    if (!book) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({
      status: 'success',
      data: book
    });
  }),

  http.post('/api/v1/books', async ({ request }) => {
    const newBook = await request.json();
    return HttpResponse.json({
      status: 'success',
      data: {
        _id: 'new-book-id',
        ...newBook
      }
    });
  }),

  http.patch('/api/v1/books/:id', async ({ params, request }) => {
    const updates = await request.json();
    const book = mockBooks.find(b => b._id === params.id);
    if (!book) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({
      status: 'success',
      data: {
        ...book,
        ...updates
      }
    });
  }),

  http.delete('/api/v1/books/:id', ({ params }) => {
    const book = mockBooks.find(b => b._id === params.id);
    if (!book) {
      return new HttpResponse(null, { status: 404 });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // Orders endpoints
  http.get('/api/v1/orders', () => {
    return HttpResponse.json({
      status: 'success',
      results: mockOrders.length,
      data: mockOrders
    });
  }),

  http.get('/api/v1/orders/:id', ({ params }) => {
    const order = mockOrders.find(o => o._id === params.id);
    if (!order) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({
      status: 'success',
      data: order
    });
  }),

  http.post('/api/v1/orders', async ({ request }) => {
    const newOrder = await request.json();
    return HttpResponse.json({
      status: 'success',
      data: {
        _id: 'new-order-id',
        ...newOrder,
        createdAt: new Date().toISOString()
      }
    });
  }),

  http.patch('/api/v1/orders/:id', async ({ params, request }) => {
    const updates = await request.json();
    const order = mockOrders.find(o => o._id === params.id);
    if (!order) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({
      status: 'success',
      data: {
        ...order,
        ...updates
      }
    });
  }),

  // Error handlers
  http.get('/api/v1/error/unauthorized', () => {
    return new HttpResponse(
      JSON.stringify({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.'
      }),
      { status: 401 }
    );
  }),

  http.get('/api/v1/error/forbidden', () => {
    return new HttpResponse(
      JSON.stringify({
        status: 'fail',
        message: 'You do not have permission to perform this action'
      }),
      { status: 403 }
    );
  }),

  http.get('/api/v1/error/notfound', () => {
    return new HttpResponse(
      JSON.stringify({
        status: 'fail',
        message: 'Resource not found'
      }),
      { status: 404 }
    );
  }),

  http.get('/api/v1/error/server', () => {
    return new HttpResponse(
      JSON.stringify({
        status: 'error',
        message: 'Something went wrong!'
      }),
      { status: 500 }
    );
  })
]; 