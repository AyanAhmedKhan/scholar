import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';

const Dashboard = () => {
    const [profile, setProfile] = useState(null);
    const [applications, setApplications] = useState([]);
    const [scholarships, setScholarships] = useState([]);

    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (location.state?.message) {
            setToast({ message: location.state.message, type: location.state.type || 'success' });
            // Clear state so toast doesn't reappear on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, appsRes, schRes] = await Promise.all([
                    api.get('/profile/me').catch(() => ({ data: null })),
                    api.get('/applications/'),
                    api.get('/scholarships/')
                ]);
                setProfile(profileRes.data);
                setApplications(appsRes.data);
                setScholarships(schRes.data);
            } catch (e) {
                console.error("Error fetching data", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Helper to get scholarship name by ID
    const getScholarshipName = (scholarshipId) => {
        const sch = scholarships.find(s => s.id === scholarshipId);
        return sch?.name || `Scholarship #${scholarshipId}`;
    };

    const getScholarshipCategory = (scholarshipId) => {
        const sch = scholarships.find(s => s.id === scholarshipId);
        return sch?.category || 'General';
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    const StatCard = ({ title, value, icon, colorClass, link }) => (
        <Link to={link || "#"} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all group">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClass} group-hover:scale-105 transition-transform`}>
                    {icon}
                </div>
                <span className="text-2xl font-bold text-slate-800">{value}</span>
            </div>
            <h3 className="text-slate-500 font-medium text-sm">{title}</h3>
        </Link>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-50 text-green-700 border-green-200';
            case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
            case 'under_verification': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'docs_required': return 'bg-orange-50 text-orange-700 border-orange-200';
            default: return 'bg-amber-50 text-amber-700 border-amber-200';
        }
    };

    return (
        <div className="space-y-8">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary-900 to-primary-800 rounded-2xl p-5 sm:p-8 text-white shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2 font-display">
                            Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
                        </h1>
                        <p className="text-primary-100 text-base sm:text-lg">
                            Here's an overview of your scholarship applications.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        {!profile && (
                            <Link to="/onboarding" className="flex-1 md:flex-none text-center bg-white text-primary-900 hover:bg-slate-50 px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-semibold transition-colors shadow-sm text-sm sm:text-base">
                                Complete Profile
                            </Link>
                        )}
                        <Link to="/scholarships" className="flex-1 md:flex-none text-center bg-primary-700 text-white hover:bg-primary-600 px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-semibold transition-colors border border-primary-600 text-sm sm:text-base">
                            Browse Scholarships
                        </Link>
                    </div>
                </div>
            </div>

            {/* Profile Completion Alert */}
            {!profile && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <svg className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <h3 className="font-semibold text-amber-800">Complete Your Profile</h3>
                        <p className="text-amber-700 text-sm mt-0.5">You need to complete your profile before applying for scholarships.</p>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard
                    title="Total Applications"
                    value={applications.length}
                    colorClass="bg-blue-50 text-blue-600"
                    link="/scholarships"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                />
                <StatCard
                    title="Approved"
                    value={applications.filter(a => a.status === 'approved').length}
                    colorClass="bg-green-50 text-green-600"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard
                    title="Under Review"
                    value={applications.filter(a => ['submitted', 'under_verification'].includes(a.status)).length}
                    colorClass="bg-blue-50 text-blue-600"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                />
                <StatCard
                    title="Action Required"
                    value={applications.filter(a => ['draft', 'docs_required', 'request_changes'].includes(a.status)).length}
                    colorClass="bg-amber-50 text-amber-600"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
            </div>

            {/* Recent Applications */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">Your Applications</h2>
                    <Link to="/scholarships" className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center gap-1 transition-colors">
                        Apply for More <span className="text-lg">→</span>
                    </Link>
                </div>
                <div className="divide-y divide-slate-100">
                    {applications.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">No applications yet</h3>
                            <p className="text-slate-500 mb-6 text-sm">Start your journey by applying for a scholarship.</p>
                            <Link to="/scholarships" className="bg-primary-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
                                Browse Scholarships
                            </Link>
                        </div>
                    ) : (
                        applications.slice(0, 5).map((app) => (
                            <Link key={app.id} to={`/applications/${app.id}`} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-slate-50 transition-colors gap-3 sm:gap-4 group">
                                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-primary-700 font-bold text-sm border border-primary-100 flex-shrink-0">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-semibold text-slate-900 text-base mb-0.5 truncate group-hover:text-primary-700 transition-colors">
                                            {getScholarshipName(app.scholarship_id)}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded">{getScholarshipCategory(app.scholarship_id)}</span>
                                            <span>•</span>
                                            <span>Applied {new Date(app.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
                                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border capitalize ${getStatusColor(app.status)}`}>
                                            {app.status.replace(/_/g, ' ')}
                                        </span>
                                        {app.status === 'docs_required' ? (
                                            <div className="flex flex-col items-end gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault(); // Prevent Link navigation
                                                        navigate(`/apply/${app.scholarship_id}`, { state: { applicationId: app.id, correctionMode: true, adminRemarks: app.remarks } });
                                                    }}
                                                    className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 shadow-md shadow-red-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    Fix Issues
                                                </button>
                                                {app.documents && app.documents.filter(d => d.is_verified === false).length > 0 && (
                                                    <span className="text-[10px] text-red-600 font-medium">
                                                        {app.documents.filter(d => d.is_verified === false).length} docs rejected
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-slate-400 group-hover:text-primary-600 transition-colors p-2 group-hover:bg-primary-50 rounded-lg">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
                {applications.length > 5 && (
                    <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-center">
                        <span className="text-sm text-slate-500">Showing 5 of {applications.length} applications</span>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <Link to="/vault" className="bg-white p-5 rounded-xl border border-slate-200 hover:border-primary-200 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 rounded-lg text-purple-600 group-hover:scale-105 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800">Document Vault</h3>
                            <p className="text-sm text-slate-500">Manage your documents</p>
                        </div>
                    </div>
                </Link>
                <Link to="/helpdesk" className="bg-white p-5 rounded-xl border border-slate-200 hover:border-primary-200 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 group-hover:scale-105 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800">Help & Support</h3>
                            <p className="text-sm text-slate-500">Get assistance</p>
                        </div>
                    </div>
                </Link>
                <Link to="/onboarding" className="bg-white p-5 rounded-xl border border-slate-200 hover:border-primary-200 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600 group-hover:scale-105 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800">Update Profile</h3>
                            <p className="text-sm text-slate-500">Edit your details</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default Dashboard;
