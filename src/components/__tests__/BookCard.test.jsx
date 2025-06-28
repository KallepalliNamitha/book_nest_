import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BookCard from '../BookCard';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

// Mock the context hooks
jest.mock('../../context/AuthContext');
jest.mock('../../context/NotificationContext');

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('BookCard', () => {
  const mockBook = {
    _id: '123',
    title: 'Test Book',
    author: 'Test Author',
    description: 'Test Description',
    price: 29.99,
    imageUrl: 'test-image.jpg',
    category: 'Fiction',
    rating: 4.5,
    stock: 10
  };

  const mockUser = {
    id: 'user123',
    role: 'user'
  };

  beforeEach(() => {
    useAuth.mockImplementation(() => ({
      user: mockUser,
      isAuthenticated: true
    }));

    useNotification.mockImplementation(() => ({
      showNotification: jest.fn()
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderBookCard = (props = {}) => {
    return render(
      <BrowserRouter>
        <BookCard book={mockBook} {...props} />
      </BrowserRouter>
    );
  };

  test('renders book information correctly', () => {
    renderBookCard();

    expect(screen.getByText(mockBook.title)).toBeInTheDocument();
    expect(screen.getByText(mockBook.author)).toBeInTheDocument();
    expect(screen.getByText(`$${mockBook.price}`)).toBeInTheDocument();
    expect(screen.getByText(mockBook.category)).toBeInTheDocument();
    expect(screen.getByText(mockBook.rating.toString())).toBeInTheDocument();
    expect(screen.getByAltText(mockBook.title)).toHaveAttribute('src', mockBook.imageUrl);
  });

  test('truncates long descriptions', () => {
    const longDescription = 'A'.repeat(200);
    const bookWithLongDesc = { ...mockBook, description: longDescription };
    
    renderBookCard({ book: bookWithLongDesc });

    const displayedDescription = screen.getByText(/A+/);
    expect(displayedDescription.textContent.length).toBeLessThan(longDescription.length);
    expect(displayedDescription.textContent).toMatch(/\.\.\.$/);
  });

  test('shows "Out of Stock" when stock is 0', () => {
    const outOfStockBook = { ...mockBook, stock: 0 };
    renderBookCard({ book: outOfStockBook });

    expect(screen.getByText(/Out of Stock/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeDisabled();
  });

  test('shows "Low Stock" warning when stock is below threshold', () => {
    const lowStockBook = { ...mockBook, stock: 3 };
    renderBookCard({ book: lowStockBook });

    expect(screen.getByText(/Only \d+ left/i)).toBeInTheDocument();
  });

  test('navigates to book details page when clicked', () => {
    renderBookCard();

    const bookTitle = screen.getByText(mockBook.title);
    fireEvent.click(bookTitle);

    expect(mockNavigate).toHaveBeenCalledWith(`/books/${mockBook._id}`);
  });

  test('shows edit button for admin users', () => {
    useAuth.mockImplementation(() => ({
      user: { ...mockUser, role: 'admin' },
      isAuthenticated: true
    }));

    renderBookCard();

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  test('hides edit button for regular users', () => {
    renderBookCard();

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });

  test('displays sale price when available', () => {
    const bookWithSale = {
      ...mockBook,
      salePrice: 19.99,
      onSale: true
    };

    renderBookCard({ book: bookWithSale });

    expect(screen.getByText(`$${bookWithSale.salePrice}`)).toBeInTheDocument();
    expect(screen.getByText(`$${mockBook.price}`, { exact: false })).toHaveStyle({
      textDecoration: 'line-through'
    });
  });

  test('shows rating stars correctly', () => {
    renderBookCard();

    const stars = screen.getAllByTestId('rating-star');
    const fullStars = stars.filter(star => star.classList.contains('filled'));
    expect(fullStars.length).toBe(Math.floor(mockBook.rating));
  });

  test('handles missing image URL gracefully', () => {
    const bookWithoutImage = { ...mockBook, imageUrl: null };
    renderBookCard({ book: bookWithoutImage });

    const image = screen.getByAltText(bookWithoutImage.title);
    expect(image).toHaveAttribute('src', expect.stringContaining('placeholder'));
  });

  test('displays category badge with correct styling', () => {
    renderBookCard();

    const categoryBadge = screen.getByText(mockBook.category);
    expect(categoryBadge).toHaveClass('badge');
  });
}); 