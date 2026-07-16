import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { language, changeLanguage, t } = useLanguage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Please enter your email');
            return;
        }
        if (!password) {
            setError('Please enter your password');
            return;
        }

        setLoading(true);
        try {
            const user = await login(email.trim(), password);
            if (user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'editor') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            const msg = err.response?.data?.error || 'Login failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-gradient flex items-center justify-center p-8 relative">
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2">
                <button className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${language === 'en' ? 'bg-brand-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`} onClick={() => changeLanguage('en')}>English</button>
                <button className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${language === 'hi' ? 'bg-brand-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`} onClick={() => changeLanguage('hi')}>हिन्दी</button>
                <button className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${language === 'mr' ? 'bg-brand-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`} onClick={() => changeLanguage('mr')}>मराठी</button>
            </div>

            <div className="card-glass w-full max-w-md p-10 rounded-2xl">
                <div className="text-center mb-6">
                    <div className="font-display text-3xl font-extrabold text-brand-500 mb-2">Limpex</div>
                    <h1 className="font-display text-xl font-bold text-gray-900 mb-1">{t('appName')}</h1>
                    <p className="text-sm text-gray-500">{t('authSubtitle')}</p>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm text-center mb-6" role="alert" aria-live="polite">{error}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="mb-4">
                        <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('authEmail')}</label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="admin@limpex.com"
                            autoComplete="email"
                            disabled={loading}
                            className="input-field"
                        />
                    </div>

                    <div className="mb-6 relative">
                        <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('authPassword')}</label>
                        <div className="relative">
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                autoComplete="current-password"
                                disabled={loading}
                                className="input-field pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-lg text-gray-400 p-1 hover:text-gray-600 transition-colors"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                tabIndex={-1}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn-brand w-full py-3.5 text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>
                        {loading ? (
                            <span className="inline-flex items-center gap-2">
                                <span className="loading-spinner"></span> Signing in...
                            </span>
                        ) : t('authLoginButton')}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    {t('authNoAccount')} <Link to="/register" className="text-brand-500 font-semibold hover:text-brand-600 transition-colors">{t('authRegisterHere')}</Link>
                </p>
                <p className="text-center text-xs text-gray-400 mt-2">{t('authContactAdmin')}</p>
                <p className="text-center text-sm mt-2">
                    <Link to="/" className="text-brand-500 font-semibold hover:text-brand-600 transition-colors">{t('authBackHome')}</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
