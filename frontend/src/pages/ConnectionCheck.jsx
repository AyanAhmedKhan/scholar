import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ConnectionCheck = () => {
    const [status, setStatus] = useState('Checking...');
    const [color, setColor] = useState('gray');
    const [details, setDetails] = useState('');

    useEffect(() => {
        const checkConnection = async () => {
            try {
                // ✅ Always check the real health endpoint
                const response = await api.get('/api/v1/health');

                setStatus('✅ CONNECTED');
                setColor('green');
                setDetails(JSON.stringify(response.data, null, 2));
            } catch (error) {
                console.error('Connection Check Error:', error);

                let errorMessage = error.message;

                if (error.response) {
                    errorMessage = `Server responded with ${error.response.status}:\n${JSON.stringify(
                        error.response.data,
                        null,
                        2
                    )}`;
                } else if (error.request) {
                    errorMessage =
                        'No response received.\nBackend might be down, wrong URL, or blocked by CORS.';
                }

                setStatus('❌ DISCONNECTED');
                setColor('red');
                setDetails(
                    errorMessage +
                    '\n\nVerify that:\n' +
                    '1. Backend is running on port 5001\n' +
                    '2. VITE_API_BASE_URL is correct\n' +
                    '3. /api/v1/health endpoint is reachable'
                );
            }
        };

        checkConnection();
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>Backend Connection Checker</h1>

            <p>
                <strong>Status: </strong>
                <span style={{ color, fontWeight: 'bold' }}>{status}</span>
            </p>

            <div style={{ marginTop: '20px' }}>
                <h3>Details:</h3>
                <pre
                    style={{
                        background: '#f4f4f4',
                        padding: '10px',
                        borderRadius: '5px',
                        overflowX: 'auto'
                    }}
                >
                    {details}
                </pre>
            </div>

            <div style={{ marginTop: '20px', fontSize: '0.85em', color: '#666' }}>
                <p>
                    API Base URL used:{' '}
                    <code>{api.defaults.baseURL}</code>
                </p>
            </div>

            <a href="/">Go Back to Home</a>
        </div>
    );
};

export default ConnectionCheck;
