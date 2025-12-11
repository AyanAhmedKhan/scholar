import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ManageNotices = () => {
    const [notices, setNotices] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const response = await api.get('/notices/public');
            setNotices(response.data);
        } catch (error) {
            console.error("Failed to fetch notices", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/notices/', { title, content, is_active: true });
            setTitle('');
            setContent('');
            fetchNotices();
        } catch (error) {
            console.error("Failed to create notice", error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/notices/${id}`);
            fetchNotices();
        } catch (error) {
            console.error("Failed to delete notice", error);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Manage Notices</h1>

            <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                <h2 className="text-xl font-semibold mb-4">Post New Notice</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Content</label>
                        <textarea
                            required
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                            rows="4"
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Post Notice
                    </button>
                </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Active Notices</h2>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="space-y-4">
                        {notices.map((notice) => (
                            <div key={notice.id} className="border-b pb-4 flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">{notice.title}</h3>
                                    <p className="text-gray-600 mt-1">{notice.content}</p>
                                    <span className="text-sm text-gray-400 mt-2 block">
                                        Posted on: {new Date(notice.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDelete(notice.id)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                        {notices.length === 0 && <p className="text-gray-500">No notices found.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageNotices;
