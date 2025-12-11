import React from 'react';

const AdminPanel = () => {
    // This is a placeholder for the frontend admin panel.
    // The main admin functionality is provided by SQLAdmin on the backend.
    // This page can link to it or provide custom React-based admin features.
    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Admin Administration</h1>
            <p className="text-slate-600 mb-8">
                Advanced database management and workflows are handled in the dedicated Admin Portal.
            </p>
            <a
                href="http://localhost:8000/admin"
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-lg font-bold transition shadow-lg"
            >
                Open Admin Portal
            </a>
        </div>
    );
};

export default AdminPanel;
