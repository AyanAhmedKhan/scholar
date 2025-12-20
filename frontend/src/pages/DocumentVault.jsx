import React, { useEffect, useState } from 'react';
import api from '../services/api';
import DocumentUploader from '../components/DocumentUploader';
import Toast from '../components/Toast';
import FilePreviewModal from '../components/FilePreviewModal';

const DocumentVault = () => {
    const [docTypes, setDocTypes] = useState([]);
    const [myDocs, setMyDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);

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

    const handlePreview = async (doc) => {
        try {
            // Check if it's a PDF or Image based on extension
            const isPdf = doc.file_path.toLowerCase().endsWith('.pdf');
            const fileType = isPdf ? 'application/pdf' : 'image/jpeg'; // Fallback for images

            // Fetch the file as a blob with authentication
            const response = await api.get(`/documents/${doc.id}/preview`, {
                responseType: 'blob'
            });

            // Create a local object URL
            const blob = new Blob([response.data], { type: fileType });
            const url = URL.createObjectURL(blob);

            setPreviewFile({ url, type: isPdf ? 'pdf' : 'image', name: doc.document_format_id });
        } catch (error) {
            console.error("Preview error:", error);
            showToast("Failed to load document preview", "error");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg shadow-blue-900/20">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display mb-2">My Document Vault</h1>
                        <p className="text-blue-100 max-w-xl text-lg">
                            Securely store and manage your official documents. Updates here automatically sync with your applications.
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/20">
                        <span className="text-3xl font-bold">{myDocs.length}</span>
                        <span className="text-blue-200 ml-2 font-medium">/ {docTypes.length} Uploaded</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {docTypes.map(type => {
                    const uploadedDoc = myDocs.find(d => d.document_format_id === type.id);
                    return (
                        <div
                            key={type.id}
                            className={`
                                group relative flex flex-col p-6 rounded-xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1
                                ${uploadedDoc
                                    ? 'bg-white border-slate-200 hover:border-blue-200'
                                    : 'bg-slate-50 border-dashed border-slate-300 hover:border-slate-400'
                                }
                            `}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3.5 rounded-xl shadow-sm ${uploadedDoc ? 'bg-blue-50 text-blue-600' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={uploadedDoc ? "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" : "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"} /></svg>
                                </div>
                                {uploadedDoc ? (
                                    <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-100 shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                        Active
                                    </span>
                                ) : (
                                    type.is_mandatory_vault && (
                                        <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full border border-amber-100">
                                            Required
                                        </span>
                                    )
                                )}
                            </div>

                            <div className="mb-4">
                                <h3 className="font-bold text-slate-800 text-lg mb-1 leading-tight">{type.name}</h3>
                                <p className="text-xs text-slate-500 line-clamp-2">{type.description || "Official document required for verification."}</p>
                            </div>

                            <div className="mt-auto space-y-3">
                                {uploadedDoc ? (
                                    <>
                                        <div className="text-xs text-slate-400 font-medium px-1">
                                            Last updated: {new Date(uploadedDoc.uploaded_at).toLocaleDateString()}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => handlePreview(uploadedDoc)}
                                                className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                Preview
                                            </button>
                                            <div className="relative">
                                                {/* Hidden trigger for update, the DocumentUploader handles logic internally or can be styled */}
                                                <DocumentUploader
                                                    documentType={type.name}
                                                    documentFormatId={type.id}
                                                    onUploadSuccess={handleUploadSuccess}
                                                    showToast={showToast}
                                                    compact={true} // Assuming we might want a smaller version, or just standard
                                                    customButton={
                                                        <button className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                            Update
                                                        </button>
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="pt-2">
                                        <DocumentUploader
                                            documentType={type.name}
                                            documentFormatId={type.id}
                                            onUploadSuccess={handleUploadSuccess}
                                            showToast={showToast}
                                            customButton={
                                                <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 text-white hover:bg-slate-700 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                    Upload Document
                                                </button>
                                            }
                                        />
                                    </div>
                                )}
                            </div>
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

            {previewFile && (
                <FilePreviewModal
                    fileUrl={previewFile.url}
                    fileType={previewFile.type}
                    onClose={() => {
                        URL.revokeObjectURL(previewFile.url);
                        setPreviewFile(null);
                    }}
                />
            )}
        </div>
    );
};

export default DocumentVault;
