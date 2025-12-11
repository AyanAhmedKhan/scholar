import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Award, Users, Shield, Globe, ChevronRight } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Top Bar / Header matching the reference image */}
            <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between py-2 md:py-4 gap-4 md:gap-0">
                        {/* Logo Section */}
                        <div className="flex items-center gap-4">
                            <img src="/src/public/mits-logo.png" alt="MITS Logo" className="h-16 w-auto object-contain" />
                            <div className="flex flex-col items-start">
                                <h1 className="text-xl md:text-2xl font-bold text-blue-700 leading-tight">
                                    माधव प्रौद्योगिकी एवं विज्ञान संस्थान, ग्वालियर
                                </h1>
                                <h2 className="text-sm md:text-base font-semibold text-blue-600 leading-tight">
                                    Madhav Institute of Technology & Science, Gwalior
                                </h2>
                                <p className="text-xs md:text-sm font-medium text-red-600 mt-0.5">
                                    Deemed University
                                </p>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <nav className="flex items-center gap-6 text-sm font-medium">
                            <span className="text-blue-800 font-bold text-lg hidden md:block">MITS Scholar</span>
                            <Link to="/" className="text-blue-600 hover:text-blue-800 border-b-2 border-blue-600 pb-0.5">Home</Link>
                            <a href="https://web.mitsgwalior.in/" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-blue-600 transition-colors">Institute Site</a>
                            <Link to="/login" className="text-slate-600 hover:text-blue-600 transition-colors">Login</Link>
                            <Link to="/login" className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 duration-200">
                                Portal Login
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-blue-50 via-white to-slate-50 py-20 md:py-32 overflow-hidden">
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-8 animate-fade-in-up">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                            </span>
                            Admissions & Scholarships Open for 2024-25
                        </div>
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-900 mb-6 leading-tight tracking-tight animate-fade-in-up delay-100">
                            Empowering Future Leaders with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">MITS Scholar</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
                            A unified platform for students to discover, apply, and track scholarships. Streamlining the journey from application to disbursement.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
                            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-blue-700 hover:shadow-blue-500/30 transition-all duration-300 flex items-center justify-center gap-2 group">
                                Get Started
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-300">
                                Learn More
                            </a>
                        </div>
                    </div>
                </div>

                {/* Decorative blobs */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl -z-10"></div>
                <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-3xl -z-10"></div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why MITS Scholar?</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Designed to make the scholarship process transparent, efficient, and accessible for every student.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<BookOpen className="w-8 h-8 text-blue-600" />}
                            title="Easy Application"
                            description="Single unified application process for multiple scholarships. Save time and apply with ease."
                        />
                        <FeatureCard
                            icon={<Shield className="w-8 h-8 text-indigo-600" />}
                            title="Secure Document Vault"
                            description="Store and manage your academic documents securely. Verify once, use everywhere."
                        />
                        <FeatureCard
                            icon={<Award className="w-8 h-8 text-purple-600" />}
                            title="Real-time Tracking"
                            description="Track your application status in real-time. Get notifications at every step of the process."
                        />
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-10"></div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <StatCard number="50+" label="Scholarships" />
                        <StatCard number="1000+" label="Students Benefited" />
                        <StatCard number="₹2Cr+" label="Disbursed" />
                        <StatCard number="100%" label="Transparency" />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-3 mb-6">
                                <img src="/src/public/mits-logo.png" alt="MITS Logo" className="h-10 w-auto object-contain" />
                                <span className="font-display font-bold text-xl text-slate-900">MITS Scholar</span>
                            </div>
                            <p className="text-slate-600 mb-6 max-w-sm">
                                Madhav Institute of Technology & Science, Gwalior.
                                A Deemed University dedicated to excellence in technical education and research.
                            </p>
                            <div className="flex gap-4">
                                <SocialLink icon={<Globe className="w-5 h-5" />} href="https://web.mitsgwalior.in/" />
                                <SocialLink icon={<Users className="w-5 h-5" />} href="#" />
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-slate-900 mb-4">Quick Links</h3>
                            <ul className="space-y-3">
                                <FooterLink to="/">Home</FooterLink>
                                <FooterLink to="/login">Login</FooterLink>
                                <FooterLink to="/login">Register</FooterLink>
                                <a href="https://web.mitsgwalior.in/" className="block text-slate-600 hover:text-blue-600 transition-colors">Institute Website</a>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-slate-900 mb-4">Contact</h3>
                            <ul className="space-y-3 text-slate-600">
                                <li>Race Course Road, Gola ka Mandir,</li>
                                <li>Gwalior - 474005, M.P., India</li>
                                <li>Email: info@mitsgwalior.in</li>
                                <li>Phone: +91-751-2409300</li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-slate-500 text-sm">
                            &copy; {new Date().getFullYear()} Madhav Institute of Technology & Science. All rights reserved.
                        </p>
                        <div className="flex gap-6 text-sm text-slate-500">
                            <a href="#" className="hover:text-blue-600">Privacy Policy</a>
                            <a href="#" className="hover:text-blue-600">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }) => (
    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300 group">
        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform duration-300">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
);

const StatCard = ({ number, label }) => (
    <div>
        <div className="text-4xl md:text-5xl font-bold mb-2 text-blue-400">{number}</div>
        <div className="text-slate-400 font-medium">{label}</div>
    </div>
);

const SocialLink = ({ icon, href }) => (
    <a href={href} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-200">
        {icon}
    </a>
);

const FooterLink = ({ to, children }) => (
    <li>
        <Link to={to} className="text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1 group">
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="group-hover:translate-x-1 transition-transform">{children}</span>
        </Link>
    </li>
);

export default LandingPage;
