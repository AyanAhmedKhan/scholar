import React, { useState, useEffect, useCallback, memo } from 'react';
import api from '../services/api';

// Helper function to normalize form data (convert null to empty string for string fields)
const normalizeFormData = (data) => {
    if (!data) return {};
    const normalized = {};
    for (const [key, value] of Object.entries(data)) {
        if (value === null) {
            // Convert null to empty string for string fields, false for booleans, 0 for numbers
            if (['minority_status', 'disability', 'gap_year', 'parents_govt_job'].includes(key)) {
                normalized[key] = false;
            } else if (['annual_family_income', 'previous_exam_percentage', 'disability_percentage', 'guardian_annual_income', 'backlogs'].includes(key)) {
                normalized[key] = 0;
            } else {
                normalized[key] = '';
            }
        } else {
            normalized[key] = value;
        }
    }
    return normalized;
};

// Extracted Components styled with Tailwind
const SectionHeader = ({ title, icon }) => (
    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-200">
        <div className="p-2 bg-sky-50 rounded-lg text-sky-700 flex items-center justify-center">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
    </div>
);

const InputGroup = ({ label, name, value, onChange, readOnly, type = "text", required = false, ...props }) => {
    const currentValue = String(value ?? '');

    const baseClasses = "w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none disabled:bg-slate-100 disabled:text-slate-500";

    return (
        <div className="space-y-1.5">
            <label htmlFor={name} className="block text-sm font-semibold text-slate-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {type === 'textarea' ? (
                <textarea
                    id={name}
                    name={name}
                    className={`${baseClasses} form-input resize-y min-h-[120px]`}
                    value={currentValue}
                    onChange={onChange}
                    disabled={readOnly}
                    required={required}
                    {...props}
                />
            ) : (
                <input
                    id={name}
                    type={type}
                    name={name}
                    className={`${baseClasses} form-input`}
                    value={currentValue}
                    onChange={onChange}
                    disabled={readOnly}
                    required={required}
                    autoComplete="off"
                    {...props}
                />
            )}
        </div>
    );
};

const SelectGroup = ({ label, name, value, onChange, readOnly, options, required = false, ...props }) => (
    <div className="space-y-1.5">
        <label htmlFor={name} className="block text-sm font-semibold text-slate-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            <select
                id={name}
                name={name}
                className="form-input w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none disabled:bg-slate-100 disabled:text-slate-500 appearance-none pr-9"
                value={String(value ?? '')}
                onChange={onChange}
                disabled={readOnly}
                required={required}
                {...props}
            >
                {options}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    </div>
);

