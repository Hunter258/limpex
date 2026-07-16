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
import { useLanguage } from '../context/LanguageContext';

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
    const { t } = useLanguage();

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

    if (loading) return <div className="flex items-center justify-center min-h-[400px] text-gray-500">Loading...</div>;

    const requestData = {
        labels: stats?.userActivity?.map(d => new Date(d.day).toLocaleDateString()) || [],
        datasets: [
            {
                label: 'Requests',
                data: stats?.userActivity?.map(d => d.requests) || [],
                borderColor: '#00b4a0',
                backgroundColor: 'rgba(0, 180, 160, 0.1)',
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
                backgroundColor: ['#00b4a0', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
            }
        ]
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <h1 className="font-display text-2xl font-bold text-gray-900 m-0">{t('dashTitle')}</h1>
                <div>
                    <select value={period} onChange={(e) => setPeriod(e.target.value)} className="input-field py-2 px-3 text-sm">
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="card p-5">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide m-0">{t('dashTotalRequests')}</h3>
                    <div className="text-3xl font-extrabold text-gray-900 mt-2">{stats?.stats?.total_requests || 0}</div>
                </div>
                <div className="card p-5">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide m-0">{t('dashActiveUsers')}</h3>
                    <div className="text-3xl font-extrabold text-gray-900 mt-2">{stats?.stats?.unique_users || 0}</div>
                </div>
                <div className="card p-5">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide m-0">Avg Response</h3>
                    <div className="text-3xl font-extrabold text-gray-900 mt-2">{stats?.stats?.avg_response_time || 0}ms</div>
                </div>
                <div className="card p-5">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide m-0">Errors</h3>
                    <div className="text-3xl font-extrabold text-red-500 mt-2">
                        {stats?.stats?.error_count || 0}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-6">
                <div className="card p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 m-0">Request Traffic</h3>
                    <div className="h-[300px]">
                        <Line data={requestData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="card p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 m-0">Traffic Sources</h3>
                    <div className="h-[300px]">
                        <Doughnut data={containerData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>

            <div className="card p-5 mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4 m-0">{t('dashRecentActivity')}</h3>
                <div className="h-[300px]">
                    <Line data={userActivityData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
            </div>

            <div className="card p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4 m-0">Top Endpoints</h3>
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
