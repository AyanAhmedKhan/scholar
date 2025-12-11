import React, { useEffect, useState } from 'react';
import api from '../services/api';

const VaultManagement = () => {
    const [types, setTypes] = useState([]);
    const [formData, setFormData] = useState({
        name: '', description: '', file_type: 'pdf', max_size_mb: 2, order_index: 0, is_mandatory_vault: false
    });

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        const res = await api.get('/documents/types');
        setTypes(res.data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/documents/types', formData);
            fetchTypes();
            setFormData({ name: '', description: '', file_type: 'pdf', max_size_mb: 2, order_index: 0, is_mandatory_vault: false });
        } catch (err) {
            alert('Failed to create type');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/documents/types/${id}`);
            fetchTypes();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-slate-800">Vault Document Types</h1>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Add New Document Type</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        placeholder="Document Name (e.g. Aadhaar Card)"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="input-field" required
                    />
                    <input
                        placeholder="Description"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="input-field"
                    />
                    <div className="flex gap-4">
                        <select
                            value={formData.file_type}
                            onChange={e => setFormData({ ...formData, file_type: e.target.value })}
                            className="input-field"
                        >
                            <option value="pdf">PDF</option>
                            <option value="jpg">JPG</option>
                            <option value="png">PNG</option>
                        </select>
                        <input
                            type="number" placeholder="Max Size (MB)"
                            value={formData.max_size_mb}
                            onChange={e => setFormData({ ...formData, max_size_mb: parseInt(e.target.value) })}
                            className="input-field"
                        />
                    </div>
                    <div className="flex gap-4 items-center">
                        <input
                            type="number" placeholder="Order Index"
                            value={formData.order_index}
                            onChange={e => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                            className="input-field"
                        />
                        <label className="flex items-center gap-2 text-sm font-medium">
                            <input
                                type="checkbox"
                                checked={formData.is_mandatory_vault}
                                onChange={e => setFormData({ ...formData, is_mandatory_vault: e.target.checked })}
                            />
                            Mandatory in Vault
                        </label>
                    </div>
                    <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg font-bold md:col-span-2">
                        Create Document Type
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-800 font-medium">
                        <tr>
                            <th className="px-6 py-3">Order</th>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Type/Size</th>
                            <th className="px-6 py-3">Mandatory</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {types.map((type) => (
                            <tr key={type.id} className="hover:bg-slate-50">
                                <td className="px-6 py-3">{type.order_index}</td>
                                <td className="px-6 py-3 font-medium text-slate-900">{type.name}</td>
                                <td className="px-6 py-3 uppercase">{type.file_type} ({type.max_size_mb}MB)</td>
                                <td className="px-6 py-3">{type.is_mandatory_vault ? 'Yes' : 'No'}</td>
                                <td className="px-6 py-3">
                                    <button onClick={() => handleDelete(type.id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <style>{`
                .input-field {
                    padding: 0.5rem;
                    border: 1px solid #cbd5e1;
                    border-radius: 0.375rem;
                    width: 100%;
                }
            `}</style>
        </div>
    );
};

export default VaultManagement;
