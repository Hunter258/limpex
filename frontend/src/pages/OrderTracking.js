import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
const statusLabels = {
    pending: 'Order Placed',
    confirmed: 'Order Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered'
};
const statusIcons = {
    pending: '📋',
    confirmed: '✅',
    processing: '⚙️',
    shipped: '🚚',
    out_for_delivery: '🏃',
    delivered: '🎉'
};

const OrderTracking = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [searchId, setSearchId] = useState(orderId || '');
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const trackOrder = async (id) => {
        if (!id) return;
        setLoading(true);
        setError('');
        setOrderData(null);
        try {
            const res = await axios.get(`/api/orders/track/${id}`);
            setOrderData(res.data);
        } catch (err) {
            setError('Order not found. Please check your order number and try again.');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (orderId) {
            trackOrder(orderId);
            setSearchId(orderId);
        }
    }, [orderId]);

    const currentStepIndex = orderData ? statusSteps.indexOf(orderData.order?.status) : -1;

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafb' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
            `}</style>

            <div style={{ background: 'linear-gradient(135deg, #00b4a0, #009688)', padding: '2.5rem 2rem', color: 'white', textAlign: 'center' }}>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: '800', margin: '0 0 0.5rem 0' }}>📦 Track Your Order</h1>
                <p style={{ fontSize: '1rem', opacity: 0.9, margin: 0 }}>Enter your order number to track delivery status</p>
            </div>

            <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '2rem', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            placeholder="Enter Order Number (e.g., 1)"
                            value={searchId}
                            onChange={e => setSearchId(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && trackOrder(searchId)}
                            style={{ flex: 1, padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', outline: 'none', fontFamily: 'Inter, sans-serif', transition: 'border-color 0.2s' }}
                            onFocus={e => e.target.style.borderColor = '#00b4a0'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        />
                        <button
                            onClick={() => trackOrder(searchId)}
                            disabled={loading}
                            style={{ padding: '14px 28px', background: 'linear-gradient(135deg, #00b4a0, #009688)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(0,180,160,0.3)', whiteSpace: 'nowrap' }}
                        >
                            {loading ? '...' : 'Track'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ fontSize: '40px', marginBottom: '0.5rem' }}>🔍</div>
                        <p style={{ color: '#dc2626', fontSize: '15px' }}>{error}</p>
                    </div>
                )}

                {orderData && orderData.order && (
                    <div>
                        {/* Order Info Card */}
                        <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '1.5rem', border: '1px solid #f0f0f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div>
                                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>Order #{orderData.order.id}</h3>
                                    <p style={{ fontSize: '13px', color: '#888', margin: '4px 0 0 0' }}>
                                        Placed on {new Date(orderData.order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <span style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', background: orderData.order.status === 'delivered' ? '#dcfce7' : orderData.order.status === 'out_for_delivery' ? '#dbeafe' : '#fef3c7', color: orderData.order.status === 'delivered' ? '#166534' : orderData.order.status === 'out_for_delivery' ? '#1e40af' : '#92400e' }}>
                                    {statusIcons[orderData.order.status]} {statusLabels[orderData.order.status] || orderData.order.status}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '14px' }}>
                                <div>
                                    <p style={{ color: '#888', margin: '0 0 2px 0', fontSize: '12px', textTransform: 'uppercase', fontWeight: '600' }}>Customer</p>
                                    <p style={{ color: '#1a1a1a', fontWeight: '600', margin: 0 }}>{orderData.order.customer_name}</p>
                                </div>
                                <div>
                                    <p style={{ color: '#888', margin: '0 0 2px 0', fontSize: '12px', textTransform: 'uppercase', fontWeight: '600' }}>Total</p>
                                    <p style={{ color: '#00b4a0', fontWeight: '800', margin: 0, fontSize: '18px' }}>₹{orderData.order.total_amount}</p>
                                </div>
                                <div>
                                    <p style={{ color: '#888', margin: '0 0 2px 0', fontSize: '12px', textTransform: 'uppercase', fontWeight: '600' }}>Payment</p>
                                    <p style={{ color: '#1a1a1a', fontWeight: '600', margin: 0, textTransform: 'capitalize' }}>{orderData.order.payment_method === 'cod' ? 'Cash on Delivery' : orderData.order.payment_method === 'upi' ? 'UPI Payment' : orderData.order.payment_method === 'card' ? 'Card Payment' : orderData.order.payment_method}</p>
                                </div>
                                <div>
                                    <p style={{ color: '#888', margin: '0 0 2px 0', fontSize: '12px', textTransform: 'uppercase', fontWeight: '600' }}>Delivery Address</p>
                                    <p style={{ color: '#1a1a1a', fontWeight: '600', margin: 0, fontSize: '13px' }}>{orderData.order.delivery_address}</p>
                                </div>
                            </div>
                            {orderData.order.delivery_estimate && (
                                <div style={{ marginTop: '1rem', padding: '12px 16px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '20px' }}>📦</span>
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#166534', margin: 0 }}>Estimated Delivery</p>
                                        <p style={{ fontSize: '12px', color: '#00b4a0', margin: '2px 0 0 0' }}>{orderData.order.delivery_estimate}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Progress Tracker */}
                        <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '1.5rem', border: '1px solid #f0f0f0' }}>
                            <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: '700', color: '#1a1a1a', marginBottom: '1.5rem' }}>Delivery Progress</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 10px' }}>
                                <div style={{ position: 'absolute', top: '18px', left: '30px', right: '30px', height: '3px', background: '#e5e7eb', zIndex: 0 }}>
                                    <div style={{ height: '100%', background: '#00b4a0', width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`, transition: 'width 0.5s ease', borderRadius: '2px' }}></div>
                                </div>
                                {statusSteps.map((step, i) => (
                                    <div key={step} style={{ textAlign: 'center', zIndex: 1, flex: 1 }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: i <= currentStepIndex ? '#00b4a0' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: '16px', transition: 'all 0.3s ease', boxShadow: i <= currentStepIndex ? '0 2px 8px rgba(0,180,160,0.3)' : 'none' }}>
                                            {i <= currentStepIndex ? '✓' : statusIcons[step]}
                                        </div>
                                        <span style={{ fontSize: '10px', fontWeight: '600', color: i <= currentStepIndex ? '#00b4a0' : '#9ca3af', lineHeight: '1.2', display: 'block' }}>
                                            {statusLabels[step]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tracking History */}
                        {orderData.tracking && orderData.tracking.length > 0 && (
                            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '1.5rem', border: '1px solid #f0f0f0' }}>
                                <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: '700', color: '#1a1a1a', marginBottom: '1rem' }}>Tracking History</h4>
                                {orderData.tracking.map((t, i) => (
                                    <div key={t.id} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: i < orderData.tracking.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: i === 0 ? '#dcfce7' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                                            {statusIcons[t.status] || '📌'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', margin: 0, textTransform: 'capitalize' }}>{statusLabels[t.status] || t.status}</p>
                                            {t.location && <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0 0' }}>📍 {t.location}</p>}
                                            {t.notes && <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0', fontStyle: 'italic' }}>{t.notes}</p>}
                                        </div>
                                        <span style={{ fontSize: '11px', color: '#999', whiteSpace: 'nowrap' }}>
                                            {new Date(t.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Order Items */}
                        {orderData.items && orderData.items.length > 0 && (
                            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
                                <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: '700', color: '#1a1a1a', marginBottom: '1rem' }}>Order Items</h4>
                                {orderData.items.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < orderData.items.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                        <div>
                                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>{item.product_name}</p>
                                            <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0 0' }}>{item.quantity} {item.unit} × ₹{item.price}</p>
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#00b4a0' }}>₹{(item.quantity * item.price).toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <button onClick={() => navigate('/')} style={{ padding: '12px 32px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '25px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                                ← Continue Shopping
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderTracking;
