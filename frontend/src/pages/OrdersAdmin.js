import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import * as XLSX from 'xlsx';

const statusColors = {
    pending: { bg: '#fef3c7', text: '#92400e' },
    confirmed: { bg: '#dbeafe', text: '#1e40af' },
    processing: { bg: '#e0e7ff', text: '#3730a3' },
    shipped: { bg: '#d1fae5', text: '#065f46' },
    out_for_delivery: { bg: '#fce7f3', text: '#9d174d' },
    delivered: { bg: '#dcfce7', text: '#166534' },
    cancelled: { bg: '#fee2e2', text: '#991b1b' }
};

const statusLabels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
};

const OrdersAdmin = () => {
    const { t } = useLanguage();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await api.get('/orders');
            setOrders(res.data.orders || []);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            setUpdatingId(orderId);
            await api.put(`/orders/${orderId}/status`, {
                status: newStatus,
                location: newStatus === 'shipped' ? 'Dispatched from warehouse' : 
                          newStatus === 'out_for_delivery' ? 'Out for local delivery' :
                          newStatus === 'delivered' ? 'Delivered to customer' : null,
                notes: `Status updated to ${statusLabels[newStatus]}`
            });
            await fetchOrders();
        } catch (err) {
            alert('Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const deleteOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to delete this order?')) return;
        try {
            await api.delete(`/orders/${orderId}`);
            await fetchOrders();
        } catch (err) {
            alert('Failed to delete order');
        }
    };

    const exportToExcel = () => {
        const data = filteredOrders.map(o => ({
            'Order ID': `#${o.id}`,
            Customer: o.customer_name,
            Phone: o.customer_phone || '-',
            Email: o.customer_email || '-',
            Address: o.delivery_address,
            Items: o.items?.map(i => `${i.product_name} x${i.quantity}`).join(', ') || '-',
            Total: `₹${o.total_amount}`,
            Payment: o.payment_method === 'cod' ? 'COD' : o.payment_method,
            Status: statusLabels[o.status] || o.status,
            Date: new Date(o.created_at).toLocaleDateString('en-IN')
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Orders');
        XLSX.writeFile(wb, `orders_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => ['confirmed', 'processing', 'shipped'].includes(o.status)).length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        revenue: orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + parseFloat(o.total_amount || 0), 0)
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', color: '#6b7280' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTop: '3px solid #16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: '12px' }}></div>
                Loading orders...
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', color: '#1a1a1a', margin: 0 }}>📦 Orders & Delivery</h1>
                <button onClick={exportToExcel} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #16a34a, #059669)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}>
                    📊 Export Excel
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Orders', value: stats.total, color: '#374151', bg: '#f9fafb' },
                    { label: 'Pending', value: stats.pending, color: '#92400e', bg: '#fef3c7' },
                    { label: 'In Progress', value: stats.processing, color: '#1e40af', bg: '#dbeafe' },
                    { label: 'Delivered', value: stats.delivered, color: '#166534', bg: '#dcfce7' },
                    { label: 'Revenue', value: `₹${stats.revenue.toFixed(0)}`, color: '#16a34a', bg: '#f0fdf4' }
                ].map((s, i) => (
                    <div key={i} style={{ background: s.bg, borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0', fontWeight: '600', textTransform: 'uppercase' }}>{s.label}</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: '800', color: s.color, margin: 0 }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {['all', 'pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'].map(s => (
                    <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 16px', borderRadius: '20px', border: filter === s ? '2px solid #16a34a' : '1.5px solid #e5e7eb', background: filter === s ? '#dcfce7' : '#fff', color: filter === s ? '#166534' : '#6b7280', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                        {s === 'all' ? 'All' : statusLabels[s]} ({s === 'all' ? orders.length : orders.filter(o => o.status === s).length})
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            {filteredOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📦</div>
                    <h3 style={{ color: '#374151', margin: '0 0 0.5rem 0' }}>No orders found</h3>
                    <p style={{ color: '#9ca3af', margin: 0 }}>Orders will appear here when customers place them</p>
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb' }}>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>Order</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>Customer</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>Items</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>Total</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>Status</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>Date</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(order => {
                                    const sc = statusColors[order.status] || { bg: '#f3f4f6', text: '#6b7280' };
                                    return (
                                        <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '700', color: '#16a34a' }}>#{order.id}</td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>{order.customer_name}</p>
                                                <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0 0' }}>{order.customer_phone || order.customer_email || '-'}</p>
                                            </td>
                                            <td style={{ padding: '14px 16px', fontSize: '13px', color: '#555', maxWidth: '200px' }}>
                                                {order.items?.map(i => i.product_name).join(', ') || '-'}
                                            </td>
                                            <td style={{ padding: '14px 16px', fontSize: '15px', fontWeight: '800', color: '#1a1a1a' }}>₹{order.total_amount}</td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: sc.bg, color: sc.text }}>
                                                    {statusLabels[order.status] || order.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', fontSize: '13px', color: '#666' }}>
                                                {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                                        <select
                                                            value={order.status}
                                                            onChange={(e) => updateStatus(order.id, e.target.value)}
                                                            disabled={updatingId === order.id}
                                                            style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', background: '#fff' }}
                                                        >
                                                            {['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'].map(s => (
                                                                <option key={s} value={s}>{statusLabels[s]}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                    <button onClick={() => deleteOrder(order.id)} style={{ padding: '4px 8px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersAdmin;
