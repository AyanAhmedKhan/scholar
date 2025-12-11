import React, { useState } from 'react';

const Helpdesk = () => {
    const [activeIndex, setActiveIndex] = useState(null);

    const faqs = [
        {
            question: "How do I apply for a scholarship?",
            answer: "First, complete your profile and upload necessary documents to the Document Vault. Then, browse available scholarships and click 'Apply Now' on the ones you are eligible for."
        },
        {
            question: "Can I edit my application after submission?",
            answer: "No, once submitted, applications are locked. However, if the verification officer requests more information, you will be able to upload additional documents."
        },
        {
            question: "How do I know if I am eligible?",
            answer: "Each scholarship has specific criteria. You can use the 'Check Eligibility' feature on the scholarship details page to see if you qualify based on your profile."
        },
        {
            question: "What documents are required?",
            answer: "Common documents include Income Certificate, Caste Certificate, and Marksheets. Specific requirements are listed on each scholarship's page."
        }
    ];

    const toggleFaq = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
                <h1 className="text-3xl font-bold text-slate-900 font-display mb-4">How can we help you?</h1>
                <p className="text-lg text-slate-600">Find answers to common questions or reach out to our support team directly.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Contact Info & Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-primary-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold font-display mb-4">Contact Support</h3>
                            <div className="space-y-4 text-primary-100">
                                <div className="flex items-start gap-3">
                                    <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    <div>
                                        <p className="font-medium text-white">Email Us</p>
                                        <p className="text-sm">support@scholarship.edu</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    <div>
                                        <p className="font-medium text-white">Call Us</p>
                                        <p className="text-sm">+91 12345 67890</p>
                                        <p className="text-xs opacity-70 mt-1">Mon-Fri, 9AM - 5PM</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4">Send a Message</h3>
                        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Message sent!"); }}>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                <select className="w-full border-slate-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500">
                                    <option>General Inquiry</option>
                                    <option>Technical Issue</option>
                                    <option>Application Status</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                                <textarea rows="4" className="w-full border-slate-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500" placeholder="Describe your issue..."></textarea>
                            </div>
                            <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>

                {/* FAQs */}
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-sm">
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-slate-50 transition-colors"
                                >
                                    <span className="font-semibold text-slate-800">{faq.question}</span>
                                    <span className={`transform transition-transform duration-200 text-primary-500 ${activeIndex === index ? 'rotate-180' : ''}`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </span>
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${activeIndex === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <div className="p-5 pt-0 text-slate-600 text-sm leading-relaxed border-t border-slate-100 bg-slate-50/30">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Helpdesk;
