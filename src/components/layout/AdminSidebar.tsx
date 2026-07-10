import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    MapPin,
    ShoppingCart,
    Users,
    IndianRupee,
    LogOut,
    Loader2,
    ShieldOff,
    PanelLeftClose,
    PanelLeftOpen,
} from 'lucide-react';
import { clsx } from 'clsx';
import { authService } from '../../services/api';

const NAV_ITEMS = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/locations', label: 'Hardware', icon: MapPin },
    { path: '/admin/pricing', label: 'Pricing', icon: IndianRupee },
    { path: '/admin/penalties', label: 'Penalties', icon: ShieldOff },
];

interface AdminSidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

/**
 * Press Room nav rail: a quiet ink dock under the header. Active station is
 * marked with a lifted row + the amber "operating" dot — the same status-dot
 * language the brand uses everywhere else.
 */
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
                'fixed left-0 top-16 bottom-0 z-30 flex flex-col border-r border-white/8 bg-black/25 py-4 transition-[width] duration-300 ease-out',
                collapsed ? 'w-[76px] px-3' : 'w-[248px] px-4',
            )}
        >
            <nav className="flex-1 space-y-1">
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        title={item.label}
                        className={({ isActive }) =>
                            clsx(
                                'group flex items-center rounded-[14px] text-[14px] font-semibold transition-colors duration-200',
                                collapsed ? 'justify-center size-11 mx-auto' : 'gap-3 h-11 px-3.5',
                                isActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-white/50 hover:bg-white/6 hover:text-white/90',
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={18} strokeWidth={2} className="shrink-0" />
                                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                                {!collapsed && (
                                    <span
                                        className={clsx(
                                            'size-1.5 rounded-full transition-opacity duration-200',
                                            isActive ? 'bg-accent-secondary opacity-100' : 'opacity-0',
                                        )}
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="space-y-1 border-t border-white/8 pt-3">
                <button
                    onClick={onToggle}
                    title={collapsed ? 'Expand menu' : 'Collapse menu'}
                    className={clsx(
                        'flex items-center rounded-[14px] text-[13.5px] font-semibold text-white/45 hover:bg-white/6 hover:text-white/85 transition-colors duration-200',
                        collapsed ? 'justify-center size-11 mx-auto' : 'gap-3 h-11 w-full px-3.5',
                    )}
                >
                    {collapsed ? (
                        <PanelLeftOpen size={18} strokeWidth={2} />
                    ) : (
                        <PanelLeftClose size={18} strokeWidth={2} />
                    )}
                    {!collapsed && <span>Collapse</span>}
                </button>
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    title="Log out"
                    className={clsx(
                        'flex items-center rounded-[14px] text-[13.5px] font-semibold text-[#ff8d85] hover:bg-[#ff453a]/10 transition-colors duration-200 disabled:opacity-50',
                        collapsed ? 'justify-center size-11 mx-auto' : 'gap-3 h-11 w-full px-3.5',
                    )}
                >
                    {isLoggingOut ? (
                        <Loader2 size={18} className="animate-spin shrink-0" />
                    ) : (
                        <LogOut size={18} strokeWidth={2} className="shrink-0" />
                    )}
                    {!collapsed && <span>Log out</span>}
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
