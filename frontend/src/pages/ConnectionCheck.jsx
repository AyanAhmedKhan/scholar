import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../services/api';

const ConnectionCheck = () => {
    const [status, setStatus] = useState('Checking...');
    const [color, setColor] = useState('gray');
    const [details, setDetails] = useState('');

    useEffect(() => {
        const checkConnection = async () => {
            try {
                // Using the configured api service which handles the baseURL logic
                const response = await api.get('/');
                setStatus('✅ CONNECTED');
                setColor('green');
                setDetails(JSON.stringify(response.data, null, 2));
            } catch (error) {
                console.error("Connection Check Error:", error);

                let errorMessage = error.message;
                if (error.response) {
                    errorMessage = `Server responded with ${error.response.status}: ${JSON.stringify(error.response.data)}`;
                } else if (error.request) {
                    errorMessage = "No response received. Backend might be down or blocked by CORS/Network.";
                }

                setStatus('❌ DISCONNECTED');
                setColor('red');
                setDetails(errorMessage + "\n\nVerify that:\n1. Backend is running on port 5001\n2. VITE_API_BASE_URL is set correctly in .env.production\n3. You are accessing the correct URL");
            }
        };

        checkConnection();
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>Backend Connection Checker</h1>
            <p>
                <strong>Status: </strong>
                <span style={{ color: color, fontWeight: 'bold' }}>{status}</span>
            </p>
            <div style={{ marginTop: '20px' }}>
                <h3>Details:</h3>
                <pre style={{ background: '#f4f4f4', padding: '10px', borderRadius: '5px', overflowX: 'auto' }}>
                    {details}
                </pre>
            </div>

            <div style={{ marginTop: '20px', fontSize: '0.8em', color: '#666' }}>
                <p>API Base URL used: <code>{api.defaults.baseURL}</code></p>
            </div>
            <a href="/">Go Back to Home</a>
        </div>
    );
};

export default ConnectionCheck;
