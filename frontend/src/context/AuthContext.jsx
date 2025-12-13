import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const { data } = await api.get('/auth/me');
            setUser(data);

            // Onboarding Check
            if (data.role === 'student' && !data.is_profile_complete) {
                if (!window.location.pathname.includes('/onboarding')) {
                    window.location.href = '/onboarding';
                }
            }
            return data;
        } catch (error) {
            console.error("Failed to fetch user", error);
            // If auth fails, clear token
            localStorage.removeItem('token');
            setUser(null);
            return null;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const response = await api.post('/auth/login/access-token', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const { access_token } = response.data;
        localStorage.setItem('token', access_token);
        return await fetchUser();
    };

    const googleLogin = async (token) => {
        const response = await api.post('/auth/login/google', { token });
        const { access_token } = response.data;
        localStorage.setItem('token', access_token);
        return await fetchUser();
    }

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, login, googleLogin, logout, loading, fetchUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
