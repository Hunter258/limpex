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

    if (loading) return <div className="loading">Loading audit logs...</div>;

    return (
        <div>
            <div className="page-header">
                <h1>Audit Logs</h1>
                <button className="btn btn-primary" onClick={exportToExcel}>Export Logs</button>
            </div>

            <div className="card">
                <div className="filters">
                    <div className="filter-group">
                        <label>Action:</label>
                        <select
                            value={filters.action}
                            onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(1); }}
                        >
                            <option value="">All Actions</option>
                            <option value="USER_CREATE">User Create</option>
                            <option value="USER_UPDATE">User Update</option>
                            <option value="USER_DELETE">User Delete</option>
                            <option value="LOGIN">Login</option>
                            <option value="LOGOUT">Logout</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>From:</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setPage(1); }}
                        />
                    </div>
                    <div className="filter-group">
                        <label>To:</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setPage(1); }}
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
                                            <pre style={{ fontSize: '0.75rem', maxWidth: '200px', overflow: 'hidden' }}>
                                                {JSON.stringify(log.new_values, null, 2)}
                                            </pre>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="pagination">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                    >
                        Previous
                    </button>
                    <span style={{ padding: '0.5rem 1rem' }}>
                        Page {page} of {pagination.pages || 1}
                    </span>
                    <button
                        disabled={page >= pagination.pages}
                        onClick={() => setPage(page + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
