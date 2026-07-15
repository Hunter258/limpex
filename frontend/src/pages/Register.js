import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();
    const { language, changeLanguage, t } = useLanguage();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            await register(formData.email, formData.password, formData.firstName, formData.lastName);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
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
                <h1>{t('authRegister')}</h1>
                <p className="subtitle">{t('authSubtitle')}</p>
                
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>{t('authFirstName')}</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder={t('authFirstName')}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>{t('authLastName')}</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder={t('authLastName')}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>{t('authEmail')}</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="you@example.com"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>{t('authPassword')}</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>{t('authConfirmPassword')}</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    
                    <button type="submit" className="btn btn-primary-full" disabled={loading}>
                        {loading ? '...' : t('authRegisterButton')}
                    </button>
                </form>
                
                <p className="auth-link">
                    {t('authHasAccount')} <Link to="/login">{t('authLoginHere')}</Link>
                </p>
                <p className="auth-link" style={{ marginTop: '0.5rem' }}>
                    <Link to="/">{t('authBackHome')}</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
