
import React from 'react';

const FilePreviewModal = ({ fileUrl, fileName, fileType, onClose }) => {
    if (!fileUrl) return null;

    // Determine type if not provided
    const getFileType = () => {
        if (fileType) return fileType;
        if (!fileName) return 'unknown';
        const ext = fileName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
        if (ext === 'pdf') return 'pdf';
        return 'unknown';
    };

    const type = getFileType();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-800 truncate pr-4" title={fileName}>
                        Preview: {fileName}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-700 transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-slate-100 p-4 flex items-center justify-center">
                    {type === 'image' ? (
                        <img
                            src={fileUrl}
                            alt={fileName}
                            className="max-w-full max-h-full object-contain rounded shadow-sm"
                        />
                    ) : type === 'pdf' ? (
                        <div className="w-full h-full min-h-[60vh] bg-slate-50 relative">
                            <object
                                data={fileUrl}
                                type="application/pdf"
                                className="w-full h-full rounded shadow-sm"
                            >
                                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                                    <div className="w-16 h-16 bg-blue-100/50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <p className="text-slate-900 font-semibold mb-2">Preview not available directly</p>
                                    <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
                                        Your browser cannot display this PDF inside the app. Please open it to view.
                                    </p>
                                    <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-sm active:scale-95"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                        Open PDF
                                    </a>
                                </div>
                            </object>
                        </div>
                    ) : (
                        <div className="text-center p-8">
                            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <p className="text-slate-600 font-medium">Preview not available for this file type.</p>
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block mt-4 text-primary-600 hover:underline font-medium"
                            >
                                Download / Open in New Tab
                            </a>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
                    <a
                        href={fileUrl}
                        download={fileName}
                        className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition"
                    >
                        Download
                    </a>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilePreviewModal;
