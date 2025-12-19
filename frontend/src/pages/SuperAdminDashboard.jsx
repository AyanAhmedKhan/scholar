import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

const SuperAdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Department form state
    const [deptForm, setDeptForm] = useState({ name: '', code: '' });
    const [editingDept, setEditingDept] = useState(null);

    // Session form state
    const [sessionForm, setSessionForm] = useState({ name: '' });
    const [editingSession, setEditingSession] = useState(null);

    // Branch form state
    const [branches, setBranches] = useState([]);
    const [branchForm, setBranchForm] = useState({ name: '', code: '', department_id: '' });
    const [editingBranch, setEditingBranch] = useState(null);

    // Logs state
    const [logTab, setLogTab] = useState('audit'); // 'audit' or 'server'
    const [serverLogs, setServerLogs] = useState([]);

    // Email form state
    const [emailForm, setEmailForm] = useState({
        target_group: 'all',
        target_id: '',
        custom_recipients: [],
        subject: '',
        body: ''
    });

    useEffect(() => {
        if (activeTab === 'overview') {
            fetchStats();
            fetchAnalytics();
            fetchAuditLogs();
        } else if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'departments') {
            fetchDepartments();
        } else if (activeTab === 'sessions') {
            fetchSessions();
        } else if (activeTab === 'branches') {
            fetchDepartments(); // Need departments for dropdown
            fetchBranches();
        } else if (activeTab === 'logs') {
            if (logTab === 'audit') fetchAuditLogs();
            if (logTab === 'server') fetchServerLogs();
        }
    }, [activeTab, logTab]);

    const showSuccess = (msg) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(''), 3000);
    };

    const showError = (msg) => {
        setError(msg);
        setTimeout(() => setError(''), 5000);
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (e) {
            showError('Failed to fetch users');
            console.error(e);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/stats');
            setStats(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('/admin/analytics/dashboard');
            setAnalytics(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const res = await api.get('/admin/audit-logs?limit=100');
            setAuditLogs(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchServerLogs = async () => {
        try {
            const res = await api.get('/admin/server-logs');
            setServerLogs(res.data.logs);
        } catch (e) {
            console.error(e);
            showError('Failed to fetch server logs');
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/admin/departments');
            setDepartments(res.data);
        } catch (e) {
            showError('Failed to fetch departments');
            console.error(e);
        }
    };

    const fetchSessions = async () => {
        try {
            const res = await api.get('/admin/sessions');
            setSessions(res.data);
        } catch (e) {
            showError('Failed to fetch sessions');
            console.error(e);
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await api.get('/university/branches');
            setBranches(res.data);
        } catch (e) {
            showError('Failed to fetch branches');
            console.error(e);
        }
    };

    const handleCreateDepartment = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/admin/departments', deptForm);
            showSuccess('Department created successfully');
            setDeptForm({ name: '', code: '' });
            fetchDepartments();
        } catch (err) {
            showError(err.response?.data?.detail || 'Failed to create department');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateDepartment = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/admin/departments/${editingDept.id}`, deptForm);
            showSuccess('Department updated successfully');
            setEditingDept(null);
            setDeptForm({ name: '', code: '' });
            fetchDepartments();
        } catch (err) {
            showError(err.response?.data?.detail || 'Failed to update department');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDepartment = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this department?')) return;
        try {
            await api.delete(`/admin/departments/${id}`);
            showSuccess('Department deactivated successfully');
            fetchDepartments();
        } catch (err) {
            showError(err.response?.data?.detail || 'Failed to delete department');
        }
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/admin/sessions', sessionForm);
            showSuccess('Session created successfully');
            setSessionForm({ name: '' });
            fetchSessions();
        } catch (err) {
            showError(err.response?.data?.detail || 'Failed to create session');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSession = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/admin/sessions/${editingSession.id}`, sessionForm);
            showSuccess('Session updated successfully');
            setEditingSession(null);
            setSessionForm({ name: '' });
            fetchSessions();
        } catch (err) {
            showError(err.response?.data?.detail || 'Failed to update session');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSession = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this session?')) return;
        try {
            await api.delete(`/admin/sessions/${id}`);
            showSuccess('Session deactivated successfully');
            fetchSessions();
        } catch (err) {
            showError(err.response?.data?.detail || 'Failed to delete session');
        }
    };

    const handleCreateBranch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/university/branches', branchForm);
            showSuccess('Branch created successfully');
            setBranchForm({ name: '', code: '', department_id: '' });
            fetchBranches();
        } catch (err) {
            showError(err.response?.data?.detail || 'Failed to create branch');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.put(`/admin/users/${userId}/role`, { role: newRole });
            showSuccess('Role updated successfully');
            fetchUsers();
        } catch (e) {
            showError('Failed to update role');
        }
    };

    const handleDeleteUser = async (userId, userEmail) => {
        if (!window.confirm(`Are you sure you want to permanently delete user "${userEmail}"?\n\nThis will also delete:\n- User profile\n- All applications\n- All documents\n\nThis action cannot be undone!`)) {
            return;
        }

        // Double confirmation for safety
        if (!window.confirm(`FINAL CONFIRMATION: Delete user "${userEmail}"?\n\nThis action is PERMANENT and cannot be undone!`)) {
            return;
        }

        try {
            await api.delete(`/admin/users/${userId}`);
            showSuccess(`User "${userEmail}" deleted successfully`);
            fetchUsers();
        } catch (err) {
            showError(err.response?.data?.detail || 'Failed to delete user');
        }
    };

    const handleSendEmail = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/admin/communications/email/send', emailForm);
            showSuccess(`Email queued successfully! ${res.data.count} recipients`);
            setEmailForm({ target_group: 'all', target_id: '', custom_recipients: [], subject: '', body: '' });
        } catch (err) {
            showError(err.response?.data?.detail || 'Failed to send email');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (type) => {
        try {
            const response = await api.get(`/admin/export/${type}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showSuccess('Export completed');
        } catch (e) {
            showError('Export failed');
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'users', label: 'Users', icon: '👥' },
        { id: 'departments', label: 'Departments', icon: '🏛️' },
        { id: 'branches', label: 'Branches', icon: '🌿' },
        { id: 'sessions', label: 'Sessions', icon: '📅' },
        { id: 'logs', label: 'Logs', icon: '📜' },
        { id: 'communications', label: 'Communications', icon: '📧' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 font-display">Super Admin Dashboard</h1>
                    <p className="text-slate-500 mt-1">Manage system configuration, users, and analytics</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleExport('applicants')}
                        className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                        Export Applicants
                    </button>
                    <button
                        onClick={() => handleExport('applications')}
                        className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                        Export Applications
                    </button>
                    <a
                        href="http://localhost:8000/admin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-800 transition-colors"
                    >
                        DB Admin
                    </a>
                </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {success}
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-200">
                    <nav className="flex -mb-px">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Stats Cards */}
                            {stats && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                                        <div className="text-blue-600 text-sm font-medium mb-1">Total Users</div>
                                        <div className="text-3xl font-bold text-blue-900">{stats.total_users}</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                                        <div className="text-green-600 text-sm font-medium mb-1">Total Applications</div>
                                        <div className="text-3xl font-bold text-green-900">{stats.total_applications}</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200">
                                        <div className="text-amber-600 text-sm font-medium mb-1">Pending Verifications</div>
                                        <div className="text-3xl font-bold text-amber-900">{stats.pending_verifications}</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                                        <div className="text-purple-600 text-sm font-medium mb-1">Total Scholarships</div>
                                        <div className="text-3xl font-bold text-purple-900">{stats.total_scholarships}</div>
                                    </div>
                                </div>
                            )}

                            {/* Analytics Charts */}
                            {analytics && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                        <h3 className="text-lg font-bold text-slate-800 mb-6">Application Status</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={analytics.application_status}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {analytics.application_status.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                        <h3 className="text-lg font-bold text-slate-800 mb-6">Applications by Department</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={analytics.department_distribution}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                    <YAxis axisLine={false} tickLine={false} />
                                                    <Tooltip cursor={{ fill: '#f1f5f9' }} />
                                                    <Bar dataKey="value" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recent Audit Logs */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="text-lg font-bold text-slate-800">Recent Activity</h2>
                                </div>
                                <div className="overflow-x-auto max-h-96">
                                    <table className="w-full text-left text-sm text-slate-600">
                                        <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 z-10">
                                            <tr>
                                                <th className="px-6 py-3 border-b border-slate-200">Time</th>
                                                <th className="px-6 py-3 border-b border-slate-200">User ID</th>
                                                <th className="px-6 py-3 border-b border-slate-200">Action</th>
                                                <th className="px-6 py-3 border-b border-slate-200">Target</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {auditLogs.slice(0, 10).map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                                                    <td className="px-6 py-3 font-mono text-xs">{log.user_id || 'System'}</td>
                                                    <td className="px-6 py-3 font-medium text-slate-800">{log.action}</td>
                                                    <td className="px-6 py-3">{log.target_type} #{log.target_id}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-slate-800">User Management</h2>
                                <button onClick={fetchUsers} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                                    Refresh
                                </button>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-slate-600">
                                        <thead className="bg-slate-50 text-slate-700 font-semibold">
                                            <tr>
                                                <th className="px-6 py-3 border-b border-slate-200">ID</th>
                                                <th className="px-6 py-3 border-b border-slate-200">Email</th>
                                                <th className="px-6 py-3 border-b border-slate-200">Full Name</th>
                                                <th className="px-6 py-3 border-b border-slate-200">Current Role</th>
                                                <th className="px-6 py-3 border-b border-slate-200">Change Role</th>
                                                <th className="px-6 py-3 border-b border-slate-200">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {users.map((user) => (
                                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3 font-mono text-xs">#{user.id}</td>
                                                    <td className="px-6 py-3 font-medium text-slate-900">{user.email}</td>
                                                    <td className="px-6 py-3">{user.full_name || '-'}</td>
                                                    <td className="px-6 py-3">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border
                                                            ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                                user.role === 'student' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                    'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <select
                                                            value={user.role}
                                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                                                        >
                                                            <option value="student">Student</option>
                                                            <option value="goffice">G-Office</option>
                                                            <option value="dept_head">Dept Head</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id, user.email)}
                                                            className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                            title="Permanently delete this user"
                                                        >
                                                            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Departments Tab */}
                    {activeTab === 'departments' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-slate-800">Department Management</h2>
                                <button onClick={fetchDepartments} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                                    Refresh
                                </button>
                            </div>

                            {/* Create/Edit Form */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                                    {editingDept ? 'Edit Department' : 'Create New Department'}
                                </h3>
                                <form onSubmit={editingDept ? handleUpdateDepartment : handleCreateDepartment} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={deptForm.name}
                                                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                                placeholder="e.g., Computer Science"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department Code</label>
                                            <input
                                                type="text"
                                                value={deptForm.code}
                                                onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                                placeholder="e.g., CSE"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Saving...' : editingDept ? 'Update' : 'Create'}
                                        </button>
                                        {editingDept && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingDept(null);
                                                    setDeptForm({ name: '', code: '' });
                                                }}
                                                className="bg-slate-200 text-slate-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* Departments List */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="text-lg font-bold text-slate-800">All Departments</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-slate-600">
                                        <thead className="bg-slate-50 text-slate-700 font-semibold">
                                            <tr>
                                                <th className="px-6 py-3 border-b border-slate-200">ID</th>
                                                <th className="px-6 py-3 border-b border-slate-200">Name</th>
                                                <th className="px-6 py-3 border-b border-slate-200">Code</th>
                                                <th className="px-6 py-3 border-b border-slate-200">Status</th>
                                                <th className="px-6 py-3 border-b border-slate-200">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {departments.map((dept) => (
                                                <tr key={dept.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3 font-mono text-xs">#{dept.id}</td>
                                                    <td className="px-6 py-3 font-medium text-slate-900">{dept.name}</td>
                                                    <td className="px-6 py-3">{dept.code || '-'}</td>
                                                    <td className="px-6 py-3">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${dept.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                                            }`}>
                                                            {dept.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingDept(dept);
                                                                    setDeptForm({ name: dept.name, code: dept.code || '' });
                                                                }}
                                                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteDepartment(dept.id)}
                                                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                                                            >
                                                                Deactivate
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Branches Tab */}
                    {activeTab === 'branches' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-slate-800">Branch Management</h2>
                                <button onClick={fetchBranches} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                                    Refresh
                                </button>
                            </div>

                            {/* Create Form */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                                    Create New Branch
                                </h3>
                                <form onSubmit={handleCreateBranch} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department *</label>
                                            <select
                                                required
                                                value={branchForm.department_id}
                                                onChange={(e) => setBranchForm({ ...branchForm, department_id: e.target.value })}
                                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                                            >
                                                <option value="">Select Department</option>
                                                {departments.map(d => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Branch Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={branchForm.name}
                                                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                                placeholder="e.g., Artificial Intelligence"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Branch Code</label>
                                            <input
                                                type="text"
                                                value={branchForm.code}
                                                onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                                placeholder="e.g., AI"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Saving...' : 'Create Branch'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Branches List */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="text-lg font-bold text-slate-800">All Branches</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-slate-600">
                                        <thead className="bg-slate-50 text-slate-700 font-semibold">
                                            <tr>
                                                <th className="px-6 py-3 border-b border-slate-200">ID</th>
                                                <th className="px-6 py-3 border-b border-slate-200">Department</th>
                                                <th className="px-6 py-3 border-b border-slate-200">Name</th>
                                                <th className="px-6 py-3 border-b border-slate-200">Code</th>
                                                <th className="px-6 py-3 border-b border-slate-200">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {branches.map((branch) => {
                                                const dept = departments.find(d => d.id === branch.department_id);
                                                return (
                                                    <tr key={branch.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-3 font-mono text-xs">#{branch.id}</td>
                                                        <td className="px-6 py-3 font-semibold text-slate-700">{dept?.name || branch.department_id}</td>
                                                        <td className="px-6 py-3 font-medium text-slate-900">{branch.name}</td>
                                                        <td className="px-6 py-3">{branch.code || '-'}</td>
                                                        <td className="px-6 py-3">
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${branch.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                                                }`}>
                                                                {branch.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Logs Tab */}
                    {activeTab === 'logs' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-slate-800">System Logs</h2>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setLogTab('audit')}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${logTab === 'audit' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Audit Logs
                                    </button>
                                    <button
                                        onClick={() => setLogTab('server')}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${logTab === 'server' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Server Console
                                    </button>
                                </div>
                            </div>

                            {logTab === 'audit' ? (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="flex justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                        <h3 className="text-lg font-bold text-slate-800">User Actions History</h3>
                                        <button onClick={fetchAuditLogs} className="text-primary-600 hover:text-primary-700 text-sm font-medium">Refresh</button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-slate-600">
                                            <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0">
                                                <tr>
                                                    <th className="px-6 py-3 border-b border-slate-200">Time</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">User ID</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">Action</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">Target</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">Details</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {auditLogs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                                        <td className="px-6 py-3 font-mono text-xs">{log.user_id || 'System'}</td>
                                                        <td className="px-6 py-3 font-medium text-slate-800">{log.action}</td>
                                                        <td className="px-6 py-3">{log.target_type} #{log.target_id}</td>
                                                        <td className="px-6 py-3">
                                                            <div className="max-w-xs truncate text-xs font-mono text-slate-500" title={JSON.stringify(log.details, null, 2)}>
                                                                {JSON.stringify(log.details)}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[#1e1e1e] rounded-xl shadow-lg border border-slate-800 overflow-hidden flex flex-col h-[70vh]">
                                    <div className="px-4 py-2 bg-[#2d2d2d] border-b border-[#3e3e3e] flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
                                            <div className="w-3 h-3 rounded-full bg-[#febc2e]"></div>
                                            <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
                                        </div>
                                        <span className="text-xs text-slate-400 font-mono">server.log (Live)</span>
                                        <button onClick={fetchServerLogs} className="text-slate-400 hover:text-white text-xs">Refresh</button>
                                    </div>
                                    <div className="flex-1 overflow-auto p-4 font-mono text-xs md:text-sm">
                                        {serverLogs.length > 0 ? (
                                            serverLogs.map((line, i) => (
                                                <div key={i} className="whitespace-pre-wrap break-all hover:bg-[#2d2d2d] px-1 py-0.5 rounded">
                                                    {line.includes('INFO') ? <span className="text-blue-400">INFO </span> :
                                                        line.includes('ERROR') ? <span className="text-red-400">ERROR</span> :
                                                            line.includes('WARNING') ? <span className="text-yellow-400">WARN </span> :
                                                                <span className="text-slate-500">LOG  </span>}
                                                    <span className="text-slate-300">{line}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-slate-500 italic">No logs found or empty file.</div>
                                        )}
                                        {/* Scroll anchor */}
                                        <div ref={(el) => { if (el) el.scrollIntoView({ behavior: 'smooth' }); }}></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sessions Tab */}
                    {activeTab === 'sessions' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-slate-800">Session Management</h2>
                                <button onClick={fetchSessions} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                                    Refresh
                                </button>
                            </div>

                            {/* Create/Edit Form */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                                    {editingSession ? 'Edit Session' : 'Create New Session'}
                                </h3>
                                <form onSubmit={editingSession ? handleUpdateSession : handleCreateSession} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Session Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={sessionForm.name}
                                            onChange={(e) => setSessionForm({ name: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                            placeholder="e.g., 2023-2024 or 2023 Admitted"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Format: YYYY-YYYY or YYYY Admitted</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Saving...' : editingSession ? 'Update' : 'Create'}
                                        </button>
                                        {editingSession && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingSession(null);
                                                    setSessionForm({ name: '' });
                                                }}
                                                className="bg-slate-200 text-slate-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* Sessions List */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="text-lg font-bold text-slate-800">All Sessions</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-slate-600">
                                        <thead className="bg-slate-50 text-slate-700 font-semibold">
                                            <tr>
                                                <th className="px-6 py-3 border-b border-slate-200">ID</th>
                                                <th className="px-6 py-3 border-b border-slate-200">Name</th>
                                                <th className="px-6 py-3 border-b border-slate-200">Status</th>
                                                <th className="px-6 py-3 border-b border-slate-200">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {sessions.map((session) => (
                                                <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3 font-mono text-xs">#{session.id}</td>
                                                    <td className="px-6 py-3 font-medium text-slate-900">{session.name}</td>
                                                    <td className="px-6 py-3">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${session.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                                            }`}>
                                                            {session.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingSession(session);
                                                                    setSessionForm({ name: session.name });
                                                                }}
                                                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSession(session.id)}
                                                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                                                            >
                                                                Deactivate
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Communications Tab */}
                    {activeTab === 'communications' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800">Communication Center</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-2">
                                    <form onSubmit={handleSendEmail} className="space-y-5 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Target Group</label>
                                                <select
                                                    value={emailForm.target_group}
                                                    onChange={(e) => setEmailForm({ ...emailForm, target_group: e.target.value, target_id: '' })}
                                                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                                                >
                                                    <option value="all">All Students</option>
                                                    <option value="department">Specific Department</option>
                                                    <option value="scholarship">Specific Scholarship Applicants</option>
                                                    <option value="custom">Custom Email List</option>
                                                </select>
                                            </div>

                                            {emailForm.target_group === 'department' && (
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g., Computer Science"
                                                        value={emailForm.target_id}
                                                        onChange={(e) => setEmailForm({ ...emailForm, target_id: e.target.value })}
                                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                                        required
                                                    />
                                                </div>
                                            )}

                                            {emailForm.target_group === 'scholarship' && (
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Scholarship ID</label>
                                                    <input
                                                        type="number"
                                                        placeholder="e.g., 1"
                                                        value={emailForm.target_id}
                                                        onChange={(e) => setEmailForm({ ...emailForm, target_id: e.target.value })}
                                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                                        required
                                                    />
                                                </div>
                                            )}

                                            {emailForm.target_group === 'custom' && (
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Recipients (Comma separated)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="email1@example.com, email2@example.com"
                                                        onChange={(e) => setEmailForm({ ...emailForm, custom_recipients: e.target.value.split(',').map(e => e.trim()) })}
                                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                                        required
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
                                            <input
                                                type="text"
                                                value={emailForm.subject}
                                                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message Body</label>
                                            <textarea
                                                rows="6"
                                                value={emailForm.body}
                                                onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                                                required
                                            ></textarea>
                                            <p className="text-xs text-slate-500 mt-1">Supports basic HTML formatting.</p>
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="bg-primary-600 text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
                                            >
                                                {loading ? 'Sending...' : 'Send Broadcast'}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Usage Guidelines
                                    </h3>
                                    <ul className="space-y-3 text-sm text-slate-600">
                                        <li className="flex gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0"></span>
                                            <span>Use <strong>All Students</strong> for major announcements like deadline extensions or new scholarship launches.</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0"></span>
                                            <span>Target <strong>Specific Departments</strong> for department-specific news.</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0"></span>
                                            <span>Use <strong>Scholarship ID</strong> to communicate with applicants of a specific fund.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
