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
        <div className="auth-container">
            <div className="language-switcher-top">
                <button className={`lang-btn ${language === 'en' ? 'active' : ''}`} onClick={() => changeLanguage('en')}>English</button>
                <button className={`lang-btn ${language === 'hi' ? 'active' : ''}`} onClick={() => changeLanguage('hi')}>हिन्दी</button>
                <button className={`lang-btn ${language === 'mr' ? 'active' : ''}`} onClick={() => changeLanguage('mr')}>मराठी</button>
            </div>

            <div className="auth-card">
                <div className="auth-logo">Limpex</div>
                <h1>{t('appName')}</h1>
                <p className="subtitle">{t('authSubtitle')}</p>

                {error && <div className="error-message" role="alert" aria-live="polite">{error}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="login-email">{t('authEmail')}</label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="admin@limpex.com"
                            autoComplete="email"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group" style={{ position: 'relative' }}>
                        <label htmlFor="login-password">{t('authPassword')}</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                autoComplete="current-password"
                                disabled={loading}
                                style={{ paddingRight: '45px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af', padding: '4px'
                                }}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                tabIndex={-1}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary-full" disabled={loading}>
                        {loading ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <span className="spinner-sm"></span> Signing in...
                            </span>
                        ) : t('authLoginButton')}
                    </button>
                </form>

                <p className="auth-link">
                    {t('authNoAccount')} <Link to="/register">{t('authRegisterHere')}</Link>
                </p>
                <p className="auth-contact-admin">{t('authContactAdmin')}</p>
                <p className="auth-link" style={{ marginTop: '0.5rem' }}>
                    <Link to="/">{t('authBackHome')}</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