const ProfileForm = ({ initialData, onSubmit, readOnly = false }) => {
    const defaultData = {
        enrollment_no: '', department: '', mobile_number: '',
        date_of_birth: '', gender: 'Male', father_name: '', mother_name: '',
        category: 'General', minority_status: false, disability: false,
        permanent_address: '', state: '', district: '', pincode: '', current_address: '',
        annual_family_income: 0, income_certificate_number: '', issuing_authority: '',
        income_certificate_validity_date: '', account_holder_name: '', bank_name: '',
        account_number: '', ifsc_code: '', branch_name: '',
        current_year_or_semester: '', previous_exam_percentage: 0, backlogs: 0,
        gap_year: false, father_occupation: '', mother_occupation: '',
        parent_contact_number: '', residential_status: 'Day Scholar',
        parents_govt_job: false, guardian_annual_income: ''
    };

    const [formData, setFormData] = useState(() => {
        if (initialData) {
            const normalized = normalizeFormData(initialData);
            return { ...defaultData, ...normalized };
        }
        return defaultData;
    });
    const [departments, setDepartments] = useState([]);
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const deptRes = await api.get('/university/departments');
                setDepartments(deptRes.data);
                const sessRes = await api.get('/university/sessions');
                setSessions(sessRes.data);
            } catch (e) {
                console.error("Failed to fetch master data", e);
            }
        };
        fetchMasterData();
    }, []);

    const handleChange = useCallback((e) => {
        if (readOnly) return;
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));
    }, [readOnly]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!readOnly) onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            {/* Personal Details */}
            <div style={{
                backgroundColor: '#ffffff',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '32px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}>
                <SectionHeader
                    title="Personal Details"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                />
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '24px'
                }}>
                    <InputGroup label="Enrollment No" name="enrollment_no" value={formData.enrollment_no} onChange={handleChange} readOnly={readOnly} required />
                    <SelectGroup
                        label="Department"
                        name="department"
                        value={formData.department} onChange={handleChange} readOnly={readOnly}
                        required
                        options={
                            <>
                                <option value="">Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                                ))}
                            </>
                        }
                    />
                    <InputGroup label="Mobile Number" name="mobile_number" value={formData.mobile_number} onChange={handleChange} readOnly={readOnly} required />
                    <InputGroup label="Date of Birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} readOnly={readOnly} required />
                    <SelectGroup
                        label="Gender"
                        name="gender"
                        value={formData.gender} onChange={handleChange} readOnly={readOnly}
                        options={
                            <>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </>
                        }
                    />
                    <InputGroup label="Father's Name" name="father_name" value={formData.father_name} onChange={handleChange} readOnly={readOnly} required />
                    <InputGroup label="Mother's Name" name="mother_name" value={formData.mother_name} onChange={handleChange} readOnly={readOnly} required />
                </div>
            </div>
            {/* Category & Status */}
            <div style={{
                backgroundColor: '#ffffff',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '32px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}>
                <SectionHeader
                    title="Category & Status"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
                />
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '24px'
                }}>
                    <SelectGroup
                        label="Category"
                        name="category"
                        value={formData.category} onChange={handleChange} readOnly={readOnly}
                        options={
                            <>
                                <option value="General">General</option>
                                <option value="OBC">OBC</option>
                                <option value="SC">SC</option>
                                <option value="ST">ST</option>
                            </>
                        }
                    />
                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0px' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            userSelect: 'none'
                        }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    name="minority_status"
                                    checked={formData.minority_status}
                                    onChange={handleChange}
                                    disabled={readOnly}
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        cursor: 'pointer',
                                        accentColor: '#0369a1'
                                    }}
                                />
                            </div>
                            <span style={{ color: '#334155', fontWeight: '500' }}>Minority Status</span>
                        </label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0px' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            userSelect: 'none'
                        }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    name="disability"
                                    checked={formData.disability}
                                    onChange={handleChange}
                                    disabled={readOnly}
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        cursor: 'pointer',
                                        accentColor: '#0369a1'
                                    }}
                                />
                            </div>
                            <span style={{ color: '#334155', fontWeight: '500' }}>Person with Disability</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Address */}
            <div style={{
                backgroundColor: '#ffffff',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '32px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}>
                <SectionHeader
                    title="Address Details"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <InputGroup label="Permanent Address" name="permanent_address" type="textarea" rows="3" value={formData.permanent_address} onChange={handleChange} readOnly={readOnly} />
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '24px'
                    }}>
                        <InputGroup label="State" name="state" value={formData.state} onChange={handleChange} readOnly={readOnly} />
                        <InputGroup label="District" name="district" value={formData.district} onChange={handleChange} readOnly={readOnly} />
                        <InputGroup label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} readOnly={readOnly} />
                    </div>
                    <InputGroup label="Current Address (if different)" name="current_address" type="textarea" rows="3" value={formData.current_address} onChange={handleChange} readOnly={readOnly} />
                </div>
            </div>

            {/* Bank Details */}
            <div style={{
                backgroundColor: '#ffffff',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '32px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}>
                <SectionHeader
                    title="Bank Details"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>}
                />
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '24px'
                }}>
                    <InputGroup label="Account Holder Name" name="account_holder_name" value={formData.account_holder_name} onChange={handleChange} readOnly={readOnly} />
                    <InputGroup label="Bank Name" name="bank_name" value={formData.bank_name} onChange={handleChange} readOnly={readOnly} />
                    <InputGroup label="Account Number" name="account_number" value={formData.account_number} onChange={handleChange} readOnly={readOnly} />
                    <InputGroup label="IFSC Code" name="ifsc_code" value={formData.ifsc_code} onChange={handleChange} readOnly={readOnly} />
                    <InputGroup label="Branch Name" name="branch_name" value={formData.branch_name} onChange={handleChange} readOnly={readOnly} />
                </div>
            </div>

            {/* Parent/Guardian Details */}
            <div style={{
                backgroundColor: '#ffffff',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '32px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}>
                <SectionHeader
                    title="Parent/Guardian Details"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                />
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '24px'
                }}>
                    <InputGroup label="Father's Occupation" name="father_occupation" value={formData.father_occupation} onChange={handleChange} readOnly={readOnly} />
                    <InputGroup label="Mother's Occupation" name="mother_occupation" value={formData.mother_occupation} onChange={handleChange} readOnly={readOnly} />
                    <InputGroup label="Guardian's Annual Income" name="guardian_annual_income" type="number" value={formData.guardian_annual_income} onChange={handleChange} readOnly={readOnly} />
                    <InputGroup label="Parent Contact Number" name="parent_contact_number" value={formData.parent_contact_number} onChange={handleChange} readOnly={readOnly} />

                    <div style={{ gridColumn: '1 / -1', paddingTop: '8px' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            userSelect: 'none'
                        }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    name="parents_govt_job"
                                    checked={formData.parents_govt_job || false}
                                    onChange={handleChange}
                                    disabled={readOnly}
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        cursor: 'pointer',
                                        accentColor: '#0369a1'
                                    }}
                                />
                            </div>
                            <span style={{ color: '#334155', fontWeight: '500' }}>Parents have Government Job?</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Income Details */}
            <div style={{
                backgroundColor: '#ffffff',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '32px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}>
                <SectionHeader
                    title="Income Details"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '24px'
                }}>
                    <InputGroup label="Annual Family Income" name="annual_family_income" type="number" value={formData.annual_family_income} onChange={handleChange} readOnly={readOnly} required />
                    <InputGroup label="Income Cert. No" name="income_certificate_number" value={formData.income_certificate_number} onChange={handleChange} readOnly={readOnly} required />
                    <InputGroup label="Issuing Authority" name="issuing_authority" value={formData.issuing_authority} onChange={handleChange} readOnly={readOnly} required />
                    <InputGroup label="Validity Date" name="income_certificate_validity_date" type="date" value={formData.income_certificate_validity_date} onChange={handleChange} readOnly={readOnly} required />
                </div>
            </div>

            {/* Academic Details */}
            <div style={{
                backgroundColor: '#ffffff',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '32px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}>
                <SectionHeader
                    title="Academic Details"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>}
                />
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '24px'
                }}>
                    <SelectGroup
                        label="Current Year/Semester"
                        name="current_year_or_semester"
                        value={formData.current_year_or_semester} onChange={handleChange} readOnly={readOnly}
                        required
                        options={
                            <>
                                <option value="">Select Session/Year</option>
                                {sessions.map(sess => (
                                    <option key={sess.id} value={sess.name}>{sess.name}</option>
                                ))}
                            </>
                        }
                    />
                    <InputGroup label="Prev Exam %" name="previous_exam_percentage" type="number" value={formData.previous_exam_percentage} onChange={handleChange} readOnly={readOnly} required />
                    <InputGroup label="Backlogs" name="backlogs" type="number" value={formData.backlogs} onChange={handleChange} readOnly={readOnly} />
                    <SelectGroup
                        label="Residential Status"
                        name="residential_status"
                        value={formData.residential_status} onChange={handleChange} readOnly={readOnly}
                        options={
                            <>
                                <option value="Day Scholar">Day Scholar</option>
                                <option value="Hosteler">Hosteler</option>
                            </>
                        }
                    />
                </div>
            </div>

            {!readOnly && (
                <div style={{
                    paddingTop: '24px',
                    position: 'sticky',
                    bottom: '24px',
                    zIndex: '10'
                }}>
                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            backgroundColor: '#0369a1',
                            color: '#ffffff',
                            fontWeight: '700',
                            padding: '16px',
                            borderRadius: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '16px',
                            transition: 'background-color 0.3s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#0284c7'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#0369a1'}
                    >
                        Save Profile
                    </button>
                </div>
            )}
        </form>
    );
};

export default memo(ProfileForm);
