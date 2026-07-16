import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import './App.css';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/Users'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Products = lazy(() => import('./pages/Products'));
const CartPage = lazy(() => import('./pages/CartPage'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const OrdersAdmin = lazy(() => import('./pages/OrdersAdmin'));
const NotFound = lazy(() => import('./pages/NotFound'));

const LoadingSpinner = () => (
    <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
    </div>
);

const PrivateRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();

    if (loading) return <LoadingSpinner />;

    if (!user) return <Navigate to="/login" replace />;

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    return children;
};

function App() {
    return (
        <ErrorBoundary>
            <LanguageProvider>
                <AuthProvider>
                    <CartProvider>
                        <Router>
                            <Suspense fallback={<LoadingSpinner />}>
                                <Routes>
                                    <Route path="/" element={<LandingPage />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/products" element={<Products />} />
                                    <Route path="/cart" element={<CartPage />} />
                                    <Route path="/track-order" element={<OrderTracking />} />
                                    <Route path="/track-order/:orderId" element={<OrderTracking />} />

                                    <Route path="/admin" element={
                                        <PrivateRoute>
                                            <Layout />
                                        </PrivateRoute>
                                    }>
                                        <Route index element={<Navigate to="/admin/dashboard" replace />} />
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
                                        <Route path="products" element={
                                            <PrivateRoute roles={['super_admin', 'admin']}>
                                                <Products />
                                            </PrivateRoute>
                                        } />
                                        <Route path="orders" element={
                                            <PrivateRoute roles={['super_admin', 'admin']}>
                                                <OrdersAdmin />
                                            </PrivateRoute>
                                        } />
                                    </Route>

                                    <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
                                    <Route path="*" element={<NotFound />} />
                                </Routes>
                            </Suspense>
                        </Router>
                    </CartProvider>
                </AuthProvider>
            </LanguageProvider>
        </ErrorBoundary>
    );
}

export default App;
