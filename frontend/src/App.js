import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import Analytics from './pages/Analytics';
import Products from './pages/Products';
import Layout from './components/Layout';
import './App.css';

const PrivateRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();
    
    if (loading) return <div className="loading">Loading...</div>;
    
    if (!user) return <Navigate to="/login" />;
    
    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/dashboard" />;
    }
    
    return children;
};

function App() {
    return (
        <LanguageProvider>
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        
                        <Route path="/admin" element={
                            <PrivateRoute>
                                <Layout />
                            </PrivateRoute>
                        }>
                            <Route index element={<Navigate to="/admin/dashboard" />} />
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="users" element={
                                <PrivateRoute roles={['super_admin', 'admin']}>
                                    <Users />
                                </PrivateRoute>
                            } />
                            <Route path="audit" element={
                                <PrivateRoute roles={['super_admin', 'admin']}>
                                    <AuditLogs />
                                </PrivateRoute>
                            } />
                            <Route path="analytics" element={
                                <PrivateRoute roles={['super_admin', 'admin', 'editor']}>
                                    <Analytics />
                                </PrivateRoute>
                            } />
                            <Route path="products" element={<Products />} />
                        </Route>
                        
                        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </LanguageProvider>
    );
}

export default App;
