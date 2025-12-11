import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1', // Vite proxy handles the host
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        let token = null;
        try {
            token = localStorage.getItem('token');
        } catch (e) {
            console.warn('Cannot access localStorage for token retrieval:', e);
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const { status, data } = error.response;

            // Handle 401 Unauthorized
            if (status === 401) {
                try {
                    localStorage.removeItem('token');
                } catch (e) { console.warn("Storage clear failed", e); }
                window.location.href = '/login';
                return Promise.reject(error);
            }

            // Handle 403 Forbidden
            if (status === 403) {
                console.error('Access forbidden:', data?.detail || 'You do not have permission to perform this action');
            }

            // Handle 404 Not Found
            if (status === 404) {
                console.error('Resource not found:', data?.detail || 'The requested resource was not found');
            }

            // Handle 500 Server Error
            if (status >= 500) {
                console.error('Server error:', data?.detail || 'An internal server error occurred');
            }

            // Log error details for debugging
            if (process.env.NODE_ENV === 'development') {
                console.error('API Error:', {
                    status,
                    data,
                    url: error.config?.url,
                    method: error.config?.method
                });
            }
        } else if (error.request) {
            // Network error
            console.error('Network error: Unable to reach the server. Please check your connection.');
        } else {
            // Request setup error
            console.error('Request error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api;
