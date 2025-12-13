import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
            <Sidebar
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-72'}`}>
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <img src="/src/public/mits-logo.png" alt="MITS Logo" className="h-10 w-auto object-contain" />
                        <span className="font-display font-bold text-lg text-slate-800">MITS Scholar</span>
                    </div>
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                </header>

                <main className="flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-7xl">
                    <div className="animate-fade-in-up">
                        <Outlet />
                    </div>
                </main>

                <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
                    <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
                        &copy; {new Date().getFullYear()} Scholarship Portal. All rights reserved.
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Layout;
