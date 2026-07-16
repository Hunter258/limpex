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
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f8fafb',
                    padding: '2rem',
                    fontFamily: "'Inter', sans-serif"
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '3rem',
                        maxWidth: '480px',
                        textAlign: 'center',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '1rem' }}>⚠️</div>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: '#1a1a1a', marginBottom: '0.5rem' }}>
                            Something went wrong
                        </h2>
                        <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                            An unexpected error occurred. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.href = '/';
                            }}
                            style={{
                                padding: '12px 32px',
                                background: '#00b4a0',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
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
