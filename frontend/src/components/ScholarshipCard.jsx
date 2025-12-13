import React from 'react';
import { Link } from 'react-router-dom';
import MergedPDFButton from './MergedPDFButton';

const ScholarshipCard = ({ scholarship, application, onApply }) => {
    const isDeadlinePassed = new Date(scholarship.last_date) < new Date();
    const daysUntilDeadline = Math.ceil((new Date(scholarship.last_date) - new Date()) / (1000 * 60 * 60 * 24));

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all duration-300 flex flex-col h-full justify-between group">
            <div>
                <div className="flex justify-between items-start mb-4 gap-2">
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-100">
                        {scholarship.category || 'General'}
                    </span>
                    {application && (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap
                            ${application.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                application.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {application.status.replace('_', ' ')}
                        </span>
                    )}
                </div>

                <h2 className="text-lg font-bold text-slate-900 mb-2 font-display group-hover:text-primary-700 transition-colors">
                    {scholarship.name}
                </h2>
                <p className="text-slate-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                    {scholarship.description || 'No description available.'}
                </p>
            </div>

            <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-4 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="font-medium">
                            {isDeadlinePassed ? (
                                <span className="text-red-600">Deadline passed</span>
                            ) : daysUntilDeadline <= 7 ? (
                                <span className="text-orange-600">{daysUntilDeadline} days left</span>
                            ) : (
                                <span>{new Date(scholarship.last_date).toLocaleDateString()}</span>
                            )}
                        </span>
                    </div>
                    {scholarship.amount && (
                        <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                            <span>₹{scholarship.amount.toLocaleString()}</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2.5">
                    {application ? (
                        <>
                            <MergedPDFButton applicationId={application.id} />
                            <Link
                                to={`/applications/${application.id}`}
                                className="block text-center text-sm font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 py-2.5 rounded-lg transition-colors border border-transparent hover:border-primary-100"
                            >
                                View Application Status
                            </Link>
                        </>
                    ) : isDeadlinePassed ? (
                        <div className="text-center py-2.5 text-sm text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                            Applications Closed
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                to={`/scholarships/${scholarship.id}`}
                                className="flex items-center justify-center px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all"
                            >
                                View Details
                            </Link>
                            <button
                                onClick={() => onApply(scholarship.id)}
                                className="flex items-center justify-center px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 shadow-sm hover:shadow transition-all"
                            >
                                Apply Now
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScholarshipCard;
