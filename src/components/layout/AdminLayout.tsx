import React from 'react';
import AdminSidebar from './AdminSidebar';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex min-h-screen text-text">
            <AdminSidebar />
            <div className="flex-1 ml-[260px] relative z-[2]">
                {children}
            </div>
        </div>
    );
};

export default AdminLayout;
