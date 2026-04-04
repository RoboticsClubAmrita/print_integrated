import React from 'react';
import AdminSidebar from './AdminSidebar';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex min-h-screen">
            <AdminSidebar />
            <div className="flex-1 ml-[72px]">
                {children}
            </div>
        </div>
    );
};

export default AdminLayout;
