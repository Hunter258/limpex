import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div className="landing-page">
            {/* Header */}
            <header className="landing-header">
                <div className="logo">Limpex</div>
                <a href="tel:+919892199247" className="header-phone">+91.9892199247</a>
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
                    <p className="welcome-text">Welcome</p>
                    <h1 className="hero-title">Comprehensive Customs Brokerage Solutions</h1>
                    <p className="hero-subtitle">
                        Educative and detailed guidance for international trade compliance
                    </p>
                    <Link to="/dashboard" className="btn-primary">
                        Learn More
                    </Link>
                </div>
            </section>

            {/* About Section */}
            <section className="about-section">
                <p className="section-label">About Limpex</p>
                <h2 className="section-title">Your Trusted Trade Partner</h2>
                <div className="section-content">
                    <div className="about-text">
                        <p>
                            Limpex is a leading customs brokerage firm providing comprehensive 
                            solutions for international trade. With years of experience in the industry, 
                            we specialize in helping businesses navigate complex customs regulations 
                            and ensure smooth clearance of goods.
                        </p>
                        <br />
                        <p>
                            Our team of experts provides end-to-end support, from documentation 
                            to compliance, making international trade seamless and efficient for 
                            businesses of all sizes.
                        </p>
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
                <p className="section-label" style={{ textAlign: 'center' }}>Our Services</p>
                <h2 className="section-title" style={{ textAlign: 'center' }}>What We Offer</h2>
                <div className="services-grid">
                    <div className="service-card">
                        <div className="service-icon">📋</div>
                        <h3 className="service-title">Customs Clearance</h3>
                        <p className="service-desc">
                            Efficient customs clearance services for import and export 
                            of goods with complete documentation support.
                        </p>
                    </div>
                    <div className="service-card">
                        <div className="service-icon">📦</div>
                        <h3 className="service-title">Trade Compliance</h3>
                        <p className="service-desc">
                            Expert guidance on international trade regulations, 
                            compliance requirements, and policy updates.
                        </p>
                    </div>
                    <div className="service-card">
                        <div className="service-icon">🚢</div>
                        <h3 className="service-title">Logistics Support</h3>
                        <p className="service-desc">
                            Comprehensive logistics solutions including warehousing, 
                            transportation, and supply chain management.
                        </p>
                    </div>
                    <div className="service-card">
                        <div className="service-icon">📊</div>
                        <h3 className="service-title">Documentation</h3>
                        <p className="service-desc">
                            Complete documentation services for bills of entry, 
                            shipping bills, and regulatory compliance.
                        </p>
                    </div>
                    <div className="service-card">
                        <div className="service-icon">💰</div>
                        <h3 className="service-title">Duty Optimization</h3>
                        <p className="service-desc">
                            Strategic duty planning and optimization to help 
                            businesses minimize costs and maximize efficiency.
                        </p>
                    </div>
                    <div className="service-card">
                        <div className="service-icon">🤝</div>
                        <h3 className="service-title">Consulting</h3>
                        <p className="service-desc">
                            Professional consulting services for trade strategies, 
                            market entry, and business expansion.
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="contact-section">
                <p className="section-label">Get In Touch</p>
                <h2 className="section-title">Contact Us</h2>
                <div className="contact-grid">
                    <form className="contact-form">
                        <div className="form-group">
                            <label>Your Name</label>
                            <input type="text" placeholder="Enter your name" />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" placeholder="Enter your email" />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input type="tel" placeholder="Enter your phone number" />
                        </div>
                        <div className="form-group">
                            <label>Message</label>
                            <textarea placeholder="How can we help you?"></textarea>
                        </div>
                        <button type="submit" className="btn-primary">
                            Send Message
                        </button>
                    </form>
                    <div className="contact-info">
                        <div className="info-item">
                            <div className="info-icon">📍</div>
                            <div className="info-content">
                                <h4>Office Address</h4>
                                <p>Mumbai, Maharashtra, India</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-icon">📞</div>
                            <div className="info-content">
                                <h4>Phone Number</h4>
                                <p>+91.9892199247</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-icon">✉️</div>
                            <div className="info-content">
                                <h4>Email Address</h4>
                                <p>info@limpex.com</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-icon">🕐</div>
                            <div className="info-content">
                                <h4>Working Hours</h4>
                                <p>Mon - Sat: 9:00 AM - 6:00 PM</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="logo">Limpex</div>
                        <p>
                            Your trusted partner in customs brokerage and 
                            international trade compliance solutions.
                        </p>
                    </div>
                    <div className="footer-links">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><a href="#about">About Us</a></li>
                            <li><a href="#services">Services</a></li>
                            <li><a href="#contact">Contact</a></li>
                        </ul>
                    </div>
                    <div className="footer-links">
                        <h4>Services</h4>
                        <ul>
                            <li><a href="#customs">Customs Clearance</a></li>
                            <li><a href="#compliance">Trade Compliance</a></li>
                            <li><a href="#logistics">Logistics</a></li>
                        </ul>
                    </div>
                    <div className="footer-links">
                        <h4>Support</h4>
                        <ul>
                            <li><a href="#faq">FAQ</a></li>
                            <li><a href="#terms">Terms of Service</a></li>
                            <li><a href="#privacy">Privacy Policy</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2026 Limpex. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
