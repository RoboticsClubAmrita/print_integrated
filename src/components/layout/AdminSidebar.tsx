import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MapPin, ShoppingCart, Users, IndianRupee, Upload, LogOut, Loader2 } from 'lucide-react';
import { authService } from '../../services/api';
import ThemeToggle from '../ThemeToggle';

const NAV_ITEMS = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/orders', label: 'Orders', icon: ShoppingCart },
    { path: '/users', label: 'Users', icon: Users },
    { path: '/locations', label: 'Hardware', icon: MapPin },
    { path: '/pricing', label: 'Pricing', icon: IndianRupee },
    { path: '/upload', label: 'Upload', icon: Upload },
];

const AdminSidebar: React.FC = () => {
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
        <aside className="fixed left-0 top-0 h-screen w-[260px] flex flex-col py-6 z-50 border-r border-white/[0.06] bg-white/80 backdrop-blur-2xl dark:bg-[#0a0a0a]/80 dark:border-white/[0.04]">
            <div className="px-5 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] shadow-lg shadow-[#0ea5e9]/20">
                        <span className="text-white font-bold text-base font-heading">P</span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold leading-tight text-text font-heading">PrintPost</p>
                        <p className="text-[11px] text-text-muted">Admin Console</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 w-full space-y-1 px-3">
                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                                isActive
                                    ? 'bg-[#0ea5e9]/10 text-[#0ea5e9] dark:bg-[#0ea5e9]/10 dark:text-[#38bdf8] shadow-sm'
                                    : 'text-text-secondary hover:text-text hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                            }`
                        }
                    >
                        <item.icon className="w-[18px] h-[18px] shrink-0" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="px-3 space-y-2">
                <div className="h-px bg-black/[0.06] dark:bg-white/[0.06]" />
                <div className="flex items-center justify-between px-1">
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-red-500 hover:bg-red-500/5 transition-all duration-300"
                    >
                        {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> : <LogOut className="w-5 h-5 shrink-0" />}
                        <span>Logout</span>
                    </button>
                    <ThemeToggle />
                </div>
            </div>
        </aside>
    );
};

export default AdminSidebar;
