import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="admin-surface flex min-h-screen text-text">
            <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
            <div
                className={`flex-1 relative z-[2] transition-all duration-300 ${
                    collapsed ? 'ml-[84px]' : 'ml-[260px]'
                }`}
            >
                {children}
            </div>
        </div>
    );
};

export default AdminLayout;
