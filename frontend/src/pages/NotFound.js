import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
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
                <div style={{ fontSize: '80px', marginBottom: '1rem', fontWeight: '900', color: '#00b4a0' }}>404</div>
                <h1 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '28px',
                    color: '#1a1a1a',
                    marginBottom: '0.5rem'
                }}>
                    Page Not Found
                </h1>
                <p style={{ color: '#666', marginBottom: '2rem', lineHeight: '1.6' }}>
                    The page you are looking for does not exist or has been moved.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/" style={{
                        padding: '12px 28px',
                        background: '#00b4a0',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        display: 'inline-block'
                    }}>
                        Go to Homepage
                    </Link>
                    <Link to="/products" style={{
                        padding: '12px 28px',
                        background: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        display: 'inline-block'
                    }}>
                        Browse Products
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
