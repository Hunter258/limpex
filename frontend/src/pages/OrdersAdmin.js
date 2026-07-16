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
            <div className="flex items-center justify-center min-h-[400px] text-gray-500 gap-3">
                <div className="loading-spinner"></div>
                Loading orders...
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <h1 className="font-display text-2xl font-bold text-gray-900 m-0">Orders & Delivery</h1>
                <button onClick={exportToExcel} className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-none rounded-lg text-xs font-semibold cursor-pointer shadow-lg shadow-green-600/30 hover:shadow-green-600/50 transition-shadow">
                    Export Excel
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {[
                    { label: 'Total Orders', value: stats.total, bg: 'bg-gray-50', color: 'text-gray-700' },
                    { label: 'Pending', value: stats.pending, bg: 'bg-amber-50', color: 'text-amber-800' },
                    { label: 'In Progress', value: stats.processing, bg: 'bg-blue-50', color: 'text-blue-800' },
                    { label: 'Delivered', value: stats.delivered, bg: 'bg-green-50', color: 'text-green-800' },
                    { label: 'Revenue', value: `₹${stats.revenue.toFixed(0)}`, bg: 'bg-emerald-50', color: 'text-emerald-700' }
                ].map((s, i) => (
                    <div key={i} className={`${s.bg} rounded-xl p-5 text-center`}>
                        <p className="text-xs text-gray-500 m-0 mb-1 font-semibold uppercase">{s.label}</p>
                        <p className={`text-2xl font-extrabold ${s.color} m-0`}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
                {['all', 'pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'].map(s => (
                    <button key={s} onClick={() => setFilter(s)} className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all border-0 ${
                        filter === s ? 'bg-green-100 text-green-800 shadow-sm ring-2 ring-green-500/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>
                        {s === 'all' ? 'All' : statusLabels[s]} ({s === 'all' ? orders.length : orders.filter(o => o.status === s).length})
                    </button>
                ))}
            </div>

            {filteredOrders.length === 0 ? (
                <div className="card p-16 text-center">
                    <div className="text-5xl mb-4">📦</div>
                    <h3 className="text-gray-700 m-0 mb-2">No orders found</h3>
                    <p className="text-gray-400 m-0">Orders will appear here when customers place them</p>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(order => {
                                    const sc = statusColors[order.status] || { bg: '#f3f4f6', text: '#6b7280' };
                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="font-bold text-green-600">#{order.id}</td>
                                            <td>
                                                <p className="text-sm font-semibold text-gray-900 m-0">{order.customer_name}</p>
                                                <p className="text-xs text-gray-400 mt-0.5 m-0">{order.customer_phone || order.customer_email || '-'}</p>
                                            </td>
                                            <td className="text-xs text-gray-600 max-w-[200px]">
                                                {order.items?.map(i => i.product_name).join(', ') || '-'}
                                            </td>
                                            <td className="text-sm font-extrabold text-gray-900">₹{order.total_amount}</td>
                                            <td>
                                                <span style={{ background: sc.bg, color: sc.text }} className="inline-block px-3 py-1 rounded-full text-[11px] font-bold">
                                                    {statusLabels[order.status] || order.status}
                                                </span>
                                            </td>
                                            <td className="text-xs text-gray-500">
                                                {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </td>
                                            <td>
                                                <div className="flex gap-1 flex-wrap items-center">
                                                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                                        <select
                                                            value={order.status}
                                                            onChange={(e) => updateStatus(order.id, e.target.value)}
                                                            disabled={updatingId === order.id}
                                                            className="input-field py-1 px-2 text-[11px] w-auto"
                                                        >
                                                            {['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'].map(s => (
                                                                <option key={s} value={s}>{statusLabels[s]}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                    <button onClick={() => deleteOrder(order.id)} className="px-2 py-1 bg-red-50 text-red-500 border-none rounded text-[11px] cursor-pointer font-semibold hover:bg-red-100 transition-colors">
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
