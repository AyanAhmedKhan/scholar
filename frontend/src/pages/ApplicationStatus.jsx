import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import MergedPDFButton from '../components/MergedPDFButton';

const ApplicationStatus = () => {
    const { id } = useParams();
    const [application, setApplication] = useState(null);
    const [scholarship, setScholarship] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApp = async () => {
            try {
                const res = await api.get('/applications/');
                const app = res.data.find(a => a.id === parseInt(id));
                setApplication(app);

                if (app?.scholarship_id) {
                    const schRes = await api.get(`/scholarships/${app.scholarship_id}`);
                    setScholarship(schRes.data);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchApp();
    }, [id]);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    if (!application) return (
        <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Application not found</h3>
            <p className="text-slate-500 mt-1">The application you're looking for doesn't exist.</p>
            <Link to="/dashboard" className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-semibold">← Back to Dashboard</Link>
        </div>
    );

    const steps = [
        { status: 'submitted', label: 'Submitted' },
        { status: 'under_verification', label: 'Under Review' },
        { status: 'approved', label: 'Decision' },
    ];

    const getCurrentStepIndex = () => {
        if (application.status === 'approved' || application.status === 'rejected') return 3;
        if (application.status === 'under_verification') return 2;
        return 1;
    };

    const currentStep = getCurrentStepIndex();

    const getStatusInfo = (status) => {
        switch (status) {
            case 'approved': return { color: 'green', label: 'Approved', message: 'Congratulations! Your application has been approved.' };
            case 'rejected': return { color: 'red', label: 'Rejected', message: 'Unfortunately, your application was not approved.' };
            case 'under_verification': return { color: 'blue', label: 'Under Review', message: 'Your application is being reviewed by the scholarship committee.' };
            case 'docs_required': return { color: 'orange', label: 'Documents Required', message: 'Additional documents are required to proceed.' };
            case 'draft': return { color: 'slate', label: 'Draft', message: 'Your application is saved as a draft.' };
            default: return { color: 'amber', label: 'Submitted', message: 'Your application has been submitted and is awaiting review.' };
        }
    };

    const statusInfo = getStatusInfo(application.status);

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
            <Link to="/dashboard" className="inline-flex items-center text-slate-500 hover:text-primary-600 transition-colors group">
                <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Dashboard
            </Link>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className={`p-6 border-b ${statusInfo.color === 'green' ? 'bg-green-50 border-green-100' : statusInfo.color === 'red' ? 'bg-red-50 border-red-100' : statusInfo.color === 'blue' ? 'bg-blue-50 border-blue-100' : statusInfo.color === 'orange' ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                                <span>Application #{application.id}</span>
                                <span>•</span>
                                <span>{new Date(application.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 font-display">{scholarship?.name || `Scholarship #${application.scholarship_id}`}</h1>
                            {scholarship?.category && <span className="inline-block mt-2 text-xs font-semibold bg-white/60 px-2.5 py-1 rounded-full border border-slate-200">{scholarship.category}</span>}
                        </div>
                        <div className={`px-4 py-2 rounded-full text-sm font-bold border flex items-center gap-2 
                            ${statusInfo.color === 'green' ? 'bg-green-100 text-green-700 border-green-200' : 
                              statusInfo.color === 'red' ? 'bg-red-100 text-red-700 border-red-200' : 
                              statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                              statusInfo.color === 'orange' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
                              'bg-amber-100 text-amber-700 border-amber-200'}`}>
                            <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${statusInfo.color === 'green' ? 'bg-green-500' : statusInfo.color === 'red' ? 'bg-red-500' : statusInfo.color === 'blue' ? 'bg-blue-500' : statusInfo.color === 'orange' ? 'bg-orange-500' : 'bg-amber-500'}`}></span>
                            {statusInfo.label}
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className={`mb-8 p-4 rounded-xl border ${statusInfo.color === 'green' ? 'bg-green-50 border-green-100' : statusInfo.color === 'red' ? 'bg-red-50 border-red-100' : statusInfo.color === 'blue' ? 'bg-blue-50 border-blue-100' : statusInfo.color === 'orange' ? 'bg-orange-50 border-orange-100' : 'bg-amber-50 border-amber-100'}`}>
                        <p className={`font-medium ${statusInfo.color === 'green' ? 'text-green-800' : statusInfo.color === 'red' ? 'text-red-800' : statusInfo.color === 'blue' ? 'text-blue-800' : statusInfo.color === 'orange' ? 'text-orange-800' : 'text-amber-800'}`}>{statusInfo.message}</p>
                        {application.remarks && <p className={`mt-2 text-sm ${statusInfo.color === 'green' ? 'text-green-700' : statusInfo.color === 'red' ? 'text-red-700' : 'text-amber-700'}`}><strong>Remarks:</strong> {application.remarks}</p>}
                    </div>

                    <div className="relative mb-8">
                        <h3 className="font-semibold text-slate-800 mb-4">Application Progress</h3>
                        <div className="relative">
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full"></div>
                            <div className="absolute top-1/2 left-0 h-1 bg-primary-500 -translate-y-1/2 rounded-full transition-all duration-700" style={{ width: `${((currentStep - 1) / 2) * 100}%` }}></div>
                            <div className="relative flex justify-between">
                                {steps.map((step, index) => (
                                    <div key={index} className="flex flex-col items-center gap-2">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 border-2 transition-colors duration-300 ${index < currentStep ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-slate-300 text-slate-300'}`}>
                                            {index < currentStep ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <span className="text-xs font-bold">{index + 1}</span>}
                                        </div>
                                        <p className={`text-sm font-medium text-center ${index < currentStep ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-5">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Submitted Documents
                            </h3>
                            <div className="space-y-3">
                                {application.documents && application.documents.length > 0 ? (
                                    application.documents.map(doc => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-slate-400 border border-slate-200">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">{doc.document_type || `Document #${doc.id}`}</p>
                                                    <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">View File →</a>
                                                </div>
                                            </div>
                                            {doc.is_verified ? <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">Verified</span> : <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">Pending</span>}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500 italic py-4 text-center bg-slate-50 rounded-lg">No documents uploaded.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-5">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Application Details
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-sm text-slate-500">Application ID</span>
                                    <span className="text-sm font-semibold text-slate-800">#{application.id}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-sm text-slate-500">Scholarship</span>
                                    <span className="text-sm font-semibold text-slate-800">{scholarship?.name || `#${application.scholarship_id}`}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-sm text-slate-500">Applied Date</span>
                                    <span className="text-sm font-semibold text-slate-800">{new Date(application.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                                </div>
                                {scholarship?.amount && (
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-sm text-slate-500">Amount</span>
                                        <span className="text-sm font-semibold text-emerald-600">₹{scholarship.amount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="pt-3"><MergedPDFButton applicationId={application.id} /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/scholarships" className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-sm">Browse More Scholarships</Link>
                <Link to="/dashboard" className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors">Go to Dashboard</Link>
            </div>
        </div>
    );
};

export default ApplicationStatus;
