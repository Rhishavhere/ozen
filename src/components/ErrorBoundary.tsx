import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Reload the page to reset state
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex items-center justify-center bg-gray-900 text-white p-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold mb-4 text-red-400">
              ⚠️ Something went wrong
            </h1>
            <p className="mb-6 text-gray-300">
              The application encountered an unexpected error. Please try reloading.
            </p>
            
            {this.state.error && (
              <div className="bg-gray-800 p-4 rounded-lg mb-6 overflow-auto max-h-64">
                <p className="font-mono text-sm text-red-300 mb-2">
                  <strong>Error:</strong> {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-gray-400 hover:text-gray-200">
                      Stack trace
                    </summary>
                    <pre className="mt-2 text-xs text-gray-400 overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={this.handleReset}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Reload Application
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Error: ${this.state.error?.toString()}\n\nStack: ${this.state.errorInfo?.componentStack}`
                  );
                }}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Copy Error Details
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
