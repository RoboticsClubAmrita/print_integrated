import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ClipboardList,
    Users,
    Printer,
    Timer,
    IndianRupee,
    LogOut,
    Loader2,
    PanelLeftClose,
    PanelLeftOpen,
} from 'lucide-react';
import { clsx } from 'clsx';
import { authService } from '../../services/api';

/**
 * The nav dock — a floating glass island organized the way the shop
 * actually works: run the floor (Operate), keep the ledgers straight
 * (Manage), tune the machine (Configure). The active station carries
 * the amber "operating" LED, the same status language the brand uses
 * everywhere else. Paths are unchanged; only the room got rebuilt.
 */
const GROUPS: {
    label: string;
    items: { path: string; label: string; icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string; className?: string }> }[];
}[] = [
    {
        label: 'OPERATE',
        items: [
            { path: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
            { path: '/admin/orders', label: 'Orders', icon: ClipboardList },
        ],
    },
    {
        label: 'MANAGE',
        items: [
            { path: '/admin/users', label: 'Users', icon: Users },
            { path: '/admin/locations', label: 'Hardware', icon: Printer },
            { path: '/admin/penalties', label: 'Penalties', icon: Timer },
        ],
    },
    {
        label: 'CONFIGURE',
        items: [{ path: '/admin/pricing', label: 'Pricing & Rules', icon: IndianRupee }],
    },
];

interface AdminSidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed, onToggle }) => {
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await authService.logout();
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoggingOut(false);
            navigate('/login');
        }
    };

    return (
        <aside
            className={clsx(
                'dock sticky top-[88px] z-10 flex shrink-0 flex-col p-2.5 transition-[width] duration-300 ease-out',
                collapsed ? 'w-[62px]' : 'w-[216px]',
            )}
            style={{ maxHeight: 'calc(100vh - 108px)' }}
        >
            <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                {GROUPS.map((group, gi) => (
                    <div key={group.label}>
                        {collapsed ? (
                            gi > 0 && <div className="mx-2 my-2.5 h-px bg-white/8" />
                        ) : (
                            <p className={clsx('dock-label px-3 pb-1.5', gi === 0 ? 'pt-1.5' : 'pt-4')}>
                                {group.label}
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {group.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    title={item.label}
                                    className={({ isActive }) =>
                                        clsx('station', collapsed && 'justify-center px-0', isActive && 'on')
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <item.icon size={17} strokeWidth={2} className="shrink-0" />
                                            {!collapsed && (
                                                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                                            )}
                                            {!collapsed && isActive && <span className="led led--amber" />}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="mt-2 space-y-0.5 border-t border-white/8 pt-2">
                <button
                    type="button"
                    onClick={onToggle}
                    title={collapsed ? 'Expand menu' : 'Collapse menu'}
                    className={clsx('station w-full', collapsed && 'justify-center px-0')}
                >
                    {collapsed ? (
                        <PanelLeftOpen size={17} strokeWidth={2} className="shrink-0" />
                    ) : (
                        <PanelLeftClose size={17} strokeWidth={2} className="shrink-0" />
                    )}
                    {!collapsed && <span className="min-w-0 flex-1 truncate text-left">Collapse</span>}
                </button>
                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    title="Log out"
                    className={clsx(
                        'station w-full !text-[#ff8d85] hover:!bg-[#ff453a]/10 disabled:opacity-50',
                        collapsed && 'justify-center px-0',
                    )}
                >
                    {isLoggingOut ? (
                        <Loader2 size={17} className="shrink-0 animate-spin" />
                    ) : (
                        <LogOut size={17} strokeWidth={2} className="shrink-0" />
                    )}
                    {!collapsed && <span className="min-w-0 flex-1 truncate text-left">Log out</span>}
                </button>
                {!collapsed && <p className="dock-label px-3 pb-1 pt-2.5 text-center">PRESS ROOM</p>}
            </div>
        </aside>
    );
};

export default AdminSidebar;
