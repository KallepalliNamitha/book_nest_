import React from 'react';
import { Alert, Button, Container } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container className="py-5">
          <Alert variant="danger">
            <Alert.Heading>Oops! Something went wrong</Alert.Heading>
            <p>
              We're sorry, but an error occurred while rendering this page.
              Our team has been notified and is working to fix the issue.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-3">
                <details style={{ whiteSpace: 'pre-wrap' }}>
                  <summary>Error Details</summary>
                  <p>{this.state.error.toString()}</p>
                  <p>Component Stack:</p>
                  <pre>{this.state.errorInfo?.componentStack}</pre>
                </details>
              </div>
            )}
            <hr />
            <div className="d-flex gap-2">
              <Button variant="primary" onClick={this.handleRetry}>
                Retry
              </Button>
              <Button variant="secondary" onClick={() => window.location.href = '/'}>
                Go to Home
              </Button>
            </div>
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 