import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import DocumentUploader from '../components/DocumentUploader';

const Renewal = () => {
    const navigate = useNavigate();
    const [renewableScholarships, setRenewableScholarships] = useState([]);
    const [selectedSch, setSelectedSch] = useState(null);
    const [myDocs, setMyDocs] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [remarks, setRemarks] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const showSuccess = (msg) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(''), 3000);
    };

    const showError = (msg) => {
        setError(msg);
        setTimeout(() => setError(''), 5000);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [schRes, docsRes, appsRes] = await Promise.all([
                api.get('/applications/renewable'),
                api.get('/documents/'),
                api.get('/applications/')
            ]);
            setRenewableScholarships(schRes.data);
            setMyDocs(docsRes.data);
            setMyApplications(appsRes.data);
        } catch (e) {
            showError('Failed to fetch data');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadSuccess = () => {
        fetchData();
    };

    const handleSubmit = async (isDraft = false) => {
        if (!selectedSch) return;
        
        setSubmitting(true);
        setError('');
        try {
            await api.post('/applications/renew', {
                scholarship_id: selectedSch.id,
                remarks: remarks || null,
                is_draft: isDraft
            });
            showSuccess(isDraft ? "Renewal draft saved successfully!" : "Renewal submitted successfully!");
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } catch (err) {
            showError(err.response?.data?.detail || "Action failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!selectedSch) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 font-display">Renew Scholarship</h1>
                    <p className="text-slate-500 mt-1">Select a scholarship to renew your application</p>
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

                {renewableScholarships.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Renewable Scholarships</h3>
                        <p className="text-slate-500">You don't have any approved scholarships that can be renewed at this time.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {renewableScholarships.map(sch => {
                            const previousApp = myApplications.find(app => 
                                app.scholarship_id === sch.id && app.status === 'approved'
                            );
                            return (
                                <div key={sch.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-slate-800">{sch.name}</h3>
                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                    🔄 Renewable
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-2">{sch.description}</p>
                                            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                                <span className="bg-slate-100 px-2 py-1 rounded">{sch.category}</span>
                                                {previousApp && (
                                                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                                                        Approved: {new Date(previousApp.created_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedSch(sch)}
                                            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-sm flex items-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Renew Now
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // Filter requirements that need renewal
    const renewalReqs = selectedSch.required_documents?.filter(req => req.is_renewal_required) || [];

    // Check if mandatory renewal items are updated
    const missingRenewalDocs = renewalReqs.filter(req => {
        if (!req.is_mandatory) return false;
        const hasDoc = myDocs.some(d => d.document_format_id === req.document_format_id);
        return !hasDoc;
    });

    const previousApp = myApplications.find(app => 
        app.scholarship_id === selectedSch.id && app.status === 'approved'
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setSelectedSch(null)} 
                    className="text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 font-display">Renew Scholarship</h1>
                    <p className="text-slate-500 mt-1">Update your documents and submit renewal application</p>
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

            {/* Scholarship Info Card */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-6 rounded-xl border border-primary-200">
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-slate-800">{selectedSch.name}</h2>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary-200 text-primary-800 border border-primary-300">
                        🔄 Renewal Application
                    </span>
                </div>
                <p className="text-slate-600 mb-3">{selectedSch.description}</p>
                {previousApp && (
                    <div className="bg-white/50 p-3 rounded-lg border border-primary-200">
                        <p className="text-sm text-slate-700">
                            <span className="font-semibold">Previous Application:</span> Approved on {new Date(previousApp.created_at).toLocaleDateString()}
                        </p>
                    </div>
                )}
            </div>

            {/* Renewal Requirements */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Renewal Requirements
                </h2>
                {renewalReqs.length === 0 ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-700 text-sm">
                            <span className="font-semibold">No specific renewal documents required.</span> Your existing documents will be carried forward. You can add any updated documents if needed.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {renewalReqs.map(req => {
                            const uploadedDoc = myDocs.find(d => d.document_format_id === req.document_format_id);
                            const isMissing = req.is_mandatory && !uploadedDoc;
                            
                            return (
                                <div key={req.id} className={`border rounded-lg p-4 ${isMissing ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-slate-800">{req.document_format?.name || `Document #${req.id}`}</span>
                                                {req.is_mandatory && (
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                                                        Required
                                                    </span>
                                                )}
                                            </div>
                                            {uploadedDoc ? (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium inline-block mt-1">
                                                    ✓ Updated
                                                </span>
                                            ) : (
                                                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium inline-block mt-1">
                                                    ⚠ Pending Update
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded border border-blue-100 mb-3">
                                        <p className="text-sm text-blue-800">
                                            <span className="font-semibold">Instruction:</span> {req.renewal_instruction || "Please upload the latest version of this document."}
                                        </p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                                        <DocumentUploader
                                            documentType={req.document_format?.name || `Document #${req.id}`}
                                            documentFormatId={req.document_format_id}
                                            onUploadSuccess={handleUploadSuccess}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Renewal Remarks */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Renewal Remarks</h2>
                <textarea
                    className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                    rows="4"
                    placeholder="Any changes in bank details, address, or other remarks..."
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-2">Optional: Add any notes about changes or updates</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button
                    onClick={() => handleSubmit(true)}
                    disabled={submitting}
                    className="flex-1 bg-white border-2 border-slate-300 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Draft
                </button>
                <button
                    onClick={() => handleSubmit(false)}
                    disabled={submitting || missingRenewalDocs.length > 0}
                    className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                    {submitting ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Submitting...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Submit Renewal
                        </>
                    )}
                </button>
            </div>

            {/* Missing Documents Warning */}
            {missingRenewalDocs.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <h3 className="font-semibold text-red-800 mb-1">Missing Required Documents</h3>
                            <p className="text-sm text-red-700 mb-2">Please upload the following documents before submitting:</p>
                            <ul className="list-disc list-inside text-sm text-red-700">
                                {missingRenewalDocs.map(doc => (
                                    <li key={doc.id}>{doc.document_format?.name || `Document #${doc.id}`}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Renewal;
