import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import DocumentUploader from '../components/DocumentUploader';
import MergedPDFButton from '../components/MergedPDFButton';
import Toast from '../components/Toast';

// All possible profile fields with labels
// All possible profile fields with labels and types
const ALL_PROFILE_FIELDS = [
    { key: 'enrollment_no', label: 'Enrollment Number', type: 'text' },
    { key: 'department', label: 'Department', type: 'select', options: [] }, // Options populated dynamically
    { key: 'branch', label: 'Branch', type: 'select', options: [] }, // Options populated dynamically
    { key: 'mobile_number', label: 'Mobile Number', type: 'text' },
    { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
    { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'] },
    { key: 'father_name', label: "Father's Name", type: 'text' },
    { key: 'mother_name', label: "Mother's Name", type: 'text' },
    { key: 'category', label: 'Category', type: 'select', options: ['General', 'OBC', 'SC', 'ST', 'Gen-EWS', 'Other'] },
    { key: 'minority_status', label: 'Minority Status', type: 'select', options: ['Yes', 'No'] },
    { key: 'disability', label: 'Disability', type: 'boolean' },
    { key: 'permanent_address', label: 'Permanent Address', type: 'textarea' },
    { key: 'state', label: 'State', type: 'text' },
    { key: 'district', label: 'District', type: 'text' },
    { key: 'pincode', label: 'Pincode', type: 'text' },
    { key: 'current_address', label: 'Current Address', type: 'textarea' },
    { key: 'annual_family_income', label: 'Annual Family Income', type: 'number' },
    { key: 'income_certificate_number', label: 'Income Certificate Number', type: 'text' },
    { key: 'issuing_authority', label: 'Issuing Authority', type: 'text' },
    { key: 'income_certificate_validity_date', label: 'Income Certificate Validity', type: 'date' },
    { key: 'account_holder_name', label: 'Account Holder Name', type: 'text' },
    { key: 'bank_name', label: 'Bank Name', type: 'text' },
    { key: 'account_number', label: 'Account Number', type: 'text' },
    { key: 'ifsc_code', label: 'IFSC Code', type: 'text' },
    { key: 'branch_name', label: 'Branch Name', type: 'text' },
    { key: 'current_year_or_semester', label: 'Current Year/Semester', type: 'text' },
    { key: 'previous_exam_percentage', label: 'Previous Exam %', type: 'number' },
    { key: 'backlogs', label: 'Backlogs', type: 'number' },
    { key: 'gap_year', label: 'Gap Year', type: 'boolean' },
    { key: 'father_occupation', label: "Father's Occupation", type: 'text' },
    { key: 'mother_occupation', label: "Mother's Occupation", type: 'text' },
    { key: 'guardian_annual_income', label: "Guardian's Annual Income", type: 'number' },
    { key: 'parents_govt_job', label: 'Parents Govt Job', type: 'boolean' },
    { key: 'parent_contact_number', label: 'Parent Contact Number', type: 'text' },
    { key: 'residential_status', label: 'Residential Status', type: 'select', options: ['Hosteler', 'Day Scholar'] },
];

// Helper function to extract actual name (remove enrollment if present)
const extractActualName = (fullName, enrollmentNo) => {
    if (!fullName) return '';
    if (!enrollmentNo) return fullName;
    // If name starts with enrollment, remove it
    const enrollmentUpper = enrollmentNo.toUpperCase().trim();
    const nameUpper = fullName.toUpperCase().trim();
    if (nameUpper.startsWith(enrollmentUpper)) {
        const actualName = fullName.substring(enrollmentNo.length).trim();
        return actualName || fullName; // Fallback to original if extraction fails
    }
    return fullName;
};

const Apply = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [scholarship, setScholarship] = useState(null);
    const [myDocs, setMyDocs] = useState([]);
    const [profile, setProfile] = useState(null);
    const [profileDraft, setProfileDraft] = useState(null);
    const [profileMissing, setProfileMissing] = useState([]);
    const [remarks, setRemarks] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [applicationId, setApplicationId] = useState(null);
    const [submissionMessage, setSubmissionMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [userInfo, setUserInfo] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [branches, setBranches] = useState([]);
    const [toast, setToast] = useState(null);

    const [docDecisions, setDocDecisions] = useState({}); // Track user decision for each doc: 'confirmed' or 'replacing'
    const [correctionMode, setCorrectionMode] = useState(location.state?.correctionMode || false);
    const [adminRemarks, setAdminRemarks] = useState(location.state?.adminRemarks || '');

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        // Auto-close handled by component, but we can clear state here if needed
    };

    // Get required profile fields from scholarship, or use defaults
    // Get required profile fields from scholarship
    const requiredProfileFields = useMemo(() => {
        if (!scholarship) return [];

        const requiredKeys = scholarship.required_profile_fields;
        console.log('🎓 Scholarship Config:', {
            id: scholarship.id,
            name: scholarship.name,
            requiredKeys: requiredKeys,
            type: typeof requiredKeys
        });

        if (Array.isArray(requiredKeys) && requiredKeys.length > 0) {
            // Filter ALL_PROFILE_FIELDS to only include the ones required by this scholarship
            // Also log any keys that were required but not found in our definitions
            const foundFields = ALL_PROFILE_FIELDS.filter(f => requiredKeys.includes(f.key));
            if (foundFields.length < requiredKeys.length) {
                console.warn('⚠️ Some required fields were not found in definitions:',
                    requiredKeys.filter(k => !ALL_PROFILE_FIELDS.find(f => f.key === k))
                );
            }
            return foundFields;
        }

        // No hardcoded fallback - strictly use backend configuration
        return [];
    }, [scholarship]);

    useEffect(() => {
        fetchData();
    }, [id]);

    // Fetch branches when department changes in profile or draft
    useEffect(() => {
        const deptName = profileDraft?.department || profile?.department;
        if (deptName && departments.length > 0) {
            const selectedDept = departments.find(d => d.name === deptName);
            if (selectedDept) {
                api.get(`/university/branches?department_id=${selectedDept.id}`)
                    .then(res => setBranches(res.data || []))
                    .catch(err => console.error(err));
            }
        } else {
            setBranches([]);
        }
    }, [profileDraft?.department, profile?.department, departments]);

    const [isEditing, setIsEditing] = useState(false);

    // Recompute missing fields when scholarship, profile, or profileDraft changes
    // Only update profileMissing when the SAVED profile changes, or scholarship requirements change.
    // We do NOT want to update this on every keystroke (profileDraft change) because it causes
    // the input fields to be removed/re-added to the DOM, causing focus loss.
    useEffect(() => {
        // If we have a saved profile, check what's missing from IT.
        // If no saved profile, we check against null (so everything required is missing).
        // We explicitly ignore profileDraft here to prevent UI thrashing.
        const dataToCheck = profile;

        if (requiredProfileFields.length > 0) {
            const missing = computeMissing(dataToCheck || {}, requiredProfileFields);
            setProfileMissing(missing);
        }
    }, [scholarship, profile, requiredProfileFields]);

    const computeMissing = (data, fields) => {
        if (!data || !fields) return fields || [];
        return fields.filter(({ key }) => {
            const value = data[key];
            return value === null || value === undefined || value === '';
        });
    };

    const handleEditClick = () => {
        // Pre-fill draft with current profile data so inputs aren't empty
        if (profile) {
            setProfileDraft({ ...profile });
        }
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setProfileDraft(profile ? { ...profile } : null); // Revert draft to saved profile state
    };

    const fetchData = async () => {
        if (!id) {
            setLoading(false);
            return;
        }

        setSubmissionMessage('');
        try {
            const profilePromise = api.get('/profile/me').catch((err) => {
                // Profile not found is OK - user can create one
                if (err.response?.status === 404 || err.response?.status === 500) {
                    return { data: null };
                }
                throw err;
            });

            const userInfoPromise = api.get('/auth/me').catch(() => ({ data: null }));

            const scholarshipId = parseInt(id);
            if (isNaN(scholarshipId)) {
                throw new Error("Invalid scholarship ID");
            }

            const [schRes, docsRes, profileRes, userRes, deptRes, appsRes] = await Promise.all([
                api.get(`/scholarships/${scholarshipId}`),
                api.get('/documents/'),
                profilePromise,
                userInfoPromise,
                api.get('/university/departments').catch(() => ({ data: [] })),
                api.get('/applications/').catch(() => ({ data: [] })),
            ]);

            setDepartments(deptRes.data || []);

            if (!schRes.data) {
                throw new Error("Scholarship not found");
            }

            setScholarship(schRes.data);
            setMyDocs(docsRes.data || []);
            setUserInfo(userRes.data);

            // Check for existing application
            const existingApp = appsRes.data?.find(app => app.scholarship_id === scholarshipId);
            if (existingApp) {
                setApplicationId(existingApp.id);

                if (existingApp.status === 'docs_required') {
                    // Enable Correction Mode
                    setCorrectionMode(true);
                    setAdminRemarks(existingApp.remarks || ''); // Actually remarks field on app is usually student's remarks? 
                    // Wait, looking at ApplicationStatus.jsx: application.remarks is used for Admin Remarks?
                    // Let's check backend model. remarks = Column(Text, nullable=True).
                    // Usually this is "Student Remarks". Admin remarks might be separate?
                    // Re-checking Application model: remarks is typically student remarks.
                    // But ApplicationStatus.jsx says: <strong>Remarks:</strong> {application.remarks} inside status box.
                    // If G-Office sets generic remarks, it ends up in same column unless there's a separate one.
                    // The backend `update_application_status` usually sets `remarks` if provided.
                    // If backend updates `remarks` with admin message, then we show it.
                    setAdminRemarks(existingApp.remarks);
                    showToast('Action Required: Please correct your application.', 'warning');
                } else if (existingApp.status !== 'rejected') {
                    // Redirect to status page if already applied (and not rejected/correction)
                    navigate(`/application-status/${existingApp.id}`);
                    return;
                }
            }

            if (profileRes.data) {
                setProfile(profileRes.data);
                setProfileDraft(profileRes.data);
            } else {
                setProfile(null);
                // Initialize profile draft with user info (name, enrollment) if available
                const initialDraft = {};
                if (userRes.data) {
                    if (userRes.data.enrollment_no) {
                        initialDraft.enrollment_no = userRes.data.enrollment_no;
                    }
                }
                setProfileDraft(initialDraft);
            }
        } catch (e) {
            console.error("Error fetching data:", e);
            const errorMsg = e.response?.data?.detail || e.message || "Failed to load data";
            showToast(errorMsg, "error");
            if (e.response?.status === 404 && e.response?.data?.detail?.includes("Scholarship")) {
                navigate('/scholarships');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUploadSuccess = () => {
        fetchData(); // Refresh to see new vault docs
    };

    const handleProfileChange = useCallback((key, value) => {
        console.log('🔄 Profile Change:', { key, value });
        setProfileDraft(prev => {
            const updated = { ...(prev || {}), [key]: value };
            console.log('✅ Updated Draft:', updated);
            return updated;
        });
    }, []);

    const createProfile = async () => {
        // Check missing fields against the DRAFT, because that's what we are about to save
        const currentMissing = computeMissing(profileDraft, requiredProfileFields);
        if (!profileDraft || currentMissing.length > 0) {
            showToast(`Please fill in all required fields. Missing: ${currentMissing.map(f => f.label).join(', ')}`, "error");
            return;
        }
        setSavingProfile(true);
        try {
            // Prepare profile data - include all fields from draft

            const profileData = {};

            // Copy all fields from draft, ensuring proper type conversion
            Object.keys(profileDraft).forEach(key => {
                const value = profileDraft[key];
                // Include all values, even empty strings (backend will handle defaults)
                if (value !== null && value !== undefined) {
                    // Convert string numbers to actual numbers
                    if (['annual_family_income', 'previous_exam_percentage', 'disability_percentage', 'guardian_annual_income', 'backlogs'].includes(key)) {
                        profileData[key] = value === '' ? null : (parseFloat(value) || null);
                    } else if (['minority_status', 'disability', 'gap_year', 'parents_govt_job'].includes(key)) {
                        // Boolean fields - handle Yes/No or direct boolean
                        profileData[key] = value === true || value === 'true' || value === 'True' || value === 'Yes' || value === 1;
                    } else {
                        // String fields - include even empty strings
                        profileData[key] = value === '' ? null : value;
                    }
                }
            });

            const res = await api.post('/profile/', profileData);
            setProfile(res.data);
            setProfileDraft(res.data);
            setProfileMissing([]);
            showToast('Profile created successfully!', 'success');
        } catch (e) {
            console.error('Profile creation error:', e);
            const errorMsg = e.response?.data?.detail || e.message || 'Failed to create profile';
            showToast(`Error: ${errorMsg}`, "error");
        } finally {
            setSavingProfile(false);
        }
    };

    const saveProfile = async () => {
        console.log('💾 Saving Profile...', { profileDraft, profileMissing });
        if (!profileDraft) {
            console.error('❌ No profile draft found');
            return;
        }
        // Check missing fields against the DRAFT
        const currentMissing = computeMissing(profileDraft, requiredProfileFields);

        if (currentMissing.length > 0) {
            console.warn('⚠️ Missing fields:', currentMissing.map(f => f.label));
            showToast(`Please fill in all required fields. Missing: ${currentMissing.map(f => f.label).join(', ')}`, "error");
            return;
        }
        setSavingProfile(true);
        try {
            console.log('📤 Sending profile data:', profileDraft);

            const profileData = {};
            // Copy all fields from draft, ensuring proper type conversion
            Object.keys(profileDraft).forEach(key => {
                const value = profileDraft[key];
                if (value !== null && value !== undefined) {
                    // Convert string numbers to actual numbers
                    if (['annual_family_income', 'previous_exam_percentage', 'disability_percentage', 'guardian_annual_income', 'backlogs'].includes(key)) {
                        profileData[key] = value === '' ? null : (parseFloat(value) || null);
                    } else if (['minority_status', 'disability', 'gap_year', 'parents_govt_job'].includes(key)) {
                        // Boolean fields - handle Yes/No or direct boolean
                        profileData[key] = value === true || value === 'true' || value === 'True' || value === 'Yes' || value === 1;
                    } else {
                        // String fields - include even empty strings
                        profileData[key] = value === '' ? null : value;
                    }
                }
            });

            const res = await api.put('/profile/me', profileData);
            console.log('✅ Profile saved successfully:', res.data);
            setProfile(res.data);
            setProfileDraft(res.data);
            setProfileMissing(computeMissing(res.data, requiredProfileFields));
            setIsEditing(false);
            showToast('Profile updated successfully!', 'success');
        } catch (e) {
            console.error('❌ Profile update error:', e);
            console.error('Error response:', e.response);
            const errorMsg = e.response?.data?.detail || e.message || 'Failed to update profile';
            showToast(`Error: ${errorMsg}`, "error");
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSubmit = async (isDraft = false) => {
        setLoading(true);
        try {
            if (correctionMode) {
                // UPDATE existing application
                const res = await api.put(`/applications/${applicationId}`, {
                    remarks: remarks || null
                });
                // setSubmissionMessage('Application corrected and resubmitted successfully.');
                navigate('/dashboard', {
                    state: {
                        message: 'Application corrected and resubmitted successfully.',
                        type: 'success'
                    }
                });
            } else {
                // CREATE new application
                const res = await api.post('/applications/apply', {
                    scholarship_id: scholarship.id,
                    remarks: remarks || null,
                    is_draft: isDraft
                });
                setApplicationId(res.data?.id);
                // setSubmissionMessage(isDraft ? 'Draft saved. You can continue later.' : 'Application submitted successfully.');
                navigate('/dashboard', {
                    state: {
                        message: isDraft ? 'Application draft saved successfully.' : 'Application submitted successfully!',
                        type: 'success'
                    }
                });
            }
            // setStep(3); // Removed step 3 as we redirect now
        } catch (e) {
            const errorMsg = e.response?.data?.detail || e.message || "Action failed";
            showToast(errorMsg, "error");
            console.error("Application submission error:", e);
        } finally {
            setLoading(false);
        }
    };

    if (!scholarship) return <div>Scholarship not found</div>;

    // Check requirements
    const requirements = scholarship.required_documents || [];
    const missingMandatory = requirements.filter(req => {
        if (!req.is_mandatory) return false;
        const hasDoc = myDocs.some(d => d.document_format_id === req.document_format_id);
        return !hasDoc;
    });

    const profileReady = profile && profileMissing.length === 0;
    const isStep2Valid = missingMandatory.length === 0;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12 px-4">
            {/* Header */}
            <div className="text-center space-y-2 pt-6">
                <h1 className="text-3xl font-bold text-slate-900 font-display">
                    {correctionMode ? 'Correct Your Application' : 'Apply for Scholarship'}
                </h1>
                <p className="text-slate-600">
                    {correctionMode ? 'Review the remarks below and update your application.' : 'Complete the steps below to submit your application.'}
                </p>
            </div>

            {/* Admin Remarks Banner */}
            {correctionMode && adminRemarks && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm animate-pulse-slow">
                    <div className="flex gap-4">
                        <div className="p-3 bg-amber-100 rounded-lg h-fit text-amber-700">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-amber-800 mb-1">Action Required</h3>
                            <p className="text-amber-700 font-medium mb-2">The scholarship office has requested changes to your application:</p>
                            <div className="bg-white/60 p-3 rounded-lg border border-amber-100 text-amber-900 text-sm font-medium">
                                {(() => {
                                    // Parse the remarks
                                    let actionText = "";
                                    let notesText = "";

                                    if (adminRemarks.includes("ACTION REQUIRED:")) {
                                        const parts = adminRemarks.split("NOTES:");
                                        actionText = parts[0].replace("ACTION REQUIRED:", "").trim();
                                        if (parts.length > 1) notesText = parts[1].trim();
                                    } else {
                                        notesText = adminRemarks;
                                    }

                                    const actionItems = actionText
                                        ? actionText.split('\n').map(l => l.trim()).filter(l => l.startsWith('-'))
                                        : [];

                                    return (
                                        <div className="space-y-4">
                                            {actionItems.length > 0 && (
                                                <div className="bg-white/80 p-4 rounded-lg border border-amber-100">
                                                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Fix Checklist</h4>
                                                    <ul className="space-y-2">
                                                        {actionItems.map((item, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-sm text-amber-900">
                                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></span>
                                                                <span>{item.substring(1).trim()}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {notesText && (
                                                <div className="bg-amber-100/50 p-3 rounded-lg text-sm text-amber-800 italic border-l-4 border-amber-400">
                                                    <span className="font-bold not-italic mr-1">Note:</span>
                                                    {notesText}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            <div className="relative mb-12 px-4">
                {/* Track background */}
                <div className="absolute top-6 left-0 w-full h-1.5 bg-slate-100 -translate-y-1/2 rounded-full z-0"></div>
                {/* Track fill */}
                <div
                    className="absolute top-6 left-0 h-1.5 bg-gradient-to-r from-primary-600 to-indigo-600 -translate-y-1/2 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(79,70,229,0.3)] z-0"
                    style={{ width: `${((step - 1) / 2) * 100}%` }}
                ></div>
                <div className="relative flex justify-between w-full">
                    {[
                        { num: 1, label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                        { num: 2, label: 'Documents', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                        { num: 3, label: 'Review', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
                    ].map((item, idx) => {
                        const isActive = step >= item.num;
                        const isCurrent = step === item.num;
                        return (
                            <div key={item.num} className="flex flex-col items-center gap-3 relative z-10 group cursor-default">
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 transform ${isActive
                                        ? 'bg-gradient-to-br from-primary-600 to-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)] scale-110'
                                        : 'bg-white text-slate-300 border-2 border-slate-100 shadow-sm'
                                        } ${isCurrent ? 'ring-4 ring-primary-100 ring-offset-2' : ''}`}
                                >
                                    {isActive ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
                                        </svg>
                                    ) : (
                                        <span className="font-bold text-lg font-display">{item.num}</span>
                                    )}
                                </div>
                                <span
                                    className={`text-sm font-bold tracking-wide transition-colors duration-300 ${isActive ? 'text-indigo-900' : 'text-slate-400'
                                        }`}
                                >
                                    {item.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step 1: Profile snapshot */}
            {step === 1 && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Profile icon"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Profile Details</h2>
                                <p className="text-slate-500 text-sm">We pre-fill your profile data. Fill any missing details to continue.</p>
                            </div>
                        </div>

                        {/* Display Name and Enrollment as Read-Only */}
                        {userInfo && (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-6">
                                <h3 className="text-sm font-semibold text-blue-900 mb-3">Account Information (From Login)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-blue-700 mb-1">Full Name</label>
                                        <div className="text-sm font-semibold text-blue-900">
                                            {extractActualName(userInfo.full_name, userInfo.enrollment_no) || 'N/A'}
                                        </div>
                                    </div>
                                    {userInfo.enrollment_no && (
                                        <div>
                                            <label className="block text-xs font-medium text-blue-700 mb-1">Enrollment Number</label>
                                            <div className="text-sm font-semibold text-blue-900">{userInfo.enrollment_no}</div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-medium text-blue-700 mb-1">Email</label>
                                        <div className="text-sm font-semibold text-blue-900">{userInfo.email || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!profile && (
                            <div className="space-y-6">
                                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-800">
                                    <p className="font-semibold mb-2">Profile not found</p>
                                    <p className="text-sm">Please fill in the required fields below to create your profile and continue with the application.</p>
                                </div>

                                {/* Profile Creation Form - Only Required Fields */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-800">Required Information</h3>
                                    <div className="space-y-4">
                                        {requiredProfileFields.map(({ key, label }) => {
                                            const inputValue = (profileDraft && profileDraft[key]) ? String(profileDraft[key]) : '';

                                            return (
                                                <div key={`create-${key}`} className="space-y-2">
                                                    <label
                                                        htmlFor={`create-field-${key}`}
                                                        className="block text-sm font-semibold"
                                                        style={{ color: '#334155' }}
                                                    >
                                                        {label} <span style={{ color: '#dc2626' }}>*</span>
                                                    </label>
                                                    {key === 'date_of_birth' || key === 'income_certificate_validity_date' ? (
                                                        <input
                                                            id={`create-field-${key}`}
                                                            type="date"
                                                            value={inputValue}
                                                            onChange={(e) => handleProfileChange(key, e.target.value)}
                                                            style={{
                                                                width: '100%',
                                                                padding: '10px 12px',
                                                                border: '2px solid #cbd5e1',
                                                                borderRadius: '8px',
                                                                fontSize: '14px',
                                                                color: '#0f172a',
                                                                backgroundColor: '#ffffff',
                                                                fontFamily: 'Inter, sans-serif'
                                                            }}
                                                        />
                                                    ) : key === 'gender' ? (
                                                        <select
                                                            id={`create-field-${key}`}
                                                            value={inputValue}
                                                            onChange={(e) => handleProfileChange(key, e.target.value)}
                                                            style={{
                                                                width: '100%',
                                                                padding: '10px 12px',
                                                                border: '2px solid #cbd5e1',
                                                                borderRadius: '8px',
                                                                fontSize: '14px',
                                                                color: '#0f172a',
                                                                backgroundColor: '#ffffff',
                                                                fontFamily: 'Inter, sans-serif'
                                                            }}
                                                        >
                                                            <option value="">Select Gender</option>
                                                            <option value="Male">Male</option>
                                                            <option value="Female">Female</option>
                                                        </select>
                                                    ) : key === 'category' ? (
                                                        <select
                                                            id={`create-field-${key}`}
                                                            value={inputValue}
                                                            onChange={(e) => handleProfileChange(key, e.target.value)}
                                                            className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all duration-300 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_1rem_center] bg-no-repeat pr-10"
                                                        >
                                                            <option value="">Select Category</option>
                                                            <option value="General">General</option>
                                                            <option value="OBC">OBC</option>
                                                            <option value="SC">SC</option>
                                                            <option value="ST">ST</option>
                                                            <option value="Gen-EWS">Gen-EWS</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    ) : key === 'department' ? (
                                                        <select
                                                            id={`create-field-${key}`}
                                                            value={inputValue}
                                                            onChange={(e) => handleProfileChange(key, e.target.value)}
                                                            className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all duration-300 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_1rem_center] bg-no-repeat pr-10"
                                                        >
                                                            <option value="">Select Department</option>
                                                            {departments.map(dept => (
                                                                <option key={dept.id} value={dept.name}>
                                                                    {dept.name} {dept.code ? `(${dept.code})` : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            id={`create-field-${key}`}
                                                            type={key.includes('income') || key.includes('percentage') || key === 'backlogs' ? 'number' : 'text'}
                                                            value={inputValue}
                                                            onChange={(e) => handleProfileChange(key, e.target.value)}
                                                            placeholder={`Enter ${label.toLowerCase()}`}
                                                            autoComplete="off"
                                                            className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all duration-300 placeholder:text-slate-400"
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <button
                                            onClick={createProfile}
                                            disabled={profileMissing.length > 0 || savingProfile}
                                            className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {savingProfile ? 'Saving...' : 'Save Profile & Continue'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {profile && (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-lg font-semibold text-slate-800">Required Profile Fields</h3>
                                        </div>
                                        <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                                            {requiredProfileFields.length - profileMissing.length}/{requiredProfileFields.length} Completed
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500">These fields were set as required by the scholarship admin.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {requiredProfileFields.map(({ key, label }) => {
                                        // Check draft first (reactive), then saved profile
                                        const valueToCheck = (profileDraft && profileDraft[key] !== undefined && profileDraft[key] !== null) ? profileDraft[key] : profile[key];
                                        const hasValue = valueToCheck && valueToCheck !== '' && valueToCheck !== null;

                                        return (
                                            <div
                                                key={key}
                                                className={`
                                                    group relative overflow-hidden p-5 rounded-xl border transition-all duration-300 ease-in-out
                                                    ${hasValue
                                                        ? 'bg-white border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-200'
                                                        : 'bg-white border-rose-100 shadow-sm hover:shadow-md hover:border-rose-200'
                                                    }
                                                `}
                                            >
                                                <div className={`absolute inset-0 opacity-[0.03] ${hasValue ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300 ${hasValue ? 'bg-emerald-500' : 'bg-rose-500'}`} />

                                                <div className="flex items-start justify-between gap-4 pl-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-1">{label}</p>
                                                        <p className={`text-base font-semibold truncate transition-colors duration-300 ${hasValue ? 'text-slate-800' : 'text-rose-600'}`}>
                                                            {hasValue ? String(valueToCheck) : 'Not Filled'}
                                                        </p>
                                                    </div>
                                                    <div className={`
                                                        flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300
                                                        ${hasValue ? 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200' : 'bg-rose-100 text-rose-600 group-hover:bg-rose-200'}
                                                    `}>
                                                        {hasValue ? (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 opacity-10">
                                        <svg className="w-24 h-24 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800">Review & Update Details</h3>
                                            <p className="text-slate-600 mt-1">
                                                Please review your details for this application and update if necessary.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 relative z-10">
                                        {requiredProfileFields.map(({ key, label }) => {
                                            const fieldConfig = ALL_PROFILE_FIELDS.find(f => f.key === key) || { type: 'text' };
                                            let { type, options } = fieldConfig;

                                            // Dynamic options for department
                                            if (key === 'department') {
                                                options = departments.map(d => d.name);
                                            }
                                            // Dynamic options for branch
                                            if (key === 'branch') {
                                                options = branches.map(b => b.name);
                                            }

                                            const inputValue = (profileDraft && profileDraft[key] !== undefined)
                                                ? String(profileDraft[key])
                                                : (profile && profile[key] !== undefined && profile[key] !== null)
                                                    ? String(profile[key])
                                                    : '';

                                            return (
                                                <div key={`input-${key}`}>
                                                    <label
                                                        htmlFor={`field-${key}`}
                                                        className="block mb-2 text-sm font-bold text-slate-700"
                                                    >
                                                        {label} <span className="text-rose-500">*</span>
                                                    </label>

                                                    {type === 'select' ? (
                                                        <div className="relative">
                                                            <select
                                                                id={`field-${key}`}
                                                                value={inputValue}
                                                                onChange={(e) => handleProfileChange(key, e.target.value)}
                                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium transition-all outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 appearance-none cursor-pointer"
                                                            >
                                                                <option value="">Select {label}</option>
                                                                {key === 'department' ? (
                                                                    departments.map(dept => (
                                                                        <option key={dept.id} value={dept.name}>
                                                                            {dept.name} {dept.code ? `(${dept.code})` : ''}
                                                                        </option>
                                                                    ))
                                                                ) : (
                                                                    options && options.map(opt => (
                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                    ))
                                                                )}
                                                            </select>
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                            </div>
                                                        </div>
                                                    ) : type === 'textarea' ? (
                                                        <textarea
                                                            id={`field-${key}`}
                                                            value={inputValue}
                                                            onChange={(e) => handleProfileChange(key, e.target.value)}
                                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium transition-all outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10"
                                                            rows={3}
                                                        />
                                                    ) : (
                                                        <input
                                                            id={`field-${key}`}
                                                            type={type === 'date' ? 'date' : (type === 'number' ? 'number' : 'text')}
                                                            value={inputValue}
                                                            onChange={(e) => handleProfileChange(key, e.target.value)}
                                                            placeholder={`Enter ${label.toLowerCase()}`}
                                                            autoComplete="off"
                                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium transition-all outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 placeholder:text-slate-400"
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="pt-6 flex justify-end gap-4">
                                        <button
                                            onClick={saveProfile}
                                            disabled={savingProfile}
                                            className={`
                                                    inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold shadow-lg transition-all transform active:scale-[0.98]
                                                    ${savingProfile
                                                    ? 'bg-slate-400 cursor-not-allowed shadow-none'
                                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30 hover:shadow-blue-600/40'
                                                }
                                                `}
                                        >
                                            {savingProfile ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    Save & Continue
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={() => setStep(2)}
                            disabled={!profileReady}
                            className="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
                        >
                            Next Step
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Documents */}
            {step === 2 && !submissionMessage && (
                <div className="space-y-6 animate-fade-in-up">
                    {/* Summary of missing documents */}
                    {missingMandatory.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <h3 className="font-semibold text-amber-800 mb-2">Documents you need to upload:</h3>
                            <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                                {missingMandatory.map(req => {
                                    const docFormat = req.document_format || {};
                                    return <li key={req.id}>{docFormat.name || `Document #${req.document_format_id}`}</li>;
                                })}
                            </ul>
                        </div>
                    )}

                    {missingMandatory.length === 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Success checkmark"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="font-semibold text-green-800">All required documents are uploaded!</span>
                        </div>
                    )}

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Documents icon"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Required Documents</h2>
                                <p className="text-slate-500 text-sm">Upload all mandatory documents to proceed.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {requirements.map(req => {
                                const docFormat = req.document_format || {};
                                const uploadedDoc = myDocs.find(d => d.document_format_id === req.document_format_id);
                                const decision = docDecisions[req.document_format_id];

                                return (
                                    <div key={req.id} className={`p-5 rounded-xl border transition-all ${uploadedDoc && decision === 'confirmed' ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-white hover:border-primary-200'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-800">{docFormat.name || 'Document'}</span>
                                                    {req.is_mandatory && <span className="text-[10px] uppercase tracking-wider bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Required</span>}
                                                </div>
                                                {docFormat.description && <p className="text-sm text-slate-500 mt-1">{docFormat.description}</p>}
                                                {req.instructions && (
                                                    <div className="mt-1.5 flex items-start gap-1.5 text-xs text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded-md border border-blue-100">
                                                        <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        <span>{req.instructions}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Status Badge */}
                                            {uploadedDoc && decision === 'confirmed' ? (
                                                <span className="flex items-center gap-1.5 text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-bold border border-green-200">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    Ready
                                                </span>
                                            ) : !uploadedDoc ? (
                                                <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full font-medium border border-slate-200">Missing</span>
                                            ) : null}
                                        </div>

                                        {/* Logic for Existing Document */}
                                        {uploadedDoc ? (
                                            <div className="mt-3">
                                                {!decision ? (
                                                    // State 0: Ask User
                                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                                        <div className="flex items-start gap-3">
                                                            <div className="p-2 bg-amber-100 rounded text-amber-600">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-semibold text-slate-800 text-sm">Document found in Vault</p>
                                                                <p className="text-xs text-slate-600 mt-1">
                                                                    Exists as <span className="font-medium underline">{uploadedDoc.file_path.split('/').pop()}</span><br />
                                                                    Uploaded: {new Date(uploadedDoc.uploaded_at).toLocaleDateString()}
                                                                </p>
                                                                <div className="flex gap-3 mt-3">
                                                                    <button
                                                                        onClick={() => setDocDecisions(prev => ({ ...prev, [req.document_format_id]: 'confirmed' }))}
                                                                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded shadow-sm transition-colors"
                                                                    >
                                                                        Use from Vault
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDocDecisions(prev => ({ ...prev, [req.document_format_id]: 'replacing' }))}
                                                                        className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded transition-colors"
                                                                    >
                                                                        Upload New
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : decision === 'confirmed' ? (
                                                    // State 1: Confirmed (Green)
                                                    <div className="text-xs text-slate-500 pl-1 flex flex-col gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <span>Using <strong>{uploadedDoc.file_path.split('/').pop()}</strong> from vault.</span>
                                                            <button
                                                                onClick={() => setDocDecisions(prev => ({ ...prev, [req.document_format_id]: undefined }))}
                                                                className="text-primary-600 hover:underline ml-2"
                                                            >
                                                                Change
                                                            </button>
                                                        </div>
                                                        {uploadedDoc.is_verified === false && uploadedDoc.remarks && (
                                                            <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 flex items-start gap-2">
                                                                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                <div>
                                                                    <span className="font-bold block mb-0.5">Integration Rejected:</span>
                                                                    {uploadedDoc.remarks}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    // State 2: Replacing (Show Uploader)
                                                    <div className="mt-4 pt-4 border-t border-slate-100 relative">
                                                        <button
                                                            onClick={() => setDocDecisions(prev => ({ ...prev, [req.document_format_id]: undefined }))}
                                                            className="absolute top-4 right-0 text-xs text-rose-500 hover:underline font-medium z-10"
                                                        >
                                                            Cancel Replace
                                                        </button>
                                                        <DocumentUploader
                                                            documentType={docFormat.name || 'Document'}
                                                            documentFormatId={req.document_format_id}
                                                            validTypes={req.allowed_types || ['pdf']}
                                                            maxPages={req.max_pages}
                                                            onUploadSuccess={() => {
                                                                handleUploadSuccess();
                                                                // After upload, auto-confirm the new doc
                                                                setDocDecisions(prev => ({ ...prev, [req.document_format_id]: 'confirmed' }));
                                                                showToast('Document updated successfully', 'success');
                                                            }}
                                                            showToast={showToast}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            // No Document Exists - Show Uploader
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <DocumentUploader
                                                    documentType={docFormat.name || 'Document'}
                                                    documentFormatId={req.document_format_id}
                                                    validTypes={req.allowed_types || ['pdf']}
                                                    maxPages={req.max_pages}
                                                    onUploadSuccess={() => {
                                                        handleUploadSuccess();
                                                        // After upload, auto-confirm
                                                        setDocDecisions(prev => ({ ...prev, [req.document_format_id]: 'confirmed' }));
                                                    }}
                                                    showToast={showToast}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-semibold text-slate-800 mb-3">Your Uploaded Documents</h3>
                        {myDocs.length === 0 && <p className="text-sm text-slate-500">No documents uploaded yet.</p>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {myDocs.map(doc => (
                                <a
                                    key={doc.id}
                                    href={doc.file_path}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-4 rounded-xl border border-slate-200 hover:border-primary-200 hover:bg-primary-50/40 transition flex items-center justify-between"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{doc.document_type}</p>
                                        <p className="text-xs text-slate-500">Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                    </div>
                                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l6-6 4 4 6-6" /></svg>
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={() => setStep(1)}
                            className="bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            disabled={!isStep2Valid}
                            className="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
                        >
                            Next Step
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Review & Submit */}
            {step === 3 && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Final Review</h2>
                                <p className="text-slate-500 text-sm">Review your application details before submitting.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h3 className="font-semibold text-slate-800 mb-2">Scholarship Details</h3>
                                <p className="text-sm text-slate-600"><span className="font-medium">Name:</span> {scholarship.name}</p>
                                {scholarship.amount && <p className="text-sm text-slate-600"><span className="font-medium">Amount:</span> ₹{scholarship.amount}</p>}
                            </div>

                            {profile && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <h3 className="font-semibold text-slate-800 mb-2">Profile Snapshot</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-700">
                                        <span><strong>Name:</strong> {extractActualName(profile.full_name || userInfo?.full_name, profile.enrollment_no || userInfo?.enrollment_no) || 'N/A'}</span>
                                        <span><strong>Enrollment:</strong> {profile.enrollment_no || userInfo?.enrollment_no || 'N/A'}</span>
                                        <span><strong>Department:</strong> {profile.department || 'N/A'}</span>
                                        <span><strong>Contact:</strong> {profile.mobile_number || 'N/A'}</span>
                                        <span><strong>Category:</strong> {profile.category || 'N/A'}</span>
                                        <span><strong>Bank:</strong> {profile.bank_name ? `${profile.bank_name} (${profile.ifsc_code || 'N/A'})` : 'N/A'}</span>
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h3 className="font-semibold text-slate-800 mb-2">Uploaded Documents</h3>
                                {myDocs.length === 0 && <p className="text-sm text-slate-500">No documents uploaded.</p>}
                                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                    {myDocs.map(doc => (
                                        <li key={doc.id}>{doc.document_type}</li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Additional Remarks (Optional)</label>
                                <textarea
                                    className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none relative z-10"
                                    rows="4"
                                    placeholder="Any additional information you'd like to provide..."
                                    value={remarks}
                                    onChange={e => setRemarks(e.target.value)}
                                />
                            </div>

                            {submissionMessage && (
                                <div className="p-4 rounded-xl border border-green-200 bg-green-50 text-green-800 font-semibold flex items-center justify-between">
                                    <span>{submissionMessage}</span>
                                    {applicationId && <MergedPDFButton applicationId={applicationId} />}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep(2)}
                            className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => handleSubmit(true)}
                            className="flex-1 bg-white border-2 border-primary-100 text-primary-700 py-3 rounded-xl font-bold hover:bg-primary-50 transition-colors"
                        >
                            Save Draft
                        </button>
                        <button
                            onClick={() => handleSubmit(false)}
                            className="flex-[2] bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/20"
                        >
                            {correctionMode ? 'Correct Your Application' : 'Submit Application'}
                        </button>
                    </div>
                </div>
            )}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default Apply;
