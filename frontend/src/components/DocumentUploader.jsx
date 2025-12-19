import React, { useState } from 'react';
import api from '../services/api';

const DocumentUploader = ({ documentType, documentFormatId, validTypes, maxPages, onUploadSuccess, showToast }) => {
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState(null);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        if (documentFormatId) {
            formData.append('document_format_id', documentFormatId);
        }
        if (documentType) {
            formData.append('document_type', documentType);
        }

        try {
            await api.post('/documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            // Success handled by parent via onUploadSuccess (which calls showToast)
            // But we can also show here if detached. 
            // Parent DocumentVault handles showToast on success callback.
            // Let's NOT call showToast here for success to avoid double toast, 
            // OR let parent handle it completely.
            // In DocumentVault: 
            // const handleUploadSuccess = () => { fetchData(); showToast(...) }

            setFile(null);
            e.target.reset();
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            console.error('Upload failed:', error);
            const errorMsg = error.response?.data?.detail || 'Failed to upload document';
            if (showToast) {
                showToast(errorMsg, 'error');
            } else {
                alert(errorMsg);
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-4 items-start md:items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-slate-700 mb-1">Document</label>
                <div className="text-sm text-slate-600 font-semibold">{documentType || 'Upload Document'}</div>
                <div className="flex flex-col gap-0.5 mt-1">
                    {validTypes && (
                        <div className="text-xs text-slate-500">
                            Allowed: <span className="font-medium uppercase">{validTypes.join(', ')}</span>
                        </div>
                    )}
                    {maxPages && (validTypes?.includes('pdf')) && (
                        <div className="text-xs text-orange-600 font-medium">
                            Max Pages: {maxPages} (PDF)
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-slate-700 mb-1">File</label>
                <input
                    type="file"
                    name="file"
                    accept={validTypes ? validTypes.map(t => t === 'pdf' ? '.pdf' : t === 'jpg' ? '.jpg,.jpeg' : '.png').join(',') : ".pdf,.jpg,.jpeg,.png"}
                    className="w-full p-1.5 border border-slate-300 rounded-md bg-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    required
                    onChange={(ev) => {
                        const selectedFile = ev.target.files?.[0];
                        if (!selectedFile) {
                            setFile(null);
                            return;
                        }

                        // Validate File Type
                        const fileExt = selectedFile.name.split('.').pop().toLowerCase();
                        const allowed = validTypes || ['pdf', 'jpg', 'png', 'jpeg'];
                        const typeMap = { 'pdf': ['pdf'], 'jpg': ['jpg', 'jpeg'], 'png': ['png'] };

                        const isValidType = allowed.some(type => typeMap[type]?.includes(fileExt));

                        if (!isValidType) {
                            alert(`Invalid file type. Allowed: ${allowed.join(', ')}`);
                            ev.target.value = '';
                            setFile(null);
                            return;
                        }

                        // Validate Max Pages (Only for PDF, simplistic check by size warning or just rely on backend)
                        // Client-side page counting requires a library. We'll rely on backend for strict enforcement
                        // but show a warning if it looks huge.

                        setFile(selectedFile);
                    }}
                />
            </div>
            <button
                type="submit"
                disabled={uploading || !file}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition disabled:opacity-50"
            >
                {uploading ? 'Uploading...' : 'Upload'}
            </button>
        </form>
    );
};

export default DocumentUploader;
