import React, { useEffect, useState } from 'react';
import api from '../services/api';
import MergedPDFButton from '../components/MergedPDFButton';

const DeptHeadDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [applications, setApplications] = useState([]);
    const [students, setStudents] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const statsRes = await api.get('/admin/dept/stats');
            setStats(statsRes.data);

            const appRes = await api.get('/admin/dept/applications');
            setApplications(appRes.data);

            const stuRes = await api.get('/admin/dept/students');
            setStudents(stuRes.data);
        } catch (e) {
            console.error(e);
        }
    };

    const StatCard = ({ title, value, colorClass }) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">{title}</h3>
            <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 font-display">Department Dashboard</h1>
                    <p className="text-slate-500">Overview of department students and applications.</p>
                </div>
                <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                    {['overview', 'students', 'applications'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${activeTab === tab
                                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'overview' && stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard title="Total Students" value={stats.total_students} colorClass="text-slate-800" />
                    <StatCard title="Total Applications" value={stats.total_applications} colorClass="text-blue-600" />
                    <StatCard title="Pending Review" value={stats.pending_applications} colorClass="text-amber-600" />
                    <StatCard title="Approved" value={stats.approved_applications} colorClass="text-green-600" />
                </div>
            )}

            {activeTab === 'students' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-lg font-bold text-slate-800">Department Students</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 font-semibold">
                                <tr>
                                    <th className="px-6 py-3 border-b border-slate-200">Roll No</th>
                                    <th className="px-6 py-3 border-b border-slate-200">Name</th>
                                    <th className="px-6 py-3 border-b border-slate-200">Semester</th>
                                    <th className="px-6 py-3 border-b border-slate-200">Category</th>
                                    <th className="px-6 py-3 border-b border-slate-200">Contact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.map((stu) => (
                                    <tr key={stu.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3 font-mono text-xs">{stu.roll_number}</td>
                                        <td className="px-6 py-3 font-medium text-slate-900">{stu.full_name || 'N/A'}</td>
                                        <td className="px-6 py-3">{stu.current_year_or_semester}</td>
                                        <td className="px-6 py-3">
                                            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                                                {stu.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">{stu.mobile_number}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'applications' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-lg font-bold text-slate-800">Department Applications</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 font-semibold">
                                <tr>
                                    <th className="px-6 py-3 border-b border-slate-200">App ID</th>
                                    <th className="px-6 py-3 border-b border-slate-200">Student ID</th>
                                    <th className="px-6 py-3 border-b border-slate-200">Scholarship ID</th>
                                    <th className="px-6 py-3 border-b border-slate-200">Status</th>
                                    <th className="px-6 py-3 border-b border-slate-200">Documents</th>
                                    <th className="px-6 py-3 border-b border-slate-200">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {applications.map((app) => (
                                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3 font-mono text-xs">#{app.id}</td>
                                        <td className="px-6 py-3">{app.student_id}</td>
                                        <td className="px-6 py-3">{app.scholarship_id}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize border
                                                ${app.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    app.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                {app.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <MergedPDFButton applicationId={app.id} />
                                        </td>
                                        <td className="px-6 py-3 text-slate-500">{new Date(app.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeptHeadDashboard;
