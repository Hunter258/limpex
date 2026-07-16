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

    if (step === 'confirmation' && orderResult) {
        return (
            <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div style={{ background: '#fff', borderRadius: '20px', padding: '3rem', maxWidth: '520px', width: '100%', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: '60px', marginBottom: '1rem', color: '#00b4a0' }}>&#10003;</div>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: '#1a1a1a', marginBottom: '0.5rem' }}>Order Placed Successfully!</h2>
                    <p style={{ color: '#666', marginBottom: '1.5rem' }}>Thank you for your order. Your order number is:</p>
                    <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', border: '2px dashed #00b4a0' }}>
                        <span style={{ fontSize: '24px', fontWeight: '800', color: '#00b4a0', fontFamily: 'monospace' }}>#{orderResult.id}</span>
                    </div>
                    <div style={{ background: '#f0f7ff', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'left' }}>
                        <div style={{ fontSize: '13px', color: '#374151', marginBottom: '4px' }}>
                            <strong>Payment:</strong> {orderForm.paymentMethod === 'razorpay' ? 'Online Paid' : orderForm.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card on Delivery'}
                        </div>
                        <div style={{ fontSize: '13px', color: '#374151', marginBottom: '4px' }}>
                            <strong>Total:</strong> &#8377;{orderResult.total_amount}
                        </div>
                        <div style={{ fontSize: '13px', color: '#00b4a0', fontWeight: '600' }}>
                            Estimated delivery: {orderResult.deliveryEstimate}
                        </div>
                    </div>
                    {orderForm.customerEmail && (
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '1rem' }}>A confirmation email has been sent to {orderForm.customerEmail}</p>
                    )}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate(`/track-order/${orderResult.id}`)} style={{ padding: '12px 28px', background: '#00b4a0', color: '#fff', border: 'none', borderRadius: '25px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                            Track Order
                        </button>
                        <button onClick={() => navigate('/')} style={{ padding: '12px 28px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '25px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafb' }}>
            <div style={{ background: 'linear-gradient(135deg, #00b4a0, #009688)', padding: '2.5rem 2rem', color: 'white', textAlign: 'center' }}>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: '800', margin: '0 0 0.5rem 0' }}>Shopping Cart</h1>
                <p style={{ fontSize: '1rem', opacity: 0.9, margin: 0 }}>{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
            </div>

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem', display: 'grid', gridTemplateColumns: items.length > 0 ? '1fr 380px' : '1fr', gap: '2rem' }}>
                {items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '60px', marginBottom: '1rem', color: '#d1d5db' }}>&#128722;</div>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#1a1a1a', marginBottom: '0.5rem' }}>Your cart is empty</h2>
                        <p style={{ color: '#666', marginBottom: '1.5rem' }}>Add some fresh products to get started</p>
                        <button onClick={() => navigate('/products')} style={{ padding: '12px 32px', background: '#00b4a0', color: '#fff', border: 'none', borderRadius: '25px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                            Browse Products
                        </button>
                    </div>
                ) : (
                    <>
                        <div>
                            {items.map(item => (
                                <div key={item.id} style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0', flexWrap: 'wrap' }}>
                                    <img src={item.image_url || 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=100'} alt={item.name} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }} loading="lazy" />
                                    <div style={{ flex: 1, minWidth: '120px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' }}>{item.name}</h3>
                                        <p style={{ fontSize: '13px', color: '#888' }}>&#8377;{item.price}/{item.unit}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&#8722;</button>
                                        <span style={{ fontSize: '15px', fontWeight: '700', minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.stock_quantity && item.quantity >= item.stock_quantity} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: item.stock_quantity && item.quantity >= item.stock_quantity ? 0.5 : 1 }}>+</button>
                                    </div>
                                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#00b4a0', minWidth: '80px', textAlign: 'right' }}>&#8377;{(item.price * item.quantity).toFixed(0)}</span>
                                    <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#ef4444', padding: '4px' }} aria-label={`Remove ${item.name}`}>&#10005;</button>
                                </div>
                            ))}
                        </div>

                        <div>
                            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', position: 'sticky', top: '100px' }}>
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '700', marginBottom: '1rem', color: '#1a1a1a' }}>Order Summary</h3>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '14px', color: '#666' }}>
                                    <span>Subtotal ({items.length} items)</span>
                                    <span>&#8377;{getTotal().toFixed(0)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '14px', color: '#666' }}>
                                    <span>Delivery</span>
                                    <span style={{ color: '#00b4a0', fontWeight: '600' }}>Free</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '13px', color: '#00b4a0' }}>
                                    <span>Estimated Delivery</span>
                                    <span style={{ fontWeight: '600' }}>{getDeliveryEstimate()}</span>
                                </div>
                                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800', color: '#1a1a1a' }}>
                                    <span>Total</span>
                                    <span style={{ color: '#00b4a0' }}>&#8377;{getTotal().toFixed(0)}</span>
                                </div>

                                {formErrors.submit && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px', borderRadius: '8px', marginTop: '1rem', fontSize: '13px' }} role="alert">
                                        {formErrors.submit}
                                    </div>
                                )}

                                {step === 'cart' ? (
                                    <button onClick={() => setStep('checkout')} style={{ width: '100%', padding: '14px', marginTop: '1.5rem', background: 'linear-gradient(135deg, #00b4a0, #009688)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,180,160,0.3)' }}>
                                        Proceed to Checkout
                                    </button>
                                ) : (
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '0.75rem' }}>Delivery Details</h4>

                                        {[
                                            { name: 'customerName', placeholder: 'Full Name *', type: 'text' },
                                            { name: 'customerPhone', placeholder: 'Phone *', type: 'tel' },
                                            { name: 'customerEmail', placeholder: 'Email (for order updates)', type: 'email' }
                                        ].map(field => (
                                            <div key={field.name} style={{ marginBottom: '8px' }}>
                                                <input
                                                    type={field.type}
                                                    placeholder={field.placeholder}
                                                    value={orderForm[field.name]}
                                                    onChange={e => setOrderForm({...orderForm, [field.name]: e.target.value})}
                                                    style={{ width: '100%', padding: '10px 12px', border: formErrors[field.name] ? '1.5px solid #dc2626' : '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                                                />
                                                {formErrors[field.name] && <span style={{ fontSize: '11px', color: '#dc2626' }}>{formErrors[field.name]}</span>}
                                            </div>
                                        ))}

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                            <div>
                                                <input type="text" placeholder="House/Flat No. *" value={orderForm.address.flat}
                                                    onChange={e => setOrderForm({...orderForm, address: {...orderForm.address, flat: e.target.value}})}
                                                    style={{ width: '100%', padding: '10px 12px', border: formErrors.flat ? '1.5px solid #dc2626' : '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
                                                {formErrors.flat && <span style={{ fontSize: '11px', color: '#dc2626' }}>{formErrors.flat}</span>}
                                            </div>
                                            <div>
                                                <input type="text" placeholder="Street/Road *" value={orderForm.address.street}
                                                    onChange={e => setOrderForm({...orderForm, address: {...orderForm.address, street: e.target.value}})}
                                                    style={{ width: '100%', padding: '10px 12px', border: formErrors.street ? '1.5px solid #dc2626' : '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
                                                {formErrors.street && <span style={{ fontSize: '11px', color: '#dc2626' }}>{formErrors.street}</span>}
                                            </div>
                                        </div>
                                        <input type="text" placeholder="Landmark (optional)" value={orderForm.address.landmark}
                                            onChange={e => setOrderForm({...orderForm, address: {...orderForm.address, landmark: e.target.value}})}
                                            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }} />
                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                            <div>
                                                <input type="text" placeholder="City *" value={orderForm.address.city}
                                                    onChange={e => setOrderForm({...orderForm, address: {...orderForm.address, city: e.target.value}})}
                                                    style={{ width: '100%', padding: '10px 12px', border: formErrors.city ? '1.5px solid #dc2626' : '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
                                                {formErrors.city && <span style={{ fontSize: '11px', color: '#dc2626' }}>{formErrors.city}</span>}
                                            </div>
                                            <div>
                                                <input type="text" placeholder="State *" value={orderForm.address.state}
                                                    onChange={e => setOrderForm({...orderForm, address: {...orderForm.address, state: e.target.value}})}
                                                    style={{ width: '100%', padding: '10px 12px', border: formErrors.state ? '1.5px solid #dc2626' : '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
                                                {formErrors.state && <span style={{ fontSize: '11px', color: '#dc2626' }}>{formErrors.state}</span>}
                                            </div>
                                            <div>
                                                <input type="text" placeholder="PIN *" maxLength="6" value={orderForm.address.pincode}
                                                    onChange={e => setOrderForm({...orderForm, address: {...orderForm.address, pincode: e.target.value.replace(/\D/g, '')}})}
                                                    style={{ width: '100%', padding: '10px 12px', border: formErrors.pincode ? '1.5px solid #dc2626' : '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
                                                {formErrors.pincode && <span style={{ fontSize: '11px', color: '#dc2626' }}>{formErrors.pincode}</span>}
                                            </div>
                                        </div>

                                        <textarea
                                            placeholder="Order notes (optional)"
                                            value={orderForm.notes}
                                            onChange={e => setOrderForm({...orderForm, notes: e.target.value})}
                                            rows="2"
                                            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', marginBottom: '8px', outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
                                        />

                                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '0.5rem', marginTop: '0.5rem' }}>Payment Method</h4>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                            {[
                                                { value: 'cod', label: 'Cash on Delivery' },
                                                { value: 'razorpay', label: 'Pay Online', desc: razorpayConfig?.configured ? 'UPI / Card / NetBanking' : 'Not configured' },
                                                { value: 'card', label: 'Card on Delivery' }
                                            ].map(opt => (
                                                <button key={opt.value} onClick={() => setOrderForm({...orderForm, paymentMethod: opt.value})}
                                                    disabled={opt.value === 'razorpay' && !razorpayConfig?.configured}
                                                    style={{ flex: 1, padding: '10px 6px', borderRadius: '10px', border: orderForm.paymentMethod === opt.value ? '2px solid #00b4a0' : '1.5px solid #e5e7eb', background: orderForm.paymentMethod === opt.value ? '#f0fdf4' : '#fff', cursor: opt.value === 'razorpay' && !razorpayConfig?.configured ? 'not-allowed' : 'pointer', textAlign: 'center', transition: 'all 0.2s', fontSize: '13px', fontWeight: '600', color: '#1a1a1a', opacity: opt.value === 'razorpay' && !razorpayConfig?.configured ? 0.5 : 1 }}>
                                                    {opt.label}
                                                    {opt.desc && <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>{opt.desc}</div>}
                                                </button>
                                            ))}
                                        </div>
                                        {formErrors.payment && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>{formErrors.payment}</div>}

                                        {orderForm.paymentMethod === 'razorpay' && razorpayConfig?.configured && (
                                            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '1rem', marginBottom: '12px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                                                <p style={{ fontSize: '13px', color: '#166534', fontWeight: '600' }}>You will be redirected to Razorpay's secure payment page</p>
                                                <p style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Supports UPI, Credit/Debit Cards, NetBanking, and Wallets</p>
                                            </div>
                                        )}

                                        <button onClick={handleCheckout} disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? '#9ca3af' : 'linear-gradient(135deg, #00b4a0, #009688)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(0,180,160,0.3)' }}>
                                            {loading ? 'Processing...' : orderForm.paymentMethod === 'razorpay' ? `Pay \u20B9${getTotal().toFixed(0)} via Razorpay` : `Place Order — \u20B9${getTotal().toFixed(0)}`}
                                        </button>
                                        <button onClick={() => setStep('cart')} style={{ width: '100%', padding: '10px', marginTop: '8px', background: 'transparent', color: '#6b7280', border: 'none', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>
                                            Back to Cart
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CartPage;
