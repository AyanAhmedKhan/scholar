import React, { useEffect, useState } from 'react';
import api from '../services/api';
import DocumentUploader from '../components/DocumentUploader';
import Toast from '../components/Toast';

const DocumentVault = () => {
    const [docTypes, setDocTypes] = useState([]);
    const [myDocs, setMyDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [typesRes, docsRes] = await Promise.all([
                api.get('/documents/types'),
                api.get('/documents/')
            ]);
            setDocTypes(typesRes.data);
            setMyDocs(docsRes.data);
        } catch (e) {
            console.error(e);
            showToast('Failed to load documents.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadSuccess = () => {
        fetchData(); // Refresh list
        showToast('Document uploaded successfully!', 'success');
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 font-display">My Document Vault</h1>
                    <p className="text-slate-500">Securely store and manage your documents for all applications.</p>
                </div>
                <div className="text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    {myDocs.length} / {docTypes.length} Documents Uploaded
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {docTypes.map(type => {
                    const uploadedDoc = myDocs.find(d => d.document_format_id === type.id);
                    return (
                        <div key={type.id} className={`group relative p-6 rounded-xl border transition-all duration-300 hover:shadow-md ${uploadedDoc ? 'bg-white border-slate-200' : 'bg-slate-50/50 border-dashed border-slate-300'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-lg ${uploadedDoc ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                {uploadedDoc ? (
                                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-green-50 text-green-600 px-2 py-1 rounded-full border border-green-100">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        Uploaded
                                    </span>
                                ) : (
                                    type.is_mandatory_vault && <span className="text-[10px] uppercase tracking-wider font-bold bg-red-50 text-red-600 px-2 py-1 rounded-full border border-red-100">Required</span>
                                )}
                            </div>

                            <h3 className="font-bold text-slate-800 mb-1">{type.name}</h3>
                            <p className="text-xs text-slate-500 mb-6 line-clamp-2">{type.description || "No description available."}</p>

                            {uploadedDoc ? (
                                <div className="space-y-3">
                                    <a
                                        href={`http://localhost:8000/media/${uploadedDoc.file_path.replace(/^\/+/, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-center gap-2 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        View Document
                                    </a>
                                    <DocumentUploader
                                        documentType={type.name}
                                        documentFormatId={type.id}
                                        onUploadSuccess={handleUploadSuccess}
                                        showToast={showToast}
                                    />
                                </div>
                            ) : (
                                <div className="mt-auto">
                                    <DocumentUploader
                                        documentType={type.name}
                                        documentFormatId={type.id}
                                        onUploadSuccess={handleUploadSuccess}
                                        showToast={showToast}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default DocumentVault;
