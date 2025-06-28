import React from 'react';
import { render, screen } from '../test-utils';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('renders with custom size', () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('w-8 h-8'); // Assuming lg size maps to these dimensions
  });

  it('renders with custom color', () => {
    render(<LoadingSpinner color="red" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('text-red-500'); // Assuming color prop maps to text color
  });

  it('renders with custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('custom-class');
  });
}); 