import React, { useState, useEffect } from 'react';
import api from '../services/api';
import * as XLSX from 'xlsx';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [filters, setFilters] = useState({
        action: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchLogs();
    }, [page, filters]);

    const fetchLogs = async () => {
        try {
            const params = new URLSearchParams({ page, limit: 50 });
            if (filters.action) params.append('action', filters.action);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await api.get(`/audit?${params}`);
            setLogs(response.data.logs);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Fetch logs error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (action) => {
        if (action.includes('CREATE')) return 'badge-success';
        if (action.includes('UPDATE')) return 'badge-warning';
        if (action.includes('DELETE')) return 'badge-danger';
        return 'badge-info';
    };

    const exportToExcel = () => {
        const data = logs.map(log => ({
            Action: log.action,
            Entity: `${log.entity_type} ${log.entity_id ? '#' + log.entity_id : ''}`.trim(),
            User: log.email || 'System',
            'IP Address': log.ip_address,
            Timestamp: new Date(log.created_at).toLocaleString()
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Audit Logs');
        XLSX.writeFile(wb, 'audit_logs.xlsx');
    };

    if (loading) return <div className="flex items-center justify-center min-h-[400px] text-gray-500">Loading audit logs...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <h1 className="font-display text-2xl font-bold text-gray-900 m-0">Audit Logs</h1>
                <button className="btn-brand text-sm" onClick={exportToExcel}>Export Logs</button>
            </div>

            <div className="card p-5">
                <div className="flex flex-wrap gap-4 mb-5 pb-5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-gray-600">Action:</label>
                        <select
                            value={filters.action}
                            onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(1); }}
                            className="input-field py-2 px-3 text-sm"
                        >
                            <option value="">All Actions</option>
                            <option value="USER_CREATE">User Create</option>
                            <option value="USER_UPDATE">User Update</option>
                            <option value="USER_DELETE">User Delete</option>
                            <option value="LOGIN">Login</option>
                            <option value="LOGOUT">Logout</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-gray-600">From:</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setPage(1); }}
                            className="input-field py-2 px-3 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-gray-600">To:</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setPage(1); }}
                            className="input-field py-2 px-3 text-sm"
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>IP Address</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id}>
                                    <td>{new Date(log.created_at).toLocaleString()}</td>
                                    <td>{log.email || 'System'}</td>
                                    <td>
                                        <span className={`badge ${getActionBadge(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td>{log.entity_type} {log.entity_id && `#${log.entity_id}`}</td>
                                    <td>{log.ip_address}</td>
                                    <td>
                                        {log.new_values && (
                                            <pre className="text-xs max-w-[200px] overflow-hidden m-0 bg-gray-50 rounded p-1.5">
                                                {JSON.stringify(log.new_values, null, 2)}
                                            </pre>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="btn-ghost text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Page {page} of {pagination.pages || 1}
                    </span>
                    <button
                        disabled={page >= pagination.pages}
                        onClick={() => setPage(page + 1)}
                        className="btn-ghost text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
