import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8 font-body">
                    <div className="card p-12 max-w-md text-center shadow-elevated animate-fade-in">
                        <div className="text-7xl mb-4">⚠️</div>
                        <h2 className="font-display text-2xl text-gray-900 mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-gray-500 mb-6 leading-relaxed">
                            An unexpected error occurred. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.href = '/';
                            }}
                            className="btn-brand px-8 py-3 text-sm font-semibold cursor-pointer"
                        >
                            Go to Homepage
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
