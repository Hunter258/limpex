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
import * as XLSX from 'xlsx';

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

    const exportToExcel = () => {
        const data = timeline.map(item => ({
            Endpoint: item.endpoint,
            Method: item.method,
            Status: item.status_code,
            Duration: item.request_duration_ms,
            Timestamp: new Date(item.created_at).toLocaleString()
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Analytics');
        XLSX.writeFile(wb, 'analytics.xlsx');
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

    if (loading) return <div className="flex items-center justify-center min-h-[400px] text-gray-500">Loading analytics...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <h1 className="font-display text-2xl font-bold text-gray-900 m-0">Request Analytics</h1>
                <button className="btn-brand text-sm" onClick={exportToExcel}>Export Analytics</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <div className="card p-5">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide m-0">Total Containers</h3>
                    <div className="text-3xl font-extrabold text-gray-900 mt-2">{containers.length}</div>
                </div>
                <div className="card p-5">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide m-0">Total Requests Tracked</h3>
                    <div className="text-3xl font-extrabold text-gray-900 mt-2">
                        {containers.reduce((sum, c) => sum + parseInt(c.total_requests), 0)}
                    </div>
                </div>
                <div className="card p-5">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide m-0">Avg Response Time</h3>
                    <div className="text-3xl font-extrabold text-gray-900 mt-2">
                        {containers.length > 0 
                            ? Math.round(containers.reduce((sum, c) => sum + c.avg_response_time, 0) / containers.length)
                            : 0}ms
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="card p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 m-0">Response Time Over Last 20 Requests</h3>
                    <div className="h-[300px]">
                        <Line data={responseData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="card p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 m-0">Requests by Container</h3>
                    <div className="h-[300px]">
                        <Bar data={containerData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>

            <div className="card p-5 mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4 m-0">Container Tracking Details</h3>
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
                                    <td><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{container.container_id}</code></td>
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

            <div className="card p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4 m-0">Recent Request Timeline</h3>
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
                                    <td><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{item.source_ip}</code></td>
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
