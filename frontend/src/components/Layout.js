import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { language, changeLanguage, t } = useLanguage();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const getInitials = () => {
        const first = user.firstName?.[0] || '';
        const last = user.lastName?.[0] || '';
        return (first + last).toUpperCase() || user.email[0].toUpperCase();
    };

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="flex min-h-screen">
            {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={closeSidebar}></div>}

            <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-brand-950 text-white flex flex-col transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-5 border-b border-white/10">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="font-display text-lg font-bold m-0">{t('appName')}</h2>
                            <p className="text-xs text-white/50 m-0">Admin Dashboard</p>
                        </div>
                        <button onClick={closeSidebar} className="text-white/60 hover:text-white text-2xl leading-none bg-transparent border-none cursor-pointer lg:hidden" aria-label="Close sidebar">&times;</button>
                    </div>
                </div>

                <nav className="flex-1 py-4 px-3 overflow-y-auto">
                    <ul className="space-y-1 list-none m-0 p-0">
                        <li>
                            <NavLink to="/admin/dashboard" className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-brand-500/20 text-white' : 'text-white/70 hover:bg-brand-800 hover:text-white'}`} onClick={closeSidebar}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                {t('dashTitle')}
                            </NavLink>
                        </li>

                        <li>
                            <NavLink to="/admin/products" className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-brand-500/20 text-white' : 'text-white/70 hover:bg-brand-800 hover:text-white'}`} onClick={closeSidebar}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                {t('prodTitle')}
                            </NavLink>
                        </li>

                        <li>
                            <NavLink to="/admin/orders" className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-brand-500/20 text-white' : 'text-white/70 hover:bg-brand-800 hover:text-white'}`} onClick={closeSidebar}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                Orders & Delivery
                            </NavLink>
                        </li>

                        {(user.role === 'super_admin' || user.role === 'admin') && (
                            <li>
                                <NavLink to="/admin/users" className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-brand-500/20 text-white' : 'text-white/70 hover:bg-brand-800 hover:text-white'}`} onClick={closeSidebar}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    {t('usersTitle')}
                                </NavLink>
                            </li>
                        )}

                        {(user.role === 'super_admin' || user.role === 'admin') && (
                            <li>
                                <NavLink to="/admin/audit" className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-brand-500/20 text-white' : 'text-white/70 hover:bg-brand-800 hover:text-white'}`} onClick={closeSidebar}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                    {t('auditTitle')}
                                </NavLink>
                            </li>
                        )}

                        {(user.role === 'super_admin' || user.role === 'admin' || user.role === 'editor') && (
                            <li>
                                <NavLink to="/admin/analytics" className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-brand-500/20 text-white' : 'text-white/70 hover:bg-brand-800 hover:text-white'}`} onClick={closeSidebar}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    {t('analyticsTitle')}
                                </NavLink>
                            </li>
                        )}
                    </ul>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex gap-1.5 mb-3 justify-center">
                        <button className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${language === 'en' ? 'bg-brand-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`} onClick={() => changeLanguage('en')}>EN</button>
                        <button className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${language === 'hi' ? 'bg-brand-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`} onClick={() => changeLanguage('hi')}>HI</button>
                        <button className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${language === 'mr' ? 'bg-brand-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`} onClick={() => changeLanguage('mr')}>MR</button>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{getInitials()}</div>
                        <div className="min-w-0">
                            <h4 className="text-sm font-semibold m-0 truncate">{user.firstName || user.email}</h4>
                            <p className="text-[11px] text-white/50 m-0">{user.role}</p>
                        </div>
                    </div>
                    <button className="w-full py-2 bg-white/10 hover:bg-white/20 text-white border-none rounded-lg text-xs font-semibold cursor-pointer transition-colors" onClick={handleLogout}>Sign Out</button>
                </div>
            </aside>

            <div className="flex-1 min-h-screen bg-gray-50">
                <button className="lg:hidden sticky top-0 z-30 w-full bg-white border-b border-gray-200 p-3 flex items-center justify-center text-gray-700 cursor-pointer" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div className="p-6 lg:p-8">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Layout;
