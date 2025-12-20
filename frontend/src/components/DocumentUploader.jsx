import React, { useState, useRef } from 'react';
import api from '../services/api';

const DocumentUploader = ({
    documentType,
    documentFormatId,
    validTypes,
    maxPages,
    onUploadSuccess,
    showToast,
    compact = false,
    hideLabels = false,
    customButton = null
}) => {
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleUpload = async (e) => {
        if (e) e.preventDefault();
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
        if (maxPages) {
            formData.append('max_pages', maxPages);
        }

        try {
            await api.post('/documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
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
        <form
            onSubmit={handleUpload}
            className={`
                flex flex-col gap-3 
                ${compact ? '' : 'md:flex-row md:items-end bg-slate-50 p-4 rounded-lg border border-slate-200'}
            `}
        >
            <div className="flex-1 w-full">
                {!hideLabels && <label className="block text-sm font-medium text-slate-700 mb-1">Document</label>}
                {!compact && !hideLabels && <div className="text-sm text-slate-600 font-semibold">{documentType || 'Upload Document'}</div>}

                <div className="flex flex-col gap-0.5 mt-1">
                    {validTypes && !compact && (
                        <div className="text-xs text-slate-500">
                            Allowed: <span className="font-medium uppercase">{validTypes.join(', ')}</span>
                        </div>
                    )}
                    {maxPages && (validTypes?.includes('pdf')) && !compact && (
                        <div className="text-xs text-orange-600 font-medium">
                            Max Pages: {maxPages} (PDF)
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 w-full relative">
                {!hideLabels && <label className="block text-sm font-medium text-slate-700 mb-1">File</label>}
                <div className="flex gap-2 items-center">
                    <input
                        ref={fileInputRef}
                        type="file"
                        name="file"
                        accept={validTypes ? validTypes.map(t => t === 'pdf' ? '.pdf' : t === 'jpg' ? '.jpg,.jpeg' : t === 'jpeg' ? '.jpg,.jpeg' : '.png').join(',') : ".pdf,.jpg,.jpeg,.png"}
                        className={`
                            w-full text-sm text-slate-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-xs file:font-semibold
                            file:bg-primary-50 file:text-primary-700
                            hover:file:bg-primary-100
                            ${compact ? 'file:px-3 file:py-1.5' : ''}
                        `}
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
                            const typeMap = { 'pdf': ['pdf'], 'jpg': ['jpg', 'jpeg'], 'jpeg': ['jpg', 'jpeg'], 'png': ['png'] };
                            const isValidType = allowed.some(type => typeMap[type]?.includes(fileExt));

                            if (!isValidType) {
                                alert(`Invalid file type. Allowed: ${allowed.join(', ')}`);
                                ev.target.value = '';
                                setFile(null);
                                return;
                            }
                            setFile(selectedFile);
                        }}
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={uploading || !file}
                className={`
                    flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:opacity-50
                    ${compact
                        ? 'w-full py-2 bg-blue-600 text-white hover:bg-blue-700 text-sm'
                        : 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5'
                    }
                `}
            >
                {uploading ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{compact ? 'Uploading...' : 'Uploading...'}</span>
                    </>
                ) : (
                    compact ? 'Upload' : 'Upload'
                )}
            </button>
        </form>
    );
};

export default DocumentUploader;
