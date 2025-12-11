import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import ScholarshipCard from '../components/ScholarshipCard';

const Scholarships = () => {
    const [scholarships, setScholarships] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('deadline');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const schRes = await api.get('/scholarships/');
                setScholarships(schRes.data);
                const appRes = await api.get('/applications/');
                setApplications(appRes.data);
            } catch (error) {
                console.error("Failed to fetch scholarships", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
        <div className="space-y-6 animate-fade-in-up">
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
                        />
                    );
                })}
            </div>

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
