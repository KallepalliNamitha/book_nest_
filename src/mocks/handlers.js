import { http, HttpResponse } from 'msw';

// Mock user data
const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
};

// Mock book data
const mockBooks = [
  {
    id: '1',
    title: 'Test Book 1',
    author: 'Test Author 1',
    price: 29.99,
    stock: 10,
    imageUrl: 'test-image-1.jpg',
  },
  {
    id: '2',
    title: 'Test Book 2',
    author: 'Test Author 2',
    price: 19.99,
    stock: 5,
    imageUrl: 'test-image-2.jpg',
  },
];

export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json();
    if (email === 'test@example.com' && password === 'password') {
      return HttpResponse.json({
        user: mockUser,
        token: 'mock-token',
      });
    }
    return new HttpResponse(null, {
      status: 401,
      statusText: 'Unauthorized',
    });
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({
      user: { ...mockUser, ...data },
      token: 'mock-token',
    });
  }),

  // Book endpoints
  http.get('/api/books', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return HttpResponse.json({
      books: mockBooks.slice(start, end),
      total: mockBooks.length,
      page,
      totalPages: Math.ceil(mockBooks.length / limit),
    });
  }),

  http.get('/api/books/:id', ({ params }) => {
    const book = mockBooks.find(b => b.id === params.id);
    if (book) {
      return HttpResponse.json(book);
    }
    return new HttpResponse(null, {
      status: 404,
      statusText: 'Not Found',
    });
  }),

  // Order endpoints
  http.post('/api/orders', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({
      id: '1',
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }),

  // Profile endpoints
  http.get('/api/profile', () => {
    return HttpResponse.json(mockUser);
  }),

  http.put('/api/profile', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({
      ...mockUser,
      ...data,
    });
  }),
]; 