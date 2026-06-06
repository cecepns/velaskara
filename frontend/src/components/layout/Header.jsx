import React from 'react';
import { Menu, User, Languages } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { useLanguage } from '../../context/LanguageContext';

export default function Header({ toggleSidebar, user }) {
  const { lang, toggleLanguage, t } = useLanguage();

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
        <h2 className="hidden lg:block font-semibold text-lg text-gray-800 font-display">
          {t('header.title')}
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-750 transition-all cursor-pointer shadow-sm select-none"
          title="Switch Language"
        >
          <Languages size={14} className="text-gray-500" />
          <span className={lang === 'id' ? 'text-coffee-800 font-extrabold' : 'text-gray-400 font-normal'}>ID</span>
          <span className="text-gray-300">/</span>
          <span className={lang === 'en' ? 'text-coffee-800 font-extrabold' : 'text-gray-400 font-normal'}>EN</span>
        </button>

        {user?.role === 'manager' && user?.outlet_id && (
          <span className="bg-coffee-100 text-coffee-800 text-xs px-3 py-1 rounded-full font-medium">
            {t('header.manager_tag')}
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
