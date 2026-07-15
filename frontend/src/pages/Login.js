import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { language, changeLanguage, t } = useLanguage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="language-switcher-top">
                <button 
                    className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                    onClick={() => changeLanguage('en')}
                >
                    English
                </button>
                <button 
                    className={`lang-btn ${language === 'hi' ? 'active' : ''}`}
                    onClick={() => changeLanguage('hi')}
                >
                    हिन्दी
                </button>
                <button 
                    className={`lang-btn ${language === 'mr' ? 'active' : ''}`}
                    onClick={() => changeLanguage('mr')}
                >
                    मराठी
                </button>
            </div>
            
            <div className="auth-card">
                <div className="auth-logo">Limpex</div>
                <h1>{t('appName')}</h1>
                <p className="subtitle">{t('authSubtitle')}</p>
                
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>{t('authEmail')}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="admin@limpex.com"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>{t('authPassword')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    
                    <button type="submit" className="btn btn-primary-full" disabled={loading}>
                        {loading ? '...' : t('authLoginButton')}
                    </button>
                </form>
                
                <p className="auth-link">
                    {t('authNoAccount')} <Link to="/register">{t('authRegisterHere')}</Link>
                </p>
                <p className="auth-contact-admin">
                    {t('authContactAdmin')}
                </p>
                <p className="auth-link" style={{ marginTop: '0.5rem' }}>
                    <Link to="/">{t('authBackHome')}</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
