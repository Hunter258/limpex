import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const LandingPage = () => {
    const { language, changeLanguage, t } = useLanguage();

    return (
        <div className="landing-page">
            {/* Language Switcher */}
            <div className="language-switcher-landing">
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

            {/* Header */}
            <header className="landing-header">
                <div className="logo">{t('appName')}</div>
                <div className="header-right">
                    <Link to="/login" className="header-login">{t('navLogin')}</Link>
                    <a href="tel:+919892199247" className="header-phone">{t('phone')}</a>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-image">
                    <img 
                        src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800" 
                        alt="Fresh produce delivery" 
                    />
                </div>
                <div className="hero-content">
                    <p className="welcome-text">{t('heroWelcome')}</p>
                    <h1 className="hero-title">{t('heroTitle')}</h1>
                    <p className="hero-subtitle">
                        {t('heroSubtitle')}
                    </p>
                    <Link to="/login" className="btn-primary">
                        {t('heroCta')}
                    </Link>
                </div>
            </section>

            {/* About Section */}
            <section className="about-section">
                <p className="section-label">{t('aboutLabel')}</p>
                <h2 className="section-title">{t('aboutTitle')}</h2>
                <div className="section-content">
                    <div className="about-text">
                        <p>{t('aboutText')}</p>
                    </div>
                    <div className="about-image">
                        <img 
                            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600" 
                            alt="Trade operations" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="services-section">
                <p className="section-label" style={{ textAlign: 'center' }}>{t('servicesLabel')}</p>
                <h2 className="section-title" style={{ textAlign: 'center' }}>{t('servicesTitle')}</h2>
                <div className="services-grid">
                    <div className="service-card">
                        <div className="service-icon">📋</div>
                        <h3 className="service-title">{t('service1Title')}</h3>
                        <p className="service-desc">{t('service1Desc')}</p>
                    </div>
                    <div className="service-card">
                        <div className="service-icon">📦</div>
                        <h3 className="service-title">{t('service2Title')}</h3>
                        <p className="service-desc">{t('service2Desc')}</p>
                    </div>
                    <div className="service-card">
                        <div className="service-icon">🚢</div>
                        <h3 className="service-title">{t('service3Title')}</h3>
                        <p className="service-desc">{t('service3Desc')}</p>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="contact-section">
                <p className="section-label">{t('contactLabel')}</p>
                <h2 className="section-title">{t('contactTitle')}</h2>
                <div className="contact-grid">
                    <form className="contact-form">
                        <div className="form-group">
                            <label>{t('contactName')}</label>
                            <input type="text" placeholder={t('contactName')} />
                        </div>
                        <div className="form-group">
                            <label>{t('contactEmail')}</label>
                            <input type="email" placeholder={t('contactEmail')} />
                        </div>
                        <div className="form-group">
                            <label>{t('contactMessage')}</label>
                            <textarea placeholder={t('contactMessage')}></textarea>
                        </div>
                        <button type="submit" className="btn-primary">
                            {t('contactSend')}
                        </button>
                    </form>
                    <div className="contact-info">
                        <div className="info-item">
                            <div className="info-icon">📞</div>
                            <div className="info-content">
                                <h4>{t('navContact')}</h4>
                                <p>+91.9892199247</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-icon">✉️</div>
                            <div className="info-content">
                                <h4>Email</h4>
                                <p>info@limpex.com</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="logo">{t('appName')}</div>
                        <p>{t('footerDesc')}</p>
                    </div>
                    <div className="footer-links">
                        <h4>{t('footerQuickLinks')}</h4>
                        <ul>
                            <li><Link to="/">{t('navHome')}</Link></li>
                            <li><Link to="/">{t('navAbout')}</Link></li>
                            <li><Link to="/">{t('navServices')}</Link></li>
                        </ul>
                    </div>
                    <div className="footer-links">
                        <h4>{t('footerServices')}</h4>
                        <ul>
                            <li><a href="#services">{t('service1Title')}</a></li>
                            <li><a href="#services">{t('service2Title')}</a></li>
                            <li><a href="#services">{t('service3Title')}</a></li>
                        </ul>
                    </div>
                    <div className="footer-links">
                        <h4>{t('footerContact')}</h4>
                        <ul>
                            <li><a href="tel:+919892199247">{t('phone')}</a></li>
                            <li><a href="mailto:info@limpex.com">info@limpex.com</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2026 {t('appName')}. {t('footerRights')}</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
