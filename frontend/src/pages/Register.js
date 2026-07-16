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

        if (score <= 1) return { level: 1, text: 'Weak', color: 'bg-red-600', textColor: 'text-red-600' };
        if (score <= 2) return { level: 2, text: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-500' };
        if (score <= 3) return { level: 3, text: 'Good', color: 'bg-brand-500', textColor: 'text-brand-500' };
        return { level: 4, text: 'Strong', color: 'bg-green-600', textColor: 'text-green-600' };
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
        <div className="min-h-screen bg-dark-gradient flex items-center justify-center p-8 relative">
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2">
                <button className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${language === 'en' ? 'bg-brand-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`} onClick={() => changeLanguage('en')}>English</button>
                <button className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${language === 'hi' ? 'bg-brand-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`} onClick={() => changeLanguage('hi')}>हिन्दी</button>
                <button className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${language === 'mr' ? 'bg-brand-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`} onClick={() => changeLanguage('mr')}>मराठी</button>
            </div>

            <div className="card-glass w-full max-w-md p-10 rounded-2xl">
                <div className="text-center mb-6">
                    <div className="font-display text-3xl font-extrabold text-brand-500 mb-2">Limpex</div>
                    <h1 className="font-display text-xl font-bold text-gray-900 mb-1">{t('authRegister')}</h1>
                    <p className="text-sm text-gray-500">{t('authSubtitle')}</p>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm text-center mb-6" role="alert" aria-live="polite">{error}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="mb-4">
                        <label htmlFor="reg-first" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('authFirstName')} *</label>
                        <input id="reg-first" type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                            placeholder={t('authFirstName')} autoComplete="given-name" disabled={loading} required className="input-field" />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="reg-last" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('authLastName')}</label>
                        <input id="reg-last" type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                            placeholder={t('authLastName')} autoComplete="family-name" disabled={loading} className="input-field" />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="reg-email" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('authEmail')}</label>
                        <input id="reg-email" type="email" name="email" value={formData.email} onChange={handleChange}
                            required placeholder="you@example.com" autoComplete="email" disabled={loading} className="input-field" />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="reg-pass" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('authPassword')}</label>
                        <div className="relative">
                            <input id="reg-pass" type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                                required placeholder="Min 8 characters" autoComplete="new-password" disabled={loading} className="input-field pr-12" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-lg text-gray-400 p-1 hover:text-gray-600 transition-colors"
                                aria-label={showPassword ? 'Hide password' : 'Show password'} tabIndex={-1}>
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                        {formData.password && (
                            <div className="mt-1.5">
                                <div className="flex gap-1 mb-1">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className={`flex-1 h-1 rounded-sm transition-all duration-200 ${i <= strength.level ? strength.color : 'bg-gray-200'}`} />
                                    ))}
                                </div>
                                <span className={`text-[11px] font-semibold ${strength.textColor}`}>{strength.text}</span>
                            </div>
                        )}
                    </div>

                    <div className="mb-6">
                        <label htmlFor="reg-confirm" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('authConfirmPassword')}</label>
                        <input id="reg-confirm" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                            required placeholder="••••••••" autoComplete="new-password" disabled={loading} className="input-field" />
                        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                            <span className="text-[11px] text-red-600">Passwords do not match</span>
                        )}
                    </div>

                    <button type="submit" className="btn-brand w-full py-3.5 text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>
                        {loading ? (
                            <span className="inline-flex items-center gap-2">
                                <span className="loading-spinner"></span> Creating account...
                            </span>
                        ) : t('authRegisterButton')}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    {t('authHasAccount')} <Link to="/login" className="text-brand-500 font-semibold hover:text-brand-600 transition-colors">{t('authLoginHere')}</Link>
                </p>
                <p className="text-center text-sm mt-2">
                    <Link to="/" className="text-brand-500 font-semibold hover:text-brand-600 transition-colors">{t('authBackHome')}</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
