import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state zodat de volgende render de fallback UI zal tonen
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Je kunt de error ook loggen naar een error reporting service
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Je kunt elke custom fallback UI renderen
      return (
        <div className="error-boundary">
          <h2>Er is iets misgegaan.</h2>
          {this.props.showDetails && (
            <div>
              <p>{this.state.error && this.state.error.toString()}</p>
              <div>
                <details style={{ whiteSpace: 'pre-wrap' }}>
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </details>
              </div>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 