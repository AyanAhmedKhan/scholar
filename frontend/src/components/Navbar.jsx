import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isActive = (path) => location.pathname === path;

    const NavLink = ({ to, children }) => (
        <Link
            to={to}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 
            ${isActive(to)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50'
                }`}
        >
            {children}
        </Link>
    );

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b 
            ${scrolled ? 'bg-white/95 backdrop-blur-md border-slate-200 shadow-sm' : 'bg-white border-slate-200'}`}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="flex items-center gap-3 group">
                            <img src="/mits-logo.png" alt="MITS Portal" className="h-8 w-auto bg-white/10 rounded p-0.5" />
                            <div className="flex flex-col">
                                <span className="font-display font-bold text-xl tracking-tight text-slate-800 leading-none">
                                    MITS <span className="text-primary-600">Scholar</span>
                                </span>
                                <span className="text-[10px] font-medium text-slate-500 tracking-wide uppercase">
                                    Madhav Institute of Technology & Science
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {user ? (
                            <>
                                {/* Student Links */}
                                {user.role === 'student' && (
                                    <>
                                        <NavLink to="/dashboard">Dashboard</NavLink>
                                        <NavLink to="/scholarships">Scholarships</NavLink>
                                        <NavLink to="/vault">Documents</NavLink>
                                    </>
                                )}

                                {/* Admin Links */}
                                {user.role === 'admin' && (
                                    <NavLink to="/admin-dashboard">Super Admin</NavLink>
                                )}

                                {/* G-Office Links */}
                                {(user.role === 'goffice' || user.role === 'admin') && (
                                    <NavLink to="/goffice-dashboard">G-Office</NavLink>
                                )}

                                {/* Dept Head Links */}
                                {(user.role === 'dept_head' || user.role === 'admin') && (
                                    <NavLink to="/dept-dashboard">Dept Head</NavLink>
                                )}

                                <NavLink to="/helpdesk">Helpdesk</NavLink>

                                {/* User Profile & Logout */}
                                <div className="flex items-center gap-4 ml-4 pl-4 border-l border-slate-200">
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-semibold text-slate-800 leading-none">{user.full_name}</span>
                                        <span className="text-xs text-slate-500 capitalize mt-1">{user.role.replace('_', ' ')}</span>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-200 hover:border-red-100"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="bg-primary-600 text-white hover:bg-primary-700 px-6 py-2 rounded-lg font-semibold shadow-sm transition-colors text-sm"
                            >
                                Login
                            </Link>
                        )}
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-slate-600 hover:text-primary-600 p-2 transition-colors rounded-lg hover:bg-slate-50"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-slate-100 bg-white">
                    <div className="px-4 py-4 space-y-2">
                        {user ? (
                            <>
                                {user.role === 'student' && (
                                    <>
                                        <Link to="/dashboard" className="block px-4 py-2.5 rounded-lg text-slate-600 hover:bg-primary-50 hover:text-primary-700 font-medium transition-colors">Dashboard</Link>
                                        <Link to="/scholarships" className="block px-4 py-2.5 rounded-lg text-slate-600 hover:bg-primary-50 hover:text-primary-700 font-medium transition-colors">Scholarships</Link>
                                        <Link to="/vault" className="block px-4 py-2.5 rounded-lg text-slate-600 hover:bg-primary-50 hover:text-primary-700 font-medium transition-colors">Documents</Link>
                                    </>
                                )}
                                <Link to="/helpdesk" className="block px-4 py-2.5 rounded-lg text-slate-600 hover:bg-primary-50 hover:text-primary-700 font-medium transition-colors">Helpdesk</Link>
                                <div className="border-t border-slate-100 my-2 pt-2">
                                    <div className="px-4 py-2">
                                        <p className="font-semibold text-slate-800">{user.full_name}</p>
                                        <p className="text-xs text-slate-500 capitalize">{user.role.replace('_', ' ')}</p>
                                    </div>
                                    <button onClick={logout} className="w-full text-left block px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors">Logout</button>
                                </div>
                            </>
                        ) : (
                            <Link to="/login" className="block px-4 py-3 rounded-lg bg-primary-600 text-white font-bold text-center">Login</Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
