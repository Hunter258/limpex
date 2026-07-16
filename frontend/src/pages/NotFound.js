import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8 font-body">
            <div className="card p-12 max-w-md text-center shadow-elevated animate-fade-in">
                <div className="text-[80px] font-display font-black text-brand-500 mb-4 leading-none">404</div>
                <h1 className="font-display text-[28px] text-gray-900 mb-2">
                    Page Not Found
                </h1>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    The page you are looking for does not exist or has been moved.
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                    <Link to="/" className="btn-brand px-7 py-3 text-sm font-semibold no-underline inline-block">
                        Go to Homepage
                    </Link>
                    <Link to="/products" className="btn-ghost px-7 py-3 text-sm font-semibold no-underline inline-block bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        Browse Products
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
