import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const LandingPage = () => {
    const { language, changeLanguage, t } = useLanguage();
    const { addItem, getItemCount, setIsCartOpen } = useCart();
    const [currentTagline, setCurrentTagline] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    const taglines = [
        'Farm Fresh Produce',
        'Customs Brokerage Excellence',
        'International Trade Solutions',
        'Organic & Exotic Collection'
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTagline((prev) => (prev + 1) % taglines.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get('/api/products');
                if (res.data && res.data.products) {
                    setProducts(res.data.products);
                    const cats = [...new Set(res.data.products.map(p => p.category))];
                    setCategories(cats);
                }
            } catch (err) {
                console.error('Failed to load products:', err);
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('scroll-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );
        const elements = document.querySelectorAll('.scroll-reveal');
        elements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [loadingProducts]);

    const categoryImages = {
        indian: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
        international: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400',
        exotic: 'https://images.unsplash.com/photo-1530053969600-caed2596d242?w=400',
        fruits: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400',
        vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
        dry_fruits: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'
    };

    const filteredProducts = activeCategory === 'all'
        ? products.slice(0, 12)
        : products.filter(p => p.category_name === activeCategory || p.category_type === activeCategory || p.parent_category === activeCategory).slice(0, 12);

    const testimonials = [
        { id: 1, name: 'Rajesh Kumar', company: 'Kumar Exports Pvt Ltd', text: 'Limpex has been our trusted partner for customs clearance for over 5 years. Their efficiency and professionalism are unmatched.', rating: 5 },
        { id: 2, name: 'Priya Sharma', company: 'Fresh Harvest Imports', text: 'The quality of fresh produce and the speed of customs clearance makes Limpex our go-to choice for all import needs.', rating: 5 },
        { id: 3, name: 'Amit Patel', company: 'Global Trade Solutions', text: 'Excellent documentation services and trade consulting. They simplified our entire import process significantly.', rating: 5 }
    ];

    const services = [
        { icon: '📋', titleKey: 'service1Title', descKey: 'service1Desc' },
        { icon: '📦', titleKey: 'service2Title', descKey: 'service2Desc' },
        { icon: '🚢', titleKey: 'service3Title', descKey: 'service3Desc' }
    ];

    const whyChooseUs = [
        { icon: '⚡', title: 'Fast Processing', desc: 'Quick customs clearance with minimal delays' },
        { icon: '✓', title: '100% Compliance', desc: 'Full regulatory compliance guaranteed' },
        { icon: '📞', title: '24/7 Support', desc: 'Round the clock customer assistance' },
        { icon: '💰', title: 'Competitive Rates', desc: 'Best value for premium services' }
    ];

    const getCategoryLabel = (cat) => {
        const labels = {
            indian: 'Indian',
            international: 'International',
            exotic: 'Exotic',
            fruits: 'Fruits',
            vegetables: 'Vegetables',
            dry_fruits: 'Dry Fruits'
        };
        return labels[cat] || cat;
    };

    const getOriginLabel = (origin) => {
        return origin || 'India';
    };

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", color: '#333' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
                
                @keyframes fadeSlide {
                    0%, 100% { opacity: 1; transform: translateY(0); }
                    50% { opacity: 0.7; transform: translateY(-8px); }
                }
                
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                
                .fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
                
                .scroll-reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.7s ease-out, transform 0.7s ease-out; }
                .scroll-reveal.scroll-visible { opacity: 1; transform: translateY(0); }
                .scroll-reveal:nth-child(2) { transition-delay: 0.1s; }
                .scroll-reveal:nth-child(3) { transition-delay: 0.2s; }
                .scroll-reveal:nth-child(4) { transition-delay: 0.3s; }
                
                .product-card { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .product-card:hover { transform: translateY(-12px) scale(1.02); box-shadow: 0 25px 50px rgba(0,180,160,0.2); }
                .product-card:hover img { transform: scale(1.1); }
                .product-card img { transition: transform 0.5s ease; }
                
                .category-card { transition: all 0.4s ease; }
                .category-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,180,160,0.2); }
                .category-card:hover img { transform: scale(1.08); }
                .category-card img { transition: transform 0.5s ease; }
                
                .stat-card { transition: all 0.3s ease; }
                .stat-card:hover { transform: translateY(-5px); background: rgba(255,255,255,0.25); }
                
                .service-card { transition: all 0.4s ease; }
                .service-card:hover { transform: translateY(-12px); box-shadow: 0 25px 50px rgba(0,180,160,0.15); }
                
                .testimonial-card { transition: all 0.4s ease; }
                .testimonial-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
                
                .whatsapp-btn { animation: pulse 2s infinite; }
                
                .nav-link { position: relative; }
                .nav-link::after { content: ''; position: absolute; bottom: -5px; left: 50%; width: 0; height: 2px; background: #00b4a0; transition: all 0.3s ease; transform: translateX(-50%); }
                .nav-link:hover::after { width: 100%; }
                
                .tagline-text { animation: fadeSlide 3s ease-in-out infinite; }
                
                .hero-bg { position: relative; overflow: hidden; }
                .hero-bg::before { content: ''; position: absolute; top: -50%; right: -20%; width: 600px; height: 600px; border-radius: 50%; background: rgba(255,255,255,0.08); filter: blur(60px); }
                .hero-bg::after { content: ''; position: absolute; bottom: -30%; left: -10%; width: 400px; height: 400px; border-radius: 50%; background: rgba(255,255,255,0.05); filter: blur(40px); }
                
                .organic-badge { background: linear-gradient(135deg, #22c55e, #16a34a); }
                .fresh-badge { background: linear-gradient(135deg, #3b82f6, #2563eb); }
                .imported-badge { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
                
                .scroll-to-top { position: fixed; bottom: 100px; right: 30px; width: 45px; height: 45px; background: rgba(0,180,160,0.9); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s ease; z-index: 999; border: none; font-size: 20px; }
                .scroll-to-top:hover { background: #009688; transform: translateY(-3px); }
                
                @media (max-width: 768px) {
                    .hero-section { grid-template-columns: 1fr; text-align: center; }
                    .categories-grid { grid-template-columns: repeat(2, 1fr) !important; }
                    .products-grid { grid-template-columns: repeat(2, 1fr) !important; }
                    .services-grid { grid-template-columns: 1fr !important; }
                    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
                    .contact-grid { grid-template-columns: 1fr !important; }
                    .footer-grid { grid-template-columns: 1fr !important; }
                    .nav-links { display: none !important; }
                }
            `}</style>

            {/* Language Switcher */}
            <div style={{
                position: 'fixed',
                top: '10px',
                right: '20px',
                zIndex: 1001,
                display: 'flex',
                gap: '6px',
                background: 'rgba(255,255,255,0.95)',
                padding: '5px 10px',
                borderRadius: '25px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)'
            }}>
                {['en', 'hi', 'mr'].map((lang) => (
                    <button
                        key={lang}
                        onClick={() => changeLanguage(lang)}
                        style={{
                            padding: '5px 12px',
                            border: 'none',
                            borderRadius: '18px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: language === lang ? '700' : '400',
                            background: language === lang ? '#00b4a0' : 'transparent',
                            color: language === lang ? '#fff' : '#666',
                            transition: 'all 0.3s ease',
                            fontFamily: 'Inter, sans-serif'
                        }}
                    >
                        {lang === 'en' ? 'EN' : lang === 'hi' ? 'हि' : 'मर'}
                    </button>
                ))}
            </div>

            {/* Navigation */}
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                background: 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(15px)',
                padding: '12px 5%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 1000,
                boxShadow: '0 1px 30px rgba(0,0,0,0.06)'
            }}>
                <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '26px',
                    fontWeight: '700',
                    color: '#00b4a0',
                    letterSpacing: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #00b4a0, #009688)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '16px',
                        fontWeight: '800'
                    }}>L</span>
                    {t('appName')}
                </div>
                
                <div className="nav-links" style={{
                    display: 'flex',
                    gap: '32px',
                    alignItems: 'center'
                }}>
                    {[
                        { label: t('navHome'), href: '#home' },
                        { label: t('navAbout'), href: '#about' },
                        { label: t('navServices'), href: '#services' },
                        { label: 'Shop', href: '#shop' },
                        { label: 'Track Order', href: '/track-order', isRoute: true },
                        { label: t('navContact'), href: '#contact' }
                    ].map((item, index) => (
                        item.isRoute ? (
                            <Link
                                key={index}
                                to={item.href}
                                className="nav-link"
                                style={{
                                    textDecoration: 'none',
                                    color: '#333',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    letterSpacing: '0.3px',
                                    transition: 'color 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.color = '#00b4a0'}
                                onMouseLeave={(e) => e.target.style.color = '#333'}
                            >
                                {item.label}
                            </Link>
                        ) : (
                        <a
                            key={index}
                            href={item.href}
                            className="nav-link"
                            style={{
                                textDecoration: 'none',
                                color: '#333',
                                fontSize: '14px',
                                fontWeight: '500',
                                letterSpacing: '0.3px',
                                transition: 'color 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#00b4a0'}
                            onMouseLeave={(e) => e.target.style.color = '#333'}
                        >
                            {item.label}
                        </a>
                        )
                    ))}
                    <Link
                        to="/login"
                        style={{
                            textDecoration: 'none',
                            background: 'linear-gradient(135deg, #00b4a0, #009688)',
                            color: '#fff',
                            padding: '9px 22px',
                            borderRadius: '22px',
                            fontSize: '13px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(0,180,160,0.3)'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(0,180,160,0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 15px rgba(0,180,160,0.3)';
                        }}
                    >
                        {t('navLogin')}
                    </Link>
                    <Link
                        to="/cart"
                        style={{
                            textDecoration: 'none',
                            background: '#fff',
                            color: '#00b4a0',
                            padding: '9px 16px',
                            borderRadius: '22px',
                            fontSize: '13px',
                            fontWeight: '700',
                            transition: 'all 0.3s ease',
                            border: '2px solid #00b4a0',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        🛒 Cart {getItemCount() > 0 && <span style={{ background: '#00b4a0', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>{getItemCount()}</span>}
                    </Link>
                </div>

                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    style={{
                        display: 'none',
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#333'
                    }}
                >
                    {isMenuOpen ? '✕' : '☰'}
                </button>
            </nav>

            {/* Hero Section */}
            <section id="home" className="hero-bg" style={{
                minHeight: '100vh',
                background: `linear-gradient(135deg, rgba(0,180,160,0.92) 0%, rgba(0,150,136,0.88) 50%, rgba(0,121,107,0.92) 100%), url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                padding: '0 5%',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div className="fade-in-up" style={{ maxWidth: '650px', zIndex: 2, paddingTop: '80px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(255,255,255,0.15)',
                        padding: '8px 18px',
                        borderRadius: '25px',
                        marginBottom: '25px',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <span style={{ fontSize: '14px' }}>🌿</span>
                        <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: '13px', fontWeight: '500', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            {t('heroWelcome')}
                        </span>
                    </div>
                    
                    <h1 style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '52px',
                        fontWeight: '800',
                        color: '#fff',
                        lineHeight: '1.1',
                        marginBottom: '20px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        {t('heroTitle')}
                    </h1>
                    
                    <div style={{ height: '50px', overflow: 'hidden', marginBottom: '25px' }}>
                        <h2 className="tagline-text" style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '28px',
                            fontWeight: '600',
                            color: '#fff',
                            textShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                            {taglines[currentTagline]}
                        </h2>
                    </div>
                    
                    <p style={{
                        color: 'rgba(255,255,255,0.92)',
                        fontSize: '17px',
                        lineHeight: '1.8',
                        marginBottom: '35px',
                        maxWidth: '520px',
                        fontWeight: '300'
                    }}>
                        {t('heroSubtitle')}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        <Link
                            to="/login"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#fff',
                                color: '#00b4a0',
                                padding: '14px 32px',
                                borderRadius: '30px',
                                fontSize: '14px',
                                fontWeight: '700',
                                textDecoration: 'none',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                                letterSpacing: '0.5px'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-3px)';
                                e.target.style.boxShadow = '0 12px 35px rgba(0,0,0,0.25)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
                            }}
                        >
                            🛒 {t('heroCta')}
                        </Link>
                        <a
                            href="#shop"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'transparent',
                                color: '#fff',
                                padding: '14px 32px',
                                borderRadius: '30px',
                                fontSize: '14px',
                                fontWeight: '600',
                                textDecoration: 'none',
                                border: '2px solid rgba(255,255,255,0.5)',
                                transition: 'all 0.3s ease',
                                letterSpacing: '0.5px'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#fff';
                                e.target.style.color = '#00b4a0';
                                e.target.style.borderColor = '#fff';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.color = '#fff';
                                e.target.style.borderColor = 'rgba(255,255,255,0.5)';
                            }}
                        >
                            📦 Explore Products
                        </a>
                        <a
                            href="https://wa.me/919892199247"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#25d366',
                                color: '#fff',
                                padding: '14px 32px',
                                borderRadius: '30px',
                                fontSize: '14px',
                                fontWeight: '600',
                                textDecoration: 'none',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(37,211,102,0.4)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-3px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            💬 WhatsApp Order
                        </a>
                    </div>
                    
                    <div style={{
                        display: 'flex',
                        gap: '30px',
                        marginTop: '40px',
                        paddingTop: '30px',
                        borderTop: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        <div>
                            <h3 style={{ color: '#fff', fontSize: '28px', fontWeight: '700', fontFamily: "'Playfair Display', serif" }}>25+</h3>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>Years Experience</p>
                        </div>
                        <div>
                            <h3 style={{ color: '#fff', fontSize: '28px', fontWeight: '700', fontFamily: "'Playfair Display', serif" }}>10K+</h3>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>Shipments Cleared</p>
                        </div>
                        <div>
                            <h3 style={{ color: '#fff', fontSize: '28px', fontWeight: '700', fontFamily: "'Playfair Display', serif" }}>500+</h3>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>Happy Clients</p>
                        </div>
                    </div>
                </div>
                
                <div style={{
                    position: 'absolute',
                    right: '8%',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '450px',
                    height: '450px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    filter: 'blur(50px)'
                }}></div>
            </section>

            {/* Trust Bar */}
            <section style={{
                background: '#fff',
                padding: '25px 5%',
                borderBottom: '1px solid #f0f0f0'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '20px'
                }}>
                    {[
                        { icon: '✓', label: '100% Organic Certified' },
                        { icon: '🚚', label: 'Same Day Delivery' },
                        { icon: '🔒', label: 'Secure Payments' },
                        { icon: '📞', label: '24/7 Customer Support' },
                        { icon: '♻️', label: 'Eco-Friendly Packaging' }
                    ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#00b4a0', fontSize: '16px' }}>{item.icon}</span>
                            <span style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>{item.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Shop by Category */}
            <section id="shop" style={{
                padding: '80px 5%',
                background: '#f8fafb',
                scrollMarginTop: '70px'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                    <p style={{ color: '#00b4a0', fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>
                        BROWSE BY CATEGORY
                    </p>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '38px', fontWeight: '700', color: '#1a1a1a', marginBottom: '15px' }}>
                        Shop Fresh Categories
                    </h2>
                    <p style={{ fontSize: '16px', color: '#666', marginBottom: '50px', maxWidth: '500px', margin: '0 auto 50px' }}>
                        Discover our wide range of fresh produce sourced from the best farms across India and around the world
                    </p>
                    
                    <div className="categories-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '20px'
                    }}>
                        {[
                            { name: 'Indian Fruits', filter: 'Indian Fruits', sub: 'Fresh & Seasonal', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=350', color: '#ff6b6b', count: products.filter(p => p.category_name === 'Indian Fruits').length || '10+' },
                            { name: 'International Fruits', filter: 'International Fruits', sub: 'Imported Goodness', img: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=350', color: '#4ecdc4', count: products.filter(p => p.category_name === 'International Fruits').length || '10+' },
                            { name: 'Exotic Fruits', filter: 'Exotic Fruits', sub: 'Premium Collection', img: 'https://images.unsplash.com/photo-1530053969600-caed2596d242?w=350', color: '#9b59b6', count: products.filter(p => p.category_name === 'Exotic Fruits').length || '8+' },
                            { name: 'Indian Vegetables', filter: 'Indian Vegetables', sub: 'Garden Fresh', img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=350', color: '#2ecc71', count: products.filter(p => p.category_name === 'Indian Vegetables').length || '10+' },
                            { name: 'International Vegetables', filter: 'International Vegetables', sub: 'Global Selection', img: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=350', color: '#3498db', count: products.filter(p => p.category_name === 'International Vegetables').length || '8+' },
                            { name: 'Exotic Vegetables', filter: 'Exotic Vegetables', sub: 'Specialty Items', img: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=350', color: '#e74c3c', count: products.filter(p => p.category_name === 'Exotic Vegetables').length || '8+' },
                            { name: 'Indian Dry Fruits', filter: 'Indian Dry Fruits', sub: 'Premium Quality', img: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=350', color: '#f39c12', count: products.filter(p => p.category_name === 'Indian Dry Fruits').length || '10+' },
                            { name: 'All Products', filter: 'all', sub: 'View Complete Range', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=350', color: '#00b4a0', count: products.length || '76' }
                        ].map((cat, index) => (
                            <div
                                key={index}
                                className="category-card"
                                style={{
                                    background: '#fff',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                                    border: activeCategory === cat.filter ? '2px solid #00b4a0' : '2px solid transparent'
                                }}
                                onClick={() => {
                                    setActiveCategory(cat.filter);
                                    setTimeout(() => {
                                        document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }, 150);
                                }}
                            >
                                <div style={{ height: '140px', overflow: 'hidden', position: 'relative' }}>
                                    <img
                                        src={cat.img}
                                        alt={cat.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        background: cat.color,
                                        color: '#fff',
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        fontSize: '11px',
                                        fontWeight: '600'
                                    }}>
                                        {cat.count} items
                                    </div>
                                </div>
                                <div style={{ padding: '16px', textAlign: 'left' }}>
                                    <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' }}>
                                        {cat.name}
                                    </h3>
                                    <p style={{ fontSize: '12px', color: '#888' }}>{cat.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Products Section */}
            <section id="products" style={{
                padding: '80px 5%',
                background: '#fff',
                scrollMarginTop: '70px'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                    <p style={{ color: '#00b4a0', fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>
                        FEATURED PRODUCTS
                    </p>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '38px', fontWeight: '700', color: '#1a1a1a', marginBottom: '15px' }}>
                        Fresh From Farm to Your Table
                    </h2>
                    <p style={{ fontSize: '16px', color: '#666', marginBottom: '40px' }}>
                        Handpicked produce delivered fresh to your doorstep
                    </p>
                    
                    <div className="products-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '20px',
                        marginBottom: '40px'
                    }}>
                        {loadingProducts ? (
                            Array(8).fill(0).map((_, i) => (
                                <div key={i} style={{
                                    background: '#f0f0f0',
                                    borderRadius: '16px',
                                    height: '280px',
                                    animation: 'shimmer 1.5s infinite',
                                    backgroundSize: '200% 100%',
                                    backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)'
                                }}></div>
                            ))
                        ) : (
                            filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="product-card"
                                    style={{
                                        background: '#fff',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                                        border: '1px solid #f0f0f0',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                                        <img
                                            src={product.image_url || 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400'}
                                            alt={product.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        {product.is_organic && (
                                            <span className="organic-badge" style={{
                                                position: 'absolute',
                                                top: '10px',
                                                left: '10px',
                                                padding: '4px 10px',
                                                borderRadius: '10px',
                                                fontSize: '10px',
                                                fontWeight: '700',
                                                color: '#fff',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                🌿 Organic
                                            </span>
                                        )}
                                        <span style={{
                                            position: 'absolute',
                                            top: '10px',
                                            right: '10px',
                                            background: 'rgba(0,0,0,0.6)',
                                            color: '#fff',
                                            padding: '4px 8px',
                                            borderRadius: '8px',
                                            fontSize: '10px',
                                            fontWeight: '600'
                                        }}>
                                            {getOriginLabel(product.origin_country)}
                                        </span>
                                    </div>
                                    <div style={{ padding: '16px', textAlign: 'left' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            background: '#e8f5f3',
                                            color: '#00b4a0',
                                            padding: '3px 8px',
                                            borderRadius: '8px',
                                            fontSize: '10px',
                                            fontWeight: '600',
                                            textTransform: 'uppercase',
                                            marginBottom: '8px'
                                        }}>
                                            {getCategoryLabel(product.category_type || product.parent_category)}
                                        </span>
                                        <h3 style={{
                                            fontFamily: "'Inter', sans-serif",
                                            fontSize: '14px',
                                            fontWeight: '700',
                                            color: '#1a1a1a',
                                            marginBottom: '6px',
                                            lineHeight: '1.3'
                                        }}>
                                            {product.name}
                                        </h3>
                                        <p style={{ fontSize: '11px', color: '#888', marginBottom: '10px', lineHeight: '1.4' }}>
                                            {product.description ? product.description.substring(0, 60) + '...' : ''}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '16px', fontWeight: '800', color: '#00b4a0' }}>
                                                ₹{product.price}/{product.unit || 'kg'}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#999' }}>
                                                Stock: {product.stock_quantity}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                addItem(product, 1);
                                            }}
                                            style={{
                                                width: '100%',
                                                marginTop: '10px',
                                                padding: '9px',
                                                background: 'linear-gradient(135deg, #00b4a0, #009688)',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '10px',
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 2px 8px rgba(0,180,160,0.2)',
                                                fontFamily: 'Inter, sans-serif'
                                            }}
                                        >
                                            🛒 Order Now
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <Link
                        to="/products"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '14px 36px',
                            background: 'linear-gradient(135deg, #00b4a0, #009688)',
                            color: '#fff',
                            borderRadius: '30px',
                            fontSize: '14px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 6px 20px rgba(0,180,160,0.3)',
                            letterSpacing: '0.5px'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-3px)';
                            e.target.style.boxShadow = '0 10px 30px rgba(0,180,160,0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 6px 20px rgba(0,180,160,0.3)';
                        }}
                    >
                        View All {products.length} Products →
                    </Link>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="scroll-reveal" style={{
                padding: '80px 5%',
                background: '#f8fafb',
                scrollMarginTop: '70px'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '60px',
                    alignItems: 'center'
                }}>
                    <div>
                        <p style={{ color: '#00b4a0', fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>
                            {t('aboutLabel')}
                        </p>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', fontWeight: '700', color: '#1a1a1a', lineHeight: '1.2', marginBottom: '20px' }}>
                            {t('aboutTitle')}
                        </h2>
                        <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#555', marginBottom: '25px' }}>
                            {t('aboutText')}
                        </p>
                        <div style={{ display: 'flex', gap: '40px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '700', color: '#00b4a0' }}>25+</h3>
                                <p style={{ fontSize: '13px', color: '#666' }}>Years Experience</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '700', color: '#00b4a0' }}>10K+</h3>
                                <p style={{ fontSize: '13px', color: '#666' }}>Shipments Cleared</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '700', color: '#00b4a0' }}>500+</h3>
                                <p style={{ fontSize: '13px', color: '#666' }}>Happy Clients</p>
                            </div>
                        </div>
                    </div>
                    <div style={{
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
                        position: 'relative'
                    }}>
                        <img
                            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600"
                            alt="Trade operations"
                            style={{ width: '100%', height: '400px', objectFit: 'cover' }}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                            padding: '30px',
                            color: '#fff'
                        }}>
                            <p style={{ fontSize: '14px', fontWeight: '600' }}>Trusted by 500+ businesses across India</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="scroll-reveal" style={{
                padding: '80px 5%',
                background: '#fff',
                scrollMarginTop: '70px'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                    <p style={{ color: '#00b4a0', fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>
                        {t('servicesLabel')}
                    </p>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '38px', fontWeight: '700', color: '#1a1a1a', marginBottom: '50px' }}>
                        {t('servicesTitle')}
                    </h2>
                    
                    <div className="services-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '25px'
                    }}>
                        {services.map((service, index) => (
                            <div
                                key={index}
                                className="service-card"
                                style={{
                                    padding: '40px 30px',
                                    borderRadius: '20px',
                                    background: '#f8fafb',
                                    border: '1px solid #f0f0f0'
                                }}
                            >
                                <div style={{
                                    width: '70px',
                                    height: '70px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #00b4a0 0%, #009688 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 20px',
                                    fontSize: '28px',
                                    boxShadow: '0 8px 25px rgba(0,180,160,0.3)'
                                }}>
                                    {service.icon}
                                </div>
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '600', color: '#1a1a1a', marginBottom: '12px' }}>
                                    {t(service.titleKey)}
                                </h3>
                                <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#666' }}>
                                    {t(service.descKey)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="scroll-reveal" style={{
                padding: '80px 5%',
                background: 'linear-gradient(135deg, #00b4a0 0%, #009688 100%)',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-20%',
                    width: '500px',
                    height: '500px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)',
                    filter: 'blur(40px)'
                }}></div>
                <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px', opacity: '0.9' }}>
                        WHY CHOOSE US
                    </p>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '38px', fontWeight: '700', marginBottom: '50px' }}>
                        The Limpex Advantage
                    </h2>
                    
                    <div className="stats-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '20px'
                    }}>
                        {whyChooseUs.map((item, index) => (
                            <div
                                key={index}
                                className="stat-card"
                                style={{
                                    padding: '35px 20px',
                                    background: 'rgba(255,255,255,0.12)',
                                    borderRadius: '20px',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.15)'
                                }}
                            >
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 18px',
                                    fontSize: '24px'
                                }}>
                                    {item.icon}
                                </div>
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
                                    {item.title}
                                </h3>
                                <p style={{ fontSize: '13px', lineHeight: '1.6', opacity: '0.9' }}>
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="scroll-reveal" style={{
                padding: '80px 5%',
                background: '#f8fafb'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                    <p style={{ color: '#00b4a0', fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>
                        TESTIMONIALS
                    </p>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '38px', fontWeight: '700', color: '#1a1a1a', marginBottom: '50px' }}>
                        What Our Clients Say
                    </h2>
                    
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '25px'
                    }}>
                        {testimonials.map((testimonial) => (
                            <div
                                key={testimonial.id}
                                className="testimonial-card"
                                style={{
                                    padding: '35px 28px',
                                    background: '#fff',
                                    borderRadius: '20px',
                                    textAlign: 'left',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                    border: '1px solid #f0f0f0'
                                }}
                            >
                                <div style={{ color: '#ffc107', fontSize: '16px', marginBottom: '12px', letterSpacing: '2px' }}>
                                    {'★'.repeat(testimonial.rating)}
                                </div>
                                <p style={{
                                    fontSize: '15px',
                                    lineHeight: '1.7',
                                    color: '#555',
                                    marginBottom: '20px',
                                    fontStyle: 'italic'
                                }}>
                                    "{testimonial.text}"
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #00b4a0, #009688)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        fontSize: '16px',
                                        fontWeight: '700'
                                    }}>
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: '700', color: '#1a1a1a', marginBottom: '2px' }}>
                                            {testimonial.name}
                                        </h4>
                                        <p style={{ fontSize: '12px', color: '#00b4a0', fontWeight: '500' }}>
                                            {testimonial.company}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter CTA */}
            <section style={{
                padding: '60px 5%',
                background: 'linear-gradient(135deg, #00b4a0, #009688)',
                color: '#fff',
                textAlign: 'center'
            }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '700', marginBottom: '15px' }}>
                        Get Fresh Deals Delivered
                    </h2>
                    <p style={{ fontSize: '15px', opacity: '0.9', marginBottom: '25px' }}>
                        Subscribe to our newsletter for exclusive offers and farm-fresh updates
                    </p>
                    <div style={{ display: 'flex', gap: '10px', maxWidth: '450px', margin: '0 auto' }}>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            style={{
                                flex: 1,
                                padding: '14px 20px',
                                border: 'none',
                                borderRadius: '25px',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                        <button style={{
                            padding: '14px 28px',
                            background: '#fff',
                            color: '#00b4a0',
                            border: 'none',
                            borderRadius: '25px',
                            fontSize: '14px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}>
                            Subscribe
                        </button>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="scroll-reveal" style={{
                padding: '80px 5%',
                background: '#fff',
                scrollMarginTop: '70px'
            }}>
                <div className="contact-grid" style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '60px'
                }}>
                    <div>
                        <p style={{ color: '#00b4a0', fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>
                            {t('contactLabel')}
                        </p>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', fontWeight: '700', color: '#1a1a1a', marginBottom: '25px' }}>
                            {t('contactTitle')}
                        </h2>
                        
                        <div style={{ marginBottom: '25px' }}>
                            {[
                                { icon: '📍', title: 'Address', value: 'Mumbai, Maharashtra, India' },
                                { icon: '📞', title: t('navContact'), value: t('phone'), href: 'tel:+919892199247' },
                                { icon: '✉️', title: 'Email', value: 'info@limpex.com', href: 'mailto:info@limpex.com' }
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
                                    <div style={{
                                        width: '45px',
                                        height: '45px',
                                        borderRadius: '12px',
                                        background: '#e8f5f3',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '18px',
                                        flexShrink: '0'
                                    }}>
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '3px' }}>{item.title}</h4>
                                        {item.href ? (
                                            <a href={item.href} style={{ fontSize: '14px', color: '#666', textDecoration: 'none' }}>{item.value}</a>
                                        ) : (
                                            <p style={{ fontSize: '14px', color: '#666' }}>{item.value}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <a
                            href="https://wa.me/919892199247"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="whatsapp-btn"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: '#25d366',
                                color: '#fff',
                                padding: '14px 28px',
                                borderRadius: '25px',
                                fontSize: '14px',
                                fontWeight: '600',
                                textDecoration: 'none',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 6px 20px rgba(37,211,102,0.3)'
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>💬</span>
                            WhatsApp Order
                        </a>
                    </div>
                    
                    <div style={{
                        background: '#f8fafb',
                        padding: '35px',
                        borderRadius: '20px',
                        border: '1px solid #f0f0f0'
                    }}>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '600', color: '#1a1a1a', marginBottom: '22px' }}>
                            Send Us a Message
                        </h3>
                        <form>
                            <div style={{ marginBottom: '16px' }}>
                                <input
                                    type="text"
                                    placeholder={t('contactName')}
                                    style={{
                                        width: '100%',
                                        padding: '13px 16px',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        transition: 'border-color 0.3s ease',
                                        outline: 'none',
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#00b4a0'}
                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <input
                                    type="email"
                                    placeholder={t('contactEmail')}
                                    style={{
                                        width: '100%',
                                        padding: '13px 16px',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        transition: 'border-color 0.3s ease',
                                        outline: 'none',
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#00b4a0'}
                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <textarea
                                    placeholder={t('contactMessage')}
                                    rows="4"
                                    style={{
                                        width: '100%',
                                        padding: '13px 16px',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        resize: 'vertical',
                                        transition: 'border-color 0.3s ease',
                                        outline: 'none',
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#00b4a0'}
                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                />
                            </div>
                            <button
                                type="submit"
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: 'linear-gradient(135deg, #00b4a0, #009688)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 6px 20px rgba(0,180,160,0.3)',
                                    fontFamily: 'Inter, sans-serif'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 8px 25px rgba(0,180,160,0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(0,180,160,0.3)';
                                }}
                            >
                                {t('contactSend')} →
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                background: '#0a0a0a',
                color: '#fff',
                padding: '70px 5% 25px'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="footer-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr',
                        gap: '40px',
                        marginBottom: '50px'
                    }}>
                        <div>
                            <h3 style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: '28px',
                                fontWeight: '700',
                                color: '#00b4a0',
                                marginBottom: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <span style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #00b4a0, #009688)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '16px',
                                    fontWeight: '800'
                                }}>L</span>
                                {t('appName')}
                            </h3>
                            <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#888', marginBottom: '20px' }}>
                                {t('footerDesc')}
                            </p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {[
                                    { label: 'f', href: 'https://facebook.com/limpexcustoms', title: 'Facebook' },
                                    { label: 'in', href: 'https://linkedin.com/company/limpex', title: 'LinkedIn' },
                                    { label: '𝕏', href: 'https://twitter.com/limpexcustoms', title: 'Twitter' },
                                    { label: '📷', href: 'https://instagram.com/limpexcustoms', title: 'Instagram' }
                                ].map((social, i) => (
                                    <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" title={social.title} style={{
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.08)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        textDecoration: 'none',
                                        transition: 'all 0.3s ease',
                                        fontSize: '13px',
                                        fontWeight: '600'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = '#00b4a0'}
                                    onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.08)'}
                                    >
                                        {social.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                        
                        {[
                            { title: t('footerQuickLinks'), links: [
                                { label: t('navHome'), href: '#home' },
                                { label: t('navAbout'), href: '#about' },
                                { label: t('navServices'), href: '#services' },
                                { label: 'Shop', href: '#shop' },
                                { label: 'Track Order', href: '/track-order' },
                                { label: 'My Cart', href: '/cart' },
                                { label: t('navContact'), href: '#contact' }
                            ]},
                            { title: t('footerServices'), links: [
                                { label: 'Customs Clearance', href: '#services' },
                                { label: 'Import Documentation', href: '#services' },
                                { label: 'Trade Consulting', href: '#services' },
                                { label: 'Cargo Handling', href: '#services' }
                            ]},
                            { title: t('footerContact'), links: [
                                { label: '📍 Andheri East, Mumbai, Maharashtra 400069', href: 'https://maps.google.com/?q=Mumbai+Maharashtra+India' },
                                { label: `📞 +91 98921 99247`, href: 'tel:+919892199247' },
                                { label: '✉️ info@limpex.com', href: 'mailto:info@limpex.com' },
                                { label: '💬 WhatsApp Us', href: 'https://wa.me/919892199247?text=Hello%20Limpex!' },
                                { label: '🌐 www.limpex.com', href: '/' }
                            ]}
                        ].map((section, i) => (
                            <div key={i}>
                                <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
                                    {section.title}
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {section.links.map((link, j) => (
                                        <li key={j} style={{ marginBottom: '10px' }}>
                                            {link.href.startsWith('/') ? (
                                                <Link to={link.href} style={{
                                                    color: '#888',
                                                    textDecoration: 'none',
                                                    fontSize: '13px',
                                                    transition: 'color 0.3s ease',
                                                    lineHeight: '1.8'
                                                }}
                                                onMouseEnter={(e) => e.target.style.color = '#00b4a0'}
                                                onMouseLeave={(e) => e.target.style.color = '#888'}
                                                >
                                                    {link.label}
                                                </Link>
                                            ) : (
                                                <a href={link.href} style={{
                                                    color: '#888',
                                                    textDecoration: 'none',
                                                    fontSize: '13px',
                                                    transition: 'color 0.3s ease',
                                                    lineHeight: '1.8'
                                                }}
                                                onMouseEnter={(e) => e.target.style.color = '#00b4a0'}
                                                onMouseLeave={(e) => e.target.style.color = '#888'}
                                                >
                                                    {link.label}
                                                </a>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    
                    <div style={{
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        paddingTop: '25px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '15px'
                    }}>
                        <p style={{ fontSize: '13px', color: '#666' }}>
                            © 2026 {t('appName')}. {t('footerRights')}
                        </p>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <a href="#" style={{ color: '#666', textDecoration: 'none', fontSize: '12px', transition: 'color 0.3s' }}
                            onMouseEnter={(e) => e.target.style.color = '#00b4a0'}
                            onMouseLeave={(e) => e.target.style.color = '#666'}
                            >Privacy Policy</a>
                            <a href="#" style={{ color: '#666', textDecoration: 'none', fontSize: '12px', transition: 'color 0.3s' }}
                            onMouseEnter={(e) => e.target.style.color = '#00b4a0'}
                            onMouseLeave={(e) => e.target.style.color = '#666'}
                            >Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Floating Cart Button */}
            <Link
                to="/cart"
                style={{
                    position: 'fixed',
                    bottom: '90px',
                    right: '25px',
                    width: '55px',
                    height: '55px',
                    background: 'linear-gradient(135deg, #00b4a0, #009688)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,180,160,0.5)',
                    zIndex: 1000,
                    textDecoration: 'none',
                    animation: 'pulse 2s infinite'
                }}
            >
                <span style={{ fontSize: '24px', color: '#fff' }}>🛒</span>
                {getItemCount() > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: '#ef4444',
                        color: '#fff',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: '800',
                        border: '2px solid #fff'
                    }}>
                        {getItemCount()}
                    </span>
                )}
            </Link>

            {/* Floating WhatsApp Button */}
            <a
                href="https://wa.me/919892199247"
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-btn"
                style={{
                    position: 'fixed',
                    bottom: '25px',
                    right: '25px',
                    width: '55px',
                    height: '55px',
                    background: '#25d366',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(37,211,102,0.5)',
                    zIndex: 1000,
                    textDecoration: 'none'
                }}
            >
                <span style={{ fontSize: '26px', color: '#fff' }}>💬</span>
            </a>
        </div>
    );
};

export default LandingPage;