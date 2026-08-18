import React from 'react';
import { Navigate } from 'react-router-dom';
import { getStoredUser, getToken } from '../../services/tokenStore';

/**
 * Blocks /admin/* from anyone but a logged-in ADMIN/SUPER_ADMIN.
 *
 * The session is read through tokenStore, not straight out of localStorage:
 * "Remember me" unticked puts the whole session in sessionStorage instead, and
 * reading localStorage directly found nothing there. An admin who signed in
 * without ticking the box was bounced back to /login every time they used the
 * workspace toggle — the session was perfectly valid, just being looked for in
 * the wrong place.
 */
const RequireAdminAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const token = getToken();
    if (!token) return <Navigate to="/login" replace />;

    let role: string | undefined;
    try {
        const user = JSON.parse(getStoredUser() || 'null');
        role = user?.role;
    } catch {
        role = undefined;
    }

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') return <Navigate to="/app" replace />;

    return <>{children}</>;
};

export default RequireAdminAuth;
