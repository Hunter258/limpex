import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '', password: '', confirmPassword: '', firstName: '', lastName: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();
    const { language, changeLanguage, t } = useLanguage();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const getPasswordStrength = (pwd) => {
        if (!pwd) return { level: 0, text: '', color: '' };
        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        if (score <= 1) return { level: 1, text: 'Weak', color: '#dc2626' };
        if (score <= 2) return { level: 2, text: 'Fair', color: '#f59e0b' };
        if (score <= 3) return { level: 3, text: 'Good', color: '#00b4a0' };
        return { level: 4, text: 'Strong', color: '#16a34a' };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.firstName.trim()) {
            setError('First name is required');
            return;
        }
        if (!formData.email.trim()) {
            setError('Email is required');
            return;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await register(formData.email.trim(), formData.password, formData.firstName.trim(), formData.lastName.trim());
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const strength = getPasswordStrength(formData.password);

    return (
        <div className="auth-container">
            <div className="language-switcher-top">
                <button className={`lang-btn ${language === 'en' ? 'active' : ''}`} onClick={() => changeLanguage('en')}>English</button>
                <button className={`lang-btn ${language === 'hi' ? 'active' : ''}`} onClick={() => changeLanguage('hi')}>हिन्दी</button>
                <button className={`lang-btn ${language === 'mr' ? 'active' : ''}`} onClick={() => changeLanguage('mr')}>मराठी</button>
            </div>

            <div className="auth-card">
                <div className="auth-logo">Limpex</div>
                <h1>{t('authRegister')}</h1>
                <p className="subtitle">{t('authSubtitle')}</p>

                {error && <div className="error-message" role="alert" aria-live="polite">{error}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="reg-first">{t('authFirstName')} *</label>
                        <input id="reg-first" type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                            placeholder={t('authFirstName')} autoComplete="given-name" disabled={loading} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-last">{t('authLastName')}</label>
                        <input id="reg-last" type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                            placeholder={t('authLastName')} autoComplete="family-name" disabled={loading} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-email">{t('authEmail')}</label>
                        <input id="reg-email" type="email" name="email" value={formData.email} onChange={handleChange}
                            required placeholder="you@example.com" autoComplete="email" disabled={loading} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-pass">{t('authPassword')}</label>
                        <div style={{ position: 'relative' }}>
                            <input id="reg-pass" type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                                required placeholder="Min 8 characters" autoComplete="new-password" disabled={loading} style={{ paddingRight: '45px' }} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af', padding: '4px' }}
                                aria-label={showPassword ? 'Hide password' : 'Show password'} tabIndex={-1}>
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                        {formData.password && (
                            <div style={{ marginTop: '6px' }}>
                                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= strength.level ? strength.color : '#e5e7eb', transition: 'background 0.2s' }} />
                                    ))}
                                </div>
                                <span style={{ fontSize: '11px', color: strength.color, fontWeight: '600' }}>{strength.text}</span>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-confirm">{t('authConfirmPassword')}</label>
                        <input id="reg-confirm" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                            required placeholder="••••••••" autoComplete="new-password" disabled={loading} />
                        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                            <span style={{ fontSize: '11px', color: '#dc2626' }}>Passwords do not match</span>
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary-full" disabled={loading}>
                        {loading ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <span className="spinner-sm"></span> Creating account...
                            </span>
                        ) : t('authRegisterButton')}
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
