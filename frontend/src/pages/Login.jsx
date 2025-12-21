import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';

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

    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="min-h-screen flex bg-white overflow-hidden">
            {/* Left Side - Brand/Info */}
            <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="hidden lg:flex lg:w-1/2 bg-blue-900 relative flex-col justify-between p-16 text-white overflow-hidden"
            >
                {/* Animated Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 z-0"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 z-0"></div>

                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-4 mb-12"
                    >
                        <img src="/mits-logo.png" alt="MITS Logo" className="h-16 w-auto object-contain bg-white/10 backdrop-blur-sm rounded-xl p-2 shadow-lg ring-1 ring-white/20" />
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold tracking-tight leading-none font-display">MITS Scholar</span>
                            <span className="text-sm text-blue-200 font-medium">Madhav Institute of Technology & Science</span>
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-5xl lg:text-6xl font-bold leading-tight font-display mb-8"
                    >
                        Empowering Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">
                            Educational Journey
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-blue-100 text-lg max-w-md leading-relaxed"
                    >
                        Access scholarships, track applications, and manage your academic funding in one secure, centralized platform.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="relative z-10 grid grid-cols-2 gap-8"
                >
                    <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                        <div className="text-3xl font-bold mb-1">50+</div>
                        <div className="text-blue-200 text-sm font-medium">Active Scholarships</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                        <div className="text-3xl font-bold mb-1">24/7</div>
                        <div className="text-blue-200 text-sm font-medium">Student Support</div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-slate-50 lg:bg-slate-50 bg-[url('/mobile%20login-bg.jpeg')] bg-cover bg-center relative h-full min-h-screen lg:h-auto lg:min-h-0">
                <div className="hidden lg:block absolute inset-0 bg-white/50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
                <div className="lg:hidden absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-md space-y-8 bg-white/95 backdrop-blur-sm lg:bg-white p-6 md:p-10 rounded-3xl shadow-xl shadow-slate-900/10 border border-white/20 lg:border-slate-100 relative z-10"
                >
                    <motion.div variants={fadeInUp} className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900 font-display mb-2">Welcome Back</h2>
                        <p className="text-slate-500">Please sign in to your account to continue.</p>
                    </motion.div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-3"
                        >
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </motion.div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <motion.div variants={fadeInUp} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Email Address</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 text-slate-900 placeholder-slate-400 font-medium"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1.5 ml-1">
                                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700">Password</label>
                                    <a href="#" className="font-semibold text-sm text-blue-600 hover:text-blue-700">Forgot password?</a>
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 text-slate-900 placeholder-slate-400 font-medium"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={fadeInUp}>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                size="lg"
                                className="w-full text-base font-bold shadow-blue-500/20"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign In <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    </form>

                    <motion.div variants={fadeInUp} className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-slate-400 font-medium uppercase tracking-wider text-xs">Or continue with</span>
                        </div>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="flex justify-center w-full">
                        <div className="w-full transition-transform hover:scale-[1.02] duration-200 flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError('Google Login Failed')}
                                useOneTap={true} // Enabled for direct login experience
                                theme="filled_blue"
                                shape="pill"
                                size="large"
                                width="100%"
                                containerProps={{ style: { width: '100%', display: 'flex', justifyContent: 'center' } }}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
