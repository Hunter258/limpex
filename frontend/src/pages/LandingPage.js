import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const LandingPage = () => {
    const { language, changeLanguage, t } = useLanguage();
    const [currentTagline, setCurrentTagline] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('home');

    const taglines = [
        'Farm Fresh Produce',
        'Customs Brokerage Excellence',
        'International Trade Solutions'
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTagline((prev) => (prev + 1) % taglines.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const products = [
        { id: 1, name: 'Fresh Fruits', category: 'fruits', image: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400', price: '₹120/kg' },
        { id: 2, name: 'Organic Vegetables', category: 'vegetables', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400', price: '₹80/kg' },
        { id: 3, name: 'Premium Dry Fruits', category: 'dryfruits', image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400', price: '₹450/kg' },
        { id: 4, name: 'Exotic Mangoes', category: 'fruits', image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400', price: '₹200/kg' },
        { id: 5, name: 'Green Vegetables', category: 'vegetables', image: 'https://images.unsplash.com/photo-1518977676601-b53f82ber982?w=400', price: '₹60/kg' },
        { id: 6, name: 'Almonds & Cashews', category: 'dryfruits', image: 'https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=400', price: '₹800/kg' }
    ];

    const testimonials = [
        {
            id: 1,
            name: 'Rajesh Kumar',
            company: 'Kumar Exports Pvt Ltd',
            text: 'Limpex has been our trusted partner for customs clearance for over 5 years. Their efficiency and professionalism are unmatched.',
            rating: 5
        },
        {
            id: 2,
            name: 'Priya Sharma',
            company: 'Fresh Harvest Imports',
            text: 'The quality of fresh produce and the speed of customs clearance makes Limpex our go-to choice for all import needs.',
            rating: 5
        },
        {
            id: 3,
            name: 'Amit Patel',
            company: 'Global Trade Solutions',
            text: 'Excellent documentation services and trade consulting. They simplified our entire import process significantly.',
            rating: 5
        }
    ];

    const services = [
        {
            icon: '📋',
            titleKey: 'service1Title',
            descKey: 'service1Desc'
        },
        {
            icon: '📦',
            titleKey: 'service2Title',
            descKey: 'service2Desc'
        },
        {
            icon: '🚢',
            titleKey: 'service3Title',
            descKey: 'service3Desc'
        }
    ];

    const whyChooseUs = [
        { icon: '⚡', title: 'Fast Processing', desc: 'Quick customs clearance with minimal delays' },
        { icon: '✓', title: '100% Compliance', desc: 'Full regulatory compliance guaranteed' },
        { icon: '📞', title: '24/7 Support', desc: 'Round the clock customer assistance' },
        { icon: '💰', title: 'Competitive Rates', desc: 'Best value for premium services' }
    ];

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", color: '#333' }}>
            {/* Language Switcher */}
            <div style={{
                position: 'fixed',
                top: '10px',
                right: '20px',
                zIndex: 1001,
                display: 'flex',
                gap: '8px',
                background: 'rgba(255,255,255,0.95)',
                padding: '6px 12px',
                borderRadius: '25px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                {['en', 'hi', 'mr'].map((lang) => (
                    <button
                        key={lang}
                        onClick={() => changeLanguage(lang)}
                        style={{
                            padding: '6px 14px',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: language === lang ? '600' : '400',
                            background: language === lang ? '#00b4a0' : 'transparent',
                            color: language === lang ? '#fff' : '#666',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {lang === 'en' ? 'EN' : lang === 'hi' ? 'HI' : 'MR'}
                    </button>
                ))}
            </div>

            {/* Navigation */}
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                background: 'rgba(255,255,255,0.98)',
                backdropFilter: 'blur(10px)',
                padding: '15px 5%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 1000,
                boxShadow: '0 2px 20px rgba(0,0,0,0.08)'
            }}>
                <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#00b4a0',
                    letterSpacing: '1px'
                }}>
                    {t('appName')}
                </div>
                
                <div style={{
                    display: 'flex',
                    gap: '35px',
                    alignItems: 'center'
                }}>
                    {[
                        { label: t('navHome'), href: '#home' },
                        { label: t('navAbout'), href: '#about' },
                        { label: t('navServices'), href: '#services' },
                        { label: 'Products', href: '#products' },
                        { label: t('navContact'), href: '#contact' }
                    ].map((item, index) => (
                        <a
                            key={index}
                            href={item.href}
                            style={{
                                textDecoration: 'none',
                                color: '#333',
                                fontSize: '15px',
                                fontWeight: '500',
                                transition: 'color 0.3s ease',
                                letterSpacing: '0.5px'
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#00b4a0'}
                            onMouseLeave={(e) => e.target.style.color = '#333'}
                        >
                            {item.label}
                        </a>
                    ))}
                    <Link
                        to="/login"
                        style={{
                            textDecoration: 'none',
                            background: '#00b4a0',
                            color: '#fff',
                            padding: '10px 24px',
                            borderRadius: '25px',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#009688'}
                        onMouseLeave={(e) => e.target.style.background = '#00b4a0'}
                    >
                        {t('navLogin')}
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section id="home" style={{
                minHeight: '100vh',
                background: `linear-gradient(135deg, rgba(0,180,160,0.9) 0%, rgba(0,150,136,0.85) 100%), url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                padding: '0 5%',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    maxWidth: '700px',
                    zIndex: 1
                }}>
                    <p style={{
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: '14px',
                        fontWeight: '600',
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                        marginBottom: '20px'
                    }}>
                        {t('heroWelcome')}
                    </p>
                    
                    <h1 style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '56px',
                        fontWeight: '700',
                        color: '#fff',
                        lineHeight: '1.15',
                        marginBottom: '20px'
                    }}>
                        {t('heroTitle')}
                    </h1>
                    
                    <div style={{
                        height: '45px',
                        overflow: 'hidden',
                        marginBottom: '25px'
                    }}>
                        <h2 style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '32px',
                            fontWeight: '600',
                            color: '#fff',
                            animation: 'fadeSlide 3s ease-in-out infinite'
                        }}>
                            {taglines[currentTagline]}
                        </h2>
                    </div>
                    
                    <p style={{
                        color: 'rgba(255,255,255,0.95)',
                        fontSize: '18px',
                        lineHeight: '1.8',
                        marginBottom: '35px',
                        maxWidth: '550px'
                    }}>
                        {t('heroSubtitle')}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <Link
                            to="/login"
                            style={{
                                display: 'inline-block',
                                background: '#fff',
                                color: '#00b4a0',
                                padding: '15px 35px',
                                borderRadius: '30px',
                                fontSize: '15px',
                                fontWeight: '600',
                                textDecoration: 'none',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                            }}
                        >
                            {t('heroCta')}
                        </Link>
                        <a
                            href="https://wa.me/919892199247"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-block',
                                background: 'transparent',
                                color: '#fff',
                                padding: '15px 35px',
                                borderRadius: '30px',
                                fontSize: '15px',
                                fontWeight: '600',
                                textDecoration: 'none',
                                border: '2px solid #fff',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#fff';
                                e.target.style.color = '#00b4a0';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.color = '#fff';
                            }}
                        >
                            WhatsApp Order
                        </a>
                    </div>
                </div>
                
                {/* Decorative Elements */}
                <div style={{
                    position: 'absolute',
                    right: '10%',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '450px',
                    height: '450px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    filter: 'blur(40px)'
                }}></div>
            </section>

            {/* About Section */}
            <section id="about" style={{
                padding: '100px 5%',
                background: '#f8fafb'
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
                        <p style={{
                            color: '#00b4a0',
                            fontSize: '13px',
                            fontWeight: '600',
                            letterSpacing: '3px',
                            textTransform: 'uppercase',
                            marginBottom: '15px'
                        }}>
                            {t('aboutLabel')}
                        </p>
                        <h2 style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '42px',
                            fontWeight: '700',
                            color: '#1a1a1a',
                            lineHeight: '1.2',
                            marginBottom: '25px'
                        }}>
                            {t('aboutTitle')}
                        </h2>
                        <p style={{
                            fontSize: '17px',
                            lineHeight: '1.9',
                            color: '#555',
                            marginBottom: '30px'
                        }}>
                            {t('aboutText')}
                        </p>
                        <div style={{ display: 'flex', gap: '40px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{
                                    fontFamily: "'Playfair Display', serif",
                                    fontSize: '36px',
                                    fontWeight: '700',
                                    color: '#00b4a0'
                                }}>25+</h3>
                                <p style={{ fontSize: '14px', color: '#666' }}>Years Experience</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{
                                    fontFamily: "'Playfair Display', serif",
                                    fontSize: '36px',
                                    fontWeight: '700',
                                    color: '#00b4a0'
                                }}>10K+</h3>
                                <p style={{ fontSize: '14px', color: '#666' }}>Shipments Cleared</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{
                                    fontFamily: "'Playfair Display', serif",
                                    fontSize: '36px',
                                    fontWeight: '700',
                                    color: '#00b4a0'
                                }}>500+</h3>
                                <p style={{ fontSize: '14px', color: '#666' }}>Happy Clients</p>
                            </div>
                        </div>
                    </div>
                    <div style={{
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
                    }}>
                        <img
                            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600"
                            alt="Trade operations"
                            style={{
                                width: '100%',
                                height: '450px',
                                objectFit: 'cover'
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" style={{
                padding: '100px 5%',
                background: '#fff'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    textAlign: 'center'
                }}>
                    <p style={{
                        color: '#00b4a0',
                        fontSize: '13px',
                        fontWeight: '600',
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                        marginBottom: '15px'
                    }}>
                        {t('servicesLabel')}
                    </p>
                    <h2 style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '42px',
                        fontWeight: '700',
                        color: '#1a1a1a',
                        marginBottom: '60px'
                    }}>
                        {t('servicesTitle')}
                    </h2>
                    
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '40px'
                    }}>
                        {services.map((service, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '50px 35px',
                                    borderRadius: '20px',
                                    background: '#f8fafb',
                                    transition: 'all 0.4s ease',
                                    border: '1px solid transparent'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-10px)';
                                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,180,160,0.15)';
                                    e.currentTarget.style.borderColor = '#00b4a0';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.borderColor = 'transparent';
                                }}
                            >
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #00b4a0 0%, #009688 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 25px',
                                    fontSize: '32px'
                                }}>
                                    {service.icon}
                                </div>
                                <h3 style={{
                                    fontFamily: "'Playfair Display', serif",
                                    fontSize: '22px',
                                    fontWeight: '600',
                                    color: '#1a1a1a',
                                    marginBottom: '15px'
                                }}>
                                    {t(service.titleKey)}
                                </h3>
                                <p style={{
                                    fontSize: '15px',
                                    lineHeight: '1.7',
                                    color: '#666'
                                }}>
                                    {t(service.descKey)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Products Section */}
            <section id="products" style={{
                padding: '100px 5%',
                background: '#f8fafb'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    textAlign: 'center'
                }}>
                    <p style={{
                        color: '#00b4a0',
                        fontSize: '13px',
                        fontWeight: '600',
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                        marginBottom: '15px'
                    }}>
                        FEATURED PRODUCTS
                    </p>
                    <h2 style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '42px',
                        fontWeight: '700',
                        color: '#1a1a1a',
                        marginBottom: '60px'
                    }}>
                        Fresh From Farm to Your Table
                    </h2>
                    
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '30px'
                    }}>
                        {products.map((product) => (
                            <div
                                key={product.id}
                                style={{
                                    background: '#fff',
                                    borderRadius: '20px',
                                    overflow: 'hidden',
                                    boxShadow: '0 5px 20px rgba(0,0,0,0.08)',
                                    transition: 'all 0.4s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-8px)';
                                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,180,160,0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 5px 20px rgba(0,0,0,0.08)';
                                }}
                            >
                                <div style={{
                                    height: '220px',
                                    overflow: 'hidden'
                                }}>
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform 0.4s ease'
                                        }}
                                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                    />
                                </div>
                                <div style={{
                                    padding: '25px',
                                    textAlign: 'left'
                                }}>
                                    <span style={{
                                        display: 'inline-block',
                                        background: '#e8f5f3',
                                        color: '#00b4a0',
                                        padding: '4px 12px',
                                        borderRadius: '15px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        marginBottom: '10px'
                                    }}>
                                        {product.category}
                                    </span>
                                    <h3 style={{
                                        fontFamily: "'Playfair Display', serif",
                                        fontSize: '20px',
                                        fontWeight: '600',
                                        color: '#1a1a1a',
                                        marginBottom: '8px'
                                    }}>
                                        {product.name}
                                    </h3>
                                    <p style={{
                                        fontSize: '20px',
                                        fontWeight: '700',
                                        color: '#00b4a0'
                                    }}>
                                        {product.price}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <Link
                        to="/products"
                        style={{
                            display: 'inline-block',
                            marginTop: '50px',
                            padding: '15px 40px',
                            background: '#00b4a0',
                            color: '#fff',
                            borderRadius: '30px',
                            fontSize: '15px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#009688';
                            e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = '#00b4a0';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        View All Products
                    </Link>
                </div>
            </section>

            {/* Why Choose Us */}
            <section style={{
                padding: '100px 5%',
                background: 'linear-gradient(135deg, #00b4a0 0%, #009688 100%)',
                color: '#fff'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    textAlign: 'center'
                }}>
                    <p style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                        marginBottom: '15px',
                        opacity: '0.9'
                    }}>
                        WHY CHOOSE US
                    </p>
                    <h2 style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '42px',
                        fontWeight: '700',
                        marginBottom: '60px'
                    }}>
                        The Limpex Advantage
                    </h2>
                    
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '30px'
                    }}>
                        {whyChooseUs.map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '40px 25px',
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '20px',
                                    backdropFilter: 'blur(10px)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{
                                    width: '70px',
                                    height: '70px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 20px',
                                    fontSize: '28px'
                                }}>
                                    {item.icon}
                                </div>
                                <h3 style={{
                                    fontFamily: "'Playfair Display', serif",
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    marginBottom: '12px'
                                }}>
                                    {item.title}
                                </h3>
                                <p style={{
                                    fontSize: '14px',
                                    lineHeight: '1.7',
                                    opacity: '0.9'
                                }}>
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section style={{
                padding: '100px 5%',
                background: '#fff'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    textAlign: 'center'
                }}>
                    <p style={{
                        color: '#00b4a0',
                        fontSize: '13px',
                        fontWeight: '600',
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                        marginBottom: '15px'
                    }}>
                        TESTIMONIALS
                    </p>
                    <h2 style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '42px',
                        fontWeight: '700',
                        color: '#1a1a1a',
                        marginBottom: '60px'
                    }}>
                        What Our Clients Say
                    </h2>
                    
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '30px'
                    }}>
                        {testimonials.map((testimonial) => (
                            <div
                                key={testimonial.id}
                                style={{
                                    padding: '40px 30px',
                                    background: '#f8fafb',
                                    borderRadius: '20px',
                                    textAlign: 'left',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,180,160,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ color: '#ffc107', fontSize: '18px', marginBottom: '15px' }}>
                                    {'★'.repeat(testimonial.rating)}
                                </div>
                                <p style={{
                                    fontSize: '16px',
                                    lineHeight: '1.8',
                                    color: '#555',
                                    marginBottom: '25px',
                                    fontStyle: 'italic'
                                }}>
                                    "{testimonial.text}"
                                </p>
                                <div>
                                    <h4 style={{
                                        fontFamily: "'Playfair Display', serif",
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        color: '#1a1a1a',
                                        marginBottom: '5px'
                                    }}>
                                        {testimonial.name}
                                    </h4>
                                    <p style={{
                                        fontSize: '14px',
                                        color: '#00b4a0'
                                    }}>
                                        {testimonial.company}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" style={{
                padding: '100px 5%',
                background: '#f8fafb'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '60px'
                }}>
                    <div>
                        <p style={{
                            color: '#00b4a0',
                            fontSize: '13px',
                            fontWeight: '600',
                            letterSpacing: '3px',
                            textTransform: 'uppercase',
                            marginBottom: '15px'
                        }}>
                            {t('contactLabel')}
                        </p>
                        <h2 style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '42px',
                            fontWeight: '700',
                            color: '#1a1a1a',
                            marginBottom: '30px'
                        }}>
                            {t('contactTitle')}
                        </h2>
                        
                        <div style={{ marginBottom: '30px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '20px',
                                marginBottom: '25px'
                            }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    background: '#e8f5f3',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px',
                                    flexShrink: '0'
                                }}>
                                    📍
                                </div>
                                <div>
                                    <h4 style={{
                                        fontFamily: "'Playfair Display', serif",
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#1a1a1a',
                                        marginBottom: '5px'
                                    }}>
                                        Address
                                    </h4>
                                    <p style={{ fontSize: '15px', color: '#666', lineHeight: '1.6' }}>
                                        Mumbai, Maharashtra, India
                                    </p>
                                </div>
                            </div>
                            
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '20px',
                                marginBottom: '25px'
                            }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    background: '#e8f5f3',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px',
                                    flexShrink: '0'
                                }}>
                                    📞
                                </div>
                                <div>
                                    <h4 style={{
                                        fontFamily: "'Playfair Display', serif",
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#1a1a1a',
                                        marginBottom: '5px'
                                    }}>
                                        {t('navContact')}
                                    </h4>
                                    <a href="tel:+919892199247" style={{
                                        fontSize: '15px',
                                        color: '#666',
                                        textDecoration: 'none'
                                    }}>
                                        {t('phone')}
                                    </a>
                                </div>
                            </div>
                            
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '20px',
                                marginBottom: '25px'
                            }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    background: '#e8f5f3',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px',
                                    flexShrink: '0'
                                }}>
                                    ✉️
                                </div>
                                <div>
                                    <h4 style={{
                                        fontFamily: "'Playfair Display', serif",
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#1a1a1a',
                                        marginBottom: '5px'
                                    }}>
                                        Email
                                    </h4>
                                    <a href="mailto:info@limpex.com" style={{
                                        fontSize: '15px',
                                        color: '#666',
                                        textDecoration: 'none'
                                    }}>
                                        info@limpex.com
                                    </a>
                                </div>
                            </div>
                        </div>
                        
                        <a
                            href="https://wa.me/919892199247"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: '#25d366',
                                color: '#fff',
                                padding: '15px 30px',
                                borderRadius: '30px',
                                fontSize: '15px',
                                fontWeight: '600',
                                textDecoration: 'none',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#20bd5a';
                                e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = '#25d366';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            <span style={{ fontSize: '20px' }}>💬</span>
                            WhatsApp Order
                        </a>
                    </div>
                    
                    <div style={{
                        background: '#fff',
                        padding: '40px',
                        borderRadius: '20px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
                    }}>
                        <h3 style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '24px',
                            fontWeight: '600',
                            color: '#1a1a1a',
                            marginBottom: '25px'
                        }}>
                            Send Us a Message
                        </h3>
                        <form>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#333',
                                    marginBottom: '8px'
                                }}>
                                    {t('contactName')}
                                </label>
                                <input
                                    type="text"
                                    placeholder={t('contactName')}
                                    style={{
                                        width: '100%',
                                        padding: '14px 18px',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '10px',
                                        fontSize: '15px',
                                        transition: 'border-color 0.3s ease',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#00b4a0'}
                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#333',
                                    marginBottom: '8px'
                                }}>
                                    {t('contactEmail')}
                                </label>
                                <input
                                    type="email"
                                    placeholder={t('contactEmail')}
                                    style={{
                                        width: '100%',
                                        padding: '14px 18px',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '10px',
                                        fontSize: '15px',
                                        transition: 'border-color 0.3s ease',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#00b4a0'}
                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                />
                            </div>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#333',
                                    marginBottom: '8px'
                                }}>
                                    {t('contactMessage')}
                                </label>
                                <textarea
                                    placeholder={t('contactMessage')}
                                    rows="4"
                                    style={{
                                        width: '100%',
                                        padding: '14px 18px',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '10px',
                                        fontSize: '15px',
                                        resize: 'vertical',
                                        transition: 'border-color 0.3s ease',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#00b4a0'}
                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                />
                            </div>
                            <button
                                type="submit"
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    background: '#00b4a0',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#009688';
                                    e.target.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = '#00b4a0';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                {t('contactSend')}
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                background: '#1a1a1a',
                color: '#fff',
                padding: '80px 5% 30px'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr',
                        gap: '50px',
                        marginBottom: '60px'
                    }}>
                        <div>
                            <h3 style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: '32px',
                                fontWeight: '700',
                                color: '#00b4a0',
                                marginBottom: '20px'
                            }}>
                                {t('appName')}
                            </h3>
                            <p style={{
                                fontSize: '15px',
                                lineHeight: '1.8',
                                color: '#999',
                                marginBottom: '25px'
                            }}>
                                {t('footerDesc')}
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <a href="#" style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#00b4a0'}
                                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                                >
                                    f
                                </a>
                                <a href="#" style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#00b4a0'}
                                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                                >
                                    in
                                </a>
                                <a href="#" style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#00b4a0'}
                                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                                >
                                    tw
                                </a>
                            </div>
                        </div>
                        
                        <div>
                            <h4 style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: '18px',
                                fontWeight: '600',
                                marginBottom: '25px'
                            }}>
                                {t('footerQuickLinks')}
                            </h4>
                            <ul style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0
                            }}>
                                {[
                                    { label: t('navHome'), href: '#home' },
                                    { label: t('navAbout'), href: '#about' },
                                    { label: t('navServices'), href: '#services' },
                                    { label: 'Products', href: '#products' },
                                    { label: t('navContact'), href: '#contact' }
                                ].map((link, index) => (
                                    <li key={index} style={{ marginBottom: '12px' }}>
                                        <a
                                            href={link.href}
                                            style={{
                                                color: '#999',
                                                textDecoration: 'none',
                                                fontSize: '15px',
                                                transition: 'color 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => e.target.style.color = '#00b4a0'}
                                            onMouseLeave={(e) => e.target.style.color = '#999'}
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div>
                            <h4 style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: '18px',
                                fontWeight: '600',
                                marginBottom: '25px'
                            }}>
                                {t('footerServices')}
                            </h4>
                            <ul style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0
                            }}>
                                {[
                                    { label: t('service1Title'), href: '#services' },
                                    { label: t('service2Title'), href: '#services' },
                                    { label: t('service3Title'), href: '#services' }
                                ].map((link, index) => (
                                    <li key={index} style={{ marginBottom: '12px' }}>
                                        <a
                                            href={link.href}
                                            style={{
                                                color: '#999',
                                                textDecoration: 'none',
                                                fontSize: '15px',
                                                transition: 'color 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => e.target.style.color = '#00b4a0'}
                                            onMouseLeave={(e) => e.target.style.color = '#999'}
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div>
                            <h4 style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: '18px',
                                fontWeight: '600',
                                marginBottom: '25px'
                            }}>
                                {t('footerContact')}
                            </h4>
                            <ul style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0
                            }}>
                                <li style={{ marginBottom: '15px', color: '#999' }}>
                                    <span style={{ marginRight: '10px' }}>📍</span>
                                    Mumbai, Maharashtra
                                </li>
                                <li style={{ marginBottom: '15px' }}>
                                    <a href="tel:+919892199247" style={{
                                        color: '#999',
                                        textDecoration: 'none',
                                        transition: 'color 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => e.target.style.color = '#00b4a0'}
                                    onMouseLeave={(e) => e.target.style.color = '#999'}
                                    >
                                        <span style={{ marginRight: '10px' }}>📞</span>
                                        {t('phone')}
                                    </a>
                                </li>
                                <li style={{ marginBottom: '15px' }}>
                                    <a href="mailto:info@limpex.com" style={{
                                        color: '#999',
                                        textDecoration: 'none',
                                        transition: 'color 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => e.target.style.color = '#00b4a0'}
                                    onMouseLeave={(e) => e.target.style.color = '#999'}
                                    >
                                        <span style={{ marginRight: '10px' }}>✉️</span>
                                        info@limpex.com
                                    </a>
                                </li>
                                <li>
                                    <a href="https://wa.me/919892199247" style={{
                                        color: '#25d366',
                                        textDecoration: 'none',
                                        fontWeight: '500',
                                        transition: 'opacity 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                                    >
                                        <span style={{ marginRight: '10px' }}>💬</span>
                                        WhatsApp
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <div style={{
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        paddingTop: '30px',
                        textAlign: 'center'
                    }}>
                        <p style={{
                            fontSize: '14px',
                            color: '#666'
                        }}>
                            © 2026 {t('appName')}. {t('footerRights')}
                        </p>
                    </div>
                </div>
            </footer>

            {/* Floating WhatsApp Button */}
            <a
                href="https://wa.me/919892199247"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    width: '60px',
                    height: '60px',
                    background: '#25d366',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(37,211,102,0.4)',
                    zIndex: 1000,
                    transition: 'all 0.3s ease',
                    textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,211,102,0.5)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(37,211,102,0.4)';
                }}
            >
                <span style={{
                    fontSize: '28px',
                    color: '#fff'
                }}>
                    💬
                </span>
            </a>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
                
                @keyframes fadeSlide {
                    0%, 100% { opacity: 1; transform: translateY(0); }
                    50% { opacity: 0.8; transform: translateY(-5px); }
                }
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                html {
                    scroll-behavior: smooth;
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
