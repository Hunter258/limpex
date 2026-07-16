import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

const UPI_ID = 'limpex@upi';
const UPI_NAME = 'Limpex Customs';

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
    const navigate = useNavigate();
    const [step, setStep] = useState('cart');
    const [orderForm, setOrderForm] = useState({
        customerName: '', customerEmail: '', customerPhone: '', deliveryAddress: '', notes: '', paymentMethod: 'cod'
    });
    const [upiPaid, setUpiPaid] = useState(false);
    const [loading, setLoading] = useState(false);
    const [orderResult, setOrderResult] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    const generateUPILink = () => {
        const amount = getTotal().toFixed(0);
        const params = new URLSearchParams({ pa: UPI_ID, pn: UPI_NAME, am: amount, cu: 'INR', tn: 'Limpex Order Payment' });
        return `upi://pay?${params.toString()}`;
    };

    const validateForm = () => {
        const errors = {};
        if (!orderForm.customerName.trim()) errors.customerName = 'Name is required';
        if (!orderForm.customerPhone.trim()) errors.customerPhone = 'Phone is required';
        else if (!/^[+]?[\d\s\-()]{7,15}$/.test(orderForm.customerPhone.trim())) errors.customerPhone = 'Invalid phone number';
        if (orderForm.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderForm.customerEmail)) errors.customerEmail = 'Invalid email';
        if (!orderForm.deliveryAddress.trim()) errors.deliveryAddress = 'Address is required';
        else if (orderForm.deliveryAddress.trim().length < 10) errors.deliveryAddress = 'Please provide a complete address';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCheckout = async () => {
        if (!validateForm()) return;
        if (orderForm.paymentMethod === 'upi' && !upiPaid) {
            setFormErrors({ payment: 'Please complete UPI payment first' });
            return;
        }

        setLoading(true);
        setFormErrors({});
        try {
            const response = await api.post('/orders', {
                ...orderForm,
                customerName: orderForm.customerName.trim(),
                customerPhone: orderForm.customerPhone.trim(),
                customerEmail: orderForm.customerEmail.trim(),
                deliveryAddress: orderForm.deliveryAddress.trim(),
                notes: orderForm.notes.trim(),
                payment_id: orderForm.paymentMethod === 'upi' ? `upi_${Date.now()}` : orderForm.paymentMethod === 'card' ? `card_${Date.now()}` : null,
                items: items.map(i => ({
                    productId: i.id, name: i.name, quantity: i.quantity, price: i.price, unit: i.unit
                }))
            });
            setOrderResult({ ...response.data.order, deliveryEstimate: getDeliveryEstimate() });
            clearCart();
            setStep('confirmation');
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to place order. Please try again.';
            setFormErrors({ submit: msg });
        } finally {
            setLoading(false);
        }
    };

    if (step === 'confirmation' && orderResult) {
        return (
            <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div style={{ background: '#fff', borderRadius: '20px', padding: '3rem', maxWidth: '520px', width: '100%', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: '60px', marginBottom: '1rem' }}>&#10003;</div>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: '#1a1a1a', marginBottom: '0.5rem' }}>Order Placed Successfully!</h2>
                    <p style={{ color: '#666', marginBottom: '1.5rem' }}>Thank you for your order. Your order number is:</p>
                    <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', border: '2px dashed #00b4a0' }}>
                        <span style={{ fontSize: '24px', fontWeight: '800', color: '#00b4a0', fontFamily: 'monospace' }}>#{orderResult.id}</span>
                    </div>
                    <div style={{ background: '#f0f7ff', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'left' }}>
                        <div style={{ fontSize: '13px', color: '#374151', marginBottom: '4px' }}>
                            <strong>Payment:</strong> {orderForm.paymentMethod === 'upi' ? 'UPI Paid' : orderForm.paymentMethod === 'card' ? 'Card Payment' : 'Cash on Delivery'}
                        </div>
                        <div style={{ fontSize: '13px', color: '#374151', marginBottom: '4px' }}>
                            <strong>Total:</strong> &#8377;{orderResult.total_amount || getTotal().toFixed(0)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#00b4a0', fontWeight: '600' }}>
                            Estimated delivery: {orderResult.deliveryEstimate}
                        </div>
                    </div>
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
                        <div style={{ fontSize: '60px', marginBottom: '1rem' }}>&#128722;</div>
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
                                <div key={item.id} style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
                                    <img src={item.image_url || 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=100'} alt={item.name} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }} loading="lazy" />
                                    <div style={{ flex: 1 }}>
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
                                            { name: 'customerEmail', placeholder: 'Email (optional)', type: 'email' }
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

                                        <div style={{ marginBottom: '8px' }}>
                                            <textarea
                                                placeholder="Delivery Address *"
                                                value={orderForm.deliveryAddress}
                                                onChange={e => setOrderForm({...orderForm, deliveryAddress: e.target.value})}
                                                rows="3"
                                                style={{ width: '100%', padding: '10px 12px', border: formErrors.deliveryAddress ? '1.5px solid #dc2626' : '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
                                            />
                                            {formErrors.deliveryAddress && <span style={{ fontSize: '11px', color: '#dc2626' }}>{formErrors.deliveryAddress}</span>}
                                        </div>

                                        <textarea
                                            placeholder="Order notes (optional)"
                                            value={orderForm.notes}
                                            onChange={e => setOrderForm({...orderForm, notes: e.target.value})}
                                            rows="2"
                                            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', marginBottom: '8px', outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
                                        />

                                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '0.5rem', marginTop: '0.5rem' }}>Payment Method</h4>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                            {[
                                                { value: 'cod', label: 'Cash on Delivery' },
                                                { value: 'upi', label: 'UPI' },
                                                { value: 'card', label: 'Card' }
                                            ].map(opt => (
                                                <button key={opt.value} onClick={() => { setOrderForm({...orderForm, paymentMethod: opt.value}); setUpiPaid(false); setFormErrors({...formErrors, payment: null}); }}
                                                    style={{ flex: 1, padding: '10px 6px', borderRadius: '10px', border: orderForm.paymentMethod === opt.value ? '2px solid #00b4a0' : '1.5px solid #e5e7eb', background: orderForm.paymentMethod === opt.value ? '#f0fdf4' : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                        {formErrors.payment && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>{formErrors.payment}</div>}

                                        {orderForm.paymentMethod === 'upi' && (
                                            <div style={{ background: '#f8fafb', borderRadius: '12px', padding: '1rem', marginBottom: '12px', border: '1px solid #e5e7eb' }}>
                                                <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px', textAlign: 'center' }}>Pay &#8377;{getTotal().toFixed(0)} to UPI ID:</p>
                                                <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', textAlign: 'center', marginBottom: '10px', border: '1px dashed #00b4a0' }}>
                                                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#00b4a0', fontFamily: 'monospace', letterSpacing: '1px' }}>{UPI_ID}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <a href={generateUPILink()} style={{ flex: 1, display: 'block', textAlign: 'center', padding: '10px', background: 'linear-gradient(135deg, #00b4a0, #009688)', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">
                                                        Open UPI App
                                                    </a>
                                                    <button onClick={() => setUpiPaid(true)} style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: upiPaid ? '2px solid #16a34a' : '1.5px solid #e5e7eb', background: upiPaid ? '#f0fdf4' : '#fff', color: upiPaid ? '#16a34a' : '#374151', transition: 'all 0.2s' }}>
                                                        {upiPaid ? 'Paid' : 'I have paid'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {orderForm.paymentMethod === 'card' && (
                                            <div style={{ background: '#f8fafb', borderRadius: '12px', padding: '1rem', marginBottom: '12px', border: '1px solid #e5e7eb' }}>
                                                <p style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>Card payment will be collected on delivery</p>
                                            </div>
                                        )}

                                        <button onClick={handleCheckout} disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? '#9ca3af' : 'linear-gradient(135deg, #00b4a0, #009688)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(0,180,160,0.3)' }}>
                                            {loading ? 'Placing Order...' : `Place Order — \u20B9${getTotal().toFixed(0)}`}
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
