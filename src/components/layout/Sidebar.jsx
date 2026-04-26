import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Stethoscope,
    Newspaper,
    History,
    Activity,
    LogOut,
    User,
    Brain
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const navItems = [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['patient', 'expert'] },
        { label: 'Diagnosa', path: '/diagnosa', icon: Stethoscope, roles: ['patient'] },
        { label: 'Riwayat', path: '/riwayat', icon: History, roles: ['patient', 'expert'] },
        { label: 'Risiko Pernapasan', path: '/fuzzy-assessment', icon: Brain, roles: ['patient'] },
        { label: 'Berita Medis', path: '/news', icon: Newspaper, roles: ['patient', 'expert'] },
        { label: 'Profil Saya', path: '/profile', icon: User, roles: ['patient'] },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="w-[260px] bg-white border-r border-slate-200 fixed h-full z-20 hidden md:flex flex-col shadow-sm">
            {/* Header */}
            <div className="h-16 flex items-center px-6 border-b border-slate-100 bg-white">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-sm shadow-blue-200">
                    <Activity className="text-white w-5 h-5" />
                </div>
                <div>
                    <span className="text-xl font-bold text-slate-800 tracking-tight block leading-none">RESPIRA.ID</span>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Expert System</span>
                </div>
            </div>

            {/* User Profile Snippet */}
            <div className="px-6 py-6 pb-2">
                <div className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm mr-3">
                        <User className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Pengguna'}</p>
                        <p className="text-xs text-slate-500 truncate">Pasien</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Menu Utama
                </div>
                {navItems.filter(item => {
                    if (!user) return false;
                    return item.roles.includes(user.role);
                }).map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                            )}
                        >
                            <item.icon className={clsx(
                                "w-5 h-5 mr-3 transition-colors",
                                isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                            )} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-100 border border-transparent transition-all"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    Keluar Sistem
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
