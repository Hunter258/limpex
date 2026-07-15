import React, { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import api from '../services/api';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('7d');

    useEffect(() => {
        fetchDashboard();
    }, [period]);

    const fetchDashboard = async () => {
        try {
            const response = await api.get(`/analytics/dashboard?period=${period}`);
            setStats(response.data);
        } catch (error) {
            console.error('Dashboard error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading dashboard...</div>;

    const requestData = {
        labels: stats?.userActivity?.map(d => new Date(d.day).toLocaleDateString()) || [],
        datasets: [
            {
                label: 'Requests',
                data: stats?.userActivity?.map(d => d.requests) || [],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const userActivityData = {
        labels: stats?.userActivity?.map(d => new Date(d.day).toLocaleDateString()) || [],
        datasets: [
            {
                label: 'Active Users',
                data: stats?.userActivity?.map(d => d.users) || [],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const containerData = {
        labels: stats?.sourceStats?.map(s => s.container_id) || [],
        datasets: [
            {
                data: stats?.sourceStats?.map(s => s.count) || [],
                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
            }
        ]
    };

    return (
        <div>
            <div className="page-header">
                <h1>Dashboard</h1>
                <div className="filter-group">
                    <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                    </select>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Requests</h3>
                    <div className="value">{stats?.stats?.total_requests || 0}</div>
                </div>
                <div className="stat-card">
                    <h3>Unique Users</h3>
                    <div className="value">{stats?.stats?.unique_users || 0}</div>
                </div>
                <div className="stat-card">
                    <h3>Avg Response Time</h3>
                    <div className="value">{stats?.stats?.avg_response_time || 0}ms</div>
                </div>
                <div className="stat-card">
                    <h3>Errors</h3>
                    <div className="value" style={{ color: '#ef4444' }}>
                        {stats?.stats?.error_count || 0}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="card">
                    <h3>Request Traffic</h3>
                    <div className="chart-container">
                        <Line data={requestData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="card">
                    <h3>Traffic Sources</h3>
                    <div className="chart-container">
                        <Doughnut data={containerData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3>User Activity</h3>
                <div className="chart-container">
                    <Line data={userActivityData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
            </div>

            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3>Top Endpoints</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Endpoint</th>
                                <th>Requests</th>
                                <th>Avg Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.topEndpoints?.map((endpoint, index) => (
                                <tr key={index}>
                                    <td>{endpoint.endpoint}</td>
                                    <td>{endpoint.count}</td>
                                    <td>{endpoint.avg_time}ms</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
