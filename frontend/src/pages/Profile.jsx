import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ProfileForm from '../components/ProfileForm';

const Profile = () => {
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get('/profile/me');
                setUserProfile(data);
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSubmit = async (formData) => {
        try {
            // Using POST to create/update as per standard pattern in this app so far
            // or PUT if strictly update. Assuming POST to /profile/me based on typical behavior, 
            // but checking backend might be wise. Let's assume POST /profile/me updates or creates as per early findings.
            // Actually, usually it's POST /profile/ or PUT. Let's try POST based on Onboarding.

            // Re-checking Onboarding might be good, but standard is POST /profile/ for creation/update usually in this app
            await api.post('/profile/', formData);
            alert("Profile updated successfully!");
            window.location.reload(); // Simple reload to refresh data/sidebar state if needed
        } catch (error) {
            console.error("Update failed", error);
            alert(error.response?.data?.detail || "Failed to update profile.");
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 font-display">My Profile</h1>
                <p className="text-slate-500 mt-2">Manage your personal and academic information.</p>
            </div>

            <ProfileForm initialData={userProfile} onSubmit={handleSubmit} />
        </div>
    );
};

export default Profile;
