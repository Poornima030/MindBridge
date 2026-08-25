import React, { useState } from 'react';
import {
  Heart,
  MessageCircleHeart,
  Smile,
  BookOpen,
  BarChart3,
  Sparkles,
  User,
  LogOut,
  Menu,
  X,
  PhoneCall,
  Wind,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCrisisModal: () => void;
  onOpenBreathingModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCrisisModal,
  onOpenBreathingModal,
}) => {
  const { userProfile, currentUser, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Heart },
    { id: 'chat', label: 'AI Companion', icon: MessageCircleHeart },
    { id: 'mood', label: 'Mood Log', icon: Smile },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'recommendations', label: 'Wellness Tools', icon: Sparkles },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            id="brand-logo-btn"
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <span className="text-lg font-extrabold bg-gradient-to-r from-emerald-800 to-teal-700 dark:from-emerald-300 dark:to-teal-200 bg-clip-text text-transparent tracking-tight">
                MindBridge
              </span>
              <span className="block text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider -mt-1">
                AI Wellness Bento
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#F8FAF9] dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Actions & User Menu */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              id="quick-breathe-btn"
              onClick={onOpenBreathingModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 rounded-xl border border-teal-200/60 dark:border-teal-800/50 transition-colors"
              title="Quick Mindful Breathing"
            >
              <Wind className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Breathe</span>
            </button>

            <button
              id="quick-crisis-btn"
              onClick={onOpenCrisisModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200/60 dark:border-rose-800/50 transition-colors"
              title="Helpline & Crisis Support"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>988 Help</span>
            </button>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

            <div className="flex items-center gap-2">
              <button
                id="user-profile-shortcut"
                onClick={() => handleNavClick('profile')}
                className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left border border-transparent hover:border-slate-200/60"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-extrabold text-xs">
                  {userProfile?.name?.charAt(0).toUpperCase() ||
                    currentUser?.email?.charAt(0).toUpperCase() ||
                    'M'}
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[90px] truncate hidden md:inline">
                  {userProfile?.name || 'Friend'}
                </span>
              </button>

              <button
                id="logout-btn"
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              id="mobile-quick-crisis-btn"
              onClick={onOpenCrisisModal}
              className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200/60 text-xs font-semibold"
            >
              <PhoneCall className="w-4 h-4" />
            </button>
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-1 shadow-xl animate-in slide-in-from-top duration-150"
        >
          <div className="px-3 py-2 mb-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold text-xs">
                {userProfile?.name?.charAt(0).toUpperCase() || 'M'}
              </div>
              <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                {userProfile?.name || 'Friend'}
              </div>
            </div>
            <button
              onClick={onOpenBreathingModal}
              className="flex items-center gap-1 text-xs px-2.5 py-1 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 rounded-lg"
            >
              <Wind className="w-3 h-3" /> Breathe
            </button>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={onOpenCrisisModal}
              className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 p-2"
            >
              <PhoneCall className="w-4 h-4" /> 24/7 Crisis Support
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 p-2 font-medium"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
