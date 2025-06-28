import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  test('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('spinner-border');
    expect(spinner).toHaveStyle({
      width: '2rem',
      height: '2rem'
    });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders with small size', () => {
    render(<LoadingSpinner size="sm" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('spinner-border-sm');
    expect(spinner).toHaveStyle({
      width: '1rem',
      height: '1rem'
    });
  });

  test('renders with large size', () => {
    render(<LoadingSpinner size="lg" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveStyle({
      width: '3rem',
      height: '3rem'
    });
  });

  test('renders with custom color', () => {
    render(<LoadingSpinner color="danger" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('text-danger');
  });

  test('renders with custom text', () => {
    const customText = 'Please wait...';
    render(<LoadingSpinner text={customText} />);
    
    expect(screen.getByText(customText)).toBeInTheDocument();
  });

  test('renders without text when hideText is true', () => {
    render(<LoadingSpinner hideText />);
    
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  test('renders with custom className', () => {
    const customClass = 'custom-spinner';
    render(<LoadingSpinner className={customClass} />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass(customClass);
  });

  test('renders with custom style', () => {
    const customStyle = { margin: '10px' };
    render(<LoadingSpinner style={customStyle} />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveStyle(customStyle);
  });

  test('renders with centered alignment', () => {
    render(<LoadingSpinner centered />);
    
    const container = screen.getByTestId('spinner-container');
    expect(container).toHaveClass('d-flex', 'justify-content-center');
  });

  test('renders with fullscreen overlay', () => {
    render(<LoadingSpinner fullscreen />);
    
    const overlay = screen.getByTestId('spinner-overlay');
    expect(overlay).toHaveClass('position-fixed');
    expect(overlay).toHaveStyle({
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      zIndex: 9999
    });
  });

  test('renders with custom animation type', () => {
    render(<LoadingSpinner type="grow" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('spinner-grow');
  });

  test('renders with aria-label', () => {
    const ariaLabel = 'Content is loading';
    render(<LoadingSpinner ariaLabel={ariaLabel} />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', ariaLabel);
  });
}); 