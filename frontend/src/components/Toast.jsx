import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const displayType = ['success', 'error', 'info', 'warning'].includes(type) ? type : 'info';

    const styles = {
        success: {
            bg: 'bg-emerald-600',
            shadow: 'shadow-emerald-500/20',
            title: 'Success',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
            )
        },
        error: {
            bg: 'bg-red-600',
            shadow: 'shadow-red-500/20',
            title: 'Error',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        info: {
            bg: 'bg-blue-600',
            shadow: 'shadow-blue-500/20',
            title: 'Info',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        warning: {
            bg: 'bg-amber-500',
            shadow: 'shadow-amber-500/20',
            title: 'Warning',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            )
        }
    };

    const config = styles[displayType];

    return (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-xl text-white font-medium transition-all transform animate-in slide-in-from-bottom z-[100] flex items-center gap-3 ${config.bg} ${config.shadow}`}>
            {config.icon}
            <div>
                <p className="text-sm font-bold">{config.title}</p>
                <p className="text-sm opacity-90">{message}</p>
            </div>
            <button onClick={onClose} className="ml-2 hover:bg-white/20 p-1 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    );
};

export default Toast;
