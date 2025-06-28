import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BookCard from '../BookCard';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

// Mock the useAuth hook
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock the useNotifications hook
jest.mock('../../context/NotificationContext', () => ({
  useNotifications: jest.fn()
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

const mockBook = {
  _id: '123',
  title: 'Test Book',
  author: 'Test Author',
  price: 29.99,
  description: 'A test book description',
  coverImage: 'test-image.jpg',
  rating: 4.5,
  reviews: [
    { rating: 4, text: 'Great book!' },
    { rating: 5, text: 'Excellent read!' }
  ]
};

describe('BookCard Component', () => {
  beforeEach(() => {
    // Mock the useAuth hook implementation
    useAuth.mockImplementation(() => ({
      user: null,
      isAuthenticated: false,
      cart: [],
      addToCart: jest.fn()
    }));

    // Reset all mocks before each test
    useNotifications.mockImplementation(() => ({
      addNotification: jest.fn()
    }));
  });

  test('renders book information correctly', () => {
    render(
      <MemoryRouter>
        <BookCard book={mockBook} />
      </MemoryRouter>
    );

    expect(screen.getByText(mockBook.title)).toBeInTheDocument();
    expect(screen.getByText(/by/i)).toBeInTheDocument();
    expect(screen.getByText(mockBook.author, { exact: false })).toBeInTheDocument();
    expect(screen.getByText('₹29.99')).toBeInTheDocument();
    expect(screen.getByAltText(mockBook.title)).toBeInTheDocument();
  });

  test('displays review count correctly', () => {
    render(
      <MemoryRouter>
        <BookCard book={mockBook} />
      </MemoryRouter>
    );
    expect(screen.getByText('(0)')).toBeInTheDocument();
  });

  test('shows add to cart button when user is authenticated', () => {
    useAuth.mockImplementation(() => ({
      user: { _id: '123', name: 'Test User' },
      isAuthenticated: true,
      cart: [],
      addToCart: jest.fn()
    }));

    render(
      <MemoryRouter>
        <BookCard book={mockBook} />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
  });

  test('handles add to cart click', () => {
    const mockAddToCart = jest.fn();
    useAuth.mockImplementation(() => ({
      user: { _id: '123', name: 'Test User' },
      isAuthenticated: true,
      cart: [],
      addToCart: mockAddToCart
    }));

    render(
      <MemoryRouter>
        <BookCard book={mockBook} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    expect(mockAddToCart).toHaveBeenCalledWith(mockBook);
  });

  test('shows wishlist button', () => {
    render(
      <MemoryRouter>
        <BookCard book={mockBook} />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: '♡' })).toBeInTheDocument();
  });

  it('calls addToCart when Add to Cart button is clicked', () => {
    const mockAddToCart = jest.fn();

    render(
      <MemoryRouter>
        <BookCard book={mockBook} onAddToCart={mockAddToCart} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/add to cart/i));
    expect(mockAddToCart).toHaveBeenCalledWith(mockBook);
  });

  it('navigates to book details when View Details is clicked', () => {
    render(
      <MemoryRouter>
        <BookCard book={mockBook} />
      </MemoryRouter>
    );

    const detailsLink = screen.getByText(/view details/i);
    expect(detailsLink.getAttribute('href')).toBe(`/book/${mockBook._id}`);
  });
}); 