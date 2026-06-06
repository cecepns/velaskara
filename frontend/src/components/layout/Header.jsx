import React from 'react';
import { Menu, User } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export default function Header({ toggleSidebar, user }) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center space-x-2 lg:hidden">
          <div className="flex items-center justify-center">
            <img src={logoImg} alt="Velaskara Logo" className="w-24 h-auto object-contain" />
          </div>
        </div>
        <h2 className="hidden lg:block font-semibold text-xl text-gray-800 font-display">
          Operational Excellence & Assessment
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        {user?.role === 'manager' && user?.outlet_id && (
          <span className="bg-coffee-100 text-coffee-800 text-xs px-3 py-1 rounded-full font-medium">
            Velaskara Outlet Manager
          </span>
        )}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-coffee-100 text-coffee-800 flex items-center justify-center font-semibold text-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
          </div>
          <span className="hidden md:block text-sm font-medium text-gray-700">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
