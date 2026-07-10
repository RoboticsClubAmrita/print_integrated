import React, { useEffect, useState } from 'react';
import { AppIcon } from '@/components/brand/AppIcon';
import { ProfileModeSwitch } from '@/components/app/ProfileModeSwitch';
import AdminSidebar from './AdminSidebar';

const RAIL_EXPANDED = 248;
const RAIL_COLLAPSED = 76;

/**
 * The Press Room shell. Same anatomy as the storefront header — brand on the
 * left, the User/Admin capsule in the identical top-right container position —
 * so switching modes swaps the room, not the furniture. A fixed nav rail
 * hangs below the header; content clears both.
 */
const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [collapsed, setCollapsed] = useState(
        () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches,
    );

    // Auto-collapse the rail on narrow viewports; manual toggle still wins after.
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 1023px)');
        const onChange = (e: MediaQueryListEvent) => setCollapsed(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    const rail = collapsed ? RAIL_COLLAPSED : RAIL_EXPANDED;

    return (
        <div className="relative z-[2] min-h-screen text-text">
            {/* Header — mirrors the storefront header grid so the mode capsule
                lands in the pixel-identical spot in both modes. */}
            <header className="fixed top-0 inset-x-0 z-40 h-16 border-b border-white/8 bg-[#0b0b0d]/80 backdrop-blur-xl">
                <div className="mx-auto max-w-[1180px] px-4 sm:px-6 h-full flex items-center justify-between">
                    <span className="inline-flex items-center gap-2.5 select-none">
                        <AppIcon size={34} />
                        <span className="font-extrabold tracking-[-0.4px] text-[19px] leading-none text-white">
                            PrintEase
                        </span>
                        <span className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-2.5 py-1">
                            <span className="size-1.5 rounded-full bg-accent-secondary" />
                            <span className="text-[10.5px] font-bold tracking-[0.4px] text-white/70">
                                Press Room
                            </span>
                        </span>
                    </span>
                    <ProfileModeSwitch />
                </div>
            </header>

            <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

            <div
                className="relative pt-16 transition-[margin] duration-300 ease-out"
                style={{ marginLeft: rail }}
            >
                {children}
            </div>
        </div>
    );
};

export default AdminLayout;
