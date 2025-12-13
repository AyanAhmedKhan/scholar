import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Number to Words Utility for Indian Currency
const numberToWords = (num) => {
    if (!num) return '';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';

    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : 'Only';

    return str;
};

const Onboarding = () => {
    const { user, fetchUser } = useAuth(); // Re-login/fetchUser might be needed
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [branches, setBranches] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [isEditing, setIsEditing] = useState(false);

    // Mandatory Fields State
    const [formData, setFormData] = useState({
        current_year_or_semester: '', // Repurposed for Session (e.g., "2023 Admitted")
        department: '',
        branch: '',
        mobile_number: '',
        date_of_birth: '',
        gender: '',
        father_name: '',
        mother_name: '',
        category: '',
        annual_family_income: '',
        percentage_12th: '',
        parents_govt_job: '',
    });

    // Helper to fetch branches
    const fetchBranches = (deptName) => {
        if (!deptName) {
            setBranches([]);
            return;
        }
        // We need department ID, finding it from departments list might race if departments aren't loaded yet.
        // Assuming departments are loaded first or we search in the existing list.
        // Better: Wait for departments to load before processing profile data dependent on it?
        // Actually, we can just look it up if departments state is populated.
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Fetch Master Data
                const [deptRes, sessRes] = await Promise.all([
                    api.get('/university/departments'),
                    api.get('/university/sessions')
                ]);

                const depts = deptRes.data || [];
                setDepartments(depts);
                setSessions(sessRes.data || []);

                // 2. Try Fetching Existing Profile
                try {
                    const profileRes = await api.get('/profile/me');
                    const profile = profileRes.data;

                    setIsEditing(true);
                    setFormData({
                        current_year_or_semester: profile.current_year_or_semester || '',
                        department: profile.department || '',
                        branch: profile.branch || '',
                        mobile_number: profile.mobile_number || '',
                        date_of_birth: profile.date_of_birth || '',
                        gender: profile.gender || '',
                        father_name: profile.father_name || '',
                        mother_name: profile.mother_name || '',
                        category: profile.category || '',
                        annual_family_income: profile.annual_family_income || '',
                        percentage_12th: profile.percentage_12th || '',
                        parents_govt_job: profile.parents_govt_job !== undefined ? (profile.parents_govt_job ? 'Yes' : 'No') : '',
                    });

                    // Fetch branches for existing department
                    if (profile.department) {
                        const selectedDept = depts.find(d => d.name === profile.department);
                        if (selectedDept) {
                            const branchRes = await api.get(`/university/branches?department_id=${selectedDept.id}`);
                            setBranches(branchRes.data || []);
                        }
                    }

                } catch (err) {
                    if (err.response && err.response.status === 404) {
                        // Profile not found - User needs to create one (default state)
                        setIsEditing(false);
                    } else {
                        console.error("Error checking profile:", err);
                    }
                }

            } catch (err) {
                console.error("Failed to load initial data", err);
            }
        };

        loadData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Fetch branches if department changes
        if (name === 'department') {
            const selectedDept = departments.find(d => d.name === value);
            if (selectedDept) {
                api.get(`/university/branches?department_id=${selectedDept.id}`)
                    .then(res => setBranches(res.data || []))
                    .catch(err => console.error(err));
            } else {
                setBranches([]);
            }
            // Reset branch selection
            setFormData(prev => ({ ...prev, branch: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Clean payload
            const payload = { ...formData };
            if (payload.annual_family_income === '') {
                payload.annual_family_income = null;
            } else {
                payload.annual_family_income = parseFloat(payload.annual_family_income);
            }
            if (payload.percentage_12th) payload.percentage_12th = parseFloat(payload.percentage_12th);
            payload.parents_govt_job = payload.parents_govt_job === 'Yes';

            if (isEditing) {
                await api.put('/profile/me', payload);
            } else {
                await api.post('/profile/', payload);
            }

            // Force refresh user to get updated is_profile_complete status
            if (fetchUser) await fetchUser();
            window.location.href = '/dashboard';
        } catch (error) {
            console.error("Onboarding failed", error);
            const msg = error.response?.data?.detail || "Failed to save profile. Please try again.";
            alert(msg);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-indigo-700 p-8 text-center text-white">
                    <h1 className="text-3xl font-bold font-display mb-2">Welcome to Scholarship Portal</h1>
                    <p className="text-indigo-100">Please complete your profile to continue.</p>
                </div>

                <div className="p-8">
                    {/* Read-Only Info */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center text-sm text-blue-900">
                        <div className="flex flex-col items-center md:items-start">
                            <span className="text-blue-500 text-xs font-bold uppercase tracking-wider">Name</span>
                            <span className="font-bold text-lg">{user?.full_name || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col items-center md:items-end">
                            <span className="text-blue-500 text-xs font-bold uppercase tracking-wider">Enrollment No.</span>
                            <span className="font-bold text-lg font-mono">{user?.enrollment_no || 'N/A'}</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Department */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Department <span className="text-red-500">*</span></label>
                                <select
                                    name="department"
                                    required
                                    value={formData.department}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition bg-white"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.name}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Branch */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Branch <span className="text-red-500">*</span></label>
                                <select
                                    name="branch"
                                    required
                                    value={formData.branch}
                                    onChange={handleChange}
                                    disabled={!formData.department}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                                >
                                    <option value="">Select Branch</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.name}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Session (Replaces Current Year/Sem) */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Admission Session <span className="text-red-500">*</span></label>
                                <select
                                    name="current_year_or_semester"
                                    required
                                    value={formData.current_year_or_semester}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition bg-white"
                                >
                                    <option value="">Select Admission Session</option>
                                    {sessions.map(s => {
                                        const label = s.name.toLowerCase().includes('admitted') ? s.name : `${s.name} Admitted`;
                                        return <option key={s.id} value={label}>{label}</option>;
                                    })}
                                </select>
                            </div>

                            {/* Mobile */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Mobile Number <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    name="mobile_number"
                                    required
                                    value={formData.mobile_number}
                                    onChange={handleChange}
                                    placeholder="9876543210"
                                    pattern="[0-9]{10}"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition"
                                />
                            </div>

                            {/* DOB */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Date of Birth <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    name="date_of_birth"
                                    required
                                    value={formData.date_of_birth}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition"
                                />
                            </div>

                            {/* Gender */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Gender <span className="text-red-500">*</span></label>
                                <select
                                    name="gender"
                                    required
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition bg-white"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* Category */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Category <span className="text-red-500">*</span></label>
                                <select
                                    name="category"
                                    required
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition bg-white"
                                >
                                    <option value="">Select Category</option>
                                    <option value="General">General</option>
                                    <option value="OBC">OBC</option>
                                    <option value="SC">SC</option>
                                    <option value="ST">ST</option>
                                    <option value="Gen-EWS">Gen-EWS</option>
                                </select>
                            </div>

                            {/* Father's Name */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Father's Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="father_name"
                                    required
                                    value={formData.father_name}
                                    onChange={handleChange}
                                    placeholder="Mr. "
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition"
                                />
                            </div>

                            {/* Mother's Name */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Mother's Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="mother_name"
                                    required
                                    value={formData.mother_name}
                                    onChange={handleChange}
                                    placeholder="Mrs. "
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition"
                                />
                            </div>

                            {/* Income */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700">Annual Family Income (₹) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    name="annual_family_income"
                                    required
                                    value={formData.annual_family_income}
                                    onChange={handleChange}
                                    placeholder="Enter numerical value only"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition"
                                />
                                {formData.annual_family_income && (
                                    <p className="text-sm text-green-600 font-medium italic mt-1">
                                        {numberToWords(Math.floor(formData.annual_family_income))} Rupees Only
                                    </p>
                                )}
                            </div>

                            {/* 12th Percentage */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">12th Percentage <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    name="percentage_12th"
                                    required
                                    value={formData.percentage_12th}
                                    onChange={handleChange}
                                    placeholder="Enter percentage"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition"
                                />
                            </div>

                            {/* Parents Govt Job */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Parents have Govt Job? <span className="text-red-500">*</span></label>
                                <select
                                    name="parents_govt_job"
                                    required
                                    value={formData.parents_govt_job}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition bg-white"
                                >
                                    <option value="">Select Option</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Saving Profile...' : 'Complete Profile & Continue'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
