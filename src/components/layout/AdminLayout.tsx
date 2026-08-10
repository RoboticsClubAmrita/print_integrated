import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppIcon } from '@/components/brand/AppIcon';
import { ProfileModeSwitch } from '@/components/app/ProfileModeSwitch';
import AdminSidebar from './AdminSidebar';

/**
 * The Press Room shell. One full-bleed frame carries everything: the glass
 * header (whose grid mirrors the storefront header exactly, so the mode
 * capsule lands in the pixel-identical top-right spot in both modes),
 * the floating nav dock, and the work surface beside it.
 *
 * The frame runs the full viewport width rather than a reading-width column:
 * the registers here are wide operational tables, and every pixel the frame
 * gives back is a column the operator does not have to scroll sideways for.
 *
 * The dock is a sticky glass island inside the same frame — never a
 * full-height wall — so the room's backdrop stays visible around the
 * furniture and the whole workspace reads as one aligned object.
 */
const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        const saved = window.localStorage.getItem('press.dock');
        if (saved === 'min') return true;
        if (saved === 'max') return false;
        return window.matchMedia('(max-width: 1023px)').matches;
    });

    // Narrow viewports always fold the dock; a manual choice is remembered.
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 1023px)');
        const onChange = (e: MediaQueryListEvent) => setCollapsed(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    const toggle = () =>
        setCollapsed((c) => {
            window.localStorage.setItem('press.dock', c ? 'max' : 'min');
            return !c;
        });

    return (
        <div className="relative z-[1] min-h-screen text-text">
            {/* Header — the same grid as the storefront header, in glass. */}
            <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-white/8 bg-[#0d0d11]/70 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.06)] backdrop-blur-2xl">
                <div className="flex h-full w-full items-center justify-between px-4 sm:px-6 lg:px-8">
                    <span className="inline-flex select-none items-center gap-2.5">
                        <AppIcon size={34} />
                        <span className="text-[19px] font-extrabold leading-none tracking-[-0.4px] text-white">
                            PrintEase
                        </span>
                        <span className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-accent-secondary/25 bg-accent-secondary/8 px-2.5 py-1">
                            <span className="led led--amber" />
                            <span className="text-[10.5px] font-bold tracking-[0.4px] text-accent-secondary/90">
                                Press Room
                            </span>
                        </span>
                    </span>
                    <ProfileModeSwitch />
                </div>
            </header>

            {/* Workspace — dock + work surface in the header's frame. */}
            <div className="flex w-full items-start gap-5 px-4 pt-[88px] pb-16 sm:px-6 lg:gap-7 lg:px-8">
                <AdminSidebar collapsed={collapsed} onToggle={toggle} />
                <main key={location.pathname} className="page-enter min-w-0 flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
