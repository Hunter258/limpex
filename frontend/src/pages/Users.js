import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

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

    const exportToExcel = () => {
        const data = users.map(u => ({
            Name: `${u.first_name} ${u.last_name}`,
            Email: u.email,
            Role: u.role_name,
            Status: u.is_active ? 'Active' : 'Inactive',
            'Last Login': u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never',
            'Created At': new Date(u.created_at).toLocaleDateString()
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Users');
        XLSX.writeFile(wb, 'users.xlsx');
    };

    if (loading) return <div className="flex items-center justify-center min-h-[400px] text-gray-500">Loading users...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <h1 className="font-display text-2xl font-bold text-gray-900 m-0">User Management</h1>
                <button className="btn-brand text-sm" onClick={exportToExcel}>Export Users</button>
            </div>

            <div className="card p-5">
                <div className="mb-5">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="input-field max-w-sm"
                    />
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
                                        <div className="flex items-center gap-2">
                                            {user.role === 'super_admin' && (
                                                <select
                                                    value={users.find(usr => usr.id === u.id)?.role_name}
                                                    onChange={(e) => {
                                                        const roleMap = { super_admin: 1, admin: 2, editor: 3, user: 4 };
                                                        handleRoleChange(u.id, roleMap[e.target.value]);
                                                    }}
                                                    className="input-field py-1 px-2 text-xs"
                                                >
                                                    <option value="user">User</option>
                                                    <option value="editor">Editor</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="super_admin">Super Admin</option>
                                                </select>
                                            )}
                                            {u.is_active && u.id !== user.id && (
                                                <button
                                                    className="btn-danger px-2 py-1 text-xs"
                                                    onClick={() => handleDeactivate(u.id)}
                                                >
                                                    Deactivate
                                                </button>
                                            )}
                                        </div>
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

export default Users;
