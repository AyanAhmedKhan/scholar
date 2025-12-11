import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import ProfileForm from '../components/ProfileForm';

const Onboarding = () => {
    const navigate = useNavigate();
    const [existingProfile, setExistingProfile] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkProfile = async () => {
            try {
                const [profileRes, userRes] = await Promise.all([
                    api.get('/profile/me').catch(() => ({ data: null })),
                    api.get('/auth/me').catch(() => ({ data: null }))
                ]);
                setExistingProfile(profileRes.data);
                setUserInfo(userRes.data);
            } catch (e) {
                // Error handled
            } finally {
                setLoading(false);
            }
        };
        checkProfile();
    }, []);

    const handleSubmit = useCallback(async (formData) => {
        try {
            if (existingProfile) {
                await api.put('/profile/me', formData);
            } else {
                await api.post('/profile/', formData);
            }
            navigate('/dashboard');
        } catch (error) {
            alert('Error saving profile: ' + (error.response?.data?.detail || error.message));
        }
    }, [existingProfile, navigate]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-slate-900 font-display mb-4">
                        {existingProfile ? 'Update Your Profile' : 'Complete Your Profile'}
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        {existingProfile 
                            ? 'Keep your information up-to-date for smooth scholarship processing.'
                            : 'Please provide accurate details to ensure smooth processing of your scholarship applications.'}
                    </p>
                </div>

                <div className="animate-fade-in-up">
                    {/* Display Name and Enrollment as Read-Only */}
                    {userInfo && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Account Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={userInfo.full_name || ''}
                                        disabled
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-600 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">This is set from your Google login and cannot be changed</p>
                                </div>
                                {userInfo.enrollment_no && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 mb-1">Enrollment Number</label>
                                        <input
                                            type="text"
                                            value={userInfo.enrollment_no || ''}
                                            disabled
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-600 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">This is extracted from your email and cannot be changed</p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={userInfo.email || ''}
                                        disabled
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-600 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <ProfileForm initialData={existingProfile} onSubmit={handleSubmit} />
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
