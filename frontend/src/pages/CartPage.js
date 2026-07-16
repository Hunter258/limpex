import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const getDeliveryEstimate = () => {
    const d = new Date();
    let bizDays = 2;
    while (bizDays > 0) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() !== 0 && d.getDay() !== 6) bizDays--;
    }
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const CartPage = () => {
    const { items, updateQuantity, removeItem, clearCart, getTotal } = useCart();
    const { t } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState('cart');
    const [orderForm, setOrderForm] = useState({
        customerName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
        customerEmail: user?.email || '',
        customerPhone: '',
        address: {
            flat: '',
            street: '',
            landmark: '',
            city: '',
            state: '',
            pincode: ''
        },
        notes: '',
        paymentMethod: 'cod'
    });
    const [loading, setLoading] = useState(false);
    const [orderResult, setOrderResult] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [razorpayConfig, setRazorpayConfig] = useState(null);

    useEffect(() => {
        api.get('/payments/config').then(res => setRazorpayConfig(res.data)).catch(() => {});
    }, []);

    useEffect(() => {
        if (!document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    const validateForm = () => {
        const errors = {};
        if (!orderForm.customerName.trim()) errors.customerName = 'Name is required';
        if (!orderForm.customerPhone.trim()) errors.customerPhone = 'Phone is required';
        else if (!/^[+]?[\d\s\-()]{7,15}$/.test(orderForm.customerPhone.trim())) errors.customerPhone = 'Invalid phone number';
        if (orderForm.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderForm.customerEmail)) errors.customerEmail = 'Invalid email';
        if (!orderForm.address.flat.trim()) errors.flat = 'House/Flat number is required';
        if (!orderForm.address.street.trim()) errors.street = 'Street/Road is required';
        if (!orderForm.address.city.trim()) errors.city = 'City is required';
        if (!orderForm.address.state.trim()) errors.state = 'State is required';
        if (!orderForm.address.pincode.trim()) errors.pincode = 'PIN code is required';
        else if (!/^\d{6}$/.test(orderForm.address.pincode.trim())) errors.pincode = 'Enter valid 6-digit PIN code';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const formatAddress = () => {
        const a = orderForm.address;
        const parts = [a.flat, a.street, a.landmark, `${a.city}, ${a.state} - ${a.pincode}`].filter(Boolean);
        return parts.join(', ');
    };

    const placeOrder = useCallback(async (paymentDetails) => {
        setLoading(true);
        setFormErrors({});
        try {
            const orderData = {
                customerName: orderForm.customerName.trim(),
                customerPhone: orderForm.customerPhone.trim(),
                customerEmail: orderForm.customerEmail.trim(),
                deliveryAddress: formatAddress(),
                notes: orderForm.notes.trim(),
                paymentMethod: orderForm.paymentMethod,
                items: items.map(i => ({
                    productId: i.id, name: i.name, quantity: i.quantity, price: i.price, unit: i.unit
                }))
            };
            if (paymentDetails) {
                orderData.payment_id = paymentDetails.paymentId;
                orderData.razorpay_order_id = paymentDetails.orderId;
            }
            const response = await api.post('/orders', orderData);
            setOrderResult({ ...response.data.order, deliveryEstimate: getDeliveryEstimate() });
            clearCart();
            setStep('confirmation');
        } catch (err) {
            setFormErrors({ submit: err.response?.data?.error || 'Failed to place order. Please try again.' });
        } finally {
            setLoading(false);
        }
    }, [orderForm, items, clearCart]);

    const handleRazorpayPayment = useCallback(() => {
        if (!razorpayConfig?.razorpayKeyId) {
            setFormErrors({ payment: 'Online payment not configured. Please use COD.' });
            return;
        }

        setLoading(true);
        const amount = getTotal();

        api.post('/payments/create-order', { amount }).then(res => {
            const { orderId, amount: razorpayAmount } = res.data;

            const options = {
                key: razorpayConfig.razorpayKeyId,
                amount: razorpayAmount,
                currency: 'INR',
                name: 'Limpex',
                description: `Order Payment - \u20B9${amount.toFixed(2)}`,
                order_id: orderId,
                handler: async function(response) {
                    try {
                        const verifyRes = await api.post('/payments/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        if (verifyRes.data.verified) {
                            await placeOrder({
                                orderId: response.razorpay_order_id,
                                paymentId: response.razorpay_payment_id
                            });
                        } else {
                            setFormErrors({ payment: 'Payment verification failed. Please contact support.' });
                            setLoading(false);
                        }
                    } catch (e) {
                        setFormErrors({ payment: 'Payment verification failed. Your payment was processed - contact support with payment ID: ' + response.razorpay_payment_id });
                        setLoading(false);
                    }
                },
                prefill: {
                    name: orderForm.customerName,
                    email: orderForm.customerEmail,
                    contact: orderForm.customerPhone,
                },
                theme: { color: '#00b4a0' },
                modal: {
                    ondismiss: function() {
                        setLoading(false);
                        setFormErrors({ payment: 'Payment was cancelled. Please try again.' });
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function(response) {
                setLoading(false);
                setFormErrors({ payment: `Payment failed: ${response.error.description}` });
            });
            rzp.open();
        }).catch(err => {
            setLoading(false);
            setFormErrors({ payment: err.response?.data?.error || 'Failed to initialize payment' });
        });
    }, [razorpayConfig, orderForm, getTotal, placeOrder]);

    const handleCheckout = async () => {
        if (!validateForm()) return;
        if (orderForm.paymentMethod === 'razorpay') {
            handleRazorpayPayment();
            return;
        }
        await placeOrder();
    };

    const paymentOptions = [
        { value: 'cod', label: 'Cash on Delivery' },
        { value: 'razorpay', label: 'Pay Online', desc: razorpayConfig?.configured ? 'UPI / Card / NetBanking' : 'Not configured' },
        { value: 'card', label: 'Card on Delivery' }
    ];

    if (step === 'confirmation' && orderResult) {
        return (
            <div className="min-h-screen bg-green-50 flex items-center justify-center p-8 font-body">
                <div className="bg-white rounded-[20px] p-12 max-w-[520px] w-full text-center shadow-elevated animate-slide-up">
                    <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl text-brand-600 font-bold">✓</span>
                    </div>
                    <h2 className="font-display text-3xl text-gray-900 mb-2">Order Placed Successfully!</h2>
                    <p className="text-gray-500 mb-6">Thank you for your order. Your order number is:</p>
                    <div className="bg-brand-50 p-4 rounded-xl mb-4 border-2 border-dashed border-brand-400">
                        <span className="text-2xl font-extrabold text-brand-500 font-mono">#{orderResult.id}</span>
                    </div>
                    <div className="bg-sky-50 p-4 rounded-xl mb-6 text-left">
                        <div className="text-[13px] text-gray-600 mb-1">
                            <strong>Payment:</strong> {orderForm.paymentMethod === 'razorpay' ? 'Online Paid' : orderForm.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card on Delivery'}
                        </div>
                        <div className="text-[13px] text-gray-600 mb-1">
                            <strong>Total:</strong> ₹{orderResult.total_amount}
                        </div>
                        <div className="text-[13px] text-brand-500 font-semibold">
                            Estimated delivery: {orderResult.deliveryEstimate}
                        </div>
                    </div>
                    {orderForm.customerEmail && (
                        <p className="text-[13px] text-gray-500 mb-4">A confirmation email has been sent to {orderForm.customerEmail}</p>
                    )}
                    <div className="flex gap-3 justify-center flex-wrap">
                        <button
                            onClick={() => navigate(`/track-order/${orderResult.id}`)}
                            className="btn-brand px-7 py-3 rounded-full text-sm"
                        >
                            Track Order
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="btn-ghost px-7 py-3 rounded-full text-sm text-gray-600"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-body">
            <div className="bg-gradient-to-r from-brand-500 to-forest-500 py-10 px-8 text-center text-white">
                <h1 className="font-display text-3xl font-extrabold mb-2">Shopping Cart</h1>
                <p className="text-base opacity-90 m-0">
                    {items.length} item{items.length !== 1 ? 's' : ''} in your cart
                </p>
            </div>

            <div className="max-w-[1000px] mx-auto p-4 md:p-8">
                {items.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-[20px] shadow-card">
                        <div className="text-6xl mb-4 text-gray-300">🛒</div>
                        <h2 className="font-display text-2xl text-gray-900 mb-2">Your cart is empty</h2>
                        <p className="text-gray-500 mb-6">Add some fresh products to get started</p>
                        <button
                            onClick={() => navigate('/products')}
                            className="btn-brand px-8 py-3 rounded-full text-sm"
                        >
                            Browse Products
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
                        <div>
                            {items.map(item => (
                                <div
                                    key={item.id}
                                    className="card flex flex-wrap md:flex-nowrap items-center gap-4 p-5 mb-4"
                                >
                                    <img
                                        src={item.image_url || 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=100'}
                                        alt={item.name}
                                        className="w-20 h-20 rounded-xl object-cover"
                                        loading="lazy"
                                    />
                                    <div className="flex-1 min-w-[120px]">
                                        <h3 className="text-[15px] font-bold text-gray-900 mb-1">{item.name}</h3>
                                        <p className="text-[13px] text-gray-400">₹{item.price}/{item.unit}</p>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="btn-ghost w-8 h-8 rounded-lg text-base flex items-center justify-center p-0"
                                        >
                                            &#8722;
                                        </button>
                                        <span className="text-base font-bold min-w-[24px] text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            disabled={item.stock_quantity && item.quantity >= item.stock_quantity}
                                            className={`btn-ghost w-8 h-8 rounded-lg text-base flex items-center justify-center p-0 ${
                                                item.stock_quantity && item.quantity >= item.stock_quantity ? 'opacity-40' : ''
                                            }`}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <span className="text-base font-extrabold text-brand-500 min-w-[80px] text-right">
                                        ₹{(item.price * item.quantity).toFixed(0)}
                                    </span>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="bg-transparent border-none cursor-pointer text-lg text-red-500 p-1 hover:text-red-700 transition-colors"
                                        aria-label={`Remove ${item.name}`}
                                    >
                                        &#10005;
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div>
                            <div className="card p-6 shadow-card sticky top-24">
                                <h3 className="font-display text-lg font-bold mb-4 text-gray-900">Order Summary</h3>

                                <div className="flex justify-between mb-2 text-sm text-gray-500">
                                    <span>Subtotal ({items.length} items)</span>
                                    <span>₹{getTotal().toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between mb-2 text-sm text-gray-500">
                                    <span>Delivery</span>
                                    <span className="text-brand-500 font-semibold">Free</span>
                                </div>
                                <div className="flex justify-between mb-2 text-[13px] text-brand-500">
                                    <span>Estimated Delivery</span>
                                    <span className="font-semibold">{getDeliveryEstimate()}</span>
                                </div>
                                <div className="border-t border-gray-100 pt-4 mt-2 flex justify-between text-lg font-extrabold text-gray-900">
                                    <span>Total</span>
                                    <span className="text-brand-500">₹{getTotal().toFixed(0)}</span>
                                </div>

                                {formErrors.submit && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 p-2.5 rounded-lg mt-4 text-[13px]" role="alert">
                                        {formErrors.submit}
                                    </div>
                                )}

                                {step === 'cart' ? (
                                    <button
                                        onClick={() => setStep('checkout')}
                                        className="btn-brand w-full py-3.5 mt-6 text-[15px]"
                                    >
                                        Proceed to Checkout
                                    </button>
                                ) : (
                                    <div className="mt-6">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Delivery Details</h4>

                                        {[
                                            { name: 'customerName', placeholder: 'Full Name *', type: 'text' },
                                            { name: 'customerPhone', placeholder: 'Phone *', type: 'tel' },
                                            { name: 'customerEmail', placeholder: 'Email (for order updates)', type: 'email' }
                                        ].map(field => (
                                            <div key={field.name} className="mb-2">
                                                <input
                                                    type={field.type}
                                                    placeholder={field.placeholder}
                                                    value={orderForm[field.name]}
                                                    onChange={e => setOrderForm({...orderForm, [field.name]: e.target.value})}
                                                    className={`input-field w-full text-[13px] ${formErrors[field.name] ? '!border-red-500' : ''}`}
                                                />
                                                {formErrors[field.name] && (
                                                    <span className="text-[11px] text-red-500">{formErrors[field.name]}</span>
                                                )}
                                            </div>
                                        ))}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="House/Flat No. *"
                                                    value={orderForm.address.flat}
                                                    onChange={e => setOrderForm({...orderForm, address: {...orderForm.address, flat: e.target.value}})}
                                                    className={`input-field w-full text-[13px] ${formErrors.flat ? '!border-red-500' : ''}`}
                                                />
                                                {formErrors.flat && <span className="text-[11px] text-red-500">{formErrors.flat}</span>}
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Street/Road *"
                                                    value={orderForm.address.street}
                                                    onChange={e => setOrderForm({...orderForm, address: {...orderForm.address, street: e.target.value}})}
                                                    className={`input-field w-full text-[13px] ${formErrors.street ? '!border-red-500' : ''}`}
                                                />
                                                {formErrors.street && <span className="text-[11px] text-red-500">{formErrors.street}</span>}
                                            </div>
                                        </div>

                                        <input
                                            type="text"
                                            placeholder="Landmark (optional)"
                                            value={orderForm.address.landmark}
                                            onChange={e => setOrderForm({...orderForm, address: {...orderForm.address, landmark: e.target.value}})}
                                            className="input-field w-full text-[13px] mb-2"
                                        />

                                        <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-2 mb-2">
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="City *"
                                                    value={orderForm.address.city}
                                                    onChange={e => setOrderForm({...orderForm, address: {...orderForm.address, city: e.target.value}})}
                                                    className={`input-field w-full text-[13px] ${formErrors.city ? '!border-red-500' : ''}`}
                                                />
                                                {formErrors.city && <span className="text-[11px] text-red-500">{formErrors.city}</span>}
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="State *"
                                                    value={orderForm.address.state}
                                                    onChange={e => setOrderForm({...orderForm, address: {...orderForm.address, state: e.target.value}})}
                                                    className={`input-field w-full text-[13px] ${formErrors.state ? '!border-red-500' : ''}`}
                                                />
                                                {formErrors.state && <span className="text-[11px] text-red-500">{formErrors.state}</span>}
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="PIN *"
                                                    maxLength="6"
                                                    value={orderForm.address.pincode}
                                                    onChange={e => setOrderForm({...orderForm, address: {...orderForm.address, pincode: e.target.value.replace(/\D/g, '')}})}
                                                    className={`input-field w-full text-[13px] ${formErrors.pincode ? '!border-red-500' : ''}`}
                                                />
                                                {formErrors.pincode && <span className="text-[11px] text-red-500">{formErrors.pincode}</span>}
                                            </div>
                                        </div>

                                        <textarea
                                            placeholder="Order notes (optional)"
                                            value={orderForm.notes}
                                            onChange={e => setOrderForm({...orderForm, notes: e.target.value})}
                                            rows="2"
                                            className="input-field w-full text-[13px] mb-2 resize-y"
                                        />

                                        <h4 className="text-sm font-semibold text-gray-900 mb-2 mt-2">Payment Method</h4>
                                        <div className="flex gap-2 mb-3 flex-wrap">
                                            {paymentOptions.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setOrderForm({...orderForm, paymentMethod: opt.value})}
                                                    disabled={opt.value === 'razorpay' && !razorpayConfig?.configured}
                                                    className={`flex-1 py-2.5 px-1.5 rounded-[10px] text-center transition-all text-[13px] font-semibold cursor-pointer ${
                                                        orderForm.paymentMethod === opt.value
                                                            ? 'border-2 border-brand-500 bg-brand-50 text-gray-900'
                                                            : 'border border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                                                    } ${
                                                        opt.value === 'razorpay' && !razorpayConfig?.configured
                                                            ? 'opacity-50 cursor-not-allowed'
                                                            : ''
                                                    }`}
                                                >
                                                    {opt.label}
                                                    {opt.desc && (
                                                        <div className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>

                                        {formErrors.payment && (
                                            <div className="bg-red-50 border border-red-200 text-red-600 p-2 rounded-lg mb-3 text-[13px]">
                                                {formErrors.payment}
                                            </div>
                                        )}

                                        {orderForm.paymentMethod === 'razorpay' && razorpayConfig?.configured && (
                                            <div className="bg-brand-50 rounded-xl p-4 mb-3 border border-brand-200 text-center">
                                                <p className="text-[13px] text-green-800 font-semibold">
                                                    You will be redirected to Razorpay's secure payment page
                                                </p>
                                                <p className="text-[11px] text-gray-500 mt-1">
                                                    Supports UPI, Credit/Debit Cards, NetBanking, and Wallets
                                                </p>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleCheckout}
                                            disabled={loading}
                                            className={`btn-brand w-full py-3.5 text-[15px] ${
                                                loading ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                        >
                                            {loading
                                                ? 'Processing...'
                                                : orderForm.paymentMethod === 'razorpay'
                                                    ? `Pay ₹${getTotal().toFixed(0)} via Razorpay`
                                                    : `Place Order — ₹${getTotal().toFixed(0)}`
                                            }
                                        </button>

                                        <button
                                            onClick={() => setStep('cart')}
                                            className="w-full py-2.5 bg-transparent text-gray-500 border-none text-[13px] cursor-pointer font-medium hover:text-gray-700 transition-colors"
                                        >
                                            Back to Cart
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartPage;
