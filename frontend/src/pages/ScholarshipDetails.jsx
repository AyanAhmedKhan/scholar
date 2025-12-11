import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const ScholarshipDetails = () => {
    const { id } = useParams();
    const [scholarship, setScholarship] = useState(null);
    const [eligibility, setEligibility] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScholarship = async () => {
            try {
                const res = await api.get(`/scholarships/${id}`);
                setScholarship(res.data);

                // Check Eligibility
                try {
                    const eligRes = await api.get(`/scholarships/${id}/check-eligibility`);
                    setEligibility(eligRes.data);
                } catch (err) {
                    console.error("Failed to check eligibility", err);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchScholarship();
    }, [id]);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    if (!scholarship) return <div>Scholarship not found</div>;

    return (
        <div className="max-w-5xl mx-auto animate-fade-in-up">
            <Link to="/scholarships" className="inline-flex items-center text-slate-500 hover:text-primary-600 mb-6 transition-colors group">
                <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Scholarships
            </Link>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                {/* Header */}
                <div className="bg-primary-900 p-8 sm:p-10 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <span className="inline-block bg-white/10 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-4 border border-white/20">
                            {scholarship.category}
                        </span>
                        <h1 className="text-3xl sm:text-4xl font-bold font-display mb-2">{scholarship.name}</h1>
                        <div className="flex items-center gap-2 text-blue-100 mt-4">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="font-medium">Deadline: {new Date(scholarship.last_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                        </div>
                    </div>
                </div>

                <div className="p-8 sm:p-10">
                    {eligibility && !eligibility.eligible && (
                        <div className="mb-8 bg-red-50 border border-red-100 rounded-2xl p-6 animate-pulse-slow">
                            <h3 className="text-red-800 font-bold text-lg flex items-center gap-2 mb-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                You are not eligible for this scholarship
                            </h3>
                            <ul className="space-y-2">
                                {eligibility.reasons.map((reason, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-red-700 text-sm">
                                        <span className="mt-1.5 w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0"></span>
                                        {reason}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-8">
                            <section>
                                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                                    </div>
                                    Description
                                </h3>
                                <p className="text-slate-600 leading-relaxed text-lg">{scholarship.description}</p>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    Eligibility Criteria
                                </h3>
                                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 space-y-4">
                                    {scholarship.eligibility_criteria && (
                                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{scholarship.eligibility_criteria}</p>
                                    )}

                                    {/* Structured eligibility fields */}
                                    <ul className="space-y-2 text-sm text-slate-700">
                                        {scholarship.min_percentage && (
                                            <li className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                                                Minimum Percentage: <strong>{scholarship.min_percentage}%</strong>
                                            </li>
                                        )}
                                        {scholarship.min_12th_percentage && (
                                            <li className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                                                Minimum 12th Percentage: <strong>{scholarship.min_12th_percentage}%</strong>
                                            </li>
                                        )}
                                        {scholarship.min_cgpa && (
                                            <li className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                                                Minimum CGPA: <strong>{scholarship.min_cgpa}</strong>
                                            </li>
                                        )}
                                        {scholarship.max_family_income && (
                                            <li className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                                                Maximum Family Income: <strong>₹{scholarship.max_family_income.toLocaleString()}</strong>
                                            </li>
                                        )}
                                        {scholarship.allowed_categories && scholarship.allowed_categories.length > 0 && (
                                            <li className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                                                Allowed Categories: <strong>{scholarship.allowed_categories.join(', ')}</strong>
                                            </li>
                                        )}
                                        {scholarship.allowed_departments && scholarship.allowed_departments.length > 0 && (
                                            <li className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                                                Allowed Departments: <strong>{scholarship.allowed_departments.join(', ')}</strong>
                                            </li>
                                        )}
                                        {scholarship.allowed_years && scholarship.allowed_years.length > 0 && (
                                            <li className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                                                Allowed Years: <strong>{scholarship.allowed_years.join(', ')}</strong>
                                            </li>
                                        )}
                                        {scholarship.govt_job_allowed === false && (
                                            <li className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                                Parents with Government Job: <strong>Not Allowed</strong>
                                            </li>
                                        )}
                                    </ul>

                                    {!scholarship.eligibility_criteria &&
                                        !scholarship.min_percentage &&
                                        !scholarship.max_family_income &&
                                        (!scholarship.allowed_categories || scholarship.allowed_categories.length === 0) && (
                                            <p className="text-slate-500 italic">No specific eligibility criteria defined.</p>
                                        )}
                                </div>
                            </section>
                        </div>

                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-4">Application Summary</h3>
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Amount</span>
                                        <span className="font-semibold text-slate-900">Variable</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Duration</span>
                                        <span className="font-semibold text-slate-900">One Time</span>
                                    </div>
                                    {scholarship.application_link && (
                                        <div className="pt-2">
                                            <a
                                                href={scholarship.application_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm mb-3"
                                            >
                                                External Application Link ↗
                                            </a>
                                            <p className="text-xs text-slate-500 text-center mb-2">
                                                This scholarship requires application via an external portal.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <Link
                                    to={eligibility && !eligibility.eligible ? "#" : `/apply/${scholarship.id}`}
                                    className={`w-full flex items-center justify-center px-6 py-3.5 rounded-xl font-bold text-white transition-all transform hover:-translate-y-0.5 shadow-lg
                                        ${(eligibility && !eligibility.eligible)
                                            ? 'bg-slate-300 cursor-not-allowed pointer-events-none shadow-none'
                                            : 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/30'}`}
                                >
                                    Apply Now
                                </Link>
                                {(eligibility && !eligibility.eligible) && (
                                    <p className="text-xs text-center text-red-500 mt-3 font-medium">
                                        Check eligibility criteria above
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScholarshipDetails;
