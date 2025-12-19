import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ScholarshipManagement = () => {
    const [scholarships, setScholarships] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        name: '', description: '', category: '', eligibility_criteria: '', last_date: '',
        mutually_exclusive_ids: [], required_documents: [], required_profile_fields: [],
        min_12th_percentage: '', min_cgpa: '', max_family_income: '', govt_job_allowed: true,
        allowed_categories: [], notify_students: true,
        allowed_batches_new: [], allowed_batches_renewal: [], is_renewable: false
    });
    const [docFormats, setDocFormats] = useState([]);
    const [toast, setToast] = useState(null);
    const [showDocModal, setShowDocModal] = useState(false);
    const [newDocName, setNewDocName] = useState('');
    const [activeTab, setActiveTab] = useState('list');
    const [isCustomCategory, setIsCustomCategory] = useState(false);

    const casteCategories = ["General", "OBC", "ST", "SC", "Gen-EWS", "Other"];

    const allProfileFields = [
        { key: 'enrollment_no', label: 'Enrollment Number' },
        { key: 'department', label: 'Department' },
        { key: 'mobile_number', label: 'Mobile Number' },
        { key: 'date_of_birth', label: 'Date of Birth' },
        { key: 'gender', label: 'Gender' },
        { key: 'father_name', label: "Father's Name" },
        { key: 'mother_name', label: "Mother's Name" },
        { key: 'category', label: 'Category' },
        { key: 'minority_status', label: 'Minority Status' },
        { key: 'disability', label: 'Disability' },
        { key: 'permanent_address', label: 'Permanent Address' },
        { key: 'state', label: 'State' },
        { key: 'district', label: 'District' },
        { key: 'pincode', label: 'Pincode' },
        { key: 'current_address', label: 'Current Address' },
        { key: 'annual_family_income', label: 'Annual Family Income' },
        { key: 'income_certificate_number', label: 'Income Certificate Number' },
        { key: 'issuing_authority', label: 'Issuing Authority' },
        { key: 'income_certificate_validity_date', label: 'Income Certificate Validity' },
        { key: 'account_holder_name', label: 'Account Holder Name' },
        { key: 'bank_name', label: 'Bank Name' },
        { key: 'account_number', label: 'Account Number' },
        { key: 'ifsc_code', label: 'IFSC Code' },
        { key: 'branch_name', label: 'Branch Name' },
        { key: 'current_year_or_semester', label: 'Current Year/Semester' },
        { key: 'previous_exam_percentage', label: 'Previous Exam %' },
        { key: 'backlogs', label: 'Backlogs' },
        { key: 'gap_year', label: 'Gap Year' },
        { key: 'father_occupation', label: "Father's Occupation" },
        { key: 'mother_occupation', label: "Mother's Occupation" },
        { key: 'guardian_annual_income', label: "Guardian's Annual Income" },
        { key: 'parents_govt_job', label: 'Parents Govt Job' },
        { key: 'parent_contact_number', label: 'Parent Contact Number' },
        { key: 'residential_status', label: 'Residential Status' },
    ];

    useEffect(() => {
        fetchScholarships();
        fetchDocFormats();
        fetchSessions();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchSessions = async () => {
        try {
            const res = await api.get('/university/sessions');
            setSessions(res.data);
        } catch (e) {
            console.error("Failed to fetch sessions", e);
        }
    };

    const fetchDocFormats = async () => {
        try {
            const res = await api.get('/documents/types');
            setDocFormats(res.data);
        } catch (e) {
            console.error("Failed to fetch document types", e);
        }
    };

    const fetchScholarships = async () => {
        try {
            const res = await api.get('/scholarships/');
            setScholarships(res.data);
        } catch (e) {
            showToast("Failed to fetch scholarships", "error");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                min_12th_percentage: formData.min_12th_percentage ? parseFloat(formData.min_12th_percentage) : null,
                min_cgpa: formData.min_cgpa ? parseFloat(formData.min_cgpa) : null,
                max_family_income: formData.max_family_income ? parseFloat(formData.max_family_income) : null,
                last_date: formData.last_date || null,
                allowed_batches_new: formData.allowed_batches_new.map(id => parseInt(id)),
                allowed_batches_renewal: formData.allowed_batches_renewal.map(id => parseInt(id)),
            };

            console.log("Submitting Payload:", payload); // Debugging
            if (editing) {
                await api.put(`/scholarships/${editing.id}`, payload);
                showToast("Scholarship updated successfully!");
            } else {
                await api.post('/scholarships/', payload);
                showToast("Scholarship created successfully!");
            }
            fetchScholarships();
            setEditing(null);
            resetForm();
        } catch (err) {
            showToast(err.response?.data?.detail || "Operation failed", "error");
        }
    };

    const resetForm = () => {
        setFormData({
            name: '', description: '', category: '', eligibility_criteria: '', last_date: '',
            mutually_exclusive_ids: [], required_documents: [], required_profile_fields: [],
            min_12th_percentage: '', min_cgpa: '', max_family_income: '', govt_job_allowed: true,
            allowed_categories: [], notify_students: true,
            allowed_batches_new: [], allowed_batches_renewal: [], is_renewable: false,
            application_link: ''
        });
        setIsCustomCategory(false);
    };

    const handleCreateDocType = async (e) => {
        e.preventDefault();
        if (!newDocName.trim()) return;

        try {
            await api.post('/documents/types', { name: newDocName, order_index: docFormats.length + 1 });
            fetchDocFormats();
            showToast("Document type added successfully!");
            setShowDocModal(false);
            setNewDocName('');
        } catch (e) {
            showToast(e.response?.data?.detail || "Failed to add document type", "error");
        }
    };

    const handleAddDoc = () => {
        setFormData(prev => ({
            ...prev,
            required_documents: [...prev.required_documents, {
                document_format_id: docFormats[0]?.id || 1,
                order_index: prev.required_documents.length + 1,
                is_mandatory: true,
                is_renewal_required: false,
                renewal_instruction: '',
                allowed_types: ['pdf', 'jpg', 'jpeg', 'png'],
                max_pages: null
            }]
        }));
    };

    const handleDocChange = (index, field, value) => {
        const newDocs = [...formData.required_documents];
        newDocs[index][field] = value;
        setFormData(prev => ({ ...prev, required_documents: newDocs }));
    };

    const handleEdit = (sch) => {
        setEditing(sch);
        setFormData({
            name: sch.name,
            description: sch.description || '',
            category: sch.category,
            eligibility_criteria: sch.eligibility_criteria || '',
            last_date: sch.last_date || '',
            mutually_exclusive_ids: sch.mutually_exclusive_ids || [],
            required_documents: sch.required_documents || [],
            required_profile_fields: sch.required_profile_fields || [],
            min_12th_percentage: sch.min_12th_percentage || '',
            min_cgpa: sch.min_cgpa || '',
            max_family_income: sch.max_family_income || '',
            govt_job_allowed: sch.govt_job_allowed ?? true,
            allowed_categories: sch.allowed_categories || [],
            notify_students: true,
            allowed_batches_new: sch.allowed_batches_new || [],
            allowed_batches_renewal: sch.allowed_batches_renewal || [],
            is_renewable: sch.is_renewable || false,
            application_link: sch.application_link || ''
        });

        if (sch.category && !["Merit Based", "Need Based"].includes(sch.category)) {
            setIsCustomCategory(true);
        } else {
            setIsCustomCategory(false);
        }

        setActiveTab('form');
    };

    const toggleCategory = (cat) => {
        setFormData(prev => {
            const current = prev.allowed_categories || [];
            if (current.includes(cat)) {
                return { ...prev, allowed_categories: current.filter(c => c !== cat) };
            } else {
                return { ...prev, allowed_categories: [...current, cat] };
            }
        });
    };

    const toggleBatch = (batchId, type) => {
        setFormData(prev => {
            const field = type === 'new' ? 'allowed_batches_new' : 'allowed_batches_renewal';
            const current = prev[field] || [];
            if (current.includes(batchId)) {
                return { ...prev, [field]: current.filter(id => id !== batchId) };
            } else {
                return { ...prev, [field]: [...current, batchId] };
            }
        });
    };

    const toggleProfileField = (fieldKey) => {
        setFormData(prev => {
            const current = prev.required_profile_fields || [];
            if (current.includes(fieldKey)) {
                return { ...prev, required_profile_fields: current.filter(f => f !== fieldKey) };
            } else {
                return { ...prev, required_profile_fields: [...current, fieldKey] };
            }
        });
    };

    const selectAllProfileFields = () => {
        setFormData(prev => ({ ...prev, required_profile_fields: allProfileFields.map(f => f.key) }));
    };

    const clearAllProfileFields = () => {
        setFormData(prev => ({ ...prev, required_profile_fields: [] }));
    };

    const numberToWords = (num) => {
        if (!num) return '';
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        if (num === 0) return 'Zero';
        const toWords = (n) => {
            if (n === 0) return '';
            if (n < 20) return a[n];
            if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10];
            if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + toWords(n % 100);
            if (n < 100000) return toWords(Math.floor(n / 1000)) + 'Thousand ' + toWords(n % 1000);
            if (n < 10000000) return toWords(Math.floor(n / 100000)) + 'Lakh ' + toWords(n % 100000);
            return toWords(Math.floor(n / 10000000)) + 'Crore ' + toWords(n % 10000000);
        };
        return toWords(Number(num));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 font-display">Scholarship Management</h1>
                    <p className="text-slate-500 mt-1">Create and manage scholarship schemes</p>
                </div>
                <button
                    onClick={() => {
                        setEditing(null);
                        resetForm();
                        setActiveTab('form');
                    }}
                    className="bg-primary-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-sm flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    New Scholarship
                </button>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all z-50 flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                    {toast.type === 'success' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    {toast.message}
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-200">
                    <nav className="flex -mb-px">
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'list'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            📋 All Scholarships
                        </button>
                        <button
                            onClick={() => setActiveTab('form')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'form'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            {editing ? '✏️ Edit Scholarship' : '➕ Create Scholarship'}
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {/* List Tab */}
                    {activeTab === 'list' && (
                        <div className="space-y-4">
                            {scholarships.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <p>No scholarships found. Create your first scholarship!</p>
                                </div>
                            ) : (
                                scholarships.map(sch => (
                                    <div key={sch.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-bold text-slate-800">
                                                        <span className="text-slate-400 font-mono mr-2">#{sch.id}</span>
                                                        {sch.name}
                                                    </h3>
                                                    {sch.is_renewable && (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                            🔄 Renewable
                                                        </span>
                                                    )}
                                                    {!sch.is_active && (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-600 mb-2">{sch.description}</p>
                                                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                                    <span className="bg-slate-100 px-2 py-1 rounded">{sch.category}</span>
                                                    {sch.last_date && (
                                                        <span>Deadline: {new Date(sch.last_date).toLocaleDateString()}</span>
                                                    )}
                                                    {sch.allowed_batches_new && sch.allowed_batches_new.length > 0 && (
                                                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                                                            New: {sch.allowed_batches_new.length} batch(es)
                                                        </span>
                                                    )}
                                                    {sch.allowed_batches_renewal && sch.allowed_batches_renewal.length > 0 && (
                                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                            Renewal: {sch.allowed_batches_renewal.length} batch(es)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                <button
                                                    onClick={() => handleEdit(sch)}
                                                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium border border-blue-200 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm('Are you sure you want to deactivate this scholarship?')) {
                                                            try {
                                                                await api.delete(`/scholarships/${sch.id}`);
                                                                showToast("Scholarship deactivated successfully!");
                                                                fetchScholarships();
                                                            } catch (e) {
                                                                showToast("Failed to deactivate", "error");
                                                            }
                                                        }
                                                    }}
                                                    className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium border border-red-200 transition-colors"
                                                >
                                                    Deactivate
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const res = await api.get(`/scholarships/${sch.id}/export`, { responseType: 'blob' });
                                                            const url = window.URL.createObjectURL(new Blob([res.data]));
                                                            const link = document.createElement('a');
                                                            link.href = url;
                                                            link.setAttribute('download', `scholarship_${sch.id}_export.csv`);
                                                            document.body.appendChild(link);
                                                            link.click();
                                                            link.remove();
                                                            showToast("Export completed!");
                                                        } catch (e) {
                                                            showToast("Export failed", "error");
                                                        }
                                                    }}
                                                    className="bg-green-50 text-green-600 hover:bg-green-100 px-4 py-2 rounded-lg text-sm font-medium border border-green-200 transition-colors"
                                                >
                                                    Export CSV
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Form Tab */}
                    {activeTab === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Information */}
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Basic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Scholarship Name *</label>
                                        <input
                                            placeholder="e.g., Merit Scholarship 2024"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Application Link (Optional)</label>
                                        <input
                                            placeholder="https://example.com/apply"
                                            value={formData.application_link || ''}
                                            onChange={e => setFormData({ ...formData, application_link: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">If provided, an "Official Application Link" button will be shown.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category *</label>
                                        <select
                                            value={isCustomCategory ? 'Custom' : formData.category}
                                            onChange={(e) => {
                                                if (e.target.value === 'Custom') {
                                                    setIsCustomCategory(true);
                                                    setFormData({ ...formData, category: '' });
                                                } else {
                                                    setIsCustomCategory(false);
                                                    setFormData({ ...formData, category: e.target.value });
                                                }
                                            }}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white mb-2"
                                            required
                                        >
                                            <option value="">Select Category</option>
                                            <option value="Merit Based">Merit Based</option>
                                            <option value="Need Based">Need Based</option>
                                            <option value="Custom">Custom Create</option>
                                        </select>

                                        {isCustomCategory && (
                                            <input
                                                placeholder="Enter Custom Category Name"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                                required
                                                autoFocus
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Application Deadline</label>
                                        <input
                                            type="date"
                                            value={formData.last_date || ''}
                                            onChange={e => setFormData({ ...formData, last_date: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mutually Exclusive IDs</label>
                                        <input
                                            placeholder="Comma separated scholarship IDs"
                                            value={formData.mutually_exclusive_ids.join(',')}
                                            onChange={e => setFormData({ ...formData, mutually_exclusive_ids: e.target.value.split(',').map(Number).filter(n => !isNaN(n)) })}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                                    <textarea
                                        placeholder="Detailed description of the scholarship"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                                        rows="3"
                                    />
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Eligibility Criteria (Display Text)</label>
                                    <textarea
                                        placeholder="Eligibility criteria as shown to students"
                                        value={formData.eligibility_criteria}
                                        onChange={e => setFormData({ ...formData, eligibility_criteria: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                                        rows="3"
                                    />
                                </div>
                            </div>

                            {/* Batch/Session Management */}
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Batch & Renewal Management</h3>

                                <div className="mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_renewable}
                                            onChange={e => setFormData({ ...formData, is_renewable: e.target.checked })}
                                            className="h-4 w-4 text-primary-600 rounded border-slate-300"
                                        />
                                        <span className="text-sm font-semibold text-slate-700">Enable Renewal for this Scholarship</span>
                                    </label>
                                    <p className="text-xs text-slate-500 mt-1 ml-6">If enabled, students can renew this scholarship after approval</p>
                                </div>

                                {sessions.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Batches Eligible for NEW Application</label>
                                            <p className="text-xs text-slate-500 mb-3">Select which batches can apply as new applicants</p>
                                            <div className="bg-white border border-slate-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                                                {sessions.map(session => (
                                                    <label key={session.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.allowed_batches_new.includes(session.id)}
                                                            onChange={() => toggleBatch(session.id, 'new')}
                                                            className="h-4 w-4 text-primary-600 rounded border-slate-300"
                                                        />
                                                        <span className="text-sm text-slate-700">{session.name}</span>
                                                        {session.is_active && (
                                                            <span className="ml-auto text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">Active</span>
                                                        )}
                                                    </label>
                                                ))}
                                            </div>
                                            {formData.allowed_batches_new.length > 0 && (
                                                <p className="text-xs text-slate-500 mt-2">
                                                    {formData.allowed_batches_new.length} batch(es) selected for new applications
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Batches Eligible for RENEWAL</label>
                                            <p className="text-xs text-slate-500 mb-3">Select which batches can renew this scholarship</p>
                                            <div className="bg-white border border-slate-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                                                {sessions.map(session => (
                                                    <label key={session.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.allowed_batches_renewal.includes(session.id)}
                                                            onChange={() => toggleBatch(session.id, 'renewal')}
                                                            disabled={!formData.is_renewable}
                                                            className="h-4 w-4 text-primary-600 rounded border-slate-300 disabled:opacity-50"
                                                        />
                                                        <span className={`text-sm ${!formData.is_renewable ? 'text-slate-400' : 'text-slate-700'}`}>
                                                            {session.name}
                                                        </span>
                                                        {session.is_active && (
                                                            <span className="ml-auto text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">Active</span>
                                                        )}
                                                    </label>
                                                ))}
                                            </div>
                                            {formData.allowed_batches_renewal.length > 0 && (
                                                <p className="text-xs text-slate-500 mt-2">
                                                    {formData.allowed_batches_renewal.length} batch(es) selected for renewal
                                                </p>
                                            )}
                                            {!formData.is_renewable && (
                                                <p className="text-xs text-amber-600 mt-2">Enable renewal above to select batches</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Eligibility Criteria Section */}
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Eligibility Rules</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Min 12th Percentage</label>
                                        <input
                                            type="number" step="0.01"
                                            placeholder="e.g., 75.00"
                                            value={formData.min_12th_percentage}
                                            onChange={e => setFormData({ ...formData, min_12th_percentage: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Min CGPA</label>
                                        <input
                                            type="number" step="0.01"
                                            placeholder="e.g., 7.50"
                                            value={formData.min_cgpa}
                                            onChange={e => setFormData({ ...formData, min_cgpa: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Max Family Income</label>
                                        <input
                                            type="number"
                                            placeholder="e.g., 500000"
                                            value={formData.max_family_income}
                                            onChange={e => setFormData({ ...formData, max_family_income: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        />
                                        {formData.max_family_income && (
                                            <p className="text-xs text-slate-500 mt-1 font-medium">
                                                {numberToWords(formData.max_family_income)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-4">
                                    <input
                                        type="checkbox"
                                        checked={formData.govt_job_allowed}
                                        onChange={e => setFormData({ ...formData, govt_job_allowed: e.target.checked })}
                                        className="h-4 w-4 text-primary-600 rounded border-slate-300"
                                    />
                                    <span className="text-sm text-slate-700">Government Job Allowed?</span>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Allowed Categories</label>
                                    <div className="flex flex-wrap gap-2">
                                        {casteCategories.map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => toggleCategory(cat)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${formData.allowed_categories?.includes(cat)
                                                    ? 'bg-primary-100 text-primary-700 border-primary-200'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Required Documents */}
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Required Documents (In Order)</h3>
                                {formData.required_documents.map((doc, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200 mb-3">
                                        <div className="flex gap-4 items-center mb-3">
                                            <span className="text-slate-500 font-medium w-6">{idx + 1}.</span>
                                            <div className="flex-1 flex gap-2">
                                                <select
                                                    value={doc.document_format_id}
                                                    onChange={e => handleDocChange(idx, 'document_format_id', parseInt(e.target.value))}
                                                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                                                >
                                                    {docFormats.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowDocModal(true)}
                                                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 rounded border border-slate-300"
                                                    title="Add New Document Type"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={doc.is_mandatory}
                                                    onChange={e => handleDocChange(idx, 'is_mandatory', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                                                <span className="ml-2 text-sm font-medium text-slate-700">Mandatory</span>
                                            </label>

                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, required_documents: prev.required_documents.filter((_, i) => i !== idx) }))}
                                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Renewal Options */}
                                        <div className="flex flex-wrap items-center gap-4 ml-10 mt-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={doc.is_renewal_required}
                                                    onChange={e => handleDocChange(idx, 'is_renewal_required', e.target.checked)}
                                                    className="h-4 w-4 text-theme-600 rounded border-slate-300"
                                                />
                                                <span className="text-xs font-medium text-slate-600">Required for Renewal?</span>
                                            </div>
                                            {doc.is_renewal_required && (
                                                <input
                                                    placeholder="Renewal Instructions"
                                                    value={doc.renewal_instruction || ''}
                                                    onChange={e => handleDocChange(idx, 'renewal_instruction', e.target.value)}
                                                    className="flex-1 min-w-[200px] px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                                />
                                            )}
                                        </div>

                                        {/* Document Restrictions */}
                                        <div className="ml-10 mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                            <div className="flex flex-wrap gap-6 items-start">
                                                {/* Allowed File Types */}
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">Allowed File Types</label>
                                                <div className="flex items-center gap-3">
                                                    {['pdf', 'jpg', 'jpeg', 'png'].map(type => (
                                                        <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={(doc.allowed_types || ['pdf']).includes(type)}
                                                                onChange={e => {
                                                                    const current = doc.allowed_types || ['pdf'];
                                                                    let updated;
                                                                    if (e.target.checked) {
                                                                        updated = [...current, type];
                                                                    } else {
                                                                        updated = current.filter(t => t !== type);
                                                                    }
                                                                    // Ensure at least one type is selected
                                                                    if (updated.length === 0) updated = ['pdf'];
                                                                    handleDocChange(idx, 'allowed_types', updated);
                                                                }}
                                                                className="h-3.5 w-3.5 text-primary-600 rounded border-slate-300"
                                                            />
                                                            <span className="text-xs text-slate-600 uppercase">{type}</span>
                                                        </label>
                                                    ))}
                                                </div>

                                                {/* Max Pages (Only if PDF is allowed) */}
                                                {(doc.allowed_types || ['pdf']).includes('pdf') && (
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Max Pages (PDF)</label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                placeholder="No Limit"
                                                                value={doc.max_pages || ''}
                                                                onChange={e => handleDocChange(idx, 'max_pages', e.target.value ? parseInt(e.target.value) : null)}
                                                                className="w-24 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-primary-500 outline-none"
                                                            />
                                                            <span className="text-[10px] text-slate-400">Leave blank for no limit</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Instructions Field */}
                                        <div className="mt-3 ml-10">
                                            <input
                                                placeholder="Instructions for students (e.g. 'Must be attested', 'Upload original scan')"
                                                value={doc.instructions || ''}
                                                onChange={e => handleDocChange(idx, 'instructions', e.target.value)}
                                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                                            />
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleAddDoc}
                                    className="text-primary-600 text-sm font-medium hover:underline flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add Document
                                </button>
                            </div>

                            {/* Required Profile Fields */}
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-bold text-slate-800">Required Profile Fields</h3>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={selectAllProfileFields} className="text-xs text-primary-600 hover:underline">Select All</button>
                                        <span className="text-slate-300">|</span>
                                        <button type="button" onClick={clearAllProfileFields} className="text-xs text-slate-500 hover:underline">Clear All</button>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mb-3">Select which profile fields students must have filled when applying for this scholarship.</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto bg-white p-3 rounded-lg border border-slate-200">
                                    {allProfileFields.map(field => (
                                        <label key={field.key} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded transition">
                                            <input
                                                type="checkbox"
                                                checked={formData.required_profile_fields?.includes(field.key) || false}
                                                onChange={() => toggleProfileField(field.key)}
                                                className="h-4 w-4 text-primary-600 rounded border-slate-300"
                                            />
                                            <span className="text-xs text-slate-700">{field.label}</span>
                                        </label>
                                    ))}
                                </div>
                                {formData.required_profile_fields?.length > 0 && (
                                    <p className="text-xs text-slate-500 mt-2">{formData.required_profile_fields.length} field(s) selected</p>
                                )}
                            </div>

                            {/* Notification Option */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="notify_students"
                                    checked={formData.notify_students}
                                    onChange={e => setFormData({ ...formData, notify_students: e.target.checked })}
                                    className="h-4 w-4 text-primary-600 rounded border-slate-300"
                                />
                                <label htmlFor="notify_students" className="text-sm font-medium text-slate-700">
                                    Send Email Notification to Eligible Students
                                </label>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-sm"
                                >
                                    {editing ? 'Update Scholarship' : 'Create Scholarship'}
                                </button>
                                {editing && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditing(null);
                                            resetForm();
                                            setActiveTab('list');
                                        }}
                                        className="bg-slate-200 text-slate-700 px-8 py-3 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Modal for New Document Type */}
            {
                showDocModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md mx-4">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Add New Document Type</h3>
                            <form onSubmit={handleCreateDocType}>
                                <input
                                    autoFocus
                                    placeholder="Document Type Name (e.g. Bonafide Certificate)"
                                    value={newDocName}
                                    onChange={e => setNewDocName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none mb-4"
                                    required
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowDocModal(false)}
                                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
                                    >
                                        Add Type
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ScholarshipManagement;
