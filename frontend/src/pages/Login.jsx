import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRedirect = (role) => {
        switch (role) {
            case 'admin':
                navigate('/admin-dashboard');
                break;
            case 'dept_head':
                navigate('/dept-dashboard');
                break;
            case 'goffice':
                navigate('/goffice-dashboard');
                break;
            default:
                navigate('/dashboard');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const decoded = await login(email, password);
            handleRedirect(decoded.role);
        } catch (err) {
            const errorMessage = err?.response?.data?.detail || err?.message || 'Invalid credentials. Please try again.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setIsLoading(true);
        try {
            const decoded = await googleLogin(credentialResponse.credential);
            handleRedirect(decoded.role);
        } catch (err) {
            const errorMessage = err?.response?.data?.detail || err?.message || 'Google login failed. Please try again.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side - Brand/Info */}
            <div className="hidden lg:flex lg:w-1/2 bg-blue-900 relative overflow-hidden flex-col justify-between p-16 text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-indigo-900 opacity-90"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <img src="/src/public/mits-logo.png" alt="MITS Logo" className="h-16 w-auto object-contain bg-white/10 rounded-lg p-1" />
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold tracking-tight leading-none">MITS Scholar</span>
                            <span className="text-sm text-blue-200 font-medium">Madhav Institute of Technology & Science</span>
                        </div>
                    </div>

                    <h1 className="text-5xl font-bold leading-tight font-display mb-6">
                        Empowering Your <br /> Educational Journey
                    </h1>
                    <p className="text-blue-100 text-lg max-w-md leading-relaxed">
                        Access scholarships, track applications, and manage your academic funding in one secure, centralized platform.
                    </p>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-8">
                    <div>
                        <div className="text-3xl font-bold mb-1">50+</div>
                        <div className="text-blue-200 text-sm font-medium">Active Scholarships</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold mb-1">24/7</div>
                        <div className="text-blue-200 text-sm font-medium">Student Support</div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900 font-display mb-2">Welcome Back</h2>
                        <p className="text-slate-600">Please sign in to your account to continue.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 outline-none transition-all text-slate-900 placeholder-slate-400"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 outline-none transition-all text-slate-900 placeholder-slate-400"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-primary-700 hover:text-primary-800">
                                    Forgot password?
                                </a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-slate-500">Or continue with</span>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google Login Failed')}
                            useOneTap
                            theme="outline"
                            shape="rectangular"
                            width="100%"
                            size="large"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
