import React, { useState } from 'react';
import api from '../services/api';
import Toast from './Toast';

const MergedPDFButton = ({ applicationId }) => {
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const downloadPDF = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/applications/${applicationId}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `application_${applicationId}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("PDF Download Error:", e);

            let errorMsg = "Failed to download PDF files. Please ensure documents are uploaded.";

            if (e.response?.data instanceof Blob) {
                // Convert Blob error response to text
                const text = await e.response.data.text();
                try {
                    const json = JSON.parse(text);
                    errorMsg = json.detail || errorMsg;
                } catch (err) {
                    errorMsg = text || errorMsg;
                }
            } else if (e.response?.data?.detail) {
                errorMsg = e.response.data.detail;
            }

            console.log("Extracted Error Message:", errorMsg);
            showToast(errorMsg, "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <button
                onClick={downloadPDF}
                disabled={loading}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
            >
                {loading ? (
                    <span>Generating...</span>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PDF
                    </>
                )}
            </button>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    );
};

export default MergedPDFButton;
