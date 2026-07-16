import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

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
    pending: '1', confirmed: '2', processing: '3',
    shipped: '4', out_for_delivery: '5', delivered: '6'
};

const OrderTracking = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [searchId, setSearchId] = useState(orderId || '');
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const trackOrder = async (id) => {
        if (!id || isNaN(parseInt(id))) {
            setError('Please enter a valid order number');
            return;
        }
        setLoading(true);
        setError('');
        setOrderData(null);
        try {
            const res = await api.get(`/orders/track/${parseInt(id)}`);
            setOrderData(res.data);
        } catch (err) {
            setError(err.response?.status === 404 ? 'Order not found. Please check your order number.' : 'Failed to track order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderId && !isNaN(parseInt(orderId))) {
            trackOrder(orderId);
            setSearchId(orderId);
        }
    }, [orderId]);

    const currentStepIndex = orderData ? Math.max(0, statusSteps.indexOf(orderData.order?.status)) : -1;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-hero-gradient py-10 px-8 text-white text-center">
                <h1 className="font-display text-3xl font-extrabold mb-2">Track Your Order</h1>
                <p className="text-base opacity-90 m-0">Enter your order number to track delivery status</p>
            </div>

            <div className="max-w-[700px] mx-auto p-8">
                <div className="card p-8 mb-8">
                    <div className="flex gap-2.5">
                        <input
                            type="text"
                            placeholder="Enter Order Number (e.g., 1)"
                            value={searchId}
                            onChange={e => setSearchId(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && trackOrder(searchId)}
                            className="input-field flex-1"
                            aria-label="Order number"
                        />
                        <button onClick={() => trackOrder(searchId)} disabled={loading}
                            className="btn-brand whitespace-nowrap px-7 py-3.5 text-sm font-bold disabled:cursor-not-allowed">
                            {loading ? '...' : 'Track'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center mb-8" role="alert">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {orderData && orderData.order && (
                    <div>
                        <div className="card p-6 mb-6">
                            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                                <div>
                                    <h3 className="font-display text-xl font-bold text-gray-900 m-0">Order #{orderData.order.id}</h3>
                                    <p className="text-xs text-gray-400 mt-1 m-0">
                                        Placed on {new Date(orderData.order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold ${
                                    orderData.order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                    orderData.order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                }`}>
                                    {statusLabels[orderData.order.status] || orderData.order.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 text-sm">
                                <div>
                                    <p className="text-gray-400 m-0 mb-0.5 text-xs uppercase font-semibold">Customer</p>
                                    <p className="text-gray-900 font-semibold m-0">{orderData.order.customer_name}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 m-0 mb-0.5 text-xs uppercase font-semibold">Total</p>
                                    <p className="text-brand-500 font-extrabold m-0 text-lg">&#8377;{orderData.order.total_amount}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 m-0 mb-0.5 text-xs uppercase font-semibold">Payment</p>
                                    <p className="text-gray-900 font-semibold m-0 capitalize">{orderData.order.payment_method === 'cod' ? 'Cash on Delivery' : orderData.order.payment_method === 'upi' ? 'UPI Payment' : 'Card Payment'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 m-0 mb-0.5 text-xs uppercase font-semibold">Delivery Address</p>
                                    <p className="text-gray-900 font-semibold m-0 text-xs">{orderData.order.delivery_address}</p>
                                </div>
                            </div>
                            {orderData.order.delivery_estimate && (
                                <div className="mt-4 px-4 py-3 bg-green-50 rounded-[10px] border border-green-200">
                                    <p className="text-xs font-bold text-green-800 m-0">Estimated Delivery: {orderData.order.delivery_estimate}</p>
                                </div>
                            )}
                        </div>

                        {currentStepIndex >= 0 && (
                            <div className="card p-8 mb-6">
                                <h4 className="font-display text-base font-bold text-gray-900 mb-6">Delivery Progress</h4>
                                <div className="flex justify-between relative px-2.5">
                                    <div className="absolute top-[18px] left-[30px] right-[30px] h-[3px] bg-gray-200 z-0">
                                        <div className="h-full bg-brand-500 rounded-sm transition-all duration-500" style={{ width: `${Math.max(0, (currentStepIndex / (statusSteps.length - 1)) * 100)}%` }}></div>
                                    </div>
                                    {statusSteps.map((step, i) => (
                                        <div key={step} className="text-center z-1 flex-1">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold transition-all duration-300 ${
                                                i <= currentStepIndex
                                                    ? 'bg-brand-500 text-white shadow-[0_2px_8px_rgba(0,180,160,0.3)]'
                                                    : 'bg-gray-200 text-gray-400'
                                            }`}>
                                                {i <= currentStepIndex ? '\u2713' : i + 1}
                                            </div>
                                            <span className={`text-[10px] font-semibold leading-tight block ${
                                                i <= currentStepIndex ? 'text-brand-500' : 'text-gray-400'
                                            }`}>
                                                {statusLabels[step]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {orderData.tracking && orderData.tracking.length > 0 && (
                            <div className="card p-6 mb-6">
                                <h4 className="font-display text-base font-bold text-gray-900 mb-4">Tracking History</h4>
                                {orderData.tracking.map((t, i) => (
                                    <div key={t.id} className={`flex gap-3 py-3 ${i < orderData.tracking.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                            i === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {statusIcons[t.status] || i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-900 m-0 capitalize">{statusLabels[t.status] || t.status}</p>
                                            {t.location && <p className="text-xs text-gray-400 mt-0.5 m-0">{t.location}</p>}
                                            {t.notes && <p className="text-xs text-gray-500 mt-1 m-0 italic">{t.notes}</p>}
                                        </div>
                                        <span className="text-[11px] text-gray-400 whitespace-nowrap">
                                            {new Date(t.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {orderData.items && orderData.items.length > 0 && (
                            <div className="card p-6">
                                <h4 className="font-display text-base font-bold text-gray-900 mb-4">Order Items</h4>
                                {orderData.items.map((item, i) => (
                                    <div key={i} className={`flex justify-between py-2.5 ${i < orderData.items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 m-0">{item.product_name}</p>
                                            <p className="text-xs text-gray-400 mt-0.5 m-0">{item.quantity} {item.unit} x &#8377;{item.price}</p>
                                        </div>
                                        <span className="text-sm font-bold text-brand-500">&#8377;{(item.quantity * item.price).toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="text-center mt-8">
                            <button onClick={() => navigate('/products')} className="px-8 py-3 bg-gray-100 text-gray-700 border-none rounded-full text-sm font-semibold cursor-pointer hover:bg-gray-200 transition-colors">
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderTracking;
