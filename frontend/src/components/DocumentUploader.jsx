import React, { useState } from 'react';
import api from '../services/api';

const DocumentUploader = ({ documentType, documentFormatId, onUploadSuccess, showToast }) => {
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
                {documentFormatId && <div className="text-xs text-slate-500">Linked to required format</div>}
            </div>
            <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-slate-700 mb-1">File</label>
                <input
                    type="file"
                    name="file"
                    accept="application/pdf"
                    className="w-full p-1.5 border border-slate-300 rounded-md bg-white"
                    required
                    onChange={(ev) => {
                        const selectedFile = ev.target.files?.[0];
                        if (selectedFile && selectedFile.type !== 'application/pdf') {
                            alert('Only PDF files are allowed');
                            ev.target.value = '';
                            setFile(null);
                        } else {
                            setFile(selectedFile || null);
                        }
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
