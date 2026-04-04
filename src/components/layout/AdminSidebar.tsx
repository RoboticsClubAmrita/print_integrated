import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MapPin, ShoppingCart, Users, IndianRupee, Upload, LogOut, Loader2 } from 'lucide-react';
import { authService } from '../../services/api';

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
        <aside className="fixed left-0 top-0 h-screen w-[72px] hover:w-[220px] bg-surface/90 backdrop-blur-xl border-r border-white/5 flex flex-col items-center py-6 z-50 transition-all duration-300 group overflow-hidden">
            {/* Logo */}
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-8 shrink-0">
                <span className="text-white font-bold text-lg">P</span>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 w-full space-y-1 px-3">
                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                                isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-text-muted hover:text-white hover:bg-white/5'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-3 px-3 py-2.5 mx-3 rounded-xl text-sm font-medium text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all w-full whitespace-nowrap"
            >
                {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> : <LogOut className="w-5 h-5 shrink-0" />}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">Logout</span>
            </button>
        </aside>
    );
};

export default AdminSidebar;
