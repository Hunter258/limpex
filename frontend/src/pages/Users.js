import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [search, setSearch] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, [page, search]);

    const fetchUsers = async () => {
        try {
            const response = await api.get(`/users?page=${page}&search=${search}`);
            setUsers(response.data.users);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Fetch users error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async (userId) => {
        if (!window.confirm('Are you sure you want to deactivate this user?')) return;
        
        try {
            await api.put(`/users/${userId}/deactivate`);
            fetchUsers();
        } catch (error) {
            alert('Failed to deactivate user');
        }
    };

    const handleRoleChange = async (userId, roleId) => {
        try {
            await api.put(`/users/${userId}/role`, { roleId });
            fetchUsers();
        } catch (error) {
            alert('Failed to update role');
        }
    };

    const getRoleBadge = (role) => {
        const badges = {
            super_admin: 'badge-danger',
            admin: 'badge-warning',
            editor: 'badge-info',
            user: 'badge-success'
        };
        return <span className={`badge ${badges[role] || 'badge-info'}`}>{role}</span>;
    };

    if (loading) return <div className="loading">Loading users...</div>;

    return (
        <div>
            <div className="page-header">
                <h1>User Management</h1>
            </div>

            <div className="card">
                <div className="filters">
                    <div className="filter-group">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Last Login</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td>{u.email}</td>
                                    <td>{u.first_name} {u.last_name}</td>
                                    <td>{getRoleBadge(u.role_name)}</td>
                                    <td>
                                        <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                                            {u.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</td>
                                    <td>
                                        {user.role === 'super_admin' && (
                                            <select
                                                value={users.find(usr => usr.id === u.id)?.role_name}
                                                onChange={(e) => {
                                                    const roleMap = { super_admin: 1, admin: 2, editor: 3, user: 4 };
                                                    handleRoleChange(u.id, roleMap[e.target.value]);
                                                }}
                                                style={{ marginRight: '0.5rem', padding: '0.25rem' }}
                                            >
                                                <option value="user">User</option>
                                                <option value="editor">Editor</option>
                                                <option value="admin">Admin</option>
                                                <option value="super_admin">Super Admin</option>
                                            </select>
                                        )}
                                        {u.is_active && u.id !== user.id && (
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => handleDeactivate(u.id)}
                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                            >
                                                Deactivate
                                            </button>
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

export default Users;
