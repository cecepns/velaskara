import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardCheck,
  Settings,
  Store,
  Users,
  LogOut,
  X
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { useLanguage } from '../../context/LanguageContext';

export default function Sidebar({ isOpen, toggleSidebar, user, onLogout }) {
  const { t } = useLanguage();
  const location = useLocation();
  const role = user?.role;

  const menuItems = [
    {
      name: t('sidebar.dashboard'),
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'auditor']
    },
    {
      name: t('sidebar.audits'),
      path: '/audits',
      icon: ClipboardCheck,
      roles: ['admin', 'auditor', 'manager']
    },
    {
      name: t('sidebar.criteria'),
      path: '/criteria',
      icon: Settings,
      roles: ['admin']
    },
    {
      name: t('sidebar.outlets'),
      path: '/outlets',
      icon: Store,
      roles: ['admin']
    },
    {
      name: t('sidebar.users'),
      path: '/users',
      icon: Users,
      roles: ['admin']
    }
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-coffee-900 text-white z-50 transform lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col justify-between ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div>
          {/* Logo Section */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-coffee-800">
            <Link to="/" className="flex items-center space-x-3">
              <div className="flex items-center justify-center">
                <img src={logoImg} alt="Velaskara Logo" className="w-24 h-auto object-contain" />
              </div>
            </Link>
            <button
              onClick={toggleSidebar}
              className="lg:hidden text-coffee-300 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Profile Info */}
          <div className="px-6 py-4 border-b border-coffee-800 bg-coffee-950 bg-opacity-40">
            <p className="text-sm text-coffee-300 font-medium">Logged in as</p>
            <p className="font-semibold truncate text-white">{user?.name}</p>
            <span className="inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-coffee-700 text-coffee-100">
              {role}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 px-4 space-y-1">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) toggleSidebar();
                  }}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-coffee-600 text-white font-medium shadow-md shadow-coffee-950/20'
                    : 'text-coffee-300 hover:bg-coffee-800 hover:text-white'
                    }`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Area with Logout */}
        <div className="p-4 border-t border-coffee-800">
          <button
            onClick={onLogout}
            className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-xl bg-red-950/40 text-red-300 border border-red-900/30 hover:bg-red-900 hover:text-white transition-all duration-200"
          >
            <LogOut size={16} />
            <span>{t('sidebar.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
