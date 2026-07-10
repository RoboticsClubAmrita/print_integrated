import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { ProfileModeSwitch } from '@/components/app/ProfileModeSwitch';

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

            {/* The exact same User/Admin slider as the PrintEase header — pinned in an
                identical top bar (64px tall, same max-w-[1180px] centered container +
                padding) so it lands in the pixel-identical spot in both modes and is the
                single toggle control. The bar itself is click-through; only the slider
                captures clicks. */}
            <div className="fixed top-0 inset-x-0 z-[60] h-16 pointer-events-none">
                <div className="mx-auto max-w-[1180px] px-4 sm:px-6 h-full flex items-center justify-end">
                    <div className="pointer-events-auto">
                        <ProfileModeSwitch />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
