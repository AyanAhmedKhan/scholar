import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Award, Users, Shield, Globe, ChevronRight, Bell, UserPlus, Search, FileCheck, Banknote, FileText, CheckCircle, CreditCard, IdCard, GraduationCap, Coins, Car } from 'lucide-react';
import api from '../services/api';
import { Hero } from "@/components/ui/animated-hero";
import { motion } from 'framer-motion';

const LandingPage = () => {
    const [scholarships, setScholarships] = useState([]);
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 1.5, // Much slower step-by-step
                delayChildren: 0.5
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 50, scale: 0.9 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 40,
                damping: 15,
                duration: 1.0
            }
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const schRes = await api.get('/scholarships/public').catch(e => ({ data: [] }));
                setScholarships(schRes.data || []);
            } catch (e) { console.error("Sch fetch failed", e); }

            try {
                const noticeRes = await api.get('/notices/public').catch(e => ({ data: [] }));
                setNotices(noticeRes.data || []);
            } catch (e) { console.error("Notice fetch failed", e); }

            setLoading(false);
        };
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Top Bar / Header matching the reference image */}
            <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between py-2 md:py-4 gap-4 md:gap-0">
                        {/* Logo Section */}
                        <Link to="/" className="flex items-center gap-4">
                            <img src="/mits-logo.png" alt="MITS Logo" className="h-16 w-auto object-contain" />
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
                        </Link>

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

            {/* Notices Marquee */}
            {notices.length > 0 && (
                <div className="bg-yellow-50 border-b border-yellow-100 overflow-hidden">
                    <div className="container mx-auto px-4 py-2 flex items-center gap-2">
                        <span className="flex-shrink-0 bg-yellow-200 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                            Notice
                        </span>
                        <div className="flex-1 overflow-hidden relative h-6">
                            <div className="animate-marquee whitespace-nowrap absolute top-0 left-0 flex gap-8 items-center h-full">
                                {notices.map((notice) => (
                                    <span key={notice.id} className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                        <Bell className="w-3 h-3 text-yellow-600" />
                                        <span className="font-semibold text-slate-900">{notice.title}:</span> {notice.content && notice.content.substring(0, 100)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-blue-50 via-white to-slate-50 overflow-hidden">
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
                <Hero />
                {/* Decorative blobs */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl -z-10"></div>
                <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-3xl -z-10"></div>
            </section>

            {/* How It Works Section */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <span className="text-blue-600 font-semibold tracking-wider uppercase text-sm">Process</span>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mt-2 mb-6">How It Works</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Your journey to academic funding in 4 simple steps.
                        </p>
                    </div>

                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-4 gap-8 relative"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        {/* Road Line (Desktop) */}
                        <div className="hidden md:block absolute top-[2.5rem] left-0 w-full h-1 bg-slate-200 -z-20 rounded-full"></div>
                        <div className="hidden md:block absolute top-[2.5rem] left-0 w-full h-1 border-t-2 border-dashed border-slate-400 -z-20 opacity-30"></div>

                        {/* Vertical Road Line (Mobile) */}
                        <div className="md:hidden absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-slate-100 -z-20"></div>
                        <div className="md:hidden absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full border-l-2 border-dashed border-slate-300 -z-20 opacity-40"></div>

                        {/* Traveling Car */}
                        <motion.div
                            className="hidden md:flex absolute top-[1.5rem] -left-4 z-0 text-blue-600 bg-white p-1 rounded-full shadow-sm border border-blue-100"
                            initial={{ left: "0%" }}
                            whileInView={{ left: "100%" }}
                            viewport={{ once: true }}
                            transition={{ duration: 6, ease: "easeInOut", delay: 0.5 }}
                        >
                            <Car className="w-6 h-6 fill-blue-600 text-blue-100" />
                        </motion.div>

                        <StepCard
                            number="01"
                            icon={<UserPlus className="w-6 h-6 text-white" />}
                            title="Register"
                            description="Create your student profile with basic details and verify your email."
                            color="bg-blue-600"
                            variants={itemVariants}
                        />
                        <StepCard
                            number="02"
                            icon={<Search className="w-6 h-6 text-white" />}
                            title="Browse"
                            description="Explore available scholarships that match your course and category."
                            color="bg-indigo-600"
                            variants={itemVariants}
                        />
                        <StepCard
                            number="03"
                            icon={<FileCheck className="w-6 h-6 text-white" />}
                            title="Apply"
                            description="Submit your application and upload necessary documents securely."
                            color="bg-violet-600"
                            variants={itemVariants}
                        />
                        <StepCard
                            number="04"
                            icon={<Banknote className="w-6 h-6 text-white" />}
                            title="Receive"
                            description="Track status and receive funds directly in your bank account."
                            color="bg-emerald-600"
                            variants={itemVariants}
                        />
                    </motion.div>
                </div>
            </section>

            {/* Active Scholarships Section */}
            <section id="scholarships" className="py-20 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Available Scholarships</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Browse currently active scholarships. Login to apply.
                        </p>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                            <p className="mt-2 text-slate-500">Loading scholarships...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {scholarships.length > 0 ? (
                                scholarships.map((sch) => (
                                    <div key={sch.id} className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
                                        <div className="p-6 flex-1">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                                                    {sch.category}
                                                </span>
                                                <span className="text-sm text-slate-500 font-medium">
                                                    Due: {sch.last_date ? new Date(sch.last_date).toLocaleDateString() : 'Open'}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">{sch.name}</h3>
                                            <p className="text-slate-600 text-sm line-clamp-3 mb-4">
                                                {sch.description || 'No description available.'}
                                            </p>
                                        </div>
                                        <div className="p-6 bg-white border-t border-slate-100 mt-auto">
                                            <Link to="/login" className="block w-full text-center bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-2 rounded-xl transition-colors">
                                                Apply Now
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-slate-500 font-medium">No active scholarships at the moment.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-slate-50/50">
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

            {/* CTA Section */}
            <section className="py-20 bg-blue-600 overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-display">Ready to Secure Your Scholarship?</h2>
                    <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                        Don't wait for the deadline. Create your account today and start your application process.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/login" className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                            Register Now
                        </Link>
                        <a href="#scholarships" className="px-8 py-4 bg-blue-700 text-white border border-blue-500 rounded-xl font-bold text-lg hover:bg-blue-800 transition-all">
                            Browse Scholarships
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-3 mb-6">
                                <img src="/mits-logo.png" alt="MITS Logo" className="h-10 w-auto bg-white/10 rounded-lg p-1" />
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

const StepCard = ({ number, icon, title, description, color, variants }) => (
    <motion.div
        className="relative flex flex-col items-center text-center group"
        variants={variants}
    >
        <div className={`w-12 h-12 ${color} rounded-2xl rotate-3 flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform duration-300 z-10 mb-6`}>
            {icon}
        </div>
        <div className="text-6xl font-black text-slate-100 absolute top-0 -z-10 select-none group-hover:text-blue-50 transition-colors">
            {number}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600">{description}</p>
    </motion.div>
);

const DocCard = ({ icon, label }) => (
    <div className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
        <div className="text-blue-500 bg-blue-50 p-2 rounded-lg">
            {icon}
        </div>
        <span className="font-semibold text-slate-700">{label}</span>
    </div>
);

const ListItem = ({ children }) => (
    <li className="flex items-start gap-2 text-slate-600 text-sm">
        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
        <span>{children}</span>
    </li>
);

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


