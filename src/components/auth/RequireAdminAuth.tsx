import React from 'react';
import { Navigate } from 'react-router-dom';

/** Blocks /admin/* from anyone but a logged-in ADMIN/SUPER_ADMIN. */
const RequireAdminAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;

    let role: string | undefined;
    try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        role = user?.role;
    } catch {
        role = undefined;
    }

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') return <Navigate to="/app" replace />;

    return <>{children}</>;
};

export default RequireAdminAuth;
