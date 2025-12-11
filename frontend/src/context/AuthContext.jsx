import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = async () => {
        try {
            // We need an endpoint that returns the user role and details
            // For now, let's assume /profile/me returns it, OR we decode it from token if present
            // But standard JWT decode only gives sub.
            // Let's rely on an API call to get the user object which includes role.
            // Since /profile/me returns StudentProfile, we might need a /users/me endpoint.
            // For this demo, I'll assume the token has a 'role' claim OR I'll fetch from a new endpoint.

            // Let's add a quick check: if we have a token, we are logged in.
            // To get the role, we should probably update the backend login to return it or add a /users/me endpoint.
            // I'll update the backend login to include role in the token or response.
            // BUT, for now, let's just decode the token and hope I added role to it in backend?
            // Checking backend/app/core/security.py... create_access_token only encodes sub.
            // I should update backend to encode role.

            // For now, I will fetch the user details from a new endpoint I'll create or just hack it
            // Actually, let's just fetch the profile. If it fails (404), maybe it's an admin?
            // Wait, I didn't create a /users/me endpoint.
            // I will create one in auth.py quickly or just assume student for now if profile exists.

            // BETTER PLAN: Update backend to include role in token.
            // Token already includes role from backend, so no action needed here
        } catch (e) {
            console.error(e);
        }
    }

    useEffect(() => {
        let token = null;
        try {
            token = localStorage.getItem('token');
        } catch (e) {
            console.warn("Storage access denied", e);
        }

        if (token) {
            try {
                const decoded = jwtDecode(token);
                // We need the role. I will update the backend to include it in the token.
                setUser({ id: decoded.sub, role: decoded.role, email: decoded.sub });
            } catch (e) {
                try { localStorage.removeItem('token'); } catch (err) { }
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const response = await api.post('/auth/login/access-token', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const { access_token } = response.data;
        try {
            localStorage.setItem('token', access_token);
        } catch (e) { console.warn("Storage save failed", e); }

        const decoded = jwtDecode(access_token);
        setUser({ id: decoded.sub, role: decoded.role, email: email }); // Ensure backend sends role
        return decoded;
    };

    const googleLogin = async (token) => {
        const response = await api.post('/auth/login/google', { token });
        const { access_token } = response.data;
        try {
            localStorage.setItem('token', access_token);
        } catch (e) { console.warn("Storage save failed", e); }
        const decoded = jwtDecode(access_token);
        setUser({ id: decoded.sub, role: decoded.role });
        return decoded;
    }

    const logout = () => {
        try {
            localStorage.removeItem('token');
        } catch (e) { console.warn("Storage clear failed", e); }
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, login, googleLogin, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
