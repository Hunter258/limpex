import React, { createContext, useContext, useState } from 'react';

const translations = {
    en: {
        // Common
        appName: 'Limpex',
        phone: '+91.9892199247',
        
        // Navigation
        navHome: 'Home',
        navAbout: 'About',
        navServices: 'Services',
        navContact: 'Contact',
        navLogin: 'Login',
        
        // Hero
        heroWelcome: 'WELCOME TO LIMPEX',
        heroTitle: 'Your Trusted Partner in Customs Clearance',
        heroSubtitle: 'Professional customs brokerage services with decades of experience. We handle documentation, compliance, and clearance so your goods move smoothly across borders.',
        heroCta: 'GET STARTED',
        
        // About
        aboutLabel: 'ABOUT US',
        aboutTitle: 'Expert Customs Brokerage Solutions',
        aboutText: 'Limpex is a leading customs brokerage firm dedicated to simplifying international trade for businesses of all sizes. Our team of experienced professionals ensures your shipments clear customs efficiently and compliantly.',
        
        // Services
        servicesLabel: 'OUR SERVICES',
        servicesTitle: 'Comprehensive Trade Solutions',
        service1Title: 'Customs Clearance',
        service1Desc: 'Fast and efficient clearance of goods through customs authorities with full regulatory compliance.',
        service2Title: 'Documentation',
        service2Desc: 'Complete handling of all import/export documentation including bills of entry and shipping bills.',
        service3Title: 'Trade Consulting',
        service3Desc: 'Expert advice on trade regulations, tariff classifications, and duty optimization strategies.',
        
        // Contact
        contactLabel: 'GET IN TOUCH',
        contactTitle: 'Contact Us',
        contactName: 'Your Name',
        contactEmail: 'Your Email',
        contactMessage: 'Your Message',
        contactSend: 'Send Message',
        
        // Footer
        footerDesc: 'Leading customs brokerage firm providing seamless import and export clearance services across India.',
        footerQuickLinks: 'Quick Links',
        footerServices: 'Services',
        footerContact: 'Contact Info',
        footerRights: 'All rights reserved.',
        
        // Auth
        authSignIn: 'Sign In',
        authRegister: 'Register',
        authEmail: 'Email Address',
        authPassword: 'Password',
        authConfirmPassword: 'Confirm Password',
        authFirstName: 'First Name',
        authLastName: 'Last Name',
        authLoginButton: 'Sign In',
        authRegisterButton: 'Register',
        authNoAccount: "Don't have an account?",
        authHasAccount: 'Already have an account?',
        authRegisterHere: 'Register here',
        authLoginHere: 'Sign in here',
        authBackHome: '← Back to Home',
        authContactAdmin: 'Contact administrator for credentials',
        authSubtitle: 'Sign in to admin dashboard',
        
        // Dashboard
        dashTitle: 'Dashboard',
        dashTotalUsers: 'Total Users',
        dashActiveUsers: 'Active Users',
        dashTotalProducts: 'Total Products',
        dashTotalRequests: 'Total Requests',
        dashRecentActivity: 'Recent Activity',
        
        // Products
        prodTitle: 'Products',
        prodSearch: 'Search products...',
        prodAll: 'All',
        prodFruits: 'Fruits',
        prodVegetables: 'Vegetables',
        prodDryFruits: 'Dry Fruits',
        prodIndian: 'Indian',
        prodInternational: 'International',
        prodPerKg: '/kg',
        prodPerPiece: '/piece',
        prodPerBox: '/box',
        prodAddNew: 'Add New Product',
        
        // Users
        usersTitle: 'Users Management',
        usersAddNew: 'Add New User',
        
        // Analytics
        analyticsTitle: 'Analytics',
        
        // Audit
        auditTitle: 'Audit Logs',
        
        // Settings
        settingsTitle: 'Settings',
        
        // Language
        langLabel: 'Language',
        langEnglish: 'English',
        langHindi: 'हिन्दी',
        langMarathi: 'मराठी',
    },
    hi: {
        // Common
        appName: 'लिम्पेक्स',
        phone: '+91.9892199247',
        
        // Navigation
        navHome: 'होम',
        navAbout: 'हमारे बारे में',
        navServices: 'सेवाएं',
        navContact: 'संपर्क',
        navLogin: 'लॉगिन',
        
        // Hero
        heroWelcome: 'लिम्पेक्स में आपका स्वागत है',
        heroTitle: 'सीमा शुल्क निकासी में आपका विश्वसनीय साथी',
        heroSubtitle: 'दशकों के अनुभव वाली पेशेवर सीमा शुल्क दलाली सेवाएं। हम दस्तावेज़, अनुपालन और निकासी को संभालते हैं ताकि आपका माल सीमा पार आसानी से चले।',
        heroCta: 'शुरू करें',
        
        // About
        aboutLabel: 'हमारे बारे में',
        aboutTitle: 'विशेषज्ञ सीमा शुल्क दलाली समाधान',
        aboutText: 'लिम्पेक्स एक अग्रणी सीमा शुल्क दलाली फर्म है जो सभी आकार के व्यवसायों के लिए अंतर्राष्ट्रीय व्यापार को सरल बनाने के लिए समर्पित है।',
        
        // Services
        servicesLabel: 'हमारी सेवाएं',
        servicesTitle: 'व्यापक व्यापार समाधान',
        service1Title: 'सीमा शुल्क निकासी',
        service1Desc: 'पूर्ण नियामक अनुपालन के साथ सीमा शुल्क अधिकारियों के माध्यम से माल की तेज़ और कुशल निकासी।',
        service2Title: 'दस्तावेज़ीकरण',
        service2Desc: 'सभी आयात/निर्यात दस्तावेज़ों का पूर्ण प्रबंधन जिसमें बिल ऑफ एंट्री और शिपिंग बिल शामिल हैं।',
        service3Title: 'व्यापार परामर्श',
        service3Desc: 'व्यापार नियमों, शुल्क वर्गीकरण और शुल्क अनुकूलन रणनीतियों पर विशेषज्ञ सलाह।',
        
        // Contact
        contactLabel: 'संपर्क करें',
        contactTitle: 'हमसे संपर्क करें',
        contactName: 'आपका नाम',
        contactEmail: 'आपका ईमेल',
        contactMessage: 'आपका संदेश',
        contactSend: 'संदेश भेजें',
        
        // Footer
        footerDesc: 'भारत भर में निर्बाध आयात और निर्यात निकासी सेवाएं प्रदान करने वाली अग्रणी सीमा शुल्क दलाली फर्म।',
        footerQuickLinks: 'त्वरित लिंक',
        footerServices: 'सेवाएं',
        footerContact: 'संपर्क जानकारी',
        footerRights: 'सर्वाधिकार सुरक्षित।',
        
        // Auth
        authSignIn: 'साइन इन',
        authRegister: 'रजिस्टर',
        authEmail: 'ईमेल पता',
        authPassword: 'पासवर्ड',
        authConfirmPassword: 'पासवर्ड की पुष्टि करें',
        authFirstName: 'पहला नाम',
        authLastName: 'उपनाम',
        authLoginButton: 'साइन इन',
        authRegisterButton: 'रजिस्टर',
        authNoAccount: 'खाता नहीं है?',
        authHasAccount: 'पहले से खाता है?',
        authRegisterHere: 'यहाँ रजिस्टर करें',
        authLoginHere: 'यहाँ साइन इन करें',
        authBackHome: '← होम वापस',
        authContactAdmin: 'क्रेडेंशियल के लिए प्रशासक से संपर्क करें',
        authSubtitle: 'एडमिन डैशबोर्ड में साइन इन करें',
        
        // Dashboard
        dashTitle: 'डैशबोर्ड',
        dashTotalUsers: 'कुल उपयोगकर्ता',
        dashActiveUsers: 'सक्रिय उपयोगकर्ता',
        dashTotalProducts: 'कुल उत्पाद',
        dashTotalRequests: 'कुल अनुरोध',
        dashRecentActivity: 'हाल की गतिविधि',
        
        // Products
        prodTitle: 'उत्पाद',
        prodSearch: 'उत्पाद खोजें...',
        prodAll: 'सभी',
        prodFruits: 'फल',
        prodVegetables: 'सब्जियां',
        prodDryFruits: 'सूखे मेवे',
        prodIndian: 'भारतीय',
        prodInternational: 'अंतर्राष्ट्रीय',
        prodPerKg: '/किलो',
        prodPerPiece: '/टुकड़ा',
        prodPerBox: '/बॉक्स',
        prodAddNew: 'नया उत्पाद जोड़ें',
        
        // Users
        usersTitle: 'उपयोगकर्ता प्रबंधन',
        usersAddNew: 'नया उपयोगकर्ता जोड़ें',
        
        // Analytics
        analyticsTitle: 'एनालिटिक्स',
        
        // Audit
        auditTitle: 'ऑडिट लॉग',
        
        // Settings
        settingsTitle: 'सेटिंग्स',
        
        // Language
        langLabel: 'भाषा',
        langEnglish: 'English',
        langHindi: 'हिन्दी',
        langMarathi: 'मराठी',
    },
    mr: {
        // Common
        appName: 'लिम्पेक्स',
        phone: '+91.9892199247',
        
        // Navigation
        navHome: 'मुख्यपृष्ठ',
        navAbout: 'आमच्याबद्दल',
        navServices: 'सेवा',
        navContact: 'संपर्क',
        navLogin: 'लॉगिन',
        
        // Hero
        heroWelcome: 'लिम्पेक्समध्ये आपले स्वागत आहे',
        heroTitle: 'सीमा शुल्क मंजुरीमधील आपला विश्वसनीय साथी',
        heroSubtitle: 'दशकांच्या अनुभवासह व्यावसायिक सीमा शुल्क ब्रोकरेज सेवा. आम्ही कागदपत्रे, अनुसरण आणि मंजुरी हाताळतो जेणेकरून तुमचा माल सीमा ओलांडून सहज जातो.',
        heroCta: 'सुरू करा',
        
        // About
        aboutLabel: 'आमच्याबद्दल',
        aboutTitle: 'तज्ञ सीमा शुल्क ब्रोकरेज उपाय',
        aboutText: 'लिम्पेक्स ही आंतरराष्ट्रीय व्यापार सुलभ करण्यासाठी समर्पित एक अग्रगण्य सीमा शुल्क ब्रोकरेज फर्म आहे.',
        
        // Services
        servicesLabel: 'आमच्या सेवा',
        servicesTitle: 'सर्वसमावेशक व्यापार उपाय',
        service1Title: 'सीमा शुल्क मंजुरी',
        service1Desc: 'पूर्ण नियामक अनुसरणासह सीमा शुल्क अधिकाऱ्यांमधून मालाची जलद आणि कार्यक्षम मंजुरी.',
        service2Title: 'कागदपत्रे',
        service2Desc: 'बिल ऑफ एंट्री आणि शिपिंग बिल सह सर्व आयात/निर्यात कागदपत्रांचे संपूर्ण व्यवस्थापन.',
        service3Title: 'व्यापार सल्ला',
        service3Desc: 'व्यापार नियमे, भांडील वर्गीकरण आणि शुल्क अनुकूलन धोरणांवर तज्ञ सल्ला.',
        
        // Contact
        contactLabel: 'संपर्क करा',
        contactTitle: 'आमच्याशी संपर्क साधा',
        contactName: 'तुमचे नाव',
        contactEmail: 'तुमचा ईमेल',
        contactMessage: 'तुमचे संदेश',
        contactSend: 'संदेश पाठवा',
        
        // Footer
        footerDesc: 'संपूर्ण भारतात निर्बाध आयात आणि निर्यात मंजुरी सेवा प्रदान करणारी अग्रगण्य सीमा शुल्क ब्रोकरेज फर्म.',
        footerQuickLinks: 'झटपट दुवे',
        footerServices: 'सेवा',
        footerContact: 'संपर्क माहिती',
        footerRights: 'सर्व हक्क राखीव.',
        
        // Auth
        authSignIn: 'साइन इन',
        authRegister: 'नोंदणी',
        authEmail: 'ईमेल पत्ता',
        authPassword: 'पासवर्ड',
        authConfirmPassword: 'पासवर्ड पुष्टी करा',
        authFirstName: 'पहिले नाव',
        authLastName: 'आडनाव',
        authLoginButton: 'साइन इन',
        authRegisterButton: 'नोंदणी',
        authNoAccount: 'खाते नाही?',
        authHasAccount: 'आधीच खाते आहे?',
        authRegisterHere: 'येथे नोंदणी करा',
        authLoginHere: 'येथे साइन इन करा',
        authBackHome: '← मुख्यपृष्ठावर परत',
        authContactAdmin: 'क्रेडेंशियलसाठी प्रशासकाशी संपर्क करा',
        authSubtitle: 'अॅडमिन डॅशबोर्डमध्ये साइन इन करा',
        
        // Dashboard
        dashTitle: 'डॅशबोर्ड',
        dashTotalProducts: 'एकूण उत्पादने',
        dashTotalUsers: 'एकूण वापरकर्ते',
        dashActiveUsers: 'सक्रिय वापरकर्ते',
        dashTotalRequests: 'एकूण विनंत्या',
        dashRecentActivity: 'अलीकडील क्रियाकलाप',
        
        // Products
        prodTitle: 'उत्पादने',
        prodSearch: 'उत्पादने शोधा...',
        prodAll: 'सर्व',
        prodFruits: 'फळे',
        prodVegetables: 'भाजीपाला',
        prodDryFruits: 'कोरडे मेवे',
        prodIndian: 'भारतीय',
        prodInternational: 'आंतरराष्ट्रीय',
        prodPerKg: '/किलो',
        prodPerPiece: 'डोळ्यास',
        prodPerBox: '/बॉक्स',
        prodAddNew: 'नवीन उत्पादन जोडा',
        
        // Users
        usersTitle: 'वापरकर्ता व्यवस्थापन',
        usersAddNew: 'नवीन वापरकर्ता जोडा',
        
        // Analytics
        analyticsTitle: 'विश्लेषण',
        
        // Audit
        auditTitle: 'ऑडिट लॉग',
        
        // Settings
        settingsTitle: 'सेटिंग्ज',
        
        // Language
        langLabel: 'भाषा',
        langEnglish: 'English',
        langHindi: 'हिन्दी',
        langMarathi: 'मराठी',
    }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('limpex-lang') || 'en';
    });

    const changeLanguage = (lang) => {
        setLanguage(lang);
        localStorage.setItem('limpex-lang', lang);
    };

    const t = (key) => {
        return translations[language]?.[key] || translations.en[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export default LanguageContext;
