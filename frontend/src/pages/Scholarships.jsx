import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ScholarshipCard from '../components/ScholarshipCard';
import Toast from '../components/Toast';

const Scholarships = () => {
    const [scholarships, setScholarships] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('deadline');

    const [userProfile, setUserProfile] = useState(null);

    const [conflictModal, setConflictModal] = useState({ isOpen: false, conflictName: '', targetId: null });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [schRes, appRes, profileRes] = await Promise.all([
                    api.get('/scholarships/'),
                    api.get('/applications/'),
                    api.get('/profile/me').catch(() => ({ data: null })) // Handle no profile
                ]);
                setScholarships(schRes.data);
                setApplications(appRes.data);
                setUserProfile(profileRes.data);
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const onApplyClick = (scholarshipId) => {
        const sch = scholarships.find(s => s.id === scholarshipId);

        // Check for mutual exclusion
        if (sch.mutually_exclusive_ids && sch.mutually_exclusive_ids.length > 0) {
            const conflictingApp = applications.find(app =>
                sch.mutually_exclusive_ids.includes(app.scholarship_id) &&
                app.status !== 'rejected'
            );

            if (conflictingApp) {
                const conflictingScholarship = scholarships.find(s => s.id === conflictingApp.scholarship_id);
                const conflictName = conflictingScholarship ? conflictingScholarship.name : 'another scholarship';
                setConflictModal({ isOpen: true, conflictName, targetId: scholarshipId });
                return;
            }
        }

        // Eligibility + Missing Data Check
        if (userProfile) {
            console.log("Checking Eligibility for:", sch.name);
            console.log("User Profile:", userProfile);
            console.log("Criteria:", {
                cats: sch.allowed_categories,
                income: sch.max_family_income,
                cgpa: sch.min_cgpa,
                govt: sch.govt_job_allowed
            });

            const failures = [];
            const missing = [];

            // 1. Category Check
            if (sch.allowed_categories && sch.allowed_categories.length > 0) {
                if (!userProfile.category) {
                    missing.push("Category");
                } else if (!sch.allowed_categories.includes(userProfile.category)) {
                    failures.push(`Allowed Categories: ${sch.allowed_categories.join(', ')} (You are: ${userProfile.category})`);
                }
            }

            // 2. Income Check
            if (sch.max_family_income) {
                if (userProfile.annual_family_income === undefined || userProfile.annual_family_income === null) {
                    missing.push("Annual Family Income");
                } else if (userProfile.annual_family_income > sch.max_family_income) {
                    failures.push(`Max Family Income: ₹${sch.max_family_income.toLocaleString()} (Yours: ₹${userProfile.annual_family_income.toLocaleString()})`);
                }
            }

            // 3. Score/CGPA Check
            if (sch.min_cgpa) {
                if (userProfile.previous_exam_percentage === undefined || userProfile.previous_exam_percentage === null) {
                    missing.push("Previous Exam Percentage/CGPA");
                } else if ((userProfile.previous_exam_percentage || 0) < sch.min_cgpa) {
                    failures.push(`Min Score Required: ${sch.min_cgpa} (Yours: ${userProfile.previous_exam_percentage})`);
                }
            }

            // 4. Govt Job Check
            if (sch.govt_job_allowed === false) {
                if (userProfile.parents_govt_job === undefined || userProfile.parents_govt_job === null) {
                    missing.push("Parent's Govt Job Status");
                } else if (userProfile.parents_govt_job) {
                    failures.push("Students with parents in Govt Jobs are not eligible.");
                }
            }

            // Handle Missing Data
            if (missing.length > 0) {
                alert(`Please complete your profile before applying.\n\nMissing details:\n- ${missing.join('\n- ')}\n\nGo to 'Profile' to add these details.`);
                return;
            }

            // Handle Ineligibility
            if (failures.length > 0) {
                alert(`You are not eligible for this scholarship based on the following criteria:\n\n- ${failures.join('\n- ')}`);
                return;
            }
        }

        // No conflict, proceed
        navigate(`/apply/${scholarshipId}`);
    };

    const handleSwitchConfirm = async () => {
        try {
            setLoading(true);
            await api.post('/applications/switch-scholarship', { target_scholarship_id: conflictModal.targetId });
            alert("Application switched successfully! You can now apply to the new scholarship.");
            setConflictModal({ ...conflictModal, isOpen: false });

            // Refresh data
            const [appRes, profileRes] = await Promise.all([
                api.get('/applications/'),
                api.get('/profile/me')
            ]);
            setApplications(appRes.data);
            setUserProfile(profileRes.data);

            // Navigate to apply
            navigate(`/apply/${conflictModal.targetId}`);
        } catch (error) {
            console.error("Switch failed", error);
            alert(error.response?.data?.detail || "Failed to switch scholarship.");
        } finally {
            setLoading(false);
        }
    };

    // Get unique categories
    const categories = useMemo(() => {
        const cats = [...new Set(scholarships.map(s => s.category).filter(Boolean))];
        return cats.sort();
    }, [scholarships]);

    // Filter and sort scholarships
    const filteredScholarships = useMemo(() => {
        let result = [...scholarships];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.name?.toLowerCase().includes(query) ||
                s.description?.toLowerCase().includes(query) ||
                s.category?.toLowerCase().includes(query)
            );
        }

        // Category filter
        if (selectedCategory !== 'all') {
            result = result.filter(s => s.category === selectedCategory);
        }

        // Sorting
        result.sort((a, b) => {
            if (sortBy === 'deadline') {
                return new Date(a.last_date) - new Date(b.last_date);
            } else if (sortBy === 'name') {
                return (a.name || '').localeCompare(b.name || '');
            } else if (sortBy === 'recent') {
                return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            }
            return 0;
        });

        return result;
    }, [scholarships, searchQuery, selectedCategory, sortBy]);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in-up relative">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 font-display mb-2">
                        Available Scholarships
                    </h1>
                    <p className="text-slate-500">Find and apply for scholarships that match your profile.</p>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by name, description, or category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                            />
                            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="md:w-48">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-white"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sort */}
                    <div className="md:w-44">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-white"
                        >
                            <option value="deadline">Sort by Deadline</option>
                            <option value="name">Sort by Name</option>
                            <option value="recent">Most Recent</option>
                        </select>
                    </div>
                </div>

                {/* Results count */}
                <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>
                        Showing <span className="font-semibold text-slate-900">{filteredScholarships.length}</span> of {scholarships.length} scholarships
                    </span>
                    {searchQuery && (
                        <button
                            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredScholarships.map((sch) => {
                    const existingApp = applications.find(a => a.scholarship_id === sch.id);
                    return (
                        <ScholarshipCard
                            key={sch.id}
                            scholarship={sch}
                            application={existingApp}
                            onApply={onApplyClick}
                        />
                    );
                })}
            </div>

            {/* Conflict Modal */}
            {conflictModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Application Conflict</h3>
                                <p className="text-slate-600 text-sm mt-1">
                                    You have already applied for <strong>{conflictModal.conflictName}</strong>, which is mutually exclusive with this scholarship.
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                            {(userProfile?.scholarship_switch_count || 0) < 1 ? (
                                <>
                                    <p className="text-sm text-slate-700 font-medium mb-2">Available Action:</p>
                                    <p className="text-xs text-slate-600">
                                        You can <span className="font-bold text-primary-600">switch</span> your application to this one.
                                        This will withdraw your current application for {conflictModal.conflictName}.
                                    </p>
                                    <p className="text-xs text-amber-600 font-semibold mt-2">
                                        Note: This action can be performed only once.
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-red-600 font-medium">
                                    You have already used your one-time switch allowance. You cannot apply for this scholarship.
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setConflictModal({ ...conflictModal, isOpen: false })}
                                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            {(userProfile?.scholarship_switch_count || 0) < 1 && (
                                <button
                                    onClick={handleSwitchConfirm}
                                    className="px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 shadow-sm hover:shadow transition-all"
                                >
                                    Switch & Apply
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {filteredScholarships.length === 0 && scholarships.length > 0 && (
                <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">No scholarships match your search</h3>
                    <p className="text-slate-500 mt-1">Try adjusting your filters or search terms.</p>
                    <button
                        onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                        className="mt-4 text-primary-600 hover:text-primary-700 font-semibold"
                    >
                        Clear all filters
                    </button>
                </div>
            )}

            {scholarships.length === 0 && (
                <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">No scholarships available</h3>
                    <p className="text-slate-500 mt-1">Check back later for new opportunities.</p>
                </div>
            )}
        </div>
    );
};

export default Scholarships;
