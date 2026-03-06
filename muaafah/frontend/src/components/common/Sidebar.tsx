import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FlaskConical, Calendar, Stethoscope,
  Shield, User, LogOut, Settings, Users, BarChart3,
  ClipboardList, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import clsx from 'clsx';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const patientNav: NavItem[] = [
    { label: t('nav.dashboard'), icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { label: t('nav.labReports'), icon: <FlaskConical size={20} />, path: '/labs' },
    { label: t('nav.appointments'), icon: <Calendar size={20} />, path: '/appointments' },
    { label: t('nav.providers'), icon: <Stethoscope size={20} />, path: '/providers' },
    { label: t('nav.insurance'), icon: <Shield size={20} />, path: '/insurance' },
    { label: t('nav.profile'), icon: <User size={20} />, path: '/profile' },
  ];

  const adminNav: NavItem[] = [
    { label: t('portal.admin.dashboard'), icon: <LayoutDashboard size={20} />, path: '/admin' },
    { label: t('nav.users'), icon: <Users size={20} />, path: '/admin/users' },
    { label: t('nav.analytics'), icon: <BarChart3 size={20} />, path: '/admin/analytics' },
    { label: t('nav.clinicalRules'), icon: <ClipboardList size={20} />, path: '/admin/clinical-rules' },
  ];

  const providerNav: NavItem[] = [
    { label: t('portal.provider.dashboard'), icon: <LayoutDashboard size={20} />, path: '/provider' },
    { label: t('portal.provider.referrals'), icon: <ClipboardList size={20} />, path: '/provider/referrals' },
    { label: t('portal.provider.slots'), icon: <Calendar size={20} />, path: '/provider/slots' },
    { label: t('portal.provider.analytics'), icon: <BarChart3 size={20} />, path: '/provider/analytics' },
  ];

  const getNavItems = () => {
    switch (user?.role) {
      case 'system_admin': return adminNav;
      case 'provider_admin': return providerNav;
      default: return patientNav;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={clsx(
      'w-64 bg-white border-gray-100 flex flex-col shadow-sm',
      isRTL ? 'border-l' : 'border-r'
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">م</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-none">
              {t('app.name')}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">{t('app.tagline')}</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {getNavItems().map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive
                ? 'bg-primary-50 text-primary-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            <ChevronRight size={14} className={clsx(
              'text-gray-400',
              isRTL ? 'rotate-180' : ''
            )} />
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm">
            {user?.full_name_en?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name_en}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut size={18} />
          {t('nav.logout')}
        </button>
      </div>
    </aside>
  );
}
