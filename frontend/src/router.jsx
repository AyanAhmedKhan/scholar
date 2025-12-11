import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import DocumentVault from './pages/DocumentVault';
import Scholarships from './pages/Scholarships';
import ScholarshipDetails from './pages/ScholarshipDetails';
import Apply from './pages/Apply';
import Renewal from './pages/Renewal';
import ApplicationStatus from './pages/ApplicationStatus';
import Helpdesk from './pages/Helpdesk';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import GeneralOfficeDashboard from './pages/GeneralOfficeDashboard';
import DeptHeadDashboard from './pages/DeptHeadDashboard';
import ScholarshipManagement from './pages/ScholarshipManagement';
import VaultManagement from './pages/VaultManagement';
import LandingPage from './pages/LandingPage';

import Layout from './components/Layout';

const router = createBrowserRouter([
    { path: "/", element: <LandingPage /> },
    { path: "/login", element: <Login /> },
    {
        element: <Layout />,
        children: [
            {
                element: <ProtectedRoute />,
                children: [
                    { path: "/dashboard", element: <Dashboard /> },
                    { path: "/onboarding", element: <Onboarding /> },
                    { path: "/vault", element: <DocumentVault /> },
                    { path: "/scholarships", element: <Scholarships /> },
                    { path: "/scholarships/:id", element: <ScholarshipDetails /> },
                    { path: "/apply/:id", element: <Apply /> },
                    { path: "/renewal", element: <Renewal /> },
                    { path: "/applications/:id", element: <ApplicationStatus /> },
                    { path: "/helpdesk", element: <Helpdesk /> },
                    { path: "/dept-dashboard", element: <DeptHeadDashboard /> },
                    { path: "/admin-dashboard", element: <SuperAdminDashboard /> },
                    { path: "/goffice-dashboard", element: <GeneralOfficeDashboard /> },
                    { path: "/scholarship-management", element: <ScholarshipManagement /> },
                    { path: "/vault-management", element: <VaultManagement /> },
                ]
            },
        ]
    },
    { path: "*", element: <Navigate to="/" replace /> }
], {
    future: {
        v7_startTransition: true,
    },
});

export default router;
