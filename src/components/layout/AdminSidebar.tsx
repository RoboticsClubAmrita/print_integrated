import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MapPin, ShoppingCart, Users, IndianRupee, LogOut, Loader2, ShieldOff, Settings } from 'lucide-react';
import { authService } from '../../services/api';
import ThemeToggle from '../ThemeToggle';

const NAV_ITEMS = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/orders', label: 'Orders', icon: ShoppingCart },
    { path: '/users', label: 'Users', icon: Users },
    { path: '/locations', label: 'Hardware', icon: MapPin },
    { path: '/pricing', label: 'Pricing', icon: IndianRupee },
    { path: '/penalties', label: 'Penalties', icon: ShieldOff },
    { path: '/config', label: 'Business Rules', icon: Settings },
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
        try { await authService.logout(); } catch (e) { console.error(e); } finally {
            setIsLoggingOut(false);
            navigate('/login');
        }
    };

    return (
        <aside
            className={`fixed left-0 top-0 h-screen flex flex-col py-6 z-50 bg-transparent transition-all duration-300 ${
                collapsed ? 'w-[84px]' : 'w-[260px]'
            }`}
        >
            {/* Brand / toggle — clicking the "P" tile collapses or expands the nav */}
            <div className={`mb-8 ${collapsed ? 'px-0 flex justify-center' : 'px-5'}`}>
                <button
                    onClick={onToggle}
                    title={collapsed ? 'Expand menu' : 'Collapse menu'}
                    className="flex items-center gap-3 focus:outline-none"
                >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] shadow-lg shadow-[#0ea5e9]/20">
                        <span className="text-white font-bold text-lg font-heading">P</span>
                    </div>
                    {!collapsed && (
                        <div className="text-left">
                            <p className="text-sm font-semibold leading-tight text-text font-heading">PrintPost</p>
                            <p className="text-[11px] text-text-muted">Admin Console</p>
                        </div>
                    )}
                </button>
            </div>

            <nav className={`flex-1 w-full space-y-1.5 ${collapsed ? 'px-2' : 'px-3'}`}>
                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        title={item.label}
                        className={({ isActive }) =>
                            `flex items-center rounded-xl text-sm font-medium transition-all duration-300 backdrop-blur-md border shadow-lg shadow-black/20 ${
                                collapsed ? 'justify-center w-11 h-11 mx-auto' : 'gap-3 px-3 py-2.5'
                            } ${
                                isActive
                                    ? 'bg-[#0ea5e9]/25 text-white border-[#38bdf8]/40'
                                    : 'bg-white/10 dark:bg-white/[0.07] text-text-secondary border-white/10 hover:bg-white/20 hover:text-text'
                            }`
                        }
                    >
                        <item.icon className="w-[18px] h-[18px] shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            <div className={`${collapsed ? 'px-2' : 'px-3'} space-y-2`}>
                <div className={`flex items-center gap-2 ${collapsed ? 'flex-col' : 'justify-between px-1'}`}>
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        title="Logout"
                        className={`flex items-center rounded-xl text-sm font-medium backdrop-blur-md bg-red-500/15 border border-red-500/30 text-red-400 shadow-lg shadow-black/20 hover:bg-red-500/25 hover:text-red-300 transition-all duration-300 ${
                            collapsed ? 'justify-center w-11 h-11' : 'gap-3 px-3 py-2.5'
                        }`}
                    >
                        {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> : <LogOut className="w-5 h-5 shrink-0" />}
                        {!collapsed && <span>Logout</span>}
                    </button>
                    <ThemeToggle />
                </div>
            </div>
        </aside>
    );
};

export default AdminSidebar;
