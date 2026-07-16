import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const LandingPage = () => {
    const { language, changeLanguage, t } = useLanguage();
    const { addItem, getItemCount, setIsCartOpen } = useCart();
    const navigate = useNavigate();
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
        <div className="font-body text-gray-800">
            <style>{`
                .scroll-reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.7s ease-out, transform 0.7s ease-out; }
                .scroll-reveal.scroll-visible { opacity: 1; transform: translateY(0); }
                .scroll-reveal:nth-child(2) { transition-delay: 0.1s; }
                .scroll-reveal:nth-child(3) { transition-delay: 0.2s; }
                .scroll-reveal:nth-child(4) { transition-delay: 0.3s; }
                @keyframes fadeSlide {
                    0%, 100% { opacity: 1; transform: translateY(0); }
                    50% { opacity: 0.7; transform: translateY(-8px); }
                }
                .tagline-text { animation: fadeSlide 3s ease-in-out infinite; }
                .nav-link { position: relative; }
                .nav-link::after { content: ''; position: absolute; bottom: -5px; left: 50%; width: 0; height: 2px; background: #00b4a0; transition: all 0.3s ease; transform: translateX(-50%); }
                .nav-link:hover::after { width: 100%; }
            `}</style>

            {/* Language Switcher */}
            <div className="fixed top-2.5 right-5 z-[1001] flex gap-1.5 bg-white/95 px-2.5 py-1.5 rounded-full shadow-lg backdrop-blur-md">
                {['en', 'hi', 'mr'].map((lang) => (
                    <button
                        key={lang}
                        onClick={() => changeLanguage(lang)}
                        className={`px-3 py-1 rounded-full text-xs font-body transition-all duration-300 ${
                            language === lang
                                ? 'bg-brand-500 text-white font-bold'
                                : 'text-gray-500 font-normal hover:text-gray-700'
                        }`}
                    >
                        {lang === 'en' ? 'EN' : lang === 'hi' ? 'हि' : 'मर'}
                    </button>
                ))}
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-[15px] px-[5%] py-3 flex justify-between items-center shadow-[0_1px_30px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-2 font-display text-[26px] font-bold text-brand-500 tracking-wide">
                    <span className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-base font-extrabold">
                        L
                    </span>
                    {t('appName')}
                </div>

                <div className="hidden md:flex gap-8 items-center">
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
                                className="nav-link text-sm font-medium text-gray-700 hover:text-brand-500 transition-colors"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <a
                                key={index}
                                href={item.href}
                                className="nav-link text-sm font-medium text-gray-700 hover:text-brand-500 transition-colors"
                            >
                                {item.label}
                            </a>
                        )
                    ))}
                    <Link
                        to="/login"
                        className="btn-brand text-[13px] !px-5 !py-2.5 !rounded-full shadow-[0_4px_15px_rgba(0,180,160,0.3)]"
                    >
                        {t('navLogin')}
                    </Link>
                    <Link
                        to="/cart"
                        className="btn-brand-outline relative !flex !items-center gap-1.5 text-[13px] !px-4 !py-2.5 !rounded-full"
                    >
                        🛒 Cart {getItemCount() > 0 && <span className="bg-brand-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[11px] font-extrabold">{getItemCount()}</span>}
                    </Link>
                </div>

                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden bg-transparent border-none text-2xl cursor-pointer text-gray-700"
                >
                    {isMenuOpen ? '✕' : '☰'}
                </button>

                {isMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl shadow-lg px-[5%] py-4 flex flex-col gap-4 animate-slide-down">
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
                                    onClick={() => setIsMenuOpen(false)}
                                    className="text-sm font-medium text-gray-700 hover:text-brand-500 transition-colors"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <a
                                    key={index}
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="text-sm font-medium text-gray-700 hover:text-brand-500 transition-colors"
                                >
                                    {item.label}
                                </a>
                            )
                        ))}
                        <div className="flex gap-3 mt-2">
                            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="btn-brand text-[13px] !px-5 !py-2.5 !rounded-full text-center">
                                {t('navLogin')}
                            </Link>
                            <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="btn-brand-outline relative !flex !items-center justify-center gap-1.5 text-[13px] !px-4 !py-2.5 !rounded-full">
                                🛒 Cart {getItemCount() > 0 && <span className="bg-brand-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[11px] font-extrabold">{getItemCount()}</span>}
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section id="home" className="relative min-h-screen flex items-center overflow-hidden px-[5%]">
                <img
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-hero-gradient" />
                <div className="absolute -top-1/2 -right-[20%] w-[600px] h-[600px] rounded-full bg-white/[0.08] blur-[60px]" />
                <div className="absolute -bottom-[30%] -left-[10%] w-[400px] h-[400px] rounded-full bg-white/[0.05] blur-[40px]" />

                <div className="animate-fade-in relative z-10 max-w-[650px] pt-20">
                    <div className="inline-flex items-center gap-2 bg-white/15 px-4 py-2 rounded-full mb-6 backdrop-blur-md">
                        <span className="text-sm">🌿</span>
                        <span className="text-white/95 text-[13px] font-medium tracking-widest uppercase">
                            {t('heroWelcome')}
                        </span>
                    </div>

                    <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-5 drop-shadow-sm">
                        {t('heroTitle')}
                    </h1>

                    <div className="h-[50px] overflow-hidden mb-6">
                        <h2 className="tagline-text font-display text-[28px] font-semibold text-white drop-shadow-sm">
                            {taglines[currentTagline]}
                        </h2>
                    </div>

                    <p className="text-white/90 text-lg leading-relaxed mb-9 max-w-[520px] font-light">
                        {t('heroSubtitle')}
                    </p>

                    <div className="flex gap-3.5 flex-wrap">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 bg-white text-brand-500 px-8 py-3.5 rounded-full text-sm font-bold no-underline transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.2)] tracking-wide hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(0,0,0,0.25)]"
                        >
                            🛒 {t('heroCta')}
                        </Link>
                        <a
                            href="#shop"
                            className="inline-flex items-center gap-2 bg-transparent text-white px-8 py-3.5 rounded-full text-sm font-semibold no-underline border-2 border-white/50 transition-all duration-300 tracking-wide hover:bg-white hover:text-brand-500 hover:border-white"
                        >
                            📦 Explore Products
                        </a>
                        <a
                            href="https://wa.me/919892199247"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-[#25d366] text-white px-8 py-3.5 rounded-full text-sm font-semibold no-underline transition-all duration-300 shadow-[0_4px_15px_rgba(37,211,102,0.4)] hover:-translate-y-0.5"
                        >
                            💬 WhatsApp Order
                        </a>
                    </div>

                    <div className="flex gap-8 mt-10 pt-8 border-t border-white/20">
                        <div>
                            <h3 className="text-white text-[28px] font-bold font-display">25+</h3>
                            <p className="text-white/80 text-[13px]">Years Experience</p>
                        </div>
                        <div>
                            <h3 className="text-white text-[28px] font-bold font-display">10K+</h3>
                            <p className="text-white/80 text-[13px]">Shipments Cleared</p>
                        </div>
                        <div>
                            <h3 className="text-white text-[28px] font-bold font-display">500+</h3>
                            <p className="text-white/80 text-[13px]">Happy Clients</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Bar */}
            <section className="bg-white py-6 px-[5%] border-b border-gray-100">
                <div className="max-w-[1200px] mx-auto flex justify-around items-center flex-wrap gap-5">
                    {[
                        { icon: '✓', label: '100% Organic Certified' },
                        { icon: '🚚', label: 'Same Day Delivery' },
                        { icon: '🔒', label: 'Secure Payments' },
                        { icon: '📞', label: '24/7 Customer Support' },
                        { icon: '♻️', label: 'Eco-Friendly Packaging' }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-brand-500 text-base">{item.icon}</span>
                            <span className="text-[13px] font-medium text-gray-500">{item.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Shop by Category */}
            <section id="shop" className="py-20 px-[5%] bg-brand-50/30 scroll-mt-20">
                <div className="max-w-[1200px] mx-auto text-center">
                    <p className="section-label">BROWSE BY CATEGORY</p>
                    <h2 className="section-title mb-4">Shop Fresh Categories</h2>
                    <p className="section-subtitle mx-auto mb-12 text-center">
                        Discover our wide range of fresh produce sourced from the best farms across India and around the world
                    </p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
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
                                className={`group bg-white rounded-2xl overflow-hidden cursor-pointer shadow-card transition-all duration-300 hover:-translate-y-2 hover:shadow-card-hover border-2 ${activeCategory === cat.filter ? 'border-brand-500' : 'border-transparent hover:border-brand-500/20'}`}
                                onClick={() => {
                                    setActiveCategory(cat.filter);
                                    setTimeout(() => {
                                        document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }, 150);
                                }}
                            >
                                <div className="h-[140px] overflow-hidden relative">
                                    <img
                                        src={cat.img}
                                        alt={cat.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <span
                                        className="absolute top-2.5 right-2.5 text-white px-2.5 py-1 rounded-xl text-[11px] font-semibold"
                                        style={{ background: cat.color }}
                                    >
                                        {cat.count} items
                                    </span>
                                </div>
                                <div className="p-4 text-left">
                                    <h3 className="font-body text-sm font-bold text-gray-900 mb-1">
                                        {cat.name}
                                    </h3>
                                    <p className="text-xs text-gray-400">{cat.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Products Section */}
            <section id="products" className="py-20 px-[5%] bg-white scroll-mt-20">
                <div className="max-w-[1200px] mx-auto text-center">
                    <p className="section-label">FEATURED PRODUCTS</p>
                    <h2 className="section-title mb-4">Fresh From Farm to Your Table</h2>
                    <p className="section-subtitle mx-auto mb-10 text-center">
                        Handpicked produce delivered fresh to your doorstep
                    </p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                        {loadingProducts ? (
                            Array(8).fill(0).map((_, i) => (
                                <div key={i} className="skeleton h-[280px] rounded-2xl" />
                            ))
                        ) : (
                            filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="group bg-white rounded-2xl overflow-hidden shadow-card border border-gray-100 relative transition-all duration-300 hover:-translate-y-3 hover:shadow-card-hover"
                                >
                                    <div className="h-[180px] overflow-hidden relative">
                                        <img
                                            src={product.image_url || 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400'}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        {product.is_organic && (
                                            <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-[10px] text-[10px] font-bold text-white uppercase tracking-[0.5px] bg-gradient-to-br from-green-500 to-green-600">
                                                🌿 Organic
                                            </span>
                                        )}
                                        <span className="absolute top-2.5 right-2.5 bg-black/60 text-white px-2 py-1 rounded-lg text-[10px] font-semibold">
                                            {getOriginLabel(product.origin_country)}
                                        </span>
                                    </div>
                                    <div className="p-4 text-left">
                                        <span className="inline-block bg-brand-50 text-brand-500 px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase mb-2">
                                            {getCategoryLabel(product.category_type || product.parent_category)}
                                        </span>
                                        <h3 className="font-body text-sm font-bold text-gray-900 mb-1.5 leading-snug">
                                            {product.name}
                                        </h3>
                                        <p className="text-[11px] text-gray-400 mb-2.5 leading-relaxed">
                                            {product.description ? product.description.substring(0, 60) + '...' : ''}
                                        </p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-base font-extrabold text-brand-500">
                                                ₹{product.price}/{product.unit || 'kg'}
                                            </span>
                                            <span className="text-[11px] text-gray-400">
                                                Stock: {product.stock_quantity}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                addItem(product, 1);
                                                navigate('/cart');
                                            }}
                                            className="w-full mt-2.5 py-2.5 bg-gradient-to-br from-brand-500 to-brand-600 text-white border-none rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,180,160,0.2)] font-body hover:shadow-[0_4px_12px_rgba(0,180,160,0.3)] hover:-translate-y-0.5"
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
                        className="btn-brand text-sm !px-9 !py-3.5 !rounded-full shadow-[0_6px_20px_rgba(0,180,160,0.3)] tracking-wide"
                    >
                        View All {products.length} Products →
                    </Link>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="scroll-reveal py-20 px-[5%] bg-brand-50/30 scroll-mt-20">
                <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <p className="section-label">{t('aboutLabel')}</p>
                        <h2 className="font-display text-[36px] font-bold text-gray-900 leading-tight mb-5">
                            {t('aboutTitle')}
                        </h2>
                        <p className="text-base leading-relaxed text-gray-500 mb-6">
                            {t('aboutText')}
                        </p>
                        <div className="flex gap-10">
                            <div className="text-center">
                                <h3 className="font-display text-[32px] font-bold text-brand-500">25+</h3>
                                <p className="text-[13px] text-gray-500">Years Experience</p>
                            </div>
                            <div className="text-center">
                                <h3 className="font-display text-[32px] font-bold text-brand-500">10K+</h3>
                                <p className="text-[13px] text-gray-500">Shipments Cleared</p>
                            </div>
                            <div className="text-center">
                                <h3 className="font-display text-[32px] font-bold text-brand-500">500+</h3>
                                <p className="text-[13px] text-gray-500">Happy Clients</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-3xl overflow-hidden shadow-elevated relative">
                        <img
                            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600"
                            alt="Trade operations"
                            className="w-full h-[400px] object-cover"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-8 text-white">
                            <p className="text-sm font-semibold">Trusted by 500+ businesses across India</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="scroll-reveal py-20 px-[5%] bg-white scroll-mt-20">
                <div className="max-w-[1200px] mx-auto text-center">
                    <p className="section-label">{t('servicesLabel')}</p>
                    <h2 className="section-title mb-12">{t('servicesTitle')}</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {services.map((service, index) => (
                            <div
                                key={index}
                                className="group py-10 px-8 rounded-[20px] bg-brand-50/30 border border-gray-100 transition-all duration-300 hover:-translate-y-3 hover:shadow-card-hover"
                            >
                                <div className="w-[70px] h-[70px] rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center mx-auto mb-5 text-[28px] shadow-[0_8px_25px_rgba(0,180,160,0.3)]">
                                    {service.icon}
                                </div>
                                <h3 className="font-display text-xl font-semibold text-gray-900 mb-3">
                                    {t(service.titleKey)}
                                </h3>
                                <p className="text-sm leading-relaxed text-gray-500">
                                    {t(service.descKey)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="scroll-reveal py-20 px-[5%] bg-brand-500 text-white relative overflow-hidden">
                <div className="absolute -top-1/2 -right-[20%] w-[500px] h-[500px] rounded-full bg-white/[0.05] blur-[40px]" />
                <div className="max-w-[1200px] mx-auto text-center relative z-10">
                    <p className="text-xs font-bold tracking-[3px] uppercase mb-3 opacity-90">
                        WHY CHOOSE US
                    </p>
                    <h2 className="font-display text-3xl md:text-4xl lg:text-[38px] font-bold mb-12">
                        The Limpex Advantage
                    </h2>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                        {whyChooseUs.map((item, index) => (
                            <div
                                key={index}
                                className="group py-9 px-5 bg-white/[0.12] rounded-[20px] backdrop-blur-md border border-white/[0.15] transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/20"
                            >
                                <div className="w-[60px] h-[60px] rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 text-2xl">
                                    {item.icon}
                                </div>
                                <h3 className="font-display text-lg font-semibold mb-2.5">
                                    {item.title}
                                </h3>
                                <p className="text-[13px] leading-relaxed opacity-90">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="scroll-reveal py-20 px-[5%] bg-brand-50/30">
                <div className="max-w-[1200px] mx-auto text-center">
                    <p className="section-label">TESTIMONIALS</p>
                    <h2 className="section-title mb-12">What Our Clients Say</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((testimonial) => (
                            <div
                                key={testimonial.id}
                                className="group text-left py-9 px-7 bg-white rounded-[20px] shadow-card border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-elevated"
                            >
                                <div className="text-amber-400 text-base mb-3 tracking-wider">
                                    {'★'.repeat(testimonial.rating)}
                                </div>
                                <p className="text-[15px] leading-relaxed text-gray-500 mb-5 italic">
                                    "{testimonial.text}"
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-base font-bold shrink-0">
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-body text-sm font-bold text-gray-900 mb-0.5">
                                            {testimonial.name}
                                        </h4>
                                        <p className="text-xs text-brand-500 font-medium">
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
            <section className="py-16 px-[5%] bg-brand-500 text-white text-center">
                <div className="max-w-[600px] mx-auto">
                    <h2 className="font-display text-[32px] font-bold mb-4">
                        Get Fresh Deals Delivered
                    </h2>
                    <p className="text-[15px] opacity-90 mb-6">
                        Subscribe to our newsletter for exclusive offers and farm-fresh updates
                    </p>
                    <div className="flex gap-2.5 max-w-[450px] mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-5 py-3.5 border-none rounded-full text-sm outline-none text-gray-800 placeholder-gray-400"
                        />
                        <button className="px-7 py-3.5 bg-white text-brand-500 border-none rounded-full text-sm font-bold cursor-pointer transition-all duration-300 hover:shadow-lg">
                            Subscribe
                        </button>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="scroll-reveal py-20 px-[5%] bg-white scroll-mt-20">
                <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
                    <div>
                        <p className="section-label">{t('contactLabel')}</p>
                        <h2 className="font-display text-[36px] font-bold text-gray-900 mb-6">
                            {t('contactTitle')}
                        </h2>

                        <div className="mb-6">
                            {[
                                { icon: '📍', title: 'Address', value: 'Mumbai, Maharashtra, India' },
                                { icon: '📞', title: t('navContact'), value: t('phone'), href: 'tel:+919892199247' },
                                { icon: '✉️', title: 'Email', value: 'info@limpex.com', href: 'mailto:info@limpex.com' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4 mb-5">
                                    <div className="w-[45px] h-[45px] rounded-xl bg-brand-50 flex items-center justify-center text-lg shrink-0">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 mb-0.5">{item.title}</h4>
                                        {item.href ? (
                                            <a href={item.href} className="text-sm text-gray-500 no-underline hover:text-brand-500 transition-colors">{item.value}</a>
                                        ) : (
                                            <p className="text-sm text-gray-500">{item.value}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <a
                            href="https://wa.me/919892199247"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2.5 bg-[#25d366] text-white px-7 py-3.5 rounded-full text-sm font-semibold no-underline transition-all duration-300 shadow-[0_6px_20px_rgba(37,211,102,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(37,211,102,0.4)] animate-pulse-soft"
                        >
                            <span className="text-lg">💬</span>
                            WhatsApp Order
                        </a>
                    </div>

                    <div className="bg-brand-50/30 p-9 rounded-[20px] border border-gray-100">
                        <h3 className="font-display text-[22px] font-semibold text-gray-900 mb-5">
                            Send Us a Message
                        </h3>
                        <form>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder={t('contactName')}
                                    className="input-field"
                                />
                            </div>
                            <div className="mb-4">
                                <input
                                    type="email"
                                    placeholder={t('contactEmail')}
                                    className="input-field"
                                />
                            </div>
                            <div className="mb-5">
                                <textarea
                                    placeholder={t('contactMessage')}
                                    rows="4"
                                    className="input-field resize-y"
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn-brand w-full !py-3.5 !rounded-xl shadow-[0_6px_20px_rgba(0,180,160,0.3)] text-sm"
                            >
                                {t('contactSend')} →
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-brand-950 text-white pt-[70px] px-[5%] pb-6">
                <div className="max-w-[1200px] mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">
                        <div>
                            <h3 className="font-display text-[28px] font-bold text-brand-500 mb-4 flex items-center gap-2.5">
                                <span className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-base font-extrabold">
                                    L
                                </span>
                                {t('appName')}
                            </h3>
                            <p className="text-sm leading-relaxed text-gray-400 mb-5">
                                {t('footerDesc')}
                            </p>
                            <div className="flex gap-2.5">
                                {[
                                    { label: 'f', href: 'https://facebook.com/limpexcustoms', title: 'Facebook' },
                                    { label: 'in', href: 'https://linkedin.com/company/limpex', title: 'LinkedIn' },
                                    { label: '𝕏', href: 'https://twitter.com/limpexcustoms', title: 'Twitter' },
                                    { label: '📷', href: 'https://instagram.com/limpexcustoms', title: 'Instagram' }
                                ].map((social, i) => (
                                    <a
                                        key={i}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={social.title}
                                        className="w-[38px] h-[38px] rounded-full bg-white/[0.08] flex items-center justify-center text-white no-underline transition-all duration-300 text-[13px] font-semibold hover:bg-brand-500"
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
                                <h4 className="font-display text-base font-semibold mb-5">
                                    {section.title}
                                </h4>
                                <ul className="list-none p-0 m-0">
                                    {section.links.map((link, j) => (
                                        <li key={j} className="mb-2.5">
                                            {link.href.startsWith('/') ? (
                                                <Link
                                                    to={link.href}
                                                    className="text-gray-400 no-underline text-[13px] transition-colors duration-300 leading-loose hover:text-brand-500"
                                                >
                                                    {link.label}
                                                </Link>
                                            ) : (
                                                <a
                                                    href={link.href}
                                                    className="text-gray-400 no-underline text-[13px] transition-colors duration-300 leading-loose hover:text-brand-500"
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

                    <div className="border-t border-white/[0.08] pt-6 flex justify-between items-center flex-wrap gap-4">
                        <p className="text-[13px] text-gray-500">
                            © 2026 {t('appName')}. {t('footerRights')}
                        </p>
                        <div className="flex gap-5">
                            <a href="#" className="text-gray-500 no-underline text-xs transition-colors duration-300 hover:text-brand-500">Privacy Policy</a>
                            <a href="#" className="text-gray-500 no-underline text-xs transition-colors duration-300 hover:text-brand-500">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Floating Cart Button */}
            <Link
                to="/cart"
                className="fixed bottom-[90px] right-6 w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,180,160,0.5)] z-[1000] no-underline animate-pulse-soft"
            >
                <span className="text-2xl text-white">🛒</span>
                {getItemCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-extrabold border-2 border-white">
                        {getItemCount()}
                    </span>
                )}
            </Link>

            {/* Floating WhatsApp Button */}
            <a
                href="https://wa.me/919892199247"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 w-14 h-14 bg-[#25d366] rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(37,211,102,0.5)] z-[1000] no-underline animate-pulse-soft"
            >
                <span className="text-[26px] text-white">💬</span>
            </a>
        </div>
    );
};

export default LandingPage;
