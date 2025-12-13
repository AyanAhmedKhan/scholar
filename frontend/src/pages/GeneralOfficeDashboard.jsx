import React, { useEffect, useState } from 'react';
import api from '../services/api';
import MergedPDFButton from '../components/MergedPDFButton';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

const GeneralOfficeDashboard = () => {
    const [activeTab, setActiveTab] = useState('applications');
    const [applications, setApplications] = useState([]);
    const [scholarships, setScholarships] = useState([]);
    const [students, setStudents] = useState({});
    const [expandedAppId, setExpandedAppId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedApps, setSelectedApps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Status update modal
    const [statusModal, setStatusModal] = useState({ open: false, appId: null, status: '' });
    const [remarks, setRemarks] = useState('');
    const [selectedIssues, setSelectedIssues] = useState([]);

    // Document rejection modal
    const [docRejectModal, setDocRejectModal] = useState({ open: false, docId: null, remarks: '' });

    // Student Details Modal
    const [studentModal, setStudentModal] = useState({ open: false, app: null });

    // Email form
    const [emailForm, setEmailForm] = useState({
        target_group: 'all',
        target_id: '',
        custom_recipients: [],
        subject: '',
        body: ''
    });

    // Analytics
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        if (activeTab === 'applications') {
            fetchApplications();
            fetchScholarships();
        } else if (activeTab === 'analytics') {
            fetchAnalytics();
        }
    }, [activeTab]);

    const showSuccess = (msg) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(''), 3000);
    };

    const showError = (msg) => {
        setError(msg);
        setTimeout(() => setError(''), 5000);
    };

    const fetchScholarships = async () => {
        try {
            const res = await api.get('/scholarships/');
            setScholarships(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/applications');
            setApplications(res.data);
            // Student details are now eagerly loaded from backend
        } catch (e) {
            showError('Failed to fetch applications');
            console.error(e);
        } finally {
            setLoading(false);
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

    const handleVerifyDocument = async (docId, isVerified) => {
        if (!isVerified) {
            // Open rejection modal instead of immediate API call
            setDocRejectModal({ open: true, docId, remarks: '' });
            return;
        }

        try {
            await api.put(`/admin/applications/documents/${docId}/verify`, {
                is_verified: true,
                remarks: null
            });

            updateDocStatusInState(docId, true, null);
            showSuccess('Document verified successfully');
        } catch (e) {
            console.error(e);
            showError('Failed to verify document');
        }
    };

    const submitDocRejection = async () => {
        if (!docRejectModal.remarks.trim()) {
            showError('Please enter rejection remarks');
            return;
        }

        setLoading(true);
        try {
            await api.put(`/admin/applications/documents/${docRejectModal.docId}/verify`, {
                is_verified: false,
                remarks: docRejectModal.remarks
            });

            updateDocStatusInState(docRejectModal.docId, false, docRejectModal.remarks);
            setDocRejectModal({ open: false, docId: null, remarks: '' });
            showSuccess('Document rejected');
        } catch (e) {
            console.error(e);
            showError('Failed to reject document');
        } finally {
            setLoading(false);
        }
    };

    const updateDocStatusInState = (docId, isVerified, remarks) => {
        // Update applications list to reflect changes in the dashboard
        setApplications(prevApps => prevApps.map(app => {
            const hasDoc = app.documents?.some(d => d.id === docId);
            if (!hasDoc) return app;
            return {
                ...app,
                documents: app.documents.map(d =>
                    d.id === docId ? { ...d, is_verified: isVerified, remarks: remarks } : d
                )
            };
        }));

        // Safely update studentModal if it's open and showing this application
        setStudentModal(prev => {
            if (!prev.app || !prev.app.documents) return prev;
            const hasDoc = prev.app.documents.some(d => d.id === docId);
            if (!hasDoc) return prev;

            return {
                ...prev,
                app: {
                    ...prev.app,
                    documents: prev.app.documents.map(d =>
                        d.id === docId ? { ...d, is_verified: isVerified, remarks: remarks } : d
                    )
                }
            };
        });
    };

    const getScholarshipName = (id) => {
        const sch = scholarships.find(s => s.id === id);
        return sch?.name || `Scholarship #${id}`;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-50 text-green-700 border-green-200';
            case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
            case 'docs_required': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'under_verification': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'submitted': return 'bg-amber-50 text-amber-700 border-amber-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    // Filter applications
    const filteredApplications = applications.filter(app => {
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        const matchesSearch = searchQuery === '' ||
            getScholarshipName(app.scholarship_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.id.toString().includes(searchQuery) ||
            app.student_id.toString().includes(searchQuery);
        return matchesStatus && matchesSearch;
    });

    // Stats
    const stats = {
        total: applications.length,
        pending: applications.filter(a => ['submitted', 'under_verification'].includes(a.status)).length,
        approved: applications.filter(a => a.status === 'approved').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        docsRequired: applications.filter(a => a.status === 'docs_required').length
    };

    const handleStatusUpdate = async () => {
        if (!statusModal.appId || !statusModal.status) return;

        if (statusModal.status === 'docs_required' && !remarks.trim()) {
            showError('Reason for return is required');
            return;
        }

        let finalRemarks = remarks || null;

        if (statusModal.status === 'docs_required') {
            if (selectedIssues.length === 0 && !remarks.trim()) {
                showError('Please select at least one issue or add remarks');
                return;
            }
            const issuesText = selectedIssues.length > 0
                ? "ACTION REQUIRED:\n" + selectedIssues.map(i => `- ${i}`).join('\n') + "\n\n"
                : "";
            finalRemarks = issuesText + (remarks ? "NOTES:\n" + remarks : "");
        }

        setLoading(true);
        try {
            await api.put(`/admin/applications/${statusModal.appId}/status`, {
                status: statusModal.status,
                remarks: finalRemarks
            });
            showSuccess('Application status updated successfully');
            setStatusModal({ open: false, appId: null, status: null });
            setRemarks('');
            setSelectedIssues([]);
            fetchApplications();
        } catch (err) {
            showError(err.response?.data?.detail || 'Failed to update status');
        } finally {
            setLoading(false);
        }
    };



    const handleBulkStatusUpdate = async (status) => {
        if (selectedApps.length === 0) {
            showError('Please select at least one application');
            return;
        }

        if (!window.confirm(`Update ${selectedApps.length} application(s) to ${status}?`)) return;

        setLoading(true);
        try {
            const promises = selectedApps.map(appId =>
                api.put(`/admin/applications/${appId}/status`, { status, remarks: null })
            );
            await Promise.all(promises);
            showSuccess(`${selectedApps.length} application(s) updated successfully`);
            setSelectedApps([]);
            fetchApplications();
        } catch (err) {
            showError('Failed to update applications');
        } finally {
            setLoading(false);
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

    const handleExport = async () => {
        try {
            const response = await api.get('/admin/export/applications', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'applications.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            showSuccess('Export completed');
        } catch (e) {
            showError('Export failed');
        }
    };

    const toggleExpand = (appId) => {
        setExpandedAppId(expandedAppId === appId ? null : appId);
    };

    const toggleSelectApp = (appId) => {
        setSelectedApps(prev =>
            prev.includes(appId)
                ? prev.filter(id => id !== appId)
                : [...prev, appId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedApps.length === filteredApplications.length) {
            setSelectedApps([]);
        } else {
            setSelectedApps(filteredApplications.map(app => app.id));
        }
    };

    const tabs = [
        { id: 'applications', label: 'Applications', icon: '📋' },
        { id: 'analytics', label: 'Analytics', icon: '📊' },
        { id: 'communications', label: 'Communications', icon: '📧' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 font-display">General Office Dashboard</h1>
                    <p className="text-sm text-slate-500">Manage scholarship applications and verification</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="bg-white text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        Export CSV
                    </button>
                    <Link
                        to="/scholarship-management"
                        className="bg-primary-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Manage Scholarships
                    </Link>
                </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {success}
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">Total Apps</div>
                </div>
                <div
                    className="bg-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm cursor-pointer hover:shadow-md transition-all group"
                    onClick={() => setStatusFilter(statusFilter === 'submitted' ? 'all' : 'submitted')}
                >
                    <div className="text-2xl font-bold text-blue-700 group-hover:text-blue-800">{stats.pending}</div>
                    <div className="text-xs text-blue-600 font-medium uppercase tracking-wide mt-1">Pending</div>
                </div>
                <div
                    className="bg-green-50 p-4 rounded-lg border border-green-100 shadow-sm cursor-pointer hover:shadow-md transition-all group"
                    onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}
                >
                    <div className="text-2xl font-bold text-green-700 group-hover:text-green-800">{stats.approved}</div>
                    <div className="text-xs text-green-600 font-medium uppercase tracking-wide mt-1">Approved</div>
                </div>
                <div
                    className="bg-red-50 p-4 rounded-lg border border-red-100 shadow-sm cursor-pointer hover:shadow-md transition-all group"
                    onClick={() => setStatusFilter(statusFilter === 'rejected' ? 'all' : 'rejected')}
                >
                    <div className="text-2xl font-bold text-red-700 group-hover:text-red-800">{stats.rejected}</div>
                    <div className="text-xs text-red-600 font-medium uppercase tracking-wide mt-1">Rejected</div>
                </div>
                <div
                    className="bg-orange-50 p-4 rounded-lg border border-orange-100 shadow-sm cursor-pointer hover:shadow-md transition-all group"
                    onClick={() => setStatusFilter(statusFilter === 'docs_required' ? 'all' : 'docs_required')}
                >
                    <div className="text-2xl font-bold text-orange-700 group-hover:text-orange-800">{stats.docsRequired}</div>
                    <div className="text-xs text-orange-600 font-medium uppercase tracking-wide mt-1">Docs Req.</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-200 flex items-center justify-between px-4 py-2 bg-slate-50/50">
                    <nav className="flex space-x-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${activeTab === tab.id
                                    ? 'bg-white text-primary-700 shadow-sm border border-slate-200'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                    }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-0">
                    {/* Applications Tab */}
                    {activeTab === 'applications' && (
                        <div className="space-y-4 p-4">
                            {/* Filters and Bulk Actions */}
                            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                                <div className="flex flex-col md:flex-row gap-2 flex-1 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-64">
                                        <input
                                            type="text"
                                            placeholder="Search applications..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 outline-none text-xs"
                                        />
                                        <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-3 py-1.5 rounded-md border border-slate-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 outline-none text-xs bg-white"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="submitted">Submitted</option>
                                        <option value="under_verification">Under Verification</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="docs_required">Docs Required</option>
                                    </select>
                                </div>

                                {selectedApps.length > 0 && (
                                    <div className="flex gap-2 items-center">
                                        <span className="text-xs text-slate-600 font-medium">{selectedApps.length} selected</span>
                                        <div className="h-4 w-px bg-slate-200"></div>
                                        <button
                                            onClick={() => handleBulkStatusUpdate('under_verification')}
                                            className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-medium transition-colors"
                                        >
                                            Review
                                        </button>
                                        <button
                                            onClick={() => handleBulkStatusUpdate('approved')}
                                            className="text-green-600 hover:bg-green-50 px-2 py-1 rounded text-xs font-medium transition-colors"
                                        >
                                            Approve
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Applications Table */}
                            {loading ? (
                                <div className="flex justify-center items-center h-48">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                            ) : filteredApplications.length === 0 ? (
                                <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                                    <p className="text-slate-500 text-sm">No applications found matching your criteria.</p>
                                </div>
                            ) : (
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs text-slate-600">
                                            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-2 border-b border-slate-200 w-8">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedApps.length === filteredApplications.length && filteredApplications.length > 0}
                                                            onChange={toggleSelectAll}
                                                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-3 w-3"
                                                        />
                                                    </th>
                                                    <th className="px-4 py-2 border-b border-slate-200">ID / Date</th>
                                                    <th className="px-4 py-2 border-b border-slate-200">Scholarship</th>
                                                    <th className="px-4 py-2 border-b border-slate-200">Student</th>
                                                    <th className="px-4 py-2 border-b border-slate-200">Status</th>
                                                    <th className="px-4 py-2 border-b border-slate-200">Docs</th>
                                                    <th className="px-4 py-2 border-b border-slate-200 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredApplications.map((app) => (
                                                    <React.Fragment key={app.id}>
                                                        <tr className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${expandedAppId === app.id ? 'bg-slate-50' : ''}`} onClick={() => toggleExpand(app.id)}>
                                                            <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedApps.includes(app.id)}
                                                                    onChange={() => toggleSelectApp(app.id)}
                                                                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-3 w-3"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <div className="flex flex-col">
                                                                    <span className="font-mono text-slate-700 font-medium">#{app.id}</span>
                                                                    <span className="text-[10px] text-slate-400">{new Date(app.created_at).toLocaleDateString()}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2 font-medium text-slate-700 truncate max-w-[150px]" title={getScholarshipName(app.scholarship_id)}>
                                                                {getScholarshipName(app.scholarship_id)}
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <div
                                                                    className="group flex flex-col"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setStudentModal({ open: true, app: app });
                                                                    }}
                                                                >
                                                                    <span className="font-medium text-primary-600 group-hover:underline cursor-pointer">
                                                                        {app.student?.full_name || `Student #${app.student_id}`}
                                                                    </span>
                                                                    {app.student?.profile?.enrollment_no && (
                                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                                            {app.student.profile.enrollment_no}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(app.status)}`}>
                                                                    {app.status.replace(/_/g, ' ')}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <MergedPDFButton applicationId={app.id} compact={true} />
                                                            </td>
                                                            <td className="px-4 py-2 text-right">
                                                                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                                    <button
                                                                        onClick={() => setStatusModal({ open: true, appId: app.id, status: 'approved' })}
                                                                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                                        title="Approve"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setStatusModal({ open: true, appId: app.id, status: 'rejected' })}
                                                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                        title="Reject"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setStatusModal({ open: true, appId: app.id, status: 'docs_required' })}
                                                                        className="p-1 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                                                        title="Request Changes"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {expandedAppId === app.id && (
                                                            <tr className="bg-slate-50/50">
                                                                <td colSpan="7" className="px-6 py-6">
                                                                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                                                                        {/* Application Details */}
                                                                        <div>
                                                                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                                                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                                </svg>
                                                                                Application Details
                                                                            </h3>
                                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                                                <div>
                                                                                    <span className="text-slate-500">Application ID:</span>
                                                                                    <div className="font-medium text-slate-800">#{app.id}</div>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="text-slate-500">Student ID:</span>
                                                                                    <div className="font-medium text-slate-800">#{app.student_id}</div>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="text-slate-500">Scholarship:</span>
                                                                                    <div className="font-medium text-slate-800">{getScholarshipName(app.scholarship_id)}</div>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="text-slate-500">Created:</span>
                                                                                    <div className="font-medium text-slate-800">{new Date(app.created_at).toLocaleString()}</div>
                                                                                </div>
                                                                            </div>
                                                                            {app.remarks && (
                                                                                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                                                    <span className="text-xs font-semibold text-amber-800">Remarks:</span>
                                                                                    <p className="text-sm text-amber-700 mt-1">{app.remarks}</p>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Document Verification */}
                                                                        <div>
                                                                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                                                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                                </svg>
                                                                                Document Verification
                                                                            </h3>
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                {app.documents && app.documents.length > 0 ? (
                                                                                    app.documents.map(doc => (
                                                                                        <div key={doc.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center group hover:border-primary-200 transition-colors">
                                                                                            <div className="flex-1">
                                                                                                <p className="font-semibold text-slate-700 text-sm">
                                                                                                    {doc.document_format?.name || `Document #${doc.id}`}
                                                                                                </p>
                                                                                                <a
                                                                                                    href={`http://localhost:8000/media${doc.file_path}`}
                                                                                                    target="_blank"
                                                                                                    rel="noopener noreferrer"
                                                                                                    className="flex items-center gap-1 hover:text-primary-600 transition-colors"
                                                                                                >
                                                                                                    View File
                                                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                                                                </a>
                                                                                                {doc.remarks && (
                                                                                                    <p className="text-xs text-red-500 mt-1 font-medium bg-red-50 px-2 py-0.5 rounded w-fit">
                                                                                                        Remarks: {doc.remarks}
                                                                                                    </p>
                                                                                                )}
                                                                                            </div>
                                                                                            <div className="flex gap-2">
                                                                                                {doc.is_verified ? (
                                                                                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 border border-green-200">
                                                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                                        </svg>
                                                                                                        Verified
                                                                                                    </span>
                                                                                                ) : (
                                                                                                    <>
                                                                                                        <button
                                                                                                            onClick={() => handleVerifyDocument(doc.id, true)}
                                                                                                            className="bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-lg text-xs font-medium border border-green-200 shadow-sm transition-colors"
                                                                                                        >
                                                                                                            Accept
                                                                                                        </button>
                                                                                                        <button
                                                                                                            onClick={() => handleVerifyDocument(doc.id, false)}
                                                                                                            className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 shadow-sm transition-colors"
                                                                                                        >
                                                                                                            Reject
                                                                                                        </button>
                                                                                                    </>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    ))
                                                                                ) : (
                                                                                    <div className="col-span-2 text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                                                                        No documents attached to this application.
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Analytics Tab */}
                    {activeTab === 'analytics' && analytics && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800">Application Analytics</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-800 mb-6">Application Status Distribution</h3>
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
                                                        placeholder="e.g. Computer Science"
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
                                                        placeholder="e.g. 1"
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

            {/* Status Update Modal */}
            {statusModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Update Application Status</h3>

                        {/* Checkboxes for Return */}
                        {statusModal.status === 'docs_required' && (() => {
                            const app = applications.find(a => a.id === statusModal.appId);
                            const toggleIssue = (issue) => {
                                setSelectedIssues(prev =>
                                    prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
                                );
                            };
                            return (
                                <div className="mb-4 space-y-2 bg-orange-50 p-4 rounded-lg border border-orange-200">
                                    <label className="block text-sm font-bold text-orange-800 mb-2">What needs to be fixed?</label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedIssues.includes('Profile Information')}
                                            onChange={() => toggleIssue('Profile Information')}
                                            className="rounded text-orange-600 focus:ring-orange-500"
                                        />
                                        <span className="text-sm text-slate-700">Profile Information</span>
                                    </label>

                                    {app?.documents?.map(doc => (
                                        <label key={doc.id} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedIssues.includes(`Document: ${doc.document_format?.name || 'Unknown'}`)}
                                                onChange={() => toggleIssue(`Document: ${doc.document_format?.name || 'Unknown'}`)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-slate-700">Document: {doc.document_format?.name}</span>
                                        </label>
                                    ))}
                                </div>
                            );
                        })()}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Status</label>
                                <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${getStatusColor(statusModal.status)}`}>
                                        {statusModal.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    {statusModal.status === 'docs_required' ? (
                                        <>Reason for Return <span className="text-red-500">*</span></>
                                    ) : (
                                        'Remarks (Optional)'
                                    )}
                                </label>
                                <textarea
                                    rows="4"
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                                    placeholder={statusModal.status === 'docs_required' ? "Explain what needs to be corrected..." : "Add any remarks or notes..."}
                                ></textarea>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleStatusUpdate}
                                disabled={loading}
                                className="flex-1 bg-primary-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Updating...' : 'Update Status'}
                            </button>
                            <button
                                onClick={() => {
                                    setStatusModal({ open: false, appId: null, status: null });
                                    setRemarks('');
                                    setSelectedIssues([]);
                                }}
                                className="flex-1 bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}



            {/* Student Details Modal */}
            {studentModal.open && studentModal.app && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Student Details</h2>
                                <p className="text-slate-500 text-sm">
                                    Viewing application for <span className="font-semibold text-primary-600">{studentModal.app.student?.full_name}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setStudentModal({ open: false, app: null })}
                                className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-full border border-slate-200 hover:border-slate-300"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-8">
                            {/* Personal Information */}
                            {studentModal.app.student?.profile ? (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Profile Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { label: 'Enrollment No', value: studentModal.app.student.profile.enrollment_no },
                                            { label: 'Email', value: studentModal.app.student.email },
                                            { label: 'Mobile', value: studentModal.app.student.profile.mobile_number },
                                            { label: 'Date of Birth', value: studentModal.app.student.profile.date_of_birth },
                                            { label: 'Gender', value: studentModal.app.student.profile.gender },
                                            { label: 'Category', value: studentModal.app.student.profile.category },
                                            { label: 'Department', value: studentModal.app.student.profile.department },
                                            { label: 'Father Name', value: studentModal.app.student.profile.father_name },
                                            { label: 'Current Semester', value: studentModal.app.student.profile.current_year_or_semester },
                                        ].map((field, i) => (
                                            <div key={i} className="group">
                                                <div className="text-xs text-slate-500 font-medium mb-1 group-hover:text-primary-600 transition-colors">{field.label}</div>
                                                <div className="text-sm text-slate-900 font-semibold break-words">{field.value || 'N/A'}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                        <div>
                                            <div className="text-xs text-slate-500 font-medium mb-1">Permanent Address</div>
                                            <div className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                {studentModal.app.student.profile.permanent_address || 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 font-medium mb-1">Bank Details</div>
                                            <div className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <p><span className="text-slate-500">Bank:</span> {studentModal.app.student.profile.bank_name}</p>
                                                <p><span className="text-slate-500">A/C:</span> {studentModal.app.student.profile.account_number}</p>
                                                <p><span className="text-slate-500">IFSC:</span> {studentModal.app.student.profile.ifsc_code}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
                                    No profile information available.
                                </div>
                            )}

                            {/* Documents */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Submitted Documents</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {studentModal.app.documents?.map((doc) => (
                                        <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-primary-200 transition-all group relative overflow-hidden">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {doc.is_verified ? (
                                                        <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded shadow-sm border border-green-100 flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                            Verified
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded shadow-sm border border-amber-100">Pending</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mb-2">
                                                {!doc.is_verified && (
                                                    <>
                                                        <button
                                                            onClick={() => handleVerifyDocument(doc.id, true)}
                                                            className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 transition-colors text-xs font-semibold shadow-sm"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerifyDocument(doc.id, false)}
                                                            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors text-xs font-semibold shadow-sm"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {doc.is_verified && (
                                                    <button
                                                        onClick={() => handleVerifyDocument(doc.id, false)}
                                                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors text-xs font-semibold shadow-sm"
                                                    >
                                                        Reject
                                                    </button>
                                                )}
                                            </div>
                                            <h4 className="font-semibold text-slate-800 text-sm mb-1 line-clamp-1" title={doc.document_format?.name}>
                                                {doc.document_format?.name || 'Document'}
                                            </h4>
                                            <p className="text-xs text-slate-500 mb-4">Uploaded {new Date().toLocaleDateString()}</p>

                                            <a
                                                href={`http://localhost:8000/media${doc.file_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full py-2 bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold hover:bg-primary-600 hover:text-white transition-all"
                                            >
                                                <span>View File</span>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                            </a>
                                        </div>
                                    ))}
                                    {(!studentModal.app.documents || studentModal.app.documents.length === 0) && (
                                        <div className="col-span-full p-6 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                            No documents submitted.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                            <div className="flex gap-2 mr-auto">
                                <button
                                    onClick={() => {
                                        const appId = studentModal.app.id;
                                        setStudentModal({ open: false, app: null });
                                        setStatusModal({ open: true, appId: appId, status: 'under_verification' });
                                    }}
                                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2.5 rounded-xl font-medium border border-blue-200 transition-colors shadow-sm"
                                >
                                    Review
                                </button>
                                <button
                                    onClick={() => {
                                        const appId = studentModal.app.id;
                                        setStudentModal({ open: false, app: null });
                                        setStatusModal({ open: true, appId: appId, status: 'docs_required' });
                                    }}
                                    className="bg-orange-50 text-orange-600 hover:bg-orange-100 px-4 py-2.5 rounded-xl font-medium border border-orange-200 transition-colors shadow-sm"
                                >
                                    Return
                                </button>
                                <button
                                    onClick={() => {
                                        const appId = studentModal.app.id;
                                        setStudentModal({ open: false, app: null });
                                        setStatusModal({ open: true, appId: appId, status: 'rejected' });
                                    }}
                                    className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2.5 rounded-xl font-medium border border-red-200 transition-colors shadow-sm"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => {
                                        const appId = studentModal.app.id;
                                        setStudentModal({ open: false, app: null });
                                        setStatusModal({ open: true, appId: appId, status: 'approved' });
                                    }}
                                    className="bg-green-50 text-green-600 hover:bg-green-100 px-4 py-2.5 rounded-xl font-medium border border-green-200 transition-colors shadow-sm"
                                >
                                    Approve
                                </button>
                            </div>
                            <button
                                onClick={() => setStudentModal({ open: false, app: null })}
                                className="px-6 py-2.5 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                            >
                                Close Values
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Document Rejection Modal */}
            {docRejectModal.open && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-scale-in">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Reject Document</h3>
                            <p className="text-slate-600 text-sm mb-4">
                                Please specify the reason for rejecting this document. This will be visible to the student.
                            </p>
                            <textarea
                                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all resize-none text-slate-700 placeholder:text-slate-400"
                                rows="4"
                                placeholder="e.g., Document is blurry, Incorrect format, Name mismatch..."
                                value={docRejectModal.remarks}
                                onChange={(e) => setDocRejectModal(prev => ({ ...prev, remarks: e.target.value }))}
                            />
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setDocRejectModal({ open: false, docId: null, remarks: '' })}
                                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitDocRejection}
                                    className="px-6 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all"
                                >
                                    Reject Document
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeneralOfficeDashboard;
