import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import api from '../services/api';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const Analytics = () => {
    const [timeline, setTimeline] = useState([]);
    const [containers, setContainers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [timelineRes, containersRes] = await Promise.all([
                api.get('/analytics/timeline'),
                api.get('/analytics/containers')
            ]);
            setTimeline(timelineRes.data.timeline);
            setContainers(containersRes.data.containers);
        } catch (error) {
            console.error('Analytics error:', error);
        } finally {
            setLoading(false);
        }
    };

    const responseData = {
        labels: timeline.slice(0, 20).reverse().map(t => 
            new Date(t.created_at).toLocaleTimeString()
        ),
        datasets: [
            {
                label: 'Response Time (ms)',
                data: timeline.slice(0, 20).reverse().map(t => t.request_duration_ms),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const containerData = {
        labels: containers.map(c => c.container_id),
        datasets: [
            {
                label: 'Requests per Container',
                data: containers.map(c => c.total_requests),
                backgroundColor: '#6366f1'
            }
        ]
    };

    if (loading) return <div className="loading">Loading analytics...</div>;

    return (
        <div>
            <div className="page-header">
                <h1>Request Analytics</h1>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Containers</h3>
                    <div className="value">{containers.length}</div>
                </div>
                <div className="stat-card">
                    <h3>Total Requests Tracked</h3>
                    <div className="value">
                        {containers.reduce((sum, c) => sum + parseInt(c.total_requests), 0)}
                    </div>
                </div>
                <div className="stat-card">
                    <h3>Avg Response Time</h3>
                    <div className="value">
                        {containers.length > 0 
                            ? Math.round(containers.reduce((sum, c) => sum + c.avg_response_time, 0) / containers.length)
                            : 0}ms
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="card">
                    <h3>Response Time Over Last 20 Requests</h3>
                    <div className="chart-container">
                        <Line data={responseData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="card">
                    <h3>Requests by Container</h3>
                    <div className="chart-container">
                        <Bar data={containerData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3>Container Tracking Details</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Container ID</th>
                                <th>Total Requests</th>
                                <th>Avg Response Time</th>
                                <th>First Seen</th>
                                <th>Last Seen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {containers.map((container, index) => (
                                <tr key={index}>
                                    <td><code>{container.container_id}</code></td>
                                    <td>{container.total_requests}</td>
                                    <td>{container.avg_response_time}ms</td>
                                    <td>{new Date(container.first_seen).toLocaleString()}</td>
                                    <td>{new Date(container.last_seen).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3>Recent Request Timeline</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Method</th>
                                <th>Endpoint</th>
                                <th>Status</th>
                                <th>Duration</th>
                                <th>Source IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {timeline.slice(0, 50).map((item, index) => (
                                <tr key={index}>
                                    <td>{new Date(item.created_at).toLocaleString()}</td>
                                    <td><span className="badge badge-info">{item.method}</span></td>
                                    <td>{item.endpoint}</td>
                                    <td>
                                        <span className={`badge ${item.status_code < 400 ? 'badge-success' : 'badge-danger'}`}>
                                            {item.status_code}
                                        </span>
                                    </td>
                                    <td>{item.request_duration_ms}ms</td>
                                    <td><code>{item.source_ip}</code></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
