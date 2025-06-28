import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner Component', () => {
  test('renders with default size', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('spinner-border');
  });

  test('renders with small size', () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('spinner-border-sm');
  });

  test('renders with large size', () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('spinner-border-lg');
  });

  test('renders with custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('custom-class');
  });

  test('renders with custom style', () => {
    const customStyle = { color: 'red' };
    render(<LoadingSpinner style={customStyle} />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveStyle(customStyle);
  });

  test('renders with screen reader text', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders with custom screen reader text', () => {
    render(<LoadingSpinner srText="Please wait" />);
    expect(screen.getByText('Please wait')).toBeInTheDocument();
  });
}); 