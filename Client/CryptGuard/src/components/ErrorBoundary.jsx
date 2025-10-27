// Client/CryptGuard/src/components/ErrorBoundary.jsx
import React from 'react';
import { Card } from './ui/Card';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1
    });

    // You can also log the error to an error reporting service
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4">
          <Card className="max-w-2xl w-full">
            <div className="text-center space-y-6">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-red-600 text-3xl"></i>
                </div>
              </div>

              {/* Error Title */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-gray-600">
                  We're sorry, but an unexpected error occurred. Please try again.
                </p>
              </div>

              {/* Error Details (collapsed by default) */}
              {this.state.error && (
                <details className="text-left bg-gray-50 rounded-lg p-4">
                  <summary className="cursor-pointer text-gray-700 font-semibold mb-2">
                    Show Error Details
                  </summary>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Error Message:</p>
                      <pre className="text-xs text-red-600 bg-red-50 p-2 rounded overflow-x-auto">
                        {this.state.error.toString()}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Component Stack:</p>
                        <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={this.handleReset}
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  <i className="fas fa-redo mr-2"></i>
                  Try Again
                </button>
                <button
                  onClick={this.handleReload}
                  className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  <i className="fas fa-sync mr-2"></i>
                  Reload Page
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  <i className="fas fa-home mr-2"></i>
                  Go Home
                </button>
              </div>

              {/* Error Count Warning */}
              {this.state.errorCount > 2 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    Multiple errors detected ({this.state.errorCount}). Consider reloading the page or clearing your browser cache.
                  </p>
                </div>
              )}

              {/* Help Text */}
              <div className="text-sm text-gray-500 border-t pt-4">
                <p>
                  If the problem persists, please try:
                </p>
                <ul className="list-disc list-inside text-left inline-block mt-2 space-y-1">
                  <li>Clearing your browser cache and cookies</li>
                  <li>Checking your internet connection</li>
                  <li>Reconnecting your wallet</li>
                  <li>Trying a different browser</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
